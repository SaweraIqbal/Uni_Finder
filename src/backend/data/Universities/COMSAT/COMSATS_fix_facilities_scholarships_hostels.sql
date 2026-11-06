-- ============================================================
-- COMSATS FIX: Facilities, Scholarships, Hostels
-- ============================================================
-- Run this via phpMyAdmin > Import tab AFTER COMSATS_full_data_v2.sql
--
-- Fixes:
--   1. campus_facilities.selected_ids — corrected to proper JSON array
--      using the exact slug IDs that CampusFacilities.jsx recognises:
--      wifi | library | comp_labs | sci_labs | cafeteria | prayer |
--      sports | gym | transport | medical | parking | atm |
--      auditorium | cctv | lounges | bank
--   2. campuses.scholarships — populated for all 7 physical campuses
--      (JSON array of {name, type, coverage, criteria})
--   3. campus_hostels — re-inserted with correct status='live'
--      and amenities as human-readable display labels (WiFi, Mess, …)
--      matching NearbyHostels.jsx expectations
-- ============================================================

-- ─── PART 1: FIX campus_facilities.selected_ids (JSON array with correct slugs) ───
-- Old data used comma-separated strings and wrong slug names.
-- Replacing with proper JSON arrays using slugs from CampusFacilities.jsx FACILITY_OPTIONS.

-- Islamabad Campus
UPDATE campus_facilities SET
  selected_ids = '["wifi","library","comp_labs","sci_labs","sports","indoor_sports","gym","cafeteria","prayer","medical","parking","atm","bank","auditorium","lounges","cctv","transport"]'
WHERE campus_id = 'ab2a761b-cb6b-11f1-a6f1-8c04ba146d31';

-- Lahore Campus
UPDATE campus_facilities SET
  selected_ids = '["wifi","library","comp_labs","sci_labs","sports","indoor_sports","gym","cafeteria","prayer","medical","parking","atm","bank","auditorium","lounges","cctv","transport"]'
WHERE campus_id = 'ab2a7dc8-cb6b-11f1-a6f1-8c04ba146d31';

-- Abbottabad Campus
UPDATE campus_facilities SET
  selected_ids = '["wifi","library","comp_labs","sci_labs","sports","indoor_sports","gym","cafeteria","prayer","medical","parking","atm","bank","auditorium","lounges","cctv","transport"]'
WHERE campus_id = 'ab2a7ee4-cb6b-11f1-a6f1-8c04ba146d31';

-- Wah Campus
UPDATE campus_facilities SET
  selected_ids = '["wifi","library","comp_labs","sci_labs","sports","indoor_sports","gym","cafeteria","prayer","medical","parking","atm","bank","auditorium","lounges","cctv","transport"]'
WHERE campus_id = 'ab2a7f8d-cb6b-11f1-a6f1-8c04ba146d31';

-- Attock Campus
UPDATE campus_facilities SET
  selected_ids = '["wifi","library","comp_labs","sci_labs","sports","gym","cafeteria","prayer","medical","parking","atm","auditorium","lounges","cctv"]'
WHERE campus_id = 'ab2a806f-cb6b-11f1-a6f1-8c04ba146d31';

-- Sahiwal Campus
UPDATE campus_facilities SET
  selected_ids = '["wifi","library","comp_labs","sci_labs","sports","gym","cafeteria","prayer","medical","parking","atm","bank","auditorium","lounges","cctv","transport"]'
WHERE campus_id = 'ab2a8167-cb6b-11f1-a6f1-8c04ba146d31';

-- Vehari Campus
UPDATE campus_facilities SET
  selected_ids = '["wifi","library","comp_labs","sci_labs","sports","gym","cafeteria","prayer","medical","parking","atm","auditorium","lounges","cctv","transport"]'
WHERE campus_id = 'ab2a8220-cb6b-11f1-a6f1-8c04ba146d31';

-- Virtual Campus (minimal)
UPDATE campus_facilities SET
  selected_ids = '["wifi","library","comp_labs"]'
