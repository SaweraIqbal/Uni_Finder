/**
 * registrationController.js
 *
 * Two-tier approval flow:
 *   Tier 1 — University Admin  →  approves/rejects/requests-resubmission via
 *             PATCH /api/campus-registrations/:id/tier1
 *   Tier 2 — Super Admin       →  can only *finally* approve after tier-1 is done.
 *             PATCH /api/campus-registrations/:id/status  (via adminController)
 *
 * Columns added to campus_registrations for tier-1 tracking:
 *   uni_tier1_approved     TINYINT(1) DEFAULT 0
 *   uni_tier1_approved_at  DATETIME NULL
 *   uni_tier1_approved_by  VARCHAR(255) NULL
 */
import db, { createTransactionConnection } from "../../config/db.js";
import { sendEmail } from "../../utils/emailService.js";

const query = (sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const genPublicId = () => {
  let s = "CMP-";
  for (let i = 0; i < 6; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
};

const getUserInfo = async (userId) => {
  const rows = await query(
    "SELECT email, name FROM Student_signup WHERE id = ? LIMIT 1",
    [userId]
  ).catch(() => []);
  return rows[0] || { email: null, name: "Admin" };
};

const normalisePhone = (raw) => {
  if (!raw) return null;
  const s = raw.replace(/[\s\-()]/g, "");
  if (/^03\d{9}$/.test(s))    return "+92" + s.slice(1);
  if (/^\+923\d{9}$/.test(s)) return s;
  if (/^923\d{9}$/.test(s))   return "+" + s;
  return null;
};

const shapeRow = (reg) => {
  const safe = (v) => {
    if (!v) return null;
    if (typeof v === "object") return v;
    try { return JSON.parse(v); } catch { return null; }
  };
  return {
    ...reg,
    document: reg.document_originalName
      ? { originalName: reg.document_originalName,
          storedPath:   reg.document_storedPath,
          size:         reg.document_size }
      : null,
    rejection: reg.rejection_reason
      ? { reason:    reg.rejection_reason,
          note:      reg.rejection_note,
          decidedAt: reg.rejection_decidedAt,
          // 'university' | 'super_admin'. Old rows (no rejected_by): super admin
          // can only reject after tier-1 approval, so infer from that.
          by:        reg.rejected_by ||
                     (Number(reg.uni_tier1_approved) === 1 ? "super_admin" : "university") }
      : null,
    resubmission: reg.resubmission_requestedAt
      ? { requiredDocs: safe(reg.resubmission_requiredDocs) || [],
          note:         reg.resubmission_note,
          requestedAt:  reg.resubmission_requestedAt }
      : null,
    history: safe(reg.history) || [],
    // tier-1 summary for UI
    tier1: {
      approved: Number(reg.uni_tier1_approved) === 1,
      approvedAt: reg.uni_tier1_approved_at || null,
      approvedBy: reg.uni_tier1_approved_by || null,
    },
  };
};

// 1. GET /api/universities/approved   (public)
export const getApprovedUniversities = async (_req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, university_type AS sector, city
       FROM universities WHERE status = 'approved' ORDER BY name ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error("getApprovedUniversities:", e.message);
    res.status(500).json({ message: "Could not load universities." });
  }
};

// 2. POST /api/campus-registrations   (auth: campus role)
// ════════════════════════════════════════════════════════════════════════════

export const submitRegistration = async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  const {
    universityId,
    campusType,
    officialName,
    province,
    city,
    address,
    registrantName,
    designation,
    phone,
    officialEmail,
    declarationAccepted,
  } = req.body;

  const errors = {};
  const CAMPUS_TYPES = [
    "Main Campus",
    "Sub Campus",
    "Regional Campus",
    "City Campus",
  ];
  const DESIGNATIONS = [
    "Campus Coordinator",
    "Registrar",
    "Deputy Registrar",
    "Director",
    "Other",
  ];

  if (!universityId) errors.universityId = "Please select a university.";
  if (!CAMPUS_TYPES.includes(campusType))
    errors.campusType = "Invalid campus type.";
  if (!officialName?.trim() || officialName.trim().length < 3)
    errors.officialName = "Must be at least 3 characters.";
  if (!province) errors.province = "Province is required.";
  if (!city?.trim()) errors.city = "City is required.";
  if (!registrantName?.trim() || registrantName.trim().length < 3)
    errors.registrantName = "Must be at least 3 characters.";
  if (!DESIGNATIONS.includes(designation))
    errors.designation = "Please select a valid designation.";

  const canonPhone = normalisePhone(phone);
  if (!canonPhone) errors.phone = "Enter a valid contact number.";

  if (
    officialEmail?.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail.trim())
  ) {
    errors.officialEmail = "Enter a valid email address.";
  }

  if (declarationAccepted !== "true" && declarationAccepted !== true) {
    errors.declarationAccepted = "You must accept the declaration.";
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({ errors });
  }

  let connection;

  try {
    connection = createTransactionConnection().promise();

    await connection.connect();
    await connection.beginTransaction();

    const [unis] = await connection.query(
      "SELECT id FROM universities WHERE id = ? AND status = 'approved'",
      [universityId]
    );

    if (!unis.length) {
      await connection.rollback();
      return res.status(400).json({
        errors: { universityId: "Invalid or unapproved university." },
      });
    }

    const [dupes] = await connection.query(
      `SELECT id FROM campus_registrations
       WHERE universityId = ?
       AND LOWER(TRIM(officialName)) = LOWER(TRIM(?))
       AND status IN ('pending', 'approved', 'resubmission_requested')`,
      [universityId, officialName.trim()]
    );

    if (dupes.length) {
      await connection.rollback();
      return res.status(409).json({
        message: "A campus registration with this name already exists.",
      });
    }

    const registrationId =
      `cr_${Date.now()}${Math.floor(Math.random() * 10000)}`;

    const publicId = genPublicId();

    const history = JSON.stringify([
      {
        status: "pending",
        note: "Initial submission",
        at: new Date(),
      },
    ]);

    const campusDocument = req.file || null;

    await connection.query(
      `INSERT INTO campus_registrations
       (
         id, publicId, registrantUserId, registrantEmail,
         universityId, campusType, officialName, province,
         city, address, registrantName, designation,
         phone, officialEmail, document_originalName,
         document_storedPath, document_size,
         declarationAccepted, status, history, submittedAt
       )
       VALUES (
         ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'pending',?,NOW()
       )`,
      [
        registrationId,
        publicId,
        userId,
        userEmail,
        universityId,
        campusType,
        officialName.trim(),
        province,
        city.trim(),
        (address || "").trim(),
        registrantName.trim(),
        designation,
        canonPhone,
        officialEmail?.trim() || null,
        campusDocument?.originalname || null,
        campusDocument?.path || null,
        campusDocument?.size || null,
        history,
      ]
    );

    await connection.commit();

    const userInfo = await getUserInfo(userId);
    if (userInfo.email) {
      sendEmail({
        to: userInfo.email,
        subject: `Campus Registration Submitted (${publicId})`,
        text:
          `Hello ${userInfo.name || "Campus Admin"},\n\n` +
          `Your campus registration for "${officialName.trim()}" has been submitted successfully.\n` +
          `Reference ID: ${publicId}\n\n` +
          `Your application will be reviewed first by the university admin, then by the Super Admin.\n` +
          `You will be notified at each stage of the review.\n\n` +
          `Regards,\nUni Finder Team`,
        html:
          `<p>Hello ${userInfo.name || "Campus Admin"},</p>` +
          `<p>Your campus registration for <strong>"${officialName.trim()}"</strong> has been submitted successfully.</p>` +
          `<p>Reference ID: <strong>${publicId}</strong></p>` +
          `<p>Your application will be reviewed first by the university admin, then by the Super Admin. You will be notified at each stage of the review.</p>` +
          `<p>Regards,<br>Uni Finder Team</p>`,
      }).catch((e) => console.error("Campus registration submit email failed (non-fatal):", e.message));
    }

    return res.status(201).json({
      message: "Campus registration submitted successfully.",
      data: {
        publicId,
        registrationId,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError.message);
      }
    }

    console.error("submitRegistration error:", error);

    return res.status(500).json({
      message: "Could not submit campus registration.",
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (endError) {
        console.error("Connection close error:", endError.message);
      }
    }
  }
};


