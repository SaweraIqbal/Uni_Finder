// University programs: add / list / delete.
import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

// POST /university/programs
export const addProgram = (req, res) => {
  const { university_id, name, level, duration, fee, description } = req.body;
  if (!university_id || !name) {
    return res.status(400).json({ message: "university_id and program name are required" });
  }
  const id = uuidv4();
  db.query(
    `INSERT INTO programs (id, university_id, name, level, duration, fee, description)
     VALUES (?,?,?,?,?,?,?)`,
    [id, university_id, name, level || null, duration || null, fee || null, description || null],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(201).json({ message: "Program added", id });
    }
  );
};

// GET /university/:id/programs
export const listPrograms = (req, res) => {
  db.query(
    "SELECT * FROM programs WHERE university_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows);
    }
  );
};

// DELETE /university/programs/:programId
export const deleteProgram = (req, res) => {
  db.query(
    "DELETE FROM programs WHERE id = ?",
    [req.params.programId],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json({ message: "Program deleted" });
    }
  );
};