WHERE campus_id = 'ab2a82af-cb6b-11f1-a6f1-8c04ba146d31';


-- ─── PART 2: POPULATE campuses.scholarships (JSON column) ───
-- Each campus gets campus-wide scholarships relevant to it.
-- Shape: [{"name":"...","type":"...","coverage":"...","criteria":"..."}]
-- Types used for filter tabs: Need-Based | Merit-Based | Provincial | HEC | Sports

-- Islamabad Campus
UPDATE campuses SET scholarships = '[
  {"name":"CUI Need-Based Financial Aid","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Students with household income below Rs. 50,000/month. Apply via Student Affairs Office within 30 days of admission."},
  {"name":"HEC Need-cum-Merit Scholarship","type":"HEC","coverage":"Full tuition fee","criteria":"CGPA ≥ 2.5 per semester maintained. Family income verified by HEC. Renewable each semester subject to academic standing."},
  {"name":"CUI Merit Scholarship (Top Achievers)","type":"Merit-Based","coverage":"25% – 50% fee reduction","criteria":"Students who secure positions 1–10 in NTS NAT nationally or score 80%+ aggregate in Intermediate. Renewed on CGPA ≥ 3.0."},
  {"name":"PEEF Scholarship (Punjab Education Endowment Fund)","type":"Provincial","coverage":"Full tuition fee","criteria":"Domicile of Punjab. First-generation university student. Family income below Rs. 45,000/month. CGPA ≥ 2.0."},
  {"name":"CUI Sports Scholarship","type":"Sports","coverage":"25% – 75% fee waiver","criteria":"National or provincial level athletes. Nomination by CUI Sports Office. Performance reviewed annually."},
  {"name":"Orphan and Widows Children Scholarship","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Applicant is an orphan or child of a widow. Income proof and family documents required. Verified by Student Affairs."}
]' WHERE id = 'ab2a761b-cb6b-11f1-a6f1-8c04ba146d31';

-- Lahore Campus
UPDATE campuses SET scholarships = '[
  {"name":"CUI Need-Based Financial Aid","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Students with household income below Rs. 50,000/month. Apply via Student Affairs Office within 30 days of admission."},
  {"name":"HEC Need-cum-Merit Scholarship","type":"HEC","coverage":"Full tuition fee","criteria":"CGPA ≥ 2.5 per semester maintained. Family income verified by HEC. Renewable each semester subject to academic standing."},
  {"name":"CUI Merit Scholarship (Top Achievers)","type":"Merit-Based","coverage":"25% – 50% fee reduction","criteria":"Students who score 80%+ aggregate in Intermediate. Renewed on CGPA ≥ 3.0 per semester."},
  {"name":"PEEF Scholarship (Punjab Education Endowment Fund)","type":"Provincial","coverage":"Full tuition fee","criteria":"Domicile of Punjab. First-generation university student. Family income below Rs. 45,000/month. CGPA ≥ 2.0."},
  {"name":"CUI Sports Scholarship","type":"Sports","coverage":"25% – 75% fee waiver","criteria":"National or provincial level athletes. Nomination by CUI Lahore Sports Office. Performance reviewed annually."},
  {"name":"Orphan and Widows Children Scholarship","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Applicant is an orphan or child of a widow. Income proof and family documents required. Verified by Student Affairs."}
]' WHERE id = 'ab2a7dc8-cb6b-11f1-a6f1-8c04ba146d31';

