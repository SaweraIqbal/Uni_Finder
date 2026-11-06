/**
 * One-off generator: UOL JSON → phpMyAdmin-importable seed SQL.
 * Reads the authoritative verified JSON; writes uol_full_seed.sql at repo root.
 * No code in src/ is modified by this script.
 *
 * Source of truth: src/backend/data/Universities/UOL/uol_data.json (v14, 296 programs).
 * The sibling uol_data_updated.xlsx is a STALE export (198 rows, pre-v9 fees) and is NOT used.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "src/backend/data/Universities/UOL");
const OUT = path.join(ROOT, "uol_full_seed.sql");

const d = JSON.parse(fs.readFileSync(path.join(DATA, "uol_data.json"), "utf8"));
const u = d.university;

// ── stable ids ───────────────────────────────────────────────────────────────
const UNI_ID_IF_MISSING = "5a9c1e40-7f2b-4d18-9c33-2e6f8b0a1d47";
const NORM_NAME = "the university of lahore";
const UNI_NAME = u.name;

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/–/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
// stable per-campus UUID so re-runs reuse the same ids
const crypto = await import("crypto");
const uuidFor = (seed) => {
  const h = crypto.createHash("sha1").update(`uol:${seed}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "4" + h.slice(13, 16),
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
};

// ── sql literal helpers ──────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/'/g, "''");
const q = (v) => (v === null || v === undefined || v === "" ? "NULL" : `'${esc(v)}'`);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "NULL");
const bool = (v) => (v ? 1 : 0);
const j = (v) => (v === null || v === undefined ? "NULL" : `'${esc(JSON.stringify(v))}'`);
const clip = (v, n) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  if (!s) return null;
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};
const clean = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[ \t]+/g, " ").trim();
  return s || null;
};

// ── level mapping (UOL JSON uses non-ENUM labels) ────────────────────────────
// DB programs.level ENUM is ('Undergraduate','MS','MPhil','PhD','ADP','Diploma').
// Postgraduate/Graduate rows are mapped by their own degree_type; Doctor of Medicine
// has no ENUM fit → NULL (schema allows NULL level). Original label always kept in extra.
const ENUM_LEVELS = ["Undergraduate", "MS", "MPhil", "PhD", "ADP", "Diploma"];
const mapLevel = (p) => {
  const lv = String(p.level || "").trim();
  const dt = String(p.degree_type || "").toUpperCase();
  if (ENUM_LEVELS.includes(lv)) return lv;
  if (lv === "Postgraduate" || lv === "Graduate") {
    if (dt === "PHD") return "PhD";
    if (dt === "MSPHIL") return "MPhil";
    if (["MS", "MBA", "MSC", "M.ARCH"].includes(dt)) return "MS";
    if (dt === "PGD") return "Diploma";
  }
  return null; // Doctor of Medicine / unmapped
};

// ── programs: keep every non-column field in `extra` (listPrograms does SELECT *) ──
const progExtra = (p) => {
  const e = {
    faculty: p.faculty ?? null,
    source_url: p.source_url ?? null,
    fee_source_url: p.fee_source_url ?? null,
    verified_from: p.verified_from ?? null,
    duration: p.duration ?? null,
    credit_hours: p.credit_hours ?? null,
    semester_fee: p.semester_fee ?? null,
    semester_fee_currency: p.semester_fee_currency ?? null,
    annual_fee: p.annual_fee ?? null,
    annual_fee_currency: p.annual_fee_currency ?? null,
    admission_fee: p.admission_fee ?? null,
    admission_fee_currency: p.admission_fee_currency ?? null,
    security_deposit: p.security_deposit ?? null,
    total_degree_cost: p.total_degree_cost ?? null,
    total_degree_cost_currency: p.total_degree_cost_currency ?? null,
    annual_fee_usd_range: p.annual_fee_usd_range ?? null,
    fee_note: p.fee_note ?? null,
    total_degree_cost_note: p.total_degree_cost_note ?? null,
    min_qualification: p.min_qualification ?? null,
    min_marks: p.min_marks ?? null,
    entrance_test_required: p.entrance_test_required ?? null,
    entrance_test_type: p.entrance_test_type ?? null,
    age_limit: p.age_limit ?? null,
    required_documents: p.required_documents ?? null,
    merit_criteria: p.merit_criteria ?? null,
    scholarships_available: p.scholarships_available ?? null,
    scholarship_types: p.scholarship_types ?? null,
    scholarship_eligibility: p.scholarship_eligibility ?? null,
    available_shifts: p.available_shifts ?? null,
    class_days: p.class_days ?? null,
    class_timings: p.class_timings ?? null,
    delivery_mode: p.delivery_mode ?? null,
    seats_available: p.seats_available ?? null,
    labs_practical: p.labs_practical ?? null,
    original_level: p.level ?? null, // raw scraped label, preserved
  };
  return e;
};

// ── fee text + fee rows for campus_programs.details UI shape ────────────────
const feeText = (p) => {
  if (typeof p.semester_fee === "number") return `PKR ${p.semester_fee.toLocaleString("en-US")} / semester`;
  if (typeof p.annual_fee === "number") return `PKR ${p.annual_fee.toLocaleString("en-US")} / year`;
  if (typeof p.total_degree_cost === "number") return `PKR ${p.total_degree_cost.toLocaleString("en-US")} total`;
  return null;
};
const feeRows = (p) =>
  [
    ["Tuition Fee (per semester)", p.semester_fee, "Semester"],
    ["Tuition Fee (per year)", p.annual_fee, "Year"],
    ["Admission Fee", p.admission_fee, "One Time"],
    ["Security Deposit", p.security_deposit, "One Time"],
    ["Total Degree Cost", p.total_degree_cost, "Whole Degree"],
  ]
    .filter(([, amt]) => typeof amt === "number")
    .map(([head, amount, frequency]) => ({ head, amount, frequency }));
const parsePct = (s) => {
  const m = String(s || "").match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? Number(m[1]) : null;
};

// ── campus name → id ─────────────────────────────────────────────────────────
const campusId = {};
for (const c of d.campuses) campusId[c.name] = uuidFor(`campus:${c.name}`);

// Campus-admin accounts already registered in Student_signup (role='campus').
// The seed REUSES their existing campuses row and renames it to the canonical
// spelling, so one account never owns two rows (that is what makes the public
// page show the same city twice) and their dashboard keeps resolving.
const CAMPUS_OWNERS = [
  { uid: "437d1697-754b-4629-b9e1-58fbc5e45dc8", email: "lahoreuol@uol.edu.pk", accountName: "Lahore campus",
    keys: ["main campus"], sqlLike: ["%Main Campus%", "Lahore campus"] },
  { uid: "ec51e245-795f-4172-ab2d-50cdfc594846", email: "lhrgulberg@uol.edu.pk", accountName: "Lahore Gulberg",
    keys: ["city campus"], sqlLike: ["%City Campus%", "%Gulberg%"] },
  { uid: "06eadd31-09d0-4fa0-b855-c2eb54f103ca", email: "sgdhcampus@uol.edu.pk", accountName: "Sargodha Campus",
    keys: ["sargodha"], sqlLike: ["%Sargodha%"] },
  { uid: "07f4171a-13a6-474c-b408-0a4b833bd70d", email: "pakpattan@uol.edu.pk", accountName: "Pakpattan campus",
    keys: ["pakpattan", "baba fareed"], sqlLike: ["%Pakpattan%", "%Baba Fareed%"] },
  { uid: "2aacfe39-a0b6-4d0c-a5c0-365ba01c8392", email: "uganda123@uol.edu.pk", accountName: "Uganda Campus",
    keys: ["uganda"], sqlLike: ["%Uganda%", "%Kampala%"] },
];
const ownerFor = (campus) => {
  const n = String(campus.name || "").toLowerCase();
  return CAMPUS_OWNERS.find((o) => o.keys.some((k) => n.includes(k))) || null;
};

// ── university-level gallery images (all images belong to the university) ───
const uniImages = d.images || [];

const L = [];
const P = (...s) => L.push(...s);

P(`-- ================================================================
-- THE UNIVERSITY OF LAHORE (UOL) FULL SEED — generated from
--   src/backend/data/Universities/UOL/uol_data.json   (v14, verified 2026-10-18)
-- NOTE: uol_data_updated.xlsx was NOT used — it is a stale export (198 rows,
--   pre-v9 fees) that disagrees with the corrected JSON (296 programs).
-- Import via phpMyAdmin → Import tab (file is large; do not paste into SQL tab).
--
-- * Reuses the existing HEC master row for "${UNI_NAME}" when present
--   (matched on normalized_name, then on name) so no duplicate university is created.
-- * Idempotent: re-running deletes this university's seeded rows first, then re-inserts.
-- * Preserves: universities.id, universities.owner_uid, campuses.campus_admin_uid,
--   Student_signup accounts (nothing here touches them).
-- * Campuses are bound to the 5 existing campus_admin accounts by campus_admin_uid:
--   each block resolves @cid from the account's existing row (or name match) and
--   updates it, instead of inserting a new row. Empty duplicate rows for the same
--   account or same canonical name are dropped first. Islamabad + Gujrat have no
--   account (both split off as independent universities) and keep uid NULL untouched.
-- * programs.level: UOL labels "Postgraduate"/"Graduate" are mapped by degree_type
--   (PhD→PhD, MPhil→MPhil, MS/MBA/MSc/M.Arch→MS, PGD→Diploma). "Doctor of Medicine"
--   has no ENUM fit → level NULL. The raw scraped label is kept in programs.extra.original_level.
-- * programs.extra keeps every program field that has no dedicated column
--   (faculty, fees, eligibility, documents, …). The university Programs tab reads
--   SELECT * , so extra is delivered as-is.
-- * campus_programs.status='published', campus_hostels.status='live'.
-- * detail JSON keeps the original scraped keys AND adds the keys the Programs tab
--   reads (fees[] / eligibility[] / entryTest / interviewOn / merit) — derived from
--   the same values, no invented data.
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── STEP 0: resolve (or create) the university row ────────────────────────
SET @uni_id = COALESCE(
  (SELECT id FROM universities WHERE normalized_name = ${q(NORM_NAME)} LIMIT 1),
  (SELECT id FROM universities WHERE name = ${q(UNI_NAME)} LIMIT 1),
  ${q(UNI_ID_IF_MISSING)}
);
`);

// ── universities row ────────────────────────────────────────────────────────
{
  const rankLabel = clean(u.ranking_label);
  const studentsTxt = typeof u.students === "number" ? u.students.toLocaleString("en-US") : null;
  P(`INSERT INTO universities
  (id, owner_uid, name, normalized_name, hec_rank, university_type, oric_domain, domain,
   focal_person_name, focal_person_email, campuses_text, campus_count, is_hec_listed, status,
   tagline, hero_subtitle, about_title, about_text, description, mission, vision,
   ranking, ranking_label, students, employment_rate, partner_countries, total_campuses,
   established_year, website, email, phone, city, address, logo_url, banner_url,
   last_synced_at, created_at, updated_at)
VALUES
  (@uni_id, NULL, ${q(UNI_NAME)}, ${q(NORM_NAME)}, NULL, ${q(u.university_type)},
   ${q(u.oric_domain)}, ${q(String(u.oric_domain || "").replace(/^@/, "") || null)},
   ${q(clean(u.focal_person_name))}, ${q(clean(u.focal_person_email))},
   ${q(u.campuses_text)}, ${num(u.campus_count)}, 1, 'approved',
   ${q(clip(u.tagline, 255))}, ${q(clip(u.hero_subtitle, 500))}, ${q(clip(u.about_title, 255))},
   ${q(u.about_text)}, ${q(u.about_text)}, ${q(u.mission)}, ${q(u.vision)},
   ${q(clip(u.ranking, 20))}, ${q(clip(rankLabel, 150))},
   ${q(studentsTxt)}, ${q(clip(clean(u.employment_rate), 50))}, ${q(clip(clean(u.partner_countries), 50))},
   ${q(String(u.total_campuses ?? u.campus_count ?? ""))},
   ${q(String(u.established_year ?? ""))}, ${q(u.website)},
   ${q(u.email)}, ${q(u.phone)}, ${q(u.city)}, ${q(u.address)}, ${q(u.logo_url)}, ${q(u.banner_url)},
   ${q(d.google_verified_at || d.corrected_at || null)}, NOW(), NOW())
ON DUPLICATE KEY UPDATE
   name                    = VALUES(name),
   normalized_name         = COALESCE(NULLIF(normalized_name, ''), VALUES(normalized_name)),
   university_type         = VALUES(university_type),
   oric_domain             = VALUES(oric_domain),
   domain                  = VALUES(domain),
   focal_person_name       = VALUES(focal_person_name),
   focal_person_email      = VALUES(focal_person_email),
   campuses_text           = VALUES(campuses_text),
   campus_count            = VALUES(campus_count),
   is_hec_listed           = 1,
   status                  = 'approved',
   tagline                 = VALUES(tagline),
   hero_subtitle           = VALUES(hero_subtitle),
   about_title             = VALUES(about_title),
   about_text              = VALUES(about_text),
   description             = VALUES(description),
   mission                 = VALUES(mission),
   vision                  = VALUES(vision),
   ranking                 = VALUES(ranking),
   ranking_label           = VALUES(ranking_label),
   students                = VALUES(students),
   employment_rate         = VALUES(employment_rate),
   partner_countries       = VALUES(partner_countries),
   total_campuses          = VALUES(total_campuses),
   established_year        = VALUES(established_year),
   website                 = VALUES(website),
   email                   = VALUES(email),
   phone                   = VALUES(phone),
   city                    = VALUES(city),
   address                 = VALUES(address),
   logo_url                = VALUES(logo_url),
   banner_url              = VALUES(banner_url),
   updated_at              = NOW();

-- @uni_id may point at a row whose id differs from the fallback constant.
SET @uni_id = COALESCE(
  (SELECT id FROM universities WHERE id = @uni_id LIMIT 1),
  (SELECT id FROM universities WHERE normalized_name = ${q(NORM_NAME)} LIMIT 1),
  @uni_id
);

-- ── STEP 1: clear this university's seeded rows (campuses rows kept) ───────
DELETE FROM campus_programs   WHERE campus_id IN (SELECT id FROM campuses WHERE university_id = @uni_id);
DELETE FROM campus_societies  WHERE campus_id IN (SELECT id FROM campuses WHERE university_id = @uni_id);
DELETE FROM campus_facilities WHERE campus_id IN (SELECT id FROM campuses WHERE university_id = @uni_id);
DELETE FROM campus_images     WHERE campus_id IN (SELECT id FROM campuses WHERE university_id = @uni_id);
DELETE FROM campus_hostels    WHERE campus_id IN (SELECT id FROM campuses WHERE university_id = @uni_id);
DELETE FROM programs          WHERE university_id = @uni_id;
DELETE FROM university_images WHERE university_id = @uni_id;
DELETE FROM university_profiles WHERE university_id = @uni_id;
`);

  // STEP 2 — university_profiles
  P(`-- ── STEP 2: university_profiles (1 row) ──────────────────────────────────
INSERT INTO university_profiles
  (university_id, established_year, about_text, mission_statement, logo_path, banner_path,
   active_students, website_url, admissions_email, admissions_phone)
VALUES
  (@uni_id, ${num(u.established_year)}, ${q(u.about_text)}, ${q(u.mission)},
   ${q(u.logo_url)}, ${q(u.banner_url)}, ${num(typeof u.students === "number" ? u.students : null)},
   ${q(u.website)}, ${q(u.email)}, ${q(u.phone)})
ON DUPLICATE KEY UPDATE
  established_year  = VALUES(established_year),
  about_text        = VALUES(about_text),
  mission_statement = VALUES(mission_statement),
  logo_path         = VALUES(logo_path),
  banner_path       = VALUES(banner_path),
  active_students   = VALUES(active_students),
  website_url       = VALUES(website_url),
  admissions_email  = VALUES(admissions_email),
  admissions_phone  = VALUES(admissions_phone),
  updated_at        = NOW();
`);
}

// ── STEP 3: campuses ────────────────────────────────────────────────────────
P(`-- ── STEP 3: campuses (${d.campuses.length} rows) ─────────────────────────────────────`);
for (const c of d.campuses) {
  // campuses has no website/legal_status/country columns — keep those verbatim source
  // values as labelled notes on description instead of dropping them.
  const notes = [];
  if (c.website) notes.push(`Website: ${c.website}`);
  if (c.website_note) notes.push(String(c.website_note));
  if (c.legal_status) notes.push(`Legal status: ${c.legal_status}`);
  if (c.rebrand_name) notes.push(`Now operating as: ${c.rebrand_name}${c.rebrand_year ? ` (${c.rebrand_year})` : ""}`);
  if (c.country) notes.push(`Country: ${c.country}`);
  const desc = [clean(c.description), ...notes].filter(Boolean).join("\n\n") || null;
  const cols = [
    "id", "university_id", "campus_admin_uid", "verification_id", "name", "campus_type", "city", "province",
    "address", "description", "why_choose", "phone", "whatsapp", "email", "office_hours",
    "shift_morning", "shift_evening", "shift_weekend", "gender_policy", "lat", "lng",
    "hostel_available", "is_main", "admission_open", "admission_close", "intake_name", "classes_start",
    "class_arrangement", "admission_status_override", "students", "status", "cover_image",
  ];
  const vals = [
    q(campusId[c.name]), "@uni_id", "NULL", "NULL", q(c.name), q(c.campus_type), q(c.city), q(c.province),
    q(c.address), q(desc), q(c.why_choose), q(clip(c.phone, 50)), q(c.whatsapp),
    q(c.email), q(c.office_hours),
    bool(c.shift_morning), bool(c.shift_evening), bool(c.shift_weekend), q(c.gender_policy),
    num(c.lat), num(c.lng), bool(c.hostel_available), bool(c.is_main),
    q(c.admission_open), q(c.admission_close), q(c.intake_name), q(c.classes_start),
    q(c.class_arrangement), q(clean(c.admission_status_override)),
    q(clip(clean(c.students), 50)), q("active"), q(clean(c.cover_image)),
  ];
  // Literal values in UPDATE — VALUES(col) is only valid inside ON DUPLICATE KEY UPDATE.
  const updCols = [
    "campus_type", "city", "province", "address", "description", "why_choose", "phone", "whatsapp",
    "email", "office_hours", "shift_morning", "shift_evening", "shift_weekend", "gender_policy",
    "lat", "lng", "hostel_available", "is_main", "admission_open", "admission_close", "intake_name",
    "classes_start", "class_arrangement", "students", "cover_image", "status",
  ];
  const upd = updCols.map((c) => `${c}=${vals[cols.indexOf(c)]}`);
  const owner = ownerFor(c);
  const uidSql = owner ? q(owner.uid) : "NULL";
  const shortName = String(c.name).replace(/^The University of Lahore\s*[–-]\s*/i, "");
  const likeSql = (owner ? owner.sqlLike : [`%${shortName}%`])
    .map((p) => `name LIKE ${q(p)}`).join(" OR ");
  const resolve =
    `SET @cid = COALESCE(\n` +
    (owner ? `  (SELECT id FROM campuses WHERE university_id = @uni_id AND campus_admin_uid = ${q(owner.uid)} ORDER BY id LIMIT 1),\n` : "") +
    `  (SELECT id FROM campuses WHERE university_id = @uni_id AND name = ${q(c.name)} LIMIT 1),\n` +
    `  (SELECT id FROM campuses WHERE university_id = @uni_id AND (${likeSql}) ORDER BY created_at DESC, id LIMIT 1),\n` +
    `  ${q(campusId[c.name])}\n);\n`;
  const dropDupes =
    `DELETE FROM campuses\nWHERE university_id = @uni_id AND id <> @cid\n  AND (name = ${q(c.name)}${owner ? ` OR campus_admin_uid = ${q(owner.uid)}` : ""})\n` +
    `  AND (campus_admin_uid IS NULL${owner ? ` OR campus_admin_uid = ${q(owner.uid)}` : ""})\n` +
    `  AND NOT EXISTS (SELECT 1 FROM campus_programs cp WHERE cp.campus_id = campuses.id)\n` +
    `  AND NOT EXISTS (SELECT 1 FROM campus_images   ci WHERE ci.campus_id = campuses.id);\n`;
  const vals2 = [...vals];
  vals2[0] = "@cid";
  if (owner) vals2[2] = uidSql;
  P(
    `-- ${c.name}${owner ? `  (owner: ${owner.email})` : ""}\n` +
      resolve +
      dropDupes +
      `INSERT INTO campuses (${cols.join(", ")})\nSELECT ${vals2.join(", ")} FROM dual\nWHERE NOT EXISTS (SELECT 1 FROM campuses WHERE id = @cid);\n` +
      `UPDATE campuses SET\n  name = ${q(c.name)},\n  ${owner ? `campus_admin_uid = ${uidSql},\n  ` : ""}${upd.join(",\n  ")}\nWHERE id = @cid;\n`
  );
}

