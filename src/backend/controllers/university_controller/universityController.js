// University profile: the verified uni admin creates/edits their university
// record (the rich content shown on the public detail page). One per owner.
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../../config/db.js";

// All editable content columns (besides id/owner/verification/timestamps).
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

// GET the university owned by a given uni-admin uid (or null if none yet).
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

// PUBLIC: list all universities (for the homepage / detail picker).
export const listUniversities = (req, res) => {
  db.query(
    "SELECT id, name, city, logo_url, tagline FROM universities ORDER BY name",
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows);
    }
  );
};

// PUBLIC: full university record by id (shown on the detail page).
export const getUniversityById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM universities WHERE id = ? LIMIT 1", [id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    if (!rows.length) return res.status(404).json({ message: "University not found" });
    return res.status(200).json(rows[0]);
  });
};

// CREATE or UPDATE the university record for this owner (upsert by owner_uid).
// Logo/banner are optional; only overwritten when a new file is uploaded.
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

      // Build the SET / VALUES list from FIELDS that were sent.
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

      // UPDATE existing
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

      // INSERT new — link to the latest approved verification if present
      db.query(
        `SELECT id FROM university_verification
         WHERE user_uid = ? AND status = 'approved'
         ORDER BY reviewed_at DESC LIMIT 1`,
        [owner_uid],
        (err3, vRows) => {
          const verificationId = vRows && vRows[0] ? vRows[0].id : null;
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

// UNI ADMIN: update own account (name, username, email, optional new password).
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

// UNI ADMIN: get own account info.
export const getAccount = (req, res) => {
  const { uid } = req.params;
  db.query(
    "SELECT id, name, username, email, role FROM Student_signup WHERE id=?",
    [uid],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows[0] || null);
    }
  );
};
