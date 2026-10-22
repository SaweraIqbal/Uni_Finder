/**
 * fillCampusSocieties.js
 *
 * Imports the "Campus_Societies" sheet of ucp_scraped_data.xlsx into
 * `campus_societies` for the UCP Lahore campus.
 *
 * Place in : src/backend/config/fillCampusSocieties.js
 * Excel in : src/backend/data/ucp_scraped_data.xlsx
 *
 * Usage (run from src/backend):
 *   node config/fillCampusSocieties.js           -> DRY RUN (prints what would happen)
 *   node config/fillCampusSocieties.js --apply   -> writes to DB
 *
 * Safety:
 *  - Default is dry run. Before --apply, existing societies of this campus are backed up to backups/.
 *  - Never deletes anything. Re-running is safe: a society with the same name is UPDATED, not duplicated.
 *  - Categories are converted to the 8 options the admin form knows (see CAT_MAP).
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import db, { dbReady } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL     = path.join(__dirname, "../data/ucp_scraped_data.xlsx");
const CAMPUS_ID = "4717a5f7-ffcf-40d8-9eff-7baa8d9d63a8"; // UCP Lahore Campus
const TABLE     = "campus_societies";

// Categories offered by the admin form (SocietiesPage CATEGORIES)
const VALID_CATS = [
  "Technical", "Sports", "Literary", "Cultural", "Media",
  "Religious", "Social Welfare", "Entrepreneurship",
];
// Excel category -> form category (lower-cased keys)
const CAT_MAP = {
  "social service":                  "Social Welfare",
  "professional (ieee, acm, etc.)":  "Technical",
  "fine arts":                       "Cultural",
};

// ── helpers ──────────────────────────────────────────────────────────────────
const query = (sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows))),
  );

const APPLY = process.argv.includes("--apply");

const clean = (v) => {
  const s = String(v ?? "").trim();
  return s === "" || s.toLowerCase() === "nan" ? null : s;
};

const mapCategory = (raw) => {
  const c = clean(raw);
  if (!c) return { value: null, changed: false, known: false };
  const mapped = CAT_MAP[c.toLowerCase()];
  if (mapped) return { value: mapped, changed: true, known: true };
  const direct = VALID_CATS.find((v) => v.toLowerCase() === c.toLowerCase());
  if (direct) return { value: direct, changed: direct !== c, known: true };
  return { value: c, changed: false, known: false }; // unknown: keep as-is, reported
};

const makeInitials = (name) => {
  const words = String(name).replace(/[^A-Za-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  return words.slice(0, 3).map((w) => w[0].toUpperCase()).join("") || "?";
};

// varchar(N) length from SHOW COLUMNS "Type"
const maxLenOf = (colMeta, field) => {
  const m = String(colMeta[field]?.Type || "").match(/\((\d+)\)/);
  return m ? Number(m[1]) : null;
};
const fit = (val, max, warn, label) => {
  if (val == null || !max || String(val).length <= max) return val;
  warn.push(`${label} longer than column (${max}) -> truncated: "${val}"`);
  return String(val).slice(0, max);
};

// ── main ─────────────────────────────────────────────────────────────────────
const run = async () => {
  await dbReady;

  // 1. table / column info
  let colMeta = {};
  try {
    for (const c of await query(`SHOW COLUMNS FROM ${TABLE}`)) colMeta[c.Field] = c;
  } catch {
    console.error(`Table "${TABLE}" not found. Run in MySQL: SHOW TABLES LIKE '%societ%';`);
    process.exit(1);
  }
  const idAuto = String(colMeta.id?.Extra || "").includes("auto_increment");
  console.log(`Table ${TABLE} columns: ${Object.keys(colMeta).join(", ")}  (id auto_increment: ${idAuto})`);

  // 2. read Excel
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL);
  const sheet = wb.getWorksheet("Campus_Societies");
  if (!sheet) throw new Error('Sheet "Campus_Societies" not found');

  const col = {};
  sheet.getRow(1).eachCell((c, i) => { col[String(c.value || "").trim().toLowerCase()] = i; });
  for (const need of ["name", "category"]) if (!col[need]) throw new Error(`Missing column: ${need}`);
  const get = (row, k) => (col[k] ? clean(row.getCell(col[k]).text) : null);

  const rows = [];
  const seen = new Set();
  const dupInExcel = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const name = get(row, "name");
    if (!name) continue;
    if (seen.has(name.toLowerCase())) { dupInExcel.push(name); continue; }
    seen.add(name.toLowerCase());
    rows.push({
      name,
      category:    get(row, "category"),
      description: get(row, "description"),
      initials:    get(row, "initials"),
    });
  }

  // 3. existing rows of this campus
  const existing = await query(`SELECT * FROM ${TABLE} WHERE campus_id = ?`, [CAMPUS_ID]);
  const existingByName = new Map(existing.map((r) => [String(r.name).trim().toLowerCase(), r]));

  // 4. plan
  const warnings = [];
  const unknownCats = new Set();
  const catChanges = {};
  const plan = rows.map((r) => {
    const cat = mapCategory(r.category);
    if (!cat.known) unknownCats.add(r.category);
    if (cat.changed) { const k = `${r.category} -> ${cat.value}`; catChanges[k] = (catChanges[k] || 0) + 1; }
    return {
      ...r,
      category: cat.value,
      name:        fit(r.name, maxLenOf(colMeta, "name"), warnings, "name"),
      initials:    fit(r.initials || makeInitials(r.name), maxLenOf(colMeta, "initials"), warnings, "initials"),
      description: fit(r.description, maxLenOf(colMeta, "description"), warnings, "description"),
      existing:    existingByName.get(r.name.toLowerCase()) || null,
    };
  });
  const toInsert = plan.filter((p) => !p.existing).length;
  const toUpdate = plan.length - toInsert;

  console.log(`\nMode: ${APPLY ? "APPLY (writing to DB)" : "DRY RUN (nothing is written)"}`);
  console.log(`Excel societies: ${rows.length} | already in DB for this campus: ${existing.length} | will INSERT: ${toInsert} | will UPDATE: ${toUpdate}\n`);
  if (!APPLY) {
    plan.forEach((p, i) =>
      console.log(`${String(i + 1).padStart(2)}. [${p.category}] ${p.name}  (${p.initials})${p.existing ? "  <- exists, will update" : ""}`),
    );
  }

  // 5. write
  if (APPLY) {
    const dir = path.join(__dirname, "../backups");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `campus_societies_backup_${Date.now()}.json`), JSON.stringify(existing, null, 2));

    let inserted = 0, updated = 0;
    for (const p of plan) {
      if (p.existing) {
        await query(
          `UPDATE ${TABLE} SET category=?, description=?, initials=?, updated_at=NOW() WHERE id=?`,
          [p.category, p.description, p.initials, p.existing.id],
        );
        updated++;
      } else if (idAuto) {
        await query(
          `INSERT INTO ${TABLE} (campus_id, name, category, description, initials, created_at, updated_at)
           VALUES (?,?,?,?,?,NOW(),NOW())`,
          [CAMPUS_ID, p.name, p.category, p.description, p.initials],
        );
        inserted++;
      } else {
        await query(
          `INSERT INTO ${TABLE} (id, campus_id, name, category, description, initials, created_at, updated_at)
           VALUES (?,?,?,?,?,?,NOW(),NOW())`,
          [randomUUID(), CAMPUS_ID, p.name, p.category, p.description, p.initials],
        );
        inserted++;
      }
    }
    console.log(`Saved: ${inserted} inserted, ${updated} updated.`);
  }

  // 6. report
  console.log("\n===== REPORT =====");
  console.log(JSON.stringify({
    mode: APPLY ? "apply" : "dry-run",
    excel_rows: rows.length,
    to_insert: toInsert,
    to_update_existing: toUpdate,
    category_conversions: catChanges,
    categories_not_in_admin_form: [...unknownCats],
    duplicate_names_in_excel_skipped: dupInExcel,
    truncation_warnings: warnings,
  }, null, 2));
  if (!APPLY) console.log("\nDry run only. Add --apply to write.");
  process.exit(0);
};

run().catch((e) => { console.error("fillCampusSocieties failed:", e); process.exit(1); });