// ── STEP 4: programs ────────────────────────────────────────────────────────
P(`-- ── STEP 4: programs (${d.programs.length} rows; extra holds all non-column fields) ────`);
for (const p of d.programs) {
  const name = clean(p.name) || clean(p.original_name);
  const level = mapLevel(p);
  const spec = clean(p.specialization);
  const track = clean(p.track);
  const extra = progExtra(p);
  P(
    `INSERT INTO programs (id, university_id, name, degree_type, level, specialization, track, extra, original_name, status, created_via)\n` +
      `SELECT UUID(), @uni_id, ${q(name)}, ${q(clean(p.degree_type) || "")}, ${q(level)}, ${q(spec)}, ${q(track)}, ${j(extra)}, ${q(p.original_name || name)}, 'approved', 'seed'\n` +
      `FROM dual WHERE NOT EXISTS (SELECT 1 FROM programs WHERE university_id = @uni_id AND name = ${q(name)}\n` +
      `  AND COALESCE(level,'') = COALESCE(${q(level)},'') AND COALESCE(specialization,'') = COALESCE(${q(spec)},'') AND COALESCE(track,'') = COALESCE(${q(track)},''));\n`
  );
}

// ── STEP 5: campus_programs ────────────────────────────────────────────────
// The UOL dataset does NOT attribute programs to individual campuses, so every
// program is attached to the Main Campus (the primary teaching campus) so the
// campus Programs tab renders. Fee/eligibility detail lives in `details`.
const mainCampus = d.campuses.find((c) => c.is_main) || d.campuses[0];
P(`-- ── STEP 5: campus_programs (${d.programs.length} rows → Main Campus, status='published') ──`);
for (const p of d.programs) {
  const name = clean(p.name) || clean(p.original_name);
  const level = mapLevel(p);
  const spec = clean(p.specialization);
  const track = clean(p.track);
  const detail = {
    ...progExtra(p),
    fees: feeRows(p),
    eligibility:
      clean(p.min_qualification) || parsePct(p.min_marks)
        ? [{ qualification: clean(p.min_qualification) || "", minPct: parsePct(p.min_marks), subjects: null }]
        : [],
    entryTest: clean(p.entrance_test_type) ? clean(p.entrance_test_type).replace(/\n+/g, "; ") : null,
    interviewOn: false,
    interviewNote: "",
    merit: [],
  };
  P(
    `INSERT INTO campus_programs (id, campus_id, program_id, fee, duration, details, status, shifts)\n` +
      `SELECT UUID(), c.id, p.id, ${q(clip(feeText(p), 100))}, ${q(clip(p.duration, 100))}, ${j(detail)}, 'published', ${q(clip(Array.isArray(p.available_shifts) ? p.available_shifts.join(", ") : p.available_shifts, 100))}\n` +
      `FROM campuses c JOIN programs p ON p.university_id = @uni_id AND p.name = ${q(name)} AND COALESCE(p.level,'') = COALESCE(${q(level)},'') AND COALESCE(p.specialization,'') = COALESCE(${q(spec)},'') AND COALESCE(p.track,'') = COALESCE(${q(track)},'')\n` +
      `WHERE c.university_id = @uni_id AND c.name = ${q(mainCampus.name)}\n` +
      `  AND NOT EXISTS (SELECT 1 FROM campus_programs cp WHERE cp.campus_id = c.id AND cp.program_id = p.id);\n`
  );
}

