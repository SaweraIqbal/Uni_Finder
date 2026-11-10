-- Additive missing-data patch generated from the four university JSON datasets.
-- Apply after importing uni_finder.sql into the matching Uni Finder schema.
-- Idempotent inserts use stable IDs and NOT EXISTS checks; existing non-empty values are preserved.
-- Populated conflicts (including reported campus/rank discrepancies) are intentionally not overwritten.
-- Data without a compatible column/table is not added. UOL images without campus mappings are stored
-- in university_images, with their category prefixed to the caption.
-- New hostel rows are marked live, consistent with verified source records in the dump.
-- The superseded UOL Islamabad listing is excluded; its own JSON note says it now operates independently.
-- Society initials longer than the schema's VARCHAR(4) are shortened to four characters.

START TRANSACTION;

UPDATE `universities` SET `employment_rate` = CASE WHEN `employment_rate` IS NULL OR CAST(`employment_rate` AS CHAR) = '' THEN 'Not publicly disclosed' ELSE `employment_rate` END, `partner_countries` = CASE WHEN `partner_countries` IS NULL OR CAST(`partner_countries` AS CHAR) = '' THEN 'Not publicly disclosed' ELSE `partner_countries` END WHERE `id` = 'bdbf8537-15f0-46fa-b5e8-6eb2680fc0f8';

INSERT INTO `campuses` (`id`, `university_id`, `name`, `city`, `address`, `phone`, `email`, `office_hours`, `is_main`, `hostel_available`)
SELECT '5369ef00-ec47-54ab-8a64-03a1458c9bdc', 'bdbf8537-15f0-46fa-b5e8-6eb2680fc0f8', 'Karachi City', 'Karachi', 'Level 5, Park Tower, Scherezade Mall, 19-B, Scheme No. 5, KDA Chowk, Off Sunset Boulevard, Defence Phase-V, Karachi', 'UAN: +92-21-111-128-128 (Extension: 3200)', 'admissions.khi@nu.edu.pk', 'Mon-Fri: 8:00 AM - 4:00 PM (UG); 5:00 PM - 9:00 PM (Graduate)', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campuses` WHERE `university_id` = 'bdbf8537-15f0-46fa-b5e8-6eb2680fc0f8' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Karachi City')));

UPDATE `university_profiles` SET `established_year` = CASE WHEN `established_year` IS NULL OR CAST(`established_year` AS CHAR) = '' THEN 1999 ELSE `established_year` END, `about_text` = CASE WHEN `about_text` IS NULL OR CAST(`about_text` AS CHAR) = '' THEN 'At The University of Lahore, we prioritise your academic journey, offering world-class education, supportive environment, and opportunities to grow academically and personally. Your success drives our commitment to innovation, excellence, and community impact. To become a world-class university characterised by its excellence and contribution to society through 21st CENTURY SKILLED Education, Research, Entrepreneurship, and Internationalisation. The University of Lahore strives to achieve the following mission goals in pursuance of UOL vision: Produce graduates to become ready leaders through lifelong learning experience. Improve sustainability of the ecosystem which is vital for ensuring social and environmental wellbeing of society. Pursue and deliver academic excellence in every aspect of our endeavours. Reinforce the culture of research, innovation and commercialisation. Promote global flow of ideas, students and scholars through comprehensive internationalisation.' ELSE `about_text` END, `mission_statement` = CASE WHEN `mission_statement` IS NULL OR CAST(`mission_statement` AS CHAR) = '' THEN 'The University of Lahore strives to achieve the following mission goals in pursuance of UOL vision: Pursue and deliver academic excellence in every aspect of our endeavours. Produce graduates to become future ready leaders through lifelong learning experience. Reinforce the culture of research, innovation and commercialisation. Improve sustainability of the ecosystem which is vital for ensuring social and environmental wellbeing of society. Promote global flow of ideas, students and scholars through comprehensive internationalisation.' ELSE `mission_statement` END, `website_url` = CASE WHEN `website_url` IS NULL OR CAST(`website_url` AS CHAR) = '' THEN 'https://uol.edu.pk' ELSE `website_url` END, `admissions_email` = CASE WHEN `admissions_email` IS NULL OR CAST(`admissions_email` AS CHAR) = '' THEN 'admissions@uol.edu.pk' ELSE `admissions_email` END, `admissions_phone` = CASE WHEN `admissions_phone` IS NULL OR CAST(`admissions_phone` AS CHAR) = '' THEN '+92-42-111-865-865' ELSE `admissions_phone` END WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b';INSERT INTO `campuses` (`id`, `university_id`, `name`, `campus_type`, `city`, `province`, `address`, `description`, `phone`, `gender_policy`, `intake_name`, `is_main`, `shift_morning`, `shift_evening`, `shift_weekend`, `lat`, `lng`)
SELECT '8bf0ddea-e75e-506d-9b3d-9d68096e86ea', '602cc750-7a7e-4151-8525-a0680dcab56b', 'The University of Lahore – Gujrat (Chenab) Campus', 'Sub-Campus', 'Gujrat', 'Punjab', 'G.T. Road, adjacent Chenab Bridge, Gujrat, Punjab, Pakistan', 'Located in Gujrat, this campus serves students in the region offering programs across multiple disciplines. The city is also home to the University of Chenab (UChenab), which was founded in 2021 as a separate HEC-recognized private university.', '+92-53-111-243-622', 'Coeducational', 'Fall 2026', 0, 1, 0, 0, 32.5734, 74.0819 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campuses` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND LOWER(TRIM(`name`)) = LOWER(TRIM('The University of Lahore – Gujrat (Chenab) Campus')));

