

import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

const FIELDS = ["name", "city", "address", "history", "duration", "fee", "phone", "email"];

export const getMyCampus = (req, res) => {
  db.query(
    `SELECT c.*, u.name AS university_name
     FROM campuses c LEFT JOIN universities u ON u.id = c.university_id
     WHERE c.campus_admin_uid = ? LIMIT 1`,
    [req.params.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows[0] || null);
    }
  );
};

export const saveCampus = (req, res) => {
  const { campus_admin_uid } = req.body;
  const name = req.body.name;
  if (!campus_admin_uid || !name) {
    return res.status(400).json({ message: "campus admin and campus name are required" });
  }

  db.query(
    `SELECT id, university_id FROM campus_verification
     WHERE campus_admin_uid = ? AND status='approved'
     ORDER BY reviewed_at DESC LIMIT 1`,
    [campus_admin_uid],
    (err, vrows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (!vrows.length) {
        return res.status(403).json({ message: "Your campus is not approved yet." });
      }
      const universityId = vrows[0].university_id;
      const verificationId = vrows[0].id;

      const cols = [];
      const vals = [];
      FIELDS.forEach((f) => {
        if (req.body[f] !== undefined) {
          cols.push(f);
          vals.push(req.body[f]);
        }
      });

      db.query(
        "SELECT id FROM campuses WHERE campus_admin_uid = ? LIMIT 1",
        [campus_admin_uid],
        (err2, rows) => {
          if (err2) return res.status(500).json({ message: "DB error", error: err2.message });

          if (rows.length > 0) {
            const id = rows[0].id;
            const setClause = cols.map((c) => `${c}=?`).join(", ");
            return db.query(
              `UPDATE campuses SET ${setClause} WHERE id=?`,
              [...vals, id],
              (e3) => {
                if (e3) return res.status(500).json({ message: "DB error", error: e3.message });
                return res.status(200).json({ message: "Campus details updated", id });
              }
            );
          }

          const id = uuidv4();
          const allCols = ["id", "university_id", "campus_admin_uid", "verification_id", ...cols];
          const allVals = [id, universityId, campus_admin_uid, verificationId, ...vals];
          const ph = allCols.map(() => "?").join(",");
          db.query(
            `INSERT INTO campuses (${allCols.join(",")}) VALUES (${ph})`,
            allVals,
            (e4) => {
              if (e4) return res.status(500).json({ message: "DB error", error: e4.message });
              return res.status(201).json({ message: "Campus details saved", id });
            }
          );
        }
      );
    }
  );
};

export const listCampusesByUniversity = (req, res) => {
  db.query(
    `SELECT c.*, u.banner_url AS university_banner,
       (SELECT image_url FROM campus_images
        WHERE campus_id = c.id ORDER BY created_at DESC LIMIT 1) AS cover_image
     FROM campuses c
     LEFT JOIN universities u ON u.id = c.university_id
     WHERE c.university_id = ? ORDER BY c.created_at DESC`,
    [req.params.universityId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows);
    }
  );
};

export const searchCampuses = (req, res) => {
  const { city, university, program } = req.query;
  const where = [];
  const vals = [];

  if (city) {
    where.push("LOWER(c.city) LIKE ?");
    vals.push(`%${city.toLowerCase()}%`);
  }
  if (university) {
    where.push("LOWER(u.name) LIKE ?");
    vals.push(`%${university.toLowerCase()}%`);
  }
  if (program) {
    where.push(
      `EXISTS (SELECT 1 FROM campus_programs cp
               JOIN programs p ON p.id = cp.program_id
               WHERE cp.campus_id = c.id AND LOWER(p.name) LIKE ?)`
    );
    vals.push(`%${program.toLowerCase()}%`);
  }

  const sql = `
    SELECT c.*, u.name AS university_name, u.logo_url AS university_logo,
           u.banner_url AS university_banner,
           (SELECT image_url FROM campus_images
            WHERE campus_id = c.id ORDER BY created_at DESC LIMIT 1) AS cover_image
    FROM campuses c
    LEFT JOIN universities u ON u.id = c.university_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY c.created_at DESC`;

  db.query(sql, vals, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    return res.status(200).json(rows);
  });
};

export const getCampusById = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT c.*, u.name AS university_name, u.logo_url AS university_logo,
            u.banner_url AS university_banner
     FROM campuses c
     LEFT JOIN universities u ON u.id = c.university_id
     WHERE c.id = ? LIMIT 1`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (!rows.length) return res.status(404).json({ message: "Campus not found" });
      const campus = rows[0];

      db.query(
        `SELECT cp.id, cp.fee, cp.duration, p.name AS name, p.level
         FROM campus_programs cp
         LEFT JOIN programs p ON p.id = cp.program_id
         WHERE cp.campus_id = ?`,
        [id],
        (e2, progs) => {
          if (e2) return res.status(500).json({ message: "DB error", error: e2.message });
          db.query(
            `SELECT id, image_url, caption FROM campus_images
             WHERE campus_id = ? ORDER BY created_at DESC`,
            [id],
            (e3, imgs) => {
              if (e3) return res.status(500).json({ message: "DB error", error: e3.message });
              campus.programs = progs || [];
              campus.images = imgs || [];
              return res.status(200).json(campus);
            }
          );
        }
      );
    }
  );
};
