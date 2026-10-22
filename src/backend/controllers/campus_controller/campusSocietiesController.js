import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

const q = (sql, vals = []) =>
  new Promise((res, rej) => db.query(sql, vals, (e, r) => (e ? rej(e) : res(r))));

// GET /api/campus/:campusId/societies
export const listSocieties = async (req, res) => {
  try {
    const rows = await q(
      "SELECT * FROM campus_societies WHERE campus_id=? ORDER BY created_at ASC",
      [req.params.campusId]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// POST /api/campus/:campusId/societies
export const addSociety = async (req, res) => {
  const { campusId } = req.params;
  const { name, category, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "name is required" });

  const initials = (name || "").split(/\s+/).filter(Boolean)
    .map((w) => w[0].toUpperCase()).slice(0, 2).join("");

  try {
    const id = uuidv4();
    await q(
      "INSERT INTO campus_societies (id, campus_id, name, category, description, initials) VALUES (?,?,?,?,?,?)",
      [id, campusId, name.trim(), category || "Other", description || null, initials]
    );
    return res.status(201).json({ message: "Society added", id, initials });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// PUT /api/campus/societies/:id
export const updateSociety = async (req, res) => {
  const { id } = req.params;
  const { name, category, description } = req.body;
  const initials = (name || "").split(/\s+/).filter(Boolean)
    .map((w) => w[0].toUpperCase()).slice(0, 2).join("");
  try {
    await q(
      "UPDATE campus_societies SET name=?, category=?, description=?, initials=?, updated_at=NOW() WHERE id=?",
      [name?.trim(), category, description, initials, id]
    );
    return res.json({ message: "Society updated" });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// DELETE /api/campus/societies/:id
export const deleteSociety = async (req, res) => {
  try {
    await q("DELETE FROM campus_societies WHERE id=?", [req.params.id]);
    return res.json({ message: "Society deleted" });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};
