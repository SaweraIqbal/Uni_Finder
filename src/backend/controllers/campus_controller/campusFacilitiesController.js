import db from "../../config/db.js";

const q = (sql, vals = []) =>
  new Promise((res, rej) => db.query(sql, vals, (e, r) => (e ? rej(e) : res(r))));

const safe = (v) => {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return null; }
};

// GET /api/campus/:campusId/facilities
export const getFacilities = async (req, res) => {
  try {
    const rows = await q(
      "SELECT * FROM campus_facilities WHERE campus_id=?",
      [req.params.campusId]
    );
    if (!rows.length) return res.json(null);

    const row = rows[0];
    return res.json({
      ...row,
      selected_ids:      safe(row.selected_ids)      || [],
      transport_routes:  safe(row.transport_routes)  || [],
    });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};

// PUT /api/campus/:campusId/facilities
export const saveFacilities = async (req, res) => {
  const { campusId } = req.params;
  const {
    selected_ids, transport_routes, transport_fee,
    dress_code, class_timings, attendance_policy, discipline_policy,
  } = req.body;

  const selectedJson  = JSON.stringify(Array.isArray(selected_ids) ? selected_ids : []);
  const routesJson    = JSON.stringify(Array.isArray(transport_routes) ? transport_routes : []);

  try {
    await q(
      `INSERT INTO campus_facilities
         (campus_id, selected_ids, transport_routes, transport_fee,
          dress_code, class_timings, attendance_policy, discipline_policy)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         selected_ids=VALUES(selected_ids),
         transport_routes=VALUES(transport_routes),
         transport_fee=VALUES(transport_fee),
         dress_code=VALUES(dress_code),
         class_timings=VALUES(class_timings),
         attendance_policy=VALUES(attendance_policy),
         discipline_policy=VALUES(discipline_policy),
         updated_at=NOW()`,
      [campusId, selectedJson, routesJson, transport_fee || null,
       dress_code || null, class_timings || null,
       attendance_policy || null, discipline_policy || null]
    );
    return res.json({ message: "Facilities saved" });
  } catch (e) {
    return res.status(500).json({ message: "DB error", error: e.message });
  }
};