INSERT INTO `campus_facilities` (`campus_id`, `selected_ids`)
SELECT '5369ef00-ec47-54ab-8a64-03a1458c9bdc', 'library,medical' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_facilities` WHERE `campus_id` = '5369ef00-ec47-54ab-8a64-03a1458c9bdc');

INSERT INTO `campus_facilities` (`campus_id`, `selected_ids`, `transport_routes`)
SELECT '8bf0ddea-e75e-506d-9b3d-9d68096e86ea', 'mosque,career_office,library,lab,cafeteria,parking,sports_grounds,wifi', '[]' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_facilities` WHERE `campus_id` = '8bf0ddea-e75e-506d-9b3d-9d68096e86ea');

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '0b365ddd-c888-578a-9e47-39a361119ab5', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Safe Society', 'Social Service', 'Safe Society''s primary objective is to serve as a public service message delivery forum for the student community.', 'SS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Safe Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '1d01d23f-d8db-57ea-b1e8-c9db42eea1b0', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Law Society', 'Academic & Professional', 'The objective of this society is an association of future lawyers with a regulatory framework.', 'LS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Law Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '867a0ed6-1c0d-5d98-8f32-0802b774290f', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Baluchistan Initiative Society', 'Social Service', 'The objective of Baluchistan initiative society to engage in activities that raise awareness about Balochistan.', 'BIS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Baluchistan Initiative Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'd1f8bbdb-eca2-56f4-9a22-f108ddfa0c49', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Imperial Pharmaceutical Society', 'Professional', 'The objective of Imperial Pharmaceutical Society is to give students a platform to explore pharmaceutical sciences.', 'IPS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Imperial Pharmaceutical Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '26d29abe-0527-5e67-8f1f-fde0813821a1', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Economic Society', 'Academic & Professional', 'The objective of this society is to provide guidance to students in choosing career pathways.', 'ES' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Economic Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '611cc50f-7557-5393-9e87-4cf6dde47cfb', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Electronic Society', 'Technical', 'The objective of this society is to provide the students with opportunities to explore electronics and engineering.', 'ES' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Electronic Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'c41abfe7-1600-5023-bc04-c13e533adffc', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Society of Computer Sciences and Software Engineering', 'Technical', 'The main objective of the society is to help the developers in the revolutionary field of computer science and software engineering.', 'CSSE' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Society of Computer Sciences and Software Engineering')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '20a8cd2a-39c6-5c12-a4ce-e1276492bf9e', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'The Film Talkies', 'Fine Arts', 'The objective of the society is to screen the best films from all over the world and promote cinema culture.', 'TFT' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('The Film Talkies')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '0e8cd272-2ef8-5afc-8049-3fdbbb385c07', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Volunteer Force against Hepatitis Transmission (VFAHT)', 'Health & Wellbeing', 'Viral hepatitis is a global health problem affecting millions of people. This society aims to raise awareness and combat hepatitis.', 'VFAH' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Volunteer Force against Hepatitis Transmission (VFAHT)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '0cf1bdc7-9f1f-595d-8d0d-56b9e688ff6a', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Hello Africa', 'Cultural', 'The objective of this society is to gather all African students at one platform, fostering cultural exchange and integration.', 'HAS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Hello Africa')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '4066b5f0-fe06-59d5-b81d-19d126a33994', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Dead Arts Society', 'Fine Arts', 'The Dead Arts Society takes inspiration from the famous Robin Williams'' Dead Poets Society, promoting arts and literature.', 'DAS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Dead Arts Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'eb4fa9f4-3b06-5bf6-8c4c-c6985df5a40c', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Electrical Control and Engineering Society', 'Technical', 'The society of ECES is a student governed body that ensures that co-curricular activities related to electrical engineering thrive.', 'ECES' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Electrical Control and Engineering Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '51d94498-3e97-56a9-827e-23508dbda68a', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Dramatics Club', 'Fine Arts', 'The objectives of UOL Dramatics Club are to make people laugh with us and to put up quality theatrical performances.', 'DC' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Dramatics Club')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '71614a6a-f27d-5e3c-b997-d17558dab10f', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Care Foundation (UOL Chapter)', 'Social Service', 'The objective is to create awareness of marketable education to the underprivileged sections of society.', 'CFS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Care Foundation (UOL Chapter)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '189da2d9-065e-58a0-80a1-234e920c04e4', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Institute of Electrical and Electronics Engineers (IEEE UOL Chapter)', 'Professional', 'IEEE is a not-for-profit organization with the core purpose to foster technological innovation and excellence.', 'IEEE' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Institute of Electrical and Electronics Engineers (IEEE UOL Chapter)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'e09944da-1fdc-552d-9749-de267a37607b', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Debating Society', 'Academic & Professional', 'The primary objective of the Debating Society is to give rise to future speakers and debaters.', 'DS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Debating Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '46d41499-8261-51cb-902c-a7a68e303eb3', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Civil Engineering Society', 'Technical', 'The objective of Civil Engineering Society is aligned with the objective of promoting civil engineering education.', 'CES' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Civil Engineering Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'deb7ff2e-685a-54ef-88b5-7e12c9e30a61', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'VCAN Society', 'Social Service', 'Voices for Children''s Aspirations and Needs society aims to advocate for children''s rights and education.', 'VCAN' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('VCAN Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '63d96fd8-226d-5d43-881e-ec661bc7ab92', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'International Federation of Medical Student''s Association (IFMSA)', 'Professional', 'The objective of the society is to increase awareness of humanitarian global health issues among medical students.', 'IFMS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('International Federation of Medical Student''s Association (IFMSA)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'feb57305-22e9-50a0-b41f-7c3ddbff65b8', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Society of Life Sciences', 'Academic & Professional', 'The society of Life Sciences aims to provide a platform for the students to explore life sciences research and applications.', 'SLS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Society of Life Sciences')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'd9ce4dcc-52d2-5e23-b760-1c5164d6fe4b', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Anti-Narcotics Society', 'Social Service', 'Anti Narcotics Society aims in educating youth about the harmful effects of drugs and promoting a drug-free lifestyle.', 'ANS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Anti-Narcotics Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '9df56845-6d2b-5f3b-ae69-c75e228eb60c', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Pyaam Society', 'Cultural', 'The objective of Pyaam Society is to understand keen realities of life through the lens of Urdu literature and poetry.', 'PS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Pyaam Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'efd71472-c673-5a7b-889b-fae641ebab1c', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Robotech Society', 'Technical', 'Our main objective is to enhance technical knowledge of students through robotics and automation projects.', 'RS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Robotech Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'cdd9f35a-55ef-57ea-a0bc-db309707ff08', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'American Society of Mechanical Engineering (ASME UOL Chapter)', 'Professional', 'American Society of Mechanical Engineering (ASME) is a not-for-profit organization fostering mechanical engineering innovation.', 'ASME' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('American Society of Mechanical Engineering (ASME UOL Chapter)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '1549c2d7-7bad-5aba-91a2-10539dcd9c11', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Search and Rescue Club', 'Social Service', 'UOL Search and Rescue club''s mandate is to increase awareness about social responsibility and community service.', 'SAR' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Search and Rescue Club')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '03b17f76-f41f-5347-a970-dfa8d2ee17c9', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Hult Prize (UOL Chapter)', 'Entrepreneurship', 'The Hult Prize is an inspiring movement with a global vision of empowering students to solve the world''s most pressing problems.', 'HP' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Hult Prize (UOL Chapter)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '698102de-e38a-5584-a817-470a6c7636de', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Character Building Society', 'Social Service', 'The CBS endeavors to infuse students with a deep sense of morals, honest living, and human values.', 'CBS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Character Building Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '5f6b99f2-210a-5867-93ab-8a118068716e', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Gaming & Networking Society', 'Technology', 'UOL Gaming Society is dedicated to bring the gamers of the University of Lahore together on a common platform.', 'GNS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Gaming & Networking Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '7c740fe1-c5df-5ac1-b449-a770796111d9', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Microsoft Student Partner', 'Technology', 'MSP''s objective is to empower every person and organization to achieve and learn through Microsoft technologies.', 'MSP' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Microsoft Student Partner')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '1263887f-cd91-5396-85f0-e795cb93164a', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Unsaid Words', 'Fine Arts', 'The objective of this society is to give a platform for expression for students interested in creative writing and poetry.', 'UW' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Unsaid Words')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '2d40a7f7-ade6-542f-a2c0-b95c77409f8a', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Model OIC Club', 'Academic & Professional', 'The objective of this society is to promote dialogue among students from diverse backgrounds simulating OIC proceedings.', 'MOIC' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Model OIC Club')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '995eb0d6-8b8c-5849-a482-21807e4d6bfd', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Pakistan Children Heart Foundation (PCHF UOL Chapter)', 'Health & Wellbeing', 'PCHF UOL CHAPTER has been helping deserving children with Congenital Heart Defects access life-saving surgeries.', 'PCHF' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Pakistan Children Heart Foundation (PCHF UOL Chapter)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '02c8eaff-cf60-5752-8f89-ad2893f73c00', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Student Focus (UOL Chapter)', 'Academic & Professional', 'The objective of the society is to maximize opportunities for people to engage in meaningful academic discourse.', 'SF' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Student Focus (UOL Chapter)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'f9ca0949-e9a3-589f-8f1f-2ca11e72b4f6', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Physics Forum', 'Academic & Professional', 'The objective of Physics forum is to create awareness about advancement in the field of physics.', 'PF' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Physics Forum')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '543e2bf8-c1b5-51ad-b521-e0c5ca7dba91', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Society of International Affairs', 'Cultural', 'The objective of International Affairs society is to increase awareness about international relations and global affairs.', 'SIA' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Society of International Affairs')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '6507d78e-4361-59f6-8608-71cd86f251f8', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Islamic Society', 'Religious', 'The objective of Islamic society is to bring people back to their actuality and strengthen Islamic values among students.', 'IS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Islamic Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'c9f47c56-1f23-5e92-a696-8eadccaacbe7', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'LB-IETS', 'Academic & Professional', 'The objective of Lb-ites society is to engage students of the Lahore Business School in extracurricular activities.', 'LB-I' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('LB-IETS')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '7a423e27-a9b3-5233-96e3-d1ca76072f2c', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Photography Society', 'Fine Arts', 'The objective of Photography Society is to provide every possible platform for students to explore photography.', 'PS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Photography Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'f7d908b7-8ebd-57fa-955f-9f239f72918d', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Mechanical Engineering Society', 'Technical', 'The objective of this society is to provide a platform for the students of Mechanical Engineering to excel.', 'MES' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Mechanical Engineering Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '5e164bd5-8ee2-5294-bde6-7c93aa68f0f8', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Chemical Society', 'Academic & Professional', 'The objective of this society is to promote departmental students by gathering and distributing chemical knowledge.', 'CS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Chemical Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '42e99b7d-8bcb-568d-afc4-a1f31bfdc619', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Al Biruni - Society of Mathematics', 'Academic & Professional', 'The objective of Al Biruni society are aimed to advance mathematical knowledge and promote mathematics education.', 'ABSM' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Al Biruni - Society of Mathematics')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '30e0df08-b1f4-59e5-9890-0105395b5ffd', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Society of Health and Nutrition Awareness', 'Health & Wellbeing', 'The aim of SHNA society is to spread awareness regarding health and nutrition to the student community.', 'SHNA' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Society of Health and Nutrition Awareness')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '7c3e0b80-c7fd-5c22-b238-0214c9d86e33', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Sports Society', 'Sports', 'The objective of sports society is to provide recreational as well as competitive sports opportunities to students.', 'SPT' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Sports Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '917c8eba-39c5-5a51-b61a-66701a3d0beb', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Computer Engineering Society', 'Technical', 'The objective of this society is to provide a platform for computer engineering students to collaborate and innovate.', 'CES' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Computer Engineering Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'ca3b33d7-7a17-5b46-bf01-9b9cc7ed294e', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Blood Donation Society', 'Health & Wellbeing', 'The objective of this society is to help patients in critical condition by arranging blood donation drives.', 'BDS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Blood Donation Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'e0c21775-bea2-586e-8a32-a0d23455b55d', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Entrepreneur Society', 'Entrepreneurship', 'The UOL Entrepreneur''s Society (UOLES) aims to create opportunities for students interested in entrepreneurship and innovation.', 'ES' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Entrepreneur Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'ac95e132-81ea-5f98-97b0-2a3513c426c6', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Techno Club', 'Technology', 'The objective of techno club is the provision of a healthier platform for students interested in technology and innovation.', 'TC' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Techno Club')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '559f6db6-8e42-57f6-b0c4-9554ac131cef', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Young Peace and Development Corps (YPDC UOL Chapter)', 'Social Service', 'Young Peace and Development Corps aims to bridge the gap between youth-key stakeholders for peace and development.', 'YPDC' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Young Peace and Development Corps (YPDC UOL Chapter)')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '8cabbba3-1962-52ba-a9ac-6148a8e3e505', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'NISA Society', 'Social Service', 'Nisa society''s objective is to provide exposure and mentorship to the female students of the university.', 'NISA' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('NISA Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'a96a0f81-3f3d-52d2-948d-1cb1d63ae054', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Art and Culture Society', 'Cultural', 'The objective of Art and culture society is providing members a creative outlet and promoting cultural awareness.', 'ACS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Art and Culture Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT 'df7ce0d8-946d-5923-a2bb-5cc0439df9aa', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Kashmir Initiative Society', 'Social Service', 'The objective of KIS UOL is to create awareness of issues faced by Kashmir and support the Kashmiri community.', 'KIS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Kashmir Initiative Society')));

