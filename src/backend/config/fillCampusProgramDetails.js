
/**
 * Riphah Sahiwal Campus - Fill Program Details
 *
 * Run from src/backend:
 *
 * DRY RUN:
 * node config/fillRiphahSahiwalProgramDetails.js
 *
 * APPLY:
 * node config/fillRiphahSahiwalProgramDetails.js --apply
 *
 * ONE PROGRAM:
 * node config/fillRiphahSahiwalProgramDetails.js --only "Nursing"
 *
 * Uses:
 * data/riphah_scraped_data.xlsx
 *
 * Updates existing campus_programs only.
 * Does not create programs or campus links.
 */

import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db, { dbReady } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXCEL = path.join(
  __dirname,
  "../data/riphah_scraped_data.xlsx"
);

const UNIVERSITY_ID =
  "c0bd39b1-db6a-445d-b64a-393edc9e2cb0";

const CAMPUS_ID =
  "023eeb44-3f49-481d-910a-18aeb42de178";

const args = process.argv.slice(2);

const APPLY = args.includes("--apply");

const onlyIndex = args.indexOf("--only");

const ONLY =
  onlyIndex >= 0
    ? String(args[onlyIndex + 1] || "").trim().toLowerCase()
    : null;

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const text = (value) =>
  String(value ?? "").trim();

const number = (value) => {
  const raw = text(value).replace(/,/g, "");

  if (!raw) return null;

  const n = Number(raw);

  return Number.isFinite(n) && n >= 0 ? n : null;
};

const percent = (value) => {
  const match = text(value).match(
    /(\d+(?:\.\d+)?)\s*%/
  );

  return match ? Number(match[1]) : null;
};

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

function parseDetails(raw) {
  if (!raw) return {};

  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw;
  }

  try {
    const value = JSON.parse(raw);

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return value;
    }
  } catch {
    // Throw below instead of silently replacing old data.
  }

  throw new Error(
    "Existing details contains invalid JSON"
  );
}

function excelRows(sheet) {
  if (!sheet) {
    throw new Error(
      'Excel sheet "Campus_Programs" missing'
    );
  }

  const columns = {};

  sheet.getRow(1).eachCell((cell, index) => {
    columns[normalize(cell.text)] = index;
  });

  const rows = [];

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    const get = (column) => {
      const index = columns[column];

      return index
        ? text(row.getCell(index).text)
        : "";
    };

    rows.push({
      excelRow: i,
      get,
    });
  }

  return rows;
}

function makeDetails(program) {
  const details = {};

  // 1. Fees
  const fees = [];

  if (program.semesterFee !== null) {
    fees.push({
      head: "Tuition Fee",
      amount: program.semesterFee,
      frequency: "Per Semester",
    });
  }

  if (program.admissionFee !== null) {
    fees.push({
      head: "Admission Fee",
      amount: program.admissionFee,
      frequency: "One Time",
    });
  }

  if (program.securityDeposit !== null) {
    fees.push({
      head: "Security Deposit",
      amount: program.securityDeposit,
      frequency: "One Time",
    });
  }

  if (fees.length > 0) {
    details.fees = fees;
  }

  // 2. Eligibility
  const minPct =
    percent(program.minMarks) ??
    percent(program.minQualification);

  if (
    program.minMarks ||
    program.minQualification
  ) {
    details.eligibility = [
      {
        qualification: "Other",
        minPct: minPct ?? "",
        subjects: "",
        note: [
          program.minQualification,
          program.minMarks,
        ]
          .filter(Boolean)
          .join("; "),
      },
    ];
  }

  // 3. Entry test
  if (program.entranceTest) {
    details.entryTest = "University Test";

    details.testBody =
      /GRE|HAT/i.test(program.entranceTest)
        ? "Riphah / HEC (GRE-HAT)"
        : "Riphah";

    details.entryNote = program.entranceTest;

    if (/interview/i.test(program.entranceTest)) {
      details.interviewOn = true;
      details.interviewNote = "";
    }
  }

  // 4. Other Excel details
  const source = {};

  const fields = {
    annual_fee_pkr: program.annualFee,
    total_semesters: program.totalSemesters,
    total_degree_cost_pkr: program.totalCost,
    credit_hours: program.creditHours,
    delivery_mode: program.deliveryMode,
    merit_criteria: program.meritCriteria,
    academic_level: program.academicLevel,
    degree_type: program.degreeType,
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== "") {
      source[key] = value;
    }
  }

  if (Object.keys(source).length) {
    details.sahiwalExcelSource = source;
  }

  return details;
}

function mergeDetails(existing, patch) {
  const merged = {
    ...existing,
    ...patch,
  };

  // Preserve old data when Excel has no value.
  // Keep unrelated fields unchanged.

  return merged;
}

