// University verification: uni admin submits docs -> superadmin approves/rejects.
import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";
import { sendNotification } from "../../utils/notify.js";

const fileUrl = (files, field) =>
  files && files[field] && files[field][0]
    ? `/uploads/${files[field][0].filename}`
    : null;

// ---------------------------------------------------------------------------
// UNI ADMIN: submit verification documents
// ---------------------------------------------------------------------------
export const submitDocuments = (req, res) => {
  const {
    user_uid,
    universityName,
    registrationNo,
    address,
    contactNo,
  } = req.body;

  if (!user_uid || !universityName) {
    return res.status(400).json({ message: "university name and user are required" });
  }

  const id = uuidv4();
  const files = req.files || {};

  const sql = `
    INSERT INTO university_verification
      (id, user_uid, university_name, registration_no, address, contact_no,
       hec_certificate_url, charter_certificate_url, accreditation_document_url,
       university_logo_url, status)
    VALUES (?,?,?,?,?,?,?,?,?,?, 'pending')
  `;

  db.query(
    sql,
    [
      id,
      user_uid,
      universityName,
      registrationNo || null,
      address || null,
      contactNo || null,
      fileUrl(files, "hecCertificate"),
      fileUrl(files, "charterCertificate"),
      fileUrl(files, "accreditationDocument"),
      fileUrl(files, "universityLogo"),
    ],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });

      return res.status(201).json({
        message: "Documents submitted successfully. Waiting for admin approval.",
        id,
        status: "pending",
      });
    }
  );
};

// ---------------------------------------------------------------------------
// UNI ADMIN: get my latest verification status
// ---------------------------------------------------------------------------
export const getMyVerification = (req, res) => {
  const { uid } = req.params;
  db.query(
    `SELECT * FROM university_verification WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`,
    [uid],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows[0] || null);
    }
  );
};

// ---------------------------------------------------------------------------
// SUPERADMIN: list verification requests (optional ?status=pending)
// ---------------------------------------------------------------------------
export const listRequests = (req, res) => {
  const { status } = req.query;
  const base = `
    SELECT v.*, u.name AS admin_name, u.email AS admin_email, u.username AS admin_username
    FROM university_verification v
    JOIN Student_signup u ON u.id = v.user_uid
  `;
  const sql = status
    ? `${base} WHERE v.status = ? ORDER BY v.created_at DESC`
    : `${base} ORDER BY v.created_at DESC`;

  db.query(sql, status ? [status] : [], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    return res.status(200).json(rows);
  });
};

// ---------------------------------------------------------------------------
// SUPERADMIN: approve a request -> notify uni admin
// ---------------------------------------------------------------------------
export const approveRequest = (req, res) => {
  const { id } = req.params;
  const reviewerUid = req.user?.id || null;

  db.query(
    `SELECT v.*, u.email AS admin_email, u.name AS admin_name
     FROM university_verification v JOIN Student_signup u ON u.id = v.user_uid
     WHERE v.id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (rows.length === 0) return res.status(404).json({ message: "Request not found" });

      const reqRow = rows[0];

      db.query(
        `UPDATE university_verification
         SET status='approved', reject_reason=NULL, reviewed_by=?, reviewed_at=NOW()
         WHERE id=?`,
        [reviewerUid, id],
        (err2) => {
          if (err2) return res.status(500).json({ message: "DB error", error: err2.message });

          sendNotification({
            recipientUid: reqRow.user_uid,
            recipientEmail: reqRow.admin_email,
            subject: "University Verification Approved ✅",
            body:
              `Dear ${reqRow.admin_name || "Admin"},\n\n` +
              `Congratulations! Your university "${reqRow.university_name}" has been verified and approved.\n` +
              `You can now log in and access your University Dashboard to add your university details, images, and programs.\n\n` +
              `Regards,\nUni Finder Team`,
            type: "university_approved",
          });

          return res.status(200).json({ message: "Request approved", status: "approved" });
        }
      );
    }
  );
};

// ---------------------------------------------------------------------------
// SUPERADMIN: reject a request with a reason -> notify uni admin
// ---------------------------------------------------------------------------
export const rejectRequest = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const reviewerUid = req.user?.id || null;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "A rejection reason is required" });
  }

  db.query(
    `SELECT v.*, u.email AS admin_email, u.name AS admin_name
     FROM university_verification v JOIN Student_signup u ON u.id = v.user_uid
     WHERE v.id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (rows.length === 0) return res.status(404).json({ message: "Request not found" });

      const reqRow = rows[0];

      db.query(
        `UPDATE university_verification
         SET status='rejected', reject_reason=?, reviewed_by=?, reviewed_at=NOW()
         WHERE id=?`,
        [reason.trim(), reviewerUid, id],
        (err2) => {
          if (err2) return res.status(500).json({ message: "DB error", error: err2.message });

          sendNotification({
            recipientUid: reqRow.user_uid,
            recipientEmail: reqRow.admin_email,
            subject: "University Verification Rejected ❌",
            body:
              `Dear ${reqRow.admin_name || "Admin"},\n\n` +
              `We're sorry to inform you that your verification request for "${reqRow.university_name}" was not approved.\n\n` +
              `Reason: ${reason.trim()}\n\n` +
              `Please review the reason above, correct the issue, and submit your documents again.\n\n` +
              `Regards,\nUni Finder Team`,
            type: "university_rejected",
          });

          return res.status(200).json({ message: "Request rejected", status: "rejected" });
        }
      );
    }
  );
};