-- Abbottabad Campus
UPDATE campuses SET scholarships = '[
  {"name":"CUI Need-Based Financial Aid","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Students with household income below Rs. 50,000/month. Apply via Student Affairs Office within 30 days of admission."},
  {"name":"HEC Need-cum-Merit Scholarship","type":"HEC","coverage":"Full tuition fee","criteria":"CGPA ≥ 2.5 per semester maintained. Family income verified by HEC. Renewable each semester subject to academic standing."},
  {"name":"KPK Higher Education Department Scholarship","type":"Provincial","coverage":"Full tuition fee","criteria":"Domicile of KPK province. Annual family income below Rs. 600,000. CGPA ≥ 2.0 after first semester."},
  {"name":"CUI Merit Scholarship (Top Achievers)","type":"Merit-Based","coverage":"25% – 50% fee reduction","criteria":"Students who score 80%+ aggregate in Intermediate. Renewed on CGPA ≥ 3.0 per semester."},
  {"name":"CUI Sports Scholarship","type":"Sports","coverage":"25% – 75% fee waiver","criteria":"National or provincial level athletes. Nomination by CUI Abbottabad Sports Office. Performance reviewed annually."}
]' WHERE id = 'ab2a7ee4-cb6b-11f1-a6f1-8c04ba146d31';

-- Wah Campus
UPDATE campuses SET scholarships = '[
  {"name":"CUI Need-Based Financial Aid","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Students with household income below Rs. 50,000/month. Apply via Student Affairs Office within 30 days of admission."},
  {"name":"HEC Need-cum-Merit Scholarship","type":"HEC","coverage":"Full tuition fee","criteria":"CGPA ≥ 2.5 per semester maintained. Family income verified by HEC. Renewable each semester subject to academic standing."},
  {"name":"PEEF Scholarship (Punjab Education Endowment Fund)","type":"Provincial","coverage":"Full tuition fee","criteria":"Domicile of Punjab. First-generation university student. Family income below Rs. 45,000/month. CGPA ≥ 2.0."},
  {"name":"CUI Merit Scholarship (Top Achievers)","type":"Merit-Based","coverage":"25% – 50% fee reduction","criteria":"Students who score 80%+ aggregate in Intermediate. Renewed on CGPA ≥ 3.0 per semester."},
  {"name":"Orphan and Widows Children Scholarship","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Applicant is an orphan or child of a widow. Income proof and family documents required. Verified by Student Affairs."}
]' WHERE id = 'ab2a7f8d-cb6b-11f1-a6f1-8c04ba146d31';

-- Attock Campus
UPDATE campuses SET scholarships = '[
  {"name":"CUI Need-Based Financial Aid","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Students with household income below Rs. 50,000/month. Apply via Student Affairs Office within 30 days of admission."},
  {"name":"HEC Need-cum-Merit Scholarship","type":"HEC","coverage":"Full tuition fee","criteria":"CGPA ≥ 2.5 per semester maintained. Family income verified by HEC. Renewable each semester subject to academic standing."},
  {"name":"PEEF Scholarship (Punjab Education Endowment Fund)","type":"Provincial","coverage":"Full tuition fee","criteria":"Domicile of Punjab. First-generation university student. Family income below Rs. 45,000/month. CGPA ≥ 2.0."},
  {"name":"CUI Merit Scholarship","type":"Merit-Based","coverage":"25% fee reduction","criteria":"Students who score 75%+ aggregate in Intermediate. Renewed on CGPA ≥ 2.8 per semester."}
]' WHERE id = 'ab2a806f-cb6b-11f1-a6f1-8c04ba146d31';

-- Sahiwal Campus
UPDATE campuses SET scholarships = '[
  {"name":"CUI Need-Based Financial Aid","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Students with household income below Rs. 50,000/month. Apply via Student Affairs Office within 30 days of admission."},
  {"name":"HEC Need-cum-Merit Scholarship","type":"HEC","coverage":"Full tuition fee","criteria":"CGPA ≥ 2.5 per semester maintained. Family income verified by HEC. Renewable each semester subject to academic standing."},
  {"name":"PEEF Scholarship (Punjab Education Endowment Fund)","type":"Provincial","coverage":"Full tuition fee","criteria":"Domicile of Punjab. First-generation university student. Family income below Rs. 45,000/month. CGPA ≥ 2.0."},
  {"name":"CUI Merit Scholarship","type":"Merit-Based","coverage":"25% – 50% fee reduction","criteria":"Students who score 80%+ aggregate in Intermediate. Renewed on CGPA ≥ 3.0 per semester."},
  {"name":"Orphan and Widows Children Scholarship","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Applicant is an orphan or child of a widow. Income proof and family documents required. Verified by Student Affairs."}
]' WHERE id = 'ab2a8167-cb6b-11f1-a6f1-8c04ba146d31';

