/**
 * One-off generator: NU-FAST JSON → phpMyAdmin-importable seed SQL.
 * Reads only the two verified JSON files; writes nu_fast_full_seed.sql.
 * No code in src/ is modified by this script.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "src/backend/data/Universities/NU-FAST");
const OUT = path.join(ROOT, "nu_fast_full_seed.sql");

const req = JSON.parse(fs.readFileSync(path.join(DATA, "nu_fast_requirements_data_verified.json"), "utf8"));
const sp = JSON.parse(fs.readFileSync(path.join(DATA, "nu_fast_student_profile_verified.json"), "utf8"));

// ── stable ids ───────────────────────────────────────────────────────────────
const UNI_ID_IF_MISSING = "6b0f4f2e-9d47-4f0c-9f3a-9d5c1a70f0a1";
const CAMPUS_ID = {
  "Chiniot-Faisalabad": "6b0f4f2e-9d47-4f0c-9f3a-000000000001",
  Islamabad: "6b0f4f2e-9d47-4f0c-9f3a-000000000002",
  Karachi: "6b0f4f2e-9d47-4f0c-9f3a-000000000003",
  Lahore: "6b0f4f2e-9d47-4f0c-9f3a-000000000004",
  Multan: "6b0f4f2e-9d47-4f0c-9f3a-000000000005",
  Peshawar: "6b0f4f2e-9d47-4f0c-9f3a-000000000006",
};
const UNI_NAME = req.university.name;
const NORM_NAME = "national university of computer and emerging sciences";

// ── sql literal helpers ──────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/'/g, "''");
const q = (v) => (v === null || v === undefined || v === "" ? "NULL" : `'${esc(v)}'`);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "NULL");
const j = (v) => (v === null || v === undefined ? "NULL" : `'${esc(JSON.stringify(v))}'`);
const clip = (v, n) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  if (!s || /^not (publicly )?mentioned$/i.test(s) || /not publicly disclosed/i.test(s)) return null;
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};
const clean = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[ \t]+/g, " ").trim();
  if (!s || /^not (publicly )?mentioned$/i.test(s) || /not publicly disclosed/i.test(s)) return null;
  return s;
};
const bool = (v) => (v ? 1 : 0);

// ── campus-level scholarship shaping (verbatim source text only) ─────────────
const splitEntry = (entry) => {
  const m = String(entry).match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { name: m[1].trim(), summary: m[2].trim() } : { name: String(entry).trim(), summary: null };
};
const internal = req.university.scholarships?.internal || [];
const external = req.university.scholarships?.external || [];
const typeOf = (name) => {
  const hit = (arr) => arr.some((e) => splitEntry(e).name.toLowerCase().startsWith(name.slice(0, 18).toLowerCase()));
  if (hit(internal)) return "Internal";
  if (hit(external)) return "External";
  return null;
};
const scholarships = (sp.scholarships || []).map((s) => {
  const name = clean(s.name);
  return {
    name,
    type: typeOf(name || ""),
    coverage: clip(s.coverage, 160),
    criteria: [clean(s.eligibility), clean(s.how_to_apply) && `How to apply: ${clean(s.how_to_apply)}`]
      .filter(Boolean)
      .join(" "),
  };
}).filter((s) => s.name);
// any requirements-only entries not present in the profile file
for (const [arr, type] of [[internal, "Internal"], [external, "External"]]) {
  for (const entry of arr) {
    const { name, summary } = splitEntry(entry);
    if (scholarships.some((s) => s.name.toLowerCase().includes(name.toLowerCase().slice(0, 18)))) continue;
    scholarships.push({ name, type, coverage: clip(summary, 160), criteria: clip(entry, 500) });
  }
}

// ── required documents per campus (union of that campus' program docs) ───────
const LEVEL_KEY = { Undergraduate: "UG", MS: "MS_MPhil", MPhil: "MS_MPhil", PhD: "PhD", ADP: "ADP", Diploma: "Diploma" };
const docsByCampus = {};
const cpdByCampus = {};
for (const row of req.campus_program_details || []) {
  const cn = row.campus_name;
  cpdByCampus[cn] = cpdByCampus[cn] || [];
  cpdByCampus[cn].push(row);
  const d = row.details || {};
  docsByCampus[cn] = docsByCampus[cn] || new Map();
  for (const doc of d.required_documents || []) {
    const key = String(doc).trim();
    if (!key || /^not mentioned$/i.test(key)) continue;
    const cur = docsByCampus[cn].get(key) || { name: key, levels: new Set() };
    const prog = (req.programs || []).find((p) => p.original_name === row.program_name);
    if (prog?.level) cur.levels.add(LEVEL_KEY[prog.level] || prog.level);
    docsByCampus[cn].set(key, cur);
  }
}
const requiredDocsByCampus = Object.fromEntries(
  Object.entries(docsByCampus).map(([cn, map]) => [
    cn,
    [...map.values()].map((d) => ({ name: d.name, levels: [...d.levels] })),
  ])
);

// ── announcements (admissions calendar, verbatim dates) ─────────────────────
const dates = (s) => (String(s || "").match(/\d{4}-\d{2}-\d{2}/g) || []);
const adm = sp.admissions || {};
const announcements = [
  adm.open_date && { label: "Application Forms Open", date: dates(adm.open_date)[0] },
  adm.deadline && { label: "Application Deadline", date: dates(adm.deadline)[0] },
  adm.test_date && { label: "Admission Test", date: dates(adm.test_date)[0] },
  adm.result_date && { label: "Result Announcement", date: dates(adm.result_date)[0] },
].filter((a) => a && a.date).map((a) => ({ label: a.label, date: a.date }));

// ── facility id mapping onto the app's canonical catalogue ──────────────────
const FACILITY_MAP = {
  library: "library",
  computer_lab: "comp_labs",
  sci_lab: "sci_labs",
  science_lab: "sci_labs",
  labs: "comp_labs",
  sports: "sports",
  sports_ground: "sports",
  sports_grounds: "sports",
  cafeteria: "cafeteria",
  canteen: "cafeteria",
  mosque: "prayer",
  prayer: "prayer",
  prayer_area: "prayer",
  wifi: "wifi",
  medical: "medical",
  medical_center: "medical",
  medical_room: "medical",
  parking: "parking",
  atm: "atm",
  auditorium: "auditorium",
  cctv: "cctv",
  security: "cctv",
  disability: "disability",
  student_lounge: "lounges",
  student_lounges: "lounges",
  lounges: "lounges",
  bank: "bank",
  transport: "transport",
  gym: "gym",
};
const mapFacilities = (csv, extra) => {
  const out = [];
  for (const raw of String(csv || "").split(/[,;]/)) {
    const id = FACILITY_MAP[raw.trim().toLowerCase().replace(/\s+/g, "_")];
    if (id && !out.includes(id)) out.push(id);
  }
  for (const id of extra || []) if (!out.includes(id)) out.push(id);
  return out;
};
const spCampus = Object.fromEntries((sp.campuses || []).map((c) => [c.campus_name, c]));

// ── free-text "university description" built from the profile file ──────────
const uni = sp.university || {};
const asList = (v) =>
  Array.isArray(v)
    ? v
    : v && typeof v === "object"
    ? Object.entries(v).map(([k, val]) => `${k}: ${Array.isArray(val) ? val.join(", ") : val}`)
    : v === null || v === undefined
    ? []
    : [v];
const joinBullets = (arr) => asList(arr).map((x) => clean(x)).filter(Boolean).filter((x) => x.length > 3).join("; ");
const listToText = (arr, sep = "; ") => asList(arr).map((x) => clean(x)).filter(Boolean).join(sep);
const descSections = [];
if (clean(uni.overview)) descSections.push(clean(uni.overview));
const extras = [];
if (clean(uni.hec_recognized)) extras.push(`HEC Recognized: ${clean(uni.hec_recognized)}.`);
if (uni.rankings?.length) extras.push(`Rankings: ${joinBullets(uni.rankings)}.`);
if (uni.accreditations?.length) extras.push(`Accreditations: ${joinBullets(uni.accreditations)}.`);
if (clean(uni.total_students)) extras.push(`Students: ${clean(uni.total_students)}.`);
if (clean(uni.faculty_count)) extras.push(`Faculty: ${clean(uni.faculty_count)}.`);
if (clean(uni.established)) extras.push(`Established: ${clean(uni.established)}.`);
const feeBits = [];
if (clean(req.university.fees_per)) feeBits.push(`Fee basis: ${clean(req.university.fees_per)}.`);
if ((req.university.miscellaneous_fees || []).length)
  feeBits.push(
    `Miscellaneous fees: ${req.university.miscellaneous_fees
      .map((f) => `${f.fee_name} PKR ${f.amount}${f.refundable ? " (refundable)" : ""}`)
      .join("; ")}.`
  );
const rp = req.university.fee_refund_policy || {};
if (Object.keys(rp).length)
  feeBits.push(
    `Refund policy: ${[
      clean(rp.admission_fee) && `admission fee ${clean(rp.admission_fee)}`,
      clean(rp.security_deposit) && `security deposit ${clean(rp.security_deposit)}`,
      clean(rp.tuition_fee) && `tuition fee ${clean(rp.tuition_fee)}`,
      (rp.refund_schedule || []).length &&
        `schedule ${rp.refund_schedule.map((r) => `${clean(r.timeline)}: ${r.refund_percentage}%`).join("; ")}`,
    ]
      .filter(Boolean)
      .join("; ")}.`
  );
if (clean(rp.note)) feeBits.push(`Refund note: ${clean(rp.note)}`);
const pay = req.university.payment_instructions || {};
if ((pay.methods || []).length) feeBits.push(`Payment methods: ${listToText(pay.methods)}.`);
if ((pay.kuickpay_supported_banks || []).length)
  feeBits.push(`KuickPay supported banks: ${listToText(pay.kuickpay_supported_banks).slice(0, 600)}.`);
if ((pay.kuickpay_additional_methods || []).length)
  feeBits.push(`KuickPay additional methods: ${listToText(pay.kuickpay_additional_methods)}.`);
const pl = sp.placements || {};
if (clean(pl.career_services)) extras.push(`Career services: ${clean(pl.career_services)}`);
if ((pl.top_recruiters || []).length) extras.push(`Top recruiters: ${listToText(pl.top_recruiters)}`);
if (clean(pl.salary_stats)) extras.push(`Salary stats: ${clean(pl.salary_stats)}`);
if ((pl.notable_alumni || []).length) extras.push(`Notable alumni: ${listToText(pl.notable_alumni)}`);
const sl = sp.student_life || {};
if ((sl.societies || []).length) extras.push(`Student societies: ${listToText(sl.societies)}`);
if (clean(sl.sports)) extras.push(`Sports: ${clean(sl.sports)}`);
if (clean(sl.events)) extras.push(`Events: ${clean(sl.events)}`);
if (clean(adm.apply_link)) extras.push(`Apply online: ${clean(adm.apply_link)}`);
if (clean(adm.application_fee)) extras.push(`Application fee: ${clean(adm.application_fee)}`);
if (feeBits.length) extras.push(feeBits.join(" "));
const contact = sp.contact || {};
const social = contact.social_media || {};
const socialText = Object.entries(social)
  .map(([k, v]) => clean(v) && `${k}: ${clean(v)}`)
  .filter(Boolean)
  .join("; ");
const extraEmails = (contact.emails || []).filter((e) => e !== req.university.email);
if (socialText) extras.push(`Social media: ${socialText}.`);
if (extraEmails.length) extras.push(`Admissions emails: ${extraEmails.join("; ")}.`);
if (extras.length) descSections.push(extras.join(" "));
const UNIVERSITY_DESCRIPTION = descSections.join("\n\n") || null;

// ══════════════════════════════════════════════════════════════════════════════
const L = [];
const P = (...s) => L.push(...s);

P(`-- ================================================================
-- NU-FAST (FAST-NUCES) FULL SEED — generated from
--   src/backend/data/Universities/NU-FAST/nu_fast_requirements_data_verified.json
--   src/backend/data/Universities/NU-FAST/nu_fast_student_profile_verified.json
-- Import via phpMyAdmin → Import tab (file is large; do not paste into SQL tab).
--
-- * Reuses the existing HEC master row for "${UNI_NAME}" when present
--   (matched on normalized_name, then on name) so no duplicate university is created.
-- * Idempotent: re-running deletes this university's seeded rows first, then re-inserts.
-- * Preserves: universities.id, universities.owner_uid, campuses.campus_admin_uid,
--   Student_signup accounts (nothing here touches them).
-- * Render-critical: campus_programs.status='published', campus_hostels.status='live'.
-- * detail JSON keeps the original scraped keys AND adds the keys the Programs tab
--   reads (fees[] / eligibility[] / entryTest / interviewOn / merit) — derived from the
--   same values, no invented data.
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── STEP 0: resolve (or create) the university row ────────────────────────
-- FAST appears in the HEC master list under several spellings
-- ("… and …", "… & …", "FAST – NU"). Match all of them before creating a row,
-- otherwise this seed would create a second university and duplicate campuses.
SET @uni_id = COALESCE(
  (SELECT id FROM universities WHERE normalized_name = ${q(NORM_NAME)} LIMIT 1),
  (SELECT id FROM universities WHERE name = ${q(UNI_NAME)} LIMIT 1),
  (SELECT id FROM universities WHERE oric_domain = ${q(req.university.oric_domain)} ORDER BY is_hec_listed DESC, id LIMIT 1),
  (SELECT id FROM universities WHERE domain = ${q(String(req.university.oric_domain || "").replace(/^@/, ""))} ORDER BY is_hec_listed DESC, id LIMIT 1),
  (SELECT id FROM universities
    WHERE (name LIKE '%Computer%Emerging Sciences%' OR name LIKE '%FAST%NU%')
      AND name NOT LIKE '%CECOS%' AND name NOT LIKE '%Commecs%' AND name NOT LIKE '%Institute%'
    ORDER BY is_hec_listed DESC, hec_rank IS NULL, id LIMIT 1),
  ${q(UNI_ID_IF_MISSING)}
);

INSERT INTO universities
  (id, owner_uid, name, normalized_name, hec_rank, university_type, oric_domain, domain,
   focal_person_name, focal_person_email, campuses_text, campus_count, is_hec_listed, status,
   tagline, hero_subtitle, about_title, about_text, description, mission, vision,
   ranking, ranking_label, students, employment_rate, partner_countries, total_campuses,
   established_year, website, email, phone, city, address, logo_url, banner_url,
   last_synced_at, created_at, updated_at)
VALUES
  (@uni_id, NULL, ${q(UNI_NAME)}, ${q(NORM_NAME)}, ${num(5)}, ${q(req.university.university_type)},
   ${q(req.university.oric_domain)}, ${q(String(req.university.oric_domain || "").replace(/^@/, "") || null)},
   ${q(clean(req.university.focal_person_name))}, ${q(clean(req.university.focal_person_email))},
   ${q(req.university.campuses_text)}, ${num(req.university.campus_count)}, 1, 'approved',
   ${q(clip(req.university.tagline, 255))}, ${q(clip(req.university.hero_subtitle, 500))},
   ${q(clip(req.university.about_title, 255))}, ${q(req.university.about_text)},
   ${q(UNIVERSITY_DESCRIPTION)}, ${q(req.university.mission)}, ${q(req.university.vision)},
   ${q(clip(req.university.ranking, 20))}, ${q(clip(req.university.ranking_label, 150))},
   ${q(clip(req.university.students, 50))}, ${q(clip(req.university.employment_rate, 50))},
   ${q(clip(req.university.partner_countries, 50))}, ${q(String(req.university.total_campuses ?? ""))},
   ${q(String(req.university.established_year ?? ""))}, ${q(req.university.website)},
   ${q(req.university.email)}, ${q(req.university.phone)}, ${q(req.university.city)},
   ${q(req.university.address)}, ${q(req.university.logo_url)}, ${q(req.university.banner_url)},
   ${q(req.scrape_metadata?.last_verified || null)}, NOW(), NOW())
ON DUPLICATE KEY UPDATE
   name                    = VALUES(name),
   normalized_name         = COALESCE(NULLIF(normalized_name, ''), VALUES(normalized_name)),
   hec_rank                = VALUES(hec_rank),
   university_type         = VALUES(university_type),
   oric_domain             = VALUES(oric_domain),
   domain                  = VALUES(domain),
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
-- PREFLIGHT (read-only): lists the row this seed writes to plus any other row
-- that also looks like FAST. More than one row here = duplicate university,
-- which is what makes the campus list show the same campuses twice.
SELECT id, name, normalized_name, oric_domain, owner_uid,
       (SELECT COUNT(*) FROM campuses c WHERE c.university_id = u.id)  AS campus_rows,
       (SELECT COUNT(*) FROM programs p WHERE p.university_id = u.id)  AS program_rows
FROM universities u
WHERE u.id = @uni_id
   OR u.normalized_name LIKE '%computer%emerging sciences%'
   OR u.name LIKE '%Computer%Emerging Sciences%'
   OR u.oric_domain = '@nu.edu.pk';

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
{
  const c = req.university;
  P(`-- ── STEP 2: university_profiles (1 row) ──────────────────────────────────
INSERT INTO university_profiles
  (university_id, established_year, about_text, mission_statement, logo_path, banner_path,
   active_students, website_url, admissions_email, admissions_phone)
VALUES
  (@uni_id, ${num(c.established_year)}, ${q(c.about_text)}, ${q(c.mission)},
   ${q(c.logo_url)}, ${q(c.banner_url)}, ${num(11000)}, ${q(c.website)},
   ${q(clean((contact.emails || [])[0]) || c.email)}, ${q(clean((contact.phones || [])[0]) ? `+92-${clean((contact.phones || [])[0])}` : c.phone)})
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

// STEP 3 — campuses
P(`-- ── STEP 3: campuses (${req.campuses.length} rows) ─────────────────────────────────────────────
-- 3a: fold existing variant names onto the canonical spellings so the INSERT below
--     does not add a second row for the same campus (ids and campus_admin_uid stay).
`);
const NAME_VARIANTS = {
  "Chiniot-Faisalabad": ["Chiniot%", "Faisalabad%"],
  Islamabad: ["Islamabad%"],
  Karachi: ["Karachi%"],
  Lahore: ["Lahore%"],
  Multan: ["Multan%"],
  Peshawar: ["Peshawar%"],
};
for (const [canonical, variants] of Object.entries(NAME_VARIANTS)) {
  const conds = variants.map((v) => `name LIKE ${q(v)}`).join(" OR ");
  P(
    `UPDATE campuses SET name = ${q(canonical)} WHERE university_id = @uni_id AND (${conds}) AND name <> ${q(canonical)} AND id <> ${q(CAMPUS_ID[canonical])};\n` +
      `DELETE FROM campuses WHERE university_id = @uni_id AND name = ${q(canonical)} AND id <> ${q(CAMPUS_ID[canonical])} AND campus_admin_uid IS NULL;\n`
  );
}
P("");
for (const c of req.campuses) {
  const s = spCampus[c.name] || {};
  const cols = [
    "id", "university_id", "campus_admin_uid", "verification_id", "name", "campus_type", "city", "province",
    "address", "description", "why_choose", "phone", "whatsapp", "email", "office_hours",
    "shift_morning", "shift_evening", "shift_weekend", "gender_policy", "lat", "lng",
    "hostel_available", "is_main", "admission_open", "admission_close", "intake_name", "classes_start",
    "class_arrangement", "admission_status_override", "students", "status", "cover_image",
    "required_documents", "scholarships", "quota_policy", "announcements",
  ];
  const vals = [
    q(CAMPUS_ID[c.name]), "@uni_id", "NULL", "NULL", q(c.name), q(c.campus_type), q(c.city), q(c.province),
    q(c.address),
    q(c.description), q(c.why_choose), q(clip(c.phone || s.phone, 50)), q(clean(c.whatsapp)),
    q(c.email), q(c.office_hours || clean(s.timing)),
    bool(c.shift_morning), bool(c.shift_evening), bool(c.shift_weekend), q(c.gender_policy),
    num(c.lat), num(c.lng), bool(c.hostel_available), bool(c.is_main),
    q(c.admission_open), q(c.admission_close), q(c.intake_name), q(c.classes_start),
    q(c.class_arrangement), q(clean(c.admission_status_override)),
    q(clip(clean(c.students) || clean(s.students), 50)), "q_status", q(clean(c.cover_image) || clean(s.cover_image)),
    j(requiredDocsByCampus[c.name] || null), j(scholarships), "NULL", j(announcements),
  ].map((v) => (v === "q_status" ? q("active") : v));

  const upd = [
    `campus_type=VALUES(campus_type)`, `city=VALUES(city)`, `province=VALUES(province)`, `address=VALUES(address)`,
    `description=VALUES(description)`, `why_choose=VALUES(why_choose)`, `phone=VALUES(phone)`, `email=VALUES(email)`,
    `office_hours=VALUES(office_hours)`, `shift_morning=VALUES(shift_morning)`, `shift_evening=VALUES(shift_evening)`,
    `shift_weekend=VALUES(shift_weekend)`, `gender_policy=VALUES(gender_policy)`, `lat=VALUES(lat)`, `lng=VALUES(lng)`,
    `hostel_available=VALUES(hostel_available)`, `is_main=VALUES(is_main)`, `admission_open=VALUES(admission_open)`,
    `admission_close=VALUES(admission_close)`, `intake_name=VALUES(intake_name)`, `classes_start=VALUES(classes_start)`,
    `class_arrangement=VALUES(class_arrangement)`, `students=VALUES(students)`, `cover_image=VALUES(cover_image)`,
    `required_documents=VALUES(required_documents)`, `scholarships=VALUES(scholarships)`, `announcements=VALUES(announcements)`,
    `status=VALUES(status)`, `updated_at=NOW()`,
  ];
  P(
    `INSERT INTO campuses (${cols.join(", ")})\nSELECT ${vals.join(", ")} FROM dual\nWHERE NOT EXISTS (SELECT 1 FROM campuses WHERE university_id = @uni_id AND name = ${q(c.name)});\nUPDATE campuses SET\n  ${upd.join(",\n  ")}\nWHERE university_id = @uni_id AND name = ${q(c.name)};\n`
  );
}

// STEP 4 — programs
P(`-- ── STEP 4: programs (${req.programs.length} rows) ────────────────────────────────────`);
for (const p of req.programs) {
  P(
    `INSERT INTO programs (id, university_id, name, degree_type, level, specialization, track, original_name, status, created_via)\n` +
      `SELECT UUID(), @uni_id, ${q(p.name)}, ${q(p.degree_type)}, ${q(p.level)}, ${q(clean(p.specialization))}, ${q(clean(p.track))}, ${q(p.original_name)}, 'approved', 'seed'\n` +
      `FROM dual WHERE NOT EXISTS (SELECT 1 FROM programs WHERE university_id = @uni_id AND name = ${q(p.name)} AND level = ${q(p.level)});\n`
  );
}

// STEP 5 — campus_programs with details JSON
const parsePct = (s) => {
  const m = String(s || "").match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? Number(m[1]) : null;
};
P(`-- ── STEP 5: campus_programs (${req.campus_program_details.length} rows, status='published') ──────`);
for (const row of req.campus_program_details) {
  const d = row.details || {};
  const prog = (req.programs || []).find((p) => p.original_name === row.program_name);
  const progName = prog?.name ?? row.program_name;
  const progLevel = prog?.level ?? null;

  const feeRows = [
    ["Tuition Fee (per semester)", d.semester_fee, "Semester"],
    ["Tuition Fee (per year)", d.annual_fee, "Year"],
    ["Admission Fee", d.admission_fee, "One Time"],
    ["Security Deposit", d.security_deposit, "One Time"],
    ["Tuition Fee (per credit hour)", d.tuition_fee_per_credit_hour, "Credit Hour"],
    ["Total Degree Cost", d.total_degree_cost, "Whole Degree"],
  ]
    .filter(([, amt]) => typeof amt === "number")
    .map(([head, amount, frequency]) => ({ head, amount, frequency }));

  const ui = {
    fees: feeRows,
    eligibility:
      clean(d.minimum_qualification) || parsePct(d.minimum_marks_gpa_required)
        ? [
            {
              qualification: clean(d.minimum_qualification) || "",
              minPct: parsePct(d.minimum_marks_gpa_required),
              subjects: null,
            },
          ]
        : [],
    entryTest: clean(d.entrance_test_type) ? clean(d.entrance_test_type).replace(/\n+/g, "; ") : null,
    testBody: clean(d.entrance_test_type) ? (/@?NTS\b/i.test(d.entrance_test_type) ? "NTS" : null) : null,
    interviewOn: false,
    interviewNote: "",
    merit: [],
  };
  const merged = { ...d, ...ui, entryTest: ui.entryTest ?? null };

  const feeText =
    typeof d.semester_fee === "number"
      ? `PKR ${d.semester_fee.toLocaleString("en-US")} / semester`
      : typeof d.annual_fee === "number"
      ? `PKR ${d.annual_fee.toLocaleString("en-US")} / year`
      : typeof d.total_degree_cost === "number"
      ? `PKR ${d.total_degree_cost.toLocaleString("en-US")} total`
      : null;

  P(
    `INSERT INTO campus_programs (id, campus_id, program_id, fee, duration, details, status, shifts)\n` +
      `SELECT UUID(), c.id, p.id, ${q(clip(feeText, 100))}, ${q(clip(d.duration, 100))}, ${j(merged)}, 'published', ${q(clip(d.available_shifts, 100))}\n` +
      `FROM campuses c JOIN programs p ON p.university_id = @uni_id AND p.name = ${q(progName)} AND p.level = ${q(progLevel)}\n` +
      `WHERE c.university_id = @uni_id AND c.name = ${q(row.campus_name)}\n` +
      `  AND NOT EXISTS (SELECT 1 FROM campus_programs cp WHERE cp.campus_id = c.id AND cp.program_id = p.id);\n`
  );
}

// STEP 6 — campus_facilities
P(`-- ── STEP 6: campus_facilities (${req.campus_facilities.length} rows) ─────────────────────────`);
for (const f of req.campus_facilities) {
  const s = spCampus[f.campus_name] || {};
  const extra = [];
  if (clean(s.transport_available) && /available|yes/i.test(String(s.transport_available))) extra.push("transport");
  if (String(s.hostel_available || "").match(/^(yes|available)$/i)) { /* hostel flag lives on campuses */ }
  const ids = mapFacilities(f.selected_ids, extra);
  const transportFee = clip(f.transport_fee, 50) || clip(s.transport_details, 50);
  P(
    `INSERT INTO campus_facilities (campus_id, selected_ids, transport_routes, transport_fee, dress_code, class_timings, attendance_policy, discipline_policy)\n` +
      `SELECT c.id, ${j(ids)}, ${j(f.transport_routes ?? null)}, ${q(transportFee)}, ${q(clip(f.dress_code, 255))}, ${q(clip(f.class_timings, 255))}, ${q(clip(f.attendance_policy, 255))}, ${q(clean(f.discipline_policy))}\n` +
      `FROM campuses c WHERE c.university_id = @uni_id AND c.name = ${q(f.campus_name)}\n` +
      `ON DUPLICATE KEY UPDATE selected_ids=VALUES(selected_ids), transport_routes=VALUES(transport_routes), transport_fee=VALUES(transport_fee), dress_code=VALUES(dress_code), class_timings=VALUES(class_timings), attendance_policy=VALUES(attendance_policy), discipline_policy=VALUES(discipline_policy), updated_at=NOW();\n`
  );
}

