
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `campus_images` WRITE;
/*!40000 ALTER TABLE `campus_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `campus_images` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `campus_programs` WRITE;
/*!40000 ALTER TABLE `campus_programs` DISABLE KEYS */;
/*!40000 ALTER TABLE `campus_programs` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `campus_verification` WRITE;
/*!40000 ALTER TABLE `campus_verification` DISABLE KEYS */;
/*!40000 ALTER TABLE `campus_verification` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `campuses` WRITE;
/*!40000 ALTER TABLE `campuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `campuses` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` (`id`, `recipient_uid`, `recipient_email`, `subject`, `body`, `type`, `is_read`, `created_at`) VALUES ('1ba8e405-7d18-463c-9279-ed61304f014b','4970113b-8008-44b5-b720-9f5de43fc53b','alihaider1235787@gmail.com','University Verification Approved ✅','Dear Ali Haider,\n\nCongratulations! Your university \"University of Lahore \" has been verified and approved.\nYou can now log in and access your University Dashboard to add your university details, images, and programs.\n\nRegards,\nUni Finder Team','university_approved',0,'2026-06-09 00:04:05'),('417981be-6f9a-429b-a2fa-1c7d09b1390d','b72660f9-26eb-42a0-9d13-41d4b185ce63','alihaider12345@gmail.com','University Verification Approved ✅','Dear Ali Haider,\n\nCongratulations! Your university \"University of Lahore \" has been verified and approved.\nYou can now log in and access your University Dashboard to add your university details, images, and programs.\n\nRegards,\nUni Finder Team','university_approved',0,'2026-06-09 09:59:27'),('9a850e2c-7706-41ad-8a9e-ec38c5956654','5d89be40-53e9-4e75-8aa7-43a01002921b','alihaider125787@gmail.com','University Verification Rejected ❌','Dear Ali Haider,\n\nWe\'re sorry to inform you that your verification request for \"University of Lahore \" was not approved.\n\nReason: due to illegal way\n\nPlease review the reason above, correct the issue, and submit your documents again.\n\nRegards,\nUni Finder Team','university_rejected',0,'2026-06-09 00:22:30'),('acf4dfc4-ff05-4d47-a84e-6af1dd97edf5','c2b25501-7aaa-4adc-a69d-93f76ed9f9b9','alihaider787@gmail.com','University Verification Rejected ❌','Dear Ali Haider,\n\nWe\'re sorry to inform you that your verification request for \"University of Lahore \" was not approved.\n\nReason: invalid\n\nPlease review the reason above, correct the issue, and submit your documents again.\n\nRegards,\nUni Finder Team','university_rejected',0,'2026-06-09 10:29:42');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `programs` WRITE;
/*!40000 ALTER TABLE `programs` DISABLE KEYS */;
/*!40000 ALTER TABLE `programs` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `student_profile` WRITE;
/*!40000 ALTER TABLE `student_profile` DISABLE KEYS */;
INSERT INTO `student_profile` (`std_id`, `user_uid`, `full_name`, `username`, `email`, `dob`, `age`, `cnic`, `address`, `gender`) VALUES ('08e08139-5cee-4a15-b72a-f5e6a3305524','783df36e-53be-4c59-811e-6d03ac43e8d3','Ali Haider','ali_backend raja','alihaider12345787@gmail.com','2026-05-06',20,'35202-6310048-6','abcd','Male'),('820983c5-9c13-4404-acc1-74c686756cd7','57fc791d-6651-4964-bf23-e05bb216873b','Ali ','superadmin','superadmin@unifinder.com','1899-11-27',45,'35202-6310048-6','hsbuyweuywe','Male');
/*!40000 ALTER TABLE `student_profile` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `student_signup` WRITE;
/*!40000 ALTER TABLE `student_signup` DISABLE KEYS */;
INSERT INTO `student_signup` (`id`, `name`, `username`, `email`, `password`, `role`, `avatar_url`) VALUES ('0612f4cf-717f-45e5-b401-404f4b36e1d9','Ali Haider','admin','alihaider1234577@gmail.com','$2b$10$51NlG3/jb35mPT0oKHmVQOb6Gf/c5jAqd4NBt22anfc2obYgZ5csm','student',NULL),('214b66cc-19b5-40a3-bca2-eee17693dd9e','Ali Haider','Alihaider786','alihaider1234@gmail.com','$2b$10$vAczxOKt2RopGly3Cq.kbuyDPcoNLPd4aaKsn5RcGv79TgvEVfn9u','university',NULL),('4970113b-8008-44b5-b720-9f5de43fc53b','Ali Haider','uni','alihaider1235787@gmail.com','$2b$10$FsGCOvlQ70GNRYBFPnfB5.iSCa8yEOmOSG6Ce3o7R7osvMqDpKDFm','university',NULL),('57fc791d-6651-4964-bf23-e05bb216873b','Ali ','superadmin','superadmin@unifinder.com','$2b$10$gNUxgVBf/Qy041DktMe/vOHsENSWaAvwowhSbajNumyONt3C309gS','admin','/uploads/1781348277571-burger3.JPG'),('5d89be40-53e9-4e75-8aa7-43a01002921b','Ali Haider','user-1','alihaider125787@gmail.com','$2b$10$QP5nevpa2rrHbhxWqVTdx.fNTOjk7mE5.cOPPbQ5xbG.uT.ehZBkC','university',NULL),('6023ef12-e913-440b-8620-08240c9b1aa2','sawera','sawera','saweraiqbal@gmail.com','$2b$10$QrOXazSaZWodu6Ie3VSacOOh51tlVWXBZjAsNZQPDn3fjumddiNqW','student',NULL),('62c9d96d-399e-439f-b4fb-7640187cdf85','Ali Haider','user-1','alihaider@gmail.com','$2b$10$DIifhIdUOz8ObLpDh.Cv9u20zQlSiDhLeCHPUZWs8PTW5Eydc8G16','university',NULL),('6be248ea-de92-4fe5-bce7-c0e2f7290bea','Ali Haider','48067','ali@gmail.com','$2b$10$dckxXwvOIkwOLq6StzlsR.FbzbQl0oL4xuWQUmmEMPuQpRYlY5RXy','student','/uploads/1781346578791-me.png'),('730498a8-527f-415d-80a0-61258a2f1d4f','Riphah','riphah','riphahuniversity@gmail.com','$2b$10$j7n9dB8QVlJJLzIUpulivu8W1VrNl/OZPEZ6m85X2B69LxLptxCeC','university',NULL),('783df36e-53be-4c59-811e-6d03ac43e8d3','Ali Haider','ali_backend raja','alihaider12345787@gmail.com','$2b$10$vv0x/EmlNJr.5qSQAtwe6eO2mh8dUXGnfvQ1k5AdTCVITdnSVgf4m','student','/uploads/1781348163510-Red_hacker.jpg'),('84adc8db-c61f-4695-b88f-b575d806e2ac','Ali Haider','Alihaider786','alihaider7@gmail.com','$2b$10$eKlsHYC9CxMup90Z1YFj.OYWEd/3/SFt85ocVgDi7w/eWIKl5GPEy','university',NULL),('a1b49190-ed99-4a1f-91e7-24f329ef9500','Ali Haider','Alihaider786','alihaider2345787@gmail.com','$2b$10$n6MLEJyjvPDvCZxN1DestOgcOqVc6ahx39kVsslk5/ffCAiyN2r/C','university',NULL),('b3f490e5-a60a-4445-88df-dd69bb29f78b','Ali Haider','Alihaider786','alihaider12347@gmail.com','$2b$10$7yuE7ni7f1fEQX9wN8.YoO9D25zKPjhxu2cwfpiNrAJjukvWwLvF6','university',NULL),('b72660f9-26eb-42a0-9d13-41d4b185ce63','Ali Haider','user-1','alihaider12345@gmail.com','$2b$10$Nit2uq/FgPBQujYxXmCn0ed0wuz9v/Qw1vczo4YvGj9IzI1JiFqo2','university','/uploads/1781348245058-burger1.JPG'),('beb08dc0-f5bd-4a39-be56-94c297d76b52','Ali Haider','Alihaider786','alihaider890@gmail.com','$2b$10$B4w95PoZcTdwsyQ79zbMXeDZdwDIqqwGz.UTMn5ikcj1qTZkxSxNG','student',NULL),('c2b25501-7aaa-4adc-a69d-93f76ed9f9b9','Ali Haider','Alihaider786','alihaider787@gmail.com','$2b$10$YMRykoJTLbm42KoZtQMswu2RKoUG.sawKAEeUBDV8hW7ERFzDiZoq','university',NULL),('c868fe58-3ff4-4aeb-9ad9-1c2b1bcd1e54','Ali Haider','haider','alihaider1234578@gmail.com','$2b$10$fj24vq/nr3OGEKMtbppxiO3JGChY8sqyLbITUDepgPjVGMkqbpC5W','student',NULL),('d0dfb6c1-969b-4451-bc53-d9730a0390e9','Ali Haider','48067','alihaider5787@gmail.com','$2b$10$XNUE2IOxsskiTXH1p4ddkurkPN1T9U7G.oCTiTkNvRQlXfHk9iSa2','university',NULL),('ef039ae6-bdac-4917-832a-a05ba2c5338e','Ali Haider','ali_backend_dev','alihaider57@gmail.com','$2b$10$XVz4od.3oU5vsPOsYY1vj.mIKMeHQtVrZwln6urtgOB5nICHpzrf6','university',NULL),('f2d9f3ff-a5fc-4658-8d79-449679b8abb0','Ali Haider','Alihaider786','alihaider1234787@gmail.com','$2b$10$1G1G9HfAv5TPPE2JcxnOZuG6FNXSZpeeC1c9C0g1VP.0ItuAg4J2q','university',NULL),('f6294f5e-5a4b-4086-99b0-f50c875466dd','Ali Haider','admin234','alihaider123457@gmail.com','$2b$10$zeSISBIys05YSllsK9Ntk.20KKvxfLP8EDbBZ7TmukvImwyjTvjLu','admin',NULL),('f9a9607b-f8d8-4552-a1fa-c2b961f8b6e3','Ali Haider','admin','haiderali380717@gmail.com','$2b$10$fnYJQVogEIaTSHjg75qUkeZF8hpr8eFm6AfUUGoMuPTRhTd/GNVga','admin',NULL),('ffcf1223-569f-4b4e-a895-f0cf66d491bf','Ali Haider','admin','alihaider1345787@gmail.com','$2b$10$GWE4NmBQJoUUo0atSBxXHOQZl0W6V0rGh/dbXPQj4k9S89ej1rJeq','university',NULL);
/*!40000 ALTER TABLE `student_signup` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `universities` WRITE;
/*!40000 ALTER TABLE `universities` DISABLE KEYS */;
INSERT INTO `universities` (`id`, `owner_uid`, `verification_id`, `name`, `description`, `logo_url`, `website`, `email`, `phone`, `city`, `address`, `established_year`, `created_at`, `updated_at`, `tagline`, `hero_subtitle`, `banner_url`, `about_title`, `about_text`, `mission`, `vision`, `ranking`, `ranking_label`, `students`, `employment_rate`, `partner_countries`, `total_campuses`) VALUES ('39ebd0b3-40cc-464c-80c3-b9d84637d5e3','b72660f9-26eb-42a0-9d13-41d4b185ce63','558d33f6-6661-4f6a-af72-352a9cdb43e2','Comsats','','/uploads/1780988652117-screen.png','https://github.com/Abcdali/uni-finder','alihaider12345787@gmail.com','3000380717','Lahore','hjbwhbchdw cjds cj','1999','2026-06-09 11:31:08','2026-06-09 13:34:00','Comsats ','Innovative learning, world-class research.','/uploads/1780988652133-COMSATS_University_Lahore_March_2024_Vis.jpg','A Legacy of Excellence','','To empower students through quality education.','To be a global leader in education.','120','HEC Ranked 2026','289,000+','92%','45+','6'),('563618b4-6783-441b-83a3-c21deac77405','4970113b-8008-44b5-b720-9f5de43fc53b','818a4dc2-d9a9-4e47-8064-fc5805b4f30d','University of Lahore','its a famous uni','/uploads/1780946343110-screen.png','https://github.com/Abcdali/uni-finder','alihaider12345787@gmail.com','3000380717','Lahore, Punjab','hjbwhbchdw cjds cj','1990','2026-06-09 00:17:22','2026-06-09 00:19:03',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `universities` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `university_images` WRITE;
/*!40000 ALTER TABLE `university_images` DISABLE KEYS */;
INSERT INTO `university_images` (`id`, `university_id`, `image_url`, `caption`, `created_at`) VALUES ('daad77aa-4006-4d0c-a886-a4339e3ea391','39ebd0b3-40cc-464c-80c3-b9d84637d5e3','/uploads/1780994152987-Dining_Centre__LUMS___Lahore___Paktive.jpg','lahore','2026-06-09 13:35:53');
/*!40000 ALTER TABLE `university_images` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `university_verification` WRITE;
/*!40000 ALTER TABLE `university_verification` DISABLE KEYS */;
INSERT INTO `university_verification` (`id`, `user_uid`, `university_name`, `registration_no`, `address`, `contact_no`, `hec_certificate_url`, `charter_certificate_url`, `accreditation_document_url`, `university_logo_url`, `status`, `reject_reason`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES ('03f21983-140e-4827-8aae-4b31911e7020','730498a8-527f-415d-80a0-61258a2f1d4f','riphah','78364781783','hjbwhbchdw cjds cj','03000380717','/uploads/1780994784473-Document_2.pdf','/uploads/1780994784487-Document_2.pdf','/uploads/1780994784491-Ali_Haider_CTI_Intern_CV.pdf','/uploads/1780994784491-Ali_Haider_48067__Quiz3.pdf','pending',NULL,NULL,NULL,'2026-06-09 13:46:24'),('2f337df0-57f5-464d-bc9e-f9381ad680b0','5d89be40-53e9-4e75-8aa7-43a01002921b','University of Lahore ','78364781783','hjbwhbchdw cjds cj','03000380717','/uploads/1780946512081-Document_2.pdf','/uploads/1780946512086-______________________.pdf','/uploads/1780946512090-1780945274310_48067_Assignment.docx','/uploads/1780946512091-1780945274317_Ali_Haider_CV.docx','rejected','due to illegal way','57fc791d-6651-4964-bf23-e05bb216873b','2026-06-09 00:22:30','2026-06-09 00:21:52'),('558d33f6-6661-4f6a-af72-352a9cdb43e2','b72660f9-26eb-42a0-9d13-41d4b185ce63','University of Lahore ','78364781783','hjbwhbchdw cjds cj','03000380717','/uploads/1780981099452-48067_Assignment.docx','/uploads/1780981099456-Ali__3_.pdf','/uploads/1780981099461-Ali__3_.pdf','/uploads/1780981099470-Ali__3_.pdf','approved',NULL,'57fc791d-6651-4964-bf23-e05bb216873b','2026-06-09 09:59:27','2026-06-09 09:58:19'),('818a4dc2-d9a9-4e47-8064-fc5805b4f30d','4970113b-8008-44b5-b720-9f5de43fc53b','University of Lahore ','78364781783','hjbwhbchdw cjds cj','03000380717','/uploads/1780945274310-48067_Assignment.docx','/uploads/1780945274310-Ali__3_.pdf','/uploads/1780945274313-Python_Intern.pdf','/uploads/1780945274317-Ali_Haider_CV.docx','approved',NULL,'57fc791d-6651-4964-bf23-e05bb216873b','2026-06-09 00:04:05','2026-06-09 00:01:14'),('d6693638-8af1-40fb-a034-a6a96a8447c0','c2b25501-7aaa-4adc-a69d-93f76ed9f9b9','University of Lahore ','78364781783','hjbwhbchdw cjds cj','03000380717','/uploads/1780982938007-Ali__3_.pdf','/uploads/1780982938008-48067_Assignment.pdf','/uploads/1780982938017-Ali__3_.pdf','/uploads/1780982938032-Ali__3_.pdf','rejected','invalid','57fc791d-6651-4964-bf23-e05bb216873b','2026-06-09 10:29:42','2026-06-09 10:28:58');
/*!40000 ALTER TABLE `university_verification` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

