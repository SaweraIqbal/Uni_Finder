
import db from "../../config/db.js";

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) =>
      err ? reject(err) : resolve(result)
    );
  });

const serverError = (res, err) => {
  console.error("Hostel profile error:", err);
  return res.status(500).json({ message: "Server error" });
};

const owned = async (req, res) => {
  const rows = await query(
    `SELECT h.*, l.description AS about, l.gender, l.contact_phone
     FROM hostels h
     LEFT JOIN hostel_listing_details l ON l.hostel_id = h.id
     WHERE h.id = ? AND h.owner_uid = ?
     LIMIT 1`,
    [req.params.id, req.user.id]
  );

  if (!rows.length) {
    res.status(404).json({ message: "Hostel not found" });
    return null;
  }

  return rows[0];
};

export const getHostelProfile = async (req, res) => {
  try {
    const hostel = await owned(req, res);
    if (!hostel) return;

    const documents = await query(
      `SELECT id, document_type, original_name,
              verification_status, uploaded_at
       FROM hostel_documents
       WHERE hostel_id = ?
       ORDER BY uploaded_at DESC`,
      [req.params.id]
    );

    return res.json({ profile: hostel, documents });
  } catch (err) {
    return serverError(res, err);
  }
};

const allowed = new Set([
  "name", "hostel_type", "campus_id", "address",
  "lat", "lng", "floors",
  "owner_name", "owner_contact",
  "warden_name", "warden_contact",
  "about", "gender", "contact_phone"
]);

const textFields = new Set([
  "name", "address", "owner_name", "owner_contact",
  "warden_name", "warden_contact", "about", "contact_phone"
]);

const lengthLimits = {
  name: 255,
  address: 2000,
  owner_name: 150,
  owner_contact: 50,
  warden_name: 150,
  warden_contact: 50,
  about: 10000,
  contact_phone: 50
};

export const updateHostelProfile = async (req, res) => {
  try {
    const hostel = await owned(req, res);
    if (!hostel) return;

    if (hostel.status !== "draft") {
      return res.status(409).json({
        message: "Only draft hostels can be edited"
      });
    }

    const data = req.body || {};
    const keys = Object.keys(data);

    if (!keys.length || keys.some(k => !allowed.has(k))) {
      return res.status(400).json({
        message: "Invalid profile fields"
      });
    }

    for (const key of keys) {
      const v = data[key];

      if (
        textFields.has(key) &&
        (typeof v !== "string" || v.length > lengthLimits[key])
      ) {
        return res.status(400).json({
          message: `Invalid ${key}`
        });
      }

      if (
        key === "hostel_type" &&
        !["private", "campus"].includes(v)
      ) {
        return res.status(400).json({
          message: "Invalid hostel type"
        });
      }

      if (
        key === "gender" &&
        !["boys", "girls"].includes(v)
      ) {
        return res.status(400).json({
          message: "Invalid gender"
        });
      }

      if (
        key === "floors" &&
        !(Number.isInteger(v) && v >= 1 && v <= 200)
      ) {
        return res.status(400).json({
          message: "Invalid floors"
        });
      }

      if (
        key === "lat" &&
        !(typeof v === "number" &&
          Number.isFinite(v) &&
          v >= -90 && v <= 90)
      ) {
        return res.status(400).json({
          message: "Invalid latitude"
        });
      }

      if (
        key === "lng" &&
        !(typeof v === "number" &&
          Number.isFinite(v) &&
          v >= -180 && v <= 180)
      ) {
        return res.status(400).json({
          message: "Invalid longitude"
        });
      }

      if (
        key === "campus_id" &&
        v !== null &&
        (typeof v !== "string" || v.length > 64)
      ) {
        return res.status(400).json({
          message: "Invalid campus"
        });
      }
    }

    const nextType = data.hostel_type ?? hostel.hostel_type;

    const nextCampus = Object.hasOwn(data, "campus_id")
      ? data.campus_id
      : hostel.campus_id;

    if (nextType === "campus" && !nextCampus) {
      return res.status(400).json({
        message: "Campus hostel requires campus_id"
      });
    }

    if (
      nextType === "private" &&
      Object.hasOwn(data, "campus_id") &&
      data.campus_id !== null
    ) {
      return res.status(400).json({
        message: "Private hostel campus_id must be null"
      });
    }

    if (nextCampus) {
      const campus = await query(
        "SELECT id FROM campuses WHERE id = ? LIMIT 1",
        [nextCampus]
      );

      if (!campus.length) {
        return res.status(400).json({
          message: "Campus not found"
        });
      }
    }

    const listingKeys = keys.filter(k =>
      ["about", "gender", "contact_phone"].includes(k)
    );

    const hostelKeys = keys.filter(k =>
      !["about", "gender", "contact_phone"].includes(k)
    );

    if (hostelKeys.length) {
      await query(
        `UPDATE hostels
         SET ${hostelKeys.map(k => `\`${k}\` = ?`).join(", ")}
         WHERE id = ? AND owner_uid = ? AND status = 'draft'`,
        [
          ...hostelKeys.map(k => data[k]),
          req.params.id,
          req.user.id
        ]
      );
    }

    if (listingKeys.length) {
      const map = {
        about: "description",
        gender: "gender",
        contact_phone: "contact_phone"
      };

      const cols = listingKeys.map(k => map[k]);

      await query(
        `INSERT INTO hostel_listing_details
         (hostel_id, ${cols.map(k => `\`${k}\``).join(", ")})
         VALUES (?, ${cols.map(() => "?").join(", ")})
         ON DUPLICATE KEY UPDATE
         ${cols.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ")}`,
        [req.params.id, ...listingKeys.map(k => data[k])]
      );
    }

    return res.json({ message: "Profile saved" });
  } catch (err) {
    return serverError(res, err);
  }
};