async function main() {
  await dbReady;

  // Confirm correct campus.
  const campuses = await query(
    `SELECT id, name, university_id
     FROM campuses
     WHERE id = ?`,
    [CAMPUS_ID]
  );

  if (
    campuses.length !== 1 ||
    campuses[0].university_id !== UNIVERSITY_ID ||
    !normalize(campuses[0].name).includes("sahiwal")
  ) {
    throw new Error(
      "Riphah Sahiwal campus verification failed"
    );
  }

  console.log(
    `Campus: ${campuses[0].name} (${CAMPUS_ID})`
  );

  // Read Excel.
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(EXCEL);

  const sheet = workbook.getWorksheet(
    "Campus_Programs"
  );

  const programs = new Map();

  for (const { get, excelRow } of excelRows(sheet)) {
    const university = normalize(
      get("university_name")
    );

    const campus = normalize(
      get("campus_name")
    );

    if (
      university !== "riphah international university" ||
      !campus.includes("sahiwal")
    ) {
      continue;
    }

    const original = get("original_name");

    if (!original) {
      throw new Error(
        `Excel row ${excelRow}: original_name missing`
      );
    }

    const key = normalize(original);

    if (programs.has(key)) {
      throw new Error(
        `Duplicate Excel program: ${original}`
      );
    }

    programs.set(key, {
      original,
      programName: get("program_name"),
      degreeType: get("degree_type"),
      academicLevel: get("academic_level"),

      duration: get("program_duration"),

      semesterFee: number(
        get("semester_fee_pkr")
      ),

      annualFee: number(
        get("annual_fee_pkr")
      ),

      admissionFee: number(
        get("admission_fee_pkr")
      ),

      securityDeposit: number(
        get("security_deposit_pkr")
      ),

      totalSemesters: number(
        get("total_semesters")
      ),

      totalCost: number(
        get("total_degree_cost_pkr")
      ),

      creditHours: number(
        get("credit_hours")
      ),

      minQualification: get("min_qualification"),
      minMarks: get("min_marks"),
      entranceTest: get("entrance_test"),
      deliveryMode: get("delivery_mode"),
      meritCriteria: get("merit_criteria"),
    });
  }

  // Read existing campus program records.
  const dbPrograms = await query(
    `SELECT
       cp.id,
       cp.program_id,
       cp.duration,
       cp.details,
       cp.status,
       p.original_name,
       p.name
     FROM campus_programs cp
     JOIN programs p
       ON p.id = cp.program_id
     WHERE cp.campus_id = ?
       AND p.university_id = ?`,
    [CAMPUS_ID, UNIVERSITY_ID]
  );

  const targets = [];
  const missingInExcel = [];
  const matched = new Set();

  for (const dbProgram of dbPrograms) {
    const key = normalize(
      dbProgram.original_name
    );

    const excelProgram = programs.get(key);

    if (!excelProgram) {
      missingInExcel.push(
        dbProgram.original_name
      );
      continue;
    }

    matched.add(key);

    if (
      ONLY &&
      !normalize(
        dbProgram.original_name +
        " " +
        dbProgram.name
      ).includes(ONLY)
    ) {
      continue;
    }

    const oldDetails = parseDetails(
      dbProgram.details
    );

    const newDetails = mergeDetails(
      oldDetails,
      makeDetails(excelProgram)
    );

    const duration =
      excelProgram.duration ||
      dbProgram.duration ||
      null;

    targets.push({
      id: dbProgram.id,
      original: dbProgram.original_name,
      duration,
      oldDuration: dbProgram.duration,
      oldDetails: dbProgram.details,
      oldStatus: dbProgram.status,
      newDetails,
    });
  }

  const missingInDB = [
    ...programs.entries(),
  ]
    .filter(([key]) => !matched.has(key))
    .map(([, program]) => program.original);

  console.log(
    `Mode: ${APPLY ? "APPLY" : "DRY RUN"}`
  );

  console.log(
    `Excel Sahiwal programs: ${programs.size}`
  );

  console.log(
    `DB Sahiwal programs: ${dbPrograms.length}`
  );

  console.log(
    `Programs to update: ${targets.length}`
  );

  console.log(
    `Excel programs missing in DB: ${missingInDB.length}`
  );

  console.log(
    `DB programs missing in Excel: ${missingInExcel.length}`
  );

  if (missingInDB.length) {
    console.log(
      "Missing in DB:",
      missingInDB.join(" | ")
    );
  }

  if (missingInExcel.length) {
    console.log(
      "Missing in Excel:",
      missingInExcel.join(" | ")
    );
  }

  // Prevent incomplete or wrong-campus imports.
  if (
    programs.size !== 20 ||
    dbPrograms.length !== 20 ||
    missingInDB.length ||
    missingInExcel.length
  ) {
    throw new Error(
      "Validation failed. Expected exactly 20 matching Sahiwal programs. No writes."
    );
  }

  // Preview all changes.
  for (const target of targets) {
    console.log(
      `\n--- UPDATE ${target.original}`
    );

    console.log(
      `Duration: ${target.duration}`
    );

    console.log(
      `Details: ${JSON.stringify(target.newDetails)}`
    );
  }

  if (!APPLY) {
    console.log(
      "\nDry run complete. No database changes."
    );

    return;
  }

  // Backup affected rows before writing.
  const backupDir = path.join(
    __dirname,
    "../backups"
  );

  fs.mkdirSync(backupDir, {
    recursive: true,
  });

  const backupFile = path.join(
    backupDir,
    `sahiwal_details_backup_${Date.now()}.json`
  );

  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      targets.map((target) => ({
        id: target.id,
        duration: target.oldDuration,
        details: target.oldDetails,
        status: target.oldStatus,
      })),
      null,
      2
    )
  );

  console.log(
    `Backup saved: ${backupFile}`
  );

  // Update only duration and details.
  // Status remains unchanged.
  let updated = 0;

  for (const target of targets) {
    await query(
      `UPDATE campus_programs
       SET duration = ?,
           details = ?,
           updated_at = NOW()
       WHERE id = ? AND campus_id = ?`,
      [
        target.duration,
        JSON.stringify(target.newDetails),
        target.id,
        CAMPUS_ID,
      ]
    );

    updated++;
  }

  console.log(
    `SUCCESS: ${updated} Sahiwal program details updated.`
  );

  console.log(
    "Existing program statuses were not changed."
  );
}

main().catch((error) => {
  console.error(
    "FAILED:",
    error.message
  );

  process.exitCode = 1;
});
