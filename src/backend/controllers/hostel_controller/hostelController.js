
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import db, { createTransactionConnection } from "../../config/db.js";

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

const documentFields = {
  campus_authorization: "management_authorization",
  owner_cnic: "cnic",
  utility_bill: "utility_bill",
  ownership_proof: "ownership_proof",
};

const validateDocumentSignature = async (file) => {
  const handle = await fs.open(file.path, "r");
  const buffer = Buffer.alloc(12);
  let bytesRead;
  try {
    ({ bytesRead } = await handle.read(buffer, 0, buffer.length, 0));
  } finally {
    await handle.close();
  }

  const bytes = buffer.subarray(0, bytesRead);
  const ext = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
  if (ext === ".pdf") return bytes.toString("ascii", 0, 5) === "%PDF-";
  if (ext === ".jpg" || ext === ".jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (ext === ".png") return bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  return false;
};

export const registerHostel = async (req, res) => {
  const files = Object.values(req.files || {}).flat();
  let connection;
  let registrationSaved = false;
  let campusAddress = null;

  try {
    const campusHostel = req.user.role === "campus_hostel";
    const independentHostel = req.user.role === "hostel";
    if (!campusHostel && !independentHostel) {
      return res.status(403).json({ message: "Hostel owner account required." });
    }

    const { name, campus_id, address, gender, contact_phone, lat, lng } = req.body;
    if (!name?.trim() || name.trim().length > 255) {
      return res.status(400).json({ message: "Enter a valid hostel name." });
    }
    if (!contact_phone?.trim() || contact_phone.trim().length > 50) {
      return res.status(400).json({ message: "Enter a valid contact number." });
    }
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (lat == null || lng == null || String(lat).trim() === "" || String(lng).trim() === "" || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "Enter valid hostel GPS coordinates." });
    }
    if (!["boys", "girls"].includes(gender)) {
      return res.status(400).json({ message: "Select a hostel accommodation type." });
    }
    if (campusHostel && !campus_id) {
      return res.status(400).json({ message: "Select a campus." });
    }
    if (independentHostel && (!address?.trim() || address.trim().length > 2000)) {
      return res.status(400).json({ message: "Enter the hostel address." });
    }

    const requiredFields = campusHostel
      ? ["campus_authorization"]
      : ["owner_cnic", "utility_bill", "ownership_proof"];
    for (const field of requiredFields) {
      if (!req.files?.[field]?.[0]) {
        return res.status(400).json({ message: "Upload all required verification documents." });
      }
    }

    for (const file of files) {
      if (!(await validateDocumentSignature(file))) {
        return res.status(400).json({ message: "One of the uploaded files is invalid." });
      }
    }

    if (campusHostel) {
      const campuses = await query(
        "SELECT id, address, city, province FROM campuses WHERE id = ? LIMIT 1",
        [campus_id]
      );
      if (!campuses.length) {
        return res.status(400).json({ message: "Selected campus was not found." });
      }
      campusAddress = campuses[0].address || [campuses[0].city, campuses[0].province].filter(Boolean).join(", ");
    }

    const hostelId = uuidv4();
    connection = createTransactionConnection().promise();
    await connection.connect();
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO hostels
       (id, owner_uid, name, hostel_type, campus_id, address, lat, lng, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hostelId,
        req.user.id,
        name.trim(),
        campusHostel ? "university" : "private",
        campusHostel ? campus_id : null,
        campusHostel ? campusAddress : address.trim(),
        latitude,
        longitude,
        campusHostel ? "pending_campus" : "pending_admin",
      ]
    );
    await connection.query(
      `INSERT INTO hostel_listing_details
       (hostel_id, gender, contact_phone, contact_email)
       VALUES (?, ?, ?, ?)`,
      [hostelId, gender, contact_phone.trim(), req.user.email]
    );

    for (const [field, documentType] of Object.entries(documentFields)) {
      const file = req.files?.[field]?.[0];
      if (!file) continue;
      await connection.query(
        `INSERT INTO hostel_documents
         (id, hostel_id, document_type, file_path, original_name, verification_status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [uuidv4(), hostelId, documentType, file.path, file.originalname.slice(0, 255)]
      );
    }

    await connection.commit();
    registrationSaved = true;
    return res.status(201).json({ message: "Hostel registration submitted for review.", hostelId });
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch { /* transaction may not have started */ }
    }
    console.error("Hostel registration error:", err);
    return res.status(500).json({ message: "Could not submit hostel registration." });
  } finally {
    if (!registrationSaved) {
      await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
    }
    if (connection) {
      try { await connection.end(); } catch { /* connection may already be closed */ }
    }
  }
};

export const getHostelReviewQueue = async (req, res) => {
  try {
    const isCampusReviewer = req.user.role === "campus";
    const hostels = await query(
      `SELECT h.id, h.name, h.hostel_type, h.campus_id, h.address, h.status,
              h.floors, h.lat, h.lng, h.created_at,
              s.name AS owner_name, s.email AS owner_email,
              d.gender, d.contact_phone, d.contact_email, d.description AS about,
              c.name AS campus_name,
              (SELECT COUNT(*) FROM hostel_rooms r
               WHERE r.hostel_id = h.id) AS room_types,
              (SELECT COALESCE(SUM(r.total_rooms), 0) FROM hostel_rooms r
               WHERE r.hostel_id = h.id) AS total_rooms,
              (SELECT MIN(r.monthly_rent) FROM hostel_rooms r
               WHERE r.hostel_id = h.id) AS rent_min,
              (SELECT MAX(r.monthly_rent) FROM hostel_rooms r
               WHERE r.hostel_id = h.id) AS rent_max,
              (SELECT ha.reason FROM hostel_approvals ha
               WHERE ha.hostel_id = h.id AND ha.decision = 'rejected'
               ORDER BY ha.reviewed_at DESC LIMIT 1) AS review_reason
       FROM hostels h
       JOIN Student_signup s ON s.id = h.owner_uid
       LEFT JOIN hostel_listing_details d ON d.hostel_id = h.id
       LEFT JOIN campuses c ON c.id = h.campus_id
       WHERE ${isCampusReviewer
         ? "h.hostel_type = 'university' AND h.status IN ('pending_campus', 'approved', 'rejected') AND c.campus_admin_uid = ?"
         : "h.hostel_type = 'private' AND h.status IN ('pending_admin', 'approved', 'rejected')"}
       ORDER BY h.created_at ASC`,
      isCampusReviewer ? [req.user.id] : []
    );

    if (hostels.length) {
      const ids = hostels.map((hostel) => hostel.id);
      const placeholders = ids.map(() => "?").join(",");
      const [documents, photos] = await Promise.all([
        query(
          `SELECT id, hostel_id, document_type, original_name, verification_status
           FROM hostel_documents WHERE hostel_id IN (${placeholders})`,
          ids
        ),
        query(
          `SELECT id, hostel_id, image_url, caption, is_cover
           FROM hostel_photos WHERE hostel_id IN (${placeholders})
           ORDER BY is_cover DESC, created_at DESC LIMIT 200`,
          ids
        ),
      ]);
      const groupBy = (rows) => {
        const map = new Map();
        for (const row of rows) {
          if (!map.has(row.hostel_id)) map.set(row.hostel_id, []);
          map.get(row.hostel_id).push(row);
        }
        return map;
      };
      const docsByHostel = groupBy(documents);
      const photosByHostel = groupBy(photos);
      hostels.forEach((hostel) => {
        hostel.documents = docsByHostel.get(hostel.id) || [];
        hostel.photos = (photosByHostel.get(hostel.id) || []).slice(0, 6);
      });
    }

    return res.json({ hostels });
  } catch (err) {
    console.error("Hostel review queue error:", err);
    return res.status(500).json({ message: "Could not load hostel review requests." });
  }
};

export const reviewHostelRegistration = async (req, res) => {
  const { decision, reason = "" } = req.body || {};
  const isCampusReviewer = req.user.role === "campus";
  if (typeof reason !== "string") {
    return res.status(400).json({ message: "Invalid rejection reason." });
  }
  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ message: "Choose approve or reject." });
  }
  if (decision === "rejected" && reason.trim().length < 10) {
    return res.status(400).json({ message: "Provide a rejection reason of at least 10 characters." });
  }

  let connection;
  try {
    const rows = await query(
      `SELECT h.id, h.hostel_type, h.status, h.campus_id
       FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       WHERE h.id = ? ${isCampusReviewer ? "AND c.campus_admin_uid = ?" : ""}
       LIMIT 1`,
      isCampusReviewer ? [req.params.id, req.user.id] : [req.params.id]
    );
    const hostel = rows[0];
    const expectedType = isCampusReviewer ? "university" : "private";
    const expectedStatus = isCampusReviewer ? "pending_campus" : "pending_admin";
    if (!hostel || hostel.hostel_type !== expectedType || hostel.status !== expectedStatus) {
      return res.status(404).json({ message: "Pending hostel review request not found." });
    }

    connection = createTransactionConnection().promise();
    await connection.connect();
    await connection.beginTransaction();
    const nextStatus = decision === "approved" ? "approved" : "rejected";
    const [updated] = await connection.query(
      "UPDATE hostels SET status = ? WHERE id = ? AND status = ?",
      [nextStatus, hostel.id, expectedStatus]
    );
    if (!updated.affectedRows) {
      await connection.rollback();
      return res.status(409).json({ message: "This hostel request has already been reviewed." });
    }
    await connection.query(
      "UPDATE hostel_documents SET verification_status = ? WHERE hostel_id = ?",
      [decision === "approved" ? "verified" : "rejected", hostel.id]
    );
    await connection.query(
      `INSERT INTO hostel_approvals (id, hostel_id, reviewer_uid, reviewer_role, decision, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), hostel.id, req.user.id, isCampusReviewer ? "campus" : "admin", decision, reason.trim() || null]
    );
    await connection.commit();
    return res.json({ message: decision === "approved" ? "Hostel approved. Dashboard access is now enabled." : "Hostel registration rejected.", status: nextStatus });
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch { /* transaction may not have started */ }
    }
    console.error("Hostel review action error:", err);
    return res.status(500).json({ message: "Could not update hostel review." });
  } finally {
    if (connection) {
      try { await connection.end(); } catch { /* connection may already be closed */ }
    }
  }
};

