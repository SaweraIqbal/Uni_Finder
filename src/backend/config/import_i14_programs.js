#!/usr/bin/env node
/**
 * Riphah I-14 Campus programs: Excel -> MySQL (Node.js)
 *
 * Install:   npm install xlsx mysql2
 * Dry run:   node import_i14_programs.js --dry-run
 * Real run:  node import_i14_programs.js --host localhost --user root --password XXX --db mydb
 *
 * Options:
 *   --excel      Excel file path (default: riphah_scraped_data.xlsx)
 *   --campus-id  I-14 campus ki id (agar pata ho; warna name se dhoondta hai)
 *   --dry-run    Database mein kuch nahi likhta, sirf preview
 *
 * Env variables bhi chalte hain: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */
const XLSX = require("xlsx");
const mysql = require("mysql2/promise");

// =====================================================================
// CONFIG
// =====================================================================
const CAMPUS_NAME_FILTER = "I-14"; // Excel campus_name mein ye text hona chahiye
const T_CAMPUSES = "campuses";
const T_PROGRAMS = "programs";
const T_CAMPUS_PROGRAMS = "campus_programs";
const STATUS_VALUE = "active"; // campus_programs.status ki value (apne system ke hisaab se badlein)

// Jin rows mein semesters/duration khali ho unke liye defaults
const LEVEL_DEFAULTS = {
  Undergraduate: { semesters: 8, duration: "4 Years" },
  MS: { semesters: 4, duration: "2 Years" },
  PhD: { semesters: 6, duration: "3 Years" },
};

// =====================================================================
function parseArgs() {
  const a = process.argv.slice(2);
  const out = {
    excel: "../data/riphah_scraped_data.xlsx",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    db: process.env.DB_NAME,
    campusId: null,
    dryRun: false,
  };
  for (let i = 0; i < a.length; i++) {
    switch (a[i]) {
      case "--excel": out.excel = a[++i]; break;
      case "--host": out.host = a[++i]; break;
      case "--port": out.port = Number(a[++i]); break;
      case "--user": out.user = a[++i]; break;
      case "--password": out.password = a[++i]; break;
      case "--db": out.db = a[++i]; break;
      case "--campus-id": out.campusId = Number(a[++i]); break;
      case "--dry-run": out.dryRun = true; break;
    }
  }
  return out;
}

const clean = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  return v;
};
const num = (v) => {
  v = clean(v);
  if (v === null) return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

function readSheet(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Excel mein '${name}' sheet nahi mili`);
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function loadPrograms(excelPath) {
  const wb = XLSX.readFile(excelPath);
  const campusRows = readSheet(wb, "Campus_Programs").filter(
    (r) => r.campus_name && String(r.campus_name).includes(CAMPUS_NAME_FILTER)
  );
  if (!campusRows.length) {
    throw new Error(`Excel mein '${CAMPUS_NAME_FILTER}' campus ke programs nahi mile.`);
  }

  // Programs_Master se specialization/track
  const master = {};
  try {
    for (const m of readSheet(wb, "Programs_Master")) {
      if (m.original_name && !master[m.original_name]) master[m.original_name] = m;
    }
  } catch (_) {}

  return campusRows.map((r) => {
    const level = clean(r.academic_level);
    const def = LEVEL_DEFAULTS[level] || {};
    const semesters = num(r.total_semesters) ?? def.semesters ?? null;
    const duration = clean(r.program_duration) ?? def.duration ?? null;
    const semesterFee = num(r.semester_fee_pkr);
    const m = master[r.original_name] || {};

    const program = {
      name: clean(r.program_name),
      original_name: clean(r.original_name),
      degree_type: clean(r.degree_type),
      level,
      specialization: clean(m.specialization),
      track: clean(m.track) || "Regular Track",
    };

    // campus_programs.details (JSON): jo fields table mein alag column nahi rakhte
    const details = {
      semester_fee: semesterFee,
      annual_fee: num(r.annual_fee_pkr),
      admission_fee: num(r.admission_fee_pkr),
      security_deposit: num(r.security_deposit_pkr),
      total_semesters: semesters,
      total_degree_cost:
        num(r.total_degree_cost_pkr) ?? (semesterFee && semesters ? semesterFee * semesters : null),
      credit_hours: num(r.credit_hours),
      min_qualification: clean(r.min_qualification),
      min_marks: clean(r.min_marks),
      entrance_test: clean(r.entrance_test),
      merit_criteria: clean(r.merit_criteria),
      delivery_mode: clean(r.delivery_mode),
      academic_level: level,
      currency: "PKR",
    };
    // null values hata dein taake JSON saaf rahe
    Object.keys(details).forEach((k) => details[k] === null && delete details[k]);

    return {
      program,
      cp: { fee: semesterFee, duration, details: JSON.stringify(details) },
    };
  });
}

async function getColumns(conn, table) {
  const [rows] = await conn.query(`SHOW COLUMNS FROM \`${table}\``);
  return new Set(rows.map((r) => r.Field));
}

