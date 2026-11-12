import { v4 as uuidv4 } from "uuid";
import db from "../../../shared/db.js";
import { sendEmail } from "../../../shared/email/emailService.js";

const q = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const getUserInfo = async (userId) => {
  const rows = await q("SELECT email, name FROM Student_signup WHERE id = ? LIMIT 1", [userId]).catch(() => []);
  return rows[0] || { email: null, name: "Admin" };
};

const err400 = (res, msg) => res.status(400).json({ error: { code: "BAD_REQUEST",  message: msg } });
const err404 = (res, msg) => res.status(404).json({ error: { code: "NOT_FOUND",    message: msg } });
const err409 = (res, msg) => res.status(409).json({ error: { code: "CONFLICT",     message: msg } });
const err500 = (res, msg, e) => {

  if (process.env.NODE_ENV !== "production") {
    console.error(`[500] ${msg}`);
    if (e) console.error("  cause:", e.message, e.sqlMessage ? `| SQL: ${e.sqlMessage}` : "");
  }
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: msg } });
};

const logActivity = (universityId, actorUserId, actorName, action, description, entityType, entityId) => {
  q(
    `INSERT INTO activity_log
       (id, university_id, actor_user_id, actor_name, action, entity_type, entity_id, description)
     VALUES (?,?,?,?,?,?,?,?)`,
    [uuidv4(), universityId, actorUserId || null, actorName, action, entityType || null, entityId || null, description],
  ).catch((e) => console.error("[activity_log]", e.message));
};

