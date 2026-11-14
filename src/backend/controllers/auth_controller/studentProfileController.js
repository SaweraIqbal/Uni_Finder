/**
 * studentProfileController.js
 * All CRUD handlers for the student profile v2.0.
 * user_uid is ALWAYS taken from req.user.id (JWT) — never from the request body.
 * CNIC and mobile are masked on read (display mode); unmasked only on /edit.
 * CNIC values are never logged.
 */

import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const q = (sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

/** Mask CNIC: show only last 4 digits — format: XXXXX-XXXXXXX-? */
const maskCnic = (cnic) => {
  if (!cnic) return null;
  const clean = String(cnic).replace(/\D/g, "");
  if (clean.length < 4) return "****";
  const last4 = clean.slice(-1); // only last digit of CNIC (5-7-1 format)
  return `XXXXX-XXXXXXX-${last4}`;
};

/** Mask mobile: show 03XX-XXXXX + last 2 digits */
const maskMobile = (mobile) => {
  if (!mobile) return null;
  const digits = String(mobile).replace(/\D/g, "");
  if (digits.length < 2) return "****";
  const last2 = digits.slice(-2);
  return `03XX-XXXXX${last2}`;
};

/**
 * Compute profile completeness %.
 * Uses weights defined in the shared config (replicated here to avoid ESM
 * cross-boundary import issues in the backend).
 */
const computeCompleteness = (profile, academicRecords, testScores, research,
  references, experience, preferences) => {

  const level = profile?.target_level || "BS";

  const scores = {};

  // Personal (25 pts)
  const personalFields = [
    "full_name", "father_name", "dob", "gender", "cnic",
    "nationality", "domicile_province", "domicile_district",
    "mobile", "address", "city", "photo_url", "cnic_doc_url",
  ];
  const personalDone = personalFields.filter((f) => profile?.[f]).length;
  scores.personal = Math.round((personalDone / personalFields.length) * 25);

  // Academic (30 pts)
  const requiredTypes = {
    ADP:   ["Matric", "Intermediate"],
    BS:    ["Matric", "Intermediate"],
    MS:    ["Matric", "Intermediate", "Bachelor"],
    MPhil: ["Matric", "Intermediate", "Bachelor"],
    PhD:   ["Matric", "Intermediate", "Bachelor", "MS_MPhil"],
  }[level] || ["Matric", "Intermediate"];

  const presentTypes = (academicRecords || []).map((r) => r.level_type);
  const academicDone = requiredTypes.filter((t) => presentTypes.includes(t)).length;
  scores.academic = Math.round((academicDone / requiredTypes.length) * 30);

  // Tests (10 pts)
  const requiredTests = { MS: "GAT General", MPhil: "GAT General", PhD: "GAT Subject" };
  const reqTest = requiredTests[level];
  if (reqTest) {
    const hasTest = (testScores || []).some((t) => t.test_type === reqTest);
    scores.tests = hasTest ? 10 : 0;
  } else {
    scores.tests = 10; // optional for ADP/BS
  }

  const isGrad = ["MS", "MPhil", "PhD"].includes(level);

  // Research (15 pts — only for MS/MPhil/PhD)
  if (isGrad) {
    let researchPts = 0;
    if (research?.research_interests) researchPts += 5;
    if (research?.sop_url) researchPts += 5;
    if (level === "PhD" && research?.proposal_url) researchPts += 5;
    else if (level !== "PhD") researchPts += 5; // not required
    scores.research = researchPts;
  } else {
    scores.research = 15; // not applicable — give full credit
  }

  // References (10 pts — only for MS/MPhil/PhD)
  if (isGrad) {
    const minRefs = { MS: 0, MPhil: 2, PhD: 2 }[level] || 0;
    const refCount = (references || []).length;
    scores.references = minRefs === 0 ? 10 : refCount >= minRefs ? 10 : 0;
  } else {
    scores.references = 10;
  }

  // Experience (5 pts)
  const cvRequired = ["MS", "MPhil", "PhD"].includes(level);
  if (cvRequired) {
    const hasCV = (experience || []).some((e) => e.entry_type === "cv");
    scores.experience = hasCV ? 5 : 0;
  } else {
    scores.experience = 5;
  }

  // Preferences (5 pts)
  scores.preferences = preferences ? 5 : 0;

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return { percentage: Math.min(total, 100), sections: scores };
};

// ── Profile ───────────────────────────────────────────────────────────────────

/** GET /api/student/profile  — masked view */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try JOIN first — returns full profile if Student_Profile row exists
    const rows = await q(
      `SELECT sp.*, ss.name, ss.username, ss.email AS signup_email, ss.avatar_url
       FROM Student_Profile sp
       JOIN Student_signup ss ON ss.id = sp.user_uid
       WHERE sp.user_uid = ?`,
      [userId]
    );

    if (rows.length) {
      const p = rows[0];
      return res.status(200).json({
        ...p,
        cnic:   maskCnic(p.cnic),
        mobile: maskMobile(p.mobile),
      });
    }

    // No Student_Profile row yet — return basic data from Student_signup
    // so the Summary Card still shows name/email on first visit
    const signupRows = await q(
      "SELECT id, name, username, email, avatar_url FROM Student_signup WHERE id=?",
      [userId]
    );
    if (!signupRows.length) return res.status(200).json(null);
    const s = signupRows[0];
    return res.status(200).json({
      user_uid:    userId,
      full_name:   s.name,
      username:    s.username,
      signup_email: s.email,
      avatar_url:  s.avatar_url,
      // All profile fields null — form will show empty
    });
  } catch (err) {
    console.error("[getProfile]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/student/profile/edit  — unmasked, for edit mode */
export const getProfileForEdit = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await q(
      `SELECT sp.*, ss.name, ss.username, ss.email AS signup_email, ss.avatar_url
       FROM Student_Profile sp
       JOIN Student_signup ss ON ss.id = sp.user_uid
       WHERE sp.user_uid = ?`,
      [userId]
    );
    if (rows.length) return res.status(200).json(rows[0]);

    // Fallback to signup data for first-time profile
    const signupRows = await q(
      "SELECT id, name, username, email, avatar_url FROM Student_signup WHERE id=?",
      [userId]
    );
    if (!signupRows.length) return res.status(200).json(null);
    const s = signupRows[0];
    return res.status(200).json({
      user_uid: userId,
      full_name: s.name,
      username:  s.username,
      signup_email: s.email,
      avatar_url: s.avatar_url,
    });
  } catch (err) {
    console.error("[getProfileForEdit]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/student/profile  — upsert */
export const upsertProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Strip any fields that must not come from client
    const {
      full_name, father_name, dob, gender, cnic, mobile,
      nationality, domicile_province, domicile_district, city, address,
      religion, blood_group, disability_notes, guardian_contact,
      target_level, photo_url, cnic_doc_url,
      // username allowed for profile display name
      username,
    } = req.body;

    // Accept: 13 digits optionally formatted as 12345-1234567-1, or already masked
    if (cnic && !cnic.startsWith("X")) {
      const digits = cnic.replace(/-/g, "");
      if (!/^\d{13}$/.test(digits)) {
        return res.status(400).json({ message: "Invalid CNIC format (12345-1234567-1)" });
      }
    }
    // Accept: 11-digit mobile starting 03, optionally with dash, or already masked
    if (mobile && !mobile.startsWith("03XX")) {
      const mob = mobile.replace(/[-\s]/g, "");
      if (!/^03\d{9}$/.test(mob)) {
        return res.status(400).json({ message: "Invalid mobile number (03XX-XXXXXXX)" });
      }
    }

    // Check if profile exists
    const existing = await q(
      "SELECT std_id FROM Student_Profile WHERE user_uid = ?", [userId]
    );

    if (existing.length) {
      await q(
        `UPDATE Student_Profile SET
          full_name=?, father_name=?, dob=?, gender=?, cnic=?, mobile=?,
          nationality=?, domicile_province=?, domicile_district=?, city=?,
          address=?, religion=?, blood_group=?, disability_notes=?,
          guardian_contact=?, target_level=?,
          photo_url=?,
          cnic_doc_url=?,
          username=COALESCE(?,username)
         WHERE user_uid=?`,
        [
          full_name, father_name, dob, gender, cnic, mobile,
          nationality, domicile_province, domicile_district, city,
          address, religion, blood_group, disability_notes,
          guardian_contact, target_level,
          photo_url ?? null, cnic_doc_url ?? null,
          username || null,
          userId,
        ]
      );
      // Sync name to Student_signup as well
      if (full_name) {
        await q("UPDATE Student_signup SET name=?, username=COALESCE(?,username) WHERE id=?",
          [full_name, username || null, userId]);
      }
    } else {
      const stdId = uuidv4();
      // Get email from signup table (email is read-only on profile)
      const signupRow = await q("SELECT email FROM Student_signup WHERE id=?", [userId]);
      const email = signupRow[0]?.email || null;

      await q(
        `INSERT INTO Student_Profile
          (std_id, user_uid, full_name, father_name, email, dob, gender, cnic, mobile,
           nationality, domicile_province, domicile_district, city, address,
           religion, blood_group, disability_notes, guardian_contact,
           target_level, photo_url, cnic_doc_url, username)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          stdId, userId, full_name, father_name, email, dob, gender, cnic, mobile,
          nationality, domicile_province, domicile_district, city, address,
          religion, blood_group, disability_notes, guardian_contact,
          target_level, photo_url || null, cnic_doc_url || null, username || null,
        ]
      );
      if (full_name) {
        await q("UPDATE Student_signup SET name=?, username=COALESCE(?,username) WHERE id=?",
          [full_name, username || null, userId]);
      }
    }

    return res.status(200).json({ message: "Profile saved" });
  } catch (err) {
    console.error("[upsertProfile]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/student/completeness */
export const getCompleteness = async (req, res) => {
  try {
    const userId = req.user.id;
    const [profile]    = await q("SELECT * FROM Student_Profile WHERE user_uid=?", [userId]);
    const academic     = await q("SELECT * FROM student_academic_records WHERE user_uid=?", [userId]);
    const tests        = await q("SELECT * FROM student_test_scores WHERE user_uid=?", [userId]);
    const [research]   = await q("SELECT * FROM student_research_profile WHERE user_uid=?", [userId]);
    const references   = await q("SELECT * FROM student_references WHERE user_uid=?", [userId]);
    const experience   = await q("SELECT * FROM student_experience WHERE user_uid=?", [userId]);
    const [prefs]      = await q("SELECT * FROM student_admission_preferences WHERE user_uid=?", [userId]);

    const result = computeCompleteness(profile, academic, tests, research, references, experience, prefs);

    // Persist completeness % on profile row
    if (profile) {
      await q("UPDATE Student_Profile SET profile_completeness=? WHERE user_uid=?",
        [result.percentage, userId]);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("[getCompleteness]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Academic Records ──────────────────────────────────────────────────────────

export const getAcademicRecords = async (req, res) => {
  try {
    const rows = await q(
      "SELECT * FROM student_academic_records WHERE user_uid=? ORDER BY start_year ASC",
      [req.user.id]
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error("[getAcademicRecords]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const addAcademicRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      level_type, institution, board_university, degree_program,
      group_discipline, roll_reg_number, start_year, end_year,
      result_status, expected_completion, score_type,
      marks_obtained, marks_total, cgpa, cgpa_scale,
      division_grade, degree_duration, certificate_url,
      equivalence_url, is_olevel, thesis_title, supervisor,
    } = req.body;

    // Validation
    if (!level_type) return res.status(400).json({ message: "level_type is required" });
    if (marks_obtained != null && marks_total != null &&
        parseFloat(marks_obtained) > parseFloat(marks_total)) {
      return res.status(400).json({ message: "Marks obtained cannot exceed total marks" });
    }
    if (start_year && end_year && parseInt(end_year) < parseInt(start_year)) {
      return res.status(400).json({ message: "End year must be ≥ start year" });
    }
    if (cgpa != null && cgpa_scale != null &&
        parseFloat(cgpa) > parseFloat(cgpa_scale)) {
      return res.status(400).json({ message: "CGPA cannot exceed scale" });
    }

    const id = uuidv4();
    await q(
      `INSERT INTO student_academic_records
        (id, user_uid, level_type, institution, board_university, degree_program,
         group_discipline, roll_reg_number, start_year, end_year, result_status,
         expected_completion, score_type, marks_obtained, marks_total, cgpa,
         cgpa_scale, division_grade, degree_duration, certificate_url,
         equivalence_url, is_olevel, thesis_title, supervisor)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, userId, level_type, institution, board_university, degree_program,
        group_discipline, roll_reg_number, start_year || null, end_year || null,
        result_status || "Completed", expected_completion || null,
        score_type || "marks", marks_obtained || null, marks_total || null,
        cgpa || null, cgpa_scale || null, division_grade,
        degree_duration || null, certificate_url || null,
        equivalence_url || null, is_olevel ? 1 : 0,
        thesis_title || null, supervisor || null,
      ]
    );
    const [record] = await q("SELECT * FROM student_academic_records WHERE id=?", [id]);
    return res.status(201).json(record);
  } catch (err) {
    console.error("[addAcademicRecord]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAcademicRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await q(
      "SELECT id FROM student_academic_records WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });

    const {
      level_type, institution, board_university, degree_program,
      group_discipline, roll_reg_number, start_year, end_year,
      result_status, expected_completion, score_type,
      marks_obtained, marks_total, cgpa, cgpa_scale,
      division_grade, degree_duration, certificate_url,
      equivalence_url, is_olevel, thesis_title, supervisor,
    } = req.body;

    if (marks_obtained != null && marks_total != null &&
        parseFloat(marks_obtained) > parseFloat(marks_total)) {
      return res.status(400).json({ message: "Marks obtained cannot exceed total marks" });
    }
    if (start_year && end_year && parseInt(end_year) < parseInt(start_year)) {
      return res.status(400).json({ message: "End year must be ≥ start year" });
    }

    await q(
      `UPDATE student_academic_records SET
        level_type=?, institution=?, board_university=?, degree_program=?,
        group_discipline=?, roll_reg_number=?, start_year=?, end_year=?,
        result_status=?, expected_completion=?, score_type=?,
        marks_obtained=?, marks_total=?, cgpa=?, cgpa_scale=?,
        division_grade=?, degree_duration=?, certificate_url=?,
        equivalence_url=?, is_olevel=?, thesis_title=?, supervisor=?
       WHERE id=? AND user_uid=?`,
      [
        level_type, institution, board_university, degree_program,
        group_discipline, roll_reg_number, start_year || null, end_year || null,
        result_status, expected_completion || null, score_type,
        marks_obtained || null, marks_total || null, cgpa || null, cgpa_scale || null,
        division_grade, degree_duration || null, certificate_url || null,
        equivalence_url || null, is_olevel ? 1 : 0,
        thesis_title || null, supervisor || null,
        id, userId,
      ]
    );
    const [updated] = await q("SELECT * FROM student_academic_records WHERE id=?", [id]);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("[updateAcademicRecord]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAcademicRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_academic_records WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });
    await q("DELETE FROM student_academic_records WHERE id=? AND user_uid=?", [id, userId]);
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error("[deleteAcademicRecord]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Test Scores ───────────────────────────────────────────────────────────────

export const getTestScores = async (req, res) => {
  try {
    const rows = await q(
      "SELECT * FROM student_test_scores WHERE user_uid=? ORDER BY test_date DESC",
      [req.user.id]
    );
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const addTestScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { test_type, test_name, score, percentile, test_date, expiry_date, scorecard_url } = req.body;

    if (!test_type) return res.status(400).json({ message: "test_type is required" });
    if (test_date && expiry_date && new Date(expiry_date) < new Date(test_date)) {
      return res.status(400).json({ message: "Expiry date must be after test date" });
    }
    if (test_date && new Date(test_date) > new Date()) {
      return res.status(400).json({ message: "Test date cannot be in the future" });
    }

    const id = uuidv4();
    await q(
      `INSERT INTO student_test_scores
        (id, user_uid, test_type, test_name, score, percentile, test_date, expiry_date, scorecard_url)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, userId, test_type, test_name || null, score || null, percentile || null,
       test_date || null, expiry_date || null, scorecard_url || null]
    );
    const [record] = await q("SELECT * FROM student_test_scores WHERE id=?", [id]);
    return res.status(201).json(record);
  } catch (err) {
    console.error("[addTestScore]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateTestScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_test_scores WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });

    const { test_type, test_name, score, percentile, test_date, expiry_date, scorecard_url } = req.body;
    await q(
      `UPDATE student_test_scores SET
        test_type=?, test_name=?, score=?, percentile=?,
        test_date=?, expiry_date=?, scorecard_url=?
       WHERE id=? AND user_uid=?`,
      [test_type, test_name || null, score || null, percentile || null,
       test_date || null, expiry_date || null, scorecard_url || null,
       id, userId]
    );
    const [updated] = await q("SELECT * FROM student_test_scores WHERE id=?", [id]);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("[updateTestScore]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTestScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_test_scores WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });
    await q("DELETE FROM student_test_scores WHERE id=? AND user_uid=?", [id, userId]);
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Research Profile ──────────────────────────────────────────────────────────

export const getResearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const [profile] = await q(
      "SELECT * FROM student_research_profile WHERE user_uid=?", [userId]
    );
    const publications = await q(
      "SELECT * FROM student_publications WHERE user_uid=? ORDER BY pub_year DESC", [userId]
    );
    return res.status(200).json({ profile: profile || null, publications });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const upsertResearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { research_interests, sop_url, proposal_url, orcid, google_scholar, thesis_abstract } = req.body;

    // research_interests expected as JSON string of array
    const interestsStr = Array.isArray(research_interests)
      ? JSON.stringify(research_interests)
      : research_interests || null;

    const [existing] = await q(
      "SELECT id FROM student_research_profile WHERE user_uid=?", [userId]
    );

    if (existing) {
      await q(
        `UPDATE student_research_profile SET
          research_interests=?, sop_url=COALESCE(?,sop_url),
          proposal_url=COALESCE(?,proposal_url),
          orcid=?, google_scholar=?, thesis_abstract=?
         WHERE user_uid=?`,
        [interestsStr, sop_url || null, proposal_url || null,
         orcid || null, google_scholar || null, thesis_abstract || null, userId]
      );
    } else {
      const id = uuidv4();
      await q(
        `INSERT INTO student_research_profile
          (id, user_uid, research_interests, sop_url, proposal_url, orcid, google_scholar, thesis_abstract)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id, userId, interestsStr, sop_url || null, proposal_url || null,
         orcid || null, google_scholar || null, thesis_abstract || null]
      );
    }
    const [updated] = await q("SELECT * FROM student_research_profile WHERE user_uid=?", [userId]);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("[upsertResearch]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const addPublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, journal_conf, pub_year, doi_link, hec_category } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    const id = uuidv4();
    await q(
      `INSERT INTO student_publications (id, user_uid, title, journal_conf, pub_year, doi_link, hec_category)
       VALUES (?,?,?,?,?,?,?)`,
      [id, userId, title, journal_conf || null, pub_year || null, doi_link || null, hec_category || null]
    );
    const [record] = await q("SELECT * FROM student_publications WHERE id=?", [id]);
    return res.status(201).json(record);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updatePublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_publications WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });
    const { title, journal_conf, pub_year, doi_link, hec_category } = req.body;
    await q(
      `UPDATE student_publications SET title=?, journal_conf=?, pub_year=?, doi_link=?, hec_category=?
       WHERE id=? AND user_uid=?`,
      [title, journal_conf || null, pub_year || null, doi_link || null, hec_category || null, id, userId]
    );
    const [updated] = await q("SELECT * FROM student_publications WHERE id=?", [id]);
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deletePublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_publications WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });
    await q("DELETE FROM student_publications WHERE id=? AND user_uid=?", [id, userId]);
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── References ────────────────────────────────────────────────────────────────

export const getReferences = async (req, res) => {
  try {
    const rows = await q(
      "SELECT * FROM student_references WHERE user_uid=? ORDER BY created_at ASC",
      [req.user.id]
    );
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const addReference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ref_name, designation, institution, email, phone, relationship, known_duration } = req.body;
    if (!ref_name) return res.status(400).json({ message: "Referee name is required" });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid referee email" });
    }
    const id = uuidv4();
    await q(
      `INSERT INTO student_references (id, user_uid, ref_name, designation, institution, email, phone, relationship, known_duration)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, userId, ref_name, designation || null, institution || null,
       email || null, phone || null, relationship || null, known_duration || null]
    );
    const [record] = await q("SELECT * FROM student_references WHERE id=?", [id]);
    return res.status(201).json(record);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateReference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_references WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });
    const { ref_name, designation, institution, email, phone, relationship, known_duration } = req.body;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid referee email" });
    }
    await q(
      `UPDATE student_references SET ref_name=?, designation=?, institution=?,
        email=?, phone=?, relationship=?, known_duration=?
       WHERE id=? AND user_uid=?`,
      [ref_name, designation || null, institution || null,
       email || null, phone || null, relationship || null, known_duration || null,
       id, userId]
    );
    const [updated] = await q("SELECT * FROM student_references WHERE id=?", [id]);
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteReference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_references WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });
    await q("DELETE FROM student_references WHERE id=? AND user_uid=?", [id, userId]);
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Experience & Achievements ─────────────────────────────────────────────────

export const getExperience = async (req, res) => {
  try {
    const rows = await q(
      "SELECT * FROM student_experience WHERE user_uid=? ORDER BY start_date DESC",
      [req.user.id]
    );
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const addExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { entry_type, title, organization, start_date, end_date, is_current, description, document_url } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!entry_type) return res.status(400).json({ message: "Entry type is required" });
    if (start_date && end_date && !is_current && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: "End date must be after start date" });
    }
    const id = uuidv4();
    await q(
      `INSERT INTO student_experience
        (id, user_uid, entry_type, title, organization, start_date, end_date, is_current, description, document_url)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, userId, entry_type, title, organization || null,
       start_date || null, end_date || null, is_current ? 1 : 0,
       description || null, document_url || null]
    );
    const [record] = await q("SELECT * FROM student_experience WHERE id=?", [id]);
    return res.status(201).json(record);
  } catch (err) {
    console.error("[addExperience]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_experience WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });
    const { entry_type, title, organization, start_date, end_date, is_current, description, document_url } = req.body;
    await q(
      `UPDATE student_experience SET
        entry_type=?, title=?, organization=?, start_date=?, end_date=?,
        is_current=?, description=?, document_url=COALESCE(?,document_url)
       WHERE id=? AND user_uid=?`,
      [entry_type, title, organization || null,
       start_date || null, end_date || null, is_current ? 1 : 0,
       description || null, document_url || null, id, userId]
    );
    const [updated] = await q("SELECT * FROM student_experience WHERE id=?", [id]);
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [existing] = await q(
      "SELECT id FROM student_experience WHERE id=? AND user_uid=?", [id, userId]
    );
    if (!existing) return res.status(403).json({ message: "Not found or access denied" });
    await q("DELETE FROM student_experience WHERE id=? AND user_uid=?", [id, userId]);
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── Admission Preferences ─────────────────────────────────────────────────────

export const getPreferences = async (req, res) => {
  try {
    const [row] = await q(
      "SELECT * FROM student_admission_preferences WHERE user_uid=?", [req.user.id]
    );
    if (!row) return res.status(200).json(null);
    return res.status(200).json({
      ...row,
      preferred_programs: row.preferred_programs ? JSON.parse(row.preferred_programs) : [],
      preferred_cities:   row.preferred_cities   ? JSON.parse(row.preferred_cities)   : [],
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const upsertPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferred_programs, preferred_cities, study_mode, hostel_needed } = req.body;

    const programsStr = Array.isArray(preferred_programs)
      ? JSON.stringify(preferred_programs) : preferred_programs || null;
    const citiesStr = Array.isArray(preferred_cities)
      ? JSON.stringify(preferred_cities) : preferred_cities || null;

    const [existing] = await q(
      "SELECT id FROM student_admission_preferences WHERE user_uid=?", [userId]
    );
    if (existing) {
      await q(
        `UPDATE student_admission_preferences SET
          preferred_programs=?, preferred_cities=?, study_mode=?, hostel_needed=?
         WHERE user_uid=?`,
        [programsStr, citiesStr, study_mode || null, hostel_needed ? 1 : 0, userId]
      );
    } else {
      const id = uuidv4();
      await q(
        `INSERT INTO student_admission_preferences
          (id, user_uid, preferred_programs, preferred_cities, study_mode, hostel_needed)
         VALUES (?,?,?,?,?,?)`,
        [id, userId, programsStr, citiesStr, study_mode || null, hostel_needed ? 1 : 0]
      );
    }
    return res.status(200).json({ message: "Preferences saved" });
  } catch (err) {
    console.error("[upsertPreferences]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
