/**
 * adminController.js
 *
 * Super-admin endpoints:
 *   GET  /api/admin/universities                    — paginated real university list
 *   GET  /api/admin/programs                        — all programs across universities
 *   GET  /api/admin/program-requests               — pending program requests
 *   PUT  /api/admin/program-requests/:id/approve
 *   PUT  /api/admin/program-requests/:id/reject
 *   GET  /api/admin/activity                        — full activity log (paginated)
 *   GET  /api/admin/campus-registrations            — all campus registrations (NEW)
 *   PATCH /api/admin/campus-registrations/:id/status — approve/reject/resubmit (NEW)
 */

import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

const q = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const err400 = (res, msg) => res.status(400).json({ error: { code: "BAD_REQUEST",  message: msg } });
const err404 = (res, msg) => res.status(404).json({ error: { code: "NOT_FOUND",    message: msg } });
const err409 = (res, msg) => res.status(409).json({ error: { code: "CONFLICT",     message: msg } });
const err500 = (res, msg, e) => {
  // Always log the full error in development so the exact MySQL problem is visible
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

// ── GET /api/admin/universities ───────────────────────────────────────────────
// Real university list: name, hec_rank, type, oric_domain, campus_count,
// program_count (LEFT JOIN aggregate), claim/verification state, focal person.

export const adminListUniversities = async (req, res) => {
  try {
    const search        = (req.query.q              || "").trim();
    const type          = req.query.type            || null;   // "Public"|"Private"
    const profileStatus = req.query.profile_status  || null;   // "completed"|"incomplete"
    const scope         = req.query.scope           || "approved"; // "approved" (default) | "all"
    const page          = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit         = Math.min(100, parseInt(req.query.limit, 10) || 25);
    const offset        = (page - 1) * limit;

    const where  = ["u.is_hec_listed = 1"];
    const values = [];

    // By default, show approved universities (claimed or approved application)
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

    // Build public logo & banner URLs
    const fileToUrl = (p) => {
      if (!p) return null;
      const rel = p.replace(/\\/g, "/").replace(/^.*\/uploads\//, "/uploads/");
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

// ── GET /api/admin/programs ───────────────────────────────────────────────────
// All programs across all universities, paginated, with university name.

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

// ── GET /api/admin/program-requests ──────────────────────────────────────────
// Pending program requests across all universities (created_via='admin_request').

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

// ── PUT /api/admin/program-requests/:id/approve ───────────────────────────────

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

    // Upsert program_catalog (increment university_count or insert)
    const normName = (prog.name || "").toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    await q(
      `INSERT INTO program_catalog (name, normalized_name, level, university_count)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         university_count = university_count + 1,
         updated_at       = NOW()`,
      [prog.name, normName, prog.level],
    ).catch(() => {}); // best-effort catalog sync

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

// ── PUT /api/admin/program-requests/:id/reject ────────────────────────────────

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

// ── GET /api/admin/activity ───────────────────────────────────────────────────
// Full activity log across all universities, paginated, newest first.

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

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/campus-registrations
// List all campus registrations for the super-admin, with university name,
// registrant info, status. Supports ?status= filter and ?q= search.
// Returns stats (pending / approved / total) for the header cards.
// ═══════════════════════════════════════════════════════════════════════════
export const adminListCampusRegistrations = async (req, res) => {
  try {
    const statusFilter = req.query.status || "";   // "pending"|"approved"|"rejected"|"" (all)
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
           cr.rejection_reason, cr.rejection_note, cr.rejection_decidedAt,
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

    // Parse JSON columns (mysql2 may already parse them, but be safe)
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
            decidedAt: r.rejection_decidedAt }
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

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/campus-registrations/:id/status
// Super-admin approves, rejects, or requests resubmission on a campus registration.
// Body: { action: "approve"|"reject"|"request_resubmission", reason?, note?, requiredDocs? }
// ═══════════════════════════════════════════════════════════════════════════
export const adminUpdateCampusRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, note, requiredDocs } = req.body;
    const reviewerUid  = req.user?.id    || null;
    const reviewerEmail = req.user?.email || "Super Admin";

    const rows = await q(
      "SELECT * FROM campus_registrations WHERE id = ?", [id]
    );
    if (!rows.length) return err404(res, "Campus registration not found.");
    const reg = rows[0];

    let history = [];
    try { history = JSON.parse(reg.history || "[]"); } catch { /* empty */ }

    if (action === "approve") {
      // TWO-TIER GATE: super admin can only give final approval after
      // the university admin (tier-1) has approved the registration.
      if (!reg.uni_tier1_approved) {
        return res.status(422).json({
          message: "University Admin has not yet reviewed this registration. Tier-1 approval is required before Super Admin can approve.",
          code: "TIER1_NOT_APPROVED",
        });
      }
      history.push({ status: "approved", note: note || null, by: reviewerEmail, at: new Date() });
      await q(
        `UPDATE campus_registrations
         SET status='approved', history=?, updatedAt=NOW()
         WHERE id=?`,
        [JSON.stringify(history), id]
      );

      try {
        const campusRows = await q(
          "SELECT id FROM campuses WHERE campus_admin_uid = ? LIMIT 1",
          [reg.registrantUserId]
        );
        if (!campusRows.length) {
          const { v4: uuidv4 } = await import("uuid");
          const cid = uuidv4();
          await q(
            `INSERT INTO campuses (id, university_id, campus_admin_uid, verification_id, name, campus_type, city, province, address, phone, email)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              cid, reg.universityId, reg.registrantUserId, reg.id,
              reg.officialName, reg.campusType, reg.city, reg.province,
              reg.address, reg.phone, reg.officialEmail || reg.registrantEmail
            ]
          );
        }
      } catch (insertErr) {
        console.warn("Auto-insert campus record error (non-fatal):", insertErr.message);
      }

      return res.json({ message: "Campus registration approved." });

    } else if (action === "reject") {
      if (!reason || !reason.trim())
        return err400(res, "Rejection reason is required.");

      history.push({ status: "rejected", note: reason + (note ? `: ${note}` : ""), by: reviewerEmail, at: new Date() });
      await q(
        `UPDATE campus_registrations
         SET status='rejected',
             rejection_reason=?, rejection_note=?, rejection_decidedAt=NOW(),
             history=?, updatedAt=NOW()
         WHERE id=?`,
        [reason.trim(), note?.trim() || null, JSON.stringify(history), id]
      );
      return res.json({ message: "Campus registration rejected." });

    } else if (action === "request_resubmission") {
      const docs = Array.isArray(requiredDocs) ? requiredDocs.filter(Boolean) : [];
      if (!docs.length)
        return err400(res, "requiredDocs array with at least one item is required.");

      history.push({ status: "resubmission_requested", note: note || null, by: reviewerEmail, at: new Date() });
      await q(
        `UPDATE campus_registrations
         SET status='resubmission_requested',
             resubmission_requiredDocs=?, resubmission_note=?, resubmission_requestedAt=NOW(),
             rejection_reason=NULL, rejection_note=NULL, rejection_decidedAt=NULL,
             history=?, updatedAt=NOW()
         WHERE id=?`,
        [JSON.stringify(docs), note?.trim() || null, JSON.stringify(history), id]
      );
      return res.json({ message: "Resubmission requested." });

    } else {
      return err400(res, `Unknown action '${action}'.`);
    }
  } catch (e) {
    return err500(res, "Could not update campus registration status.", e);
  }
};
