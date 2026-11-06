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

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toRad = (value) => (value * Math.PI) / 180;
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const HOSTEL_COLUMNS = `id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min,
  walk_dist, distance_km, latitude, longitude, address, status, amenities, rooms_detail,
  contact, hostel_available, created_at, updated_at`;

const photoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "uploads", "hostels", "campus");

const shapeHostel = (row, photos = []) => ({
  ...row,
  amenities:    safe(row.amenities)    || [],
  rooms_detail: safe(row.rooms_detail) || [],
  photos,
  cover_url: photos.find((p) => p.is_cover)?.image_url || photos[0]?.image_url || null,
});

const attachPhotos = async (hostels) => {
  if (!hostels.length) return hostels.map((h) => shapeHostel(h));

  const ids = hostels.map((h) => h.id);
  const rows = await q(
    `SELECT id, hostel_id, image_url, caption, is_cover, sort_order
     FROM campus_hostel_photos
     WHERE hostel_id IN (${ids.map(() => "?").join(",")})
     ORDER BY is_cover DESC, sort_order ASC, created_at ASC`,
    ids
  );

  const byHostel = new Map();
  for (const photo of rows) {
    if (!byHostel.has(photo.hostel_id)) byHostel.set(photo.hostel_id, []);
    byHostel.get(photo.hostel_id).push(photo);
  }

  return hostels.map((h) => shapeHostel(h, byHostel.get(h.id) || []));
};

const removePhotoFile = async (imageUrl) => {
  if (!imageUrl?.startsWith("/uploads/hostels/campus/")) return;
  const file = path.join(photoRoot, path.basename(imageUrl));
  try { await fs.promises.unlink(file); } catch { /* already gone */ }
};

const storePhotos = async (hostelId, files, coverFileId) => {
  const photos = Array.isArray(files) ? files : [];
  let order = 0;

  for (const file of photos) {
    await q(
      `INSERT INTO campus_hostel_photos (id, hostel_id, image_url, is_cover, sort_order)
       VALUES (?,?,?,?,?)`,
      [
        file.id,
        hostelId,
        `/uploads/hostels/campus/${file.filename}`,
        file.id === coverFileId ? 1 : 0,
        order++,
      ]
    );
  }

  return photos.length;
};

const parseFormArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
};

