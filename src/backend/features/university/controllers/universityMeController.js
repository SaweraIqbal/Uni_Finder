import fsp from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import db from "../../../shared/db.js";
import { UPLOADS_DIR } from "../../../shared/paths.js";

const UPLOAD_BASE = path.resolve(
  process.env.UPLOAD_DIR || path.join(UPLOADS_DIR, "universities"),
);

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

const resolveUniversity = async (req, res) => {
  const uid = req.user?.university_id;
  if (!uid) {
    err403(res, "No university linked to this account.");
    return null;
  }
  const rows = await q(
    `SELECT u.*, up.established_year, up.about_text, up.mission_statement,
            up.logo_path, up.banner_path, up.active_students,
            up.website_url, up.admissions_email, up.admissions_phone
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

const isSupportedImage = (buffer) => {
  if (!buffer || buffer.length < 12) return false;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 &&
                buffer[2] === 0x4e && buffer[3] === 0x47;
  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp = buffer.slice(0, 4).toString("ascii") === "RIFF" &&
                 buffer.slice(8, 12).toString("ascii") === "WEBP";
  const isSvg = buffer.slice(0, 5).toString("ascii").toLowerCase().includes("<svg") ||
                buffer.slice(0, 5).toString("ascii").toLowerCase().includes("<?xml");
  return (isPng || isJpg || isWebp) && !isSvg;
};

const saveAsset = async (type, buffer, universityId, res, onSuccess) => {
  const ext  = buffer[0] === 0x89 ? "png" : "jpg";
  const name = `${type}_${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
  const dir  = path.join(UPLOAD_BASE, universityId);
  await fsp.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, name);
  const urlPath  = `/uploads/universities/${universityId}/${name}`;

  let processed;
  try {
    const transformer = sharp(buffer).rotate();
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

  try {
    await fsp.writeFile(filePath, processed, { flag: "wx", mode: 0o644 });
  } catch (e) {
    return err500(res, "Could not save image file.", e);
  }

  const column = type === "logo" ? "logo_path" : "banner_path";
  const legacyColumn = type === "logo" ? "logo_url" : "banner_url";
  try {
    await q(
      `INSERT INTO university_profiles (university_id, ${column})
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE ${column} = VALUES(${column}), updated_at = NOW()`,
      [universityId, filePath],
    );
    await q(`UPDATE universities SET ${legacyColumn} = ? WHERE id = ?`, [
      urlPath,
      universityId,
    ]);
  } catch (e) {

    await fsp.unlink(filePath).catch(() => {});
    return err500(res, "Could not save image path.", e);
  }

  if (
    onSuccess?.oldPath &&
    onSuccess.oldPath !== filePath &&
    !/^https?:\/\//i.test(onSuccess.oldPath)
  ) {
    fsp.unlink(onSuccess.oldPath).catch(() => {});
  }

  return urlPath;
};

const fileExists = async (filePath) => {
  if (!filePath) return false;
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getMe = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const appRows = await q(
      `SELECT status, domain_state, loe_path, reject_reason
       FROM applications
       WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`,
      [req.user.id],
    );
    const app = appRows[0] || null;

    const domainVerified = app?.domain_state === "match";

    const loeOnFile = await fileExists(app?.loe_path || null);

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

      city:               uni.city ?? null,
      province:           uni.province ?? null,
      address:            uni.address ?? null,
      tagline:            uni.tagline ?? null,
      description:        uni.description ?? null,
      email:              uni.email ?? null,
      phone:              uni.phone ?? null,

      established_year:   uni.established_year ?? null,
      about_text:         uni.about_text ?? "",
      mission_statement:  uni.mission_statement ?? "",
      logo_url:           fileToUrl(uni.logo_path),
      banner_url:         fileToUrl(uni.banner_path),
      active_students:    uni.active_students ?? 0,

      website_url:        uni.website_url        ?? null,
      admissions_email:   uni.admissions_email   ?? null,
      admissions_phone:   uni.admissions_phone   ?? null,

      verification: {
        status:          app?.status || null,
        domain_state:    app?.domain_state || null,
        domain_verified: domainVerified,
        loe_on_file:     loeOnFile,
        reject_reason:   app?.reject_reason || null,
      },
    });
  } catch (e) {
    return err500(res, "Could not load university data.", e);
  }
};

