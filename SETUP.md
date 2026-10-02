# Uni-Finder — Setup & Migration Guide

## Prerequisites

- Node.js 18+
- XAMPP / MariaDB 10.4+ running on port 3306
- Python 3.8+ (for the program catalog script, optional)

---

## 1. Back up the database (run this before any migration)

```bash
mysqldump -u root uni_finder > uni_finder_backup_$(date +%Y%m%d).sql
```

---

## 2. Install backend dependencies

```bash
cd src/backend
npm install
```

This installs `sharp` (image processing) which was added in Phase 1.

---

## 3. Environment variables

Create or update `src/backend/.env`:

```env
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=uni_finder

# Auth
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRY=1d

# File storage
UPLOAD_DIR=          # optional; defaults to src/backend/uploads/universities

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="UniFinder <your@gmail.com>"
EMAIL_OVERRIDE=       # set to your email in dev to catch all outbound mail

# URLs (used in email links)
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
```

---

## 4. Run the migration SQL (once)

Open phpMyAdmin or a MySQL shell connected to `uni_finder`, then run:

```bash
mysql -u root uni_finder < scripts/migrate.sql
```

This will:
- Create `university_profiles`, `programs` (new schema), `activity_log`, `program_catalog`
- Drop `campuses`, `campus_verification`, `campus_images`, `campus_programs`

The schema is also applied automatically on every server start via `initSchema()`.

---

## 5. Start the backend

```bash
cd src/backend
npm start
```

On first start, the server will automatically:
1. Create / migrate all tables
2. Seed the HEC university master list (`hec_universities.xlsx` → `universities`)
3. Seed programs from all 3 sheets in `programs.xlsx` → `programs`
4. Re-runs are idempotent — safe to restart as many times as needed

---

## 6. Start the frontend

```bash
# from project root
npm run dev
```

---

## 7. Build the program catalog (optional — for student search)

Run once after seeding, and re-run whenever you add new program Excel files:

```bash
pip install openpyxl mysql-connector-python python-dotenv
python scripts/build_program_catalog.py
```

This writes `src/backend/data/program_catalog.json` and upserts the `program_catalog` table.

---

## 8. Verify the migration

Run these queries to confirm everything is clean:

```sql
-- Confirm tables exist
SHOW TABLES;

-- Check university count
SELECT COUNT(*) FROM universities WHERE is_hec_listed = 1;
-- Expected: 282

-- Check program count
SELECT university_id, COUNT(*) as cnt, GROUP_CONCAT(DISTINCT level) as levels
FROM programs GROUP BY university_id;

-- Check campus tables are gone
SHOW TABLES LIKE 'campus%';
-- Expected: empty

-- Check profile rows exist for owned universities
SELECT COUNT(*) FROM university_profiles;

-- Check no mock data in activity_log
SELECT COUNT(*) FROM activity_log;
-- Expected: 0 (real events only — fills up as admins use the dashboard)
```

---

## BEFORE / AFTER — Hardcoded → Real Data

| Field | Before (hardcoded) | After (real source) |
|---|---|---|
| University Name | `"University of the Punjab"` | `universities.name` via `/me` |
| Sector / Type | `"Public"` | `universities.university_type` |
| HEC Rank | `3` | `universities.hec_rank` (NULL → "Unranked") |
| ORIC Domain | `"Available"` | `universities.oric_domain` |
| Focal Person | hardcoded email `registrar@uop.edu.pk` | `universities.focal_person_email` |
| Campus Count | `3` | `universities.campus_count` (from HEC) |
| Total Programs | `10` | `COUNT(programs)` via `/me/stats` |
| Active Students | `48,000` | `university_profiles.active_students` (admin-entered) |
| About Text | hardcoded paragraph | `university_profiles.about_text` |
| Mission | hardcoded paragraph | `university_profiles.mission_statement` |
| Established Year | `"1882"` | `university_profiles.established_year` |
| Logo / Banner | local preview only (never persisted) | uploaded → resized → stored → served from `/uploads/universities/` |
| Activity Log | 10 fake entries from mockData.js | real `activity_log` rows (empty until actions happen) |
| Campus Requests | 3 fake campus objects | stub ("Coming Soon") |
| Program Requests | 4 fake program requests | stub ("Coming Soon") |
| Programs list | 10 fake programs | real `programs` table seeded from programs.xlsx |
| Student program search | 6 hardcoded strings | live `/api/programs/catalog` with debounced search |
| `city` / `established` in Header | `"Lahore, Pakistan"` / `"Est. 1882"` | from `university_profiles.established_year` via `/me` |

---

## Re-sync HEC data

To update universities with fresh HEC data without touching any admin-entered fields:

```
POST /api/sync-hec
Authorization: Bearer <admin-token>
```

Or restart the server (the seeder runs on boot idempotently).
