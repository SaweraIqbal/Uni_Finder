/**
 * Runs the Phase 2 campus migration SQL against the local DB.
 * Usage: node scripts/run_campus_migration.mjs
 */
import { readFileSync } from "fs";
import { createConnection } from "mysql2";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../src/backend/.env") });

const db = createConnection({
  host:     process.env.DB_HOST || "127.0.0.1",
  user:     process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "uni_finder",
  multipleStatements: true,
});

const sql = readFileSync(join(__dirname, "migrate_campus_phase2.sql"), "utf8");

db.connect((err) => {
  if (err) { console.error("❌ DB connect failed:", err.message); process.exit(1); }
  console.log("✅ Connected to", process.env.DB_NAME);

  db.query(sql, (err2, results) => {
    if (err2) {
      console.error("❌ Migration failed:", err2.message);
      db.end();
      process.exit(1);
    }
    // Last result is the SELECT confirmation message
    const last = Array.isArray(results) ? results[results.length - 1] : null;
    if (last && last[0]) {
      console.log("✅", last[0].result);
    } else {
      console.log("✅ Migration completed.");
    }
    console.log("\nTables created:");
    const tables = ["campus_verification","campuses","campus_images","campus_programs","campus_societies","campus_facilities","campus_hostels"];
    let checked = 0;
    tables.forEach((t) => {
      db.query(`SELECT COUNT(*) as cnt FROM ${t}`, (e) => {
        if (e) console.log(`  ⚠  ${t}: ${e.message}`);
        else   console.log(`  ✓  ${t}`);
        if (++checked === tables.length) db.end();
      });
    });
  });
});