// STEP 7 — campus_societies
P(`-- ── STEP 7: campus_societies (${req.campus_societies.length} rows) ────────────────────────`);
for (const s of req.campus_societies) {
  P(
    `INSERT INTO campus_societies (id, campus_id, name, category, description, initials)\n` +
      `SELECT UUID(), c.id, ${q(clip(s.name, 255))}, ${q(clip(s.category, 100))}, ${q(clean(s.description))}, ${q(clip(s.initials, 4))}\n` +
      `FROM campuses c WHERE c.university_id = @uni_id AND c.name = ${q(s.campus_name)}\n` +
      `  AND NOT EXISTS (SELECT 1 FROM campus_societies cs WHERE cs.campus_id = c.id AND cs.name = ${q(s.name)});\n`
  );
}

// STEP 8 — campus_hostels
P(`-- ── STEP 8: campus_hostels (${req.campus_hostels.length} row(s), status='live') ──────────────`);
for (const h of req.campus_hostels) {
  const s = spCampus[h.campus_name] || {};
  P(
    `INSERT INTO campus_hostels (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)\n` +
      `SELECT UUID(), c.id, ${q(clip(h.name, 255))}, ${q(clip(clean(h.vendor_name), 255))}, ${q(clip(h.hostel_type, 30) || "Campus Hostel")}, ${q(clip(h.gender, 20) || "Boys")}, ` +
      `${h.rooms === null || h.rooms === undefined ? "NULL" : num(Number(h.rooms))}, ${q(clip(h.rent_min, 50))}, ${q(clip(h.walk_dist, 50))}, ${q(clip(clean(h.contact), 100))}, ` +
      `${j(h.amenities ?? null)}, ${j(h.rooms_detail ?? null)}, 'live', 1\n` +
      `FROM campuses c WHERE c.university_id = @uni_id AND c.name = ${q(h.campus_name)}\n` +
      `  AND NOT EXISTS (SELECT 1 FROM campus_hostels h2 WHERE h2.campus_id = c.id AND h2.name = ${q(h.name)});\n`
  );
}
// hostel availability narrative that the file records per campus but has no dedicated column
for (const c of req.campuses) {
  const s = spCampus[c.name] || {};
  const note = clean(c.hostel_evidence) || clean(s.hostel_details);
  if (!note) continue;
  P(`UPDATE campuses SET description = CONCAT(COALESCE(description, ''), '\n\nHostels: ', ${q(note)}) WHERE university_id = @uni_id AND name = ${q(c.name)} AND description NOT LIKE '%Hostels:%';\n`);
}

