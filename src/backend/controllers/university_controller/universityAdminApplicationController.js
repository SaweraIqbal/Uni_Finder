import crypto from "crypto";
import bcrypt from "bcryptjs";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import db, { createTransactionConnection } from "../../config/db.js";
import { sendNotification } from "../../utils/notify.js";
import {
  registrationApiUrl,
  registrationClientUrl,
  sendRegistrationEmail,
} from "../../utils/registrationEmail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const privateLetterDir = path.join(__dirname, "..", "..", "private", "authorization-letters");
const DESIGNATIONS = [
  "Vice Chancellor / Rector",
  "Registrar",
  "Deputy Registrar",
  "Assistant Registrar",
  "Controller of Examinations",
  "Director ORIC",
  "Director QEC",
  "Deputy/Assistant Director (QEC/ORIC)",
  "Focal Person (HEC)",
  "Other",
];
const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com",
  "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com",
  "proton.me", "protonmail.com", "pm.me", "gmx.com", "mail.com", "zoho.com",
  "yandex.com", "qq.com",
]);
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const NAME_CHARS_RE = /^[A-Za-z .'-]+$/;
const PHONE_ERROR = "Please enter a valid Pakistani mobile number (e.g., +92 300 1234567).";
const LETTER_ERROR = "Only PDF, JPG or PNG files up to 5 MB are allowed.";
const DOMAIN_ERROR = "An authorization letter is required because your email domain could not be verified.";
const UNIVERSITY_RACE_ERROR = "This university was just registered by another user. Please contact support.";

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const randomToken = () => crypto.randomBytes(32).toString("hex");
const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");
const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ");
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const validName = (value, min, max, requireTwoWords = false) => {
  const normalized = normalizeName(value);
  return normalized.length >= min &&
    normalized.length <= max &&
    NAME_CHARS_RE.test(normalized) &&
    (!requireTwoWords || normalized.split(" ").length >= 2);
};

const validateEmail = (value) => {
  const email = String(value || "").trim();
  const [localPart, domain] = email.split("@");
  if (
    email.length > 254 ||
    !localPart ||
    localPart.length > 64 ||
    !EMAIL_RE.test(email) ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return { error: "Please enter a valid email address." };
  }
  if (PUBLIC_EMAIL_DOMAINS.has(domain.toLowerCase())) {
    return {
      error: "Please use your official university email (Gmail/Yahoo/Hotmail are not accepted).",
    };
  }
  return { email: `${localPart}@${domain.toLowerCase()}`, domain: domain.toLowerCase() };
};

const normalizePhone = (value) => {
  const input = String(value || "").trim();
  if (!/^\+?[\d -]+$/.test(input)) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  if (!digits.startsWith("92")) digits = `92${digits}`;
  const normalized = `+${digits}`;
  return /^\+923\d{9}$/.test(normalized) ? normalized : null;
};

const getDomainState = (emailDomain, oricDomain) => {
  const official = String(oricDomain || "").trim().toLowerCase().replace(/^@/, "");
  if (!official || official === "*") return "unknown";
  if (
    emailDomain === official ||
    emailDomain.endsWith(`.${official}`) ||
    official.endsWith(`.${emailDomain}`)
  ) {
    return "match";
  }
  return "mismatch";
};

const isClaimed = async (universityId) => {
  // Only check applications table — university_verification may not exist yet
  const rows = await query(
    `SELECT u.id FROM universities u
     WHERE u.id = ?
       AND EXISTS (SELECT 1 FROM applications a
                   WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                     AND LOWER(a.status) = 'approved')
     LIMIT 1`,
    [universityId],
  );
  return rows.length > 0;
};

const verifyFile = (file) => {
  if (!file) return true;
  if (file.size < 10 * 1024 || file.size > 5 * 1024 * 1024) return false;
  const extension = path.extname(file.originalname).toLowerCase();
  const header = file.buffer.subarray(0, 8);
  if (extension === ".pdf") return header.subarray(0, 4).toString() === "%PDF";
  if (extension === ".png") return header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === ".jpg" || extension === ".jpeg") {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }
  return false;
};

