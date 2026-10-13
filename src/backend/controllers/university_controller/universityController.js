

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../../config/db.js";

const FIELDS = [
  "name", "tagline", "hero_subtitle", "description",
  "about_title", "about_text", "mission", "vision",
  "ranking", "ranking_label",
  "students", "employment_rate", "partner_countries", "total_campuses",
  "website", "email", "phone", "city", "address", "established_year",
];

const fileUrl = (files, field) =>
  files && files[field] && files[field][0]
    ? `/uploads/${files[field][0].filename}`
    : null;

const fileToUrl = (filepath) => {
  if (!filepath) return null;
  if (filepath.startsWith("http://") || filepath.startsWith("https://")) return filepath;
  const normalized = filepath.replace(/\\/g, "/");
  const idx = normalized.indexOf("/uploads/");
  if (idx !== -1) {
    return normalized.substring(idx);
  }
  return filepath.startsWith("/") ? filepath : `/${filepath}`;
};

export const getMyUniversity = (req, res) => {
  const { uid } = req.params;
  db.query(
    "SELECT * FROM universities WHERE owner_uid = ? LIMIT 1",
    [uid],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows[0] || null);
    }
  );
};

export const listUniversities = (req, res) => {
  const showAll = req.query.all === "true";
  const whereClause = showAll
    ? "WHERE u.is_hec_listed = 1"
    : `WHERE (
        u.status = 'approved'
        OR u.owner_uid IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM applications a
          WHERE a.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
            AND LOWER(a.status) = 'approved'
        )
      )`;

  db.query(
    `SELECT
       u.id, u.name, u.domain, u.oric_domain, u.tagline, u.hec_rank,
       COALESCE(up.logo_path, u.logo_url) AS logo_url,
       COALESCE(up.banner_path, u.banner_url) AS banner_url,
       COALESCE(u.university_type, 'Private') AS university_type,
       COALESCE(
         u.province,
         (SELECT c.province FROM campuses c WHERE c.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci AND c.province IS NOT NULL LIMIT 1),
         'Punjab'
       ) AS province,
       COALESCE(
         u.city,
         (SELECT c.city FROM campuses c WHERE c.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci AND c.city IS NOT NULL LIMIT 1),
         'Pakistan'
       ) AS city,
       COALESCE(
         (SELECT COUNT(*) FROM campuses c WHERE c.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci),
         CAST(u.total_campuses AS UNSIGNED),
         1
       ) AS total_campuses,
       (SELECT image_url FROM university_images WHERE university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci ORDER BY created_at DESC LIMIT 1) AS cover_image,
       CASE
         WHEN u.owner_uid IS NOT NULL
              OR EXISTS (SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id AND LOWER(a.status) = 'approved')
           THEN 'registered'
         WHEN EXISTS (SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                      AND LOWER(a.status) IN ('awaiting','pending','under_review','info_required','under review','info required'))
           THEN 'in_process'
         ELSE 'available'
       END AS state,
       (u.owner_uid IS NOT NULL OR EXISTS (SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id AND LOWER(a.status) = 'approved')) AS claimed,
       EXISTS (
         SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id AND LOWER(a.status) = 'rejected'
       ) AS previously_rejected
     FROM universities u
     LEFT JOIN university_profiles up ON up.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
     ${whereClause}
     ORDER BY u.name`,
    (err, rows) => {
      if (err) {
        console.error("listUniversities error:", err);
        return res.status(500).json({ message: "DB error", error: err.message });
      }
      const formatted = (rows || []).map((r) => ({
        ...r,
        logo_url: fileToUrl(r.logo_url),
        banner_url: fileToUrl(r.banner_url || r.cover_image),
      }));
      return res.status(200).json(formatted);
    }
  );
};