export const resubmitHostelRegistration = async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, hostel_type, status FROM hostels WHERE id = ? AND owner_uid = ? LIMIT 1",
      [req.params.id, req.user.id]
    );
    const hostel = rows[0];
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });
    if (hostel.status !== "rejected") {
      return res.status(409).json({ message: "Only a rejected hostel registration can be resubmitted." });
    }

    const nextStatus = hostel.hostel_type === "university" ? "pending_campus" : "pending_admin";
    await query("UPDATE hostels SET status = ? WHERE id = ?", [nextStatus, hostel.id]);
    await query(
      "UPDATE hostel_documents SET verification_status = 'pending' WHERE hostel_id = ?",
      [hostel.id]
    );

    return res.json({
      status: nextStatus,
      message: nextStatus === "pending_campus"
        ? "Hostel resubmitted for campus admin review."
        : "Hostel resubmitted for super admin review.",
    });
  } catch (err) {
    console.error("Hostel resubmit error:", err);
    return res.status(500).json({ message: "Could not resubmit hostel registration." });
  }
};

export const downloadHostelReviewDocument = async (req, res) => {
  try {
    const isCampusReviewer = req.user.role === "campus";
    const hostels = await query(
      `SELECT h.id FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       WHERE h.id = ? ${isCampusReviewer
         ? "AND h.hostel_type = 'university' AND h.status IN ('pending_campus', 'approved', 'rejected') AND c.campus_admin_uid = ?"
         : "AND h.hostel_type = 'private' AND h.status IN ('pending_admin', 'approved', 'rejected')"}
       LIMIT 1`,
      isCampusReviewer ? [req.params.id, req.user.id] : [req.params.id]
    );
    if (!hostels.length) return res.status(404).json({ message: "Review request not found." });
    const documents = await query(
      "SELECT file_path, original_name FROM hostel_documents WHERE id = ? AND hostel_id = ? LIMIT 1",
      [req.params.documentId, req.params.id]
    );
    if (!documents.length) return res.status(404).json({ message: "Document not found." });
    return res.download(documents[0].file_path, documents[0].original_name || "hostel-document");
  } catch (err) {
    console.error("Hostel review document error:", err);
    return res.status(500).json({ message: "Could not open verification document." });
  }
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

const ownedByRole = (hostel, role) =>
  hostel?.hostel_type === (role === "campus_hostel" ? "university" : "private");

// POST /api/hostels
export const createHostel = async (req, res) => {
  try {
    const data = req.body || {};
    const error = validateHostel(data);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const campusId = data.campus_id || null;

    if (data.hostel_type !== (req.user.role === "campus_hostel" ? "university" : "private")) {
      return res.status(403).json({ message: "Hostel category does not match this account." });
    }

    if (!(await checkCampus(campusId))) {
      return res.status(400).json({
        message: "Selected campus does not exist",
      });
    }

    const id = uuidv4();

    const status = req.user.role === "campus_hostel" ? "pending_campus" : "pending_admin";
    await query(
      `INSERT INTO hostels
       (id, owner_uid, name, hostel_type, campus_id,
        address, lat, lng, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        data.name.trim(),
        data.hostel_type,
        campusId,
        data.address || null,
        data.lat == null ? null : Number(data.lat),
        data.lng == null ? null : Number(data.lng),
        status,
      ]
    );

    const hostel = await getOwnedHostel(id, req.user.id);

    return res.status(201).json({
      message: "Hostel registration created and submitted for approval",
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
      `SELECT h.*, c.name AS campus_name, d.gender, d.contact_phone,
              (SELECT ha.reason FROM hostel_approvals ha
               WHERE ha.hostel_id = h.id AND ha.decision = 'rejected'
               ORDER BY ha.reviewed_at DESC LIMIT 1) AS review_reason
       FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       LEFT JOIN hostel_listing_details d ON d.hostel_id = h.id
       WHERE h.owner_uid = ?
       ORDER BY h.created_at DESC`,
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

    if (!ownedByRole(hostel, req.user.role)) {
      return res.status(403).json({ message: "This hostel does not belong to your account type." });
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

    if (!ownedByRole(existing, req.user.role)) {
      return res.status(403).json({ message: "This hostel does not belong to your account type." });
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

    await query(
      `UPDATE hostels
       SET name = ?, hostel_type = ?, campus_id = ?,
           address = ?, lat = ?, lng = ?
       WHERE id = ? AND owner_uid = ?`,
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
    const hostel = await getOwnedHostel(req.params.id, req.user.id);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    if (!ownedByRole(hostel, req.user.role)) {
      return res.status(403).json({ message: "This hostel does not belong to your account type." });
    }

    const result = await query(
      `DELETE FROM hostels
       WHERE id = ? AND owner_uid = ?`,
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Hostel not found",
      });
    }

    return res.json({
      message: "Hostel deleted successfully",
    });
  } catch (err) {
    console.error("Delete hostel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
