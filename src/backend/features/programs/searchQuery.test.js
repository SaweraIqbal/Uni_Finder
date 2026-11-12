import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProgramHierarchyQuery,
  buildDistinctProgramSearchQuery,
  parseSuggestionLimit,
  queryDistinctPrograms,
  queryProgramHierarchy,
} from "./searchQuery.js";

test("builds an uncapped hierarchy query from active published program offerings", () => {
  const { sql, values } = buildProgramHierarchyQuery();

  assert.match(sql, /JOIN campus_programs cp ON cp\.program_id = p\.id/);
  assert.match(sql, /JOIN campuses c ON c\.id = cp\.campus_id/);
  assert.match(sql, /p\.status = 'approved'/);
  assert.match(sql, /cp\.status = 'published'/);
  assert.match(sql, /c\.status = 'active'/);
  assert.match(sql, /UPPER\(TRIM\(p\.degree_type\)\) IN \('ADP', 'AD', 'ASSOCIATE DEGREE'\)/);
  assert.match(sql, /MIN\(p\.level\) AS level/);
  assert.match(sql, /GROUP BY label, category, p\.degree_type/);
  assert.match(sql, /WHEN 'ADP' THEN 0\s+WHEN 'Undergraduate' THEN 1/);
  assert.match(sql, /category ASC,\s+label ASC,\s+p\.degree_type ASC/);
  assert.doesNotMatch(sql, /\bLIMIT\b|\bSELECT\s+\*/i);
  assert.deepEqual(values, []);
});

test("builds a parameterized distinct-program query constrained to published active offerings", () => {
  const { sql, values } = buildDistinctProgramSearchQuery({
    queryText: "comp",
    level: "Undergraduate",
    limit: 10,
  });

  assert.match(sql, /JOIN campus_programs cp ON cp\.program_id = p\.id/);
  assert.match(sql, /JOIN campuses c ON c\.id = cp\.campus_id/);
  assert.match(sql, /p\.status = 'approved'/);
  assert.match(sql, /cp\.status = 'published'/);
  assert.match(sql, /c\.status = 'active'/);
  assert.match(sql, /GROUP BY label, p\.level/);
  assert.match(sql, /ORDER BY campus_count DESC, label ASC/);
  assert.match(sql, /COUNT\(DISTINCT c\.id\) AS campus_count/);
  assert.match(sql, /CASE\s+WHEN/);
  assert.match(sql, /CHAR_LENGTH\(TRIM\(p\.degree_type\)\)/);
  assert.match(sql, /TRIM\(SUBSTRING\(TRIM\(p\.name\)/);
  assert.match(sql, /p\.name LIKE \? OR p\.degree_type LIKE \? OR p\.specialization LIKE \?/);
  assert.doesNotMatch(sql, /SELECT\s+\*/i);
  assert.deepEqual(values, ["%comp%", "%comp%", "%comp%", "Undergraduate", 10]);
});

test("canonical label SQL avoids prepending a degree code already present in the name", () => {
  const { sql } = buildDistinctProgramSearchQuery({
    queryText: "",
    level: "",
    limit: 10,
  });
  const labelExpression = sql.slice(0, sql.indexOf(" AS label"));

  for (const degree of ["BS", "ADP", "MS", "PhD", "MPhil"]) {
    const name = `${degree} Computer Science`;
    const startsWithDegree = name.toLowerCase().startsWith(`${degree.toLowerCase()} `);
    const label = startsWithDegree ? name : `${degree} ${name}`;
    assert.equal(label, name, `expected a single ${degree} prefix`);
  }

  assert.match(labelExpression, /LOWER\(LEFT\(TRIM\(p\.name\)/);
  assert.match(labelExpression, /LOWER\(LEFT\(\s*TRIM\(SUBSTRING\(TRIM\(p\.name\)/);
  assert.match(labelExpression, /THEN TRIM\(CONCAT_WS\(' ',\s*\(/);
  assert.match(labelExpression, /ELSE TRIM\(CONCAT_WS\(' ', NULLIF\(TRIM\(p\.degree_type\)/);
});

test("limits the suggestion count to at most ten and defaults invalid values to ten", () => {
  assert.equal(parseSuggestionLimit("10"), 10);
  assert.equal(parseSuggestionLimit("100"), 10);
  assert.equal(parseSuggestionLimit("0"), 1);
  assert.equal(parseSuggestionLimit("invalid"), 10);
});

test("executes generated SQL using bound values and returns database rows", async () => {
  const expectedRows = [{ label: "BS Computer Science", level: "Undergraduate", campus_count: 3 }];
  const calls = [];
  const database = {
    query(sql, values, callback) {
      calls.push({ sql, values });
      callback(null, expectedRows);
    },
  };

  const rows = await queryDistinctPrograms(database, {
    queryText: "comp",
    level: "",
    limit: 10,
  });

  assert.deepEqual(rows, expectedRows);
  assert.deepEqual(calls[0].values, ["%comp%", "%comp%", "%comp%", 10]);
});

test("executes the uncapped hierarchy query and returns database rows", async () => {
  const expectedRows = [
    { label: "BS Computer Science", level: "Undergraduate", category: "Undergraduate", degree_type: "BS", campus_count: 3 },
  ];
  const calls = [];
  const database = {
    query(sql, values, callback) {
      calls.push({ sql, values });
      callback(null, expectedRows);
    },
  };

  const rows = await queryProgramHierarchy(database);

  assert.deepEqual(rows, expectedRows);
  assert.match(calls[0].sql, /GROUP BY label, category, p\.degree_type/);
  assert.deepEqual(calls[0].values, []);
});