export const adminListUniversities = async (req, res) => {
  try {
    const search        = (req.query.q              || "").trim();
    const type          = req.query.type            || null;
    const profileStatus = req.query.profile_status  || null;
    const scope         = req.query.scope           || "approved";
    const page          = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit         = Math.min(100, parseInt(req.query.limit, 10) || 25);
    const offset        = (page - 1) * limit;

    const where  = ["u.is_hec_listed = 1"];
    const values = [];

    if (scope !== "all") {
      where.push(
        "(u.owner_uid IS NOT NULL OR EXISTS (SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci AND LOWER(a.status) = 'approved'))"
      );
    }

    if (search) {
      where.push(
        "(u.name LIKE ? OR u.normalized_name LIKE ? OR s.name LIKE ? OR s.email LIKE ? OR EXISTS (SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci AND (a.reference_no LIKE ? OR a.email LIKE ? OR a.full_name LIKE ?)))"
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (type) {
      where.push("u.university_type = ?");
      values.push(type);
    }
    if (profileStatus === "completed") {
      where.push("(up.about_text IS NOT NULL AND LENGTH(TRIM(up.about_text)) > 0)");
    } else if (profileStatus === "incomplete") {
      where.push("(up.about_text IS NULL OR LENGTH(TRIM(up.about_text)) = 0)");
    }

    const clause = `WHERE ${where.join(" AND ")}`;

    const [countRows, rows, statsRows] = await Promise.all([
      q(
        `SELECT COUNT(*) AS total
         FROM universities u
         LEFT JOIN university_profiles up ON up.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
         LEFT JOIN Student_signup s ON s.id COLLATE utf8mb4_general_ci = u.owner_uid COLLATE utf8mb4_general_ci
         ${clause}`,
        values
      ),
      q(
        `SELECT
           u.id, u.name, u.hec_rank, u.university_type, u.oric_domain,
           u.campus_count, u.focal_person_name, u.focal_person_email,
           u.owner_uid, u.city, u.address,
           up.established_year,
           up.about_text,
           up.mission_statement,
           up.logo_path,
           up.banner_path,
           up.active_students,
           up.website_url,
           up.admissions_email,
           up.admissions_phone,
           up.updated_at AS profile_updated_at,
           s.name AS admin_name,
           s.email AS admin_email,
           (SELECT reference_no FROM applications a
            WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
              AND LOWER(a.status) = 'approved'
            ORDER BY a.created_at DESC LIMIT 1) AS application_reference,
           (SELECT created_at FROM applications a
            WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
              AND LOWER(a.status) = 'approved'
            ORDER BY a.created_at DESC LIMIT 1) AS application_created_at,
           (SELECT reviewed_at FROM applications a
            WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
              AND LOWER(a.status) = 'approved'
            ORDER BY a.created_at DESC LIMIT 1) AS application_approved_at,
           (SELECT full_name FROM applications a
            WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
              AND LOWER(a.status) = 'approved'
            ORDER BY a.created_at DESC LIMIT 1) AS applicant_name,
           (SELECT email FROM applications a
            WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
              AND LOWER(a.status) = 'approved'
            ORDER BY a.created_at DESC LIMIT 1) AS applicant_email,
           (SELECT designation FROM applications a
            WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
              AND LOWER(a.status) = 'approved'
            ORDER BY a.created_at DESC LIMIT 1) AS applicant_designation,
           (SELECT phone FROM applications a
            WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
              AND LOWER(a.status) = 'approved'
            ORDER BY a.created_at DESC LIMIT 1) AS applicant_phone,
           (SELECT COUNT(*) FROM programs p
            WHERE p.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
              AND p.status = 'approved') AS program_count,
           CASE
             WHEN up.about_text IS NOT NULL AND LENGTH(TRIM(up.about_text)) > 0
             THEN 'completed'
             ELSE 'incomplete'
           END AS profile_status
         FROM universities u
         LEFT JOIN university_profiles up
           ON up.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
         LEFT JOIN Student_signup s
           ON s.id COLLATE utf8mb4_general_ci = u.owner_uid COLLATE utf8mb4_general_ci
         ${clause}
         ORDER BY u.name ASC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
      ),
      q(
        `SELECT
           COUNT(*) AS total_approved,
           COALESCE(SUM(CASE WHEN up.about_text IS NOT NULL AND LENGTH(TRIM(up.about_text)) > 0 THEN 1 ELSE 0 END), 0) AS total_completed,
           COALESCE(SUM(CASE WHEN up.about_text IS NULL OR LENGTH(TRIM(up.about_text)) = 0 THEN 1 ELSE 0 END), 0) AS total_incomplete
         FROM universities u
         LEFT JOIN university_profiles up ON up.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
         WHERE u.is_hec_listed = 1 AND (u.owner_uid IS NOT NULL OR EXISTS (
           SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci AND LOWER(a.status) = 'approved'
         ))`
      ),
    ]);

    const fileToUrl = (p) => {
      if (!p) return null;
      if (/^https?:\/\//i.test(p)) return p;
      const norm = p.replace(/\\/g, "/");
      const idx  = norm.indexOf("/uploads/");
      const rel  = idx !== -1
        ? norm.substring(idx)
        : (norm.startsWith("/") ? norm : `/${norm}`);
      return `${process.env.API_URL || "http://localhost:5000"}${rel}`;
    };

    const formatted = rows.map((r) => ({
      ...r,
      admin_name:  r.admin_name || r.applicant_name || "—",
      admin_email: r.admin_email || r.applicant_email || "—",
      hec_rank:    r.hec_rank ?? null,
      logo_url:    fileToUrl(r.logo_path),
      banner_url:  fileToUrl(r.banner_path),
      logo_path:   undefined,
      banner_path: undefined,
    }));

    const stats = statsRows[0] || { total_approved: 0, total_completed: 0, total_incomplete: 0 };

    return res.json({
      total:        Number(countRows[0].total),
      page,
      limit,
      pages:        Math.ceil(Number(countRows[0].total) / limit),
      universities: formatted,
      stats: {
        total_approved:   Number(stats.total_approved),
        total_completed:  Number(stats.total_completed),
        total_incomplete: Number(stats.total_incomplete),
      },
    });
  } catch (e) {
    return err500(res, "Could not load universities.", e);
  }
};

export const adminListPrograms = async (req, res) => {
  try {
    const universityId = req.query.university_id || null;
    const level        = req.query.level         || null;
    const status       = req.query.status        || null;
    const search       = (req.query.q || "").trim();
    const page         = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit        = Math.min(100, parseInt(req.query.limit, 10) || 25);
    const offset       = (page - 1) * limit;

    const where  = [];
    const values = [];

    if (universityId) { where.push("p.university_id = ?");  values.push(universityId); }
    if (level)        { where.push("p.level = ?");          values.push(level); }
    if (status)       { where.push("p.status = ?");         values.push(status); }
    if (search) {
      where.push("(p.name LIKE ? OR p.original_name LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows, rows] = await Promise.all([
      q(`SELECT COUNT(*) AS total FROM programs p ${clause}`, values),
      q(
        `SELECT p.id, p.name, p.degree_type, p.level, p.specialization,
                p.track, p.original_name, p.status, p.created_at,
                p.created_via, p.rejection_reason,
                u.name AS university_name, u.id AS university_id,
                u.university_type, u.hec_rank
         FROM programs p
         JOIN universities u ON u.id COLLATE utf8mb4_general_ci = p.university_id COLLATE utf8mb4_general_ci
         ${clause}
         ORDER BY u.name, p.level, p.name
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
      ),
    ]);

    return res.json({
      total:    Number(countRows[0].total),
      page,
      limit,
      pages:    Math.ceil(Number(countRows[0].total) / limit),
      programs: rows,
    });
  } catch (e) {
    return err500(res, "Could not load programs.", e);
  }
};

export const adminListProgramRequests = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit, 10) || 25);
    const offset = (page - 1) * limit;

    const [countRows, rows] = await Promise.all([
      q(
        `SELECT COUNT(*) AS total FROM programs
         WHERE created_via = 'admin_request' AND status = ?`,
        [status],
      ),
      q(
        `SELECT p.id, p.name, p.degree_type, p.level, p.specialization, p.track,
                p.status, p.rejection_reason, p.created_at, p.submitted_by,
                u.name AS university_name, u.id AS university_id,
                s.name AS submitted_by_name, s.email AS submitted_by_email
         FROM programs p
         JOIN universities u ON u.id COLLATE utf8mb4_general_ci = p.university_id COLLATE utf8mb4_general_ci
         LEFT JOIN Student_signup s ON s.id COLLATE utf8mb4_general_ci = p.submitted_by COLLATE utf8mb4_general_ci
         WHERE p.created_via = 'admin_request' AND p.status = ?
         ORDER BY p.created_at ASC
         LIMIT ? OFFSET ?`,
        [status, limit, offset],
      ),
    ]);

    return res.json({
      total:    Number(countRows[0].total),
      page,
      limit,
      pages:    Math.ceil(Number(countRows[0].total) / limit),
      requests: rows,
    });
  } catch (e) {
    return err500(res, "Could not load program requests.", e);
  }
};