// ════════════════════════════════════════════════════════════════════════════
// 3. GET /api/campus-registrations/mine   (auth: campus role)
export const getMyRegistration = async (req, res) => {
  const userId = req.user.id;
  try {
    const rows = await query(
      `SELECT cr.*, u.name AS universityName, u.city AS universityCity,
              u.university_type AS universitySector
       FROM campus_registrations cr
       LEFT JOIN universities u ON cr.universityId = u.id
       WHERE cr.registrantUserId = ?
       ORDER BY cr.submittedAt DESC LIMIT 1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ data: null });
    res.json({ data: shapeRow(rows[0]) });
  } catch (e) {
    console.error("getMyRegistration:", e.message);
    res.status(500).json({ message: "Could not load registration." });
  }
};

// 4. POST /api/campus-registrations/:id/resubmit   (auth: campus, owner only)
export const resubmitRegistration = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const rows = await query(
    "SELECT * FROM campus_registrations WHERE id = ? AND registrantUserId = ?",
    [id, userId]
  ).catch(() => []);

  if (!rows.length) return res.status(404).json({ message: "Registration not found." });
  const reg = rows[0];

  if (!["rejected", "resubmission_requested"].includes(reg.status)) {
    return res.status(400).json({ message: `Cannot resubmit from status '${reg.status}'.` });
  }

  const {
    campusType, officialName, province, city, address,
    registrantName, designation, phone, officialEmail, declarationAccepted,
  } = req.body;

  const errors = {};
  const CAMPUS_TYPES = ["Main Campus","Sub Campus","Regional Campus","City Campus"];
  const DESIGNATIONS = ["Campus Coordinator","Registrar","Deputy Registrar","Director","Other"];

  if (!CAMPUS_TYPES.includes(campusType))                  errors.campusType     = "Invalid campus type.";
  if (!officialName || officialName.trim().length < 3)     errors.officialName   = "Must be at least 3 characters.";
  if (!province)                                           errors.province       = "Province is required.";
  if (!city || !city.trim())                               errors.city           = "City is required.";
  if (!registrantName || registrantName.trim().length < 3) errors.registrantName = "Must be at least 3 characters.";
  if (!DESIGNATIONS.includes(designation))                 errors.designation    = "Please select a valid designation.";

  const canonPhone = normalisePhone(phone);
  if (!phone || !phone.trim())  errors.phone = "Contact number is required.";
  else if (!canonPhone)         errors.phone = "Enter a valid number: 03XXXXXXXXX or +92 3XX XXXXXXX";
  if (officialEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail.trim()))
    errors.officialEmail = "Enter a valid email address.";
  if (declarationAccepted !== "true" && declarationAccepted !== true)
    errors.declarationAccepted = "You must accept the declaration.";

  if (Object.keys(errors).length) return res.status(400).json({ errors });

  let history = [];
  try { history = JSON.parse(reg.history || "[]"); } catch { /* empty */ }
  history.push({ status: "pending", note: "Resubmitted", at: new Date() });

  const params = [
    campusType, officialName.trim(), province, city.trim(),
    (address || "").trim(), registrantName.trim(), designation,
    canonPhone, officialEmail?.trim() || null,
    JSON.stringify(history),
  ];

  let docClause = "";
  if (req.file) {
    docClause = ", document_originalName=?, document_storedPath=?, document_size=?";
    params.push(req.file.originalname, req.file.path, req.file.size);
  }
  params.push(id);

  await query(
    `UPDATE campus_registrations SET
       campusType=?, officialName=?, province=?, city=?, address=?,
       registrantName=?, designation=?, phone=?, officialEmail=?,
       status='pending',
       rejection_reason=NULL, rejection_note=NULL, rejection_decidedAt=NULL, rejected_by=NULL,
       resubmission_requiredDocs=NULL, resubmission_note=NULL, resubmission_requestedAt=NULL,
       uni_tier1_approved=0, uni_tier1_approved_at=NULL, uni_tier1_approved_by=NULL,
       history=?
       ${docClause}
     WHERE id=?`,
    params
  );

  const resubmitInfo = await getUserInfo(userId);
  if (resubmitInfo.email) {
    sendEmail({
      to: resubmitInfo.email,
      subject: `Campus Registration Resubmitted (${reg.publicId})`,
      text:
        `Hello ${resubmitInfo.name || "Campus Admin"},\n\n` +
        `Your campus registration for "${officialName.trim()}" has been resubmitted and is back in the review queue.\n\n` +
        `Regards,\nUni Finder Team`,
      html:
        `<p>Hello ${resubmitInfo.name || "Campus Admin"},</p>` +
        `<p>Your campus registration for <strong>"${officialName.trim()}"</strong> has been resubmitted and is back in the review queue.</p>` +
        `<p>Regards,<br>Uni Finder Team</p>`,
    }).catch((e) => console.error("Resubmit email failed (non-fatal):", e.message));
  }

  res.json({ data: { publicId: reg.publicId } });
};

// 5. GET /api/campus-registrations   (auth: university role — tier-1 reviewer)
//    Returns all registrations addressed to this university admin's university.
//    query: ?status=  ?q=  ?page=  ?limit=
export const getUniversityCampusRegistrations = async (req, res) => {
  // University ID comes from the JWT claim set by verifyToken middleware
  const universityId = req.user?.university_id;
  if (!universityId) {
    return res.status(403).json({ message: "No university linked to this account." });
  }

  try {
    const statusFilter = req.query.status || "";
    const search       = (req.query.q || "").trim();
    const page         = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit        = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const offset       = (page - 1) * limit;

    const where  = ["cr.universityId = ?"];
    const values = [universityId];

    if (statusFilter) { where.push("cr.status = ?"); values.push(statusFilter); }
    if (search) {
      where.push("(cr.officialName LIKE ? OR cr.city LIKE ? OR cr.publicId LIKE ? OR cr.registrantName LIKE ?)");
      const like = `%${search}%`;
      values.push(like, like, like, like);
    }

    const clause = `WHERE ${where.join(" AND ")}`;

    const [rows, countRows, statsRows] = await Promise.all([
      query(
        `SELECT cr.*,
                u.name  AS universityName,
                u.city  AS universityCity
         FROM campus_registrations cr
         LEFT JOIN universities u ON u.id = cr.universityId
         ${clause}
         ORDER BY cr.submittedAt DESC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM campus_registrations cr ${clause}`, values),
      query(
        `SELECT
           SUM(CASE WHEN cr.status='pending'               THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN cr.status='approved'              THEN 1 ELSE 0 END) AS approved,
           SUM(CASE WHEN cr.status='rejected'              THEN 1 ELSE 0 END) AS rejected,
           SUM(CASE WHEN cr.status='resubmission_requested' THEN 1 ELSE 0 END) AS resubmission,
           COUNT(*) AS total,
           SUM(CASE WHEN cr.uni_tier1_approved=1           THEN 1 ELSE 0 END) AS tier1_approved
         FROM campus_registrations cr
         WHERE cr.universityId = ?`,
        [universityId]
      ),
    ]);

    const safe = (v) => {
      if (!v) return null;
      if (typeof v === "object") return v;
      try { return JSON.parse(v); } catch { return null; }
    };

    const formatted = rows.map((r) => ({
      ...shapeRow(r),
    }));

    const s = statsRows[0] || {};
    return res.json({
      total:         Number(countRows[0].total),
      page, limit,
      pages:         Math.ceil(Number(countRows[0].total) / limit),
      registrations: formatted,
      stats: {
        pending:       Number(s.pending      || 0),
        approved:      Number(s.approved     || 0),
        rejected:      Number(s.rejected     || 0),
        resubmission:  Number(s.resubmission || 0),
        total:         Number(s.total        || 0),
        tier1_approved: Number(s.tier1_approved || 0),
      },
    });
  } catch (e) {
    console.error("getUniversityCampusRegistrations:", e.message);
    res.status(500).json({ message: "Could not load campus registrations." });
  }
};

// 6. PATCH /api/campus-registrations/:id/tier1   (auth: university role — tier-1)
//    University admin's tier-1 review: approve / reject / request_resubmission.
//    Must only act on registrations belonging to their university.
//    On tier-1 approve: sets uni_tier1_approved=1 but does NOT change status
//    (stays 'pending' — final 'approved' only from super admin).
export const uniUpdateRegistrationStatus = async (req, res) => {
  const universityId = req.user?.university_id;
  if (!universityId) {
    return res.status(403).json({ message: "No university linked to this account." });
  }

  const { id } = req.params;
  const { action, reason, note, requiredDocs } = req.body;
  const reviewerEmail = req.user?.email || "University Admin";
  const reviewerId    = req.user?.id    || null;

  const rows = await query(
    "SELECT * FROM campus_registrations WHERE id = ? AND universityId = ?",
    [id, universityId]
  ).catch(() => []);

  if (!rows.length) {
    return res.status(404).json({ message: "Registration not found for your university." });
  }
  const reg = rows[0];

  let history = [];
  try { history = JSON.parse(reg.history || "[]"); } catch { /* empty */ }

  if (action === "approve") {
    // Tier-1 approve: mark that university admin has reviewed and approved.
    // Status stays 'pending' until super admin gives final approval.
    history.push({ status: "tier1_approved", note: note || null, by: reviewerEmail, at: new Date() });
    await query(
      `UPDATE campus_registrations
       SET uni_tier1_approved=1, uni_tier1_approved_at=NOW(), uni_tier1_approved_by=?,
           history=?, updatedAt=NOW()
       WHERE id=?`,
      [reviewerId, JSON.stringify(history), id]
    );
    // Notify campus admin
    const info = await getUserInfo(reg.registrantUserId);
    if (info.email) {
      sendEmail({
        to: info.email,
        subject: `Campus Application — University Admin Approved (${reg.publicId})`,
        text:
          `Hello ${info.name || "Campus Admin"},\n\n` +
          `Your campus application for "${reg.officialName}" has been approved by the university admin.\n` +
          `It is now awaiting final approval from the Super Admin.\n\n` +
          `Regards,\nUni Finder Team`,
        html:
          `<p>Hello ${info.name || "Campus Admin"},</p>` +
          `<p>Your campus application for <strong>"${reg.officialName}"</strong> has been approved by the university admin.</p>` +
          `<p>It is now awaiting final approval from the Super Admin.</p>` +
          `<p>Regards,<br>Uni Finder Team</p>`,
      }).catch((e) => console.error("Tier-1 approve email failed (non-fatal):", e.message));
    }
    return res.json({ message: "Tier-1 approval recorded. Awaiting Super Admin final approval." });

  } else if (action === "reject") {
    if (!reason || !reason.trim())
      return res.status(400).json({ errors: { reason: "Rejection reason is required." } });
    history.push({ status: "rejected", note: reason + (note ? `: ${note}` : ""), by: reviewerEmail, at: new Date() });
    await query(
      `UPDATE campus_registrations
       SET status='rejected', rejection_reason=?, rejection_note=?,
           rejection_decidedAt=NOW(), rejected_by='university', uni_tier1_approved=0,
           history=?, updatedAt=NOW()
       WHERE id=?`,
      [reason.trim(), note?.trim() || null, JSON.stringify(history), id]
    );
    // Notify campus admin
    const info = await getUserInfo(reg.registrantUserId);
    if (info.email) {
      sendEmail({
        to: info.email,
        subject: `Campus Application Rejected by University (${reg.publicId})`,
        text:
          `Hello ${info.name || "Campus Admin"},\n\n` +
          `Your campus application for "${reg.officialName}" was not approved by the university admin.\n\n` +
          `Reason: ${reason.trim()}${note ? `\nNote: ${note.trim()}` : ""}\n\n` +
          `Please review the feedback and submit a new application when ready.\n\n` +
          `Regards,\nUni Finder Team`,
        html:
          `<p>Hello ${info.name || "Campus Admin"},</p>` +
          `<p>Your campus application for <strong>"${reg.officialName}"</strong> was not approved by the university admin.</p>` +
          `<p><strong>Reason:</strong> ${reason.trim()}${note ? `<br><strong>Note:</strong> ${note.trim()}` : ""}</p>` +
          `<p>Please review the feedback and submit a new application when ready.</p>` +
          `<p>Regards,<br>Uni Finder Team</p>`,
      }).catch((e) => console.error("Tier-1 reject email failed (non-fatal):", e.message));
    }
    return res.json({ message: "Campus registration rejected." });

  } else if (action === "request_resubmission") {
    const docs = Array.isArray(requiredDocs) ? requiredDocs.filter(Boolean) : [];
    if (!docs.length)
      return res.status(400).json({ errors: { requiredDocs: "requiredDocs array is required." } });
    history.push({ status: "resubmission_requested", note: note || null, by: reviewerEmail, at: new Date() });
    await query(
      `UPDATE campus_registrations
       SET status='resubmission_requested',
           resubmission_requiredDocs=?, resubmission_note=?, resubmission_requestedAt=NOW(),
           uni_tier1_approved=0, rejection_reason=NULL, rejection_note=NULL, rejection_decidedAt=NULL,
           history=?, updatedAt=NOW()
       WHERE id=?`,
      [JSON.stringify(docs), note?.trim() || null, JSON.stringify(history), id]
    );
    // Notify campus admin
    const info = await getUserInfo(reg.registrantUserId);
    if (info.email) {
      const docList = docs.map((d) => `• ${d}`).join("\n");
      sendEmail({
        to: info.email,
        subject: `Resubmission Required — Campus Application (${reg.publicId})`,
        text:
          `Hello ${info.name || "Campus Admin"},\n\n` +
          `The university admin has requested that you resubmit your campus application for "${reg.officialName}".\n\n` +
          `Please provide the following:\n${docList}\n\n` +
          `${note ? `Additional note: ${note.trim()}\n\n` : ""}` +
          `You can resubmit your application from your dashboard.\n\n` +
          `Regards,\nUni Finder Team`,
        html:
          `<p>Hello ${info.name || "Campus Admin"},</p>` +
          `<p>The university admin has requested that you resubmit your campus application for <strong>"${reg.officialName}"</strong>.</p>` +
          `<p><strong>Please provide the following:</strong></p>` +
          `<ul>${docs.map((d) => `<li>${d}</li>`).join("")}</ul>` +
          `${note ? `<p><strong>Additional note:</strong> ${note.trim()}</p>` : ""}` +
          `<p>You can resubmit your application from your dashboard.</p>` +
          `<p>Regards,<br>Uni Finder Team</p>`,
      }).catch((e) => console.error("Tier-1 resubmission email failed (non-fatal):", e.message));
    }
    return res.json({ message: "Resubmission requested from campus admin." });

  } else {
    return res.status(400).json({ message: `Unknown action '${action}'.` });
  }
};

// 7. PATCH /api/campus-registrations/:id/status   (auth: super admin)
//    Final approval — only allowed when tier-1 (university) has already approved.
//    Kept for backward compat; adminController wraps this for the super-admin UI.
export const updateRegistrationStatus = async (req, res) => {
  const { id } = req.params;
  const { action, reason, note, requiredDocs } = req.body;

  const rows = await query(
    "SELECT * FROM campus_registrations WHERE id = ?", [id]
  ).catch(() => []);

  if (!rows.length) return res.status(404).json({ message: "Registration not found." });
  const reg = rows[0];

  let history = [];
  try { history = JSON.parse(reg.history || "[]"); } catch { /* empty */ }

  if (action === "approve") {
    // GATE: super admin can only finally approve if university already tier-1 approved
    if (!reg.uni_tier1_approved) {
      return res.status(422).json({
        message: "Cannot approve: University Admin has not yet reviewed and approved this registration.",
        code: "TIER1_NOT_APPROVED",
      });
    }

    history.push({ status: "approved", note: note || null, at: new Date() });
    await query(
      `UPDATE campus_registrations SET status='approved', history=?, updatedAt=NOW() WHERE id=?`,
      [JSON.stringify(history), id]
    );

    // Auto-create campus record
    try {
      const campusRows = await query(
        "SELECT id FROM campuses WHERE campus_admin_uid = ? LIMIT 1",
        [reg.registrantUserId]
      );
      if (!campusRows.length) {
        const { v4: uuidv4 } = await import("uuid");
        const cid = uuidv4();
        await query(
          `INSERT INTO campuses
             (id, university_id, campus_admin_uid, verification_id, name, campus_type,
              city, province, address, phone, email)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [
            cid, reg.universityId, reg.registrantUserId, reg.id,
            reg.officialName, reg.campusType, reg.city, reg.province,
            reg.address, reg.phone, reg.officialEmail || reg.registrantEmail,
          ]
        );
      }
    } catch (insertErr) {
      console.warn("Auto-insert campus record error (non-fatal):", insertErr.message);
    }

    // Notify campus admin of final approval
    const info = await getUserInfo(reg.registrantUserId);
    if (info.email) {
      sendEmail({
        to: info.email,
        subject: `Campus Registration Approved ✅ (${reg.publicId})`,
        text:
          `Dear ${info.name || "Campus Admin"},\n\n` +
          `Congratulations! Your campus "${reg.officialName}" has been fully approved.\n` +
          `You can now log in and start adding your campus details (history, programs, facilities, photos, hostels).\n\n` +
          `Sign in here: ${process.env.CLIENT_URL || "http://localhost:5173"}/login\n\n` +
          `Regards,\nUni Finder Team`,
        html:
          `<p>Dear ${info.name || "Campus Admin"},</p>` +
          `<p>Congratulations! Your campus <strong>"${reg.officialName}"</strong> has been fully approved.</p>` +
          `<p>You can now log in and start adding your campus details (history, programs, facilities, photos, hostels).</p>` +
          `<p><a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login">Sign in here</a></p>` +
          `<p>Regards,<br>Uni Finder Team</p>`,
      }).catch((e) => console.error("Final approval email failed (non-fatal):", e.message));
    }

  } else if (action === "reject") {
    if (!reason || !reason.trim())
      return res.status(400).json({ errors: { reason: "Rejection reason is required." } });
    history.push({ status: "rejected", note: reason + (note ? `: ${note}` : ""), at: new Date() });
    await query(
      `UPDATE campus_registrations
       SET status='rejected', rejection_reason=?, rejection_note=?, rejection_decidedAt=NOW(),
           rejected_by='super_admin', history=?
       WHERE id=?`,
      [reason.trim(), note?.trim() || null, JSON.stringify(history), id]
    );
    // Notify campus admin
    const info = await getUserInfo(reg.registrantUserId);
    if (info.email) {
      sendEmail({
        to: info.email,
        subject: `Campus Registration Rejected ❌ (${reg.publicId})`,
        text:
          `Dear ${info.name || "Campus Admin"},\n\n` +
          `Your campus registration for "${reg.officialName}" was not approved.\n\n` +
          `Reason: ${reason.trim()}${note ? `\nNote: ${note.trim()}` : ""}\n\n` +
          `Please review the feedback and submit a new application when ready.\n\n` +
          `Regards,\nUni Finder Team`,
        html:
          `<p>Dear ${info.name || "Campus Admin"},</p>` +
          `<p>Your campus registration for <strong>"${reg.officialName}"</strong> was not approved.</p>` +
          `<p><strong>Reason:</strong> ${reason.trim()}${note ? `<br><strong>Note:</strong> ${note.trim()}` : ""}</p>` +
          `<p>Please review the feedback and submit a new application when ready.</p>` +
          `<p>Regards,<br>Uni Finder Team</p>`,
      }).catch((e) => console.error("Final rejection email failed (non-fatal):", e.message));
    }

  } else if (action === "request_resubmission") {
    const docs = Array.isArray(requiredDocs) ? requiredDocs.filter(Boolean) : [];
    if (!docs.length)
      return res.status(400).json({ errors: { requiredDocs: "requiredDocs array is required." } });
    history.push({ status: "resubmission_requested", note: note || null, at: new Date() });
    await query(
      `UPDATE campus_registrations
       SET status='resubmission_requested', resubmission_requiredDocs=?,
           resubmission_note=?, resubmission_requestedAt=NOW(),
           uni_tier1_approved=0,
           history=?
       WHERE id=?`,
      [JSON.stringify(docs), note?.trim() || null, JSON.stringify(history), id]
    );
    // Notify campus admin
    const info = await getUserInfo(reg.registrantUserId);
    if (info.email) {
      const docList = docs.map((d) => `• ${d}`).join("\n");
      sendEmail({
        to: info.email,
        subject: `Resubmission Required — Campus Registration (${reg.publicId})`,
        text:
          `Dear ${info.name || "Campus Admin"},\n\n` +
          `The Super Admin has requested that you resubmit your campus registration for "${reg.officialName}".\n\n` +
          `Please provide the following:\n${docList}\n\n` +
          `${note ? `Additional note: ${note.trim()}\n\n` : ""}` +
          `You can resubmit from your dashboard.\n\n` +
          `Regards,\nUni Finder Team`,
        html:
          `<p>Dear ${info.name || "Campus Admin"},</p>` +
          `<p>The Super Admin has requested that you resubmit your campus registration for <strong>"${reg.officialName}"</strong>.</p>` +
          `<p><strong>Please provide the following:</strong></p>` +
          `<ul>${docs.map((d) => `<li>${d}</li>`).join("")}</ul>` +
          `${note ? `<p><strong>Additional note:</strong> ${note.trim()}</p>` : ""}` +
          `<p>You can resubmit from your dashboard.</p>` +
          `<p>Regards,<br>Uni Finder Team</p>`,
      }).catch((e) => console.error("Final resubmission email failed (non-fatal):", e.message));
    }

  } else {
    return res.status(400).json({ message: `Unknown action '${action}'.` });
  }

  res.json({ message: "Status updated." });
};


