

import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

export const listCampusPrograms = (req, res) => {
  db.query(
    `SELECT cp.id, cp.program_id, cp.fee, cp.duration,
            p.name, p.level
     FROM campus_programs cp
     JOIN programs p ON p.id = cp.program_id
     WHERE cp.campus_id = ?
     ORDER BY p.name`,
    [req.params.campusId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows);
    }
  );
};

export const addCampusProgram = (req, res) => {
  const { campus_id, program_id, fee, duration } = req.body;
  if (!campus_id || !program_id) {
    return res.status(400).json({ message: "campus_id and program_id are required" });
  }
  const id = uuidv4();
  db.query(
    "INSERT INTO campus_programs (id, campus_id, program_id, fee, duration) VALUES (?,?,?,?,?)",
    [id, campus_id, program_id, fee || null, duration || null],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(201).json({ message: "Program added to campus", id });
    }
  );
};

export const deleteCampusProgram = (req, res) => {
  db.query("DELETE FROM campus_programs WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    return res.status(200).json({ message: "Removed" });
  });
};
