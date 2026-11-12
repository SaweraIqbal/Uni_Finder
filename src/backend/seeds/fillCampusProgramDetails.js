import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import db, { dbReady } from "../shared/db.js";
import { BACKUPS_DIR, DATA_DIR } from "../shared/paths.js";

const EXCEL = path.join(DATA_DIR, "ucp_scraped_data.xlsx");
const CAMPUS_ID = "4717a5f7-ffcf-40d8-9eff-7baa8d9d63a8";

const KEYS = {
  eligibility: "eligibility",
  elig_qualification: "qualification",
  elig_min: "minPct",
  elig_subjects: "subjects",
  elig_note: "note",

  entry_test: "entryTest",
  test_body: "testBody",
  test_note: "entryNote",

  interview: "interviewOn",
  interview_note: "interviewNote",

  fees: "fees",
  fee_head: "head",
  fee_amount: "amount",
  fee_frequency: "frequency",
};

const LEGACY_KEYS = ["entry_test", "interview_required"];
const VALUES = {
  qualification: "Other",
  test_type: "University Test",
  freq_semester: "Per Semester",
  freq_once: "One Time",
};

const query = (sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows))),
  );

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const onlyI = args.indexOf("--only");
const ONLY = onlyI >= 0 ? String(args[onlyI + 1] || "").toLowerCase() : null;

const clean = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const num = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
};
const parsePercent = (txt) => {
  const m = String(txt || "").match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? Number(m[1]) : null;
};
const safeJson = (v) => {
  if (!v) return {};
  if (typeof v === "object") return v;
  try { return JSON.parse(v) || {}; } catch { return {}; }
};

const buildDetails = (r) => {
  const out = {};

  out[KEYS.eligibility] = [{
    [KEYS.elig_qualification]: VALUES.qualification,
    [KEYS.elig_min]: parsePercent(r.min_marks) ?? parsePercent(r.min_qualification) ?? "",
    [KEYS.elig_subjects]: "",
    [KEYS.elig_note]: r.min_qualification || "",
  }];

  if (r.entrance_test) {
    out[KEYS.entry_test] = VALUES.test_type;
    out[KEYS.test_body] = /GRE/i.test(r.entrance_test) ? "UCP / HEC (GRE-HAT)" : "UCP";
    out[KEYS.test_note] = r.entrance_test;
    if (/interview/i.test(r.entrance_test)) {
      out[KEYS.interview] = true;
      out[KEYS.interview_note] = "";
    }
  }

  const fees = [];
  if (r.semester_fee) fees.push({ [KEYS.fee_head]: "Tuition Fee", [KEYS.fee_amount]: r.semester_fee, [KEYS.fee_frequency]: VALUES.freq_semester });
  if (r.admission_fee) fees.push({ [KEYS.fee_head]: "Admission Fee", [KEYS.fee_amount]: r.admission_fee, [KEYS.fee_frequency]: VALUES.freq_once });
  if (fees.length) out[KEYS.fees] = fees;

  return out;
};

