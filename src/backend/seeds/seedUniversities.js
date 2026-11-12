import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import db from "../shared/db.js";
import { DATA_DIR } from "../shared/paths.js";

const WORKBOOK_PATH = path.join(DATA_DIR, "hec_universities.xlsx");

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

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
      university_type:   read("type"),
      oric_domain:       oricDomain,
      focal_person_name: read("focal person name"),
      focal_person_email: cleanEmailOrDomain(read("focal person email")),
      campuses_text:     campusesText,
      campus_count:      campusCount,

      total_campuses:    totalCampusesRaw,
      domain:            oricDomain ? oricDomain.slice(1) : null,
      campuses:          campusesText,
      is_hec_listed:     1,
      last_synced_at:    new Date(),
    };

    const existing = await query(
      "SELECT id FROM universities WHERE normalized_name = ? LIMIT 1",
      [normalized],
    );

    if (existing.length) {

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
