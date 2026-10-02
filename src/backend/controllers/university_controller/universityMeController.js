/**
 * universityMeController.js
 * All /api/universities/me* endpoints.
 * Every handler verifies req.user.university_id matches the requested resource.
 *
 * Routes (registered in universityRoutes.js):
 *   GET    /api/universities/me
 *   GET    /api/universities/me/stats
 *   GET    /api/universities/me/programs
 *   GET    /api/universities/me/activity
 *   PATCH  /api/universities/me/profile
 *   POST   /api/universities/me/logo
 *   POST   /api/universities/me/banner
 *   GET    /api/programs/catalog          (public — student search)
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import db from "../../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_BASE = path.resolve(
  process.env.UPLOAD_DIR ||
    path.join(__dirname, "..", "..", "uploads", "universities"),
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const q = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const err400 = (res, msg) => res.status(400).json({ error: { code: "BAD_REQUEST",   message: msg } });
const err403 = (res, msg) => res.status(403).json({ error: { code: "FORBIDDEN",     message: msg } });
const err404 = (res, msg) => res.status(404).json({ error: { code: "NOT_FOUND",     message: msg } });
const err500 = (res, msg, e) => {
  if (process.env.NODE_ENV !== "production") console.error(msg, e?.message);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: msg } });
};

/** Resolve university from JWT — req.user.university_id must be present */
const resolveUniversity = async (req, res) => {
  const uid = req.user?.university_id;
  if (!uid) {
    err403(res, "No university linked to this account.");
    return null;
  }
  const rows = await q(
    `SELECT u.*, up.established_year, up.about_text, up.mission_statement,
            up.logo_path, up.banner_path, up.active_students
     FROM universities u
     LEFT JOIN university_profiles up ON up.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
     WHERE u.id = ? AND u.owner_uid = ?
     LIMIT 1`,
    [uid, req.user.id],
  );
  if (!rows.length) {
    err403(res, "Account is not the owner of this university.");
    return null;
  }
  return rows[0];
};

/** Log an activity event — fire-and-forget (never blocks response) */
const logActivity = (universityId, actorUserId, actorName, action, description, entityType = null, entityId = null) => {
  q(
    `INSERT INTO activity_log
       (id, university_id, actor_user_id, actor_name, action,
        entity_type, entity_id, description)
     VALUES (?,?,?,?,?,?,?,?)`,
    [uuidv4(), universityId, actorUserId || null, actorName, action,
     entityType, entityId, description],
  ).catch((e) => console.error("[activity_log]", e.message));
};

/** Verify PNG or JPG by magic bytes */
const isSupportedImage = (buffer) => {
  if (!buffer || buffer.length < 4) return false;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 &&
                buffer[2] === 0x4e && buffer[3] === 0x47;
  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isSvg = buffer.slice(0, 5).toString("ascii").toLowerCase().includes("<svg") ||
                buffer.slice(0, 5).toString("ascii").toLowerCase().includes("<?xml");
  return (isPng || isJpg) && !isSvg;
};

