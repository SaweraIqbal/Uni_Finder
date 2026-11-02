import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const q = (sql, vals = []) =>
  new Promise((res, rej) => db.query(sql, vals, (e, r) => (e ? rej(e) : res(r))));

const safe = (v) => {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return null; }
};

const shapeHostel = (row) => ({
  ...row,
  amenities:    safe(row.amenities)    || [],
  rooms_detail: safe(row.rooms_detail) || [],
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/campus/:campusId/hostels  — campus admin adds a new hostel
// ════════════════════════════════════════════════════════════════════════════
export const addHostel = async (req, res) => {
  const { campusId } = req.params;
  const {
    name, hostel_type = "Campus Hostel", gender = "Boys",
    rooms, rent_min, walk_dist, contact, amenities,
  } = req.body;

  if (!name?.trim())
    return res.status(400).json({ message: "Hostel name is required." });

  try {
    const { v4: uuidv4 } = await import("uuid");
    const id = uuidv4();
    await q(
      `INSERT INTO campus_hostels
         (id, campus_id, name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, campusId,
        name.trim(), hostel_type, gender,
        rooms ? Number(rooms) : null,
        rent_min || null,
        walk_dist || null,
        contact || null,
        JSON.stringify(Array.isArray(amenities) ? amenities : []),
        "pending",
      ]
    );
    return res.status(201).json({ message: "Hostel submitted for approval.", id });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/campus/:campusId/hostels
// ════════════════════════════════════════════════════════════════════════════
export const listHostels = async (req, res) => {
  try {
    const [hostels, campus] = await Promise.all([
      q("SELECT * FROM campus_hostels WHERE campus_id=? ORDER BY created_at ASC",
        [req.params.campusId]),
      q("SELECT hostel_available FROM campuses WHERE id=?", [req.params.campusId]),
    ]);
    return res.json({
      hostel_available: campus[0]?.hostel_available ?? 1,
      hostels: hostels.map(shapeHostel),
    });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/campus/:campusId/hostel-availability
// ════════════════════════════════════════════════════════════════════════════
export const setHostelAvailability = async (req, res) => {
  const available = req.body.hostel_available ? 1 : 0;
  try {
    await q(
      "UPDATE campuses SET hostel_available=?, updated_at=NOW() WHERE id=?",
      [available, req.params.campusId]
    );
    return res.json({ message: "Updated", hostel_available: !!available });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/campus/:campusId/hostel-approvals
// Returns only Campus Hostel type entries that are pending/live/rejected
// ════════════════════════════════════════════════════════════════════════════
export const listHostelApprovals = async (req, res) => {
  try {
    const rows = await q(
      `SELECT * FROM campus_hostels
       WHERE campus_id=? AND hostel_type='Campus Hostel'
       ORDER BY created_at DESC`,
      [req.params.campusId]
    );
    return res.json(rows.map(shapeHostel));
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/campus/hostel-approvals/:id/approve
// Campus admin approves → status becomes 'pending_super_admin'
// ════════════════════════════════════════════════════════════════════════════
export const approveHostel = async (req, res) => {
  try {
    await q(
      "UPDATE campus_hostels SET status='pending_super_admin', updated_at=NOW() WHERE id=?",
      [req.params.id]
    );
    return res.json({ message: "Hostel approved and forwarded to Super Admin." });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/campus/hostel-approvals/:id/reject
// ════════════════════════════════════════════════════════════════════════════
export const rejectHostel = async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim())
    return res.status(400).json({ message: "Rejection reason is required." });
  try {
    await q(
      "UPDATE campus_hostels SET status='rejected', rejection_reason=?, updated_at=NOW() WHERE id=?",
      [reason.trim(), req.params.id]
    );
    return res.json({ message: "Hostel rejected." });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

export const viewCampusHostelDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const role = req.user?.role;

    if (!["university", "admin"].includes(role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

   const rows = await q(
      `SELECT
         d.file_path,
         d.mime_type,
         h.university_id
       FROM campus_hostel_verification_documents d
       JOIN campus_hostel_verifications h
         ON h.id = d.campus_hostel_verification_id
       WHERE d.id = ?
       LIMIT 1`,
      [documentId]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const doc = rows[0];

    if (
      role === "university" &&
      String(req.user?.university_id) !== String(doc.university_id)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const uploadsDir = path.resolve(currentDir, "../../uploads");

    const filePath = path.isAbsolute(doc.file_path)
      ? path.resolve(doc.file_path)
      : path.resolve(process.cwd(), doc.file_path);

    const relativePath = path.relative(uploadsDir, filePath);

    if (
      relativePath === "" ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      return res.status(403).json({
        message: "Invalid document path",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Uploaded file not found",
      });
    }

    if (
      !["application/pdf", "image/jpeg", "image/png"].includes(doc.mime_type)
    ) {
      return res.status(415).json({
        message: "Unsupported document type",
      });
    }

    res.setHeader("Content-Type", doc.mime_type);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath);
  } catch (error) {
    console.error("View campus hostel document:", error);

    return res.status(500).json({
      message: "Failed to open document",
    });
  }
};


