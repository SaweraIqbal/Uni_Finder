import { v4 as uuidv4 } from "uuid";
import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import db, { createTransactionConnection } from "../../../shared/db.js";
import {
  evaluateHostelCompletion,
  listingAmenityNames,
} from "../hostelCompleteness.js";

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const loadHostelSources = async (hostelIds) => {
  const bundles = new Map(
    hostelIds.map((id) => [id, { rooms: [], photos: [], listing: null }])
  );

  if (!hostelIds.length) return bundles;

  const placeholders = hostelIds.map(() => "?").join(",");
  const [rooms, photos, listings] = await Promise.all([
    query(
      `SELECT * FROM hostel_rooms WHERE hostel_id IN (${placeholders})`,
      hostelIds
    ),
    query(
      `SELECT * FROM hostel_photos WHERE hostel_id IN (${placeholders})
       ORDER BY is_cover DESC, created_at ASC`,
      hostelIds
    ),
    query(
      `SELECT * FROM hostel_listing_details WHERE hostel_id IN (${placeholders})`,
      hostelIds
    ),
  ]);

  for (const room of rooms) bundles.get(room.hostel_id)?.rooms.push(room);
  for (const photo of photos) bundles.get(photo.hostel_id)?.photos.push(photo);
  for (const listing of listings) {
    const bundle = bundles.get(listing.hostel_id);
    if (bundle) bundle.listing = listing;
  }

  return bundles;
};

const withCompletion = (hostel, bundle) => ({
  ...hostel,
  completion: evaluateHostelCompletion(hostel, bundle),
});

const parseJsonValue = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const amenityList = (value) => {
  const amenities = parseJsonValue(value, {});
  const source = Array.isArray(amenities)
    ? amenities
    : [
        ...(Array.isArray(amenities?.inRoom?.items) ? amenities.inRoom.items : []),
        ...(Array.isArray(amenities?.facilities) ? amenities.facilities : []),
      ];
  return source
    .map((item) => (typeof item === "string" ? item : item?.name))
    .filter(Boolean);
};

const ruleList = (value) => {
  const rules = parseJsonValue(value, []);
  const list = Array.isArray(rules) ? rules : typeof rules === "string" ? [rules] : [];
  return list
    .map((rule) =>
      typeof rule === "string"
        ? rule.trim()
        : [rule?.category, rule?.text].filter(Boolean).join(": ")
    )
    .filter(Boolean);
};