// ── STEP 6: campus_facilities ──────────────────────────────────────────────
P(`-- ── STEP 6: campus_facilities (${d.facilities.length} rows) ─────────────────────────`);
for (const f of d.facilities) {
  P(
    `INSERT INTO campus_facilities (campus_id, selected_ids, transport_routes, transport_fee, dress_code, class_timings, attendance_policy, discipline_policy)\n` +
      `SELECT c.id, ${j(f.selected_ids ?? [])}, ${j(f.transport_routes ?? null)}, ${q(clip(f.transport_fee, 50))}, ${q(clip(f.dress_code, 255))}, ${q(clip(f.class_timings, 255))}, ${q(clip(f.attendance_policy, 255))}, ${q(clean(f.discipline_policy))}\n` +
      `FROM campuses c WHERE c.university_id = @uni_id AND c.name = ${q(f.campus)}\n` +
      `ON DUPLICATE KEY UPDATE selected_ids=VALUES(selected_ids), transport_routes=VALUES(transport_routes), transport_fee=VALUES(transport_fee), dress_code=VALUES(dress_code), class_timings=VALUES(class_timings), attendance_policy=VALUES(attendance_policy), discipline_policy=VALUES(discipline_policy), updated_at=NOW();\n`
  );
}

// ── STEP 7: campus_societies ──────────────────────────────────────────────
P(`-- ── STEP 7: campus_societies (${d.societies.length} rows) ────────────────────────`);
for (const s of d.societies) {
  P(
    `INSERT INTO campus_societies (id, campus_id, name, category, description, initials)\n` +
      `SELECT UUID(), c.id, ${q(clip(s.name, 255))}, ${q(clip(s.category, 100))}, ${q(clean(s.description))}, ${q(clip(s.initials, 4))}\n` +
      `FROM campuses c WHERE c.university_id = @uni_id AND c.name = ${q(s.campus)}\n` +
      `  AND NOT EXISTS (SELECT 1 FROM campus_societies cs WHERE cs.campus_id = c.id AND cs.name = ${q(s.name)});\n`
  );
}