export const getUniversityById = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT
       u.*,
       -- prefer profile table values where they exist
       COALESCE(up.logo_path,        u.logo_url)          AS logo_url,
       COALESCE(up.banner_path,      u.banner_url)        AS banner_url,
       COALESCE(up.about_text,       u.about_text)        AS about_text,
       COALESCE(up.mission_statement, u.mission)          AS mission,
       COALESCE(up.established_year, u.established_year)  AS established_year,
       up.active_students,
       -- contact / admissions (profile table is authoritative)
       COALESCE(up.website_url,      u.website)           AS website_url,
       COALESCE(up.admissions_email, u.email)             AS admissions_email,
       COALESCE(up.admissions_phone, u.phone)             AS admissions_phone,
       -- live campus count
       (SELECT COUNT(*) FROM campuses c
          WHERE c.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
       ) AS live_campus_count,
       -- approved program count
       (SELECT COUNT(*) FROM programs p
          WHERE p.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
            AND p.status = 'approved'
       ) AS live_program_count
     FROM universities u
     LEFT JOIN university_profiles up
       ON up.university_id COLLATE utf8mb4_general_ci = u.id COLLATE utf8mb4_general_ci
     WHERE u.id = ?
     LIMIT 1`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (!rows.length) return res.status(404).json({ message: "University not found" });
      const row = rows[0];
      return res.status(200).json({
        ...row,
        logo_url:   fileToUrl(row.logo_url),
        banner_url: fileToUrl(row.banner_url),
      });
    }
  );
};

export const saveUniversity = (req, res) => {
  const { owner_uid } = req.body;
  const name = req.body.name;

  if (!owner_uid || !name) {
    return res.status(400).json({ message: "owner and university name are required" });
  }

  const logoUrl = fileUrl(req.files, "logo");
  const bannerUrl = fileUrl(req.files, "banner");

  db.query(
    "SELECT id FROM universities WHERE owner_uid = ? LIMIT 1",
    [owner_uid],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });

      const cols = [];
      const vals = [];
      FIELDS.forEach((f) => {
        if (req.body[f] !== undefined) {
          cols.push(f);
          vals.push(req.body[f]);
        }
      });
      if (logoUrl) { cols.push("logo_url"); vals.push(logoUrl); }
      if (bannerUrl) { cols.push("banner_url"); vals.push(bannerUrl); }

      if (rows.length > 0) {
        const id = rows[0].id;
        const setClause = cols.map((c) => `${c}=?`).join(", ");
        return db.query(
          `UPDATE universities SET ${setClause} WHERE id=?`,
          [...vals, id],
          (err2) => {
            if (err2) return res.status(500).json({ message: "DB error", error: err2.message });
            return res.status(200).json({ message: "University details updated", id });
          }
        );
      }

      db.query(
        `SELECT id FROM university_verification
         WHERE user_uid = ? AND status = 'approved'
         ORDER BY reviewed_at DESC LIMIT 1`,
        [owner_uid],
        (err3, vRows) => {
          // graceful: table may not exist yet
          const verificationId = (err3 || !vRows || !vRows[0]) ? null : vRows[0].id;
          const id = uuidv4();
          const allCols = ["id", "owner_uid", "verification_id", ...cols];
          const allVals = [id, owner_uid, verificationId, ...vals];
          const placeholders = allCols.map(() => "?").join(",");
          db.query(
            `INSERT INTO universities (${allCols.join(",")}) VALUES (${placeholders})`,
            allVals,
            (err4) => {
              if (err4) return res.status(500).json({ message: "DB error", error: err4.message });
              return res.status(201).json({ message: "University details saved", id });
            }
          );
        }
      );
    }
  );
};

export const updateAccount = (req, res) => {
  const { user_uid, name, username, email, password } = req.body;
  if (!user_uid) return res.status(400).json({ message: "user_uid is required" });

  const cols = [];
  const vals = [];
  if (name !== undefined) { cols.push("name=?"); vals.push(name); }
  if (username !== undefined) { cols.push("username=?"); vals.push(username); }
  if (email !== undefined) { cols.push("email=?"); vals.push(email); }
  if (password) { cols.push("password=?"); vals.push(bcrypt.hashSync(password, 10)); }

  if (!cols.length) return res.status(400).json({ message: "Nothing to update" });

  db.query(
    `UPDATE Student_signup SET ${cols.join(", ")} WHERE id=?`,
    [...vals, user_uid],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "That email is already in use" });
        return res.status(500).json({ message: "DB error", error: err.message });
      }
      return res.status(200).json({ message: "Profile updated successfully" });
    }
  );
};

export const getAccount = (req, res) => {
  const { uid } = req.params;
  db.query(
    "SELECT id, name, username, email, role, avatar_url, assigned_id FROM Student_signup WHERE id=?",
    [uid],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows[0] || null);
    }
  );
};

export const uploadAvatar = (req, res) => {
  const { uid } = req.params;
  if (!req.file) return res.status(400).json({ message: "No image provided" });
  const avatarUrl = `/uploads/${req.file.filename}`;
  db.query(
    "UPDATE Student_signup SET avatar_url=? WHERE id=?",
    [avatarUrl, uid],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json({ message: "Profile picture updated", avatar_url: avatarUrl });
    }
  );
};
