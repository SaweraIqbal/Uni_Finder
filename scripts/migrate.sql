-- =============================================================
-- Uni-Finder Phase 1 Migration
-- Run AFTER taking a mysqldump backup (see SETUP.md).
-- Idempotent: safe to run multiple times.
-- =============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- -------------------------------------------------------------
-- 1. Add missing columns to universities
--    (ALTER TABLE … ADD COLUMN IF NOT EXISTS is not supported
--     on older MariaDB; we use the information_schema guard pattern
--     already established in schema.js — these are handled there.
--     Listed here for documentation.)
--
--   universities.normalized_name  VARCHAR(200) NULL UNIQUE
--   universities.campus_count     INT NOT NULL DEFAULT 0
--   universities.campuses_text    TEXT NULL            (raw semicolon list)
--   universities.last_synced_at   DATETIME NULL
-- -------------------------------------------------------------

-- -------------------------------------------------------------
-- 2. CREATE new tables (IF NOT EXISTS = idempotent)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS university_profiles (
  university_id   VARCHAR(255) PRIMARY KEY,
  established_year INT NULL,
  about_text      TEXT,
  mission_statement TEXT,
  logo_path       VARCHAR(500),
  banner_path     VARCHAR(500),
  active_students INT NOT NULL DEFAULT 0,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_up_university
    FOREIGN KEY (university_id) REFERENCES universities(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drop old programs table and recreate with full schema.
-- We use RENAME + CREATE so existing data is preserved in programs_old
-- if you want to inspect it; run  DROP TABLE programs_old  when satisfied.
CREATE TABLE IF NOT EXISTS programs_new (
  id              VARCHAR(255) PRIMARY KEY,
  university_id   VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  degree_type     VARCHAR(30)  NOT NULL DEFAULT '',
  level           ENUM('Undergraduate','MS','MPhil','PhD','ADP','Diploma') NULL,
  specialization  VARCHAR(255) NULL,
  track           VARCHAR(100) NULL,
  original_name   VARCHAR(500) NOT NULL,
  status          ENUM('approved','pending') NOT NULL DEFAULT 'approved',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_prog (university_id, name(191), level),
  INDEX idx_prog_uni_level (university_id, level),
  INDEX idx_prog_uni_status (university_id, status),
  CONSTRAINT fk_prog_university
    FOREIGN KEY (university_id) REFERENCES universities(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_log (
  id              VARCHAR(255) PRIMARY KEY,
  university_id   VARCHAR(255) NOT NULL,
  actor_user_id   VARCHAR(255) NULL,
  actor_name      VARCHAR(150) NOT NULL,
  action          ENUM(
    'profile_updated',
    'active_students_updated',
    'logo_uploaded',
    'banner_uploaded',
    'programs_synced',
    'verification_submitted',
    'verification_status_changed'
  ) NOT NULL,
  entity_type     VARCHAR(50) NULL,
  entity_id       VARCHAR(255) NULL,
  description     TEXT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_al_uni_time (university_id, created_at DESC),
  CONSTRAINT fk_al_university
    FOREIGN KEY (university_id) REFERENCES universities(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS program_catalog (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  level           ENUM('Undergraduate','MS','MPhil','PhD','ADP','Diploma') NULL,
  university_count INT UNSIGNED NOT NULL DEFAULT 1,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_catalog (normalized_name(191), level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_catalog_name ON program_catalog(normalized_name(191));

-- -------------------------------------------------------------
-- 3. Migrate existing programs → programs_old, promote programs_new
-- -------------------------------------------------------------
-- Only run this block if old programs table exists and programs_new
-- was just created. If programs table already has the new columns
-- (i.e. you ran this before), skip.

-- Rename old table to _old if programs_new exists and programs
-- still has the old schema (no degree_type column).
-- Handled in schema.js initSchema at runtime.

-- -------------------------------------------------------------
-- 4. DROP dead tables (campus module — Phase 2)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS campus_programs;
DROP TABLE IF EXISTS campus_images;
DROP TABLE IF EXISTS campus_verification;
DROP TABLE IF EXISTS campuses;

-- -------------------------------------------------------------
-- 5. Add owner_uid UNIQUE constraint to universities
--    (one university per admin account)
-- -------------------------------------------------------------
-- Check first to avoid duplicate index error:
-- ALTER TABLE universities ADD UNIQUE KEY uq_owner (owner_uid);
-- Handled in schema.js ensureColumns.

SET foreign_key_checks = 1;
