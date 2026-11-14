/**
 * studentFilesController.js
 * Handles private file upload, authenticated serve, and deletion.
 * Files live at: /uploads/students/{userId}/{filename}
 * Ownership check: filename must be in one of the student's tables or
 * the userId directory segment must match the logged-in user.
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDENTS_DIR = path.resolve(__dirname, "..", "..", "uploads", "students");

const q = (sql, values = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

// ── POST /api/student/upload/avatar ──────────────────────────────────────────
// Profile photo — stored in /uploads/students/avatars/{userId}_avatar{ext}
// Served publicly as /uploads/students/avatars/{filename} (no auth needed)
export const uploadAvatarFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file received" });

  const userId   = req.user.id;
  const filename = req.file.filename;
  // Public URL — served by Express static middleware
  const url = `/uploads/students/avatars/${filename}`;

  try {
    // Persist to both tables
    const existing = await q("SELECT std_id FROM Student_Profile WHERE user_uid=?", [userId]);
    if (existing.length) {
      await q("UPDATE Student_Profile SET photo_url=? WHERE user_uid=?", [url, userId]);
    }
    await q("UPDATE Student_signup SET avatar_url=? WHERE id=?", [url, userId]);
  } catch (dbErr) {
    console.error("[uploadAvatarFile] DB warning:", dbErr.message);
  }

  return res.status(201).json({
    url,
    filename,
    size: req.file.size,
    doc_type: "photo",
    userId,
  });
};

// ── POST /api/student/upload ──────────────────────────────────────────────────
// multer has already processed the file and placed it in uploads/students/{userId}/
// req.file = { filename, path, size, mimetype }
export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file received" });
  }

  const userId = req.user.id;
  const doc_type = req.body.doc_type || "other";
  const filename = req.file.filename;
  const url = `/api/student/files/${filename}`;

  // Persist file URL immediately to the relevant column so DB stays in sync
  // even when the client does not call PUT /profile afterwards (e.g. Summary Card avatar)
  try {
    if (doc_type === "photo") {
      // Check if profile row exists first
      const existing = await q("SELECT std_id FROM Student_Profile WHERE user_uid=?", [userId]);
      if (existing.length) {
        await q("UPDATE Student_Profile SET photo_url=? WHERE user_uid=?", [url, userId]);
      }
      // Also update Student_signup avatar_url so the navbar avatar refreshes
      await q("UPDATE Student_signup SET avatar_url=? WHERE id=?", [url, userId]);
    } else if (doc_type === "cnic_doc") {
      const existing = await q("SELECT std_id FROM Student_Profile WHERE user_uid=?", [userId]);
      if (existing.length) {
        await q("UPDATE Student_Profile SET cnic_doc_url=? WHERE user_uid=?", [url, userId]);
      }
    }
  } catch (dbErr) {
    // Non-fatal — file is uploaded, URL is returned, client can persist manually
    console.error("[uploadFile] DB update warning:", dbErr.message);
  }

  return res.status(201).json({
    url,
    filename,
    size: req.file.size,
    doc_type,
    userId,
  });
};

// ── GET /api/student/files/:filename ─────────────────────────────────────────
// Serves the file only if it lives inside the logged-in student's subdirectory.
export const serveFile = (req, res) => {
  const userId = req.user.id;
  const { filename } = req.params;

  // Sanitize: no path traversal
  const safeFilename = path.basename(filename);
  const safeUserId   = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath     = path.join(STUDENTS_DIR, safeUserId, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Extra guard: resolved path must stay inside the student's folder
  const resolvedPath  = path.resolve(filePath);
  const resolvedBase  = path.resolve(path.join(STUDENTS_DIR, safeUserId));
  if (!resolvedPath.startsWith(resolvedBase + path.sep) &&
      resolvedPath !== resolvedBase) {
    return res.status(403).json({ message: "Access denied" });
  }

  return res.sendFile(resolvedPath);
};

// ── DELETE /api/student/files/:filename ───────────────────────────────────────
export const deleteFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename } = req.params;

    const safeFilename = path.basename(filename);
    const safeUserId   = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const filePath     = path.join(STUDENTS_DIR, safeUserId, safeFilename);

    // Delete from disk if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Clear any URL columns in student tables that referenced this file
    // We match on the basename to avoid storing absolute paths
    const fileUrl = `/api/student/files/${safeFilename}`;
    const urlLike = `%${safeFilename}%`;

    // Student_Profile
    await q(
      `UPDATE Student_Profile SET
         photo_url    = CASE WHEN photo_url    LIKE ? THEN NULL ELSE photo_url    END,
         cnic_doc_url = CASE WHEN cnic_doc_url LIKE ? THEN NULL ELSE cnic_doc_url END
       WHERE user_uid = ?`,
      [urlLike, urlLike, userId]
    );

    // Academic records (certificate + equivalence)
    await q(
      `UPDATE student_academic_records SET
         certificate_url  = CASE WHEN certificate_url  LIKE ? THEN NULL ELSE certificate_url  END,
         equivalence_url  = CASE WHEN equivalence_url  LIKE ? THEN NULL ELSE equivalence_url  END
       WHERE user_uid = ?`,
      [urlLike, urlLike, userId]
    );

    // Test scores
    await q(
      `UPDATE student_test_scores SET
         scorecard_url = CASE WHEN scorecard_url LIKE ? THEN NULL ELSE scorecard_url END
       WHERE user_uid = ?`,
      [urlLike, userId]
    );

    // Research profile
    await q(
      `UPDATE student_research_profile SET
         sop_url      = CASE WHEN sop_url      LIKE ? THEN NULL ELSE sop_url      END,
         proposal_url = CASE WHEN proposal_url LIKE ? THEN NULL ELSE proposal_url END
       WHERE user_uid = ?`,
      [urlLike, urlLike, userId]
    );

    // Experience
    await q(
      `UPDATE student_experience SET
         document_url = CASE WHEN document_url LIKE ? THEN NULL ELSE document_url END
       WHERE user_uid = ?`,
      [urlLike, userId]
    );

    return res.status(200).json({ message: "File deleted" });
  } catch (err) {
    console.error("[deleteFile]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/student/documents ────────────────────────────────────────────────
// Returns a unified document vault list for the student, computed from all tables.
export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const [profile]  = await q("SELECT photo_url, cnic_doc_url FROM Student_Profile WHERE user_uid=?", [userId]);
    const academic   = await q(
      "SELECT level_type, certificate_url, equivalence_url FROM student_academic_records WHERE user_uid=?",
      [userId]
    );
    const tests      = await q(
      "SELECT test_type, scorecard_url, test_date FROM student_test_scores WHERE user_uid=?",
      [userId]
    );
    const [research] = await q(
      "SELECT sop_url, proposal_url FROM student_research_profile WHERE user_uid=?",
      [userId]
    );
    const experience = await q(
      "SELECT entry_type, title, document_url FROM student_experience WHERE user_uid=?",
      [userId]
    );

    const docs = [];

    const pushDoc = (doc_type, label, section, url, extraRequired = null) => {
      if (!url) return; // only include present files in the list
      const safeFilename = path.basename(url);
      const safeUserId   = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
      const filePath     = path.join(STUDENTS_DIR, safeUserId, safeFilename);
      let size = null;
      let uploaded_at = null;
      try {
        const stat = fs.statSync(filePath);
        size = stat.size;
        uploaded_at = stat.mtime.toISOString();
      } catch (_) { /* file may have been moved */ }

      docs.push({
        doc_type,
        label,
        section,
        filename: safeFilename,
        url,
        size,
        uploaded_at,
        status: "Uploaded",
      });
    };

    if (profile?.photo_url)    pushDoc("photo",       "Profile Photo",          "personal");
    if (profile?.cnic_doc_url) pushDoc("cnic_doc",    "CNIC / B-Form Copy",     "personal");

    for (const rec of academic) {
      if (rec.certificate_url)
        pushDoc("transcript", `${rec.level_type} Certificate/Transcript`, "academic", rec.certificate_url);
      if (rec.equivalence_url)
        pushDoc("equivalence", `${rec.level_type} IBCC/HEC Equivalence`, "academic", rec.equivalence_url);
    }

    for (const t of tests) {
      if (t.scorecard_url)
        pushDoc("scorecard", `${t.test_type} Score Card`, "tests", t.scorecard_url);
    }

    if (research?.sop_url)      pushDoc("sop",      "Statement of Purpose", "research", research.sop_url);
    if (research?.proposal_url) pushDoc("proposal", "Research Proposal",    "research", research.proposal_url);

    for (const e of experience) {
      if (e.document_url)
        pushDoc("cv", e.entry_type === "cv" ? "CV / Resume" : `${e.title} Certificate`, "experience", e.document_url);
    }

    return res.status(200).json(docs);
  } catch (err) {
    console.error("[getDocuments]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