/** Write file → save DB path → delete orphan on DB failure */
const saveAsset = async (type, buffer, universityId, res, onSuccess) => {
  const ext  = buffer[0] === 0x89 ? "png" : "jpg";
  const name = `${type}_${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
  const dir  = path.join(UPLOAD_BASE, universityId);
  await fsp.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, name);
  const urlPath  = `/uploads/universities/${universityId}/${name}`;

  // Resize with sharp
  let processed;
  try {
    const transformer = sharp(buffer).rotate(); // auto-orient
    if (type === "logo") {
      processed = await transformer
        .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
        .toBuffer();
    } else {
      processed = await transformer
        .resize({ width: 1920, withoutEnlargement: true })
        .toBuffer();
    }
  } catch (e) {
    return err400(res, "Could not process image. Please upload a valid PNG or JPG.");
  }

  // Write file
  try {
    await fsp.writeFile(filePath, processed, { flag: "wx", mode: 0o644 });
  } catch (e) {
    return err500(res, "Could not save image file.", e);
  }

  // Save path to DB
  const column = type === "logo" ? "logo_path" : "banner_path";
  try {
    await q(
      `INSERT INTO university_profiles (university_id, ${column})
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE ${column} = VALUES(${column}), updated_at = NOW()`,
      [universityId, filePath],
    );
  } catch (e) {
    // Rollback: delete the just-written file
    await fsp.unlink(filePath).catch(() => {});
    return err500(res, "Could not save image path.", e);
  }

  // Delete old file (best-effort)
  if (onSuccess?.oldPath && onSuccess.oldPath !== filePath) {
    fsp.unlink(onSuccess.oldPath).catch(() => {});
  }

  return urlPath;
};

/** Check whether a file path actually exists on disk */
const fileExists = async (filePath) => {
  if (!filePath) return false;
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// ── GET /api/universities/me ──────────────────────────────────────────────────
// Returns HEC read-only fields + verification state + profile

export const getMe = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    // Verification state from applications table
    const appRows = await q(
      `SELECT status, domain_state, loe_path, reject_reason
       FROM applications
       WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`,
      [req.user.id],
    );
    const app = appRows[0] || null;

    // FIX 2: domain_verified comes from the STORED domain_state on the application,
    // never recomputed from the JWT/login email.
    const domainVerified = app?.domain_state === "match";

    // FIX 5: LOE on file = path is non-empty AND the file actually exists on disk.
    // Stale DB paths (file deleted) return false.
    const loeOnFile = await fileExists(app?.loe_path || null);

    // Build logo/banner public URLs
    const fileToUrl = (p) => {
      if (!p) return null;
      const rel = p.replace(/\\/g, "/").replace(/^.*\/uploads\//, "/uploads/");
      return `${process.env.API_URL || "http://localhost:5000"}${rel}`;
    };

    return res.json({
      id:                 uni.id,
      name:               uni.name,
      normalized_name:    uni.normalized_name,
      hec_rank:           uni.hec_rank ?? null,
      university_type:    uni.university_type,
      oric_domain:        uni.oric_domain,
      focal_person_name:  uni.focal_person_name,
      focal_person_email: uni.focal_person_email,
      campus_count:       uni.campus_count ?? 0,
      last_synced_at:     uni.last_synced_at,
      // profile (admin-editable)
      established_year:   uni.established_year ?? null,
      about_text:         uni.about_text ?? "",
      mission_statement:  uni.mission_statement ?? "",
      logo_url:           fileToUrl(uni.logo_path),
      banner_url:         fileToUrl(uni.banner_path),
      active_students:    uni.active_students ?? 0,
      // verification — FIX 2 & FIX 5 applied
      verification: {
        status:          app?.status || null,
        domain_state:    app?.domain_state || null,
        domain_verified: domainVerified,      // FIX 2: from stored domain_state
        loe_on_file:     loeOnFile,           // FIX 5: real file existence check
        reject_reason:   app?.reject_reason || null,
      },
    });
  } catch (e) {
    return err500(res, "Could not load university data.", e);
  }
};

// ── GET /api/universities/me/stats ───────────────────────────────────────────
// All counts via SQL aggregates — zero client-side counting.
// FIX 3: pending_items = union of own pending program requests + own pending application.

export const getMyStats = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;
    const uid = uni.id;

    // Program counts — single aggregate query
    const progRows = await q(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status='pending'      THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN level='Undergraduate' THEN 1 ELSE 0 END) AS undergrad,
         SUM(CASE WHEN level='MS'            THEN 1 ELSE 0 END) AS ms,
         SUM(CASE WHEN level='MPhil'         THEN 1 ELSE 0 END) AS mphil,
         SUM(CASE WHEN level='PhD'           THEN 1 ELSE 0 END) AS phd,
         SUM(CASE WHEN level='ADP'           THEN 1 ELSE 0 END) AS adp,
         SUM(CASE WHEN level='Diploma'       THEN 1 ELSE 0 END) AS diploma,
         SUM(CASE WHEN level IS NULL         THEN 1 ELSE 0 END) AS level_null
       FROM programs
       WHERE university_id = ?`,
      [uid],
    );
    const p = progRows[0] || {};

    // FIX 3: Pending items union — two sources, one UNION query:
    //  a) own pending program requests (created_via='admin_request', status='pending')
    //  b) own verification application still pending
    const pendingItemRows = await q(
      `SELECT 'program_request' AS item_type,
              id, name AS label, created_at
       FROM programs
       WHERE university_id = ? AND created_via = 'admin_request' AND status = 'pending'
       UNION ALL
       SELECT 'verification' AS item_type,
              id, CONCAT('Verification request — ', UPPER(status)) AS label, created_at
       FROM applications
       WHERE user_uid = ? AND LOWER(status) IN ('pending','awaiting')
       ORDER BY created_at DESC`,
      [uid, req.user.id],
    );

    return res.json({
      campus_count:     uni.campus_count ?? 0,
      active_students:  uni.active_students ?? 0,
      program_count:    Number(p.total || 0),
      pending_programs: Number(p.pending || 0),
      program_count_by_level: {
        Undergraduate: Number(p.undergrad  || 0),
        MS:            Number(p.ms         || 0),
        MPhil:         Number(p.mphil      || 0),
        PhD:           Number(p.phd        || 0),
        ADP:           Number(p.adp        || 0),
        Diploma:       Number(p.diploma    || 0),
        unknown:       Number(p.level_null || 0),
      },
      // FIX 3 — aggregated pending items list
      pending_items:       pendingItemRows,
      pending_items_count: pendingItemRows.length,
    });
  } catch (e) {
    return err500(res, "Could not load stats.", e);
  }
};