const privateFilename = (originalName) => {
  const baseName = path.win32.basename(path.basename(originalName));
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(-100);
  return `${uuidv4()}-${sanitized || "authorization-letter"}`;
};

const htmlPage = (title, message, success = false) => `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><body style="font:16px Arial,sans-serif;background:#f8fafc;color:#1f2937;padding:48px 16px">
<main style="max-width:560px;margin:auto;background:white;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
<h1 style="font-size:24px">${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>
${success ? `<p><a href="${registrationClientUrl}/login">Continue to Uni Finder</a></p>` : ""}
</main></body></html>`;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

export const submitUniversityAdminApplication = async (req, res) => {
  let savedLetterPath = null;
  try {
    const requestedUserId = String(req.body.userId || "").trim();
    const userId = String(req.user?.id || "");
    const fullName = normalizeName(req.body.full_name);
    const designation = String(req.body.designation || "").trim();
    const designationOther = normalizeName(req.body.designation_other);
    const universityId = String(req.body.university_id || "").trim();
    const emailResult = validateEmail(req.body.official_email);
    const phone = normalizePhone(req.body.phone);
    const confirmation = req.body.confirmation === "true" || req.body.confirmation === true;
    const file = req.file;
    const errors = {};

    if (!userId || requestedUserId !== userId) {
      return res.status(403).json({ message: "Your account session is no longer valid. Please sign in again." });
    }
    if (!validName(fullName, 3, 70, true)) {
      errors.full_name = "Please enter your full name (first and last name), letters only.";
    }
    if (!DESIGNATIONS.includes(designation)) errors.designation = "Please select your designation.";
    if (designation === "Other" && !validName(designationOther, 3, 60)) {
      errors.designation_other = "Please specify a valid designation.";
    }
    if (!universityId) errors.university_id = "Please select your university from the list.";
    if (emailResult.error) errors.official_email = emailResult.error;
    if (!phone) errors.phone = PHONE_ERROR;
    if (!confirmation) errors.confirmation = "Please confirm to continue.";
    if (file && !verifyFile(file)) errors.authorization_letter = LETTER_ERROR;
    if (Object.keys(errors).length) return res.status(400).json({ errors });
    const users = await query(
      "SELECT id, email, role FROM Student_signup WHERE id = ? LIMIT 1",
      [userId],
    );
    if (!users.length || users[0].role !== "university") {
      return res.status(403).json({ message: "A university administrator account is required." });
    }

    const universities = await query(
      `SELECT id, name, oric_domain, focal_person_name, focal_person_email
       FROM universities WHERE id = ? LIMIT 1`,
      [universityId],
    );
    if (!universities.length) {
      return res.status(400).json({
        errors: { university_id: "Please select your university from the list." },
      });
    }
    const university = universities[0];

    // ── PART C guard 1: one active application per user ──────────────────────
    // Check applications table first (new flow)
    const activeUserApp = await query(
      `SELECT a.id, a.status, u.name AS university_name
       FROM applications a
       JOIN universities u ON u.id COLLATE utf8mb4_general_ci = a.university_id COLLATE utf8mb4_general_ci
       WHERE a.user_uid = ?
         AND LOWER(a.status) IN ('awaiting','pending','under_review','info_required','under review','info required','approved')
       ORDER BY a.created_at DESC LIMIT 1`,
      [userId],
    );
    if (activeUserApp.length) {
      const row = activeUserApp[0];
      return res.status(409).json({
        message: `You already have an application for ${row.university_name}. Wait for review or use Resubmit after rejection.`,
      });
    }
    // Also check legacy university_verification table (graceful — table may not exist)
    try {
      const legacyUserApp = await query(
        `SELECT id, status, university_name FROM university_verification
         WHERE user_uid = ? AND LOWER(status) IN ('pending','under review','info required','approved')
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );
      if (legacyUserApp.length) {
        const row = legacyUserApp[0];
        return res.status(409).json({
          message: `You already have an application for ${row.university_name}. Wait for review or use Resubmit after rejection.`,
        });
      }
    } catch (legacyErr) {
      if (legacyErr.code !== "ER_NO_SUCH_TABLE") throw legacyErr;
      // table doesn't exist yet — skip legacy check
    }

    // ── PART C guard 2 & 3: university claim state ────────────────────────────
    const uniStateRows = await query(
      `SELECT
         CASE
           WHEN u.owner_uid IS NOT NULL
                OR EXISTS (SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id AND LOWER(a.status) = 'approved')
             THEN 'registered'
           WHEN EXISTS (SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id
                        AND LOWER(a.status) IN ('awaiting','pending','under_review','info_required','under review','info required'))
             THEN 'in_process'
           ELSE 'available'
         END AS state,
         EXISTS (
           SELECT 1 FROM applications a WHERE a.university_id COLLATE utf8mb4_general_ci = u.id AND LOWER(a.status) = 'rejected'
         ) AS previously_rejected
       FROM universities u WHERE u.id = ? LIMIT 1`,
      [universityId],
    );
    const uniState = uniStateRows[0]?.state || "available";
    const previouslyRejected = Boolean(uniStateRows[0]?.previously_rejected);

    if (uniState === "registered") {
      return res.status(409).json({ message: "This university is already registered." });
    }
    if (uniState === "in_process") {
      return res.status(409).json({ message: "University registration is in process." });
    }

    const { email, domain } = emailResult;
    const domainState = getDomainState(domain, university.oric_domain);

    // ── PART C LOE required rules ─────────────────────────────────────────────
    // Required when: domain_state !== 'match', designation = 'Other',
    // university previously_rejected, OR user has a rejected app (resubmit)
    const userHasRejected = await query(
      `SELECT id FROM applications
       WHERE user_uid = ? AND university_id = ? AND LOWER(status) = 'rejected'
       LIMIT 1`,
      [userId, universityId],
    );
    const isResubmit = userHasRejected.length > 0;
    const requiresLetter =
      domainState !== "match" ||
      designation === "Other" ||
      previouslyRejected ||
      isResubmit;
    if (requiresLetter && !file) {
      return res.status(400).json({ errors: { authorization_letter: DOMAIN_ERROR } });
    }

    const emailInUse = await query(
      `SELECT id FROM Student_signup
       WHERE LOWER(email) = LOWER(?) AND id <> ? LIMIT 1`,
      [email, userId],
    );
    if (emailInUse.length) {
      return res.status(409).json({ message: "This email is already in use by another account." });
    }

    const emailExists = await query(
      `SELECT id FROM applications
       WHERE LOWER(email) = ? AND LOWER(status) IN ('awaiting','pending','under_review','info_required','under review','info required','approved')
       LIMIT 1`,
      [email],
    );
    if (emailExists.length) {
      return res.status(409).json({
        errors: { official_email: "This email already has a pending or approved application." },
      });
    }
    const legacyEmailExists = await query(
      `SELECT id FROM university_verification
       WHERE LOWER(official_email) = ? AND LOWER(status) IN ('pending','under review','info required','approved')
       LIMIT 1`,
      [email],
    ).catch((e) => (e.code === "ER_NO_SUCH_TABLE" ? [] : Promise.reject(e)));
    if (legacyEmailExists.length) {
      return res.status(409).json({
        errors: { official_email: "This email already has a pending or approved application." },
      });
    }

    const ipAddress = req.ip || req.socket.remoteAddress || "";
    const recent = await query(
      `SELECT COUNT(*) AS total FROM applications
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND (LOWER(email) = ? OR ip_address = ?)`,
      [email, ipAddress],
    );
    if (Number(recent[0].total) >= 3) {
      return res.status(429).json({
        message: "You have reached the limit of 3 applications in 24 hours. Please try again later.",
      });
    }

    const referenceYear = new Date().getFullYear();
    let referenceNo;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      referenceNo = `UA-${referenceYear}-${String(crypto.randomInt(0, 10000)).padStart(4, "0")}`;
      const exists = await query("SELECT id FROM applications WHERE reference_no = ? LIMIT 1", [referenceNo]);
      if (!exists.length) break;
      referenceNo = null;
    }
    if (!referenceNo) throw new Error("Could not allocate an application reference number.");

    if (file) {
      await fsp.mkdir(privateLetterDir, { recursive: true });
      savedLetterPath = path.join(privateLetterDir, privateFilename(file.originalname));
      await fsp.writeFile(savedLetterPath, file.buffer, { flag: "wx", mode: 0o600 });
    }

    const applicationId = uuidv4();
    const verificationToken = randomToken();
    const focalEmailMatch =
      normalizeEmail(university.focal_person_email) === email ? 1 : 0;
    const focalName = normalizeName(university.focal_person_name)
      .replace(/^(mr|mrs|ms|dr|prof)\.?\s+/i, "")
      .toLowerCase();
    const applicantName = fullName
      .replace(/^(mr|mrs|ms|dr|prof)\.?\s+/i, "")
      .toLowerCase();
    await query(
      `INSERT INTO applications
       (id, reference_no, user_uid, university_id, full_name, designation,
        designation_other, email, phone, loe_path, domain_state,
        focal_email_match, focal_name_match, status, verification_token_hash,
        verification_token_expires, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?)`,
      [
        applicationId,
        referenceNo,
        userId,
        universityId,
        fullName,
        designation,
        designation === "Other" ? designationOther : null,
        email,
        phone,
        savedLetterPath,
        domainState,
        focalEmailMatch,
        focalName && focalName === applicantName ? 1 : 0,
        tokenHash(verificationToken),
        ipAddress,
      ],
    );

    const verificationUrl = `${registrationApiUrl}/api/university/verification/confirm/${verificationToken}`;
    try {
      await sendRegistrationEmail({
        to: email,
        subject: `Verify your Uni Finder application (${referenceNo})`,
        text:
          `Hello ${fullName},\n\n` +
          `Your university admin application reference is ${referenceNo}.\n` +
          `Verify that you own this email address to send your application for review:\n${verificationUrl}\n\n` +
          `The link expires in 24 hours. If you did not submit this application, ignore this email.`,
      });
    } catch (mailError) {
      await query("DELETE FROM applications WHERE id = ?", [applicationId]);
      if (savedLetterPath) await fsp.unlink(savedLetterPath).catch(() => {});
      console.error("University application verification email failed:", mailError.message);
      return res.status(503).json({
        message: "We could not send the verification email. Please try again later.",
      });
    }

    return res.status(201).json({
      message: "Application received. Check your email to verify your address.",
      referenceNo,
    });
  } catch (error) {
    if (savedLetterPath) await fsp.unlink(savedLetterPath).catch(() => {});
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        errors: { official_email: "This email already has a pending or approved application." },
      });
    }
    console.error("University application submission failed:", error.message);
    return res.status(500).json({ message: "Could not submit your application. Please try again." });
  }
};

export const confirmUniversityAdminEmail = async (req, res) => {
  try {
    const hash = tokenHash(req.params.token || "");
    const applications = await query(
      `SELECT a.*, u.name AS university_name, u.id AS matched_university_id
       FROM applications a JOIN universities u ON u.id COLLATE utf8mb4_general_ci = a.university_id COLLATE utf8mb4_general_ci
       WHERE a.verification_token_hash = ? AND a.verification_token_expires > NOW()
       LIMIT 1`,
      [hash],
    );
    if (!applications.length) {
      return res.status(400).type("html").send(htmlPage(
        "Link expired",
        "This verification link is invalid or has expired. Please submit your application again.",
      ));
    }
    const application = applications[0];
    const usersWithEmail = await query(
      "SELECT id FROM Student_signup WHERE LOWER(email) = LOWER(?) AND id <> ? LIMIT 1",
      [application.email, application.user_uid],
    );
    if (usersWithEmail.length) {
      return res.status(409).type("html").send(htmlPage(
        "Email already in use",
        "This email address is already linked to another account. Contact support for help.",
      ));
    }
    if (await isClaimed(application.university_id)) {
      await query("UPDATE applications SET status='Rejected' WHERE id=?", [application.id]);
      return res.status(409).type("html").send(htmlPage(
        "University already registered",
        "This university was registered while your application was awaiting email verification. Please contact support.",
      ));
    }

    const verificationId = uuidv4();
    const transaction = createTransactionConnection();
    const transactionQuery = (sql, values = []) =>
      new Promise((resolve, reject) => {
        transaction.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
      });
    let transactionStarted = false;
    try {
      await new Promise((resolve, reject) => {
        transaction.connect((connectionError) =>
          connectionError ? reject(connectionError) : resolve(),
        );
      });
      await new Promise((resolve, reject) => {
        transaction.beginTransaction((beginError) =>
          beginError ? reject(beginError) : resolve(),
        );
      });
      transactionStarted = true;
      await transactionQuery(
        `INSERT INTO university_verification
         (id, user_uid, university_name, university_id, full_name, designation,
          designation_other, official_email, email_domain_verified, phone,
          authorization_letter_url, loe_path, domain_state, focal_email_match,
          focal_name_match, reference_no, application_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          verificationId,
          application.user_uid,
          application.university_name,
          application.university_id,
          application.full_name,
          application.designation,
          application.designation_other,
          application.email,
          application.domain_state === "match" ? 1 : 0,
          application.phone,
          application.loe_path,
          application.domain_state,
          application.focal_email_match,
          application.focal_name_match,
          application.reference_no,
          application.id,
        ],
      );
      await transactionQuery(
        `UPDATE Student_signup SET email=?, username=?, name=?, role='university'
         WHERE id=?`,
        [application.email, application.email, application.full_name, application.user_uid],
      );
      await transactionQuery(
        `UPDATE applications SET email_verified_at=NOW(), verification_token_hash=NULL,
         verification_token_expires=NULL WHERE id=?`,
        [application.id],
      );
      await sendRegistrationEmail({
        to: application.email,
        subject: `Application received (${application.reference_no})`,
        text:
          `Your email has been verified and your application ${application.reference_no} ` +
          `for ${application.university_name} is now with our team. We aim to verify your details ` +
          `within 2–3 working days. You will receive an invite link on your official email once approved.`,
      });
      await new Promise((resolve, reject) => {
        transaction.commit((commitError) => (commitError ? reject(commitError) : resolve()));
      });
    } catch (transactionError) {
      if (transactionStarted) {
        await new Promise((resolve) => transaction.rollback(() => resolve()));
      }
      throw transactionError;
    } finally {
      transaction.end();
    }

    const admins = await query("SELECT id, email FROM Student_signup WHERE role='admin'");
    for (const admin of admins) {
      sendNotification({
        recipientUid: admin.id,
        recipientEmail: admin.email,
        subject: "Email-verified university admin application",
        body: `${application.full_name} verified their email for ${application.university_name}.\nReference: ${application.reference_no}`,
        type: "university_verification_request",
      });
    }

    return res.status(200).type("html").send(htmlPage(
      "Email verified",
      `Application ${application.reference_no} has been sent to our team for review.`,
      true,
    ));
  } catch (error) {
    console.error("University application email verification failed:", error.message);
    return res.status(500).type("html").send(htmlPage(
      "Verification could not be completed",
      "We could not complete this verification. Please contact support.",
    ));
  }
};

