import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

const q = (sql, vals = []) =>
  new Promise((res, rej) => db.query(sql, vals, (e, r) => (e ? rej(e) : res(r))));

// ── List programs already added to this campus (with full detail) ─────────────
export const listCampusPrograms = async (req, res) => {
  try {
    const rows = await q(
      `SELECT
         cp.id, cp.program_id, cp.fee, cp.duration,
         cp.shifts, cp.status, cp.details,
         p.name, p.level, p.degree_type
       FROM campus_programs cp
       JOIN programs p ON p.id = cp.program_id
       WHERE cp.campus_id = ?
       ORDER BY p.name`,
      [req.params.campusId]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ── List all approved programs for a university (for the campus picker) ───────
// GET /api/universities/:universityId/programs/approved
export const listUniversityApprovedPrograms = async (req, res) => {
  try {
    const rows = await q(
      `SELECT id, name, level, degree_type
       FROM programs
       WHERE university_id = ? AND status = 'approved'
       ORDER BY name`,
      [req.params.universityId]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ── Add a program to this campus (creates a draft campus_programs row) ────────
export const addCampusProgram = async (req, res) => {
  const { campus_id, program_id, fee, duration } = req.body;
  if (!campus_id || !program_id)
    return res.status(400).json({ message: "campus_id and program_id are required" });

  // Don't allow duplicates
  try {
    const existing = await q(
      "SELECT id FROM campus_programs WHERE campus_id=? AND program_id=?",
      [campus_id, program_id]
    );
    if (existing.length)
      return res.status(409).json({ message: "Program already added to this campus." });

    const id = uuidv4();
    await q(
      `INSERT INTO campus_programs
         (id, campus_id, program_id, fee, duration, status)
       VALUES (?,?,?,?,?,'draft')`,
      [id, campus_id, program_id, fee || null, duration || null]
    );
    return res.status(201).json({ message: "Program added to campus", id });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ── Remove a program from this campus ────────────────────────────────────────
export const deleteCampusProgram = (req, res) => {
  db.query("DELETE FROM campus_programs WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    return res.status(200).json({ message: "Removed" });
  });
};