// ── GET /api/universities/me/programs ────────────────────────────────────────
// Paginated, filterable by level + free-text search

export const getMyPrograms = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const level   = req.query.level  || null;
    const status  = req.query.status || null;
    const q_text  = (req.query.q || "").trim();
    const page    = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit   = Math.min(100, parseInt(req.query.limit, 10) || 25);
    const offset  = (page - 1) * limit;

    const where  = ["p.university_id = ?"];
    const values = [uni.id];

    if (level) { where.push("p.level = ?"); values.push(level); }
    if (status) { where.push("p.status = ?"); values.push(status); }
    if (q_text) {
      where.push("(p.name LIKE ? OR p.original_name LIKE ?)");
      values.push(`%${q_text}%`, `%${q_text}%`);
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    const [countRows, rows] = await Promise.all([
      q(`SELECT COUNT(*) AS total FROM programs p ${whereClause}`, values),
      q(
        `SELECT p.id, p.name, p.degree_type, p.level, p.specialization,
                p.track, p.original_name, p.status, p.created_at
         FROM programs p
         ${whereClause}
         ORDER BY p.level, p.name
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
      ),
    ]);

    return res.json({
      total:   Number(countRows[0].total),
      page,
      limit,
      pages:   Math.ceil(Number(countRows[0].total) / limit),
      programs: rows,
    });
  } catch (e) {
    return err500(res, "Could not load programs.", e);
  }
};

// ── GET /api/universities/me/activity ────────────────────────────────────────

export const getMyActivity = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const rows = await q(
      `SELECT id, actor_name, action, entity_type, entity_id, description, created_at
       FROM activity_log
       WHERE university_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [uni.id, limit],
    );
    return res.json(rows);
  } catch (e) {
    return err500(res, "Could not load activity.", e);
  }
};

// ── PATCH /api/universities/me/profile ───────────────────────────────────────

export const patchMyProfile = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const { established_year, about_text, mission_statement, active_students } = req.body;
    const updates = {};
    const errors  = {};

    if (established_year !== undefined) {
      const yr = parseInt(established_year, 10);
      if (!Number.isFinite(yr) || yr < 600 || yr > new Date().getFullYear()) {
        errors.established_year = "established_year must be a valid year (600–present).";
      } else {
        updates.established_year = yr;
      }
    }
    if (about_text !== undefined) {
      updates.about_text = String(about_text).slice(0, 5000);
    }
    if (mission_statement !== undefined) {
      updates.mission_statement = String(mission_statement).slice(0, 2000);
    }
    if (active_students !== undefined) {
      const n = parseInt(active_students, 10);
      if (!Number.isFinite(n) || n < 0) {
        errors.active_students = "active_students must be a non-negative integer.";
      } else {
        updates.active_students = n;
      }
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", fields: errors } });
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "No valid fields provided." } });
    }

    const setCols = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
    const vals    = [...Object.values(updates), uni.id];

    await q(
      `INSERT INTO university_profiles (university_id, ${Object.keys(updates).join(", ")})
       VALUES (?, ${Object.keys(updates).map(() => "?").join(", ")})
       ON DUPLICATE KEY UPDATE ${setCols}, updated_at = NOW()`,
      [uni.id, ...Object.values(updates), ...Object.values(updates)],
    );

    // Determine action for activity log
    const hasStudents = updates.active_students !== undefined;
    const hasOther    = Object.keys(updates).some((k) => k !== "active_students");

    if (hasStudents) {
      logActivity(uni.id, req.user.id, req.user.email,
        "active_students_updated",
        `Active students updated to ${updates.active_students}.`);
    }
    if (hasOther) {
      logActivity(uni.id, req.user.id, req.user.email,
        "profile_updated",
        `Profile fields updated: ${Object.keys(updates).filter((k) => k !== "active_students").join(", ")}.`);
    }

    return res.json({ message: "Profile updated.", updated: updates });
  } catch (e) {
    return err500(res, "Could not update profile.", e);
  }
};

