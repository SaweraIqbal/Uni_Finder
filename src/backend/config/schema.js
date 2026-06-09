// Centralised database schema for Uni Finder.
// All tables are created here so the flow (superadmin -> university admin -> campus admin)
// has one source of truth. Run automatically on server start from server.js.
//
// Docs/images: for now we store a local upload PATH in the *_url columns.
// Later, when we move to S3, only the value stored in those columns changes
// (local path -> S3 link); the schema stays the same.

const tables = [
  // ---------------------------------------------------------------------------
  // 1. SIMULATED EMAIL / NOTIFICATIONS
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS notifications (
    id            VARCHAR(255) PRIMARY KEY,
    recipient_uid VARCHAR(255),
    recipient_email VARCHAR(150),
    subject       VARCHAR(255),
    body          TEXT,
    type          VARCHAR(50),
    is_read       TINYINT(1) DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // ---------------------------------------------------------------------------
  // 2. UNIVERSITY VERIFICATION REQUESTS
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS university_verification (
    id                VARCHAR(255) PRIMARY KEY,
    user_uid          VARCHAR(255) NOT NULL,
    university_name   VARCHAR(200) NOT NULL,
    registration_no   VARCHAR(100),
    address           TEXT,
    contact_no        VARCHAR(50),
    hec_certificate_url       VARCHAR(500),
    charter_certificate_url   VARCHAR(500),
    accreditation_document_url VARCHAR(500),
    university_logo_url       VARCHAR(500),
    status            VARCHAR(20) DEFAULT 'pending',
    reject_reason     TEXT,
    reviewed_by       VARCHAR(255),
    reviewed_at       DATETIME,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uid) REFERENCES Student_signup(id)
  )`,

  // ---------------------------------------------------------------------------
  // 3. UNIVERSITIES (the real record the uni admin fills after approval)
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS universities (
    id              VARCHAR(255) PRIMARY KEY,
    owner_uid       VARCHAR(255) NOT NULL,
    verification_id VARCHAR(255),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    logo_url        VARCHAR(500),
    website         VARCHAR(200),
    email           VARCHAR(150),
    phone           VARCHAR(50),
    city            VARCHAR(100),
    address         TEXT,
    established_year VARCHAR(10),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_uid) REFERENCES Student_signup(id)
  )`,

  // ---------------------------------------------------------------------------
  // 4. UNIVERSITY IMAGES (gallery — many per university)
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS university_images (
    id            VARCHAR(255) PRIMARY KEY,
    university_id VARCHAR(255) NOT NULL,
    image_url     VARCHAR(500) NOT NULL,
    caption       VARCHAR(200),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
  )`,

  // ---------------------------------------------------------------------------
  // 5. PROGRAMS (offered by a university; campuses pick from these)
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS programs (
    id            VARCHAR(255) PRIMARY KEY,
    university_id VARCHAR(255) NOT NULL,
    name          VARCHAR(200) NOT NULL,
    level         VARCHAR(50),
    duration      VARCHAR(50),
    description   TEXT,
    fee           VARCHAR(50),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
  )`,

  // ---------------------------------------------------------------------------
  // 6. CAMPUS VERIFICATION REQUESTS (campus admin -> uni admin)
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS campus_verification (
    id              VARCHAR(255) PRIMARY KEY,
    campus_admin_uid VARCHAR(255) NOT NULL,
    university_id   VARCHAR(255) NOT NULL,
    campus_name     VARCHAR(200) NOT NULL,
    city            VARCHAR(100),
    address         TEXT,
    contact_no      VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'pending',
    reject_reason   TEXT,
    reviewed_by     VARCHAR(255),
    reviewed_at     DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campus_admin_uid) REFERENCES Student_signup(id),
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
  )`,

  // ---------------------------------------------------------------------------
  // 7. CAMPUSES (auto-added to the university when approved)
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS campuses (
    id               VARCHAR(255) PRIMARY KEY,
    university_id    VARCHAR(255) NOT NULL,
    campus_admin_uid VARCHAR(255),
    verification_id  VARCHAR(255),
    name             VARCHAR(200) NOT NULL,
    city             VARCHAR(100),
    address          TEXT,
    history          TEXT,
    duration         VARCHAR(100),
    fee              VARCHAR(50),
    phone            VARCHAR(50),
    email            VARCHAR(150),
    status           VARCHAR(20) DEFAULT 'active',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
  )`,

  // ---------------------------------------------------------------------------
  // 8. CAMPUS IMAGES
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS campus_images (
    id         VARCHAR(255) PRIMARY KEY,
    campus_id  VARCHAR(255) NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    caption    VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
  )`,

  // ---------------------------------------------------------------------------
  // 9. CAMPUS_PROGRAMS (which programs run at a campus + that campus's fee/duration)
  // ---------------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS campus_programs (
    id         VARCHAR(255) PRIMARY KEY,
    campus_id  VARCHAR(255) NOT NULL,
    program_id VARCHAR(255) NOT NULL,
    fee        VARCHAR(50),
    duration   VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
  )`,
];

// Extra columns added AFTER the universities table already exists (so users who
// ran an earlier version still get them). These hold the rich content shown on
// the public university detail page (hero, about, mission/vision, ranking, stats).
const columnMigrations = [
  ["universities", "tagline", "VARCHAR(255)"],
  ["universities", "hero_subtitle", "VARCHAR(500)"],
  ["universities", "banner_url", "VARCHAR(500)"],
  ["universities", "about_title", "VARCHAR(255)"],
  ["universities", "about_text", "TEXT"],
  ["universities", "mission", "TEXT"],
  ["universities", "vision", "TEXT"],
  ["universities", "ranking", "VARCHAR(20)"],
  ["universities", "ranking_label", "VARCHAR(150)"],
  ["universities", "students", "VARCHAR(50)"],
  ["universities", "employment_rate", "VARCHAR(50)"],
  ["universities", "partner_countries", "VARCHAR(50)"],
  ["universities", "total_campuses", "VARCHAR(50)"],
];

// Add a column only if it doesn't already exist (MySQL lacks ADD COLUMN IF NOT EXISTS).
const ensureColumns = (db, done) => {
  let i = 0;
  const next = () => {
    if (i >= columnMigrations.length) {
      console.log("University content columns ready");
      return done && done();
    }
    const [table, column, def] = columnMigrations[i++];
    db.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [table, column],
      (err, rows) => {
        if (err) {
          console.log("Migration check error:", err.message);
          return next();
        }
        if (rows[0].c > 0) return next(); // already exists
        db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`, (err2) => {
          if (err2) console.log("Migration error:", err2.message);
          next();
        });
      }
    );
  };
  next();
};

// Create tables in order (parents before children so foreign keys resolve),
// then run column migrations.
export const initSchema = (db) => {
  let i = 0;
  const next = () => {
    if (i >= tables.length) {
      console.log("All Uni Finder tables ready");
      return ensureColumns(db);
    }
    const sql = tables[i++];
    db.query(sql, (err) => {
      if (err) console.log("Schema error:", err.sqlMessage || err.message);
      next();
    });
  };
  next();
};

export default initSchema;
