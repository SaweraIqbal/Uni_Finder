/**
 * programRequestsController.js
 *
 * University-admin program request endpoints:
 *   POST   /api/universities/me/program-requests
 *   GET    /api/universities/me/program-requests
 *
 * Super-admin program request endpoints (in adminController.js):
 *   GET    /api/admin/program-requests
 *   PUT    /api/admin/program-requests/:id/approve
 *   PUT    /api/admin/program-requests/:id/reject
 */

import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

const q = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const LEVEL_ENUM = ["Undergraduate", "MS", "MPhil", "PhD", "ADP", "Diploma"];

const err400 = (res, msg) => res.status(400).json({ error: { code: "BAD_REQUEST",   message: msg } });
const err403 = (res, msg) => res.status(403).json({ error: { code: "FORBIDDEN",     message: msg } });
const err409 = (res, msg) => res.status(409).json({ error: { code: "CONFLICT",      message: msg } });
const err500 = (res, msg, e) => {
  if (process.env.NODE_ENV !== "production") console.error(msg, e?.message);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: msg } });
};

/** Resolve university_id from the JWT — same pattern as universityMeController */
const resolveUniId = (req, res) => {
  const uid = req.user?.university_id;
  if (!uid) { err403(res, "No university linked to this account."); return null; }
  return uid;
};

/** Fire-and-forget activity log entry */
const logActivity = (universityId, actorUserId, actorName, action, description, entityType, entityId) => {
  q(
    `INSERT INTO activity_log
       (id, university_id, actor_user_id, actor_name, action, entity_type, entity_id, description)
     VALUES (?,?,?,?,?,?,?,?)`,
    [uuidv4(), universityId, actorUserId || null, actorName, action, entityType || null, entityId || null, description],
  ).catch((e) => console.error("[activity_log]", e.message));
};

// ── POST /api/universities/me/program-requests ────────────────────────────────
// Body: { name, level, degree_type?, specialization?, track? }

export const submitProgramRequest = async (req, res) => {
  try {
    const universityId = resolveUniId(req, res);
    if (!universityId) return;

    const name           = String(req.body.name || "").trim();
    const level          = String(req.body.level || "").trim();
    const degree_type    = String(req.body.degree_type    || "").trim();
    const specialization = String(req.body.specialization || "").trim() || null;
    const track          = String(req.body.track          || "").trim() || null;

    // Validate
    if (!name)                       return err400(res, "Program name is required.");
    if (!LEVEL_ENUM.includes(level)) return err400(res, `level must be one of: ${LEVEL_ENUM.join(", ")}.`);

    // 409 if an identical program (by the full uq_prog_v2 key) already exists
    // COALESCE mirrors the generated column logic
    const existing = await q(
      `SELECT id, status FROM programs
       WHERE university_id = ?
         AND name = ?
         AND level = ?
         AND COALESCE(specialization,'') = COALESCE(?,'')
         AND COALESCE(track,'')          = COALESCE(?,'')
       LIMIT 1`,
      [universityId, name, level, specialization, track],
    );
    if (existing.length) {
      const s = existing[0].status;
      return err409(res,
        `A program "${name}" (${level}) already exists with status "${s}". ` +
        `Wait for review or use a different name/specialization.`,
      );
    }

    const id = uuidv4();
    await q(
      `INSERT INTO programs
         (id, university_id, name, degree_type, level, specialization, track,
          original_name, status, created_via, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'admin_request', ?)`,
      [id, universityId, name, degree_type, level, specialization, track, name, req.user.id],
    );

    logActivity(
      universityId, req.user.id, req.user.email,
      "program_request_submitted",
      `Program request submitted: "${name}" (${level})${specialization ? ` — ${specialization}` : ""}.`,
      "program", id,
    );

    return res.status(201).json({
      message: "Program request submitted. Awaiting super-admin approval.",
      id,
    });
  } catch (e) {
    return err500(res, "Could not submit program request.", e);
  }
};

// ── GET /api/universities/me/program-requests ─────────────────────────────────
// Returns own requests only, paginated.

export const getMyProgramRequests = async (req, res) => {
  try {
    const universityId = resolveUniId(req, res);
    if (!universityId) return;

    const status = req.query.status || null;          // pending|approved|rejected
    const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    const where  = ["university_id = ?", "created_via = 'admin_request'"];
    const values = [universityId];
    if (status) { where.push("status = ?"); values.push(status); }

    const clause = `WHERE ${where.join(" AND ")}`;

    const [countRows, rows] = await Promise.all([
      q(`SELECT COUNT(*) AS total FROM programs ${clause}`, values),
      q(
        `SELECT id, name, degree_type, level, specialization, track,
                status, rejection_reason, created_at, updated_at
         FROM programs ${clause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
      ),
    ]);

    return res.json({
      total: Number(countRows[0].total),
      page,
      limit,
      pages: Math.ceil(Number(countRows[0].total) / limit),
      requests: rows,
    });
  } catch (e) {
    return err500(res, "Could not load program requests.", e);
  }
};
