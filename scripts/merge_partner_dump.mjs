import mysql from "mysql2";
import fs from "fs";

const SRC = "uni_partner_stage";
const DST = "uni_finder";
const ORDER = [
  "universities", "university_profiles", "university_images", "university_master_imports",
  "university_verification", "campuses", "campus_facilities", "campus_images",
  "campus_registrations", "campus_program_requests", "programs", "program_catalog",
  "campus_programs", "campus_societies", "campus_hostels", "student_signup",
  "student_profile", "applications", "activity_log",
];

const conn = mysql.createConnection({
  host: "127.0.0.1", user: "root", password: "", multipleStatements: true,
});
const q = (sql, p) => new Promise((res, rej) => conn.query(sql, p, (e, r) => (e ? rej(e) : res(r))));

const dryRun = process.argv.includes("--dry");

const pks = await q(
  `SELECT k.table_name t, GROUP_CONCAT(k.column_name ORDER BY k.ordinal_position) c
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage k
     ON k.table_schema=tc.table_schema AND k.table_name=tc.table_name AND k.constraint_name=tc.constraint_name
   WHERE tc.table_schema=? AND tc.constraint_name='PRIMARY' GROUP BY k.table_name`,
  [SRC]
);
const pkOf = Object.fromEntries(pks.map((r) => [r.t, r.c.split(",")]));

let grandTotal = 0;
for (const t of ORDER) {
  const sCols = await q(
    `SELECT column_name c FROM information_schema.columns WHERE table_schema=? AND table_name=? ORDER BY ordinal_position`,
    [SRC, t]
  );
  const dCols = await q(
    `SELECT column_name c FROM information_schema.columns WHERE table_schema=? AND table_name=? ORDER BY ordinal_position`,
    [DST, t]
  );
  const dset = new Set(dCols.map((r) => r.c));
  const common = sCols.map((r) => r.c).filter((c) => dset.has(c));
  const pk = pkOf[t] || [];
  const cols = common.map((c) => `\`${c}\``).join(", ");
  const notExists =
    pk.length === 0 ? "1=0"
    : `NOT EXISTS (SELECT 1 FROM \`${DST}\`.\`${t}\` l WHERE ${pk.map((c) => `l.\`${c}\`=p.\`${c}\``).join(" AND ")})`;

  const before = (await q(`SELECT COUNT(*) n FROM \`${DST}\`.\`${t}\``))[0].n;
  const planned = (await q(
    `SELECT COUNT(*) n FROM \`${SRC}\`.\`${t}\` p WHERE ${notExists}`
  ))[0].n;

  if (dryRun) {
    console.log(`[dry] ${t.padEnd(28)} ${planned} new rows`);
    continue;
  }

  await q(
    `INSERT IGNORE INTO \`${DST}\`.\`${t}\` (${cols})
     SELECT ${cols} FROM \`${SRC}\`.\`${t}\` p WHERE ${notExists}`
  );
  const after = (await q(`SELECT COUNT(*) n FROM \`${DST}\`.\`${t}\``))[0].n;
  const added = after - before;
  grandTotal += added;
  console.log(`${t.padEnd(28)} planned=${String(planned).padStart(5)}  added=${String(added).padStart(5)}  total=${after}`);
  if (added !== planned) console.log(`   ^ ${planned - added} row(s) skipped by a unique-key or FK clash`);
}
if (dryRun) console.log(`\nDRY RUN — nothing changed. ${ORDER.length} tables.`);
else console.log(`\nDONE. ${grandTotal} rows added to ${DST}.`);

if (!dryRun) fs.writeFileSync("sqlmerge.report.json", JSON.stringify({ grandTotal, ORDER }, null, 2));
conn.end();