// STEP 9 — campus_images
P(`-- ── STEP 9: campus_images (${req.campus_images.length} rows) ──────────────────────────────`);
for (const im of req.campus_images) {
  P(
    `INSERT INTO campus_images (id, campus_id, image_url, caption, category, featured)\n` +
      `SELECT UUID(), c.id, ${q(im.image_url)}, ${q(clip(im.caption, 255))}, ${q(clip(im.category, 100) || "Campus Building")}, ${bool(im.featured)}\n` +
      `FROM campuses c WHERE c.university_id = @uni_id AND c.name = ${q(im.campus_name)}\n` +
      `  AND NOT EXISTS (SELECT 1 FROM campus_images ci WHERE ci.campus_id = c.id AND ci.image_url = ${q(im.image_url)});\n`
  );
}

// STEP 10 — university_images
P(`-- ── STEP 10: university_images (${req.university_images.length} rows) ────────────────────────`);
for (const im of req.university_images) {
  P(
    `INSERT INTO university_images (id, university_id, image_url, caption)\n` +
      `SELECT UUID(), @uni_id, ${q(im.image_url)}, ${q(clip(im.caption, 255))}\nFROM dual\n` +
      `WHERE NOT EXISTS (SELECT 1 FROM university_images ui WHERE ui.university_id = @uni_id AND ui.image_url = ${q(im.image_url)});\n`
  );
}

