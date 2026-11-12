import { v4 as uuidv4 } from "uuid";
import process from "node:process";
import db from "../../../shared/db.js";
import { evaluateHostelCompletion } from "../../hostel/hostelCompleteness.js";

const q = (sql, vals = []) =>
  new Promise((res, rej) => db.query(sql, vals, (e, r) => (e ? rej(e) : res(r))));

const parseJson = (value, fallback) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const SAVE_FIELDS = [
  "name", "campus_type", "city", "province", "address", "description", "why_choose", "students",
  "lat", "lng",
  "phone", "whatsapp", "email", "office_hours",
  "shift_morning", "shift_evening", "shift_weekend",
  "gender_policy", "class_arrangement",
  "admission_open", "admission_close", "intake_name", "classes_start",
  "required_documents",
  "scholarships",
  "quota_policy",
  "announcements",
  "admission_status_override",
  "cover_image",

  "history", "duration", "fee",
];

export const getMyCampus = (req, res) => {
  const uid = req.params.uid;
  db.query(
    `SELECT c.*, u.name AS university_name, u.university_type AS sector,
            u.hec_rank, u.oric_domain, u.campus_count
     FROM campuses c
     LEFT JOIN universities u ON u.id = c.university_id
     WHERE c.campus_admin_uid = ? LIMIT 1`,
    [uid],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (rows && rows.length > 0) return res.status(200).json(rows[0]);

      db.query(
        `SELECT cr.id, cr.registrantUserId AS campus_admin_uid, cr.universityId AS university_id,
                cr.officialName AS name, cr.city, cr.province, cr.address, cr.phone,
                cr.officialEmail AS email, cr.campusType AS campus_type,
                u.name AS university_name, u.university_type AS sector,
                u.hec_rank, u.oric_domain, u.campus_count
         FROM campus_registrations cr
         LEFT JOIN universities u ON u.id = cr.universityId
         WHERE cr.registrantUserId = ? AND cr.status = 'approved'
         ORDER BY cr.submittedAt DESC LIMIT 1`,
        [uid],
        (err2, crRows) => {
          if (err2) return res.status(500).json({ message: "DB error", error: err2.message });
          if (!crRows || !crRows.length) return res.status(200).json(null);

          const r = crRows[0];
          const newId = uuidv4();
          db.query(
            `INSERT INTO campuses
               (id, university_id, campus_admin_uid, verification_id, name, campus_type,
                city, province, address, phone, email)
             VALUES (?,?,?,NULL,?,?,?,?,?,?,?)`,
            [newId, r.university_id, uid, r.name, r.campus_type,
              r.city, r.province, r.address, r.phone, r.email],
            (err3) => {
              if (err3) console.log("Auto-create campus row:", err3.message);
              return res.status(200).json({ ...r, id: newId });
            }
          );
        }
      );
    }
  );
};