export const adminApproveProgramRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerUid  = req.user?.id    || null;
    const reviewerName = req.user?.email || "Admin";

    const rows = await q(
      `SELECT p.*, u.name AS university_name
       FROM programs p
       JOIN universities u ON u.id COLLATE utf8mb4_general_ci = p.university_id COLLATE utf8mb4_general_ci
       WHERE p.id = ? AND p.created_via = 'admin_request'
       LIMIT 1`,
      [id],
    );
    if (!rows.length) return err404(res, "Program request not found.");
    const prog = rows[0];
    if (prog.status !== "pending") {
      return err409(res, `Cannot approve: request is already "${prog.status}".`);
    }

    await q(
      `UPDATE programs
       SET status='approved', reviewed_by=?, reviewed_at=NOW(), rejection_reason=NULL
       WHERE id=?`,
      [reviewerUid, id],
    );

    const normName = (prog.name || "").toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    await q(
      `INSERT INTO program_catalog (name, normalized_name, level, university_count)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         university_count = university_count + 1,
         updated_at       = NOW()`,
      [prog.name, normName, prog.level],
    ).catch(() => {});

    logActivity(
      prog.university_id, reviewerUid, reviewerName,
      "program_request_approved",
      `Program request approved: "${prog.name}" (${prog.level}).`,
      "program", id,
    );

    return res.json({ message: "Program request approved.", status: "approved" });
  } catch (e) {
    return err500(res, "Could not approve program request.", e);
  }
};

export const adminRejectProgramRequest = async (req, res) => {
  try {
    const { id }  = req.params;
    const reason  = String(req.body?.reason || "").trim();
    const reviewerUid  = req.user?.id    || null;
    const reviewerName = req.user?.email || "Admin";

    if (!reason) return err400(res, "A rejection reason is required.");

    const rows = await q(
      `SELECT p.*, u.name AS university_name
       FROM programs p
       JOIN universities u ON u.id COLLATE utf8mb4_general_ci = p.university_id COLLATE utf8mb4_general_ci
       WHERE p.id = ? AND p.created_via = 'admin_request'
       LIMIT 1`,
      [id],
    );
    if (!rows.length) return err404(res, "Program request not found.");
    const prog = rows[0];
    if (prog.status !== "pending") {
      return err409(res, `Cannot reject: request is already "${prog.status}".`);
    }

    await q(
      `UPDATE programs
       SET status='rejected', rejection_reason=?, reviewed_by=?, reviewed_at=NOW()
       WHERE id=?`,
      [reason, reviewerUid, id],
    );

    logActivity(
      prog.university_id, reviewerUid, reviewerName,
      "program_request_rejected",
      `Program request rejected: "${prog.name}" (${prog.level}). Reason: ${reason}`,
      "program", id,
    );

    return res.json({ message: "Program request rejected.", status: "rejected" });
  } catch (e) {
    return err500(res, "Could not reject program request.", e);
  }
};

