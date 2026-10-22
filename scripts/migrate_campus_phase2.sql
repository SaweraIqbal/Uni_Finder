-- =============================================================
-- Uni-Finder Phase 2 — Campus Module Migration
-- Creates all campus tables needed for Campus Admin Dashboard.
-- Idempotent (IF NOT EXISTS / IF NOT EXISTS guards throughout).
-- Run from MySQL root: source scripts/migrate_campus_phase2.sql
-- =============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ── 1. campus_verification ────────────────────────────────────────────────
--    Stores campus registration requests submitted by campus admins.
--    University admin approves/rejects; super admin has read access.

CREATE TABLE IF NOT EXISTS campus_verification (
  id                VARCHAR(255)  NOT NULL PRIMARY KEY,
  campus_admin_uid  VARCHAR(255)  NOT NULL,
  university_id     VARCHAR(255)  NOT NULL,
  campus_name       VARCHAR(255)  NOT NULL,
  city              VARCHAR(100)  NULL,
  address           TEXT          NULL,
  contact_no        VARCHAR(30)   NULL,
  status            ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reject_reason     TEXT          NULL,
  reviewed_by       VARCHAR(255)  NULL,
  reviewed_at       DATETIME      NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_cv_admin  (campus_admin_uid),
  INDEX idx_cv_uni    (university_id),
  INDEX idx_cv_status (status),

  CONSTRAINT fk_cv_user
    FOREIGN KEY (campus_admin_uid) REFERENCES student_signup(id) ON DELETE CASCADE,
  CONSTRAINT fk_cv_uni
    FOREIGN KEY (university_id)    REFERENCES universities(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── 2. campuses ───────────────────────────────────────────────────────────
--    Editable campus profile. Created only after campus_verification is approved.

CREATE TABLE IF NOT EXISTS campuses (
  id                VARCHAR(255)  NOT NULL PRIMARY KEY,
  university_id     VARCHAR(255)  NOT NULL,
  campus_admin_uid  VARCHAR(255)  NOT NULL,
  verification_id   VARCHAR(255)  NULL,

  -- Basic identity (matches CampusDetailsTab form fields)
  name              VARCHAR(255)  NOT NULL DEFAULT '',
  campus_type       VARCHAR(50)   NULL DEFAULT 'Main Campus',
  city              VARCHAR(100)  NULL,
  province          VARCHAR(100)  NULL,
  address           TEXT          NULL,
  lat               VARCHAR(30)   NULL,
  lng               VARCHAR(30)   NULL,
  description       TEXT          NULL,

  -- Contact
  phone             VARCHAR(30)   NULL,
  whatsapp          VARCHAR(30)   NULL,
  email             VARCHAR(254)  NULL,
  office_hours      VARCHAR(150)  NULL,

  -- Shifts (stored as tinyint booleans)
  shift_morning     TINYINT(1)    NOT NULL DEFAULT 1,
  shift_evening     TINYINT(1)    NOT NULL DEFAULT 0,
  shift_weekend     TINYINT(1)    NOT NULL DEFAULT 0,

  -- Gender policy
  gender_policy     VARCHAR(50)   NULL DEFAULT 'co-education',

  -- Legacy fields kept for backward-compat with old CampusDetailsTab
  history           TEXT          NULL,
  duration          VARCHAR(100)  NULL,
  fee               VARCHAR(100)  NULL,

  -- Images
  cover_image       VARCHAR(500)  NULL,
  university_banner VARCHAR(500)  NULL,

  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_campus_admin (campus_admin_uid),
  INDEX idx_camp_uni  (university_id),

  CONSTRAINT fk_camp_uni
    FOREIGN KEY (university_id)    REFERENCES universities(id)        ON DELETE CASCADE,
  CONSTRAINT fk_camp_admin
    FOREIGN KEY (campus_admin_uid) REFERENCES student_signup(id)      ON DELETE CASCADE,
  CONSTRAINT fk_camp_verify
    FOREIGN KEY (verification_id)  REFERENCES campus_verification(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── 3. campus_images ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campus_images (
  id          VARCHAR(255) NOT NULL PRIMARY KEY,
  campus_id   VARCHAR(255) NOT NULL,
  image_url   VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  category    VARCHAR(100) NULL DEFAULT 'Campus Building',
  featured    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_ci_campus (campus_id),

  CONSTRAINT fk_ci_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── 4. campus_programs ────────────────────────────────────────────────────
--    Links a university program to a campus with per-campus fee & duration.

CREATE TABLE IF NOT EXISTS campus_programs (
  id          VARCHAR(255)   NOT NULL PRIMARY KEY,
  campus_id   VARCHAR(255)   NOT NULL,
  program_id  VARCHAR(255)   NOT NULL,
  fee         VARCHAR(100)   NULL,
  duration    VARCHAR(100)   NULL,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_cp (campus_id, program_id),
  INDEX idx_cp_campus  (campus_id),
  INDEX idx_cp_program (program_id),

  CONSTRAINT fk_cp_campus
    FOREIGN KEY (campus_id)  REFERENCES campuses(id)  ON DELETE CASCADE,
  CONSTRAINT fk_cp_program
    FOREIGN KEY (program_id) REFERENCES programs(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── 5. campus_societies ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campus_societies (
  id          VARCHAR(255)  NOT NULL PRIMARY KEY,
  campus_id   VARCHAR(255)  NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  category    VARCHAR(100)  NULL,
  description TEXT          NULL,
  initials    VARCHAR(4)    NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_cs_campus (campus_id),

  CONSTRAINT fk_cs_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── 6. campus_facilities ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campus_facilities (
  campus_id         VARCHAR(255) NOT NULL PRIMARY KEY,
  selected_ids      TEXT         NULL,   -- JSON array of selected facility IDs
  transport_routes  TEXT         NULL,
  transport_fee     VARCHAR(50)  NULL,
  dress_code        VARCHAR(255) NULL,
  class_timings     VARCHAR(255) NULL,
  attendance_policy VARCHAR(255) NULL,
  discipline_policy TEXT         NULL,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_cf_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── 7. campus_hostels (linked / campus-owned) ─────────────────────────────

CREATE TABLE IF NOT EXISTS campus_hostels (
  id          VARCHAR(255)  NOT NULL PRIMARY KEY,
  campus_id   VARCHAR(255)  NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  vendor_name VARCHAR(255)  NULL,
  hostel_type ENUM('Campus Hostel','Private Hostel') NOT NULL DEFAULT 'Campus Hostel',
  gender      ENUM('Boys','Girls','Mixed')           NOT NULL DEFAULT 'Boys',
  rooms       INT           NULL,
  rent_min    DECIMAL(10,2) NULL,
  walk_dist   VARCHAR(50)   NULL,
  status      ENUM('pending','live','rejected')      NOT NULL DEFAULT 'pending',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_ch_campus (campus_id),

  CONSTRAINT fk_ch_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET foreign_key_checks = 1;

SELECT 'Phase 2 campus tables created successfully ✓' AS result;