-- Vehari Campus (highest scholarship coverage campus)
UPDATE campuses SET scholarships = '[
  {"name":"CUI Need-Based Financial Aid","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Students with household income below Rs. 50,000/month. Apply via Student Affairs Office within 30 days of admission."},
  {"name":"HEC Need-cum-Merit Scholarship","type":"HEC","coverage":"Full tuition fee","criteria":"CGPA ≥ 2.5 per semester maintained. Family income verified by HEC. Renewable each semester subject to academic standing."},
  {"name":"PEEF Scholarship (Punjab Education Endowment Fund)","type":"Provincial","coverage":"Full tuition fee","criteria":"Domicile of Punjab. First-generation university student. Family income below Rs. 45,000/month. CGPA ≥ 2.0."},
  {"name":"CUI Vehari Special Need-Based Award","type":"Need-Based","coverage":"50% – 100% fee waiver","criteria":"Special allocation for Vehari campus students from low-income agricultural families. Income certificate from local revenue office required."},
  {"name":"CUI Merit Scholarship","type":"Merit-Based","coverage":"25% – 50% fee reduction","criteria":"Students who score 80%+ aggregate in Intermediate. Renewed on CGPA ≥ 3.0 per semester."},
  {"name":"Orphan and Widows Children Scholarship","type":"Need-Based","coverage":"Up to 100% fee waiver","criteria":"Applicant is an orphan or child of a widow. Income proof and family documents required. Verified by Student Affairs."}
]' WHERE id = 'ab2a8220-cb6b-11f1-a6f1-8c04ba146d31';


-- ─── PART 3: RE-INSERT campus_hostels with correct shape for NearbyHostels.jsx ───
-- NearbyHostels.jsx expects:
--   name         → VARCHAR
--   gender       → 'Boys' | 'Girls' | 'Mixed'  (component maps to "Boys Hostel" / "Girls Hostel")
--   hostel_type  → 'Campus Hostel' | 'Private Hostel'  (maps to ownership)
--   rent_min     → INT  (component uses as price)
--   walk_dist    → VARCHAR  (component uses as distanceKm label)
--   amenities    → JSON array of DISPLAY LABELS ["WiFi","Mess","Security","CCTV",...]
--   status       → 'live'  (controller filters on this)
-- Note: walk_dist is stored as a string ("10 min walk", "On-Campus").
--       The frontend currently shows distanceKm as a number but we fix the
--       component to display walk_dist string instead (see code changes below).

-- Wipe existing COMSATS hostels to avoid duplicates on re-run
DELETE FROM campus_hostels WHERE campus_id IN (
  'ab2a761b-cb6b-11f1-a6f1-8c04ba146d31',
  'ab2a7dc8-cb6b-11f1-a6f1-8c04ba146d31',
  'ab2a7ee4-cb6b-11f1-a6f1-8c04ba146d31',
  'ab2a7f8d-cb6b-11f1-a6f1-8c04ba146d31',
  'ab2a806f-cb6b-11f1-a6f1-8c04ba146d31',
  'ab2a8167-cb6b-11f1-a6f1-8c04ba146d31',
  'ab2a8220-cb6b-11f1-a6f1-8c04ba146d31',
  'ab2a82af-cb6b-11f1-a6f1-8c04ba146d31'
);