export const streamAuthorizationLetter = async (req, res) => {
  try {
    // Look up from applications table first (new flow), then fall back to
    // university_verification (legacy rows submitted before the migration).
    let loe = null;
    const appRows = await query(
      "SELECT loe_path FROM applications WHERE id = ? LIMIT 1",
      [req.params.id],
    );
    if (appRows.length && appRows[0].loe_path) {
      loe = appRows[0].loe_path;
    } else {
      // legacy: the caller may pass a university_verification id
      const uvRows = await query(
        "SELECT loe_path FROM university_verification WHERE id = ? LIMIT 1",
        [req.params.id],
      );
      if (uvRows.length && uvRows[0].loe_path) loe = uvRows[0].loe_path;
    }

    if (!loe) return res.status(404).json({ message: "Authorization letter not found." });
    const target = path.resolve(loe);
    if (!fs.existsSync(target)) {
      return res.status(404).json({ message: "Authorization letter not found." });
    }
    return res.sendFile(target, { headers: { "Content-Disposition": "inline" } });
  } catch (error) {
    console.error("Private authorization letter retrieval failed:", error.message);
    return res.status(500).json({ message: "Could not load the authorization letter." });
  }
};

export const requestApplicationInformation = async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (!reason) return res.status(400).json({ message: "A request for information is required." });
  try {
    const rows = await query(
      `SELECT v.*, u.email AS admin_email, u.name AS admin_name
       FROM university_verification v JOIN Student_signup u ON u.id COLLATE utf8mb4_general_ci = v.user_uid COLLATE utf8mb4_general_ci
       WHERE v.id=? LIMIT 1`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ message: "Request not found." });
    const record = rows[0];
    await query(
      "UPDATE university_verification SET status='Info Required', reject_reason=? WHERE id=?",
      [reason, record.id],
    );
    if (record.application_id) {
      await query("UPDATE applications SET status='Info Required' WHERE id=?", [record.application_id]);
    }
    await sendRegistrationEmail({
      to: record.official_email || record.admin_email,
      subject: `More information required (${record.reference_no || record.university_name})`,
      text: `Hello ${record.full_name || record.admin_name},\n\nOur team needs additional information for your university application: ${reason}\n\nPlease reply to this email with the requested information.`,
    });
    return res.status(200).json({ message: "Information request sent.", status: "Info Required" });
  } catch (error) {
    console.error("University information request failed:", error.message);
    return res.status(500).json({ message: "Could not request additional information." });
  }
};