export const adminListActivity = async (req, res) => {
  try {
    const universityId = req.query.university_id || null;
    const page         = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit        = Math.min(100, parseInt(req.query.limit, 10) || 25);
    const offset       = (page - 1) * limit;

    const where  = [];
    const values = [];
    if (universityId) { where.push("al.university_id = ?"); values.push(universityId); }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows, rows] = await Promise.all([
      q(`SELECT COUNT(*) AS total FROM activity_log al ${clause}`, values),
      q(
        `SELECT al.id, al.action, al.actor_name, al.actor_user_id,
                al.entity_type, al.entity_id, al.description, al.created_at,
                u.name AS university_name, u.id AS university_id
         FROM activity_log al
         JOIN universities u ON u.id COLLATE utf8mb4_general_ci = al.university_id COLLATE utf8mb4_general_ci
         ${clause}
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
      ),
    ]);

    return res.json({
      total:      Number(countRows[0].total),
      page,
      limit,
      pages:      Math.ceil(Number(countRows[0].total) / limit),
      activities: rows,
    });
  } catch (e) {
    return err500(res, "Could not load activity log.", e);
  }
};

export const adminListCampusRegistrations = async (req, res) => {
  try {
    const statusFilter = req.query.status || "";
    const search       = (req.query.q || "").trim();
    const page         = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit        = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const offset       = (page - 1) * limit;

    const where  = [];
    const values = [];

    if (statusFilter) {
      where.push("cr.status = ?");
      values.push(statusFilter);
    }
    if (search) {
      where.push(
        "(cr.officialName LIKE ? OR cr.city LIKE ? OR cr.registrantName LIKE ? OR cr.publicId LIKE ? OR u.name LIKE ?)"
      );
      const like = `%${search}%`;
      values.push(like, like, like, like, like);
    }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows, countRows, statsRows] = await Promise.all([
      q(
        `SELECT
           cr.id, cr.publicId, cr.officialName, cr.campusType,
           cr.province, cr.city, cr.address,
           cr.registrantName, cr.designation, cr.phone, cr.officialEmail,
           cr.registrantEmail,
           cr.status,
           cr.rejection_reason, cr.rejection_note, cr.rejection_decidedAt, cr.rejected_by,
           cr.resubmission_requiredDocs, cr.resubmission_note, cr.resubmission_requestedAt,
           cr.document_originalName, cr.document_storedPath, cr.document_size,
           cr.history,
           cr.submittedAt, cr.updatedAt,
           cr.uni_tier1_approved, cr.uni_tier1_approved_at, cr.uni_tier1_approved_by,
           u.name  AS universityName,
           u.university_type AS universitySector,
           u.city  AS universityCity
         FROM campus_registrations cr
         LEFT JOIN universities u ON u.id = cr.universityId
         ${clause}
         ORDER BY cr.submittedAt DESC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      ),
      q(`SELECT COUNT(*) AS total FROM campus_registrations cr ${clause}`, values),
      q(
        `SELECT
           SUM(CASE WHEN status = 'pending'              THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN status = 'approved'             THEN 1 ELSE 0 END) AS approved,
           SUM(CASE WHEN status = 'rejected'             THEN 1 ELSE 0 END) AS rejected,
           SUM(CASE WHEN status = 'resubmission_requested' THEN 1 ELSE 0 END) AS resubmission,
           COUNT(*) AS total
         FROM campus_registrations`
      ),
    ]);

    const safe = (v) => {
      if (!v) return null;
      if (typeof v === "object") return v;
      try { return JSON.parse(v); } catch { return null; }
    };

    const formatted = rows.map((r) => ({
      ...r,
      history:                  safe(r.history) || [],
      resubmission_requiredDocs: safe(r.resubmission_requiredDocs) || [],
      document: r.document_originalName
        ? { originalName: r.document_originalName,
            storedPath:   r.document_storedPath,
            size:         r.document_size }
        : null,
      rejection: r.rejection_reason
        ? { reason:    r.rejection_reason,
            note:      r.rejection_note,
            decidedAt: r.rejection_decidedAt,
            by:        r.rejected_by ||
                       (Number(r.uni_tier1_approved) === 1 ? "super_admin" : "university") }
        : null,
      resubmission: r.resubmission_requestedAt
        ? { requiredDocs: safe(r.resubmission_requiredDocs) || [],
            note:         r.resubmission_note,
            requestedAt:  r.resubmission_requestedAt }
        : null,
    }));

    const stats = statsRows[0] || {};

    return res.json({
      total:         Number(countRows[0].total),
      page,
      limit,
      pages:         Math.ceil(Number(countRows[0].total) / limit),
      registrations: formatted,
      stats: {
        pending:      Number(stats.pending      || 0),
        approved:     Number(stats.approved     || 0),
        rejected:     Number(stats.rejected     || 0),
        resubmission: Number(stats.resubmission || 0),
        total:        Number(stats.total        || 0),
      },
    });
  } catch (e) {
    return err500(res, "Could not load campus registrations.", e);
  }
};

