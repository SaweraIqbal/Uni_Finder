import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

const q = (sql, vals = []) =>
  new Promise((res, rej) => db.query(sql, vals, (e, r) => (e ? rej(e) : res(r))));

const safe = (v) => {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return null; }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/campus/programs/:id/detail
// Returns the full rich detail object for one campus_programs row
// ════════════════════════════════════════════════════════════════════════════
export const getProgramDetail = async (req, res) => {
  try {
    const rows = await q(
      `SELECT cp.*, p.name AS program_name, p.level, p.degree_type
       FROM campus_programs cp
       LEFT JOIN programs p ON p.id = cp.program_id
       WHERE cp.id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Program offering not found." });
    const row = rows[0];
    return res.json({ ...row, details: safe(row.details) || {} });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/campus/programs/:id/detail
// Saves rich JSON detail (eligibility, merit, fees, scholarships, dates…)
// Also updates shifts and status on the campus_programs row
// ════════════════════════════════════════════════════════════════════════════
export const saveProgramDetail = async (req, res) => {
  const { id } = req.params;
  const { details, shifts, status, duration } = req.body;

  try {
    const detailJson = JSON.stringify(details || {});
    const updates = ["details=?", "shifts=?", "status=?"];
    const values = [detailJson, shifts || null, status || "draft"];
    if (duration !== undefined) {
      updates.push("duration=?");
      values.push(duration || null);
    }
    values.push(id);

    await q(
      `UPDATE campus_programs SET ${updates.join(", ")}, updated_at=NOW() WHERE id=?`,
      values
    );
    return res.json({ message: "Program detail saved." });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/campus/programs/:id/publish   /  unpublish
// ════════════════════════════════════════════════════════════════════════════
export const publishProgram = async (req, res) => {
  try {
    await q("UPDATE campus_programs SET status='published', updated_at=NOW() WHERE id=?", [req.params.id]);
    return res.json({ message: "Program published." });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

export const unpublishProgram = async (req, res) => {
  try {
    await q("UPDATE campus_programs SET status='draft', updated_at=NOW() WHERE id=?", [req.params.id]);
    return res.json({ message: "Program unpublished." });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/campus/:campusId/program-requests
// ════════════════════════════════════════════════════════════════════════════
export const listProgramRequests = async (req, res) => {
  try {
    const rows = await q(
      `SELECT * FROM campus_program_requests
       WHERE campus_id=?
       ORDER BY submitted_at DESC`,
      [req.params.campusId]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// POST /api/campus/program-requests
// Campus admin submits a request for a new program not yet in the university list
// ════════════════════════════════════════════════════════════════════════════
export const submitProgramRequest = async (req, res) => {
  const { campus_id, program_name, level, justification } = req.body;
  if (!campus_id || !program_name?.trim())
    return res.status(400).json({ message: "campus_id and program_name are required." });

  try {
    // Look up university_id from campuses
    const campusRows = await q("SELECT university_id FROM campuses WHERE id=?", [campus_id]);
    if (!campusRows.length)
      return res.status(404).json({ message: "Campus not found." });

    const id = uuidv4();
    await q(
      `INSERT INTO campus_program_requests
         (id, campus_id, university_id, program_name, level, justification, status, submitted_at)
       VALUES (?,?,?,?,?,?,'pending',NOW())`,
      [id, campus_id, campusRows[0].university_id,
       program_name.trim(), level || "Undergraduate", justification?.trim() || null]
    );
    return res.status(201).json({ message: "Program request submitted.", id });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};
