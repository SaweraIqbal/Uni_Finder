/**
 * insertCampusPrograms.js
 *
 * Step 1 of 2: Riphah I-14 ke programs ko `campus_programs` mein DRAFT rows ki tarah banata hai.
 * Step 2:      phir fillCampusProgramDetails.js chalayein (fees/details/duration fill karta hai).
 *
 * Place in : src/backend/config/insertCampusPrograms.js
 * Excel in : src/backend/data/riphah_scraped_data.xlsx
 *
 * Usage (run from src/backend):
 *   node config/insertCampusPrograms.js                       -> DRY RUN (kuch nahi likhta)
 *   node config/insertCampusPrograms.js --apply               -> campus_programs rows banata hai
 *   node config/insertCampusPrograms.js --apply --create-missing
 *        -> jo programs `programs` table mein nahi hain unhe bhi bana deta hai
 *   node config/insertCampusPrograms.js --campus-id <uuid>    -> doosri campus id
 *
 * Safety:
 *  - Default dry run.
 *  - Duplicate nahi banata (campus_id + program_id pehle se ho to skip).
 *  - status = 'draft'. shifts ko touch nahi karta.
 *  - Jo rows banayi gayi unki ids backups/insert_log_<time>.json mein save hoti hain (undo ke liye).
 *  - Programs sirf usi university mein match hote hain jis ki ye campus hai
 *    (taake UCP wagera ke same naam wale programs na pakde jayen).
 */
import ExcelJS from "exceljs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db, { dbReady } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL = path.join(__dirname, "../data/riphah_scraped_data.xlsx");
const EXCEL_CAMPUS_FILTER = "I-14";
const CAMPUS_ID_DEFAULT = "2b1c1b1c-2759-4319-b119-e83b2e17d253"; // Riphah I-14 Campus
const STATUS = "draft";
const DURATION_BY_LEVEL = { Undergraduate: "4 Years", MS: "2 Years", PhD: "3 Years" };

// ── helpers ──────────────────────────────────────────────────────────────────
const query = (sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows))),
  );

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CREATE_MISSING = args.includes("--create-missing");
const ci = args.indexOf("--campus-id");
const CAMPUS_ID = ci >= 0 ? String(args[ci + 1] || "") : CAMPUS_ID_DEFAULT;