export const adminUpdateCampusRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, note, requiredDocs } = req.body;

    const reviewerUid = req.user?.id || null;
    const reviewerEmail = req.user?.email || "Super Admin";

    const rows = await q(
      "SELECT * FROM campus_registrations WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return err404(res, "Campus registration not found.");
    }

    const reg = rows[0];

    let history = [];

    try {
      history = JSON.parse(reg.history || "[]");
    } catch {
      history = [];
    }

    if (action === "approve") {

      if (Number(reg.uni_tier1_approved) !== 1) {
        return res.status(422).json({
          message:
            "University Admin has not yet reviewed this registration. Tier-1 approval is required before Super Admin can approve.",
          code: "TIER1_NOT_APPROVED",
        });
      }

      history.push({
        status: "approved",
        note: note || null,
        by: reviewerEmail,
        at: new Date(),
      });

      await q(
        `UPDATE campus_registrations
         SET status = 'approved',
             history = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [JSON.stringify(history), id]
      );

      try {

        const campusRows = await q(
          `SELECT id
           FROM campuses
           WHERE verification_id = ?
           LIMIT 1`,
          [reg.id]
        );

        let campusId;

        if (campusRows.length > 0) {

          campusId = campusRows[0].id;

        } else {

          const { v4: uuidv4 } = await import("uuid");

          campusId = uuidv4();

          await q(
            `INSERT INTO campuses
              (
                id,
                university_id,
                campus_admin_uid,
                verification_id,
                name,
                campus_type,
                city,
                province,
                address,
                phone,
                email
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              campusId,
              reg.universityId,
              reg.registrantUserId,
              reg.id,
              reg.officialName,
              reg.campusType,
              reg.city,
              reg.province,
              reg.address,
              reg.phone,
              reg.officialEmail || reg.registrantEmail,
            ]
          );
        }

      } catch (insertErr) {
        console.error(
          "Campus creation error:",
          insertErr
        );
      }

      const appInfo = await getUserInfo(reg.registrantUserId);
      if (appInfo.email) {
        sendEmail({
          to: appInfo.email,
          subject: `Campus Registration Approved ✅ (${reg.publicId})`,
          text:
            `Dear ${appInfo.name || "Campus Admin"},\n\n` +
            `Congratulations! Your campus "${reg.officialName}" has been fully approved.\n` +
            `You can now log in and start adding your campus details (history, programs, facilities, photos, hostels).\n\n` +
            `Regards,\nUni Finder Team`,
          html:
            `<p>Dear ${appInfo.name || "Campus Admin"},</p>` +
            `<p>Congratulations! Your campus <strong>"${reg.officialName}"</strong> has been fully approved.</p>` +
            `<p>You can now log in and start adding your campus details.</p>` +
            `<p>Regards,<br>Uni Finder Team</p>`,
        }).catch((e) => console.error("Admin approval email failed (non-fatal):", e.message));
      }

      return res.json({ message: "Campus registration approved." });

    } else if (action === "reject") {
      if (!reason || !reason.trim()) {
        return err400(res, "Rejection reason is required.");
      }

      history.push({
        status: "rejected",
        note: reason + (note ? `: ${note}` : ""),
        by: reviewerEmail,
        at: new Date(),
      });

      await q(
        `UPDATE campus_registrations
         SET status = 'rejected',
             rejection_reason = ?,
             rejection_note = ?,
             rejection_decidedAt = NOW(),
             rejected_by = 'super_admin',
             history = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [
          reason.trim(),
          note?.trim() || null,
          JSON.stringify(history),
          id,
        ]
      );

      const rejInfo = await getUserInfo(reg.registrantUserId);
      if (rejInfo.email) {
        sendEmail({
          to: rejInfo.email,
          subject: `Campus Registration Rejected ❌ (${reg.publicId})`,
          text:
            `Dear ${rejInfo.name || "Campus Admin"},\n\n` +
            `Your campus registration for "${reg.officialName}" was not approved.\n\n` +
            `Reason: ${reason.trim()}${note ? `\nNote: ${note.trim()}` : ""}\n\n` +
            `Please review the feedback and submit a new application when ready.\n\n` +
            `Regards,\nUni Finder Team`,
          html:
            `<p>Dear ${rejInfo.name || "Campus Admin"},</p>` +
            `<p>Your campus registration for <strong>"${reg.officialName}"</strong> was not approved.</p>` +
            `<p><strong>Reason:</strong> ${reason.trim()}${note ? `<br><strong>Note:</strong> ${note.trim()}` : ""}</p>` +
            `<p>Regards,<br>Uni Finder Team</p>`,
        }).catch((e) => console.error("Admin rejection email failed (non-fatal):", e.message));
      }
      return res.json({ message: "Campus registration rejected." });

    }

    else if (action === "request_resubmission") {

      const docs = Array.isArray(requiredDocs)
        ? requiredDocs.filter(Boolean)
        : [];

      if (!docs.length) {
        return err400(
          res,
          "requiredDocs array with at least one item is required."
        );
      }

      history.push({
        status: "resubmission_requested",
        note: note || null,
        by: reviewerEmail,
        at: new Date(),
      });

      await q(
        `UPDATE campus_registrations
         SET status = 'resubmission_requested',
             resubmission_requiredDocs = ?,
             resubmission_note = ?,
             resubmission_requestedAt = NOW(),
             rejection_reason = NULL,
             rejection_note = NULL,
             rejection_decidedAt = NULL,
             history = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [
          JSON.stringify(docs),
          note?.trim() || null,
          JSON.stringify(history),
          id,
        ]
      );

      const resubInfo = await getUserInfo(reg.registrantUserId);
      if (resubInfo.email) {
        const docList = docs.map((d) => `• ${d}`).join("\n");
        sendEmail({
          to: resubInfo.email,
          subject: `Resubmission Required — Campus Registration (${reg.publicId})`,
          text:
            `Dear ${resubInfo.name || "Campus Admin"},\n\n` +
            `The Super Admin has requested that you resubmit your campus registration for "${reg.officialName}".\n\n` +
            `Please provide the following:\n${docList}\n\n` +
            `${note ? `Additional note: ${note.trim()}\n\n` : ""}` +
            `You can resubmit from your dashboard.\n\n` +
            `Regards,\nUni Finder Team`,
          html:
            `<p>Dear ${resubInfo.name || "Campus Admin"},</p>` +
            `<p>The Super Admin has requested that you resubmit your campus registration for <strong>"${reg.officialName}"</strong>.</p>` +
            `<p><strong>Please provide the following:</strong></p>` +
            `<ul>${docs.map((d) => `<li>${d}</li>`).join("")}</ul>` +
            `${note ? `<p><strong>Additional note:</strong> ${note.trim()}</p>` : ""}` +
            `<p>Regards,<br>Uni Finder Team</p>`,
        }).catch((e) => console.error("Admin resubmission email failed (non-fatal):", e.message));
      }
      return res.json({ message: "Resubmission requested." });

      return res.json({
        message: "Resubmission requested.",
      });

    }

    else {
      return err400(res, `Unknown action '${action}'.`);
    }

  } catch (e) {
    return err500(
      res,
      "Could not update campus registration status.",
      e
    );
  }
};
