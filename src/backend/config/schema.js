// ─── Uni-Finder DB Schema ────────────────────────────────────────────────────
// Every CREATE TABLE uses IF NOT EXISTS — safe to re-run on every boot.
// Column additions use the ensureColumns() migration guard (also idempotent).
// DROP TABLE statements for dead campus tables run once via ensureDrops().
// ─────────────────────────────────────────────────────────────────────────────

const query = (db, sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// ── 1. Base CREATE TABLE statements ─────────────────────────────────────────

const tables = [
  // ① UNIVERSITIES — HEC master list + ownership (HEC columns written by sync only)
  `CREATE TABLE IF NOT EXISTS universities (
     id                VARCHAR(255) PRIMARY KEY,
     owner_uid         VARCHAR(255) NULL,
     name              VARCHAR(200) NOT NULL,
     normalized_name   VARCHAR(200) NULL,
     hec_rank          INT NULL,
     university_type   VARCHAR(30)  NULL,
     oric_domain       VARCHAR(150) NULL,
     focal_person_name VARCHAR(150) NULL,
     focal_person_email VARCHAR(254) NULL,
     campuses_text     TEXT         NULL,
     campus_count      INT          NOT NULL DEFAULT 0,
     last_synced_at    DATETIME     NULL,
     -- legacy profile columns kept for backward-compat with existing profile saves
     description       TEXT,
     website           VARCHAR(200),
     email             VARCHAR(254),
     phone             VARCHAR(50),
     city              VARCHAR(100),
     address           TEXT,
     established_year  VARCHAR(10),
     logo_url          VARCHAR(500),
     banner_url        VARCHAR(500),
     tagline           VARCHAR(255),
     hero_subtitle     VARCHAR(500),
     about_title       VARCHAR(255),
     about_text        TEXT,
     mission           TEXT,
     vision            TEXT,
     ranking           VARCHAR(20),
     ranking_label     VARCHAR(150),
     students          VARCHAR(50),
     employment_rate   VARCHAR(50),
     partner_countries VARCHAR(50),
     total_campuses    VARCHAR(50),
     domain            VARCHAR(100),
     campuses          TEXT,
     is_hec_listed     TINYINT(1)  NOT NULL DEFAULT 1,
     created_at        DATETIME    DEFAULT CURRENT_TIMESTAMP,
     updated_at        DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     UNIQUE KEY uq_uni_normalized (normalized_name(191))
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // ② UNIVERSITY_PROFILES — admin-editable 1:1 profile
  `CREATE TABLE IF NOT EXISTS university_profiles (
     university_id    VARCHAR(255) PRIMARY KEY,
     established_year INT         NULL,
     about_text       TEXT,
     mission_statement TEXT,
     logo_path        VARCHAR(500),
     banner_path      VARCHAR(500),
     active_students  INT         NOT NULL DEFAULT 0,
     website_url      VARCHAR(500) NULL,
     admissions_email VARCHAR(254) NULL,
     admissions_phone VARCHAR(50)  NULL,
     updated_at       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // ③ PROGRAMS — seeded from Excel; admin-managed; program requests by university admins
  `CREATE TABLE IF NOT EXISTS programs (
     id              VARCHAR(255) PRIMARY KEY,
     university_id   VARCHAR(255) NOT NULL,
     name            VARCHAR(255) NOT NULL,
     degree_type     VARCHAR(30)  NOT NULL DEFAULT '',
     level           ENUM('Undergraduate','MS','MPhil','PhD','ADP','Diploma') NULL,
     specialization  VARCHAR(255) NULL,
     track           VARCHAR(100) NULL,
     extra           JSON         NULL,
     original_name   VARCHAR(500) NOT NULL DEFAULT '',
     status          ENUM('approved','pending','rejected') NOT NULL DEFAULT 'approved',
     created_via     VARCHAR(30)  NOT NULL DEFAULT 'seed',
     submitted_by    VARCHAR(255) NULL,
     rejection_reason TEXT        NULL,
     reviewed_by     VARCHAR(255) NULL,
     reviewed_at     DATETIME     NULL,
     spec_key        VARCHAR(255) GENERATED ALWAYS AS (COALESCE(specialization, '')) STORED,
     track_key       VARCHAR(100) GENERATED ALWAYS AS (COALESCE(track, ''))          STORED,
     created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     UNIQUE KEY uq_prog_v2 (university_id, name(140), level, spec_key(100), track_key(50)),
     INDEX idx_prog_uni_level  (university_id, level),
     INDEX idx_prog_uni_status (university_id, status)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // ④ ACTIVITY_LOG — real events only, never seeded
  `CREATE TABLE IF NOT EXISTS activity_log (
     id            VARCHAR(255) PRIMARY KEY,
     university_id VARCHAR(255) NOT NULL,
     actor_user_id VARCHAR(255) NULL,
     actor_name    VARCHAR(150) NOT NULL,
     action        VARCHAR(60)  NOT NULL,
     entity_type   VARCHAR(50)  NULL,
     entity_id     VARCHAR(255) NULL,
     description   TEXT         NOT NULL,
     created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_al_uni_time (university_id, created_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // ⑤ PROGRAM_CATALOG — deduped cross-university catalog for student search
  `CREATE TABLE IF NOT EXISTS program_catalog (
     id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     name             VARCHAR(255) NOT NULL,
     normalized_name  VARCHAR(255) NOT NULL,
     level            ENUM('Undergraduate','MS','MPhil','PhD','ADP','Diploma') NULL,
     university_count INT UNSIGNED NOT NULL DEFAULT 1,
     updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     UNIQUE KEY uq_catalog_name (normalized_name(191)),
     INDEX idx_catalog_name (normalized_name(191))
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // ⑥ UNIVERSITY_VERIFICATION — legacy mirror (kept for email-confirm flow)
  `CREATE TABLE IF NOT EXISTS university_verification (
     id                       VARCHAR(255) PRIMARY KEY,
     user_uid                 VARCHAR(255) NOT NULL,
     university_name          VARCHAR(200),
     university_id            VARCHAR(255),
     full_name                VARCHAR(150),
     designation              VARCHAR(100),
     designation_other        VARCHAR(60),
     official_email           VARCHAR(254),
     email_domain_verified    TINYINT(1) DEFAULT 0,
     phone                    VARCHAR(50),
     registration_no          VARCHAR(100),
     address                  TEXT,
     contact_no               VARCHAR(50),
     hec_certificate_url      VARCHAR(500),
     charter_certificate_url  VARCHAR(500),
     accreditation_document_url VARCHAR(500),
     university_logo_url      VARCHAR(500),
     authorization_letter_url VARCHAR(500),
     loe_path                 VARCHAR(1000),
     domain_state             VARCHAR(20),
     focal_email_match        TINYINT(1) DEFAULT 0,
     focal_name_match         TINYINT(1) DEFAULT 0,
     reference_no             VARCHAR(16),
     application_id           VARCHAR(255),
     status                   VARCHAR(30) NOT NULL DEFAULT 'pending',
     reject_reason            TEXT,
     reviewed_by              VARCHAR(255),
     reviewed_at              DATETIME,
     verification_id          VARCHAR(255),
     created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // ⑦ APPLICATIONS — primary verification table
  `CREATE TABLE IF NOT EXISTS applications (
     id                         VARCHAR(255) PRIMARY KEY,
     reference_no               VARCHAR(16) NOT NULL UNIQUE,
     user_uid                   VARCHAR(255) NOT NULL,
     university_id              VARCHAR(255) NOT NULL,
     full_name                  VARCHAR(70) NOT NULL,
     designation                VARCHAR(80) NOT NULL,
     designation_other          VARCHAR(60),
     email                      VARCHAR(254) NOT NULL,
     phone                      VARCHAR(16) NOT NULL,
     loe_path                   VARCHAR(1000),
     domain_state               VARCHAR(20) NOT NULL DEFAULT 'unknown',
     focal_email_match          TINYINT(1) NOT NULL DEFAULT 0,
     focal_name_match           TINYINT(1) NOT NULL DEFAULT 0,
     status                     VARCHAR(20) NOT NULL DEFAULT 'awaiting',
     reject_reason              TEXT,
     reviewed_by                VARCHAR(255),
     reviewed_at                DATETIME,
     email_verified_at          DATETIME,
     verification_token_hash    CHAR(64),
     verification_token_expires DATETIME,
     invite_token_hash          CHAR(64),
     invite_token_expires       DATETIME,
     ip_address                 VARCHAR(45),
     created_at                 DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at                 DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     KEY idx_app_user       (user_uid),
     KEY idx_app_university (university_id),
     KEY idx_app_status     (status),
     KEY idx_app_rate       (email, ip_address, created_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // ⑧ UNIVERSITY_IMAGES — gallery photos
  `CREATE TABLE IF NOT EXISTS university_images (
     id            VARCHAR(255) PRIMARY KEY,
     university_id VARCHAR(255) NOT NULL,
     image_url     VARCHAR(500) NOT NULL,
     caption       VARCHAR(255),
     created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // ⑨ IMPORT BOOKKEEPING
  `CREATE TABLE IF NOT EXISTS university_master_imports (
     source_file VARCHAR(255) PRIMARY KEY,
     imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
];

// ── 2. Column migrations (ADD IF MISSING) ────────────────────────────────────
// Pairs of [table, column, definition].
// The guard in ensureColumns() checks information_schema before ALTER.

const columnMigrations = [
  // Student_signup
  ["Student_signup", "avatar_url",   "VARCHAR(500)"],
  ["Student_signup", "assigned_id",  "VARCHAR(30)"],
  // universities — new HEC-sync columns
  ["universities", "normalized_name",   "VARCHAR(200) NULL"],
  ["universities", "hec_rank",          "INT NULL"],
  ["universities", "campus_count",      "INT NOT NULL DEFAULT 0"],
  ["universities", "campuses_text",     "TEXT NULL"],
  ["universities", "last_synced_at",    "DATETIME NULL"],
  // universities — legacy profile columns (kept for backward-compat)
  ["universities", "tagline",           "VARCHAR(255)"],
  ["universities", "hero_subtitle",     "VARCHAR(500)"],
  ["universities", "banner_url",        "VARCHAR(500)"],
  ["universities", "about_title",       "VARCHAR(255)"],
  ["universities", "about_text",        "TEXT"],
  ["universities", "mission",           "TEXT"],
  ["universities", "vision",            "TEXT"],
  ["universities", "ranking",           "VARCHAR(20)"],
  ["universities", "ranking_label",     "VARCHAR(150)"],
  ["universities", "students",          "VARCHAR(50)"],
  ["universities", "employment_rate",   "VARCHAR(50)"],
  ["universities", "partner_countries", "VARCHAR(50)"],
  ["universities", "total_campuses",    "VARCHAR(50)"],
  ["universities", "domain",            "VARCHAR(100)"],
  ["universities", "hec_rank",          "VARCHAR(20)"],   // kept as varchar for old rows
  ["universities", "campuses",          "TEXT"],
  ["universities", "oric_domain",       "VARCHAR(150)"],
  ["universities", "focal_person_name", "VARCHAR(150)"],
  ["universities", "focal_person_email","VARCHAR(254)"],
  ["universities", "university_type",   "VARCHAR(30)"],
  ["universities", "is_hec_listed",     "TINYINT(1) NOT NULL DEFAULT 0"],
  // university_verification
  ["university_verification", "full_name",                "VARCHAR(150)"],
  ["university_verification", "designation",              "VARCHAR(100)"],
  ["university_verification", "university_id",            "VARCHAR(255)"],
  ["university_verification", "official_email",           "VARCHAR(254)"],
  ["university_verification", "email_domain_verified",    "TINYINT(1) DEFAULT 0"],
  ["university_verification", "phone",                    "VARCHAR(50)"],
  ["university_verification", "authorization_letter_url", "VARCHAR(500)"],
  ["university_verification", "designation_other",        "VARCHAR(60)"],
  ["university_verification", "domain_state",             "VARCHAR(20)"],
  ["university_verification", "focal_email_match",        "TINYINT(1) DEFAULT 0"],
  ["university_verification", "focal_name_match",         "TINYINT(1) DEFAULT 0"],
  ["university_verification", "reference_no",             "VARCHAR(16)"],
  ["university_verification", "application_id",           "VARCHAR(255)"],
  ["university_verification", "loe_path",                 "VARCHAR(1000)"],
  // applications — columns that may be missing on existing installs
  ["applications", "reject_reason",   "TEXT"],
  ["applications", "reviewed_by",     "VARCHAR(255)"],
  ["applications", "reviewed_at",     "DATETIME"],
  ["applications", "domain_state",    "VARCHAR(20) NOT NULL DEFAULT 'unknown'"],
  ["applications", "focal_email_match","TINYINT(1) NOT NULL DEFAULT 0"],
  ["applications", "focal_name_match", "TINYINT(1) NOT NULL DEFAULT 0"],
  ["applications", "loe_path",         "VARCHAR(1000)"],
  ["applications", "designation_other","VARCHAR(60)"],
  ["applications", "ip_address",       "VARCHAR(45)"],
  // programs — new columns on existing old-schema table
  ["programs", "degree_type",      "VARCHAR(30) NOT NULL DEFAULT ''"],
  ["programs", "specialization",   "VARCHAR(255) NULL"],
  ["programs", "track",            "VARCHAR(100) NULL"],
  ["programs", "original_name",    "VARCHAR(500) NOT NULL DEFAULT ''"],
  ["programs", "status",           "ENUM('approved','pending','rejected') NOT NULL DEFAULT 'approved'"],
  ["programs", "extra",            "JSON NULL"],
  ["programs", "created_via",      "VARCHAR(30) NOT NULL DEFAULT 'seed'"],
  ["programs", "submitted_by",     "VARCHAR(255) NULL"],
  ["programs", "rejection_reason", "TEXT NULL"],
  ["programs", "reviewed_by",      "VARCHAR(255) NULL"],
  ["programs", "reviewed_at",      "DATETIME NULL"],
  // activity_log — change action from ENUM to VARCHAR(60) for extensibility
  ["activity_log", "action", "VARCHAR(60) NOT NULL DEFAULT ''"],
  // university_profiles — contact & web presence fields
  ["university_profiles", "website_url",      "VARCHAR(500) NULL"],
  ["university_profiles", "admissions_email", "VARCHAR(254) NULL"],
  ["university_profiles", "admissions_phone", "VARCHAR(50)  NULL"],
];

// ── 3. ensureColumns ─────────────────────────────────────────────────────────

const ensureLongEmailColumns = (db, done) => {
  const cols = [
    ["Student_signup",          "email"],
    ["Student_signup",          "username"],
    ["university_verification", "official_email"],
  ];
  let idx = 0;
  const next = () => {
    if (idx >= cols.length) return done();
    const [tbl, col] = cols[idx++];
    db.query(
      `SELECT character_maximum_length AS max_len
       FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [tbl, col],
      (err, rows) => {
        if (err || !rows.length || Number(rows[0].max_len) >= 254) return next();
        db.query(`ALTER TABLE ${tbl} MODIFY COLUMN ${col} VARCHAR(254)`, () => next());
      },
    );
  };
  next();
};

// Migrate programs table unique key from v1 (uq_prog) → v2 (uq_prog_v2).
// Also adds generated columns spec_key and track_key if not present.
const ensureProgramsNewColumns = (db, done) => {
  // Step 1: add spec_key generated column if missing
  db.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE table_schema = DATABASE() AND table_name = 'programs' AND column_name = 'spec_key'`,
    (err, rows) => {
      const addSpecKey = (cb) => {
        if (err || (rows && rows[0].c > 0)) return cb();
        db.query(
          `ALTER TABLE programs
           ADD COLUMN spec_key VARCHAR(255) GENERATED ALWAYS AS (COALESCE(specialization,'')) STORED`,
          (e2) => { if (e2) console.log("spec_key add:", e2.message); cb(); },
        );
      };
      addSpecKey(() => {
        // Step 2: add track_key generated column if missing
        db.query(
          `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
           WHERE table_schema = DATABASE() AND table_name = 'programs' AND column_name = 'track_key'`,
          (e2, r2) => {
            const addTrackKey = (cb2) => {
              if (e2 || (r2 && r2[0].c > 0)) return cb2();
              db.query(
                `ALTER TABLE programs
                 ADD COLUMN track_key VARCHAR(100) GENERATED ALWAYS AS (COALESCE(track,'')) STORED`,
                (e3) => { if (e3) console.log("track_key add:", e3.message); cb2(); },
              );
            };
            addTrackKey(() => {
              // Step 3: drop old uq_prog key if it exists
              db.query(
                `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
                 WHERE table_schema = DATABASE() AND table_name = 'programs' AND index_name = 'uq_prog'`,
                (e3, r3) => {
                  const dropOld = (cb3) => {
                    if (e3 || !r3 || r3[0].c === 0) return cb3();
                    db.query(`ALTER TABLE programs DROP KEY uq_prog`, (e4) => {
                      if (e4) console.log("DROP uq_prog:", e4.message);
                      cb3();
                    });
                  };
                  dropOld(() => {
                    // Step 4: add uq_prog_v2 if missing
                    db.query(
                      `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
                       WHERE table_schema = DATABASE() AND table_name = 'programs' AND index_name = 'uq_prog_v2'`,
                      (e4, r4) => {
                        if (e4 || (r4 && r4[0].c > 0)) return done();
                        db.query(
                          `ALTER TABLE programs
                           ADD UNIQUE KEY uq_prog_v2 (university_id, name(140), level, spec_key(100), track_key(50))`,
                          (e5) => {
                            if (e5) console.log("uq_prog_v2 add:", e5.message);
                            else console.log("Programs unique key migrated to v2");
                            done();
                          },
                        );
                      },
                    );
                  });
                },
              );
            });
          },
        );
      });
    },
  );
};

// Ensure universities.owner_uid UNIQUE constraint
const ensureOwnerUnique = (db, done) => {
  db.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE table_schema = DATABASE()
       AND table_name = 'universities'
       AND index_name = 'uq_owner'`,
    (err, rows) => {
      if (err || (rows && rows[0].c > 0)) return done();
      db.query(
        `ALTER TABLE universities ADD UNIQUE KEY uq_owner (owner_uid)`,
        (e2) => {
          if (e2) console.log("owner_uid unique constraint:", e2.message);
          done();
        },
      );
    },
  );
};

// Ensure normalized_name UNIQUE on universities
const ensureNormalizedUnique = (db, done) => {
  db.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE table_schema = DATABASE()
       AND table_name = 'universities'
       AND index_name = 'uq_uni_normalized'`,
    (err, rows) => {
      if (err || (rows && rows[0].c > 0)) return done();
      db.query(
        `ALTER TABLE universities ADD UNIQUE KEY uq_uni_normalized (normalized_name(191))`,
        (e2) => {
          if (e2) console.log("normalized_name unique:", e2.message);
          done();
        },
      );
    },
  );
};

const ensureColumns = (db, done) => {
  let i = 0;
  const runNext = () => {
    if (i >= columnMigrations.length) {
      return ensureLongEmailColumns(db, () =>
        ensureProgramsNewColumns(db, () =>
          ensureOwnerUnique(db, () =>
            ensureNormalizedUnique(db, () => {
              console.log("Schema columns and indexes ready");
              if (done) done();
            }),
          ),
        ),
      );
    }
    const [tbl, col, def] = columnMigrations[i++];
    db.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [tbl, col],
      (err, rows) => {
        if (err) { console.log(`Column check error ${tbl}.${col}:`, err.message); return runNext(); }
        if (rows[0].c > 0) return runNext();
        db.query(`ALTER TABLE ${tbl} ADD COLUMN ${col} ${def}`, (e2) => {
          if (e2) console.log(`Migration ${tbl}.${col}:`, e2.message);
          runNext();
        });
      },
    );
  };
  runNext();
};

// ── 4. Campus table creation (Phase 2 tables — created during initSchema) ────
// These were previously dropped as "deferred". They are now active.
// campus_verification is legacy — still used by the old campusRoutes.js flow.
// campus_societies, campus_facilities, campus_hostels are new.

const ensureCampusTables = async (db) => {
  const campusTables = [
    // campuses — base table (may not exist on fresh installs that skipped the SQL dump)
    `CREATE TABLE IF NOT EXISTS campuses (
       id                VARCHAR(255) NOT NULL PRIMARY KEY,
       university_id     VARCHAR(255) NOT NULL,
       campus_admin_uid  VARCHAR(255) NULL,
       verification_id   VARCHAR(255) NULL,
       name              VARCHAR(200) NOT NULL,
       campus_type       VARCHAR(50)  NULL,
       city              VARCHAR(100) NULL,
       province          VARCHAR(100) NULL,
       address           TEXT         NULL,
       description       TEXT         NULL,
      why_choose        TEXT         NULL,
       phone             VARCHAR(50)  NULL,
       whatsapp          VARCHAR(50)  NULL,
       email             VARCHAR(150) NULL,
       office_hours      VARCHAR(150) NULL,
       shift_morning     TINYINT(1)   NOT NULL DEFAULT 1,
       shift_evening     TINYINT(1)   NOT NULL DEFAULT 0,
       shift_weekend     TINYINT(1)   NOT NULL DEFAULT 0,
       gender_policy     VARCHAR(50)  NULL,
       lat               DECIMAL(10,8) NULL,
       lng               DECIMAL(11,8) NULL,
       hostel_available  TINYINT(1)   NOT NULL DEFAULT 1,
       is_main           TINYINT(1)   NOT NULL DEFAULT 0,
       admission_open    DATE         NULL,
       admission_close   DATE         NULL,
       intake_name       VARCHAR(100) NULL,
       classes_start     DATE         NULL,
       class_arrangement VARCHAR(80)  NULL,
       admission_status_override VARCHAR(20) NULL,
       students          VARCHAR(50)  NULL,
       status            VARCHAR(20)  NOT NULL DEFAULT 'active',
       cover_image       VARCHAR(500) NULL,
       created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_campus_uni (university_id),
       INDEX idx_campus_uid (campus_admin_uid)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

    // campus_societies
    `CREATE TABLE IF NOT EXISTS campus_societies (
       id          VARCHAR(255) NOT NULL PRIMARY KEY,
       campus_id   VARCHAR(255) NOT NULL,
       name        VARCHAR(255) NOT NULL,
       category    VARCHAR(100) NULL,
       description TEXT         NULL,
       initials    VARCHAR(4)   NULL,
       created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_cs_campus (campus_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

    // campus_facilities
    `CREATE TABLE IF NOT EXISTS campus_facilities (
       campus_id          VARCHAR(255) NOT NULL PRIMARY KEY,
       selected_ids       TEXT         NULL,
       transport_routes   JSON         NULL,
       transport_fee      VARCHAR(50)  NULL,
       dress_code         VARCHAR(255) NULL,
       class_timings      VARCHAR(255) NULL,
       attendance_policy  VARCHAR(255) NULL,
       discipline_policy  TEXT         NULL,
       updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

    // campus_hostels
    `CREATE TABLE IF NOT EXISTS campus_hostels (
       id           VARCHAR(255)  NOT NULL PRIMARY KEY,
       campus_id    VARCHAR(255)  NOT NULL,
       name         VARCHAR(255)  NOT NULL,
       vendor_name  VARCHAR(255)  NULL,
       hostel_type  VARCHAR(30)   NOT NULL DEFAULT 'Campus Hostel',
       gender       VARCHAR(20)   NOT NULL DEFAULT 'Boys',
       rooms        INT           NULL,
       rent_min     VARCHAR(50)   NULL,
       walk_dist    VARCHAR(50)   NULL,
       status       VARCHAR(30)   NOT NULL DEFAULT 'pending',
       amenities    JSON          NULL,
       rooms_detail JSON          NULL,
       contact      VARCHAR(100)  NULL,
       rejection_reason TEXT      NULL,
       hostel_available TINYINT(1) NOT NULL DEFAULT 1,
       created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_ch_campus (campus_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

    // campus_program_requests  (campus admin → university admin flow)
    `CREATE TABLE IF NOT EXISTS campus_program_requests (
       id              VARCHAR(255) NOT NULL PRIMARY KEY,
       campus_id       VARCHAR(255) NOT NULL,
       university_id   VARCHAR(255) NOT NULL,
       program_name    VARCHAR(255) NOT NULL,
       level           VARCHAR(50)  NOT NULL,
       justification   TEXT         NULL,
       status          VARCHAR(30)  NOT NULL DEFAULT 'pending',
       rejection_note  TEXT         NULL,
       reviewed_by     VARCHAR(255) NULL,
       reviewed_at     DATETIME     NULL,
       submitted_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_cpr_campus  (campus_id),
       INDEX idx_cpr_uni     (university_id),
       INDEX idx_cpr_status  (status)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

    // campus_programs (campus admin links university programs to their campus)
    `CREATE TABLE IF NOT EXISTS campus_programs (
       id          VARCHAR(255) NOT NULL PRIMARY KEY,
       campus_id   VARCHAR(255) NOT NULL,
       program_id  VARCHAR(255) NOT NULL,
       fee         VARCHAR(100) NULL,
       duration    VARCHAR(100) NULL,
       details     JSON         NULL,
       status      VARCHAR(20)  NOT NULL DEFAULT 'draft',
       shifts      VARCHAR(100) NULL,
       created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       UNIQUE KEY uq_cp (campus_id, program_id),
       INDEX idx_cp_campus  (campus_id),
       INDEX idx_cp_program (program_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

    // campus_images
    `CREATE TABLE IF NOT EXISTS campus_images (
       id          VARCHAR(255) NOT NULL PRIMARY KEY,
       campus_id   VARCHAR(255) NOT NULL,
       image_url   VARCHAR(500) NOT NULL,
       caption     VARCHAR(255) NULL,
       category    VARCHAR(100) NULL DEFAULT 'Campus Building',
       featured    TINYINT(1)   NOT NULL DEFAULT 0,
       created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
       INDEX idx_ci_campus (campus_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  ];

  for (const sql of campusTables) {
    try {
      await query(db, sql);
    } catch (e) {
      console.log("Campus table create:", e.message);
    }
  }

  // Add details/status/shifts to campus_programs if missing (idempotent guard)
  // These are already in the CREATE TABLE above, so this only runs on existing installs
  const cpCols = [
    ["details", "JSON NULL"],
    ["status",  "VARCHAR(20) NOT NULL DEFAULT 'draft'"],
    ["shifts",  "VARCHAR(100) NULL"],
  ];
  for (const [col, def] of cpCols) {
    try {
      const rows = await query(
        db,
        `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE table_schema = DATABASE()
           AND table_name = 'campus_programs'
           AND column_name = ?`,
        [col]
      );
      if (rows[0].c === 0) {
        await query(db, `ALTER TABLE campus_programs ADD COLUMN \`${col}\` ${def}`);
        console.log(`Added campus_programs.${col}`);
      }
    } catch (e) {
      console.log(`campus_programs.${col}:`, e.message);
    }
  }

  // Fix program_catalog unique key: change from (normalized_name, level) → (normalized_name)
  // so deduplication works on display name alone (ignoring level).
  try {
    const keyRows = await query(
      db,
      `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
       WHERE table_schema = DATABASE()
         AND table_name   = 'program_catalog'
         AND index_name   = 'uq_catalog_name'`
    );
    if (keyRows[0].c === 0) {
      // Drop old composite key and add new single-column key
      await query(db, `ALTER TABLE program_catalog DROP KEY uq_catalog`).catch(() => {});
      await query(db, `ALTER TABLE program_catalog ADD UNIQUE KEY uq_catalog_name (normalized_name(191))`);
      console.log("program_catalog unique key updated to normalized_name only.");
    }
  } catch (e) {
    console.log("program_catalog key migration:", e.message);
  }
  try {
    const cols = await query(
      db,
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE()
         AND table_name = 'campuses'
         AND column_name = 'hostel_available'`
    );
    if (cols[0].c === 0) {
      await query(db, `ALTER TABLE campuses ADD COLUMN hostel_available TINYINT(1) NOT NULL DEFAULT 1`);
    }
  } catch (e) {
    console.log("campuses.hostel_available:", e.message);
  }

  // ALTER guards for campus columns that older dumps may be missing
  const campusColGuards = [
    ["campus_type",    "VARCHAR(50)  NULL"],
    ["province",       "VARCHAR(100) NULL"],
    ["description",    "TEXT         NULL"],
    ["why_choose",     "TEXT         NULL"],
    ["whatsapp",       "VARCHAR(50)  NULL"],
    ["office_hours",   "VARCHAR(150) NULL"],
    ["shift_morning",  "TINYINT(1)   NOT NULL DEFAULT 1"],
    ["shift_evening",  "TINYINT(1)   NOT NULL DEFAULT 0"],
    ["shift_weekend",  "TINYINT(1)   NOT NULL DEFAULT 0"],
    ["gender_policy",  "VARCHAR(50)  NULL"],
    ["lat",            "DECIMAL(10,8) NULL"],
    ["lng",            "DECIMAL(11,8) NULL"],
    ["is_main",        "TINYINT(1)   NOT NULL DEFAULT 0"],
    ["admission_open",     "DATE         NULL"],
    ["admission_close",    "DATE         NULL"],
    ["intake_name",               "VARCHAR(100) NULL"],
    ["classes_start",             "DATE         NULL"],
    ["class_arrangement",         "VARCHAR(80)  NULL"],
    ["admission_status_override", "VARCHAR(20)  NULL"],
    ["students",       "VARCHAR(50)  NULL"],
    ["cover_image",    "VARCHAR(500) NULL"],
    ["required_documents", "JSON NULL"],
    ["scholarships",       "JSON NULL"],
    ["quota_policy",       "TEXT NULL"],
    ["announcements",      "JSON NULL"],
  ];
  for (const [col, def] of campusColGuards) {
    try {
      const rows = await query(
        db,
        `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE table_schema = DATABASE() AND table_name = 'campuses' AND column_name = ?`,
        [col]
      );
      if (rows[0].c === 0) {
        await query(db, `ALTER TABLE campuses ADD COLUMN \`${col}\` ${def}`);
        console.log(`Added campuses.${col}`);
      }
    } catch (e) {
      console.log(`campuses.${col}:`, e.message);
    }
  }
};

// ── 5. Ensure university_profiles row exists for every owned university ───────

const ensureProfileRows = async (db) => {
  try {
    await query(
      db,
      `INSERT IGNORE INTO university_profiles (university_id)
       SELECT id FROM universities WHERE owner_uid IS NOT NULL`,
    );
  } catch (e) {
    console.log("ensureProfileRows:", e.message);
  }
};

// ── 5b. Sync program_catalog from approved programs ───────────────────────────
// Builds display names as "degree_type + name" (e.g. "BS Computer Science"),
// deduplicates purely on the display name (ignoring level) so each distinct
// human-readable program name appears exactly once.

const syncProgramCatalog = async (db) => {
  try {
    // Step 1 — clear stale catalog entries that came from old syncs
    // (We rebuild from scratch each time so display names stay correct)
    await query(db, `DELETE FROM program_catalog WHERE 1=1`);

    // Step 2 — insert deduplicated display names from approved programs
    // TRIM handles cases where degree_type is empty/null
    await query(
      db,
      `INSERT INTO program_catalog (name, normalized_name, level, university_count)
       SELECT
         display_name,
         LOWER(TRIM(display_name)) AS normalized_name,
         MIN(level)                AS level,
         COUNT(DISTINCT university_id) AS university_count
       FROM (
         SELECT
           university_id,
           level,
           TRIM(
             CONCAT_WS(' ',
               NULLIF(TRIM(degree_type), ''),
               NULLIF(TRIM(name), '')
             )
           ) AS display_name
         FROM programs
         WHERE status = 'approved'
           AND name IS NOT NULL
           AND TRIM(name) != ''
       ) AS combined
       WHERE display_name IS NOT NULL AND TRIM(display_name) != ''
       GROUP BY display_name
       ON DUPLICATE KEY UPDATE
         university_count = VALUES(university_count),
         updated_at       = NOW()`,
    );
    console.log("program_catalog synced with display names.");
  } catch (e) {
    console.log("syncProgramCatalog:", e.message);
  }
};

// ── 6. initSchema (called from server.js) ────────────────────────────────────

export const initSchema = (db, done) => {
  // First ensure critical columns exist on applications table so approvals
  // work even if the server was already running when schema.js was updated.
  const criticalCols = [
    // applications — may be missing on older installs
    ["applications", "reviewed_by",      "VARCHAR(255)"],
    ["applications", "reviewed_at",      "DATETIME"],
    ["applications", "reject_reason",    "TEXT"],
    ["applications", "loe_path",         "VARCHAR(1000)"],
    // programs — Phase 2 new columns (must exist before any admin query)
    ["programs",     "extra",            "JSON NULL"],
    ["programs",     "created_via",      "VARCHAR(30) NOT NULL DEFAULT 'seed'"],
    ["programs",     "submitted_by",     "VARCHAR(255) NULL"],
    ["programs",     "rejection_reason", "TEXT NULL"],
    ["programs",     "reviewed_by",      "VARCHAR(255) NULL"],
    ["programs",     "reviewed_at",      "DATETIME NULL"],
    ["universities", "province",         "VARCHAR(100) NULL"],
    ["universities", "status",           "VARCHAR(50) NOT NULL DEFAULT 'pending'"],
    // campus_registrations — two-tier approval columns
    ["campus_registrations", "uni_tier1_approved",    "TINYINT(1) NOT NULL DEFAULT 0"],
    ["campus_registrations", "uni_tier1_approved_at", "DATETIME NULL"],
    ["campus_registrations", "uni_tier1_approved_by", "VARCHAR(255) NULL"],
  ];
  let ci = 0;
  const addCritical = () => {
    if (ci >= criticalCols.length) {
      // All critical columns added — now run ensureColumns for remaining migrations
      return ensureColumns(db, async () => {
        await ensureCampusTables(db);
        await ensureProfileRows(db);
        await syncProgramCatalog(db);
        if (done) done();
      });
    }
    const [tbl, col, def] = criticalCols[ci++];
    db.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [tbl, col],
      (err, rows) => {
        if (err || (rows && rows[0].c > 0)) return addCritical();
        db.query(`ALTER TABLE \`${tbl}\` ADD COLUMN \`${col}\` ${def}`, (e2) => {
          if (e2) console.log(`Critical col ${tbl}.${col}:`, e2.message);
          else console.log(`Added column ${tbl}.${col}`);
          addCritical();
        });
      },
    );
  };

  // Fix collation mismatch — convert Phase-1 tables to utf8mb4_general_ci
  // so JOINs with XAMPP-default tables (Student_signup, universities) work.
  // Tables with FK constraints need the constraint dropped first, then re-added.
  const fixCollations = () => {
    // First: alter activity_log.action from ENUM to VARCHAR(60) if needed
    db.query(
      `SELECT DATA_TYPE FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE() AND table_name = 'activity_log' AND column_name = 'action'`,
      (err, rows) => {
        const alterAction = (cb) => {
          if (err || !rows.length) return cb();
          const dtype = (rows[0].DATA_TYPE || "").toLowerCase();
          if (dtype === "varchar") return cb();
          db.query(
            `ALTER TABLE activity_log MODIFY COLUMN action VARCHAR(60) NOT NULL DEFAULT ''`,
            (e2) => { if (e2) console.log("activity_log.action alter:", e2.message); cb(); },
          );
        };
        alterAction(() => {
          // Only fix applications and activity_log — they have no FKs in our schema.
          // university_profiles and programs have FKs pointing to universities;
          // instead of dropping/recreating FKs we just use COLLATE casts in queries.
          const toFix = [
            "universities",
            "university_profiles",
            "programs",
            "applications",
            "activity_log",
            "program_catalog",
            "university_verification",
            "university_images",
            "university_master_imports",
          ];
          let fi = 0;
          const next = () => {
            if (fi >= toFix.length) return runTables();
            const tbl = toFix[fi++];
            db.query(
              `SELECT T.table_collation
               FROM information_schema.TABLES T
               WHERE T.table_schema = DATABASE() AND T.table_name = ?`,
              [tbl],
              (e3, r3) => {
                if (e3 || !r3.length) return next();
                const collation = r3[0].table_collation;
                if (collation === "utf8mb4_general_ci") return next();
                db.query(
                  `ALTER TABLE \`${tbl}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
                  (e4) => {
                    if (e4) console.log(`Collation fix ${tbl}:`, e4.message);
                    else console.log(`Fixed collation on ${tbl}`);
                    next();
                  },
                );
              },
            );
          };
          next();
        });
      },
    );
  };

  let i = 0;
  const runTables = () => {
    if (i >= tables.length) {
      console.log("All Uni Finder tables ready");
      // addCritical runs AFTER tables are created so programs/university_profiles exist
      return addCritical();
    }
    const sql = tables[i++];
    db.query(sql, (err) => {
      if (err) console.log("Schema error:", err.sqlMessage || err.message);
      runTables();
    });
  };

  // ── campus_registrations — created BEFORE fixCollations/runTables ──────────
  // No FK on universityId: university existence + approved status is validated
  // server-side in registrationController.js (avoids creation-order deadlock and
  // collation-mismatch FK errors across differently-collated tables).
  // lat/lng reserved for future map feature — nullable, never required.
  db.query(`
    CREATE TABLE IF NOT EXISTS campus_registrations (
      id                       VARCHAR(255)  NOT NULL PRIMARY KEY,
      publicId                 VARCHAR(20)   NOT NULL UNIQUE,
      registrantUserId         VARCHAR(255)  NOT NULL,
      registrantEmail          VARCHAR(255)  NOT NULL,
      universityId             VARCHAR(255)  NOT NULL,
      campusType               VARCHAR(50)   NOT NULL,
      officialName             VARCHAR(255)  NOT NULL,
      province                 VARCHAR(100)  NOT NULL,
      city                     VARCHAR(100)  NOT NULL,
      address                  TEXT          NOT NULL,
      lat                      DECIMAL(10,8) NULL COMMENT 'reserved — map feature',
      lng                      DECIMAL(11,8) NULL COMMENT 'reserved — map feature',
      registrantName           VARCHAR(255)  NOT NULL,
      designation              VARCHAR(100)  NOT NULL,
      phone                    VARCHAR(20)   NOT NULL,
      officialEmail            VARCHAR(255)  NULL,
      document_originalName    VARCHAR(255)  NULL,
      document_storedPath      VARCHAR(500)  NULL,
      document_size            INT           NULL,
      declarationAccepted      TINYINT(1)    NOT NULL DEFAULT 1,
      status                   VARCHAR(50)   NOT NULL DEFAULT 'pending',
      rejection_reason         VARCHAR(255)  NULL,
      rejection_note           TEXT          NULL,
      rejection_decidedAt      DATETIME      NULL,
      resubmission_requiredDocs JSON         NULL,
      resubmission_note        TEXT          NULL,
      resubmission_requestedAt DATETIME      NULL,
      history                  JSON          NULL,
      submittedAt              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cr_user   (registrantUserId),
      INDEX idx_cr_uni    (universityId),
      INDEX idx_cr_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `, (err) => {
    if (err) console.error("campus_registrations create:", err.message);
    // HEC-seeded universities stay status='pending' by default.
    // Only universities explicitly approved by the Super Admin
    // (via the verification flow) get status='approved'.
    // Fix: reset unclaimed universities that were wrongly backfilled to 'approved'.
    db.query(
      `UPDATE universities SET status = 'pending'
       WHERE owner_uid IS NULL AND status = 'approved'`,
      (e2) => {
        if (e2) console.log("University status correction:", e2.message);

        // Sync any approved campus_registrations into campuses table if not yet present.
        // verification_id is set to NULL because cr.id is a campus_registrations ID —
        // passing it as verification_id violates the fk_camp_verify FK on older installs.
        // The FK was dropped by fix_campus_fk.mjs but we keep NULL here for safety.
        db.query(
          `INSERT INTO campuses
             (id, university_id, campus_admin_uid, verification_id,
              name, campus_type, city, province, address, phone, email)
           SELECT
             UUID(), cr.universityId, cr.registrantUserId, NULL,
             cr.officialName, cr.campusType, cr.city, cr.province, cr.address,
             cr.phone, COALESCE(cr.officialEmail, cr.registrantEmail)
           FROM campus_registrations cr
           WHERE cr.status = 'approved'
             AND NOT EXISTS (
               SELECT 1 FROM campuses c
               WHERE c.campus_admin_uid COLLATE utf8mb4_general_ci
                   = cr.registrantUserId COLLATE utf8mb4_general_ci
             )`,
          (e3) => {
            if (e3) console.log("Campuses sync from registrations:", e3.message);
            fixCollations();
          }
        );
      }
    );
  });
};

export default initSchema;