export const showUniversityPasswordSetup = async (req, res) => {
  try {
    const hash = tokenHash(req.params.token || "");
    const rows = await query(
      `SELECT id FROM applications
       WHERE invite_token_hash=? AND invite_token_expires > NOW() AND status='Approved'
       LIMIT 1`,
      [hash],
    );
    if (!rows.length) {
      return res.status(400).type("html").send(htmlPage(
        "Invite link expired",
        "This password setup link is invalid or has expired. Contact support for a new invite.",
      ));
    }
    return res.type("html").send(`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Set your password</title><body style="font:16px Arial,sans-serif;background:#f8fafc;color:#1f2937;padding:48px 16px">
<main style="max-width:480px;margin:auto;background:white;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
<h1>Set your Uni Finder password</h1>
<form method="post" action="/api/university/invitation/${encodeURIComponent(req.params.token)}">
<label for="password">New password (at least 8 characters)</label>
<input id="password" name="password" type="password" minlength="8" autocomplete="new-password" required
style="box-sizing:border-box;display:block;width:100%;padding:12px;margin:12px 0 20px;border:1px solid #d1d5db;border-radius:8px">
<button type="submit" style="padding:12px 18px;background:#f97316;color:white;border:0;border-radius:8px">Set password</button>
</form></main></body></html>`);
  } catch (error) {
    console.error("University password setup link lookup failed:", error.message);
    return res.status(500).type("html").send(htmlPage(
      "Could not load invite",
      "Please contact support.",
    ));
  }
};