// STEP 11 — collapse duplicate campus rows that share one campus-admin account
P(`-- ── STEP 11: drop empty twin campus rows ──────────────────────────────────
-- A campus admin account must own exactly one campus row. Registrations that
-- arrived with a typo'd / "… Campus" name (e.g. "Isalamabad Campus") produced a
-- second row for the same login, so getMyCampus (campusController.js:41 uses
-- LIMIT 1) sometimes opened the empty one and the public page listed the city
-- twice. Deletes only rows that (a) share campus_admin_uid with another row of
-- this university and (b) hold no programs / images / societies / hostels.
DELETE dup FROM campuses AS dup
JOIN campuses AS keep
  ON  keep.university_id     = @uni_id
  AND keep.id                <> dup.id
  AND keep.campus_admin_uid IS NOT NULL
  AND keep.campus_admin_uid  = dup.campus_admin_uid
WHERE dup.university_id = @uni_id
  AND NOT EXISTS (SELECT 1 FROM campus_programs cp WHERE cp.campus_id = dup.id)
  AND NOT EXISTS (SELECT 1 FROM campus_images     ci WHERE ci.campus_id = dup.id)
  AND NOT EXISTS (SELECT 1 FROM campus_societies  cs WHERE cs.campus_id = dup.id)
  AND NOT EXISTS (SELECT 1 FROM campus_hostels    h  WHERE h.campus_id  = dup.id);

-- ── STEP 12: program_catalog — intentionally NOT written here ────────────────
-- program_catalog has a single-column UNIQUE on normalized_name and is rebuilt
-- from scratch by the backend on every boot (config/schema.js → syncProgramCatalog),
-- which dedupes by "degree_type + name" across ALL universities and recomputes
-- university_count. Seeding it per-university collides (e.g. BS/MS "Artificial
-- Intelligence" normalize to the same key) and leaves stale counts.
-- Just restart the Node backend (or open any page after it boots) and the
-- catalog picks up the new FAST programs automatically.
`);