export const saveCampus = (req, res) => {
  const { campus_admin_uid } = req.body;
  if (!campus_admin_uid) {
    return res.status(400).json({ message: "campus_admin_uid is required" });
  }

  db.query(
    `SELECT id, universityId AS university_id
       FROM campus_registrations
      WHERE registrantUserId = ? AND status = 'approved'
      ORDER BY submittedAt DESC
      LIMIT 1`,
    [campus_admin_uid],
    (err, vrows) => {
      if (err) {
        console.error("saveCampus approval check:", err.sqlMessage || err.message);
        return res.status(500).json({ message: "DB error", error: err.message });
      }
      if (!vrows.length)
        return res.status(403).json({ message: "Your campus is not approved yet." });

      const universityId = vrows[0].university_id;
      const verificationId = null;

      const stripSeps = (v) => String(v || "").replace(/[\s\-().]/g, "");

      const PK_MOBILE_RE   = /^\+923\d{9}$/;

      const PK_LANDLINE_RE = /^\+92\d{9,12}$/;

      const isValidCampusPhone    = (v) => !v || PK_MOBILE_RE.test(stripSeps(v)) || PK_LANDLINE_RE.test(stripSeps(v));
      const isValidCampusWhatsApp = (v) => !v || PK_MOBILE_RE.test(stripSeps(v));

      const phoneVal    = req.body.phone    !== undefined ? req.body.phone    : undefined;
      const whatsappVal = req.body.whatsapp !== undefined ? req.body.whatsapp : undefined;

      const contactErrors = {};
      if (phoneVal !== undefined && phoneVal !== "" && phoneVal !== null && !isValidCampusPhone(phoneVal)) {
        contactErrors.phone = "Enter a valid Pakistani phone number (e.g., +92-42-111-128-128 or +923001234567).";
      }
      if (whatsappVal !== undefined && whatsappVal !== "" && whatsappVal !== null && !isValidCampusWhatsApp(whatsappVal)) {
        contactErrors.whatsapp = "WhatsApp must be a Pakistani mobile number (e.g., +923001234567).";
      }
      if (Object.keys(contactErrors).length) {
        return res.status(422).json({ errors: contactErrors });
      }

      const cols = [];
      const vals = [];
      for (const f of SAVE_FIELDS) {
        if (req.body[f] !== undefined) {
          cols.push(f);
          vals.push(req.body[f]);
        }
      }

      db.query(
        "SELECT id FROM campuses WHERE campus_admin_uid = ? LIMIT 1",
        [campus_admin_uid],
        (err2, rows) => {
          if (err2) {
            console.error("saveCampus lookup:", err2.sqlMessage || err2.message);
            return res.status(500).json({ message: "DB error", error: err2.message });
          }

          if (rows.length > 0) {

            const id = rows[0].id;
            if (!cols.length) return res.status(200).json({ message: "Nothing to update", id });
            const setClause = cols.map((c) => `\`${c}\`=?`).join(", ");
            return db.query(
              `UPDATE campuses SET ${setClause}, updated_at=NOW() WHERE id=?`,
              [...vals, id],
              (e3) => {
                if (e3) {
                  console.error("saveCampus update:", e3.sqlMessage || e3.message);
                  return res.status(500).json({ message: "DB error", error: e3.message });
                }
                return res.status(200).json({ message: "Campus details updated", id });
              }
            );
          }

          const id = uuidv4();
          const baseCols = ["id", "university_id", "campus_admin_uid", "verification_id"];
          const baseVals = [id, universityId, campus_admin_uid, verificationId];
          const allCols = [...baseCols, ...cols];
          const allVals = [...baseVals, ...vals];
          const ph = allCols.map(() => "?").join(",");
          return db.query(
            `INSERT INTO campuses (${allCols.map((c) => `\`${c}\``).join(",")}) VALUES (${ph})`,
            allVals,
            (e4) => {
              if (e4) {
                console.error("saveCampus insert:", e4.sqlMessage || e4.message);
                return res.status(500).json({ message: "DB error", error: e4.message });
              }
              return res.status(201).json({ message: "Campus details saved", id });
            }
          );
        }
      );
    }
  );
};

export const getOverviewStats = async (req, res) => {
  const { campusId } = req.params;
  try {
    const [programs, images, societies, hostels, facilities, profile] = await Promise.all([
      q("SELECT COUNT(*) AS c FROM campus_programs WHERE campus_id=?", [campusId]),
      q("SELECT COUNT(*) AS c FROM campus_images   WHERE campus_id=?", [campusId]),
      q("SELECT COUNT(*) AS c FROM campus_societies WHERE campus_id=?", [campusId]),
      q("SELECT COUNT(*) AS c FROM campus_hostels   WHERE campus_id=? AND status='live'", [campusId]),
      q("SELECT selected_ids FROM campus_facilities WHERE campus_id=?", [campusId]),
      q(`SELECT name, city, phone, email, address, description, shift_morning, shift_evening,
                shift_weekend, gender_policy, whatsapp, office_hours,
                admission_open, admission_close, intake_name
         FROM campuses WHERE id=?`, [campusId]),
    ]);

    const facilityIds = (() => {
      try { return JSON.parse(facilities[0]?.selected_ids || "[]"); } catch { return []; }
    })();

    const p = profile[0] || {};
    const sections = {
      profile: !!(p.name && p.city),
      contact: !!(p.phone || p.email),
      description: !!p.description,
      facilities: facilityIds.length > 0,
      gallery: images[0].c > 0,
      societies: societies[0].c > 0,
      hostels: hostels[0].c > 0,
      programs: programs[0].c > 0,
      admissions_calendar: !!(p.admission_open && p.admission_close),
    };
    const doneCount = Object.values(sections).filter(Boolean).length;
    const totalSections = Object.keys(sections).length;

    return res.json({
      programs_count: programs[0].c,
      images_count: images[0].c,
      societies_count: societies[0].c,
      linked_hostels: hostels[0].c,
      completeness: { done: doneCount, total: totalSections, sections },
    });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

export const getCampusActivity = async (req, res) => {
  const { campusId } = req.params;
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
  try {

    const campusRows = await q(
      "SELECT university_id FROM campuses WHERE id=? LIMIT 1", [campusId]
    );
    if (!campusRows.length) return res.json([]);

    const rows = await q(
      `SELECT action, actor_name, description, entity_type, created_at
       FROM activity_log
       WHERE university_id=?
       ORDER BY created_at DESC
       LIMIT ?`,
      [campusRows[0].university_id, limit]
    );
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

export const listCampusesByUniversity = (req, res) => {
  db.query(
    `SELECT
       c.*,
       u.banner_url AS university_banner,
       (SELECT image_url FROM campus_images
        WHERE campus_id = c.id
        ORDER BY featured DESC, created_at DESC LIMIT 1) AS cover_image,
       (SELECT COUNT(*) FROM campus_programs cp
        WHERE cp.campus_id = c.id AND cp.status = 'published') AS program_count
     FROM campuses c
     LEFT JOIN universities u ON u.id = c.university_id
     WHERE c.university_id = ?
     ORDER BY c.is_main DESC, c.created_at ASC`,
    [req.params.universityId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows);
    }
  );
};

export const searchCampuses = async (req, res) => {
  const { city, university, program } = req.query;

  try {
    const where = [];
    const vals  = [];

    if (city) {
      where.push("LOWER(c.city) LIKE ?");
      vals.push(`%${city.toLowerCase()}%`);
    }
    if (university) {
      where.push("(LOWER(u.name) LIKE ? OR LOWER(c.name) LIKE ?)");
      vals.push(`%${university.toLowerCase()}%`, `%${university.toLowerCase()}%`);
    }
    if (program) {

      where.push(`EXISTS (
        SELECT 1 FROM campus_programs cp2
        JOIN programs p2 ON p2.id = cp2.program_id
        WHERE cp2.campus_id = c.id
          AND cp2.status = 'published'
          AND LOWER(p2.name) LIKE ?
      )`);
      vals.push(`%${program.toLowerCase()}%`);
    }

    const whereClause = where.length ? `WHERE c.status = 'active' AND ${where.join(" AND ")}` : "WHERE c.status = 'active'";

    const campusRows = await q(
      `SELECT
         c.id, c.name, c.campus_type, c.is_main,
         c.city, c.province,
         c.gender_policy,
         c.hostel_available,
         c.shift_morning, c.shift_evening, c.shift_weekend,
         c.admission_open, c.admission_close,
         c.admission_status_override,
         c.students, c.cover_image,
         u.id            AS university_id,
         u.name          AS university_name,
         u.logo_url,
         u.banner_url    AS university_banner,
         u.university_type AS sector
       FROM campuses c
       LEFT JOIN universities u ON u.id = c.university_id
       ${whereClause}
       ORDER BY c.is_main DESC, c.created_at DESC`,
      vals
    );

    if (!campusRows.length) return res.status(200).json([]);

    const campusIds = campusRows.map((r) => r.id);
    const placeholders = campusIds.map(() => "?").join(",");

    const programRows = await q(
      `SELECT
         cp.campus_id,
         p.name          AS program_name,
         p.level         AS program_level,
         p.degree_type,
         -- Extract numeric semester fee from the details JSON (stored as semester_fee key)
         CAST(
           NULLIF(
             TRIM(JSON_UNQUOTE(JSON_EXTRACT(cp.details, '$.semester_fee'))),
             'null'
           ) AS UNSIGNED
         ) AS fee_numeric,
         cp.shifts       AS shift_label
       FROM campus_programs cp
       JOIN programs p ON p.id = cp.program_id
       WHERE cp.campus_id IN (${placeholders})
         AND cp.status = 'published'
       ORDER BY cp.campus_id, p.name`,
      campusIds
    );

    const missingCoverIds = campusRows
      .filter((r) => !r.cover_image)
      .map((r) => r.id);

    let coverMap = {};
    if (missingCoverIds.length) {
      const coverRows = await q(
        `SELECT campus_id, image_url
         FROM campus_images
         WHERE campus_id IN (${missingCoverIds.map(() => "?").join(",")})
         ORDER BY featured DESC, created_at DESC`,
        missingCoverIds
      );

      for (const row of coverRows) {
        if (!coverMap[row.campus_id]) coverMap[row.campus_id] = row.image_url;
      }
    }

    const programsByCampus = {};
    const feesByCampus     = {};

    for (const pr of programRows) {
      const cid = pr.campus_id;

      if (!programsByCampus[cid]) programsByCampus[cid] = [];
      programsByCampus[cid].push({
        name:        pr.program_name,
        level:       pr.program_level,
        degree_type: pr.degree_type,
        fee_numeric: pr.fee_numeric || 0,
        shift_label: pr.shift_label,
      });

      if (pr.fee_numeric > 0) {
        if (!feesByCampus[cid]) feesByCampus[cid] = { min: pr.fee_numeric, max: pr.fee_numeric };
        else {
          feesByCampus[cid].min = Math.min(feesByCampus[cid].min, pr.fee_numeric);
          feesByCampus[cid].max = Math.max(feesByCampus[cid].max, pr.fee_numeric);
        }
      }
    }

    const result = campusRows.map((c) => {
      const programs  = programsByCampus[c.id] || [];
      const fees      = feesByCampus[c.id]     || { min: 0, max: 0 };

      const shifts = [];
      if (c.shift_morning) shifts.push("Morning");
      if (c.shift_evening) shifts.push("Evening");
      if (c.shift_weekend) shifts.push("Weekend");

      for (const pr of programs) {
        if (pr.shift_label) {
          const parts = pr.shift_label.split(/[,;\/]/).map((s) => s.trim());
          for (const part of parts) {
            const normalised = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            if (["Morning", "Evening", "Weekend"].includes(normalised) && !shifts.includes(normalised)) {
              shifts.push(normalised);
            }
          }
        }
      }

      const entryTestSet = new Set();
      for (const pr of programs) {

      }

      return {
        ...c,
        cover_image:  c.cover_image || coverMap[c.id] || null,
        programs,
        fee_min:      fees.min,
        fee_max:      fees.max,
        fee:          fees.min,
        shifts,
        entry_tests:  [],
        scholarship_available: (c.scholarships && c.scholarships !== "[]") ? true : undefined,
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("searchCampuses error:", err);
    return res.status(500).json({ message: "DB error", error: err.message });
  }
};

export const compareCampuses = async (req, res) => {
  const raw = String(req.query.ids || "");
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (ids.length < 2) {
    return res.status(400).json({ message: "At least 2 campus IDs are required." });
  }

  const fetchOne = async (campusId) => {
    const rows = await q(
      `SELECT c.id, c.name, c.campus_type, c.city, c.province, c.address,
              c.description, c.why_choose, c.lat, c.lng, c.phone, c.whatsapp,
              c.email, c.office_hours, c.shift_morning, c.shift_evening,
              c.shift_weekend, c.gender_policy, c.hostel_available, c.is_main,
              c.admission_open, c.admission_close, c.intake_name, c.classes_start,
              c.class_arrangement, c.admission_status_override, c.students,
              c.cover_image, c.required_documents, c.scholarships,
              c.quota_policy, c.announcements,
              u.name AS university_name, u.logo_url, u.banner_url AS university_banner,
              u.university_type AS sector, u.hec_rank, u.oric_domain, u.campus_count,
              COALESCE(up.established_year, u.established_year) AS university_established_year,
              u.employment_rate AS university_employment_rate
       FROM campuses c
       LEFT JOIN universities u ON u.id = c.university_id
       LEFT JOIN university_profiles up ON up.university_id = u.id
       WHERE c.id = ? LIMIT 1`,
      [campusId]
    );

    if (!rows.length) return null;

    const [programs, images, facilities, societies, hostels] = await Promise.all([
      q(
        `SELECT cp.id, cp.fee, cp.duration, cp.shifts, cp.details,
                p.name, p.level, p.degree_type
         FROM campus_programs cp
         JOIN programs p ON p.id = cp.program_id
         WHERE cp.campus_id = ? AND cp.status = 'published'
         ORDER BY p.name`,
        [campusId]
      ),
      q(
        `SELECT id, image_url, caption, category, featured
         FROM campus_images WHERE campus_id = ?
         ORDER BY featured DESC, created_at DESC LIMIT 1`,
        [campusId]
      ),
      q("SELECT * FROM campus_facilities WHERE campus_id = ? LIMIT 1", [campusId]),
      q(
        `SELECT id, name, category, description, initials
         FROM campus_societies WHERE campus_id = ? ORDER BY created_at ASC`,
        [campusId]
      ),
      q(
        `SELECT id, name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status
         FROM campus_hostels WHERE campus_id = ? AND status = 'live'
         ORDER BY gender ASC, created_at ASC`,
        [campusId]
      ),
    ]);

    const facility = facilities[0];

    return {
      ...rows[0],
      required_documents: parseJson(rows[0].required_documents, []),
      scholarships: parseJson(rows[0].scholarships, []),
      announcements: parseJson(rows[0].announcements, []),
      programs: programs.map((p) => ({
        ...p,
        details: parseJson(p.details, {}),
      })),
      images,
      facilities: facility
        ? {
            ...facility,
            selected_ids: parseJson(facility.selected_ids, []),
            transport_routes: parseJson(facility.transport_routes, []),
          }
        : null,
      societies,
      hostels: hostels.map((h) => ({
        ...h,
        amenities: parseJson(h.amenities, []),
        rooms_detail: parseJson(h.rooms_detail, []),
      })),
    };
  };

  try {
    const results = await Promise.all(ids.map(fetchOne));

    return res.status(200).json(results.filter(Boolean));
  } catch (e) {
    console.error("compareCampuses error:", e);
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

export const getCampusById = async (req, res) => {
  try {
    const rows = await q(
      `SELECT c.id, c.name, c.campus_type, c.city, c.province, c.address,
              c.description, c.why_choose, c.lat, c.lng, c.phone, c.whatsapp,
              c.email, c.office_hours, c.shift_morning, c.shift_evening,
              c.shift_weekend, c.gender_policy, c.hostel_available, c.is_main,
              c.admission_open, c.admission_close, c.intake_name, c.classes_start,
              c.class_arrangement, c.admission_status_override, c.students,
              c.cover_image, c.required_documents, c.scholarships,
              c.quota_policy, c.announcements,
              u.name AS university_name, u.logo_url, u.banner_url AS university_banner,
              u.university_type AS sector, u.hec_rank, u.oric_domain, u.campus_count,
              COALESCE(up.established_year, u.established_year) AS university_established_year,
              u.employment_rate AS university_employment_rate
       FROM campuses c
       LEFT JOIN universities u ON u.id=c.university_id
            LEFT JOIN university_profiles up ON up.university_id=u.id
       WHERE c.id=? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Campus not found" });

    const campusId = req.params.id;
    const [programs, images, facilities, societies] = await Promise.all([
      q(
        `SELECT cp.id, cp.fee, cp.duration, cp.shifts, cp.details,
                p.name, p.level, p.degree_type
         FROM campus_programs cp
         JOIN programs p ON p.id=cp.program_id
         WHERE cp.campus_id=? AND cp.status='published'
         ORDER BY p.name`,
        [campusId]
      ),
      q(
        `SELECT id, image_url, caption, category, featured
         FROM campus_images WHERE campus_id=?
         ORDER BY featured DESC, created_at DESC`,
        [campusId]
      ),
      q("SELECT * FROM campus_facilities WHERE campus_id=? LIMIT 1", [campusId]),
      q(
        `SELECT id, name, category, description, initials
         FROM campus_societies WHERE campus_id=? ORDER BY created_at ASC`,
        [campusId]
      ),
    ]);

    const facility = facilities[0];
    return res.status(200).json({
      ...rows[0],
      required_documents: parseJson(rows[0].required_documents, []),
      scholarships: parseJson(rows[0].scholarships, []),
      announcements: parseJson(rows[0].announcements, []),
      programs: programs.map((program) => ({
        ...program,
        details: parseJson(program.details, {}),
      })),
      images,
      facilities: facility ? {
        ...facility,
        selected_ids: parseJson(facility.selected_ids, []),
        transport_routes: parseJson(facility.transport_routes, []),
      } : null,
      societies,
    });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

const toRad = (d) => (d * Math.PI) / 180;
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const num = (v) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const CAMPUS_NEARBY_RADIUS_KM = 5;

const campusGeoCache = new Map();

const loadCampusGeoCache = async () => {
  if (campusGeoCache.size) return campusGeoCache;
  const rows = await q(
    `SELECT id, name, city, lat, lng FROM campuses
     WHERE lat IS NOT NULL AND lng IS NOT NULL AND lat <> 0 AND lng <> 0`
  );
  rows.forEach((campus) => {
    const lat = Number(campus.lat);
    const lng = Number(campus.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      campusGeoCache.set(campus.id, { ...campus, lat, lng });
    }
  });
  return campusGeoCache;
};

const jsonOr = (v, fallback) => {
  if (v == null) return fallback;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return fallback; }
};
const genderOf = (v) => {
  const g = (v || "").toLowerCase();
  return g === "mixed" ? "both" : g;
};

export const listApprovedCampusHostels = async (req, res) => {
  try {
    const campusId = req.params.id;

    const campusRows = await q(
      `SELECT lat, lng, name, hostel_available FROM campuses WHERE id=? LIMIT 1`,
      [campusId]
    );

    const registeredRows = await q(
      `SELECT h.id, h.name, h.address, h.lat AS latitude, h.lng AS longitude,
              h.floors, h.nearby_distance, h.owner_name, h.owner_contact,
              h.warden_name, h.warden_contact,
              d.gender, d.contact_phone AS phone, d.description AS about,
              d.amenities, d.mess_details, d.additional_fees, d.hostel_rules,
              d.check_in_time, d.check_out_time
       FROM hostels h
       LEFT JOIN hostel_listing_details d ON d.hostel_id = h.id
       WHERE h.campus_id = ? AND h.hostel_type = 'university' AND h.status <> 'rejected'
       ORDER BY h.created_at ASC`,
      [campusId]
    );
    if (!campusRows.length) {
      return res.status(404).json({ message: "Campus not found" });
    }
    if (!campusRows[0].hostel_available) return res.json([]);

    const cLat = num(campusRows[0].lat);
    const cLng = num(campusRows[0].lng);

    const rows = await q(
      `SELECT id, name, gender, hostel_type, address, walk_dist, contact,
              rooms, rent_min, distance_km, latitude, longitude, amenities
       FROM campus_hostels
       WHERE campus_id = ? AND status IN ('live','approved')
       ORDER BY created_at ASC`,
      [campusId]
    );

    const photoRows = rows.length
      ? await q(
          `SELECT id, hostel_id, image_url, caption, is_cover
           FROM campus_hostel_photos
           WHERE hostel_id IN (${rows.map(() => "?").join(",")})
           ORDER BY is_cover DESC, sort_order ASC, created_at ASC`,
          rows.map((r) => r.id)
        )
      : [];

    const photosByHostel = new Map();
    for (const photo of photoRows) {
      if (!photosByHostel.has(photo.hostel_id)) photosByHostel.set(photo.hostel_id, []);
      photosByHostel.get(photo.hostel_id).push({
        id: photo.id,
        image_url: photo.image_url,
        caption: photo.caption,
      });
    }

    const hostels = rows.map((h) => {
      const photos = photosByHostel.get(h.id) || [];
      const stored = num(h.distance_km);
      const hLat = num(h.latitude);
      const hLng = num(h.longitude);
      const computed =
        stored ??
        (cLat != null && cLng != null && hLat != null && hLng != null
          ? Math.round(haversineKm(cLat, cLng, hLat, hLng) * 10) / 10
          : null);

      return {
        id: h.id,
        name: h.name,
        gender: genderOf(h.gender),
        address: h.address || h.walk_dist || null,
        phone: h.contact || null,
        rooms: num(h.rooms),
        rent_min: num(h.rent_min),
        amenities: jsonOr(h.amenities, []),
        latitude: hLat,
        longitude: hLng,
        distance_km: computed,
        ownership: h.hostel_type || "Campus Hostel",
        cover_url: photos[0]?.image_url || null,
        photos,
      };
    });

    const registeredIds = registeredRows.map((hostel) => hostel.id);
    const [registeredPhotos, registeredRooms] = registeredIds.length
      ? await Promise.all([
          q(
            `SELECT id, hostel_id, image_url, caption
             FROM hostel_photos WHERE hostel_id IN (${registeredIds.map(() => "?").join(",")})
             ORDER BY created_at ASC`,
            registeredIds
          ),
          q(
            `SELECT id, hostel_id, room_type, total_rooms, beds_per_room,
                    available_beds, monthly_rent, description
             FROM hostel_rooms WHERE hostel_id IN (${registeredIds.map(() => "?").join(",")})
             ORDER BY created_at ASC`,
            registeredIds
          ),
        ])
      : [[], []];

    const photosByRegisteredHostel = new Map();
    for (const photo of registeredPhotos) {
      if (!photosByRegisteredHostel.has(photo.hostel_id)) photosByRegisteredHostel.set(photo.hostel_id, []);
      photosByRegisteredHostel.get(photo.hostel_id).push(photo);
    }
    const roomsByHostel = new Map();
    for (const room of registeredRooms) {
      if (!roomsByHostel.has(room.hostel_id)) roomsByHostel.set(room.hostel_id, []);
      roomsByHostel.get(room.hostel_id).push(room);
    }

    const ownerManagedHostels = registeredRows.map((h) => {
      const photos = photosByRegisteredHostel.get(h.id) || [];
      const rooms = roomsByHostel.get(h.id) || [];
      const amenitiesData = jsonOr(h.amenities, {});
      const amenityItems = Array.isArray(amenitiesData)
        ? amenitiesData
        : [
            ...(Array.isArray(amenitiesData.inRoom?.items) ? amenitiesData.inRoom.items : []),
            ...(Array.isArray(amenitiesData.facilities) ? amenitiesData.facilities : []),
          ];
      const fees = jsonOr(h.additional_fees, {});
      const latitude = num(h.latitude);
      const longitude = num(h.longitude);
      const rents = rooms.map((room) => num(room.monthly_rent)).filter((rent) => rent != null);
      const distance = cLat != null && cLng != null && latitude != null && longitude != null
        ? Math.round(haversineKm(cLat, cLng, latitude, longitude) * 10) / 10
        : null;

      return {
        id: h.id,
        name: h.name,
        gender: genderOf(h.gender),
        address: h.address,
        phone: h.phone,
        rooms: rooms.reduce((sum, room) => sum + Number(room.total_rooms || 0), 0),
        rent_min: rents.length ? Math.min(...rents) : null,
        rent_max: rents.length ? Math.max(...rents) : null,
        amenities: amenityItems.map((item) => typeof item === "string" ? item : item?.name).filter(Boolean),
        facilities: amenitiesData.facilities || [],
        latitude,
        longitude,
        distance_km: distance,
        ownership: "Campus Hostel",
        cover_url: photos[0]?.image_url || null,
        photos,
        about: h.about,
        floors: h.floors,
        nearby_distance: h.nearby_distance,
        owner_name: h.owner_name,
        owner_contact: h.owner_contact,
        warden_name: h.warden_name,
        warden_contact: h.warden_contact,
        hostel_rules: jsonOr(h.hostel_rules, []),
        mess_details: jsonOr(h.mess_details, {}),
        additional_fees: fees,
        check_in_time: h.check_in_time,
        check_out_time: h.check_out_time,
        room_details: rooms,
      };
    });

    const campusGeo = (await loadCampusGeoCache()).get(campusId) || {
      lat: cLat,
      lng: cLng,
    };
    const linkedIds = new Set(registeredRows.map((hostel) => hostel.id));

    const nearbyCandidates =
      campusGeo.lat != null && campusGeo.lng != null
        ? (
            await q(
              `SELECT h.id, h.name, h.hostel_type, h.campus_id, h.address,
                      h.lat AS latitude, h.lng AS longitude, h.floors,
                      h.nearby_distance, h.owner_name, h.owner_contact,
                      h.warden_name, h.warden_contact,
                      d.gender, d.contact_phone AS phone, d.description AS about,
                      d.amenities, d.mess_details, d.additional_fees, d.hostel_rules,
                      d.check_in_time, d.check_out_time
               FROM hostels h
               LEFT JOIN hostel_listing_details d ON d.hostel_id = h.id
               WHERE h.status = 'approved'
                 AND h.lat IS NOT NULL AND h.lng IS NOT NULL
               ORDER BY h.created_at ASC
               LIMIT 300`
            )
          )
            .filter((hostel) => !linkedIds.has(hostel.id))
            .map((hostel) => {
              const latitude = num(hostel.latitude);
              const longitude = num(hostel.longitude);
              if (latitude == null || longitude == null) return null;
              const distance = haversineKm(campusGeo.lat, campusGeo.lng, latitude, longitude);
              if (distance > CAMPUS_NEARBY_RADIUS_KM) return null;
              return {
                ...hostel,
                latitude,
                longitude,
                distance_km: Math.round(distance * 10) / 10,
              };
            })
            .filter(Boolean)
            .sort((a, b) => a.distance_km - b.distance_km)
        : [];

    const nearbyIds = nearbyCandidates.map((hostel) => hostel.id);
    const [nearbyPhotos, nearbyRooms] = nearbyIds.length
      ? await Promise.all([
          q(
            `SELECT id, hostel_id, image_url, caption
             FROM hostel_photos WHERE hostel_id IN (${nearbyIds.map(() => "?").join(",")})
             ORDER BY is_cover DESC, created_at ASC`,
            nearbyIds
          ),
          q(
            `SELECT id, hostel_id, room_type, total_rooms, beds_per_room,
                    available_beds, monthly_rent, description
             FROM hostel_rooms WHERE hostel_id IN (${nearbyIds.map(() => "?").join(",")})
             ORDER BY created_at ASC`,
            nearbyIds
          ),
        ])
      : [[], []];

    const nearbyPhotosByHostel = new Map();
    for (const photo of nearbyPhotos) {
      if (!nearbyPhotosByHostel.has(photo.hostel_id)) nearbyPhotosByHostel.set(photo.hostel_id, []);
      nearbyPhotosByHostel.get(photo.hostel_id).push(photo);
    }
    const nearbyRoomsByHostel = new Map();
    for (const room of nearbyRooms) {
      if (!nearbyRoomsByHostel.has(room.hostel_id)) nearbyRoomsByHostel.set(room.hostel_id, []);
      nearbyRoomsByHostel.get(room.hostel_id).push(room);
    }

    const nearbyHostels = nearbyCandidates
      .map((h) => {
        const photos = nearbyPhotosByHostel.get(h.id) || [];
        const rooms = nearbyRoomsByHostel.get(h.id) || [];
        const completion = evaluateHostelCompletion(
          {
            ...h,
            lat: h.latitude,
            lng: h.longitude,
            status: "approved",
          },
          { rooms, photos, listing: { ...h, description: h.about } }
        );
        if (!completion.isLive) return null;

        const amenitiesData = jsonOr(h.amenities, {});
        const amenityItems = Array.isArray(amenitiesData)
          ? amenitiesData
          : [
              ...(Array.isArray(amenitiesData.inRoom?.items) ? amenitiesData.inRoom.items : []),
              ...(Array.isArray(amenitiesData.facilities) ? amenitiesData.facilities : []),
            ];
        const rents = rooms
          .map((room) => num(room.monthly_rent))
          .filter((rent) => rent != null);

        return {
          id: h.id,
          name: h.name,
          gender: genderOf(h.gender),
          address: h.address,
          phone: h.phone,
          rooms: completion.counts.roomsCount,
          rent_min: completion.counts.rentMin ?? (rents.length ? Math.min(...rents) : null),
          rent_max: completion.counts.rentMax ?? (rents.length ? Math.max(...rents) : null),
          amenities: amenityItems
            .map((item) => (typeof item === "string" ? item : item?.name))
            .filter(Boolean),
          facilities: jsonOr(amenitiesData.facilities, []),
          latitude: h.latitude,
          longitude: h.longitude,
          distance_km: h.distance_km,
          ownership:
            h.hostel_type === "university" ? "Campus Hostel" : "Private Hostel",
          nearby: true,
          cover_url: photos[0]?.image_url || null,
          photos,
          about: h.about,
          floors: h.floors,
          nearby_distance: h.nearby_distance,
          owner_name: h.owner_name,
          owner_contact: h.owner_contact,
          warden_name: h.warden_name,
          warden_contact: h.warden_contact,
          hostel_rules: jsonOr(h.hostel_rules, []),
          mess_details: jsonOr(h.mess_details, {}),
          additional_fees: jsonOr(h.additional_fees, {}),
          check_in_time: h.check_in_time,
          check_out_time: h.check_out_time,
          room_details: rooms,
        };
      })
      .filter(Boolean);

    return res.json([...hostels, ...ownerManagedHostels, ...nearbyHostels]);
  } catch (e) {
    console.error("listApprovedCampusHostels:", e.message);
    return res.status(500).json({
      message: "Could not load hostels.",
      ...(process.env.NODE_ENV !== "production" ? { detail: e.message } : {}),
    });
  }
};
