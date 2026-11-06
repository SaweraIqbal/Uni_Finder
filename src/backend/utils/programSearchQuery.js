const DEGREE_PREFIX_EXISTS_SQL = `(
  NULLIF(TRIM(p.degree_type), '') IS NOT NULL
  AND LOWER(LEFT(TRIM(p.name), CHAR_LENGTH(TRIM(p.degree_type)))) = LOWER(TRIM(p.degree_type))
  AND SUBSTRING(TRIM(p.name), CHAR_LENGTH(TRIM(p.degree_type)) + 1, 1) = ' '
)`;

const DEGREE_PREFIX_EXISTS_TWICE_SQL = `(
  ${DEGREE_PREFIX_EXISTS_SQL}
  AND LOWER(LEFT(
    TRIM(SUBSTRING(TRIM(p.name), CHAR_LENGTH(TRIM(p.degree_type)) + 1)),
    CHAR_LENGTH(TRIM(p.degree_type))
  )) = LOWER(TRIM(p.degree_type))
  AND SUBSTRING(
    TRIM(SUBSTRING(TRIM(p.name), CHAR_LENGTH(TRIM(p.degree_type)) + 1)),
    CHAR_LENGTH(TRIM(p.degree_type)) + 1,
    1
  ) = ' '
)`;

const NORMALIZED_PROGRAM_NAME_SQL = `(
  CASE
    WHEN ${DEGREE_PREFIX_EXISTS_TWICE_SQL}
      THEN TRIM(SUBSTRING(TRIM(p.name), CHAR_LENGTH(TRIM(p.degree_type)) + 1))
    ELSE TRIM(p.name)
  END
)`;

export const PROGRAM_LABEL_SQL = `(
  CASE
    WHEN ${DEGREE_PREFIX_EXISTS_SQL}
      THEN TRIM(CONCAT_WS(' ', ${NORMALIZED_PROGRAM_NAME_SQL}, NULLIF(TRIM(p.specialization), '')))
    ELSE TRIM(CONCAT_WS(' ', NULLIF(TRIM(p.degree_type), ''), ${NORMALIZED_PROGRAM_NAME_SQL}, NULLIF(TRIM(p.specialization), '')))
  END
)`;

export const PROGRAM_CATEGORY_SQL = `(
  CASE
    WHEN UPPER(TRIM(p.degree_type)) IN ('ADP', 'AD', 'ASSOCIATE DEGREE')
      OR UPPER(TRIM(p.name)) REGEXP '^ADP([[:space:]]|$)'
      THEN 'ADP'
    ELSE COALESCE(p.level, 'Other')
  END
)`;

export const buildDistinctProgramSearchQuery = ({ queryText, level, limit }) => {
  const where = [
    "p.status = 'approved'",
    "cp.status = 'published'",
    "c.status = 'active'",
  ];
  const values = [];

  if (queryText) {
    where.push("(p.name LIKE ? OR p.degree_type LIKE ? OR p.specialization LIKE ?)");
    const pattern = `%${queryText}%`;
    values.push(pattern, pattern, pattern);
  }
  if (level) {
    where.push("p.level = ?");
    values.push(level);
  }

  return {
    sql: `
      SELECT ${PROGRAM_LABEL_SQL} AS label,
             p.level AS level,
             COUNT(DISTINCT c.id) AS campus_count
      FROM programs p
      JOIN campus_programs cp ON cp.program_id = p.id
      JOIN campuses c ON c.id = cp.campus_id
      WHERE ${where.join(" AND ")}
      GROUP BY label, p.level
      ORDER BY campus_count DESC, label ASC
      LIMIT ?
    `,
    values: [...values, limit],
  };
};

export const parseSuggestionLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return 10;
  return Math.min(10, Math.max(1, parsed));
};

export const queryDistinctPrograms = (database, options) => {
  const { sql, values } = buildDistinctProgramSearchQuery(options);
  return new Promise((resolve, reject) => {
    database.query(sql, values, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
};

export const buildProgramHierarchyQuery = () => ({
  sql: `
    SELECT ${PROGRAM_LABEL_SQL} AS label,
           MIN(p.level) AS level,
           ${PROGRAM_CATEGORY_SQL} AS category,
           p.degree_type AS degree_type,
           COUNT(DISTINCT c.id) AS campus_count
    FROM programs p
    JOIN campus_programs cp ON cp.program_id = p.id
    JOIN campuses c ON c.id = cp.campus_id
    WHERE p.status = 'approved'
      AND cp.status = 'published'
      AND c.status = 'active'
    GROUP BY label, category, p.degree_type
    ORDER BY
      CASE category
        WHEN 'ADP' THEN 0
        WHEN 'Undergraduate' THEN 1
        ELSE 2
      END ASC,
      category ASC,
      label ASC,
      p.degree_type ASC
  `,
  values: [],
});

export const queryProgramHierarchy = (database) => {
  const { sql, values } = buildProgramHierarchyQuery();
  return new Promise((resolve, reject) => {
    database.query(sql, values, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
};