async function findId(conn, table, where) {
  const keys = Object.keys(where);
  const sql = `SELECT id FROM \`${table}\` WHERE ${keys.map((k) => `\`${k}\` <=> ?`).join(" AND ")}`;
  const [rows] = await conn.query(sql, keys.map((k) => where[k]));
  return rows.length ? rows[0].id : null;
}

async function insertRow(conn, table, data) {
  const cols = Object.keys(data);
  const sql = `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols
    .map(() => "?")
    .join(", ")})`;
  const [res] = await conn.query(sql, cols.map((c) => data[c]));
  return res.insertId;
}

async function updateRow(conn, table, id, data) {
  const cols = Object.keys(data);
  const sql = `UPDATE \`${table}\` SET ${cols.map((c) => `\`${c}\`=?`).join(", ")} WHERE id=?`;
  await conn.query(sql, [...cols.map((c) => data[c]), id]);
}

const pick = (obj, allowed) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => allowed.has(k)));

async function main() {
  const args = parseArgs();
  const rows = loadPrograms(args.excel);
  console.log(`Excel se ${rows.length} programs mile (${CAMPUS_NAME_FILTER} campus).`);

  if (args.dryRun) {
    for (const { program, cp } of rows) {
      console.log(
        `  - ${String(program.original_name).padEnd(40)} fee=${cp.fee}  duration=${cp.duration}`
      );
    }
    console.log("\nSample details JSON:\n", rows[0].cp.details);
    console.log("\nDry run: database mein kuch nahi likha gaya.");
    return;
  }

  if (!args.db) throw new Error("--db (database name) dein ya DB_NAME env variable set karein.");

  const conn = await mysql.createConnection({
    host: args.host,
    port: args.port,
    user: args.user,
    password: args.password,
    database: args.db,
    charset: "utf8mb4",
  });

  try {
    // 1) Campus id
    let campusId = args.campusId;
    if (!campusId) {
      const [found] = await conn.query(
        `SELECT id, name FROM \`${T_CAMPUSES}\` WHERE name LIKE ?`,
        [`%${CAMPUS_NAME_FILTER}%`]
      );
      if (!found.length) throw new Error(`'${T_CAMPUSES}' mein I-14 campus nahi mila. --campus-id dein.`);
      if (found.length > 1) {
        throw new Error(`Ek se zyada campus mile: ${JSON.stringify(found)}. --campus-id se sahi id dein.`);
      }
      campusId = found[0].id;
      console.log(`Campus mila: [${campusId}] ${found[0].name}`);
    }

    const progCols = await getColumns(conn, T_PROGRAMS);
    const cpCols = await getColumns(conn, T_CAMPUS_PROGRAMS);

    await conn.beginTransaction();
    let newP = 0, updP = 0, newCP = 0, updCP = 0;

    for (const { program, cp } of rows) {
      // 2) programs table (sirf wahi columns jo table mein hain)
      const progData = pick(program, progCols);
      const matchKey = progCols.has("original_name") ? "original_name" : "name";
      let programId = await findId(conn, T_PROGRAMS, { [matchKey]: progData[matchKey] });
      if (programId) {
        await updateRow(conn, T_PROGRAMS, programId, progData);
        updP++;
      } else {
        programId = await insertRow(conn, T_PROGRAMS, progData);
        newP++;
      }

      // 3) campus_programs table (campus admin yahi dekhta hai)
      const cpData = pick({ ...cp, status: STATUS_VALUE }, cpCols);
      const existing = await findId(conn, T_CAMPUS_PROGRAMS, { campus_id: campusId, program_id: programId });
      if (existing) {
        if (cpCols.has("updated_at")) cpData.updated_at = new Date();
        await updateRow(conn, T_CAMPUS_PROGRAMS, existing, cpData);
        updCP++;
      } else {
        const now = new Date();
        const data = { campus_id: campusId, program_id: programId, ...cpData };
        if (cpCols.has("created_at")) data.created_at = now;
        if (cpCols.has("updated_at")) data.updated_at = now;
        await insertRow(conn, T_CAMPUS_PROGRAMS, data);
        newCP++;
      }
    }

    await conn.commit();
    console.log(`\nDone.
  programs:        ${newP} naye, ${updP} update
  campus_programs: ${newCP} naye, ${updCP} update`);
  } catch (err) {
    await conn.rollback();
    console.error("Error aaya, saare changes rollback kar diye gaye.");
    throw err;
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