-- ── Islamabad Campus ──────────────────────────────────────────────────────
INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a761b-cb6b-11f1-a6f1-8c04ba146d31',
  'CUI Islamabad Boys Hostel Block',
  'CUI Hostel Administration',
  'Campus Hostel', 'Boys', 150, 14000, '10 min walk',
  '+92-51-90495369',
  '["WiFi","Mess","Security","CCTV","Generator","Lounge","Study Room","Prayer Room","Parking"]',
  '[{"room_type":"Double","monthly_rent":18000,"included_meals":"Breakfast + Dinner","attached_bathroom":true},{"room_type":"Triple","monthly_rent":14000,"included_meals":"Breakfast + Dinner","attached_bathroom":false}]',
  'live', 1
);

INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a761b-cb6b-11f1-a6f1-8c04ba146d31',
  'CUI Islamabad Girls Hostel Block',
  'CUI Hostel Administration',
  'Campus Hostel', 'Girls', 120, 14000, '10 min walk',
  '+92-51-90495369',
  '["WiFi","Mess","Security","CCTV","Generator","Lounge","Study Room","Prayer Room"]',
  '[{"room_type":"Double","monthly_rent":18000,"included_meals":"Breakfast + Dinner","attached_bathroom":true},{"room_type":"Triple","monthly_rent":14000,"included_meals":"Breakfast + Dinner","attached_bathroom":false}]',
  'live', 1
);

-- ── Lahore Campus ─────────────────────────────────────────────────────────
INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a7dc8-cb6b-11f1-a6f1-8c04ba146d31',
  'Liaquat Block Boys Hostel',
  'CUI Lahore Student Affairs',
  'Campus Hostel', 'Boys', 200, 16000, 'On-Campus',
  '+92-42-111001007',
  '["WiFi","Mess","Security","CCTV","Generator","Lounge","Study Room","Prayer Room","Indoor Games","Parking"]',
  '[{"room_type":"Single","monthly_rent":22000,"included_meals":"All meals","attached_bathroom":true},{"room_type":"Double","monthly_rent":16000,"included_meals":"All meals","attached_bathroom":false}]',
  'live', 1
);

INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a7dc8-cb6b-11f1-a6f1-8c04ba146d31',
  'Fatima Jinnah Girls Hostel',
  'CUI Lahore Student Affairs',
  'Campus Hostel', 'Girls', 180, 13000, 'On-Campus',
  '+92-42-111001007',
  '["WiFi","Mess","Security","CCTV","Generator","Lounge","Study Room","Prayer Room","Medical Aid"]',
  '[{"room_type":"Double","monthly_rent":16000,"included_meals":"All meals","attached_bathroom":true},{"room_type":"Triple","monthly_rent":13000,"included_meals":"All meals","attached_bathroom":false}]',
  'live', 1
);

-- ── Abbottabad Campus ─────────────────────────────────────────────────────
INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a7ee4-cb6b-11f1-a6f1-8c04ba146d31',
  'Kaghan Block Boys Hostel',
  'CUI Abbottabad Residential Section',
  'Campus Hostel', 'Boys', 250, 12000, 'On-Campus',
  '+92-992-383591',
  '["WiFi","Geyser","Mess","Security","CCTV","Generator","Lounge","Study Room","Prayer Room","Parking"]',
  '[{"room_type":"Double","monthly_rent":15000,"included_meals":"Mess system","attached_bathroom":true},{"room_type":"Triple","monthly_rent":12000,"included_meals":"Mess system","attached_bathroom":false}]',
  'live', 1
);

INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a7ee4-cb6b-11f1-a6f1-8c04ba146d31',
  'Naran Block Girls Hostel',
  'CUI Abbottabad Residential Section',
  'Campus Hostel', 'Girls', 90, 12000, 'On-Campus',
  '+92-992-383591',
  '["WiFi","Geyser","Mess","Security","CCTV","Generator","Lounge","Study Room","Prayer Room","Medical Aid"]',
  '[{"room_type":"Double","monthly_rent":15000,"included_meals":"Mess system","attached_bathroom":true},{"room_type":"Triple","monthly_rent":12000,"included_meals":"Mess system","attached_bathroom":false}]',
  'live', 1
);