// ── POST /api/universities/me/logo ───────────────────────────────────────────

export const uploadLogo = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const file = req.file;
    if (!file) return err400(res, "No file uploaded.");

    // Magic byte check — rejects SVG, blocks extension spoofing
    if (!isSupportedImage(file.buffer)) {
      return res.status(415).json({
        error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Only PNG and JPG images are accepted. SVG is not allowed." },
      });
    }

    const urlPath = await saveAsset("logo", file.buffer, uni.id, res, { oldPath: uni.logo_path });
    if (!urlPath) return; // response already sent inside saveAsset

    logActivity(uni.id, req.user.id, req.user.email, "logo_uploaded", "University logo uploaded/replaced.");

    return res.json({ message: "Logo uploaded.", logo_url: urlPath });
  } catch (e) {
    return err500(res, "Logo upload failed.", e);
  }
};

// ── POST /api/universities/me/banner ─────────────────────────────────────────

export const uploadBanner = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const file = req.file;
    if (!file) return err400(res, "No file uploaded.");

    if (!isSupportedImage(file.buffer)) {
      return res.status(415).json({
        error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Only PNG and JPG images are accepted. SVG is not allowed." },
      });
    }

    const urlPath = await saveAsset("banner", file.buffer, uni.id, res, { oldPath: uni.banner_path });
    if (!urlPath) return;

    logActivity(uni.id, req.user.id, req.user.email, "banner_uploaded", "University banner uploaded/replaced.");

    return res.json({ message: "Banner uploaded.", banner_url: urlPath });
  } catch (e) {
    return err500(res, "Banner upload failed.", e);
  }
};

// ── GET /api/programs/catalog ─────────────────────────────────────────────────
// Public — student search. Prefix/LIKE search, paginated.

export const getProgramCatalog = async (req, res) => {
  try {
    const q_text = (req.query.q || "").trim();
    const level  = req.query.level || null;
    const page   = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    if (q_text.length < 2) {
      return res.json({ total: 0, page, limit, pages: 0, results: [] });
    }

    const where  = ["(normalized_name LIKE ? OR name LIKE ?)"];
    const values = [`${q_text.toLowerCase()}%`, `%${q_text}%`];

    if (level) { where.push("level = ?"); values.push(level); }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    const [countRows, rows] = await Promise.all([
      q(`SELECT COUNT(*) AS total FROM program_catalog ${whereClause}`, values),
      q(
        `SELECT name, normalized_name, level, university_count
         FROM program_catalog
         ${whereClause}
         ORDER BY university_count DESC, name
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
      ),
    ]);

    return res.json({
      total:   Number(countRows[0].total),
      page,
      limit,
      pages:   Math.ceil(Number(countRows[0].total) / limit),
      results: rows,
    });
  } catch (e) {
    return err500(res, "Could not search program catalog.", e);
  }
};

// ── POST /api/seed  (admin only — full re-seed) ───────────────────────────────

export const runSeed = async (req, res) => {
  try {
    const { default: seedUniversities } = await import("../../config/seedUniversities.js");
    const { default: seedPrograms }     = await import("../../config/seedPrograms.js");
    const uniResult  = await seedUniversities();
    const progResult = await seedPrograms();
    return res.json({ message: "Seed complete.", universities: uniResult, programs: progResult });
  } catch (e) {
    return err500(res, "Seed failed.", e);
  }
};

// ── POST /api/sync-hec  (admin only — HEC data only, preserves profile) ───────

export const syncHec = async (req, res) => {
  try {
    const { default: seedUniversities } = await import("../../config/seedUniversities.js");
    const result = await seedUniversities();
    return res.json({ message: "HEC sync complete.", ...result });
  } catch (e) {
    return err500(res, "HEC sync failed.", e);
  }
};

// ── GET /api/health ───────────────────────────────────────────────────────────

export const health = async (req, res) => {
  try {
    await q("SELECT 1");
    return res.json({ status: "ok", db: "connected", ts: new Date().toISOString() });
  } catch (e) {
    return res.status(503).json({ status: "error", db: "disconnected" });
  }
};
