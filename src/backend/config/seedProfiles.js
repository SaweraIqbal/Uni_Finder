/**
 * seedProfiles.js
 * Upserts real contact/admissions data into university_profiles for known universities.
 * Safe to re-run — uses INSERT … ON DUPLICATE KEY UPDATE.
 *
 * Run with:  node src/backend/config/seedProfiles.js
 */
import db, { dbReady } from "./db.js";

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

/** Real profile data keyed by normalized university name substring */
const PROFILES = [
  {
    match: "central punjab",
    website_url:      "https://www.ucp.edu.pk",
    admissions_email: "admissions@ucp.edu.pk",
    admissions_phone: "+92 (0)42 111-865-865",
    established_year: 2002,
    about_text:
      "The University of Central Punjab is a premier institution dedicated to academic excellence and holistic student development. We foster an environment of innovation, critical thinking, and ethical leadership, preparing our graduates to meet global challenges head-on.",
    mission_statement:
      "To provide quality education, fostering research, innovation, and ethical values, enabling students to become responsible global citizens and leaders in their respective fields.",
    active_students: 15000,
  },
  {
    match: "lahore",
    website_url:      "https://www.uol.edu.pk",
    admissions_email: "admissions@uol.edu.pk",
    admissions_phone: "+92 (0)42 99231302",
    established_year: 1882,
    about_text:
      "The University of the Punjab is the oldest and largest university in Pakistan, committed to providing a comprehensive and diverse educational environment.",
    mission_statement:
      "To advance knowledge through quality education, research and community engagement for the sustainable development of society.",
    active_students: 40000,
  },
  {
    match: "fast",
    website_url:      "https://www.nu.edu.pk",
    admissions_email: "admissions@nu.edu.pk",
    admissions_phone: "+92-21-111-128-128",
    established_year: 2000,
    about_text:
      "FAST-NUCES is a leading technology university offering world-class programs in computing, engineering, and management sciences.",
    mission_statement:
      "To produce graduates of the highest caliber who contribute to national and global development through innovation and technology.",
    active_students: 20000,
  },
  {
    match: "comsats",
    website_url:      "https://www.comsats.edu.pk",
    admissions_email: "admission@comsats.edu.pk",
    admissions_phone: "+92-51-9247000",
    established_year: 1998,
    about_text:
      "COMSATS University Islamabad is a federal charter university with campuses across Pakistan offering programs in sciences, engineering, IT, and management.",
    mission_statement:
      "To develop human capital through knowledge-based education and research in science, engineering, technology and management.",
    active_students: 35000,
  },
  {
    match: "nust",
    website_url:      "https://www.nust.edu.pk",
    admissions_email: "admission@nust.edu.pk",
    admissions_phone: "+92-51-90855000",
    established_year: 1991,
    about_text:
      "NUST is Pakistan's leading research university, consistently ranked among the top universities in Asia, specializing in science, engineering, and technology.",
    mission_statement:
      "To create, disseminate and apply knowledge through academic excellence, research and development for the benefit of Pakistan.",
    active_students: 12000,
  },
  {
    match: "aga khan",
    website_url:      "https://www.aku.edu",
    admissions_email: "admissions@aku.edu",
    admissions_phone: "+92-21-34930051",
    established_year: 1983,
    about_text:
      "The Aga Khan University is an international university with a focus on health sciences, education, and the development of East Africa and South Asia.",
    mission_statement:
      "To excel in teaching and research and to translate knowledge into solutions that are relevant to the communities we serve.",
    active_students: 4000,
  },
  {
    match: "lums",
    website_url:      "https://www.lums.edu.pk",
    admissions_email: "admissions@lums.edu.pk",
    admissions_phone: "+92-42-35608000",
    established_year: 1985,
    about_text:
      "LUMS is one of Pakistan's premier universities, renowned for its rigorous academic programs in business, law, humanities, social sciences, and computer science.",
    mission_statement:
      "To provide a world-class education that fosters critical thinking, creativity, and ethical leadership for a better society.",
    active_students: 5000,
  },
  {
    match: "iob|bahria",
    website_url:      "https://www.bahria.edu.pk",
    admissions_email: "admissions@bahria.edu.pk",
    admissions_phone: "+92-51-111-316-316",
    established_year: 2000,
    about_text:
      "Bahria University is a HEC-recognized federal charter university with campuses in Islamabad, Karachi, and Lahore.",
    mission_statement:
      "To impart quality education through dedicated faculty and modern facilities to produce professional graduates.",
    active_students: 18000,
  },
  {
    match: "superior",
    website_url:      "https://www.superior.edu.pk",
    admissions_email: "admissions@superior.edu.pk",
    admissions_phone: "+92-42-35761015-17",
    established_year: 2000,
    about_text:
      "Superior University Lahore is a leading private university known for its programs in management sciences, IT, engineering, and the arts.",
    mission_statement:
      "To nurture responsible leaders by providing quality education and a holistic learning environment.",
    active_students: 25000,
  },
  {
    match: "forman",
    website_url:      "https://www.fccollege.edu.pk",
    admissions_email: "admissions@fccollege.edu.pk",
    admissions_phone: "+92-42-111-327-653",
    established_year: 1864,
    about_text:
      "Forman Christian College is a historic institution known for liberal arts education and a commitment to developing character alongside intellect.",
    mission_statement:
      "To transform lives through a values-centered education that develops leaders of character, compassion, and competence.",
    active_students: 9000,
  },
];

async function seedProfiles() {
  await dbReady;
  console.log("Seeding university profiles (contact & admissions)…");

  let upserted = 0;
  let skipped  = 0;

  for (const profile of PROFILES) {
    // Find the university by partial name match
    const rows = await query(
      `SELECT id, name FROM universities
       WHERE LOWER(name) REGEXP ? LIMIT 1`,
      [profile.match]
    );

    if (!rows.length) {
      console.log(`  SKIP — no university matching "${profile.match}"`);
      skipped++;
      continue;
    }

    const { id, name } = rows[0];
    await query(
      `INSERT INTO university_profiles
         (university_id, website_url, admissions_email, admissions_phone,
          established_year, about_text, mission_statement, active_students)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         website_url      = VALUES(website_url),
         admissions_email = VALUES(admissions_email),
         admissions_phone = VALUES(admissions_phone),
         established_year = VALUES(established_year),
         about_text       = VALUES(about_text),
         mission_statement= VALUES(mission_statement),
         active_students  = VALUES(active_students),
         updated_at       = NOW()`,
      [
        id,
        profile.website_url,
        profile.admissions_email,
        profile.admissions_phone,
        profile.established_year,
        profile.about_text,
        profile.mission_statement,
        profile.active_students,
      ]
    );
    console.log(`  ✓  ${name} (id: ${id})`);
    upserted++;
  }

  console.log(`\nDone — ${upserted} upserted, ${skipped} skipped.`);
  process.exit(0);
}

seedProfiles().catch((err) => {
  console.error("seedProfiles failed:", err);
  process.exit(1);
});
