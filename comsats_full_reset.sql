-- ================================================================
-- COMSATS FULL RESET + INSERT — All 11 Steps in one file
-- Run via phpMyAdmin → Import tab (not SQL tab — file is large)
-- Preserves: Student_signup accounts, campuses rows
-- Clears: all COMSATS data then re-inserts everything fresh
-- ================================================================

-- ── STEP 1: DELETE all existing COMSATS data ───────────────────
DELETE FROM campus_programs    WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98');
DELETE FROM campus_societies   WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98');
DELETE FROM campus_facilities  WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98');
DELETE FROM campus_images      WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98');
DELETE FROM campus_hostels     WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98');
DELETE FROM programs           WHERE university_id = 'f3f5dbc5-cf02-451a-86e1-d468921720f0';
DELETE FROM university_images  WHERE university_id = 'f3f5dbc5-cf02-451a-86e1-d468921720f0';
DELETE FROM university_profiles WHERE university_id = 'f3f5dbc5-cf02-451a-86e1-d468921720f0';

-- ── STEP 2: University row ──────────────────────────────────────
UPDATE universities SET
  name='COMSATS University Islamabad', normalized_name='comsats university islamabad',
  hec_rank=1, university_type='Public', oric_domain='@comsats.edu.pk',
  focal_person_name='Prof. Dr. Raheel Qamar, T.I.',
  focal_person_email='admissions@comsats.edu.pk',
  campus_count=8,
  campuses_text='Islamabad Main Campus; Lahore Campus; Abbottabad Campus; Wah Campus; Attock Campus; Sahiwal Campus; Vehari Campus',
  tagline='Excellence in Higher Education, Innovative Research and Service to Society',
  hero_subtitle='Chartered public research university by the Federal Government of Pakistan with 7 physical campuses and a Virtual Campus nationwide',
  about_title='About COMSATS University Islamabad',
  about_text='COMSATS University Islamabad (CUI) is a public sector university chartered by the Federal Government of Pakistan in 2018 (originally established as CIIT in 1998). CUI functions under the governance of the Ministry of Science and Technology. The university comprises 7 physical campuses - Islamabad (Main Campus), Lahore, Abbottabad, Wah Cantt, Attock, Sahiwal, and Vehari - plus a Virtual Campus that is currently seeking HEC NOC. It hosts 6 faculties, 23 academic departments, 6 research centers, and over 39,000 enrolled students.',
  mission='The COMSATS University Islamabad is dedicated to the search for truth through advancement of learning and extending the frontiers of knowledge; to the sharing of this knowledge through education in an academically diverse range of disciplines; and to the application of this knowledge to benefit the people of Pakistan, the Muslim Ummah, and the World, at large.',
  vision='CUI envisions having presence in all provinces of the country and a position among the top five universities in Pakistan; among top 100 universities in the developing countries and top 300 universities in the world in the 15-year time horizon.',
  website='https://www.comsats.edu.pk', email='admissions@comsats.edu.pk',
  phone='+92-51-90495032', city='Islamabad',
  address='Park Road, Tarlai Kalan, Islamabad, 45550, Pakistan',
  established_year='1998',
  logo_url='https://www.comsats.edu.pk/assets/img/COMSATS-logo.png',
  banner_url='https://www.comsats.edu.pk/assets/img/all-campuses.jpg',
  ranking='1', ranking_label='#1 in Pakistan (THE Impact Rankings 2024)',
  students='39,100+', employment_rate='88%', partner_countries='35+', total_campuses='8'
WHERE id='f3f5dbc5-cf02-451a-86e1-d468921720f0';

-- ── STEP 3: University profile ──────────────────────────────────
INSERT INTO university_profiles (university_id,established_year,about_text,mission_statement,logo_path,banner_path,active_students,website_url,admissions_email,admissions_phone)
VALUES ('f3f5dbc5-cf02-451a-86e1-d468921720f0',1998,
'COMSATS University Islamabad (CUI) is a public sector university chartered by the Federal Government of Pakistan in 2018 (originally established as CIIT in 1998). It hosts 6 faculties, 23 academic departments, 6 research centers, and over 39,000 enrolled students. CUI consistently ranks among top national and international universities.',
'The COMSATS University Islamabad is dedicated to the search for truth through advancement of learning and extending the frontiers of knowledge; to the sharing of this knowledge through education in an academically diverse range of disciplines; and to the application of this knowledge to benefit the people of Pakistan, the Muslim Ummah, and the World, at large.',
'https://www.comsats.edu.pk/assets/img/COMSATS-logo.png',
'https://www.comsats.edu.pk/assets/img/all-campuses.jpg',
39100,'https://www.comsats.edu.pk','admissions@comsats.edu.pk','+92-51-90495032')
ON DUPLICATE KEY UPDATE established_year=1998,
  about_text=VALUES(about_text), mission_statement=VALUES(mission_statement),
  logo_path=VALUES(logo_path), banner_path=VALUES(banner_path),
  active_students=39100, website_url='https://www.comsats.edu.pk',
  admissions_email='admissions@comsats.edu.pk', admissions_phone='+92-51-90495032';

-- ── STEP 4: University gallery (6 images) ───────────────────────

-- ── STEP 5: Update 8 campus rows ───────────────────────────────

-- ── STEP 6: Programs (138 rows) ────────────────────────────────

-- ── STEP 7: Campus facilities (8 rows) ─────────────────────────

-- ── STEP 8: Campus societies (84 rows) ─────────────────────────

-- ── STEP 9: Campus images (30 rows) ────────────────────────────

-- ── STEP 10: Campus hostels (11 rows) ──────────────────────────

-- ── STEP 11: campus_programs (266 rows) ────────────────────────

-- ── VERIFY (expected: 1,1,6,8,138,8,84,30,11,266) ──────────────
SELECT 'universities' AS tbl,COUNT(*) AS cnt FROM universities WHERE id='f3f5dbc5-cf02-451a-86e1-d468921720f0'
UNION ALL SELECT 'univ_profiles', COUNT(*) FROM university_profiles WHERE university_id='f3f5dbc5-cf02-451a-86e1-d468921720f0'
UNION ALL SELECT 'univ_images',   COUNT(*) FROM university_images   WHERE university_id='f3f5dbc5-cf02-451a-86e1-d468921720f0'
UNION ALL SELECT 'campuses',       COUNT(*) FROM campuses            WHERE university_id='f3f5dbc5-cf02-451a-86e1-d468921720f0'
UNION ALL SELECT 'programs',       COUNT(*) FROM programs            WHERE university_id='f3f5dbc5-cf02-451a-86e1-d468921720f0'
UNION ALL SELECT 'facilities',     COUNT(*) FROM campus_facilities   WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98')
UNION ALL SELECT 'societies',      COUNT(*) FROM campus_societies    WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98')
UNION ALL SELECT 'campus_images',  COUNT(*) FROM campus_images       WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98')
UNION ALL SELECT 'hostels',        COUNT(*) FROM campus_hostels      WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98')
UNION ALL SELECT 'campus_programs',COUNT(*) FROM campus_programs     WHERE campus_id IN ('f89c4fab-e129-4a04-9397-5973b3bcb236','fc8d4067-8b6e-43c0-9da6-99b346b2a47a','3255e349-a48b-4e44-b031-34e93fcfe498','151cbd18-138b-45bf-a153-4b2a092ca6d4','b846ce88-94db-43e6-aaff-ae56e069f5ad','786e8a22-b7f8-4119-9fb1-4e62b82f71d7','cc54e3ab-89c3-4f80-833d-d88810e2196d','46d717e0-6aee-4c60-81cb-1a03ce007a98');