INSERT INTO `campus_societies` (`id`, `campus_id`, `name`, `category`, `description`, `initials`)
SELECT '688c2145-7fb2-5b16-92d1-d7284b88acb1', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Media Society', 'Media & Journalism', 'The objective of the Media Society is to encourage the students to explore careers in media and journalism.', 'MS' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_societies` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Media Society')));

INSERT INTO `campus_hostels` (`id`, `campus_id`, `name`, `vendor_name`, `hostel_type`, `gender`, `rooms`, `walk_dist`, `status`, `amenities`, `rooms_detail`, `contact`, `hostel_available`)
SELECT '4e299a0f-4f1e-54f7-b319-243126e3f163', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Razia Hall', 'The University of Lahore', 'Campus Hostel', 'Female', 190, 'On-campus', 'live', '["wifi","mess","ac","geyser","cctv","security","generator","parking","prayer_room"]', '[{"room_type":"Quad Sharing","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null},{"room_type":"Bi-Seater","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null},{"room_type":"Tri-Seater","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null},{"room_type":"Seven-Bed","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null}]', '+92-42-111-865-865', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_hostels` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Razia Hall')));

INSERT INTO `campus_hostels` (`id`, `campus_id`, `name`, `vendor_name`, `hostel_type`, `gender`, `rooms`, `walk_dist`, `status`, `amenities`, `rooms_detail`, `contact`, `hostel_available`)
SELECT 'd69613d2-efa8-55e2-ab38-3ef3edf46716', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Fatima Hall', 'The University of Lahore', 'Campus Hostel', 'Female', 73, 'On-campus', 'live', '["wifi","mess","ac","geyser","cctv","security","generator","parking","prayer_room"]', '[{"room_type":"Quad Sharing","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null}]', '+92-42-111-865-865', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_hostels` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Fatima Hall')));

INSERT INTO `campus_hostels` (`id`, `campus_id`, `name`, `vendor_name`, `hostel_type`, `gender`, `rooms`, `walk_dist`, `status`, `amenities`, `rooms_detail`, `contact`, `hostel_available`)
SELECT 'aecedc2e-6963-507b-bc05-b05706e6d4b3', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'UCMD Boys'' Hostel', 'The University of Lahore', 'Campus Hostel', 'Male', 75, 'Adjacent to Main Campus (UCMD block)', 'live', '["wifi","mess","ac","geyser","cctv","security","generator","parking","prayer_room"]', '[{"room_type":"Quad Sharing","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null},{"room_type":"Six-Bed","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null}]', '+92-42-111-865-865', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_hostels` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('UCMD Boys'' Hostel')));

INSERT INTO `campus_hostels` (`id`, `campus_id`, `name`, `vendor_name`, `hostel_type`, `gender`, `rooms`, `walk_dist`, `status`, `amenities`, `rooms_detail`, `contact`, `hostel_available`)
SELECT 'd677a571-647e-5e66-92dc-28272536fe28', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Kulsoom Hall', 'The University of Lahore', 'Off-Campus Hostel', 'Female', 119, '1 km from campus', 'live', '["wifi","mess","ac","geyser","cctv","security","generator","parking","prayer_room"]', '[{"room_type":"Quad Sharing","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null},{"room_type":"Six-Bed","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null}]', '+92-42-111-865-865', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_hostels` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Kulsoom Hall')));

INSERT INTO `campus_hostels` (`id`, `campus_id`, `name`, `vendor_name`, `hostel_type`, `gender`, `rooms`, `walk_dist`, `status`, `amenities`, `rooms_detail`, `contact`, `hostel_available`)
SELECT 'dcaf85ff-61ea-5e22-bb74-1fb322e7e891', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'Shahida Hall', 'The University of Lahore', 'Off-Campus Hostel', 'Female', 129, 'Opposite Kulsoom Hall', 'live', '["wifi","mess","ac","geyser","cctv","security","generator","parking","prayer_room"]', '[{"room_type":"Quad Sharing","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null}]', '+92-42-111-865-865', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_hostels` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Shahida Hall')));

INSERT INTO `campus_hostels` (`id`, `campus_id`, `name`, `vendor_name`, `hostel_type`, `gender`, `rooms`, `walk_dist`, `status`, `amenities`, `rooms_detail`, `contact`, `hostel_available`)
SELECT '5486c713-875a-536f-9a26-e6bb53f4662b', '75793bc5-6b90-41b0-8204-93e1d50b7fea', 'University Villas', 'The University of Lahore', 'Off-Campus Hostel', 'Female', 70, 'Green Acres, within walking distance', 'live', '["wifi","mess","ac","geyser","cctv","security","generator","parking","prayer_room"]', '[{"room_type":"Quad Sharing","monthly_rent":null,"included_meals":"Breakfast + Dinner","attached_bathroom":null}]', '+92-42-111-865-865', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `campus_hostels` WHERE `campus_id` = '75793bc5-6b90-41b0-8204-93e1d50b7fea' AND LOWER(TRIM(`name`)) = LOWER(TRIM('University Villas')));

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'bc635044-55e9-57ab-a298-704a761ebb53', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/06/Frame-1639.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/06/Frame-1639.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'd0ab43b1-384b-55d2-a402-77dff0f266a3', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2026/09/IQ-Digital-1920x1080-Web-1.webp', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2026/09/IQ-Digital-1920x1080-Web-1.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'edabcad5-a336-5664-a6f5-bb13b080efba', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/DSC00232-Copy-copy.jpg', 'Campus Life' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/DSC00232-Copy-copy.jpg');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'bef0be9f-2742-513e-a7d4-2602b795cce5', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/1E1A1793.jpg', 'Campus Life' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/1E1A1793.jpg');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '8a58f2e4-8d07-57c0-bf76-66793d1558fc', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/1E1A0061.jpg', 'Campus Life' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/1E1A0061.jpg');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'cd490ef3-998b-519c-a65a-45c1e754e94d', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/WhatsApp-Image-2024-09-26-at-1.33.51-PM.jpg', 'Campus Life' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/WhatsApp-Image-2024-09-26-at-1.33.51-PM.jpg');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '84142dd0-de6b-50da-9b02-35ad594dcb6f', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/DSC00637-Final-1.jpg', 'Campus Life' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/DSC00637-Final-1.jpg');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '8b5865d3-b089-51b4-84ab-931e8547c9b6', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/DSC09875.jpg', 'Campus Life' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/DSC09875.jpg');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '33c85e95-6b8d-550d-b58a-f52b323ca42a', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/image-8.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/image-8.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'aa60fb2a-c188-5630-ae84-24f472e3fa21', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/image-1-1-1.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/image-1-1-1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '652dca87-e216-5a58-9274-63d3a87588be', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/image-2-1.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/image-2-1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '51890f5f-45f9-5e06-8065-a87ee85ef15c', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/image-7-1.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/image-7-1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '277dec13-533d-56d2-bdfd-8cc563041c9d', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/image-3-1.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/image-3-1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '0ea802fb-9e8a-537d-8d67-90872fb8b992', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/image-4-1.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/image-4-1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'a8730bde-3875-59ed-8570-a2cfd2a6a52f', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/image-5-1.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/image-5-1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'a0cef040-8664-5521-87fc-4f25da05e491', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/image-6-1.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/image-6-1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '67d2a496-6c03-50c9-a742-e651883128ef', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/unnamed-file.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/unnamed-file.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '5e372d37-4a6f-5f28-a5d5-44ee7aab9ec6', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/12/DSC007172-21-1-3.webp', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/12/DSC007172-21-1-3.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '6ad88be9-e5ad-589b-b7c2-63fbd80dcea7', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/12/Mask-group-1.webp', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/12/Mask-group-1.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '82118681-8ea7-5af9-bbc1-8a7e37853b71', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/12/DSC007172-21-1-1-1024x739.webp', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/12/DSC007172-21-1-1-1024x739.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '2bc06385-6d80-5a12-b54b-4b048749ce8a', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/08/file-3.webp', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/08/file-3.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '4c326d58-0b0e-5f0c-b6fb-31e3e0e0c0f4', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/1.png', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'cfc3cb1e-c452-50b7-8527-31e5c9d8fca4', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/08/UI-green-metric.webp', 'Awards: UI Green Metric Award' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/08/UI-green-metric.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '8ad90ae7-d280-57e5-a0c5-9892945a875f', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/08/image-177-1.webp', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/08/image-177-1.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'e77dc846-ee1c-519b-8695-ef25166d7033', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/12/Rector.webp', 'Leadership: Rector, University of Lahore' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/12/Rector.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '110d6c09-34e0-56f8-ab2a-9a7fbbc672b5', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/12/uol-strategy.webp', 'Campus Building: UOL Strategic Plan' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/12/uol-strategy.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '0d1c3724-9701-5923-8d07-7cd238c21af1', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/1999-Main.webp', 'History: UOL History - 1999' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/1999-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '5d79d49c-dc02-54ae-83d5-07eec37b6337', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2002-Main.webp', 'History: UOL History - 2002' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2002-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '503539e0-dd45-5ea8-916b-82aad8768b6a', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2003-Main.webp', 'History: UOL History - 2003' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2003-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '21d30d15-d210-5b55-a024-5b42cf5353fa', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2005-Main.webp', 'History: UOL History - 2005' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2005-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '75918f5c-dbcf-5553-ae27-b3e6b60bc4dc', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2006-Main.webp', 'History: UOL History - 2006' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2006-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'e435e161-5755-5c0b-9202-38de15b76273', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2007-Main.webp', 'History: UOL History - 2007' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2007-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'a77fb36c-9b72-50d2-b943-8a12ab36b53a', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2008-Main.webp', 'History: UOL History - 2008' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2008-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'dee8dfac-48e0-5447-8d96-98c359640abb', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2009-Main.webp', 'History: UOL History - 2009' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2009-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'b51117c5-1586-5497-a16d-216afd5aa0c9', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2010-Main.webp', 'History: UOL History - 2010' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2010-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '2dcc8744-7eb0-551d-abfb-cd75ffc45e5b', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2012-Main.webp', 'History: UOL History - 2012' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2012-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'abd3447e-7e1f-54c7-9a30-dd1b3702a70f', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2014-Main.webp', 'History: UOL History - 2014' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2014-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '1520003f-775a-5e8b-a60f-1953f81fefb9', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2015-Main.webp', 'History: UOL History - 2015' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2015-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '3090369c-75c2-5d6e-b1a2-63b187febf22', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2017-Main.webp', 'History: UOL History - 2017' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2017-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '0f195c56-0d54-59a6-a19c-2ad63d1c1823', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2018-Main.webp', 'History: UOL History - 2018' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2018-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'e018a3b1-d4cf-55bc-aefa-7737d76694d2', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2019-Main.webp', 'History: UOL History - 2019' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2019-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'c92fdbdb-83a7-5bd0-80ee-3711fe9b7990', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2020-Main.webp', 'History: UOL History - 2020' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2020-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'be285373-3ee3-535e-80e7-2e7432df3d1f', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2021-Main.webp', 'History: UOL History - 2021' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2021-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'dcb8bd9a-1cf6-5ffa-8165-2e88016ecd68', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2022-Main.webp', 'History: UOL History - 2022' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2022-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '649e0ed4-1bcc-5432-a9e5-29a6f9374bef', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2023-Main.webp', 'History: UOL History - 2023' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2023-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'a0957898-c799-52f5-8021-867fbedf648f', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2024-Main.webp', 'History: UOL History - 2024' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2024-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'f239ff45-4056-50ee-a21f-53d8c5a452e8', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/11/2025-Main.webp', 'History: UOL History - 2025' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/11/2025-Main.webp');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT 'caace3c6-1764-5b6c-b0ce-dfed4863acf3', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uol.edu.pk/wp-content/uploads/2025/05/unnamed-1.png', 'History: UOL through the years' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uol.edu.pk/wp-content/uploads/2025/05/unnamed-1.png');

INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`)
SELECT '6a4fa9bd-3589-5e91-983e-4d980ebef2e6', '602cc750-7a7e-4151-8525-a0680dcab56b', 'https://uchenab.edu.pk/wp-content/uploads/2025/09/Website-v2-1536x975.webp', 'Campus Building' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `university_images` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND `image_url` = 'https://uchenab.edu.pk/wp-content/uploads/2025/09/Website-v2-1536x975.webp');



