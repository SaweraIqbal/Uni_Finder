/**
 * adminController.js
 *
 * Super-admin endpoints:
 *   GET  /api/admin/universities           — paginated real university list
 *   GET  /api/admin/programs               — all programs across universities
 *   GET  /api/admin/program-requests       — pending program requests
 *   PUT  /api/admin/program-requests/:id/approve
 *   PUT  /api/admin/program-requests/:id/reject
 *   GET  /api/admin/activity               — full activity log (paginated)
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
    const search  = (req.query.q    || "").trim();
    const type    = req.query.type  || null;   // "Public"|"Private"
    const claimed = req.query.claimed ?? null; // "true"|"false"
    const page    = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit   = Math.min(100, parseInt(req.query.limit, 10) || 25);
    const offset  = (page - 1) * limit;

    const where  = ["u.is_hec_listed = 1"];
    const values = [];

    if (search) {
      where.push("(u.name LIKE ? OR u.normalized_name LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }
    if (type) { where.push("u.university_type = ?"); values.push(type); }
    if (claimed === "true")  where.push("u.owner_uid IS NOT NULL");
    if (claimed === "false") where.push("u.owner_uid IS NULL");

    const clause = `WHERE ${where.join(" AND ")}`;

    // Check whether the applications table exists before running the main query.
    // On a fresh install the table may not be created yet (schema still initialising).
    const appTableRows = await q(
      `SELECT COUNT(*) AS c FROM information_schema.TABLES
       WHERE table_schema = DATABASE() AND table_name = 'applications'`,
    );
    const appTableExists = Number(appTableRows[0].c) > 0;

    // Build the claim_state expression depending on table availability
    const claimStateExpr = appTableExists
      ? `CASE
           WHEN u.owner_uid IS NOT NULL THEN 'claimed'
           WHEN EXISTS (
             SELECT 1 FROM applications a
             WHERE a.university_id = u.id
               AND LOWER(a.status) IN ('pending','awaiting')
           ) THEN 'pending'
           ELSE 'unclaimed'
         END`
      : `CASE WHEN u.owner_uid IS NOT NULL THEN 'claimed' ELSE 'unclaimed' END`;

    const latestRefExpr = appTableExists
      ? `(SELECT reference_no FROM applications a
          WHERE a.university_id = u.id
          ORDER BY a.created_at DESC LIMIT 1)`
      : `NULL`;

    const [countRows, rows] = await Promise.all([
      q(`SELECT COUNT(*) AS total FROM universities u ${clause}`, values),
      q(
        `SELECT
           u.id, u.name, u.hec_rank, u.university_type, u.oric_domain,
           u.campus_count, u.focal_person_name, u.focal_person_email,
           u.owner_uid,
           (SELECT COUNT(*) FROM programs p
            WHERE p.university_id = u.id AND p.status = 'approved') AS program_count,
           ${claimStateExpr} AS claim_state,
           ${latestRefExpr} AS latest_reference,
           up.established_year, up.logo_path, up.banner_path, up.active_students
         FROM universities u
         LEFT JOIN university_profiles up ON up.university_id = u.id
         ${clause}
         ORDER BY u.hec_rank IS NULL, u.hec_rank, u.name
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
      ),
    ]);

    // Build public logo URLs
    const fileToUrl = (p) => {
      if (!p) return null;
      const rel = p.replace(/\\/g, "/").replace(/^.*\/uploads\//, "/uploads/");
      return `${process.env.API_URL || "http://localhost:5000"}${rel}`;
    };

    const formatted = rows.map((r) => ({
      ...r,
      hec_rank:   r.hec_rank ?? null,   // NULL = "Unranked"
      logo_url:   fileToUrl(r.logo_path),
      banner_url: fileToUrl(r.banner_path),
      logo_path:  undefined,
      banner_path: undefined,
    }));

    return res.json({
      total:        Number(countRows[0].total),
      page,
      limit,
      pages:        Math.ceil(Number(countRows[0].total) / limit),
      universities: formatted,
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
         JOIN universities u ON u.id = p.university_id
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
         JOIN universities u ON u.id = p.university_id
         LEFT JOIN Student_signup s ON s.id = p.submitted_by
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
       JOIN universities u ON u.id = p.university_id
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
       JOIN universities u ON u.id = p.university_id
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
         JOIN universities u ON u.id = al.university_id
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