-- ── Wah Campus ───────────────────────────────────────────────────────────
INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a7f8d-cb6b-11f1-a6f1-8c04ba146d31',
  'Sir Syed Block Boys Hostel',
  'CUI Wah Student Affairs',
  'Campus Hostel', 'Boys', 80, 10000, '5 min walk',
  '+92-51-9272614',
  '["WiFi","Mess","Security","CCTV","Generator","Lounge","Study Room","Prayer Room"]',
  '[{"room_type":"Double","monthly_rent":13000,"included_meals":"Breakfast + Dinner","attached_bathroom":false},{"room_type":"Triple","monthly_rent":10000,"included_meals":"Breakfast + Dinner","attached_bathroom":false}]',
  'live', 1
);

INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a7f8d-cb6b-11f1-a6f1-8c04ba146d31',
  'Fatima Block Girls Hostel',
  'CUI Wah Student Affairs',
  'Campus Hostel', 'Girls', 60, 13000, '5 min walk',
  '+92-51-9272614',
  '["WiFi","Mess","Security","CCTV","Generator","Lounge","Study Room","Prayer Room"]',
  '[{"room_type":"Double","monthly_rent":13000,"included_meals":"Breakfast + Dinner","attached_bathroom":false}]',
  'live', 1
);

-- ── Sahiwal Campus ───────────────────────────────────────────────────────
INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a8167-cb6b-11f1-a6f1-8c04ba146d31',
  'Farabi Boys Hostel',
  'CUI Sahiwal Warden Office',
  'Campus Hostel', 'Boys', 70, 9500, 'On-Campus',
  '+92-40-9200100',
  '["WiFi","Mess","Security","CCTV","Generator","Lounge","Study Room","Parking"]',
  '[{"room_type":"Double","monthly_rent":12000,"included_meals":"Mess available","attached_bathroom":false},{"room_type":"Triple","monthly_rent":9500,"included_meals":"Mess available","attached_bathroom":false}]',
  'live', 1
);

INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a8167-cb6b-11f1-a6f1-8c04ba146d31',
  'Khadija Block Girls Hostel',
  'CUI Sahiwal Warden Office',
  'Campus Hostel', 'Girls', 50, 12000, 'On-Campus',
  '+92-40-9200100',
  '["WiFi","Mess","Security","CCTV","Generator","Lounge","Study Room"]',
  '[{"room_type":"Double","monthly_rent":12000,"included_meals":"Mess available","attached_bathroom":false}]',
  'live', 1
);

-- ── Vehari Campus ────────────────────────────────────────────────────────
INSERT INTO campus_hostels
  (id, campus_id, name, vendor_name, hostel_type, gender, rooms, rent_min, walk_dist, contact, amenities, rooms_detail, status, hostel_available)
VALUES (
  UUID(), 'ab2a8220-cb6b-11f1-a6f1-8c04ba146d31',
  'Ayesha Block Girls Hostel',
  'CUI Vehari Management',
  'Campus Hostel', 'Girls', 40, 9500, 'On-Campus',
  '+92-67-3001606',
  '["WiFi","Mess","Security","CCTV","Generator","Prayer Room","Lounge"]',
  '[{"room_type":"Double","monthly_rent":9500,"included_meals":"Mess available","attached_bathroom":false}]',
  'live', 1
);

-- Verify results
SELECT
  c.name AS campus_name,
  (SELECT COUNT(*) FROM campus_hostels ch WHERE ch.campus_id = c.id AND ch.status = 'live') AS hostels_live,
  (SELECT COUNT(*) FROM campus_facilities cf WHERE cf.campus_id = c.id) AS facilities_row,
  CASE WHEN c.scholarships IS NOT NULL THEN 'YES' ELSE 'NO' END AS scholarships_set
FROM campuses c
WHERE c.university_id = 'f3f5dbc5-cf02-451a-86e1-d468921720f0'
ORDER BY c.is_main DESC, c.name;
