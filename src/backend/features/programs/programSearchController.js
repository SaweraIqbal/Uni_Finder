import { createHash } from "node:crypto";
import db from "../../shared/db.js";
import {
  PROGRAM_LABEL_SQL,
  parseSuggestionLimit,
  queryDistinctPrograms,
  queryProgramHierarchy,
} from "./searchQuery.js";

const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const searchCache = new Map();
let hierarchyCache = null;

const queryAsync = (database, sql, values) =>
  new Promise((resolve, reject) => {
    database.query(sql, values, (error, rows) => (error ? reject(error) : resolve(rows)));
  });

const cacheKeyFor = (queryText, level, limit) =>
  createHash("md5").update(`${queryText}|${level || ""}|${limit}`).digest("hex");

const pruneExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of searchCache) {
    if (entry.expiresAt <= now) searchCache.delete(key);
  }
};

export const searchDistinctPrograms = async (req, res) => {
  const queryText = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const level = typeof req.query.level === "string" ? req.query.level.trim().slice(0, 80) : "";
  const limit = parseSuggestionLimit(req.query.limit);

  const cacheKey = cacheKeyFor(queryText, level, limit);
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.rows);
  }

  try {
    const rows = await queryDistinctPrograms(db, {
      queryText,
      level,
      limit,
    });
    const results = rows.map((row) => ({
      label: row.label,
      level: row.level || "",
      campus_count: Number(row.campus_count),
    }));

    pruneExpiredCache();
    searchCache.set(cacheKey, {
      rows: results,
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    });
    if (searchCache.size > 500) {
      searchCache.delete(searchCache.keys().next().value);
    }
    return res.json(results);
  } catch (error) {
    console.error("[program search] suggestion query failed:", error.message);
    return res.status(500).json({ message: "Could not load program suggestions." });
  }
};

export const getProgramHierarchy = async (_req, res) => {
  if (hierarchyCache && hierarchyCache.expiresAt > Date.now()) {
    return res.json(hierarchyCache.groups);
  }

  try {
    const rows = await queryProgramHierarchy(db);
    const groupsByLevel = new Map();
    for (const row of rows) {
      const category = typeof row.category === "string" && row.category.trim()
        ? row.category.trim()
        : "Other";
      if (!groupsByLevel.has(category)) {
        groupsByLevel.set(category, { label: category, children: [] });
      }
      groupsByLevel.get(category).children.push({
        label: row.label,
        level: row.level || "",
        category,
        degree_type: row.degree_type || "",
        campus_count: Number(row.campus_count),
      });
    }

    hierarchyCache = {
      groups: [...groupsByLevel.values()],
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    };
    return res.json(hierarchyCache.groups);
  } catch (error) {
    console.error("[program search] hierarchy query failed:", error.message);
    return res.status(500).json({ message: "Could not load the program hierarchy." });
  }
};

const FEE_NUMERIC_SQL =
  "CAST(NULLIF(REGEXP_REPLACE(COALESCE(cp.fee, ''), '[^0-9.]', ''), '') AS DECIMAL(12,2))";

export const searchCampusesForProgram = async (req, res) => {
  const program = typeof req.query.program === "string" ? req.query.program.trim().slice(0, 500) : "";
  const level = typeof req.query.level === "string" ? req.query.level.trim().slice(0, 80) : "";
  if (!program) {
    return res.status(400).json({ message: "A program label is required." });
  }

  const where = [
    `${PROGRAM_LABEL_SQL} = ?`,
    "p.status = 'approved'",
    "cp.status = 'published'",
    "c.status = 'active'",
  ];
  const values = [program];
  if (Object.hasOwn(req.query, "level")) {
    where.push("p.level <=> ?");
    values.push(level || null);
  }

  try {
    const rows = await queryAsync(
      db,
      `SELECT c.id AS campus_id,
              c.name AS campus_name,
              c.city AS city,
              u.name AS university_name,
              cp.fee AS fee,
              cp.duration AS duration,
              cp.shifts AS shifts,
              p.name AS program_name,
              p.degree_type AS degree_type,
              p.level AS level,
              p.specialization AS specialization,
              ${PROGRAM_LABEL_SQL} AS label
       FROM programs p
       JOIN campus_programs cp ON cp.program_id = p.id
       JOIN campuses c ON c.id = cp.campus_id
       JOIN universities u ON u.id = c.university_id
       WHERE ${where.join(" AND ")}
       ORDER BY (${FEE_NUMERIC_SQL} IS NULL) ASC,
                ${FEE_NUMERIC_SQL} ASC,
                c.name ASC`,
      values,
    );
    return res.json(rows);
  } catch (error) {
    console.error("[program search] campus results query failed:", error.message);
    return res.status(500).json({ message: "Could not load campuses for this program." });
  }
};