// VERIFY
P(`SET FOREIGN_KEY_CHECKS = 1;

-- ── VERIFY (expected: uni 1, profile 1, u_images ${req.university_images.length}, campuses ${req.campuses.length},
--    programs ${req.programs.length}, campus_programs ${req.campus_program_details.length},
--    facilities ${req.campus_facilities.length}, societies ${req.campus_societies.length},
--    hostels ${req.campus_hostels.length}, campus_images ${req.campus_images.length}) ─────────────
SELECT 'universities' AS tbl, COUNT(*) AS cnt FROM universities WHERE id = @uni_id
UNION ALL SELECT 'university_profiles', COUNT(*) FROM university_profiles WHERE university_id = @uni_id
UNION ALL SELECT 'university_images',   COUNT(*) FROM university_images   WHERE university_id = @uni_id
UNION ALL SELECT 'campuses',            COUNT(*) FROM campuses            WHERE university_id = @uni_id
UNION ALL SELECT 'programs',            COUNT(*) FROM programs            WHERE university_id = @uni_id
UNION ALL SELECT 'campus_programs',     COUNT(*) FROM campus_programs cp JOIN campuses c ON c.id = cp.campus_id WHERE c.university_id = @uni_id
UNION ALL SELECT 'campus_facilities',   COUNT(*) FROM campus_facilities cf JOIN campuses c ON c.id = cf.campus_id WHERE c.university_id = @uni_id
UNION ALL SELECT 'campus_societies',    COUNT(*) FROM campus_societies  cs JOIN campuses c ON c.id = cs.campus_id WHERE c.university_id = @uni_id
UNION ALL SELECT 'campus_hostels',      COUNT(*) FROM campus_hostels    h  JOIN campuses c ON c.id = h.campus_id  WHERE c.university_id = @uni_id
UNION ALL SELECT 'campus_images',       COUNT(*) FROM campus_images     ci JOIN campuses c ON c.id = ci.campus_id WHERE c.university_id = @uni_id;
`);

fs.writeFileSync(OUT, L.join("\n"), "utf8");
console.log(`wrote ${OUT}  (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
console.log(
  `rows: programs=${req.programs.length} campus_programs=${req.campus_program_details.length} campuses=${req.campuses.length} facilities=${req.campus_facilities.length} societies=${req.campus_societies.length} hostels=${req.campus_hostels.length} campus_images=${req.campus_images.length} university_images=${req.university_images.length} scholarships=${scholarships.length}`
);
console.log(`profile-only campus rows skipped (no contact/detail data): ${(sp.campuses || []).map((c) => c.campus_name).filter((n) => !CAMPUS_ID[n]).join(", ") || "none"}`);
