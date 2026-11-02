
import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const allowedFields = [
  "name",
  "hostel_type",
  "campus_id",
  "address",
  "lat",
  "lng",
];

const validateHostel = (data) => {
  if (
    typeof data.name !== "string" ||
    !data.name.trim() ||
    data.name.length > 255
  ) {
    return "Valid hostel name is required";
  }

  if (!["private", "university"].includes(data.hostel_type)) {
    return "Invalid hostel type";
  }

  if (data.hostel_type === "university" && !data.campus_id) {
    return "Campus is required for university hostel";
  }

  if (data.address != null && typeof data.address !== "string") {
    return "Invalid address";
  }

  if (data.campus_id != null &&
      (typeof data.campus_id !== "string" ||
       data.campus_id.length > 255)) {
    return "Invalid campus ID";
  }

  if ((data.lat == null) !== (data.lng == null)) {
    return "Latitude and longitude must be provided together";
  }

  if (data.lat != null) {
    const lat = Number(data.lat);
    const lng = Number(data.lng);

    if (
      data.lat === "" || data.lng === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      return "Invalid GPS coordinates";
    }
  }

  return null;
};

const getOwnedHostel = async (id, ownerId) => {
  const rows = await query(
    "SELECT * FROM hostels WHERE id = ? AND owner_uid = ? LIMIT 1",
    [id, ownerId]
  );

  return rows[0] || null;
};

const checkCampus = async (campusId) => {
  if (!campusId) return true;

  const rows = await query(
    "SELECT id FROM campuses WHERE id = ? LIMIT 1",
    [campusId]
  );

  return rows.length > 0;
};

// POST /api/hostels
export const createHostel = async (req, res) => {
  try {
    const data = req.body || {};
    const error = validateHostel(data);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const campusId = data.campus_id || null;

    if (!(await checkCampus(campusId))) {
      return res.status(400).json({
        message: "Selected campus does not exist",
      });
    }

    const id = uuidv4();

    await query(
      `INSERT INTO hostels
       (id, owner_uid, name, hostel_type, campus_id,
        address, lat, lng, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        id,
        req.user.id,
        data.name.trim(),
        data.hostel_type,
        campusId,
        data.address || null,
        data.lat == null ? null : Number(data.lat),
        data.lng == null ? null : Number(data.lng),
      ]
    );

    const hostel = await getOwnedHostel(id, req.user.id);

    return res.status(201).json({
      message: "Hostel draft created successfully",
      hostel,
    });
  } catch (err) {
    console.error("Create hostel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/hostels/mine
export const getMyHostels = async (req, res) => {
  try {
    const hostels = await query(
      `SELECT * FROM hostels
       WHERE owner_uid = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({ hostels });
  } catch (err) {
    console.error("Get hostels error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/hostels/:id
export const getMyHostelById = async (req, res) => {
  try {
    const hostel = await getOwnedHostel(
      req.params.id,
      req.user.id
    );

    if (!hostel) {
      return res.status(404).json({
        message: "Hostel not found",
      });
    }

    return res.json({ hostel });
  } catch (err) {
    console.error("Get hostel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/hostels/:id
export const updateHostel = async (req, res) => {
  try {
    const existing = await getOwnedHostel(
      req.params.id,
      req.user.id
    );

    if (!existing) {
      return res.status(404).json({
        message: "Hostel not found",
      });
    }

    if (existing.status !== "draft") {
      return res.status(409).json({
        message: "Only draft hostels can be edited",
      });
    }

    const body = req.body || {};
    const fields = Object.keys(body);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        message: "Invalid or empty update fields",
      });
    }

    const data = {
      name: existing.name,
      hostel_type: existing.hostel_type,
      campus_id: existing.campus_id,
      address: existing.address,
      lat: existing.lat,
      lng: existing.lng,
      ...body,
    };

    const error = validateHostel(data);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const campusId = data.campus_id || null;

    if (!(await checkCampus(campusId))) {
      return res.status(400).json({
        message: "Selected campus does not exist",
      });
    }

    const result = await query(
      `UPDATE hostels
       SET name = ?, hostel_type = ?, campus_id = ?,
           address = ?, lat = ?, lng = ?
       WHERE id = ? AND owner_uid = ? AND status = 'draft'`,
      [
        data.name.trim(),
        data.hostel_type,
        campusId,
        data.address || null,
        data.lat == null ? null : Number(data.lat),
        data.lng == null ? null : Number(data.lng),
        req.params.id,
        req.user.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(409).json({
        message: "Hostel is no longer editable",
      });
    }

    const hostel = await getOwnedHostel(
      req.params.id,
      req.user.id
    );

    return res.json({
      message: "Hostel updated successfully",
      hostel,
    });
  } catch (err) {
    console.error("Update hostel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/hostels/:id
export const deleteHostel = async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM hostels
       WHERE id = ? AND owner_uid = ? AND status = 'draft'`,
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Draft hostel not found",
      });
    }

    return res.json({
      message: "Hostel draft deleted successfully",
    });
  } catch (err) {
    console.error("Delete hostel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
