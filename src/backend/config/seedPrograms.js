
import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import db from "./db.js";
import { normalizeName } from "./seedUniversities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const degreeMap = require(path.join(__dirname, "../../../scripts/degree_map.json"));

const WORKBOOKS = [
  path.join(__dirname, "../data/programs.xlsx"),
  path.join(__dirname, "../data/ucp_scraped_data.xlsx"),
];

const VALID_LEVELS = new Set(["Undergraduate", "MS", "MPhil", "PhD", "ADP", "Diploma"]);

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// ── KNOWN columns (lower-cased) for LEGACY format — any other column → extra ─
const KNOWN_COLS = new Set([
  "program name", "level", "specialization", "university name",
  "shift", "track", // common alternates — also captured explicitly
]);

// ── Degree-parsing helpers (LEGACY format) ───────────────────────────────────

const resolveLevel = (sheetLevel) => {
  const val = String(sheetLevel || "").trim();
  const mapped = degreeMap.levelFromSheetValue[val];
  if (!mapped) return [null];
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
      name = name.slice(0, idx).trim();
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
      const stripped = rawName.replace(re, "").trim();
      const displayName = stripped || rawName;
      return { displayName, degreeType: degree_type };
    }
  }
  const levelHint = {
    Undergraduate: "BS", MS: "MS", MPhil: "MPhil",
    PhD: "PhD", ADP: "ADP", Diploma: "Diploma",
  };
  return { displayName: rawName, degreeType: levelHint[sheetLevel] || "" };
};

/**
 * Parse one LEGACY Excel row → array of program objects (1 or 2 for SPLIT).
 */
const parseRow = (rawName, sheetLevel, specCol, extra) => {
  if (!rawName) return [];
  const levels = resolveLevel(sheetLevel);

  return levels.flatMap((level) => {
    const { name: afterTrack, track } = extractTrack(rawName);
    const { name: afterSpec, specialization } = extractSpecialization(afterTrack, specCol);
    const { displayName, degreeType } = stripPrefix(afterSpec, level || sheetLevel);

    return [{
      name: displayName || rawName,
      degree_type: degreeType,
      level,
      specialization,
      track,
      extra: extra && Object.keys(extra).length ? JSON.stringify(extra) : null,
      original_name: rawName,
    }];
  });
};

// ── Shared helpers ───────────────────────────────────────────────────────────

const dedupeKey = (universityId, name, level, spec, track) =>
  `${universityId}|${name}|${level ?? ""}|${spec ?? ""}|${track ?? ""}`;

const cleanVal = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

/** Resolve a university id from a name (normalized_name first, then exact name). */
const resolveUniversityId = async (uniNameVal) => {
  const norm = normalizeName(uniNameVal);
  const rows = await query(
    "SELECT id FROM universities WHERE normalized_name = ? LIMIT 1", [norm],
  );
  if (rows.length) return rows[0].id;

  const fallback = await query(
    "SELECT id FROM universities WHERE LOWER(name) = LOWER(?) LIMIT 1", [uniNameVal],
  );
  return fallback.length ? fallback[0].id : null;
};

/** Upsert one program. Returns "inserted" | "updated". */
const upsertProgram = async (universityId, prog) => {
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
      uuidv4(), universityId, prog.name, prog.degree_type || "", prog.level,
      prog.specialization, prog.track,
      prog.extra ?? null,
      prog.original_name,
    ],
  );
  // affectedRows 1 = inserted, 2 = updated by ON DUPLICATE KEY
  return result.affectedRows === 1 ? "inserted" : "updated";
};