// ── STEP 8: campus_hostels ────────────────────────────────────────────────
P(`-- ── STEP 8: campus_hostels (${d.hostels.length} rows, status='live') ──────────────`);
for (const h of d.hostels) {
  P(
    `INSERT INTO campus_hostels (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)\n` +
      `SELECT UUID(), c.id, ${q(clip(h.name, 255))}, ${q(clip(clean(h.vendor_name), 255))}, ${q(clip(h.hostel_type, 30) || "Campus Hostel")}, ${q(clip(h.gender, 20) || "Boys")}, ${h.rooms == null ? "NULL" : num(Number(h.rooms))}, ${q(clip(h.rent_min, 50))}, ${q(clip(h.walk_dist, 50))}, ${q(clip(clean(h.contact), 100))}, ${j(h.amenities ?? null)}, ${j(h.rooms_detail ?? null)}, 'live', 1\n` +
      `FROM campuses c WHERE c.university_id = @uni_id AND c.name = ${q(h.campus)}\n` +
      `  AND NOT EXISTS (SELECT 1 FROM campus_hostels h2 WHERE h2.campus_id = c.id AND h2.name = ${q(h.name)});\n`
  );
}

// ── STEP 9: university_images ─────────────────────────────────────────────
P(`-- ── STEP 9: university_images (${uniImages.length} rows) ────────────────────────`);
for (const im of uniImages) {
  P(
    `INSERT INTO university_images (id, university_id, image_url, caption)\n` +
      `SELECT UUID(), @uni_id, ${q(im.image_url)}, ${q(clip(im.caption, 255))}\nFROM dual\n` +
      `WHERE NOT EXISTS (SELECT 1 FROM university_images ui WHERE ui.university_id = @uni_id AND ui.image_url = ${q(im.image_url)});\n`
  );
}

