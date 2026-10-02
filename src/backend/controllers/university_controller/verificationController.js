
import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";
import { sendNotification } from "../../utils/notify.js";
import { sendRegistrationEmail } from "../../utils/registrationEmail.js";

const fileUrl = (files, field) =>
  files && files[field] && files[field][0]
    ? `/uploads/${files[field][0].filename}`
    : null;

/* ─────────────────────────────────────────────────────────────────
   POST /api/university/verification
   Fields (multipart/form-data):
     userId, full_name, designation, university_id, university_name,
     official_email, email_domain_verified, phone (opt),
     authorization_letter (file, opt)
───────────────────────────────────────────────────────────────── */
export const submitVerification = (req, res) => {
  const {
    userId,
    full_name,
    designation,
    university_id,
    university_name,
    official_email,
    email_domain_verified,
    phone,
  } = req.body;

  if (!userId || !full_name?.trim() || !university_id || !official_email?.trim()) {
    return res.status(400).json({
      message: "userId, full_name, university_id and official_email are required.",
    });
  }

  const letterUrl = fileUrl(req.files, "authorization_letter");
  const domainVerified = email_domain_verified === "true" || email_domain_verified === true ? 1 : 0;

  // Check for an existing pending/approved application — prevent duplicates
  db.query(
    `SELECT id, status FROM university_verification
     WHERE user_uid = ? AND status IN ('pending', 'approved')
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
    (err, existing) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });

      if (existing.length > 0) {
        const s = existing[0].status;
        return res.status(409).json({
          message:
            s === "approved"
              ? "Your university is already verified."
              : "You already have a pending application. Please wait for the Super Admin to review it.",
          status: s,
        });
      }

      // Resolve university_name if not provided (look it up from the universities table)
      const resolveAndInsert = (uniName) => {
        const id = uuidv4();
        db.query(
          `INSERT INTO university_verification
             (id, user_uid, university_name, university_id,
              full_name, designation, official_email,
              email_domain_verified, phone, authorization_letter_url, status)
           VALUES (?,?,?,?,?,?,?,?,?,?, 'pending')`,
          [
            id,
            userId,
            uniName,
            university_id,
            full_name.trim(),
            designation?.trim() || null,
            official_email.trim().toLowerCase(),
            domainVerified,
            phone?.trim() || null,
            letterUrl,
          ],
          (insertErr) => {
            if (insertErr)
              return res.status(500).json({ message: "DB error", error: insertErr.message });

            // Notify super-admins
            db.query(
              "SELECT id, email FROM Student_signup WHERE role = 'admin'",
              (notifyErr, admins) => {
                if (!notifyErr && admins.length) {
                  admins.forEach((admin) => {
                    sendNotification({
                      recipientUid: admin.id,
                      recipientEmail: admin.email,
                      subject: "New University Admin Verification Request",
                      body:
                        `A new verification request has been submitted.\n\n` +
                        `Name      : ${full_name.trim()}\n` +
                        `University: ${uniName}\n` +
                        `Email     : ${official_email.trim()}\n` +
                        `Domain OK : ${domainVerified ? "Yes" : "No"}\n\n` +
                        `Please review it in the Super Admin dashboard.`,
                      type: "university_verification_request",
                    });
                  });
                }

                return res.status(201).json({
                  message: "Application submitted successfully. Waiting for Super Admin approval.",
                  id,
                  status: "pending",
                });
              },
            );
          },
        );
      };

      if (university_name?.trim()) {
        resolveAndInsert(university_name.trim());
      } else {
        db.query(
          "SELECT name FROM universities WHERE id = ? LIMIT 1",
          [university_id],
          (lookupErr, uniRows) => {
            if (lookupErr || !uniRows.length) {
              return res
                .status(400)
                .json({ message: "Could not resolve university name. Please try again." });
            }
            resolveAndInsert(uniRows[0].name);
          },
        );
      }
    },
  );
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/university/verification/:uid
   Returns the user's latest verification record, or 404 if none.
   Checks applications table first (new flow), then falls back to
   university_verification (legacy) if it exists.
───────────────────────────────────────────────────────────────── */
export const getMyVerification = (req, res) => {
  const { uid } = req.params;

  if (!uid || uid === "undefined" || uid === "null") {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  // Always check the authoritative applications table first
  db.query(
    `SELECT
       a.id, a.reference_no AS reference_no,
       a.user_uid, a.university_id,
       u.name AS university_name,
       a.full_name, a.designation, a.designation_other,
       a.email AS official_email,
       a.phone,
       a.domain_state,
       a.loe_path AS authorization_letter_url,
       a.status,
       a.reject_reason,
       a.created_at
     FROM applications a
     JOIN universities u ON u.id COLLATE utf8mb4_general_ci = a.university_id COLLATE utf8mb4_general_ci
     WHERE a.user_uid = ?
     ORDER BY a.created_at DESC LIMIT 1`,
    [uid],
    (err, appRows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });

      if (appRows.length) {
        const row = appRows[0];
        // Normalize status to lowercase for the frontend state machine
        return res.status(200).json({
          ...row,
          status: (row.status || "pending").toLowerCase(),
        });
      }

      // No application row — fall back to university_verification for legacy submissions
      db.query(
        `SELECT * FROM university_verification
         WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`,
        [uid],
        (err2, uvRows) => {
          // If the table doesn't exist yet, treat as 404 (no application)
          if (err2) {
            if (err2.code === "ER_NO_SUCH_TABLE") {
              return res.status(404).json({ message: "No application found." });
            }
            return res.status(500).json({ message: "DB error", error: err2.message });
          }
          if (!uvRows.length) return res.status(404).json({ message: "No application found." });
          return res.status(200).json(uvRows[0]);
        },
      );
    },
  );
};

/* ─────────────────────────────────────────────────────────────────
   Legacy: POST /api/university/documents  (old document-upload flow)
   Kept for backward-compatibility.
───────────────────────────────────────────────────────────────── */
export const submitDocuments = (req, res) => {
  const { user_uid, universityName, registrationNo, address, contactNo } = req.body;

  if (!user_uid || !universityName) {
    return res.status(400).json({ message: "university name and user are required" });
  }

  const id = uuidv4();
  const files = req.files || {};

  db.query(
    `INSERT INTO university_verification
       (id, user_uid, university_name, registration_no, address, contact_no,
        hec_certificate_url, charter_certificate_url, accreditation_document_url,
        university_logo_url, status)
     VALUES (?,?,?,?,?,?,?,?,?,?, 'pending')`,
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
    },
  );
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/admin/verifications
   Default: status = 'pending' only (awaiting rows excluded — email
   not verified yet). Supports ?status=pending|approved|rejected tab.
   Source: applications JOIN universities (real data only).
───────────────────────────────────────────────────────────────── */
export const listRequests = (req, res) => {
  // Only allow known statuses; default to pending
  const allowed = ["pending", "approved", "rejected"];
  const requestedStatus = (req.query.status || "pending").toLowerCase();
  const statusFilter = allowed.includes(requestedStatus) ? requestedStatus : "pending";

  db.query(
    `SELECT
       a.id,
       a.reference_no,
       a.user_uid,
       a.full_name,
       a.designation,
       a.designation_other,
       a.email,
       a.phone,
       a.domain_state,
       a.focal_email_match,
       a.focal_name_match,
       a.loe_path,
       a.status,
       a.reject_reason,
       a.created_at,
       a.reviewed_at,
       u.id   AS university_id,
       u.name AS university_name,
       u.university_type,
       u.hec_rank,
       u.oric_domain,
       u.total_campuses,
       u.focal_person_name,
       u.focal_person_email
     FROM applications a
     JOIN universities u ON u.id COLLATE utf8mb4_general_ci = a.university_id COLLATE utf8mb4_general_ci
     WHERE LOWER(a.status) = ?
     ORDER BY a.created_at DESC`,
    [statusFilter],
    (err, rows) => {
      if (err) {
        console.error("[listRequests] DB error:", err.message);
        // If applications table doesn't exist yet, return empty array gracefully
        if (err.code === "ER_NO_SUCH_TABLE") {
          return res.status(200).json([]);
        }
        return res.status(500).json({ message: "DB error", error: err.message });
      }
      return res.status(200).json(rows);
    },
  );
};

/* ─────────────────────────────────────────────────────────────────
   PUT /api/admin/verifications/:id/approve
   Guards: row must be 'pending'; 409 otherwise.
   Cascade:
     1. applications  → status='approved', reviewed_by, reviewed_at
     2. universities  → owner_uid = application.user_uid
     3. Student_signup → role='university' (email/password untouched)
   Email: best-effort approval notification.
───────────────────────────────────────────────────────────────── */
export const approveRequest = (req, res) => {
  const { id } = req.params;
  const reviewerUid = req.user?.id || null;

  db.query(
    `SELECT a.*, u.name AS university_name, u.id AS university_id,
            s.email AS login_email, s.name AS account_name
     FROM applications a
     JOIN universities u ON u.id COLLATE utf8mb4_general_ci = a.university_id COLLATE utf8mb4_general_ci
     JOIN Student_signup s ON s.id COLLATE utf8mb4_general_ci = a.user_uid COLLATE utf8mb4_general_ci
     WHERE a.id = ? LIMIT 1`,
    [id],
    (err, rows) => {
      if (err) {
        console.error("[approveRequest] SELECT error:", err.message);
        return res.status(500).json({ message: "DB error", error: err.message });
      }
      if (!rows.length) return res.status(404).json({ message: "Application not found." });

      const app = rows[0];
      const currentStatus = (app.status || "").toLowerCase();

      if (currentStatus !== "pending") {
        return res.status(409).json({
          message: `Cannot approve: application is already '${app.status}'.`,
        });
      }

      // Step 1: mark approved — use only columns guaranteed to exist.
      // reviewed_by / reviewed_at may not exist on older installs; we
      // try the full UPDATE first and fall back to a minimal one on ER_BAD_FIELD_ERROR.
      const doApproveUpdate = (cb) => {
        db.query(
          `UPDATE applications
           SET status='approved', reviewed_by=?, reviewed_at=NOW()
           WHERE id=? AND LOWER(status)='pending'`,
          [reviewerUid, id],
          (e, result) => {
            if (e && (e.code === "ER_BAD_FIELD_ERROR" || e.errno === 1054)) {
              // reviewed_by / reviewed_at columns missing — fall back
              db.query(
                `UPDATE applications SET status='approved' WHERE id=? AND LOWER(status)='pending'`,
                [id],
                cb,
              );
            } else {
              cb(e, result);
            }
          },
        );
      };

      doApproveUpdate((err2, result) => {
          if (err2) {
            console.error("[approveRequest] UPDATE applications error:", err2.message);
            return res.status(500).json({ message: "DB error", error: err2.message });
          }
          if (result.affectedRows === 0) {
            return res.status(409).json({ message: "Application was modified concurrently. Please refresh and try again." });
          }

          // Step 2: claim the university — handle duplicate owner_uid gracefully
          db.query(
            "UPDATE universities SET owner_uid=? WHERE id=?",
            [app.user_uid, app.university_id],
            (err3) => {
              if (err3) {
                // Duplicate entry on owner_uid UNIQUE means another university is already
                // owned by this user. Log it but don't fail the approval.
                if (err3.code === "ER_DUP_ENTRY") {
                  console.warn("[approveRequest] owner_uid duplicate — user already owns a university, proceeding.");
                } else {
                  console.error("[approveRequest] UPDATE universities error:", err3.message);
                  return res.status(500).json({ message: "DB error", error: err3.message });
                }
              }

              // Step 3: set role (NEVER touch email or password)
              db.query(
                "UPDATE Student_signup SET role='university' WHERE id=?",
                [app.user_uid],
                (err4) => {
                  if (err4) {
                    console.error("[approveRequest] UPDATE Student_signup error:", err4.message);
                    return res.status(500).json({ message: "DB error", error: err4.message });
                  }

                  // Mirror to legacy university_verification if linked (best-effort)
                  db.query(
                    `UPDATE university_verification
                     SET status='approved', reviewed_by=?, reviewed_at=NOW()
                     WHERE application_id=?`,
                    [reviewerUid, id],
                    () => {},
                  );

                  // Best-effort email notification
                  const targetEmail = app.email || app.login_email;
                  sendNotification({
                    recipientUid: app.user_uid,
                    recipientEmail: targetEmail,
                    subject: "University Verification Approved ✅",
                    body:
                      `Dear ${app.full_name || app.account_name || "Administrator"},\n\n` +
                      `Your university "${app.university_name}" has been approved. ` +
                      `You can now sign in using your existing account credentials.\n\n` +
                      `Regards,\nUni Finder Team`,
                    type: "university_approved",
                  });

                  sendRegistrationEmail({
                    to: targetEmail,
                    subject: `University Verification Approved — ${app.university_name}`,
                    text:
                      `Hello ${app.full_name || app.account_name || "Administrator"},\n\n` +
                      `Your university "${app.university_name}" has been approved.\n` +
                      `You can now sign in using your existing account credentials.\n\n` +
                      `Regards,\nUni Finder Team`,
                  }).catch((mailErr) => {
                    console.error("Approval email failed (non-fatal):", mailErr.message);
                  });

                  return res.status(200).json({
                    message: "Application approved. University linked and applicant notified.",
                    status: "approved",
                  });
                },
              );
            },
          );
        },
      );
    },
  );
};

/* ─────────────────────────────────────────────────────────────────
   PUT /api/admin/verifications/:id/reject
   Body: { reason } required (min 1 char — UI enforces ≥ 10).
   Rejected rows are NEVER deleted.
───────────────────────────────────────────────────────────────── */
export const rejectRequest = (req, res) => {
  const { id } = req.params;
  const reason = String(req.body?.reason || "").trim();
  const reviewerUid = req.user?.id || null;

  if (!reason) {
    return res.status(400).json({ message: "A rejection reason is required." });
  }

  db.query(
    `SELECT a.*, u.name AS university_name,
            s.email AS login_email, s.name AS account_name
     FROM applications a
     JOIN universities u ON u.id COLLATE utf8mb4_general_ci = a.university_id COLLATE utf8mb4_general_ci
     JOIN Student_signup s ON s.id COLLATE utf8mb4_general_ci = a.user_uid COLLATE utf8mb4_general_ci
     WHERE a.id = ? LIMIT 1`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (!rows.length) return res.status(404).json({ message: "Application not found." });

      const app = rows[0];

      db.query(
        `UPDATE applications
         SET status='rejected', reject_reason=?, reviewed_by=?, reviewed_at=NOW()
         WHERE id=?`,
        [reason, reviewerUid, id],
        (err2) => {
          if (err2) return res.status(500).json({ message: "DB error", error: err2.message });

          // Mirror to legacy table (best-effort)
          db.query(
            `UPDATE university_verification
             SET status='rejected', reject_reason=?, reviewed_by=?, reviewed_at=NOW()
             WHERE application_id=?`,
            [reason, reviewerUid, id],
            () => {},
          );

          // Best-effort notification
          const targetEmail = app.email || app.login_email;
          sendNotification({
            recipientUid: app.user_uid,
            recipientEmail: targetEmail,
            subject: "University Verification Rejected ❌",
            body:
              `Dear ${app.full_name || app.account_name || "Administrator"},\n\n` +
              `Your application for "${app.university_name}" was not approved.\n\n` +
              `Reason: ${reason}\n\n` +
              `Please review the reason above, correct the issue, and re-submit your application.\n\n` +
              `Regards,\nUni Finder Team`,
            type: "university_rejected",
          });

          sendRegistrationEmail({
            to: targetEmail,
            subject: `University Verification — Application Update`,
            text:
              `Hello ${app.full_name || app.account_name || "Administrator"},\n\n` +
              `Your application for "${app.university_name}" was not approved.\n\n` +
              `Reason: ${reason}\n\n` +
              `Please re-submit with the required corrections.\n\nRegards,\nUni Finder Team`,
          }).catch((mailErr) => {
            console.error("Rejection email failed (non-fatal):", mailErr.message);
          });

          return res.status(200).json({
            message: "Application rejected and applicant notified.",
            status: "rejected",
          });
        },
      );
    },
  );
};