export const setUniversityPassword = async (req, res) => {
  const password = String(req.body.password || "");
  if (password.length < 8 || password.length > 128) {
    return res.status(400).type("html").send(htmlPage(
      "Password not accepted",
      "Choose a password between 8 and 128 characters.",
    ));
  }
  try {
    const hash = tokenHash(req.params.token || "");
    const rows = await query(
      `SELECT id, user_uid FROM applications
       WHERE invite_token_hash=? AND invite_token_expires > NOW() AND status='Approved'
       LIMIT 1`,
      [hash],
    );
    if (!rows.length) {
      return res.status(400).type("html").send(htmlPage(
        "Invite link expired",
        "This password setup link is invalid or has expired. Contact support for a new invite.",
      ));
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await query("UPDATE Student_signup SET password=? WHERE id=?", [passwordHash, rows[0].user_uid]);
    await query(
      "UPDATE applications SET invite_token_hash=NULL, invite_token_expires=NULL WHERE id=?",
      [rows[0].id],
    );
    return res.type("html").send(htmlPage(
      "Password set",
      "Your password is ready. You can now sign in with your official email address.",
      true,
    ));
  } catch (error) {
    console.error("University password setup failed:", error.message);
    return res.status(500).type("html").send(htmlPage(
      "Could not set password",
      "Please contact support.",
    ));
  }
};