// ── STEP 10: program_catalog ──────────────────────────────────────────────
P(`-- ── STEP 10: program_catalog (search index; backend also rebuilds this at boot) ────
INSERT INTO program_catalog (name, normalized_name, level, university_count)
SELECT t.display_name, LOWER(TRIM(t.display_name)), MIN(t.level), COUNT(DISTINCT t.university_id)
FROM (
  SELECT university_id, level,
         TRIM(CONCAT_WS(' ', NULLIF(TRIM(degree_type), ''), NULLIF(TRIM(name), ''))) AS display_name
  FROM programs
  WHERE university_id = @uni_id AND status = 'approved' AND name IS NOT NULL AND TRIM(name) != ''
) t
WHERE t.display_name IS NOT NULL AND TRIM(t.display_name) != ''
  AND NOT EXISTS (SELECT 1 FROM program_catalog pc WHERE pc.normalized_name = LOWER(TRIM(t.display_name)))
GROUP BY t.display_name
ON DUPLICATE KEY UPDATE university_count = VALUES(university_count), updated_at = NOW();
`);

// ── VERIFY ────────────────────────────────────────────────────────────────
P(`SET FOREIGN_KEY_CHECKS = 1;

-- ── VERIFY (expected: uni 1, profile 1, u_images ${uniImages.length}, campuses ${d.campuses.length},
--    programs ${d.programs.length}, campus_programs ${d.programs.length},
--    facilities ${d.facilities.length}, societies ${d.societies.length},
--    hostels ${d.hostels.length}) ─────────────
SELECT 'universities' AS tbl, COUNT(*) AS cnt FROM universities WHERE id = @uni_id
UNION ALL SELECT 'university_profiles', COUNT(*) FROM university_profiles WHERE university_id = @uni_id
UNION ALL SELECT 'university_images',   COUNT(*) FROM university_images   WHERE university_id = @uni_id
UNION ALL SELECT 'campuses',            COUNT(*) FROM campuses            WHERE university_id = @uni_id
UNION ALL SELECT 'programs',            COUNT(*) FROM programs            WHERE university_id = @uni_id
UNION ALL SELECT 'campus_programs',     COUNT(*) FROM campus_programs cp JOIN campuses c ON c.id = cp.campus_id WHERE c.university_id = @uni_id
UNION ALL SELECT 'campus_facilities',   COUNT(*) FROM campus_facilities cf JOIN campuses c ON c.id = cf.campus_id WHERE c.university_id = @uni_id
UNION ALL SELECT 'campus_societies',    COUNT(*) FROM campus_societies  cs JOIN campuses c ON c.id = cs.campus_id WHERE c.university_id = @uni_id
UNION ALL SELECT 'campus_hostels',      COUNT(*) FROM campus_hostels    h  JOIN campuses c ON c.id = h.campus_id  WHERE c.university_id = @uni_id;
`);

fs.writeFileSync(OUT, L.join("\n"), "utf8");
console.log(`wrote ${OUT}  (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
console.log(
  `rows: programs=${d.programs.length} campus_programs=${d.programs.length} campuses=${d.campuses.length} facilities=${d.facilities.length} societies=${d.societies.length} hostels=${d.hostels.length} university_images=${uniImages.length}`
);