// ── Main export ───────────────────────────────────────────────────────────────
const seedPrograms = async () => {
  let totalInserted = 0;
  let totalUpdated = 0;
  const nullLevelReport = [];
  const dupReport = [];   // true duplicates skipped
  const extraColsReport = [];   // sheets that had extra columns (legacy format)
  const unresolvedReport = [];  // sheets/rows whose university could not be found

  for (const workbookPath of WORKBOOKS) {
    const fileLabel = path.basename(workbookPath);

    if (!fs.existsSync(workbookPath)) {
      console.warn(`[seedPrograms] File not found, skipped: ${workbookPath}`);
      continue;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    console.log(`[seedPrograms] Reading ${fileLabel} (${workbook.worksheets.length} sheet(s))`);

    for (const sheet of workbook.worksheets) {
      // ── Build header map ─────────────────────────────────────────────────
      const headerMap = new Map();   // colName(lower) → colIndex
      sheet.getRow(1).eachCell((cell, col) => {
        const key = String(cell.value || "").trim().toLowerCase();
        if (key) headerMap.set(key, col);
      });

      const isLegacy = headerMap.has("program name") && headerMap.has("level");
      const isMaster =
        !isLegacy &&
        headerMap.has("parent_university_name") &&
        headerMap.has("name") &&
        headerMap.has("level");

      if (!isLegacy && !isMaster) {
        console.log(`[seedPrograms] ${fileLabel} / "${sheet.name}": not a programs sheet — ignored.`);
        continue;
      }

      let sheetInserted = 0;
      let sheetUpdated = 0;
      const sheetSeen = new Map();   // dedupe key → first-seen row number

      // ═════════════════════════════════════════════════════════════════════
      // FORMAT 2: MASTER (already-clean rows, e.g. Programs_Master)
      // ═════════════════════════════════════════════════════════════════════
      if (isMaster) {
        const uniCol = headerMap.get("parent_university_name");
        const nameCol = headerMap.get("name");
        const levelCol = headerMap.get("level");
        const degCol = headerMap.get("degree_type");
        const specCol = headerMap.get("specialization");
        const trackCol = headerMap.get("track");
        const origCol = headerMap.get("original_name");

        const uniCache = new Map();   // university name → id (or null)

        for (let r = 2; r <= sheet.rowCount; r++) {
          const row = sheet.getRow(r);
          const name = cleanVal(row.getCell(nameCol).text);
          if (!name) continue;

          const uniName = cleanVal(row.getCell(uniCol).text);
          if (!uniName) continue;

          if (!uniCache.has(uniName)) {
            uniCache.set(uniName, await resolveUniversityId(uniName));
          }
          const universityId = uniCache.get(uniName);
          if (!universityId) {
            unresolvedReport.push({ file: fileLabel, sheet: sheet.name, university: uniName });
            uniCache.set(uniName, null);
            continue;
          }

          const level = cleanVal(row.getCell(levelCol).text);
          const prog = {
            name,
            degree_type: degCol ? cleanVal(row.getCell(degCol).text) : null,
            level: VALID_LEVELS.has(level) ? level : null,
            specialization: specCol ? cleanVal(row.getCell(specCol).text) : null,
            track: trackCol ? cleanVal(row.getCell(trackCol).text) : null,
            extra: null,
            original_name: origCol ? cleanVal(row.getCell(origCol).text) : name,
          };

          if (!prog.level) {
            nullLevelReport.push({ sheet: sheet.name, name, sheetLevel: level });
          }

          const dk = dedupeKey(universityId, prog.name, prog.level, prog.specialization, prog.track);
          if (sheetSeen.has(dk)) {
            dupReport.push({
              sheet: sheet.name, row: r, name, level: prog.level,
              spec: prog.specialization, track: prog.track, firstRow: sheetSeen.get(dk),
            });
            continue;
          }
          sheetSeen.set(dk, r);

          const outcome = await upsertProgram(universityId, prog);
          if (outcome === "inserted") sheetInserted++; else sheetUpdated++;
        }

        for (const [uniName, id] of uniCache) {
          if (!id) console.warn(`[seedPrograms] ${fileLabel} / "${sheet.name}": university not found in DB: "${uniName}"`);
        }
      }

      // ═════════════════════════════════════════════════════════════════════
      // FORMAT 1: LEGACY (programs.xlsx — names parsed via degree_map.json)
      // ═════════════════════════════════════════════════════════════════════
      if (isLegacy) {
        const extraCols = [];   // unmapped column names (lower)
        for (const key of headerMap.keys()) {
          if (!KNOWN_COLS.has(key)) extraCols.push(key);
        }
        if (extraCols.length) {
          extraColsReport.push({ sheet: sheet.name, columns: extraCols });
          console.log(`[seedPrograms] "${sheet.name}" extra columns: ${extraCols.join(", ")}`);
        }

        const nameCol = headerMap.get("program name");
        const levelCol = headerMap.get("level");
        const specCol = headerMap.get("specialization");
        const uniNameCol = headerMap.get("university name");
        const trackCol = headerMap.get("track") || headerMap.get("shift");

        // ── Resolve university from the first non-empty row ────────────────
        let universityId = null;
        if (uniNameCol) {
          for (let r = 2; r <= sheet.rowCount; r++) {
            const uniNameVal = String(sheet.getRow(r).getCell(uniNameCol).text || "").trim();
            if (!uniNameVal) continue;
            universityId = await resolveUniversityId(uniNameVal);
            if (!universityId) {
              unresolvedReport.push({ file: fileLabel, sheet: sheet.name, university: uniNameVal });
            }
            break;
          }
        }

        if (!universityId) {
          console.warn(`[seedPrograms] Could not resolve university for sheet "${sheet.name}" — skipped.`);
          continue;
        }

        for (let r = 2; r <= sheet.rowCount; r++) {
          const row = sheet.getRow(r);
          const rawName = String(row.getCell(nameCol).text || "").trim();
          const sheetLevel = String(row.getCell(levelCol).text || "").trim();
          const specValue = specCol ? String(row.getCell(specCol).text || "").trim() : "";
          const trackValue = trackCol ? String(row.getCell(trackCol).text || "").trim() : "";

          if (!rawName) continue;

          // ── Build extra object from unmapped columns ───────────────────
          let extra = null;
          if (extraCols.length) {
            const obj = {};
            for (const colName of extraCols) {
              const colIdx = headerMap.get(colName);
              const val = colIdx ? String(row.getCell(colIdx).text || "").trim() : "";
              if (val) obj[colName] = val;
            }
            if (Object.keys(obj).length) extra = obj;
          }

          const parsed = parseRow(rawName, sheetLevel, specValue || trackValue, extra);

          for (const prog of parsed) {
            if (!prog.level) {
              nullLevelReport.push({ sheet: sheet.name, name: rawName, sheetLevel });
            }

            const dk = dedupeKey(
              universityId, prog.name, prog.level,
              prog.specialization, prog.track,
            );
            if (sheetSeen.has(dk)) {
              dupReport.push({
                sheet: sheet.name, row: r, name: rawName, level: prog.level,
                spec: prog.specialization, track: prog.track, firstRow: sheetSeen.get(dk),
              });
              continue; // skip true duplicate — keep first occurrence
            }
            sheetSeen.set(dk, r);

            const outcome = await upsertProgram(universityId, prog);
            if (outcome === "inserted") sheetInserted++; else sheetUpdated++;
          }
        }
      }

      console.log(
        `[seedPrograms] ${fileLabel} / "${sheet.name}": ${sheetInserted} inserted, ${sheetUpdated} updated.`,
      );
      totalInserted += sheetInserted;
      totalUpdated += sheetUpdated;
    }
  }

  // ── Final reports ─────────────────────────────────────────────────────────
  console.log(`[seedPrograms] Total: ${totalInserted} inserted, ${totalUpdated} updated.`);

  if (unresolvedReport.length) {
    console.warn(`[seedPrograms] ${unresolvedReport.length} university name(s) not found in DB:`);
    unresolvedReport.forEach((u) =>
      console.warn(`  file="${u.file}" sheet="${u.sheet}" university="${u.university}"`),
    );
  }

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
      console.warn(`  sheet="${r.sheet}" name="${r.name}" level="${r.sheetLevel}"`),
    );
  }

  if (extraColsReport.length) {
    console.log(`[seedPrograms] Extra columns captured per sheet:`);
    extraColsReport.forEach((r) =>
      console.log(`  sheet="${r.sheet}": ${r.columns.join(", ")}`),
    );
  } else {
    console.log(`[seedPrograms] No unmapped columns in any legacy sheet — extra=NULL for those rows.`);
  }

  return {
    totalInserted, totalUpdated,
    dupReport, nullLevelReport, extraColsReport, unresolvedReport,
  };
};

export default seedPrograms;