export const getMyStats = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;
    const uid = uni.id;

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

      pending_items:       pendingItemRows,
      pending_items_count: pendingItemRows.length,
    });
  } catch (e) {
    return err500(res, "Could not load stats.", e);
  }
};

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

export const patchMyProfile = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const {
      established_year, about_text, mission_statement, active_students,
      website_url, admissions_email, admissions_phone,
    } = req.body;
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
    if (website_url !== undefined) {
      const url = String(website_url).trim();
      if (url !== "" && !/^https?:\/\/.+\..+/.test(url)) {
        errors.website_url = "website_url must be a valid URL starting with http:// or https://.";
      } else {
        updates.website_url = url === "" ? null : url.slice(0, 500);
      }
    }
    if (admissions_email !== undefined) {
      const email = String(admissions_email).trim();
      if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.admissions_email = "admissions_email must be a valid email address.";
      } else {
        updates.admissions_email = email === "" ? null : email.slice(0, 254);
      }
    }
    if (admissions_phone !== undefined) {
      const rawPhone = String(admissions_phone).trim();
      if (rawPhone === "") {
        updates.admissions_phone = null;
      } else {

        const stripped = rawPhone.replace(/[\s\-().]/g, "");
        const PK_MOBILE_RE   = /^\+923\d{9}$/;
        const PK_LANDLINE_RE = /^\+92\d{9,12}$/;
        if (!PK_MOBILE_RE.test(stripped) && !PK_LANDLINE_RE.test(stripped)) {
          errors.admissions_phone =
            "admissions_phone must be a valid Pakistani number " +
            "(mobile: +92 3XXXXXXXXX, landline: +92 <city> XXXXXXX, or UAN: +92 <city> 111-XXX-XXX).";
        } else {
          updates.admissions_phone = rawPhone.slice(0, 50);
        }
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

export const uploadLogo = async (req, res) => {
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

    const urlPath = await saveAsset("logo", file.buffer, uni.id, res, { oldPath: uni.logo_path });
    if (!urlPath) return;

    logActivity(uni.id, req.user.id, req.user.email, "logo_uploaded", "University logo uploaded/replaced.");

    return res.json({ message: "Logo uploaded.", logo_url: urlPath });
  } catch (e) {
    return err500(res, "Logo upload failed.", e);
  }
};

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

export const getMyGallery = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const [images, rows] = await Promise.all([
      q(
        `SELECT id, image_url, caption, created_at
         FROM university_images
         WHERE university_id = ?
         ORDER BY created_at DESC`,
        [uni.id],
      ),
      q(
        `SELECT c.id AS campus_id, c.name AS campus_name, c.cover_image,
                ci.id AS image_id, ci.image_url, ci.caption, ci.category,
                ci.featured, ci.created_at
         FROM campuses c
         LEFT JOIN campus_images ci ON ci.campus_id = c.id
         WHERE c.university_id = ?
         ORDER BY c.name ASC, ci.featured DESC, ci.created_at DESC`,
        [uni.id],
      ),
    ]);

    const campuses = [];
    const byId = new Map();
    for (const row of rows) {
      let campus = byId.get(row.campus_id);
      if (!campus) {
        campus = {
          id: row.campus_id,
          name: row.campus_name,
          cover_image: row.cover_image,
          images: [],
        };
        byId.set(row.campus_id, campus);
        campuses.push(campus);
      }
      if (row.image_id) {
        campus.images.push({
          id: row.image_id,
          image_url: row.image_url,
          caption: row.caption,
          category: row.category,
          featured: Boolean(row.featured),
          created_at: row.created_at,
        });
      }
    }

    return res.json({ university_id: uni.id, images, campuses });
  } catch (e) {
    return err500(res, "Could not load gallery.", e);
  }
};

