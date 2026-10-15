import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

// ── promise wrapper ──────────────────────────────────────────────────────────
const q = (sql, vals = []) =>
  new Promise((res, rej) => db.query(sql, vals, (e, r) => (e ? rej(e) : res(r))));

const parseJson = (value, fallback) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

// ── All columns saveCampus accepts from the form ──────────────────────────────
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
  // legacy fields (kept for backward-compat)
  "history", "duration", "fee",
];

// ════════════════════════════════════════════════════════════════════════════
// GET /api/campus/:uid/profile
// ════════════════════════════════════════════════════════════════════════════
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

      // Fall back to campus_registrations if campuses row not yet created
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

          // Auto-create campuses row from registration
          // verification_id must be NULL here — cr.id is a campus_registrations ID,
          // not a campus_verification ID, so passing it violates the FK constraint.
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

// ════════════════════════════════════════════════════════════════════════════
// POST /api/campus/profile  —  create or update campus details
// ════════════════════════════════════════════════════════════════════════════
export const saveCampus = (req, res) => {
  const { campus_admin_uid } = req.body;
  if (!campus_admin_uid) {
    return res.status(400).json({ message: "campus_admin_uid is required" });
  }

  // Sirf campus_registrations check karo (campus_verification fresh DB mein nahi hoti)
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
      const verificationId = null; // registration id verification_id nahi hai (FK toot sakti hai)

      // Build dynamic SET/INSERT from accepted fields only
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
            // UPDATE
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

          // INSERT
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

// ════════════════════════════════════════════════════════════════════════════
// GET /api/campus/:campusId/overview-stats
// KPI counts + profile completeness for the Overview page
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// GET /api/campus/:campusId/activity  —  recent activity log
// ════════════════════════════════════════════════════════════════════════════
export const getCampusActivity = async (req, res) => {
  const { campusId } = req.params;
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
  try {
    // Campus activity lives in the same university's activity_log
    // We look up the university_id from campuses first
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

// ════════════════════════════════════════════════════════════════════════════
// Keep existing public list/detail/search endpoints
// ════════════════════════════════════════════════════════════════════════════
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

export const searchCampuses = (req, res) => {
  const { city, university, program } = req.query;
  const where = [], vals = [];
  if (city) { where.push("LOWER(c.city) LIKE ?"); vals.push(`%${city.toLowerCase()}%`); }
  if (university) { where.push("LOWER(u.name) LIKE ?"); vals.push(`%${university.toLowerCase()}%`); }
  if (program) {
    where.push(`EXISTS (SELECT 1 FROM campus_programs cp JOIN programs p ON p.id=cp.program_id
                        WHERE cp.campus_id=c.id AND LOWER(p.name) LIKE ?)`);
    vals.push(`%${program.toLowerCase()}%`);
  }
  const sql = `
    SELECT c.*, u.name AS university_name, u.logo_url, u.banner_url AS university_banner,
           (SELECT image_url FROM campus_images WHERE campus_id=c.id ORDER BY created_at DESC LIMIT 1) AS cover_image
    FROM campuses c LEFT JOIN universities u ON u.id=c.university_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY c.created_at DESC`;
  db.query(sql, vals, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    return res.status(200).json(rows);
  });
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
