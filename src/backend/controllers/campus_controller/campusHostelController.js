
import db from "../../config/db.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const database = db.promise();
// University Admin: apni university ke campus hostel requests
export const getUniversityCampusHostels = async (req, res) => {
  try {
    const universityId = req.user?.university_id;

    if (!universityId) {
      return res.status(403).json({
        message: "University access required",
      });
    }

    const [rows] = await database.query(
      `SELECT *
       FROM campus_hostel_verifications
       WHERE university_id = ?
       ORDER BY created_at DESC`,
      [universityId]
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get university campus hostels:", error);
    return res.status(500).json({
      message: "Failed to fetch campus hostels",
    });
  }
};

// Super Admin: sab universities ke campus hostel requests
export const getAllCampusHostels = async (req, res) => {
  try {
    const [rows] = await database.query(
      `SELECT *
       FROM campus_hostel_verifications
       ORDER BY created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get all campus hostels:", error);
    return res.status(500).json({
      message: "Failed to fetch campus hostels",
    });
  }
};

// Single hostel ki details aur documents
export const getCampusHostelById = async (req, res) => {
  try {
    const { id } = req.params;

    const [hostels] = await database.query(
      `SELECT *
       FROM campus_hostel_verifications
       WHERE id = ?`,
      [id]
    );

    if (!hostels.length) {
      return res.status(404).json({
        message: "Campus hostel not found",
      });
    }

    const hostel = hostels[0];

    // University Admin sirf apni university ka hostel dekh sake
    if (
      req.user.role === "university" &&
     String(req.user?.university_id) !== String(hostel.university_id)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const [documents] = await database.query(
      `SELECT *
       FROM campus_hostel_verification_documents
       WHERE campus_hostel_verification_id = ?`,
      [id]
    );

    return res.json({ ...hostel, documents });
  } catch (error) {
    console.error("Get campus hostel:", error);
    return res.status(500).json({
      message: "Failed to fetch campus hostel",
    });
  }
};

export const reviewUniversityCampusHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes = "" } = req.body;
    const universityId = req.user?.university_id;

    if (!universityId) {
      return res.status(403).json({
        message: "University access required",
      });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be approved or rejected",
      });
    }

    const [result] = await database.query(
      `UPDATE campus_hostel_verifications
       SET university_approval = ?,
           university_review_notes = ?,
           super_admin_approval = ?,
           verification_status = ?
       WHERE id = ?
         AND university_id = ?
         AND university_approval = 'pending'
         AND verification_status = 'pending_university'`,
      [
        decision,
        notes,
        decision === "approved" ? "pending" : "not_started",
        decision === "approved"
          ? "pending_super_admin"
          : "rejected",
        id,
        universityId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message:
          "Request not found, already reviewed, or not assigned to your university",
      });
    }

    return res.json({
      message:
        decision === "approved"
          ? "Hostel approved by University Admin and forwarded to Super Admin"
          : "Hostel rejected by University Admin",
    });
  } catch (error) {
    console.error("Review university campus hostel:", error);

    return res.status(500).json({
      message: "Failed to review campus hostel",
    });
  }
};


export const viewCampusHostelDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const [rows] = await database.query(
      `SELECT d.file_path, d.mime_type, h.university_id
       FROM campus_hostel_verification_documents d
       INNER JOIN campus_hostel_verifications h
         ON h.id = d.campus_hostel_verification_id
       WHERE d.id = ?
       LIMIT 1`,
      [documentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const doc = rows[0];

    if (
      req.user?.role === "university" &&
      String(req.user?.university_id) !== String(doc.university_id)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const uploadsDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../uploads"
    );

    const storedPath = doc.file_path;
    const filePath = path.isAbsolute(storedPath)
      ? path.resolve(storedPath)
      : path.resolve(process.cwd(), storedPath);

    const relativePath = path.relative(uploadsDir, filePath);

    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      return res.status(403).json({
        message: "Invalid document path",
      });
    }

    if (!["application/pdf", "image/jpeg", "image/png"].includes(doc.mime_type)) {
      return res.status(415).json({
        message: "Unsupported document type",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Uploaded file not found",
      });
    }

    res.setHeader("Content-Type", doc.mime_type);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath);
  } catch (error) {
    console.error("View hostel document error:", error);

    return res.status(500).json({
      message: "Failed to open document",
    });
  }
};


export const reviewSuperAdminCampusHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes = "" } = req.body || {};

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be approved or rejected",
      });
    }

    if (typeof notes !== "string" || notes.length > 2000) {
      return res.status(400).json({
        message: "Invalid review notes",
      });
    }

    if (decision === "rejected" && !notes.trim()) {
      return res.status(400).json({
        message: "Rejection reason is required",
      });
    }

    const [result] = await database.query(
      `UPDATE campus_hostel_verifications
       SET super_admin_approval = ?,
           super_admin_review_notes = ?,
           verification_status = ?
       WHERE id = ?
         AND university_approval = 'approved'
         AND super_admin_approval = 'pending'
         AND verification_status = 'pending_super_admin'`,
      [
        decision,
        notes.trim(),
        decision === "approved" ? "approved" : "rejected",
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message:
          "Request not found, already reviewed, or University Admin approval is pending",
      });
    }

    return res.json({
      message:
        decision === "approved"
          ? "Campus hostel verification approved successfully"
          : "Campus hostel verification rejected successfully",
    });
  } catch (error) {
    console.error("Super Admin campus hostel review:", error);

    return res.status(500).json({
      message: "Failed to review campus hostel",
    });
  }
};

export const getMyCampusHostel = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const [rows] = await database.query(
      `SELECT
         h.id,
         h.campus_registration_id,
         h.campus_id,
         h.hostel_name,
         h.university_approval,
         h.super_admin_approval,
         h.verification_status,
         h.university_review_notes,
         h.super_admin_review_notes,
         h.created_at,
         h.updated_at
       FROM campus_hostel_verifications h
       INNER JOIN campus_registrations cr
         ON cr.id = h.campus_registration_id
       WHERE cr.registrantUserId = ?
       ORDER BY cr.submittedAt DESC, h.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ data: null });
    }

    return res.json({ data: rows[0] });
} catch (error) {
  console.error("Get my campus hostel ERROR:", error);

  return res.status(500).json({
    message: "Failed to fetch hostel verification status",
    error: error.message,
  });
}
};


