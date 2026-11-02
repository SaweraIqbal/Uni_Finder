import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../../config/db.js";
const promiseDb = db.promise();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(
  __dirname, "..", "..", "uploads", "hostels"
);

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const serverError = (res, err) => {
  console.error("Hostel module error:", err);
  return res.status(500).json({ message: "Server error" });
};

const checkOwner = async (req, res, editable = false) => {
  const rows = await query(
    `SELECT id, status FROM hostels
     WHERE id = ? AND owner_uid = ? LIMIT 1`,
    [req.params.id, req.user.id]
  );

  if (!rows.length) {
    res.status(404).json({ message: "Hostel not found" });
    return false;
  }

  if (editable && rows[0].status !== "draft") {
    res.status(409).json({
      message: "Only draft hostels can be edited",
    });
    return false;
  }

  return true;
};

const removeFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") console.error(err);
  }
};

const storedFile = (filename) => {
  if (!/^[a-f0-9-]{36}\.(jpg|jpeg|png|webp|pdf)$/i.test(filename)) {
    return null;
  }
  return path.join(uploadRoot, filename);
};

const validateFileBytes = async (file) => {
  const handle = await fs.open(file.path, "r");
  let bytes;
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, 16, 0);
    bytes = buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }

  const ext = path.extname(file.filename).toLowerCase();
  const hex = bytes.toString("hex");

  if (ext === ".jpg" || ext === ".jpeg") {
    return hex.startsWith("ffd8ff");
  }
  if (ext === ".png") {
    return hex.startsWith("89504e470d0a1a0a");
  }
  if (ext === ".pdf") {
    return bytes.toString("ascii", 0, 5) === "%PDF-";
  }
  if (ext === ".webp") {
    return bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
};

// ---------------- ROOMS ----------------

const validateRoom = (room) => {
  if (
    typeof room.room_type !== "string" ||
    !room.room_type.trim() ||
    room.room_type.length > 100
  ) return "Invalid room type";

  const validInt = (n, min = 0) =>
    Number.isSafeInteger(n) && n >= min;

  if (!validInt(room.total_rooms)) return "Invalid total rooms";
  if (!validInt(room.beds_per_room, 1)) return "Invalid beds per room";

  if (
    !validInt(room.available_beds) ||
    room.available_beds > room.total_rooms * room.beds_per_room
  ) return "Invalid available beds";

  if (
    typeof room.monthly_rent !== "number" ||
    !Number.isFinite(room.monthly_rent) ||
    room.monthly_rent < 0 ||
    room.monthly_rent > 99999999
  ) return "Invalid monthly rent";

  if (
    room.description != null &&
    typeof room.description !== "string"
  ) return "Invalid description";

  return null;
};

const roomFields = [
  "room_type", "total_rooms", "beds_per_room",
  "available_beds", "monthly_rent", "description",
];

