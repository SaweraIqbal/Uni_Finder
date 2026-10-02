/**
 * seedUniversities.js
 * Imports hec_universities.xlsx → universities table.
 * Idempotent: upsert by normalized_name.
 * HEC columns written only by this job — admin fields (owner_uid, etc.) never touched.
 * Rank "N/A" → NULL. Domain "*" or blank → NULL. campus_count from "Total Campuses".
 */
import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import path from "path";
import db from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKBOOK_PATH = path.join(__dirname, "../data/hec_universities.xlsx");

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

/** Strip punctuation/extra-spaces → lowercase normalized key for matching */
export const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanCell = (value) => {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" || s === "*" || s.toLowerCase() === "n/a" ? null : s;
};

const cleanEmailOrDomain = (value) => {
  const c = cleanCell(value);
  return c ? c.replace(/\s+/g, "").toLowerCase() : null;
};

const parseRank = (value) => {
  const c = cleanCell(value);
  if (!c) return null;
  const n = parseInt(c, 10);
  return Number.isFinite(n) ? n : null;
};

/** Returns "@domain.edu.pk" or NULL */
const parseDomain = (value) => {
  const c = cleanEmailOrDomain(value);
  if (!c) return null;
  const stripped = c.replace(/^@+/, "");
  return stripped ? `@${stripped}` : null;
};

const importUniversities = async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(WORKBOOK_PATH);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) throw new Error("HEC workbook is empty.");

  // Map header names → column indexes (case-insensitive)
  const headerMap = new Map();
  sheet.getRow(1).eachCell((cell, col) => {
    headerMap.set(String(cell.value || "").trim().toLowerCase(), col);
  });

  const required = [
    "rank", "university name", "campuses",
    "total campuses", "type", "oric domain",
    "focal person name", "focal person email",
  ];
  const missing = required.filter((h) => !headerMap.has(h));
  if (missing.length) throw new Error(`HEC workbook missing columns: ${missing.join(", ")}`);

  let inserted = 0;
  let updated = 0;
  const unrecognized = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const read = (h) => cleanCell(row.getCell(headerMap.get(h)).text);

    const name = read("university name");
    if (!name) continue;

    const normalized = normalizeName(name);
    const oricDomain = parseDomain(read("oric domain"));
    const campusesText = read("campuses");
    const totalCampusesRaw = read("total campuses");
    const campusCount = totalCampusesRaw ? (parseInt(totalCampusesRaw, 10) || 0) : 0;

    const data = {
      hec_rank:          parseRank(read("rank")),
      university_type:   read("type"),            // "Public" or "Private"
      oric_domain:       oricDomain,
      focal_person_name: read("focal person name"),
      focal_person_email: cleanEmailOrDomain(read("focal person email")),
      campuses_text:     campusesText,
      campus_count:      campusCount,
      // Keep legacy columns in sync
      total_campuses:    totalCampusesRaw,
      domain:            oricDomain ? oricDomain.slice(1) : null,
      campuses:          campusesText,
      is_hec_listed:     1,
      last_synced_at:    new Date(),
    };

    // Try to find existing row by normalized_name
    const existing = await query(
      "SELECT id FROM universities WHERE normalized_name = ? LIMIT 1",
      [normalized],
    );

    if (existing.length) {
      // UPDATE — explicit column list; NEVER touch owner_uid or profile columns
      await query(
        `UPDATE universities
         SET hec_rank          = ?,
             university_type   = ?,
             oric_domain       = ?,
             focal_person_name = ?,
             focal_person_email= ?,
             campuses_text     = ?,
             campus_count      = ?,
             total_campuses    = ?,
             domain            = ?,
             campuses          = ?,
             is_hec_listed     = 1,
             last_synced_at    = NOW()
         WHERE normalized_name = ?`,
        [
          data.hec_rank, data.university_type, data.oric_domain,
          data.focal_person_name, data.focal_person_email,
          data.campuses_text, data.campus_count,
          data.total_campuses, data.domain, data.campuses,
          normalized,
        ],
      );
      updated++;
    } else {
      // Try legacy name match (old rows may not have normalized_name yet)
      const legacyMatch = await query(
        "SELECT id, normalized_name FROM universities WHERE LOWER(name) = LOWER(?) LIMIT 1",
        [name],
      );

      if (legacyMatch.length) {
        await query(
          `UPDATE universities
           SET normalized_name  = ?,
               hec_rank          = ?,
               university_type   = ?,
               oric_domain       = ?,
               focal_person_name = ?,
               focal_person_email= ?,
               campuses_text     = ?,
               campus_count      = ?,
               total_campuses    = ?,
               domain            = ?,
               campuses          = ?,
               is_hec_listed     = 1,
               last_synced_at    = NOW()
           WHERE id = ?`,
          [
            normalized,
            data.hec_rank, data.university_type, data.oric_domain,
            data.focal_person_name, data.focal_person_email,
            data.campuses_text, data.campus_count,
            data.total_campuses, data.domain, data.campuses,
            legacyMatch[0].id,
          ],
        );
        updated++;
      } else {
        // INSERT — new university
        const id = uuidv4();
        await query(
          `INSERT INTO universities
             (id, name, normalized_name, hec_rank, university_type,
              oric_domain, focal_person_name, focal_person_email,
              campuses_text, campus_count, total_campuses,
              domain, campuses, is_hec_listed, last_synced_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW())`,
          [
            id, name, normalized,
            data.hec_rank, data.university_type,
            data.oric_domain, data.focal_person_name, data.focal_person_email,
            data.campuses_text, data.campus_count, data.total_campuses,
            data.domain, data.campuses,
          ],
        );
        inserted++;
      }
    }
  }

  // Record sync in import log so duplicate-run guard works
  await query(
    `INSERT INTO university_master_imports (source_file, imported_at)
     VALUES ('hec_universities.xlsx', NOW())
     ON DUPLICATE KEY UPDATE imported_at = NOW()`,
  );

  console.log(
    `HEC sync complete: ${inserted} inserted, ${updated} updated` +
    (unrecognized.length ? `, ${unrecognized.length} unrecognized skipped` : "") + ".",
  );

  return { inserted, updated };
};

export default importUniversities;