export const addMyGalleryImage = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const file = req.file;
    if (!file) return err400(res, "No image uploaded.");
    if (!isSupportedImage(file.buffer)) {
      return res.status(415).json({
        error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Only PNG, JPG or WebP images are accepted." },
      });
    }

    let processed;
    try {
      processed = await sharp(file.buffer)
        .rotate()
        .resize(1400, 900, { fit: "cover", position: "attention" })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return err400(res, "Could not process image. Please upload a valid PNG, JPG or WebP.");
    }

    const dir = path.join(UPLOAD_BASE, uni.id);
    const name = `gallery_${Date.now()}_${uuidv4().slice(0, 8)}.webp`;
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(path.join(dir, name), processed, { flag: "wx", mode: 0o644 });

    const imageUrl = `/uploads/universities/${uni.id}/${name}`;
    const id = uuidv4();
    const caption = typeof req.body.caption === "string" ? req.body.caption.trim().slice(0, 200) : "";

    await q(
      "INSERT INTO university_images (id, university_id, image_url, caption) VALUES (?,?,?,?)",
      [id, uni.id, imageUrl, caption || null],
    );

    logActivity(uni.id, req.user.id, req.user.email, "gallery_image_added", "Gallery photo uploaded.");

    return res.status(201).json({ id, image_url: imageUrl, caption: caption || null });
  } catch (e) {
    return err500(res, "Could not add gallery image.", e);
  }
};

export const deleteMyGalleryImage = async (req, res) => {
  try {
    const uni = await resolveUniversity(req, res);
    if (!uni) return;

    const rows = await q(
      "SELECT id, image_url FROM university_images WHERE id = ? AND university_id = ? LIMIT 1",
      [req.params.imageId, uni.id],
    );
    if (!rows.length) return err404(res, "Image not found.");

    await q("DELETE FROM university_images WHERE id = ?", [req.params.imageId]);

    const url = rows[0].image_url || "";
    const rel = url.replace(/^\/?uploads\//, "");
    if (rel && !rel.includes("..")) {
      const filePath = path.resolve(UPLOADS_DIR, rel);
      if (filePath.startsWith(path.resolve(UPLOADS_DIR))) {
        fsp.unlink(filePath).catch(() => {});
      }
    }

    logActivity(uni.id, req.user.id, req.user.email, "gallery_image_deleted", "Gallery photo removed.");

    return res.json({ message: "Image deleted." });
  } catch (e) {
    return err500(res, "Could not delete image.", e);
  }
};

export const getProgramCatalog = async (req, res) => {
  try {
    const q_text = (req.query.q || "").trim();
    const level  = req.query.level || null;
    const page   = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    const where  = [];
    const values = [];

    if (q_text.length >= 1) {
      where.push("(LOWER(name) LIKE ? OR LOWER(name) LIKE ?)");
      values.push(`${q_text.toLowerCase()}%`, `%${q_text.toLowerCase()}%`);
    }

    if (level) { where.push("level = ?"); values.push(level); }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows, rows] = await Promise.all([
      q(`SELECT COUNT(*) AS total FROM program_catalog ${whereClause}`, values),
      q(
        `SELECT name, level, university_count
         FROM program_catalog
         ${whereClause}
         ORDER BY university_count DESC, name ASC
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

export const runSeed = async (req, res) => {
  try {
    const { default: seedUniversities } = await import("../../../seeds/seedUniversities.js");
    const { default: seedPrograms }     = await import("../../../seeds/seedPrograms.js");
    const uniResult  = await seedUniversities();
    const progResult = await seedPrograms();
    return res.json({ message: "Seed complete.", universities: uniResult, programs: progResult });
  } catch (e) {
    return err500(res, "Seed failed.", e);
  }
};

export const syncHec = async (req, res) => {
  try {
    const { default: seedUniversities } = await import("../../../seeds/seedUniversities.js");
    const result = await seedUniversities();
    return res.json({ message: "HEC sync complete.", ...result });
  } catch (e) {
    return err500(res, "HEC sync failed.", e);
  }
};

export const health = async (req, res) => {
  try {
    await q("SELECT 1");
    return res.json({ status: "ok", db: "connected", ts: new Date().toISOString() });
  } catch (e) {
    return res.status(503).json({ status: "error", db: "disconnected" });
  }
};
