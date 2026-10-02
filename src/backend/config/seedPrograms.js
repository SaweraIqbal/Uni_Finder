/**
 * seedPrograms.js  (Phase 2 rewrite)
 *
 * Reads programs.xlsx (all sheets), resolves each sheet to a university,
 * applies degree_map.json parsing rules, then upserts into the programs table.
 *
 * Key changes vs Phase 1:
 *  • Pre-dedupe map keyed by (university|name|level|COALESCE(spec,'')|COALESCE(track,''))
 *    — true duplicates are skipped with a logged report; no silent drops.
 *  • Captures any unmapped columns → programs.extra JSON (NULL when none).
 *  • ON DUPLICATE KEY UPDATE uses the new uq_prog_v2 key logic; NEVER touches
 *    status, submitted_by, created_via, reviewed_by, reviewed_at, rejection_reason.
 *  • MS/MPhil level → two rows (one MS, one MPhil) — per owner decision.
 *  • Associate Degree → ADP.
 *
 * Called from server.js after initSchema completes.
 */

import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import db from "./db.js";
import { normalizeName } from "./seedUniversities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const degreeMap    = require(path.join(__dirname, "../../../scripts/degree_map.json"));
const WORKBOOK_PATH = path.join(__dirname, "../data/programs.xlsx");

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// ── KNOWN columns (lower-cased) — any other column → extra ──────────────────
const KNOWN_COLS = new Set([
  "program name", "level", "specialization", "university name",
  "shift", "track",  // common alternates — also captured explicitly
]);

// ── Degree-parsing helpers (same as Phase 1) ────────────────────────────────

const resolveLevel = (sheetLevel) => {
  const val    = String(sheetLevel || "").trim();
  const mapped = degreeMap.levelFromSheetValue[val];
  if (!mapped)       return [null];
  if (mapped === "SPLIT") return ["MS", "MPhil"];
  return [mapped];
};

const extractTrack = (raw) => {
  let name = raw, track = null;
  for (const pattern of degreeMap.trackPatterns) {
    const re = new RegExp(
      `\\s*[\\(\\-–]\\s*${pattern.replace(/[()]/g, "\\$&")}\\s*\\)?\\s*$`,
      "i",
    );
    if (re.test(name)) { track = pattern; name = name.replace(re, "").trim(); break; }
  }
  return { name, track };
};

const extractSpecialization = (programName, specializationCol) => {
  if (specializationCol?.trim()) return { name: programName, specialization: specializationCol.trim() };
  let name = programName, specialization = null;
  for (const phrase of degreeMap.specializationPhrases) {
    const idx = name.indexOf(phrase);
    if (idx !== -1) {
      specialization = name.slice(idx + phrase.length).trim().replace(/[()]/g, "").trim();
      name           = name.slice(0, idx).trim();
      break;
    }
  }
  return { name: name.trim(), specialization: specialization || null };
};

const stripPrefix = (rawName, sheetLevel) => {
  const sorted = [...degreeMap.prefixMap].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const { prefix, degree_type } of sorted) {
    const re = new RegExp(`^${prefix.replace(/[.()]/g, "\\$&")}\\s*`, "i");
    if (re.test(rawName)) {
      const stripped  = rawName.replace(re, "").trim();
      const displayName = stripped || rawName;
      return { displayName, degreeType: degree_type };
    }
  }
  const levelHint = {
    Undergraduate: "BS", MS: "MS", MPhil: "MPhil",
    PhD: "PhD",          ADP: "ADP", Diploma: "Diploma",
  };
  return { displayName: rawName, degreeType: levelHint[sheetLevel] || "" };
};

/**
 * Parse one Excel row → array of program objects (1 or 2 for SPLIT).
 * @param {string} rawName     - verbatim program name from sheet
 * @param {string} sheetLevel  - verbatim level from sheet
 * @param {string} specCol     - Specialization column value (may be "")
 * @param {object|null} extra  - key/value of unmapped columns, or null
 */