INSERT INTO `programs` (`id`, `university_id`, `name`, `degree_type`, `level`, `specialization`, `track`, `extra`, `original_name`, `status`, `created_via`)
SELECT '333b2c84-f45f-587d-9164-153eb314d728', '602cc750-7a7e-4151-8525-a0680dcab56b', 'Accounting and Finance', 'PhD', 'PhD', NULL, NULL, '{"level":"PhD","faculty":null,"duration":"3 years minimum","source_url":"https://uolcc.edu.pk/doctor-of-philosophy-in-accounting-and-finance/","semester_fee":51500,"annual_fee":103000,"admission_fee":25000,"total_degree_cost":849000,"credit_hours":35,"total_degree_cost_currency":"PKR","semester_fee_currency":"PKR","admission_fee_currency":"PKR","annual_fee_currency":"PKR","security_deposit":null,"min_qualification":null,"min_marks":null,"entrance_test_required":null,"entrance_test_type":null,"age_limit":null,"required_documents":null,"merit_criteria":null,"scholarships_available":null,"scholarship_types":null,"scholarship_eligibility":null,"available_shifts":null,"class_days":null,"class_timings":null,"delivery_mode":null,"seats_available":null,"labs_practical":null,"annual_fee_usd_range":null,"fee_note":"Fee Structure Fall 2026. Total includes 25,000 PKR registration fee.","total_degree_cost_note":null,"fee_source_url":"https://uol.edu.pk/wp-content/uploads/2026/06/Accountancy-Finance.pdf"}', 'PhD Accounting and Finance', 'approved', 'seed' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `programs` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Accounting and Finance')) AND `level` = 'PhD' AND COALESCE(`specialization`,'') = COALESCE(NULL,'') AND COALESCE(`track`,'') = COALESCE(NULL,''));

