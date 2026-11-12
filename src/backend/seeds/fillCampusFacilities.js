import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import db, { dbReady } from "../shared/db.js";
import { BACKUPS_DIR, DATA_DIR } from "../shared/paths.js";

const EXCEL     = path.join(DATA_DIR, "ucp_scraped_data.xlsx");
const CAMPUS_ID = "4717a5f7-ffcf-40d8-9eff-7baa8d9d63a8";
const TABLE     = "campus_facilities";

const ADD_TRANSPORT_IF_ROUTES = true;

const VALID_IDS = new Set([
  "wifi", "library", "comp_labs", "sci_labs", "cafeteria", "prayer", "sports", "gym",
  "transport", "medical", "parking", "atm", "auditorium", "cctv", "disability",
  "lounges", "bank",
]);

const ID_MAP = {
  library:        "library",
  computer_lab:   "comp_labs",
  computer_labs:  "comp_labs",
  science_lab:    "sci_labs",
  science_labs:   "sci_labs",
  indoor_sports:  "sports",
  outdoor_sports: "sports",
  sports_ground:  "sports",
  sports_grounds: "sports",
  gym:            "gym",
  cafeteria:      "cafeteria",
  auditorium:     "auditorium",
  wifi:           "wifi",
  prayer_area:    "prayer",
  medical_room:   "medical",
  parking:        "parking",
  atm:            "atm",
  security:       "cctv",
  cctv:           "cctv",
  disability_access: "disability",
  student_lounges:   "lounges",
  bank:           "bank",
  transport:      "transport",
};

const APPROXIMATE = new Set(["indoor_sports"]);

const query = (sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows))),
  );

const APPLY = process.argv.includes("--apply");

const clean = (v) => {
  const s = String(v ?? "").trim();
  return s === "" || s.toLowerCase() === "nan" ? null : s;
};

const parseIds = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  const s = String(v).trim();
  try { const j = JSON.parse(s); if (Array.isArray(j)) return j.map(String); } catch {}
  return s.split(",").map((x) => x.trim()).filter(Boolean);
};

const validJsonArray = (s) => {
  try { const j = JSON.parse(s); return Array.isArray(j) ? j : null; } catch { return null; }
};