const parseRow = (rawName, sheetLevel, specCol, extra) => {
  if (!rawName) return [];
  const levels = resolveLevel(sheetLevel);

  return levels.flatMap((level) => {
    const { name: afterTrack, track }          = extractTrack(rawName);
    const { name: afterSpec,  specialization } = extractSpecialization(afterTrack, specCol);
    const { displayName,      degreeType }     = stripPrefix(afterSpec, level || sheetLevel);

    return [{
      name:          displayName || rawName,
      degree_type:   degreeType,
      level,
      specialization,
      track,
      extra:         extra && Object.keys(extra).length ? JSON.stringify(extra) : null,
      original_name: rawName,
    }];
  });
};

// ── Dedupe key (same logic as the DB unique key) ─────────────────────────────
const dedupeKey = (universityId, name, level, spec, track) =>
  `${universityId}|${name}|${level ?? ""}|${spec ?? ""}|${track ?? ""}`;

// ── Main export ───────────────────────────────────────────────────────────────
const seedPrograms = async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(WORKBOOK_PATH);

  let totalInserted     = 0;
  let totalUpdated      = 0;
  const nullLevelReport = [];
  const dupReport       = [];           // true duplicates skipped
  const extraColsReport = [];           // files/sheets that had extra columns

  for (const sheet of workbook.worksheets) {
    // ── Build header map ───────────────────────────────────────────────────
    const headerMap  = new Map();   // colName(lower) → colIndex
    const extraCols  = [];          // unmapped column names (lower)
    sheet.getRow(1).eachCell((cell, col) => {
      const key = String(cell.value || "").trim().toLowerCase();
      headerMap.set(key, col);
      if (key && !KNOWN_COLS.has(key)) extraCols.push(key);
    });

    if (extraCols.length) {
      extraColsReport.push({ sheet: sheet.name, columns: extraCols });
      console.log(`[seedPrograms] "${sheet.name}" extra columns: ${extraCols.join(", ")}`);
    }

    const nameCol    = headerMap.get("program name");
    const levelCol   = headerMap.get("level");
    const specCol    = headerMap.get("specialization");
    const uniNameCol = headerMap.get("university name");
    const trackCol   = headerMap.get("track") || headerMap.get("shift");

    if (!nameCol || !levelCol) {
      console.warn(`[seedPrograms] Sheet "${sheet.name}" missing required columns — skipped.`);
      continue;
    }

    // ── Resolve university ─────────────────────────────────────────────────
    let universityId = null;
    if (uniNameCol) {
      for (let r = 2; r <= sheet.rowCount; r++) {
        const uniNameVal = String(sheet.getRow(r).getCell(uniNameCol).text || "").trim();
        if (!uniNameVal) continue;
        const norm = normalizeName(uniNameVal);
        const rows = await query(
          "SELECT id FROM universities WHERE normalized_name = ? LIMIT 1", [norm],
        );
        if (rows.length) { universityId = rows[0].id; }
        else {
          const fallback = await query(
            "SELECT id FROM universities WHERE LOWER(name) = LOWER(?) LIMIT 1", [uniNameVal],
          );
          if (fallback.length) universityId = fallback[0].id;
        }
        break;
      }
    }

    if (!universityId) {
      console.warn(`[seedPrograms] Could not resolve university for sheet "${sheet.name}" — skipped.`);
      continue;
    }

    // ── Per-sheet pre-dedupe map (key → first-seen row number) ─────────────
    const sheetSeen   = new Map();
    let sheetInserted = 0;
    let sheetUpdated  = 0;

    for (let r = 2; r <= sheet.rowCount; r++) {
      const row        = sheet.getRow(r);
      const rawName    = String(row.getCell(nameCol).text || "").trim();
      const sheetLevel = String(row.getCell(levelCol).text || "").trim();
      const specValue  = specCol  ? String(row.getCell(specCol).text  || "").trim() : "";
      const trackValue = trackCol ? String(row.getCell(trackCol).text || "").trim() : "";

      if (!rawName) continue;

      // ── Build extra object from unmapped columns ──────────────────────────
      let extra = null;
      if (extraCols.length) {
        const obj = {};
        for (const colName of extraCols) {
          const colIdx = headerMap.get(colName);
          const val    = colIdx ? String(row.getCell(colIdx).text || "").trim() : "";
          if (val) obj[colName] = val;
        }
        if (Object.keys(obj).length) extra = obj;
      }

      const parsed = parseRow(rawName, sheetLevel, specValue || trackValue, extra);

      for (const prog of parsed) {
        if (!prog.level) {
          nullLevelReport.push({ sheet: sheet.name, name: rawName, sheetLevel });
        }

        // ── Pre-dedupe check ──────────────────────────────────────────────
        const dk = dedupeKey(
          universityId, prog.name, prog.level,
          prog.specialization, prog.track,
        );
        if (sheetSeen.has(dk)) {
          dupReport.push({
            sheet:    sheet.name,
            row:      r,
            name:     rawName,
            level:    prog.level,
            spec:     prog.specialization,
            track:    prog.track,
            firstRow: sheetSeen.get(dk),
          });
          continue; // skip true duplicate — keep first occurrence
        }
        sheetSeen.set(dk, r);

        // ── Upsert with new unique key ─────────────────────────────────────
        // ON DUPLICATE KEY UPDATE: content columns ONLY — never status/created_via/etc.
        const id = uuidv4();
        const result = await query(
          `INSERT INTO programs
             (id, university_id, name, degree_type, level,
              specialization, track, extra, original_name,
              status, created_via)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'seed')
           ON DUPLICATE KEY UPDATE
             degree_type    = VALUES(degree_type),
             specialization = VALUES(specialization),
             track          = VALUES(track),
             extra          = VALUES(extra),
             original_name  = VALUES(original_name),
             updated_at     = NOW()`,
          [
            id, universityId, prog.name, prog.degree_type, prog.level,
            prog.specialization, prog.track,
            prog.extra,          // already JSON.stringify()'d or null
            prog.original_name,
          ],
        );

        // affectedRows 1 = inserted, 2 = updated by ON DUPLICATE KEY
        if (result.affectedRows === 1) sheetInserted++;
        else sheetUpdated++;
      }
    }

    console.log(
      `[seedPrograms] "${sheet.name}": ${sheetInserted} inserted, ${sheetUpdated} updated.`,
    );
    totalInserted += sheetInserted;
    totalUpdated  += sheetUpdated;
  }

  // ── Final reports ─────────────────────────────────────────────────────────
  console.log(
    `[seedPrograms] Total: ${totalInserted} inserted, ${totalUpdated} updated.`,
  );

  if (dupReport.length) {
    console.warn(`[seedPrograms] ${dupReport.length} true duplicate(s) skipped:`);
    dupReport.forEach((d) =>
      console.warn(
        `  sheet="${d.sheet}" row=${d.row} name="${d.name}" level=${d.level} ` +
        `spec="${d.spec}" track="${d.track}" (first seen at row ${d.firstRow})`,
      ),
    );
  }

  if (nullLevelReport.length) {
    console.warn(
      `[seedPrograms] ${nullLevelReport.length} row(s) with unrecognized level (stored as NULL):`,
    );
    nullLevelReport.forEach((r) =>
      console.warn(
        `  sheet="${r.sheet}" name="${r.name}" level="${r.sheetLevel}"`,
      ),
    );
  }

  if (extraColsReport.length) {
    console.log(`[seedPrograms] Extra columns captured per sheet:`);
    extraColsReport.forEach((r) =>
      console.log(`  sheet="${r.sheet}": ${r.columns.join(", ")}`),
    );
  } else {
    console.log(`[seedPrograms] No unmapped columns in any sheet — extra=NULL for all rows.`);
  }

  return { totalInserted, totalUpdated, dupReport, nullLevelReport, extraColsReport };
};

export default seedPrograms;