const otherFees = (fees = {}) =>
  Object.entries(fees || {})
    .filter(([key, value]) => key !== "security" && key !== "inquiry" && value != null && value !== "")
    .map(([key, value]) =>
      typeof value === "object"
        ? { label: key, amount: value.amount ?? value.fee ?? value.value ?? "" }
        : { label: key, amount: value }
    );

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
      try { await connection.rollback(); } catch {}
    }
    console.error("Hostel registration error:", err);
    return res.status(500).json({ message: "Could not submit hostel registration." });
  } finally {
    if (!registrationSaved) {
      await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
    }
    if (connection) {
      try { await connection.end(); } catch {}
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
         ? "h.hostel_type = 'university' AND h.status IN ('pending_campus', 'pending_admin', 'approved', 'rejected') AND c.campus_admin_uid = ?"
         : "h.status IN ('pending_admin', 'approved', 'rejected')"}
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
    const expectedStatus = isCampusReviewer ? "pending_campus" : "pending_admin";
    const campusMismatch = isCampusReviewer && hostel?.hostel_type !== "university";
    if (!hostel || campusMismatch || hostel.status !== expectedStatus) {
      return res.status(404).json({ message: "Pending hostel review request not found." });
    }

    connection = createTransactionConnection().promise();
    await connection.connect();
    await connection.beginTransaction();

    const nextStatus =
      decision === "rejected"
        ? "rejected"
        : isCampusReviewer
          ? "pending_admin"
          : "approved";
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
      [
        decision === "rejected"
          ? "rejected"
          : isCampusReviewer
            ? "pending"
            : "verified",
        hostel.id,
      ]
    );
    await connection.query(
      `INSERT INTO hostel_approvals (id, hostel_id, reviewer_uid, reviewer_role, decision, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), hostel.id, req.user.id, isCampusReviewer ? "campus" : "admin", decision, reason.trim() || null]
    );
    await connection.commit();
    const message =
      decision === "rejected"
        ? "Hostel registration rejected."
        : isCampusReviewer
          ? "Hostel approved by the campus. It is now forwarded to the super admin for final approval."
          : "Hostel approved by the super admin. Dashboard access is now enabled.";
    return res.json({ message, status: nextStatus });
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch {}
    }
    console.error("Hostel review action error:", err);
    return res.status(500).json({ message: "Could not update hostel review." });
  } finally {
    if (connection) {
      try { await connection.end(); } catch {}
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

    const bundles = await loadHostelSources(hostels.map((hostel) => hostel.id));

    return res.json({
      hostels: hostels.map((hostel) =>
        withCompletion(hostel, bundles.get(hostel.id))
      ),
    });
  } catch (err) {
    console.error("Get hostels error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getHostelCompletion = async (req, res) => {
  try {
    const rows = await query(
      `SELECT h.*, c.name AS campus_name
       FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       WHERE h.id = ? AND h.owner_uid = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const hostel = rows[0];
    if (!ownedByRole(hostel, req.user.role)) {
      return res
        .status(403)
        .json({ message: "This hostel does not belong to your account type." });
    }

    const bundles = await loadHostelSources([hostel.id]);

    return res.json({
      completion: evaluateHostelCompletion(
        hostel,
        bundles.get(hostel.id)
      ),
      hostel,
    });
  } catch (err) {
    console.error("Get hostel completion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getPublicHostels = async (req, res) => {
  try {
    const hostels = await query(
      `SELECT h.*,
              c.name AS campus_name, c.city AS campus_city,
              d.gender
       FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       LEFT JOIN hostel_listing_details d ON d.hostel_id = h.id
       WHERE h.status = 'approved'
       ORDER BY h.created_at DESC
       LIMIT 60`
    );

    const bundles = await loadHostelSources(hostels.map((hostel) => hostel.id));

    const cards = hostels
      .map((hostel) => {
        const bundle = bundles.get(hostel.id);
        const completion = evaluateHostelCompletion(hostel, bundle);
        if (!completion.isLive) return null;

        const cover =
          bundle.photos.find((photo) => Number(photo.is_cover) === 1) ||
          bundle.photos[0] ||
          null;

        return {
          id: hostel.id,
          name: hostel.name,
          hostel_type: hostel.hostel_type,
          type_label:
            hostel.hostel_type === "university"
              ? "Campus Hostel"
              : "Private Hostel",
          gender: bundle.listing?.gender || null,
          campus_name: hostel.campus_name || null,
          location:
            hostel.hostel_type === "university"
              ? hostel.campus_name || hostel.address
              : hostel.address,
          nearby_distance: hostel.nearby_distance || null,
          rent_min: completion.counts.rentMin,
          rent_max: completion.counts.rentMax,
          rooms_count: completion.counts.roomsCount,
          seats_available: completion.counts.seatsAvailable,
          photos_count: completion.counts.photosCount,
          amenities: listingAmenityNames(bundle.listing),
          cover_photo: cover?.image_url || null,
        };
      })
      .filter(Boolean);

    const campusHostels = await query(
      `SELECT ch.*, c.name AS campus_name, c.city AS campus_city, c.cover_image AS campus_cover
       FROM campus_hostels ch
       LEFT JOIN campuses c ON c.id = ch.campus_id
       WHERE ch.status IN ('live', 'approved')
       ORDER BY ch.created_at DESC`
    );

    let photosByHostel = new Map();
    if (campusHostels.length) {
      const placeholders = campusHostels.map(() => "?").join(",");
      const photos = await query(
        `SELECT * FROM campus_hostel_photos
         WHERE hostel_id IN (${placeholders})
         ORDER BY is_cover DESC, sort_order ASC, created_at ASC`,
        campusHostels.map((hostel) => hostel.id)
      );
      photosByHostel = photos.reduce((map, photo) => {
        if (!map.has(photo.hostel_id)) map.set(photo.hostel_id, []);
        map.get(photo.hostel_id).push(photo);
        return map;
      }, new Map());
    }

    const campusCards = campusHostels.map((hostel) => {
      const photos = photosByHostel.get(hostel.id) || [];
      const amenities = parseJsonValue(hostel.amenities, []);
      const rentMin = Number(hostel.rent_min);

      return {
        id: hostel.id,
        name: hostel.name,
        hostel_type: "university",
        type_label: "Campus Hostel",
        gender: hostel.gender ? String(hostel.gender).toLowerCase() : null,
        campus_name: hostel.campus_name || null,
        location: hostel.address || hostel.walk_dist || hostel.campus_name || "",
        nearby_distance:
          hostel.walk_dist ||
          (hostel.distance_km != null ? `${Number(hostel.distance_km)} km from campus` : null),
        rent_min: Number.isFinite(rentMin) ? rentMin : null,
        rent_max: null,
        rooms_count: Number(hostel.rooms || 0),
        seats_available: 0,
        photos_count: photos.length,
        amenities: (Array.isArray(amenities) ? amenities : [])
          .map((item) => (typeof item === "string" ? item : item?.name))
          .filter(Boolean),
        cover_photo: photos[0]?.image_url || hostel.campus_cover || null,
      };
    });

    return res.json({ hostels: [...cards, ...campusCards] });
  } catch (err) {
    console.error("Get public hostels error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getPublicHostelById = async (req, res) => {
  try {
    const rows = await query(
      `SELECT h.*, c.name AS campus_name, c.city AS campus_city,
              c.lat AS campus_lat, c.lng AS campus_lng
       FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       WHERE h.id = ? AND h.status = 'approved'
       LIMIT 1`,
      [req.params.id]
    );

    if (rows.length) {
      const hostel = rows[0];
      const bundle = (await loadHostelSources([hostel.id])).get(hostel.id);
      const completion = evaluateHostelCompletion(hostel, bundle);
      if (!completion.isLive) {
        return res.status(404).json({ message: "This hostel is not published yet." });
      }

      const listing = bundle.listing || {};
      const amenities = parseJsonValue(listing.amenities, {});
      const inRoom = parseJsonValue(amenities?.inRoom, {});
      const facilities = (
        Array.isArray(amenities) ? amenities : parseJsonValue(amenities?.facilities, [])
      ).map((item) =>
        typeof item === "string" ? { name: item, amount: null } : item
      ).filter((item) => item?.name);
      const fees = parseJsonValue(listing.additional_fees, {});
      const security = parseJsonValue(fees?.security, {});
      const messDetails = parseJsonValue(listing.mess_details, {});
      const mess = parseJsonValue(messDetails?.mess, {});
      const menu = mess.menuManual || mess.menu || null;

      return res.json({
        hostel: {
          id: hostel.id,
          source: "registered",
          name: hostel.name,
          hostelType: hostel.hostel_type,
          isCampus: hostel.hostel_type === "university",
          typeLabel:
            hostel.hostel_type === "university" ? "Campus Hostel" : "Private Hostel",
          gender: listing.gender || null,
          campusName: hostel.campus_name || null,
          campusCity: hostel.campus_city || null,
          campusLat: hostel.campus_lat != null ? Number(hostel.campus_lat) : null,
          campusLng: hostel.campus_lng != null ? Number(hostel.campus_lng) : null,
          address: hostel.address || null,
          nearbyDistance: hostel.nearby_distance || null,
          floors: hostel.floors || null,
          lat: hostel.lat != null ? Number(hostel.lat) : null,
          lng: hostel.lng != null ? Number(hostel.lng) : null,
          description: listing.description || null,
          ownerName: hostel.owner_name || null,
          ownerContact: hostel.owner_contact || null,
          wardenName: hostel.warden_name || null,
          wardenContact: hostel.warden_contact || null,
          contactPhone: listing.contact_phone || null,
          contactEmail: listing.contact_email || null,
          inquiryNumber: fees.inquiry || null,
          checkIn: listing.check_in_time || null,
          checkOut: listing.check_out_time || null,
          rentMin: completion.counts.rentMin,
          rentMax: completion.counts.rentMax,
          roomsCount: completion.counts.roomsCount,
          roomTypes: completion.counts.roomTypes,
          totalSeats: completion.counts.totalSeats,
          seatsAvailable: completion.counts.seatsAvailable,
          photos: bundle.photos.map((photo) => ({
            id: photo.id,
            url: photo.image_url,
            caption: photo.caption || null,
            isCover: Number(photo.is_cover) === 1,
          })),
          rooms: bundle.rooms.map((room) => ({
            id: room.id,
            type: room.room_type,
            totalRooms: Number(room.total_rooms || 0),
            bedsPerRoom: Number(room.beds_per_room || 0),
            availableBeds: Number(room.available_beds || 0),
            monthlyRent: Number(room.monthly_rent || 0),
            description: room.description || null,
          })),
          amenities: amenityList(listing.amenities),
          inRoomItems: (Array.isArray(inRoom?.items) ? inRoom.items : [])
            .map((item) => (typeof item === "string" ? item : item?.name))
            .filter(Boolean),
          facilities,
          mess: mess && Object.keys(mess).length
            ? {
                available: mess.available ?? null,
                charges: mess.charges || null,
                menuPhoto: mess.menuPhoto || null,
                menu,
              }
            : null,
          securityFee: security.fee ?? null,
          securityTypes: Array.isArray(security.types) ? security.types : [],
          otherFees: otherFees(fees),
          rules: ruleList(listing.hostel_rules),
        },
      });
    }

    const campusRows = await query(
      `SELECT ch.*, c.name AS campus_name, c.city AS campus_city,
              c.lat AS campus_lat, c.lng AS campus_lng
       FROM campus_hostels ch
       LEFT JOIN campuses c ON c.id = ch.campus_id
       WHERE ch.id = ? AND ch.status IN ('live', 'approved')
       LIMIT 1`,
      [req.params.id]
    );

    if (!campusRows.length) {
      return res.status(404).json({ message: "Hostel not found." });
    }

    const hostel = campusRows[0];
    const photos = await query(
      `SELECT id, image_url, caption, is_cover
       FROM campus_hostel_photos
       WHERE hostel_id = ?
       ORDER BY is_cover DESC, sort_order ASC, created_at ASC`,
      [hostel.id]
    );
    const roomsDetail = parseJsonValue(hostel.rooms_detail, []);
    const rentMin = Number(hostel.rent_min);

    return res.json({
      hostel: {
        id: hostel.id,
        source: "campus",
        name: hostel.name,
        hostelType: "university",
        isCampus: true,
        typeLabel: "Campus Hostel",
        gender: hostel.gender ? String(hostel.gender).toLowerCase() : null,
        campusName: hostel.campus_name || null,
        campusCity: hostel.campus_city || null,
        campusLat: hostel.campus_lat != null ? Number(hostel.campus_lat) : null,
        campusLng: hostel.campus_lng != null ? Number(hostel.campus_lng) : null,
        address: hostel.address || hostel.walk_dist || null,
        nearbyDistance: hostel.walk_dist || null,
        floors: null,
        lat: hostel.latitude != null ? Number(hostel.latitude) : null,
        lng: hostel.longitude != null ? Number(hostel.longitude) : null,
        description: null,
        ownerName: hostel.vendor_name || null,
        ownerContact: hostel.contact || null,
        wardenName: null,
        wardenContact: null,
        contactPhone: hostel.contact || null,
        contactEmail: null,
        inquiryNumber: hostel.contact || null,
        checkIn: null,
        checkOut: null,
        rentMin: Number.isFinite(rentMin) ? rentMin : null,
        rentMax: null,
        roomsCount: Number(hostel.rooms || 0),
        roomTypes: Array.isArray(roomsDetail) ? roomsDetail.length : 0,
        totalSeats: null,
        seatsAvailable: null,
        photos: photos.map((photo) => ({
          id: photo.id,
          url: photo.image_url,
          caption: photo.caption || null,
          isCover: Number(photo.is_cover) === 1,
        })),
        rooms: Array.isArray(roomsDetail) ? roomsDetail : [],
        amenities: (parseJsonValue(hostel.amenities, []) || [])
          .map((item) => (typeof item === "string" ? item : item?.name))
          .filter(Boolean),
        inRoomItems: [],
        facilities: [],
        mess: null,
        securityFee: null,
        securityTypes: [],
        otherFees: [],
        rules: [],
      },
    });
  } catch (err) {
    console.error("Get public hostel detail error:", err);
    return res.status(500).json({ message: "Could not load hostel details." });
  }
};

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