export const addRoom = async (req, res) => {
  try {
    if (!(await checkOwner(req, res, true))) return;

    const data = req.body || {};
    const error = validateRoom(data);
    if (error) return res.status(400).json({ message: error });

    const id = uuidv4();

    await query(
      `INSERT INTO hostel_rooms
       (id, hostel_id, room_type, total_rooms,
        beds_per_room, available_beds, monthly_rent, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.params.id, data.room_type.trim(),
        data.total_rooms, data.beds_per_room,
        data.available_beds, data.monthly_rent,
        data.description || null,
      ]
    );

    return res.status(201).json({
      message: "Room added successfully",
      roomId: id,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

export const getRooms = async (req, res) => {
  try {
    if (!(await checkOwner(req, res))) return;

    const rooms = await query(
      "SELECT * FROM hostel_rooms WHERE hostel_id = ?",
      [req.params.id]
    );

    return res.json({ rooms });
  } catch (err) {
    return serverError(res, err);
  }
};

export const updateRoom = async (req, res) => {
  try {
    if (!(await checkOwner(req, res, true))) return;

    const rows = await query(
      `SELECT * FROM hostel_rooms
       WHERE id = ? AND hostel_id = ? LIMIT 1`,
      [req.params.roomId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Room not found" });
    }

    const body = req.body || {};
    const keys = Object.keys(body);

    if (!keys.length || keys.some(k => !roomFields.includes(k))) {
      return res.status(400).json({ message: "Invalid fields" });
    }

    const data = { ...rows[0], ...body };
    const error = validateRoom(data);
    if (error) return res.status(400).json({ message: error });

    await query(
      `UPDATE hostel_rooms SET
       room_type = ?, total_rooms = ?, beds_per_room = ?,
       available_beds = ?, monthly_rent = ?, description = ?
       WHERE id = ? AND hostel_id = ?`,
      [
        data.room_type.trim(), data.total_rooms,
        data.beds_per_room, data.available_beds,
        data.monthly_rent, data.description || null,
        req.params.roomId, req.params.id,
      ]
    );

    return res.json({ message: "Room updated successfully" });
  } catch (err) {
    return serverError(res, err);
  }
};

export const deleteRoom = async (req, res) => {
  try {
    if (!(await checkOwner(req, res, true))) return;

    const result = await query(
      "DELETE FROM hostel_rooms WHERE id = ? AND hostel_id = ?",
      [req.params.roomId, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Room not found" });
    }

    return res.json({ message: "Room deleted successfully" });
  } catch (err) {
    return serverError(res, err);
  }
};

// ---------------- LISTING DETAILS ----------------

const listingFields = [
  "description", "gender", "contact_phone", "contact_email",
  "amenities", "mess_details", "additional_fees",
  "hostel_rules", "check_in_time", "check_out_time",
];

const jsonFields = new Set([
  "amenities", "mess_details", "additional_fees",
]);

const limits = {
  gender: 30,
  contact_phone: 50,
  contact_email: 254,
  check_in_time: 30,
  check_out_time: 30,
};

const formatListing = (row) => {
  if (!row) return null;

  for (const key of jsonFields) {
    if (typeof row[key] === "string") {
      try {
        row[key] = JSON.parse(row[key]);
      } catch {
        // Keep original value
      }
    }
  }

  return row;
};

export const getListing = async (req, res) => {
  try {
    if (!(await checkOwner(req, res))) return;

    const rows = await query(
      "SELECT * FROM hostel_listing_details WHERE hostel_id = ?",
      [req.params.id]
    );

    return res.json({ listing: formatListing(rows[0]) });
  } catch (err) {
    return serverError(res, err);
  }
};

export const saveListing = async (req, res) => {
  try {
    if (!(await checkOwner(req, res, true))) return;

    const body = req.body || {};
    const keys = Object.keys(body);

    if (
      !keys.length ||
      keys.some(key => !listingFields.includes(key))
    ) {
      return res.status(400).json({
        message: "Invalid listing fields",
      });
    }

    for (const key of keys) {
      const value = body[key];
      if (value === null) continue;

      if (jsonFields.has(key)) {
        if (
          typeof value !== "object" ||
          (Array.isArray(value) && key !== "amenities")
        ) {
          return res.status(400).json({
            message: `Invalid ${key}`,
          });
        }
      } else if (
        typeof value !== "string" ||
        (limits[key] && value.length > limits[key])
      ) {
        return res.status(400).json({
          message: `Invalid ${key}`,
        });
      }
    }

    const columns = keys.map(k => `\`${k}\``).join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const updates = keys
      .map(k => `\`${k}\` = VALUES(\`${k}\`)`)
      .join(", ");

    const values = keys.map(key =>
      jsonFields.has(key) && body[key] !== null
        ? JSON.stringify(body[key])
        : body[key]
    );

    await query(
      `INSERT INTO hostel_listing_details
       (hostel_id, ${columns})
       VALUES (?, ${placeholders})
       ON DUPLICATE KEY UPDATE ${updates}`,
      [req.params.id, ...values]
    );

    return res.json({
      message: "Listing details saved successfully",
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// ---------------- PHOTOS ----------------


export const addPhoto = async (req, res) => {
  try {
    if (!(await checkOwner(req, res, true))) {
      await removeFile(req.file?.path);
      return;
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Photo required",
      });
    }

    if (!(await validateFileBytes(req.file))) {
      await removeFile(req.file.path);
      return res.status(400).json({
        message: "Invalid image file",
      });
    }

    const caption = req.body?.caption ?? null;

    if (
      caption !== null &&
      (typeof caption !== "string" || caption.length > 255)
    ) {
      await removeFile(req.file.path);
      return res.status(400).json({
        message: "Invalid caption",
      });
    }

    const id = uuidv4();

    const imageUrl =
      `/uploads/hostels/photos/${req.file.filename}`;

    await promiseDb.query(
      `INSERT INTO hostel_photos
       (id, hostel_id, image_url, caption, is_cover)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        req.params.id,
        imageUrl,
        caption,
        0,
      ]
    );

    return res.status(201).json({
      message: "Photo uploaded successfully",
      photoId: id,
      image_url: imageUrl,
    });

  } catch (err) {
    await removeFile(req.file?.path);
    return serverError(res, err);
  }
};


export const getPhotos = async (req, res) => {
  try {
    if (!(await checkOwner(req, res))) return;

    const photos = await query(
      "SELECT * FROM hostel_photos WHERE hostel_id = ?",
      [req.params.id]
    );

    return res.json({ photos });
  } catch (err) {
    return serverError(res, err);
  }
};

export const deletePhoto = async (req, res) => {
  try {
    if (!(await checkOwner(req, res, true))) return;

    const rows = await query(
      `SELECT image_url FROM hostel_photos
       WHERE id = ? AND hostel_id = ?`,
      [req.params.photoId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Photo not found" });
    }

    await query(
      "DELETE FROM hostel_photos WHERE id = ? AND hostel_id = ?",
      [req.params.photoId, req.params.id]
    );

    const filename = path.basename(rows[0].image_url);
    const filePath = storedFile(filename);
    if (filePath) await removeFile(filePath);

    return res.json({ message: "Photo deleted successfully" });
  } catch (err) {
    return serverError(res, err);
  }
};

// ---------------- DOCUMENTS ----------------

const documentTypes = [
  "ownership_proof",
  "lease_agreement",
  "management_authorization",
  "registration_certificate",
  "other",
];

export const addDocument = async (req, res) => {
  try {
    if (!(await checkOwner(req, res, true))) {
      await removeFile(req.file?.path);
      return;
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Document required",
      });
    }

    if (!(await validateFileBytes(req.file))) {
      await removeFile(req.file.path);
      return res.status(400).json({
        message: "Invalid document file",
      });
    }

    const type = req.body?.document_type;

  const allowedTypes = ["cnic", "ownership", "utility"];

if (!allowedTypes.includes(req.body.document_type)) {
  return res.status(400).json({
    message: "Invalid document type",
  });
}

    const id = uuidv4();
    const filePath = `/uploads/hostels/${req.file.filename}`;

    await query(
      `INSERT INTO hostel_documents
       (id, hostel_id, document_type, file_path, original_name)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id, req.params.id, type, filePath,
        req.file.originalname.slice(0, 255),
      ]
    );

    return res.status(201).json({
      message: "Document uploaded successfully",
      documentId: id,
      verification_status: "pending",
    });
  } catch (err) {
    await removeFile(req.file?.path);
    return serverError(res, err);
  }
};

export const getDocuments = async (req, res) => {
  try {
    if (!(await checkOwner(req, res))) return;

    const documents = await query(
      `SELECT id, hostel_id, document_type,
              original_name, verification_status, uploaded_at
       FROM hostel_documents
       WHERE hostel_id = ?`,
      [req.params.id]
    );

    return res.json({ documents });
  } catch (err) {
    return serverError(res, err);
  }
};

export const deleteDocument = async (req, res) => {
  try {
    if (!(await checkOwner(req, res, true))) return;

    const rows = await query(
      `SELECT file_path FROM hostel_documents
       WHERE id = ? AND hostel_id = ?`,
      [req.params.documentId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    await query(
      `DELETE FROM hostel_documents
       WHERE id = ? AND hostel_id = ?`,
      [req.params.documentId, req.params.id]
    );

    const filename = path.basename(rows[0].file_path);
    const filePath = storedFile(filename);
    if (filePath) await removeFile(filePath);

    return res.json({
      message: "Document deleted successfully",
    });
  } catch (err) {
    return serverError(res, err);
  }
};