const run = async () => {
  await dbReady;

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL);
  const sheet = wb.getWorksheet("Campus_Programs");
  if (!sheet) throw new Error('Sheet "Campus_Programs" not found');

  const col = {};
  sheet.getRow(1).eachCell((c, i) => { col[String(c.value || "").trim().toLowerCase()] = i; });
  const get = (row, k) => (col[k] ? clean(row.getCell(col[k]).text) : null);

  const excel = new Map();
  const dupExcel = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const original = get(row, "original_name");
    if (!original) continue;
    const obj = {
      original_name: original,
      program_name: get(row, "program_name"),
      duration: get(row, "program_duration"),
      semester_fee: num(get(row, "semester_fee_pkr")),
      admission_fee: num(get(row, "admission_fee_pkr")),
      security_deposit: num(get(row, "security_deposit_pkr")),
      min_qualification: get(row, "min_qualification"),
      min_marks: get(row, "min_marks"),
      entrance_test: get(row, "entrance_test"),
    };
    if (excel.has(original)) dupExcel.push(original);
    excel.set(original, obj);
  }

  const dbRows = await query(
    `SELECT cp.id, cp.duration, cp.details, cp.status, p.original_name, p.name
     FROM campus_programs cp
     JOIN programs p ON p.id = cp.program_id
     WHERE cp.campus_id = ?`,
    [CAMPUS_ID],
  );

  const targets = [];
  const dbNoExcel = [];
  const seenExcel = new Set();
  for (const d of dbRows) {
    const e = excel.get(d.original_name);
    if (!e) { dbNoExcel.push(d.original_name || d.name); continue; }
    seenExcel.add(d.original_name);
    if (ONLY && !String(d.original_name + " " + d.name).toLowerCase().includes(ONLY)) continue;
    targets.push({ d, e });
  }
  const excelNoDb = [...excel.keys()].filter((k) => !seenExcel.has(k));

  console.log(`Mode: ${APPLY ? "APPLY (writing to DB)" : "DRY RUN (nothing is written)"}`);
  console.log(`DB offerings: ${dbRows.length} | Excel rows: ${excel.size} | to process: ${targets.length}\n`);

  if (APPLY && targets.length) {
    const dir = BACKUPS_DIR;
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `campus_programs_backup_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(targets.map(({ d }) => ({
      id: d.id, duration: d.duration, details: d.details, status: d.status,
    })), null, 2));
    console.log(`Backup saved: ${file}\n`);
  }

  let written = 0;
  const notInExcel = { security_deposit: 0, min_percentage: 0, fees: 0 };
  for (const { d, e } of targets) {
    const merged = { ...safeJson(d.details), ...buildDetails(e) };
    for (const k of LEGACY_KEYS) delete merged[k];
    const newDetails = merged;
    const duration = e.duration || d.duration || null;

    if (!e.security_deposit) notInExcel.security_deposit++;
    if (parsePercent(e.min_marks) == null && parsePercent(e.min_qualification) == null) notInExcel.min_percentage++;
    if (!e.semester_fee && !e.admission_fee) notInExcel.fees++;

    if (ONLY || !APPLY) {
      console.log(`--- ${d.original_name}`);
      console.log(`    duration: ${duration}`);
      console.log(`    details : ${JSON.stringify(newDetails)}`);
    }

    if (APPLY) {
      await query(
        "UPDATE campus_programs SET details = ?, duration = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(newDetails), duration, d.id],
      );
      written++;
    }
  }

  const report = {
    mode: APPLY ? "apply" : "dry-run",
    processed: targets.length,
    written,
    excel_rows_without_db_offering: excelNoDb,
    db_offerings_without_excel_row: dbNoExcel,
    duplicate_original_names_in_excel: dupExcel,
    rows_missing_security_deposit: notInExcel.security_deposit,
    rows_missing_min_percentage: notInExcel.min_percentage,
    rows_missing_fees: notInExcel.fees,
    NOT_FILLED_BECAUSE_NOT_IN_EXCEL: [
      "shifts (Morning/Evening/Weekend)",
      "Total Seats",
      "Program Contact Email",
      "Merit Formula components (Excel has only a text paragraph)",
      "Required Subjects",
      "Interview Required (only set to true when entrance_test text mentions Interview)",
      "Security deposit fee head (column empty in Excel)",
    ],
  };
  const repFile = path.join(BACKUPS_DIR, "fill_details_report.json");
  fs.mkdirSync(path.dirname(repFile), { recursive: true });
  fs.writeFileSync(repFile, JSON.stringify(report, null, 2));

  console.log("\n===== REPORT =====");
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${repFile}`);
  if (!APPLY) console.log("\nDry run only. Add --apply to write.");
  process.exit(0);
};

run().catch((e) => { console.error("fillCampusProgramDetails failed:", e); process.exit(1); });