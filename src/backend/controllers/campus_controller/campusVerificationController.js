

import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";
import { sendNotification } from "../../utils/notify.js";

export const submitCampusRequest = (req, res) => {
  const { campus_admin_uid, university_id, campus_name, city, address, contact_no } = req.body;
  if (!campus_admin_uid || !university_id || !campus_name) {
    return res
      .status(400)
      .json({ message: "campus admin, university and campus name are required" });
  }
  const id = uuidv4();
  db.query(
    `INSERT INTO campus_verification
      (id, campus_admin_uid, university_id, campus_name, city, address, contact_no, status)
     VALUES (?,?,?,?,?,?,?, 'pending')`,
    [id, campus_admin_uid, university_id, campus_name, city || null, address || null, contact_no || null],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(201).json({
        message: "Request submitted. Waiting for the university admin's approval.",
        id,
        status: "pending",
      });
    }
  );
};

export const getMyCampusRequest = (req, res) => {
  db.query(
    `SELECT cv.*, u.name AS university_name
     FROM campus_verification cv
     LEFT JOIN universities u ON u.id = cv.university_id
     WHERE cv.campus_admin_uid = ? ORDER BY cv.created_at DESC LIMIT 1`,
    [req.params.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows[0] || null);
    }
  );
};

export const listCampusRequestsForOwner = (req, res) => {
  const { ownerUid } = req.params;
  const { status } = req.query;
  const base = `
    SELECT cv.*, s.name AS admin_name, s.email AS admin_email
    FROM campus_verification cv
    JOIN universities u ON u.id = cv.university_id
    JOIN Student_signup s ON s.id = cv.campus_admin_uid
    WHERE u.owner_uid = ?
  `;
  const sql = status
    ? `${base} AND cv.status = ? ORDER BY cv.created_at DESC`
    : `${base} ORDER BY cv.created_at DESC`;
  db.query(sql, status ? [ownerUid, status] : [ownerUid], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    return res.status(200).json(rows);
  });
};

const loadRequest = (id, cb) =>
  db.query(
    `SELECT cv.*, s.email AS admin_email, s.name AS admin_name, u.name AS university_name
     FROM campus_verification cv
     JOIN Student_signup s ON s.id = cv.campus_admin_uid
     LEFT JOIN universities u ON u.id = cv.university_id
     WHERE cv.id = ?`,
    [id],
    cb
  );

export const approveCampusRequest = (req, res) => {
  const { id } = req.params;
  const reviewerUid = req.user?.id || null;
  loadRequest(id, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    if (!rows.length) return res.status(404).json({ message: "Request not found" });
    const r = rows[0];
    db.query(
      `UPDATE campus_verification
       SET status='approved', reject_reason=NULL, reviewed_by=?, reviewed_at=NOW() WHERE id=?`,
      [reviewerUid, id],
      (err2) => {
        if (err2) return res.status(500).json({ message: "DB error", error: err2.message });
        sendNotification({
          recipientUid: r.campus_admin_uid,
          recipientEmail: r.admin_email,
          subject: "Campus Registration Approved ✅",
          body:
            `Dear ${r.admin_name || "Admin"},\n\n` +
            `Your campus "${r.campus_name}" under ${r.university_name || "the university"} has been approved.\n` +
            `You can now log in and add your campus details (history, duration, fees, photos, programs).\n\n` +
            `Regards,\nUni Finder Team`,
          type: "campus_approved",
        });
        return res.status(200).json({ message: "Campus approved", status: "approved" });
      }
    );
  });
};

export const rejectCampusRequest = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const reviewerUid = req.user?.id || null;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "A rejection reason is required" });
  }
  loadRequest(id, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    if (!rows.length) return res.status(404).json({ message: "Request not found" });
    const r = rows[0];
    db.query(
      `UPDATE campus_verification
       SET status='rejected', reject_reason=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?`,
      [reason.trim(), reviewerUid, id],
      (err2) => {
        if (err2) return res.status(500).json({ message: "DB error", error: err2.message });
        sendNotification({
          recipientUid: r.campus_admin_uid,
          recipientEmail: r.admin_email,
          subject: "Campus Registration Rejected ❌",
          body:
            `Dear ${r.admin_name || "Admin"},\n\n` +
            `Your campus request "${r.campus_name}" was not approved.\n\n` +
            `Reason: ${reason.trim()}\n\n` +
            `Please correct the issue and submit again.\n\nRegards,\nUni Finder Team`,
          type: "campus_rejected",
        });
        return res.status(200).json({ message: "Campus rejected", status: "rejected" });
      }
    );
  });
};