const clean = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const pickCols = (obj, cols) => Object.fromEntries(Object.entries(obj).filter(([k]) => cols.has(k)));
const insertRow = (table, data) => {
  const keys = Object.keys(data);
  return query(
    `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
    keys.map((k) => data[k]),
  );
};

// ── main ─────────────────────────────────────────────────────────────────────
const run = async () => {
  await dbReady;

  // 1. campus
  const campusRows = await query("SELECT * FROM campuses WHERE id = ?", [CAMPUS_ID]);
  if (!campusRows.length) throw new Error(`campuses table mein id ${CAMPUS_ID} nahi mili.`);
  const campus = campusRows[0];
  console.log(`Campus: ${campus.name} (${campus.id})`);

  // 2. university scoping (programs table mein university column ho to)
  const progColsRows = await query("SHOW COLUMNS FROM programs");
  const progCols = new Set(progColsRows.map((r) => r.Field));
  const uniKey = ["university_id", "parent_university_id"].find((k) => progCols.has(k)) || null;
  let uniVal = null;
  if (uniKey) {
    uniVal = campus[uniKey] ?? campus.university_id ?? campus.parent_university_id ?? null;
    if (!uniVal) {
      throw new Error(
        `programs table mein "${uniKey}" hai lekin campus row se university id nahi mili.\n` +
        `Campus row ke columns: ${Object.keys(campus).join(", ")}`,
      );
    }
    console.log(`University scope: programs.${uniKey} = ${uniVal}`);
  } else {
    console.log("programs table mein university column nahi mila: sirf original_name se match hoga.");
  }

  // 3. read Excel (sirf I-14)
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL);
  const sheet = wb.getWorksheet("Campus_Programs");
  if (!sheet) throw new Error('Sheet "Campus_Programs" not found');
  const col = {};
  sheet.getRow(1).eachCell((c, i) => { col[String(c.value || "").trim().toLowerCase()] = i; });
  const get = (row, k) => (col[k] ? clean(row.getCell(col[k]).text) : null);

  const excelRows = new Map();
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const campusName = get(row, "campus_name");
    if (!campusName || !campusName.includes(EXCEL_CAMPUS_FILTER)) continue;
    const original = get(row, "original_name");
    if (!original) continue;
    excelRows.set(original, {
      original_name: original,
      name: get(row, "program_name"),
      degree_type: get(row, "degree_type"),
      level: get(row, "academic_level"),
      duration: get(row, "program_duration"),
    });
  }
  console.log(`Mode: ${APPLY ? "APPLY (writing to DB)" : "DRY RUN (nothing is written)"}`);
  console.log(`Excel rows (I-14): ${excelRows.size}\n`);

  // 4. process
  const report = { to_insert: [], already_exists: [], program_missing: [], program_ambiguous: [], created_programs: [] };
  const log = { campus_id: CAMPUS_ID, campus_programs: [], programs: [] };
  const now = new Date();

  for (const e of excelRows.values()) {
    const matches = await query(
      `SELECT id, name FROM programs WHERE original_name = ?${uniKey ? ` AND \`${uniKey}\` = ?` : ""}`,
      uniKey ? [e.original_name, uniVal] : [e.original_name],
    );

    let programId = null;
    if (matches.length > 1) { report.program_ambiguous.push(e.original_name); continue; }
    if (matches.length === 1) programId = matches[0].id;

    if (!programId) {
      report.program_missing.push(e.original_name);
      if (!(CREATE_MISSING && APPLY)) continue;
      programId = crypto.randomUUID();
      const data = pickCols({
        id: programId,
        name: e.name || e.original_name,
        original_name: e.original_name,
        degree_type: e.degree_type,
        level: e.level,
        academic_level: e.level,
        track: "Regular Track",
        ...(uniKey ? { [uniKey]: uniVal } : {}),
      }, progCols);
      await insertRow("programs", data);
      log.programs.push(programId);
      report.created_programs.push(e.original_name);
    }

    const exists = await query(
      "SELECT id FROM campus_programs WHERE campus_id = ? AND program_id = ?",
      [CAMPUS_ID, programId],
    );
    if (exists.length) { report.already_exists.push(e.original_name); continue; }

    report.to_insert.push(e.original_name);
    if (APPLY) {
      const id = crypto.randomUUID();
      await insertRow("campus_programs", {
        id,
        campus_id: CAMPUS_ID,
        program_id: programId,
        duration: e.duration || DURATION_BY_LEVEL[e.level] || null,
        details: JSON.stringify({}),
        status: STATUS,
        created_at: now,
        updated_at: now,
      });
      log.campus_programs.push(id);
    }
  }

  // 5. log + report
  const dir = path.join(__dirname, "../backups");
  fs.mkdirSync(dir, { recursive: true });
  if (APPLY && (log.campus_programs.length || log.programs.length)) {
    const f = path.join(dir, `insert_log_${Date.now()}.json`);
    fs.writeFileSync(f, JSON.stringify(log, null, 2));
    console.log(`Insert log saved (undo ke liye): ${f}\n`);
  }

  console.log("===== REPORT =====");
  console.log(`campus_programs ${APPLY ? "inserted" : "to insert"} : ${report.to_insert.length}`);
  console.log(`already exists (skipped)      : ${report.already_exists.length}`);
  console.log(`program not in programs table : ${report.program_missing.length}${CREATE_MISSING && APPLY ? " (created)" : ""}`);
  console.log(`ambiguous (2+ matches, skipped): ${report.program_ambiguous.length}`);
  if (report.program_missing.length && !(CREATE_MISSING && APPLY)) {
    console.log("\nYe programs `programs` table mein nahi mile:\n  - " + report.program_missing.join("\n  - "));
    console.log("\nInhe banane ke liye --apply --create-missing ke saath chalayein.");
  }
  if (report.program_ambiguous.length) {
    console.log("\nAmbiguous (programs table mein ek se zyada match):\n  - " + report.program_ambiguous.join("\n  - "));
  }
  if (!APPLY) console.log("\nDry run only. Add --apply to write.");
  else console.log("\nAb fillCampusProgramDetails.js chalayein (details/fees fill karne ke liye).");
  process.exit(0);
};

run().catch((e) => { console.error("insertCampusPrograms failed:", e.message || e); process.exit(1); });