// ════════════════════════════════════════════════════════════════════════════
// POST /api/campus/:campusId/hostels  — campus admin adds a hostel (goes live)
// ════════════════════════════════════════════════════════════════════════════
export const addHostel = async (req, res) => {
  const { campusId } = req.params;
  const {
    name, hostel_type = "Campus Hostel", gender = "Boys",
    rooms, rent_min, walk_dist, distance_km, latitude, longitude, contact, address, amenities,
  } = req.body;

  const uploaded = [...(req.files?.cover || []), ...(req.files?.photos || [])];

  if (!name?.trim()) {
    await Promise.all(uploaded.map((f) => removePhotoFile(`/uploads/hostels/campus/${f.filename}`)));
    return res.status(400).json({ message: "Hostel name is required." });
  }

  const hostelDistance = toNumberOrNull(distance_km);
  const hostelLat = toNumberOrNull(latitude);
  const hostelLng = toNumberOrNull(longitude);

  if (hostelDistance !== null && (hostelDistance < 0 || hostelDistance > 5)) {
    return res.status(400).json({ message: "Distance from campus must be between 0 and 5 km." });
  }
  if ((hostelLat !== null && (hostelLat < -90 || hostelLat > 90)) || (hostelLng !== null && (hostelLng < -180 || hostelLng > 180))) {
    return res.status(400).json({ message: "Latitude and longitude must be valid GPS coordinates." });
  }
  if ((hostelLat !== null) !== (hostelLng !== null)) {
    return res.status(400).json({ message: "Latitude and longitude must be provided together." });
  }

  try {
    const campusRows = await q("SELECT lat, lng FROM campuses WHERE id = ? LIMIT 1", [campusId]);

    const campusLat = toNumberOrNull(campusRows[0]?.lat);
    const campusLng = toNumberOrNull(campusRows[0]?.lng);

    if (hostelLat !== null && campusLat !== null && campusLng !== null) {
      if (haversineKm(campusLat, campusLng, hostelLat, hostelLng) > 5) {
        return res.status(400).json({ message: "Hostel must be within 5 km of the campus." });
      }
    }

    const finalDistance = hostelDistance ?? (
      hostelLat !== null && campusLat !== null && campusLng !== null
        ? Number(haversineKm(campusLat, campusLng, hostelLat, hostelLng).toFixed(1))
        : null
    );

    if (finalDistance !== null && (finalDistance < 0 || finalDistance > 5)) {
      return res.status(400).json({ message: "Hostel distance must be between 0 and 5 km." });
    }

    const { v4: uuidv4 } = await import("uuid");
    const id = uuidv4();

    await q(
      `INSERT INTO campus_hostels
         (id, campus_id, name, hostel_type, gender, rooms, rent_min, walk_dist, distance_km,
          latitude, longitude, address, contact, amenities, status)
       VALUES (?, ?, ?, ?, ?,
               ?, ?, ?, ?, ?,
               ?, ?, ?, ?, ?)`,
      [
        id, campusId,
        name.trim(), hostel_type, gender,
        toNumberOrNull(rooms),
        rent_min || null,
        walk_dist || null,
        finalDistance !== null ? finalDistance.toFixed(1) : null,
        hostelLat,
        hostelLng,
        address?.trim() || null,
        contact || null,
        JSON.stringify(parseFormArray(amenities)),
        "live",
      ]
    );

    const photoCount = await storePhotos(id, uploaded, req.files?.cover?.[0]?.id);

    return res.status(201).json({
      message: "Hostel is now live on your campus page.",
      id,
      photos: photoCount,
    });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// GET /api/campus/:campusId/hostels
export const listHostels = async (req, res) => {
  try {
    const [hostels, campus] = await Promise.all([
      q(`SELECT ${HOSTEL_COLUMNS} FROM campus_hostels WHERE campus_id=? ORDER BY created_at ASC`,
        [req.params.campusId]),
      q("SELECT hostel_available FROM campuses WHERE id=?", [req.params.campusId]),
    ]);

    return res.json({
      hostel_available: campus[0]?.hostel_available ?? 1,
      hostels: await attachPhotos(hostels),
    });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// PUT /api/campus/:campusId/hostel-availability
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
// POST /api/campus/hostels/:hostelId/photos — add more images later
// ════════════════════════════════════════════════════════════════════════════
export const addHostelPhotos = async (req, res) => {
  const { hostelId } = req.params;
  const files = Array.isArray(req.files) ? req.files : (req.files?.photos || []);

  try {
    const hostel = await q("SELECT id FROM campus_hostels WHERE id=?", [hostelId]);
    if (!hostel.length) return res.status(404).json({ message: "Hostel not found." });

    if (!files.length) return res.status(400).json({ message: "No image received." });

    const [countRow] = await q(
      "SELECT COUNT(*) AS c FROM campus_hostel_photos WHERE hostel_id=?",
      [hostelId]
    );
    const existingCover = await q(
      "SELECT id FROM campus_hostel_photos WHERE hostel_id=? AND is_cover=1 LIMIT 1",
      [hostelId]
    );

    let added = 0;
    for (const file of files) {
      await q(
        `INSERT INTO campus_hostel_photos (id, hostel_id, image_url, is_cover, sort_order)
         VALUES (?,?,?,?,?)`,
        [
          file.id,
          hostelId,
          `/uploads/hostels/campus/${file.filename}`,
          !existingCover.length && added === 0 ? 1 : 0,
          countRow.c + added,
        ]
      );
      added++;
    }

    return res.status(201).json({ message: `${added} image(s) added.`, added });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/campus/hostels/:hostelId/photos/:photoId/cover
// ════════════════════════════════════════════════════════════════════════════
export const setHostelCover = async (req, res) => {
  try {
    const rows = await q(
      "SELECT id FROM campus_hostel_photos WHERE id=? AND hostel_id=?",
      [req.params.photoId, req.params.hostelId]
    );
    if (!rows.length) return res.status(404).json({ message: "Photo not found." });

    await q("UPDATE campus_hostel_photos SET is_cover=0 WHERE hostel_id=?", [req.params.hostelId]);
    await q("UPDATE campus_hostel_photos SET is_cover=1 WHERE id=?", [req.params.photoId]);

    return res.json({ message: "Cover image updated." });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/campus/hostels/:hostelId/photos/:photoId
// ════════════════════════════════════════════════════════════════════════════
export const deleteHostelPhoto = async (req, res) => {
  try {
    const rows = await q(
      "SELECT image_url FROM campus_hostel_photos WHERE id=? AND hostel_id=?",
      [req.params.photoId, req.params.hostelId]
    );
    if (!rows.length) return res.status(404).json({ message: "Photo not found." });

    await q("DELETE FROM campus_hostel_photos WHERE id=?", [req.params.photoId]);
    await removePhotoFile(rows[0].image_url);

    const liveCover = await q(
      "SELECT id FROM campus_hostel_photos WHERE hostel_id=? AND is_cover=1 LIMIT 1",
      [req.params.hostelId]
    );
    if (!liveCover.length) {
      const fallback = await q(
        "SELECT id FROM campus_hostel_photos WHERE hostel_id=? ORDER BY sort_order ASC LIMIT 1",
        [req.params.hostelId]
      );
      if (fallback.length) {
        await q("UPDATE campus_hostel_photos SET is_cover=1 WHERE id=?", [fallback[0].id]);
      }
    }

    return res.json({ message: "Photo deleted." });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