const run = async () => {
  await dbReady;

  let cols;
  try {
    cols = (await query(`SHOW COLUMNS FROM ${TABLE}`)).map((c) => c.Field);
  } catch (e) {
    console.error(`Table "${TABLE}" not found. Run in MySQL:  SHOW TABLES LIKE '%facilit%';`);
    console.error("Then change the TABLE constant at the top of this script.");
    process.exit(1);
  }
  console.log(`Table ${TABLE} columns: ${cols.join(", ")}`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL);
  const sheet = wb.getWorksheet("Campus_Facilities");
  if (!sheet) throw new Error('Sheet "Campus_Facilities" not found');

  const col = {};
  sheet.getRow(1).eachCell((c, i) => { col[String(c.value || "").trim().toLowerCase()] = i; });
  const get = (k) => (col[k] ? clean(sheet.getRow(2).getCell(col[k]).text) : null);

  const excel = {
    selected_ids:      parseIds(get("selected_ids")),
    transport_routes:  get("transport_routes"),
    transport_fee:     get("transport_fee"),
    dress_code:        get("dress_code"),
    class_timings:     get("class_timings"),
    attendance_policy: get("attendance_policy"),
    discipline_policy: get("discipline_policy"),
  };

  const mapped = [];
  const unmapped = [];
  const approximate = [];
  for (const id of excel.selected_ids) {
    const target = VALID_IDS.has(id) ? id : ID_MAP[id];
    if (!target) { unmapped.push(id); continue; }
    if (APPROXIMATE.has(id)) approximate.push(`${id} -> ${target}`);
    mapped.push(target);
  }

  let routesArr = null;
  if (excel.transport_routes) {
    routesArr = validJsonArray(excel.transport_routes);
    if (!routesArr) console.warn("WARNING: transport_routes in Excel is not a valid JSON array — it will be skipped.");
  }

  const normalizedRoutes = routesArr
    ? routesArr
        .filter((r) => r && (r.name || r.route))
        .map((r) => ({
          id:       randomUUID(),
          name:     String(r.name || r.route).trim(),
          duration: String(r.duration || "").trim(),
          expanded: true,
          stops: (Array.isArray(r.stops) ? r.stops : []).map((s) => ({
            id:   randomUUID(),
            name: typeof s === "string" ? s : String(s?.name || ""),
          })),
        }))
    : null;
  let transportAdded = false;
  if (ADD_TRANSPORT_IF_ROUTES && routesArr && routesArr.some((r) => r?.route) && !mapped.includes("transport")) {
    mapped.push("transport");
    transportAdded = true;
  }

  const existingRows = await query(`SELECT * FROM ${TABLE} WHERE campus_id = ? LIMIT 1`, [CAMPUS_ID]);
  const existing = existingRows[0] || null;
  const existingIds = existing ? parseIds(existing.selected_ids) : [];

  const pick = (excelVal, key) => (excelVal !== null && excelVal !== undefined ? excelVal : (existing?.[key] ?? null));
  const finalIds = [...new Set([...existingIds, ...mapped])];
  const finalRow = {
    selected_ids:      JSON.stringify(finalIds),
    transport_routes:  pick(normalizedRoutes && normalizedRoutes.length ? JSON.stringify(normalizedRoutes) : null, "transport_routes"),
    transport_fee:     pick(excel.transport_fee, "transport_fee"),
    dress_code:        pick(excel.dress_code, "dress_code"),
    class_timings:     pick(excel.class_timings, "class_timings"),
    attendance_policy: pick(excel.attendance_policy, "attendance_policy"),
    discipline_policy: pick(excel.discipline_policy, "discipline_policy"),
  };

  console.log(`\nMode: ${APPLY ? "APPLY (writing to DB)" : "DRY RUN (nothing is written)"}`);
  console.log(`Existing row for campus: ${existing ? "YES (will UPDATE)" : "NO (will INSERT)"}\n`);
  console.log("Will save:");
  console.log(JSON.stringify({ campus_id: CAMPUS_ID, ...finalRow }, null, 2));

  if (APPLY) {
    const dir = BACKUPS_DIR;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `campus_facilities_backup_${Date.now()}.json`),
      JSON.stringify(existing, null, 2),
    );

    if (existing) {
      await query(
        `UPDATE ${TABLE}
         SET selected_ids=?, transport_routes=?, transport_fee=?, dress_code=?,
             class_timings=?, attendance_policy=?, discipline_policy=?, updated_at=NOW()
         WHERE campus_id=?`,
        [finalRow.selected_ids, finalRow.transport_routes, finalRow.transport_fee, finalRow.dress_code,
         finalRow.class_timings, finalRow.attendance_policy, finalRow.discipline_policy, CAMPUS_ID],
      );
    } else {
      await query(
        `INSERT INTO ${TABLE}
           (campus_id, selected_ids, transport_routes, transport_fee, dress_code,
            class_timings, attendance_policy, discipline_policy, updated_at)
         VALUES (?,?,?,?,?,?,?,?,NOW())`,
        [CAMPUS_ID, finalRow.selected_ids, finalRow.transport_routes, finalRow.transport_fee,
         finalRow.dress_code, finalRow.class_timings, finalRow.attendance_policy, finalRow.discipline_policy],
      );
    }
    console.log("\nSaved to DB.");
  }

  console.log("\n===== REPORT =====");
  console.log(JSON.stringify({
    mode: APPLY ? "apply" : "dry-run",
    excel_ids: excel.selected_ids,
    ids_saved: finalIds,
    ids_unmapped_and_skipped: unmapped,
    approximate_mappings_please_check: approximate,
    transport_tick_added_because_routes_exist: transportAdded,
    NOT_IN_EXCEL_so_left_empty: [
      "class_timings",
      "transport_fee",
      "WiFi, Prayer Area, Medical Room, Parking, ATM, Security & CCTV, Disability Access, Student Lounges, Bank (not listed in Excel)",
    ].filter(Boolean),
  }, null, 2));
  if (!APPLY) console.log("\nDry run only. Add --apply to write.");
  process.exit(0);
};

run().catch((e) => { console.error("fillCampusFacilities failed:", e); process.exit(1); });
