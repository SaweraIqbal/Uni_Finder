/**
 * studentProfileSchema.js
 * Additive, idempotent migrations for the student-profile feature (v2.0).
 * Safe to re-run on every boot — uses IF NOT EXISTS and information_schema guards.
 * Never drops or modifies existing columns; only adds new ones.
 */

const q = (db, sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

// ── Helper: add a column only when it is absent ──────────────────────────────
const addColumnIfMissing = async (db, table, column, definition) => {
  const rows = await q(
    db,
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  if (rows[0].c > 0) return;
  await q(db, `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`[studentProfileSchema] Added ${table}.${column}`);
};

// ── New tables ────────────────────────────────────────────────────────────────
const NEW_TABLES = [
  // academic records (repeatable per student)
  `CREATE TABLE IF NOT EXISTS student_academic_records (
    id                   VARCHAR(36)   NOT NULL PRIMARY KEY,
    user_uid             VARCHAR(255)  NOT NULL,
    level_type           VARCHAR(30)   NOT NULL,
    institution          VARCHAR(200)  NULL,
    board_university     VARCHAR(200)  NULL,
    degree_program       VARCHAR(200)  NULL,
    group_discipline     VARCHAR(100)  NULL,
    roll_reg_number      VARCHAR(100)  NULL,
    start_year           SMALLINT      NULL,
    end_year             SMALLINT      NULL,
    result_status        VARCHAR(30)   NOT NULL DEFAULT 'Completed',
    expected_completion  DATE          NULL,
    score_type           VARCHAR(10)   NOT NULL DEFAULT 'marks',
    marks_obtained       DECIMAL(8,2)  NULL,
    marks_total          DECIMAL(8,2)  NULL,
    cgpa                 DECIMAL(4,2)  NULL,
    cgpa_scale           DECIMAL(4,2)  NULL,
    division_grade       VARCHAR(30)   NULL,
    degree_duration      TINYINT       NULL,
    certificate_url      VARCHAR(500)  NULL,
    equivalence_url      VARCHAR(500)  NULL,
    is_olevel            TINYINT(1)    NOT NULL DEFAULT 0,
    thesis_title         VARCHAR(500)  NULL,
    supervisor           VARCHAR(200)  NULL,
    created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sar_user (user_uid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // entry test scores
  `CREATE TABLE IF NOT EXISTS student_test_scores (
    id             VARCHAR(36)   NOT NULL PRIMARY KEY,
    user_uid       VARCHAR(255)  NOT NULL,
    test_type      VARCHAR(60)   NOT NULL,
    test_name      VARCHAR(100)  NULL,
    score          DECIMAL(8,2)  NULL,
    percentile     DECIMAL(5,2)  NULL,
    test_date      DATE          NULL,
    expiry_date    DATE          NULL,
    scorecard_url  VARCHAR(500)  NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sts_user (user_uid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // research profile (1:1 per student)
  `CREATE TABLE IF NOT EXISTS student_research_profile (
    id                VARCHAR(36)   NOT NULL PRIMARY KEY,
    user_uid          VARCHAR(255)  NOT NULL UNIQUE,
    research_interests TEXT          NULL,
    sop_url           VARCHAR(500)  NULL,
    proposal_url      VARCHAR(500)  NULL,
    orcid             VARCHAR(50)   NULL,
    google_scholar    VARCHAR(500)  NULL,
    thesis_abstract   TEXT          NULL,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_srp_user FOREIGN KEY (user_uid)
      REFERENCES Student_signup(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // publications (repeatable, child of research profile)
  `CREATE TABLE IF NOT EXISTS student_publications (
    id              VARCHAR(36)   NOT NULL PRIMARY KEY,
    user_uid        VARCHAR(255)  NOT NULL,
    title           VARCHAR(500)  NOT NULL,
    journal_conf    VARCHAR(300)  NULL,
    pub_year        SMALLINT      NULL,
    doi_link        VARCHAR(500)  NULL,
    hec_category    VARCHAR(20)   NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_spub_user (user_uid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // references / referees
  `CREATE TABLE IF NOT EXISTS student_references (
    id             VARCHAR(36)   NOT NULL PRIMARY KEY,
    user_uid       VARCHAR(255)  NOT NULL,
    ref_name       VARCHAR(150)  NOT NULL,
    designation    VARCHAR(100)  NULL,
    institution    VARCHAR(200)  NULL,
    email          VARCHAR(254)  NULL,
    phone          VARCHAR(20)   NULL,
    relationship   VARCHAR(100)  NULL,
    known_duration VARCHAR(50)   NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sref_user (user_uid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // experience, awards, certifications, extracurriculars
  `CREATE TABLE IF NOT EXISTS student_experience (
    id             VARCHAR(36)   NOT NULL PRIMARY KEY,
    user_uid       VARCHAR(255)  NOT NULL,
    entry_type     VARCHAR(30)   NOT NULL,
    title          VARCHAR(255)  NOT NULL,
    organization   VARCHAR(255)  NULL,
    start_date     DATE          NULL,
    end_date       DATE          NULL,
    is_current     TINYINT(1)    NOT NULL DEFAULT 0,
    description    TEXT          NULL,
    document_url   VARCHAR(500)  NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sexp_user (user_uid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // admission preferences (1:1)
  `CREATE TABLE IF NOT EXISTS student_admission_preferences (
    id               VARCHAR(36)   NOT NULL PRIMARY KEY,
    user_uid         VARCHAR(255)  NOT NULL UNIQUE,
    preferred_programs TEXT         NULL,
    preferred_cities   TEXT         NULL,
    study_mode       VARCHAR(30)   NULL,
    hostel_needed    TINYINT(1)    NOT NULL DEFAULT 0,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sap_user FOREIGN KEY (user_uid)
      REFERENCES Student_signup(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
];

// ── New columns on existing Student_Profile ───────────────────────────────────
const PROFILE_COLUMNS = [
  ["target_level",          "VARCHAR(20)  NULL"],
  ["father_name",           "VARCHAR(100) NULL"],
  ["mobile",                "VARCHAR(20)  NULL"],
  ["nationality",           "VARCHAR(60)  NULL DEFAULT 'Pakistani'"],
  ["domicile_province",     "VARCHAR(60)  NULL"],
  ["domicile_district",     "VARCHAR(60)  NULL"],
  ["city",                  "VARCHAR(100) NULL"],
  ["religion",              "VARCHAR(50)  NULL"],
  ["blood_group",           "VARCHAR(10)  NULL"],
  ["disability_notes",      "TEXT         NULL"],
  ["guardian_contact",      "VARCHAR(20)  NULL"],
  ["cnic_doc_url",          "VARCHAR(500) NULL"],
  ["photo_url",             "VARCHAR(500) NULL"],
  ["profile_completeness",  "TINYINT UNSIGNED NOT NULL DEFAULT 0"],
  ["updated_at",            "DATETIME NULL ON UPDATE CURRENT_TIMESTAMP"],
];

// ── Main export ───────────────────────────────────────────────────────────────
export default async function initStudentProfileSchema(db) {
  // 1. Create new tables
  for (const sql of NEW_TABLES) {
    try {
      await q(db, sql);
    } catch (err) {
      console.error("[studentProfileSchema] Table create error:", err.message);
    }
  }

  // 2. Add missing columns to Student_Profile
  for (const [col, def] of PROFILE_COLUMNS) {
    try {
      await addColumnIfMissing(db, "Student_Profile", col, def);
    } catch (err) {
      console.error(`[studentProfileSchema] Student_Profile.${col}:`, err.message);
    }
  }

  console.log("[studentProfileSchema] Student profile schema v2.0 ready");
}