INSERT INTO `programs` (`id`, `university_id`, `name`, `degree_type`, `level`, `specialization`, `track`, `extra`, `original_name`, `status`, `created_via`)
SELECT 'acf2578d-927d-575b-9019-e4a64a5bdc3a', '602cc750-7a7e-4151-8525-a0680dcab56b', 'Applied Psychology', 'MS', 'MS', NULL, NULL, '{"level":"MS","faculty":null,"duration":"2 years","source_url":"https://lsbs.uol.edu.pk/course/master-of-philosophy-in-applied-psychology/","semester_fee":null,"annual_fee":null,"admission_fee":20000,"total_degree_cost":null,"credit_hours":null,"total_degree_cost_currency":"PKR","semester_fee_currency":null,"admission_fee_currency":"PKR","annual_fee_currency":null,"security_deposit":null,"min_qualification":null,"min_marks":null,"entrance_test_required":null,"entrance_test_type":null,"age_limit":null,"required_documents":null,"merit_criteria":null,"scholarships_available":null,"scholarship_types":null,"scholarship_eligibility":null,"available_shifts":null,"class_days":null,"class_timings":null,"delivery_mode":null,"seats_available":null,"labs_practical":null,"annual_fee_usd_range":null,"fee_note":"Not Available - Fee Structure Fall 2026 PDF not published","total_degree_cost_note":null,"fee_source_url":null}', 'MS Applied Psychology', 'approved', 'seed' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `programs` WHERE `university_id` = '602cc750-7a7e-4151-8525-a0680dcab56b' AND LOWER(TRIM(`name`)) = LOWER(TRIM('Applied Psychology')) AND `level` = 'MS' AND COALESCE(`specialization`,'') = COALESCE(NULL,'') AND COALESCE(`track`,'') = COALESCE(NULL,''));

COMMIT;
