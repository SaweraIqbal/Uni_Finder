/**
 * TEMP verification for the seeded-university logo/banner upload fix.
 * - Loads backend .env (secrets are NEVER printed)
 * - Mints a short-lived local JWT for the COMSATS owner account
 * - GET /me  → external https URLs must pass through (no localhost mangling)
 * - POST /me/logo + /me/banner → upload must succeed on a seeded university
 * - RESTORES original DB paths + deletes uploaded files (leaves no trace)
 */
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, "src", "backend", ".env") });

const API = "http://localhost:5000";
const UNI_NAME = "COMSATS University Islamabad";

const db = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "uni_finder",
  dateStrings: true,
});

let failures = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${cond ? "" : `  → ${detail}`}`);
  if (!cond) failures++;
};

// 1 ── Resolve COMSATS + its owner account
const [[uni]] = await db.query(
  "SELECT id, owner_uid FROM universities WHERE name = ? LIMIT 1",
  [UNI_NAME],
);
check("COMSATS university row exists", Boolean(uni?.id), "not found by name");
const [[owner]] = await db.query(
  "SELECT id, email FROM Student_signup WHERE id = ? LIMIT 1",
  [uni.owner_uid],
);
check("COMSATS has an owner account", Boolean(owner?.id), "owner_uid not linked");

// 2 ── Capture original profile image paths
const [[orig]] = await db.query(
  "SELECT logo_path, banner_path FROM university_profiles WHERE university_id = ?",
  [uni.id],
);
console.log(`      original logo_path   = ${orig.logo_path}`);
console.log(`      original banner_path = ${orig.banner_path}`);

// 3 ── Mint a short-lived token exactly like the login endpoint does
const token = jwt.sign(
  { id: owner.id, email: owner.email, role: "university", university_id: uni.id },
  process.env.JWT_SECRET || "secretkey",
  { expiresIn: "10m" },
);
const auth = { Authorization: `Bearer ${token}` };

// 4 ── GET /me — external seeded URLs must pass through unchanged
const meBefore = await (await fetch(`${API}/api/universities/me`, { headers: auth })).json();
check(
  "GET /me logo_url is the raw external URL (no host prefix mangling)",
  meBefore.logo_url === orig.logo_path && /^https?:\/\//.test(meBefore.logo_url || ""),
  `got ${meBefore.logo_url}`,
);
check(
  "GET /me banner_url is the raw external URL",
  meBefore.banner_url === orig.banner_path && /^https?:\/\//.test(meBefore.banner_url || ""),
  `got ${meBefore.banner_url}`,
);

// 5 ── Upload a real PNG to both endpoints on this SEEDED university
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const uploadTo = async (endpoint, field) => {
  const fd = new FormData();
  fd.append(field, new Blob([PNG], { type: "image/png" }), "verify.png");
  const res = await fetch(`${API}/api/universities/me/${endpoint}`, {
    method: "POST", headers: auth, body: fd,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const logoUp = await uploadTo("logo", "logo");
check("POST /me/logo returns 200", logoUp.status === 200, JSON.stringify(logoUp.data));
check(
  "POST /me/logo returns a local /uploads URL",
  /^\/uploads\/universities\//.test(logoUp.data.logo_url || ""),
  `got ${logoUp.data.logo_url}`,
);

const bannerUp = await uploadTo("banner", "banner");
check("POST /me/banner returns 200", bannerUp.status === 200, JSON.stringify(bannerUp.data));
check(
  "POST /me/banner returns a local /uploads URL",
  /^\/uploads\/universities\//.test(bannerUp.data.banner_url || ""),
  `got ${bannerUp.data.banner_url}`,
);

// 6 ── GET /me again — now serves the freshly uploaded local files
const meAfter = await (await fetch(`${API}/api/universities/me`, { headers: auth })).json();
check(
  "GET /me logo_url now points at the uploaded local file",
  (meAfter.logo_url || "").includes(logoUp.data.logo_url || "\u0000"),
  `got ${meAfter.logo_url}`,
);

// 7 ── RESTORE original DB paths, delete uploaded files, drop test activity rows
const uploadedFiles = [logoUp.data.logo_url, bannerUp.data.banner_url]
  .filter((u) => /^\/uploads\//.test(u || ""))
  .map((u) => path.join(ROOT, "src", "backend", u.replace(/^\//, "")));

const t0 = new Date();
await db.query(
  "UPDATE university_profiles SET logo_path = ?, banner_path = ? WHERE university_id = ?",
  [orig.logo_path, orig.banner_path, uni.id],
);
for (const f of uploadedFiles) fs.rmSync(f, { force: true });
await db.query(
  `DELETE FROM activity_log
    WHERE university_id = ? AND action IN ('logo_uploaded','banner_uploaded')
      AND created_at >= ?`,
  [uni.id, t0.toISOString().slice(0, 19).replace("T", " ")],
);

// 8 ── Final state check — back to the seeded external URLs
const meFinal = await (await fetch(`${API}/api/universities/me`, { headers: auth })).json();
check("RESTORED: GET /me logo_url back to seeded external URL",
  meFinal.logo_url === orig.logo_path, `got ${meFinal.logo_url}`);
check("RESTORED: GET /me banner_url back to seeded external URL",
  meFinal.banner_url === orig.banner_path, `got ${meFinal.banner_url}`);
check("RESTORED: uploaded files deleted", uploadedFiles.every((f) => !fs.existsSync(f)),
  uploadedFiles.join(", "));

await db.end();
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
