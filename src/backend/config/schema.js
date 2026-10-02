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
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ② UNIVERSITY_PROFILES — admin-editable 1:1 profile
  `CREATE TABLE IF NOT EXISTS university_profiles (
     university_id    VARCHAR(255) PRIMARY KEY,
     established_year INT         NULL,
     about_text       TEXT,
     mission_statement TEXT,
     logo_path        VARCHAR(500),
     banner_path      VARCHAR(500),
     active_students  INT         NOT NULL DEFAULT 0,
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
     UNIQUE KEY uq_catalog (normalized_name(191), level),
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
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

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
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ⑨ IMPORT BOOKKEEPING
  `CREATE TABLE IF NOT EXISTS university_master_imports (
     source_file VARCHAR(255) PRIMARY KEY,
     imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
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

// ── 4. Drop dead campus tables (Phase 2 deferred) ────────────────────────────

const ensureDrops = async (db) => {
  const dead = ["campus_programs", "campus_images", "campus_verification", "campuses"];
  for (const tbl of dead) {
    try {
      await query(db, `DROP TABLE IF EXISTS \`${tbl}\``);
    } catch (e) {
      console.log(`DROP ${tbl}:`, e.message);
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
  ];
  let ci = 0;
  const addCritical = () => {
    if (ci >= criticalCols.length) {
      // All critical columns added — now run ensureColumns for remaining migrations
      return ensureColumns(db, async () => {
        await ensureDrops(db);
        await ensureProfileRows(db);
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
          const toFix = ["applications", "activity_log", "program_catalog"];
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

  // Start by fixing collations on pre-existing tables, then create tables, then add columns
  fixCollations();
};

export default initSchema;
