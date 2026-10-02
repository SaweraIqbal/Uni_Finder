

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
  db.query(
    `SELECT
       u.id, u.name, u.city, u.domain, u.oric_domain, u.logo_url, u.banner_url, u.tagline,
       u.hec_rank, u.university_type, u.total_campuses,

       CASE
         WHEN u.owner_uid IS NOT NULL
              OR EXISTS (
                SELECT 1 FROM applications a
                WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                  AND LOWER(a.status) = 'approved'
              )
           THEN 'registered'
         WHEN EXISTS (
                SELECT 1 FROM applications a
                WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                  AND LOWER(a.status) IN
                      ('awaiting','pending','under_review','info_required',
                       'under review','info required')
              )
           THEN 'in_process'
         ELSE 'available'
       END AS state,

       CASE
         WHEN u.owner_uid IS NOT NULL
              OR EXISTS (
                SELECT 1 FROM applications a
                WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                  AND LOWER(a.status) = 'approved'
              )
           THEN 1
         ELSE 0
       END AS claimed,

       EXISTS (
         SELECT 1 FROM applications a
         WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
           AND LOWER(a.status) = 'rejected'
       ) AS previously_rejected,

       (SELECT image_url FROM university_images
        WHERE university_id = u.id ORDER BY created_at DESC LIMIT 1) AS cover_image
     FROM universities u
     WHERE u.is_hec_listed = 1
     ORDER BY u.name`,
    (err, rows) => {
      if (err) {
        if (err.code === "ER_NO_SUCH_TABLE") {
          return db.query(
            `SELECT
               u.id, u.name, u.city, u.domain, u.oric_domain,
               u.logo_url, u.banner_url, u.tagline,
               u.hec_rank, u.university_type, u.total_campuses,
               CASE
                 WHEN u.owner_uid IS NOT NULL
                      OR EXISTS (SELECT 1 FROM applications a
                                 WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                                   AND LOWER(a.status) = 'approved')
                   THEN 'registered'
                 WHEN EXISTS (SELECT 1 FROM applications a
                              WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                                AND LOWER(a.status) IN
                                    ('awaiting','pending','under_review','info_required',
                                     'under review','info required'))
                   THEN 'in_process'
                 ELSE 'available'
               END AS state,
               CASE
                 WHEN u.owner_uid IS NOT NULL
                      OR EXISTS (SELECT 1 FROM applications a
                                 WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                                   AND LOWER(a.status) = 'approved')
                   THEN 1 ELSE 0
               END AS claimed,
               EXISTS (SELECT 1 FROM applications a
                       WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                         AND LOWER(a.status) = 'rejected'
               ) AS previously_rejected,
               NULL AS cover_image
             FROM universities u
             WHERE u.is_hec_listed = 1
             ORDER BY u.name`,
            (err2, rows2) => {
              if (err2) return res.status(500).json({ message: "DB error", error: err2.message });
              return res.status(200).json(rows2);
            },
          );
        }
        return res.status(500).json({ message: "DB error", error: err.message });
      }
      return res.status(200).json(rows);
    }
  );
};

export const getUniversityById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM universities WHERE id = ? LIMIT 1", [id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    if (!rows.length) return res.status(404).json({ message: "University not found" });
    return res.status(200).json(rows[0]);
  });
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
