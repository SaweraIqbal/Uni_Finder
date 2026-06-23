

import db from "../../config/db.js";

export const searchAccount = (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ message: "Search query is required" });

  db.query(
    `SELECT id, name, username, email, role, assigned_id, avatar_url
     FROM Student_signup
     WHERE assigned_id = ? OR email = ? OR assigned_id LIKE ? OR name LIKE ?
     ORDER BY (assigned_id = ?) DESC LIMIT 1`,
    [q, q, `%${q}%`, `%${q}%`, q],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (!rows.length) return res.status(404).json({ message: "No account found for that ID" });

      const user = rows[0];
      const result = { user };

      if (user.role === "university") {
        db.query("SELECT * FROM universities WHERE owner_uid=? LIMIT 1", [user.id], (e1, u) => {
          result.university = u && u[0] ? u[0] : null;
          db.query(
            "SELECT * FROM university_verification WHERE user_uid=? ORDER BY created_at DESC LIMIT 1",
            [user.id],
            (e2, v) => {
              result.verification = v && v[0] ? v[0] : null;
              return res.status(200).json(result);
            }
          );
        });
      } else if (user.role === "campus") {
        db.query(
          `SELECT c.*, u.name AS university_name FROM campuses c
           LEFT JOIN universities u ON u.id=c.university_id
           WHERE c.campus_admin_uid=? LIMIT 1`,
          [user.id],
          (e1, c) => {
            result.campus = c && c[0] ? c[0] : null;
            db.query(
              `SELECT cv.*, u.name AS university_name FROM campus_verification cv
               LEFT JOIN universities u ON u.id=cv.university_id
               WHERE cv.campus_admin_uid=? ORDER BY cv.created_at DESC LIMIT 1`,
              [user.id],
              (e2, v) => {
                result.campusVerification = v && v[0] ? v[0] : null;
                return res.status(200).json(result);
              }
            );
          }
        );
      } else {
        db.query("SELECT * FROM Student_Profile WHERE user_uid=? LIMIT 1", [user.id], (e1, p) => {
          result.profile = p && p[0] ? p[0] : null;
          return res.status(200).json(result);
        });
      }
    }
  );
};
