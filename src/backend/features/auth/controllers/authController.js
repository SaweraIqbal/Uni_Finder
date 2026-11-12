import { v4 as uuidv4 } from "uuid";
import { env } from "node:process";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import db from "../../../shared/db.js";
import jwt from "jsonwebtoken";
import { assignedIdFor } from "../../../shared/utils/assignedId.js";
import { sendEmail, emailClientUrl } from "../../../shared/email/emailService.js";
import { normalizeEmail } from "../../../shared/email/emailValidation.js";

const PASSWORD_REGEX = /^.{8,}$/;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

const queryAsync = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (error, rows) => (error ? reject(error) : resolve(rows)));
  });

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

const sendVerificationEmail = async ({ userId, email, name, expiresAt }) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const tokenId = uuidv4();

  await queryAsync("DELETE FROM email_verification_tokens WHERE user_id = ?", [userId]);
  await queryAsync(
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [tokenId, userId, tokenHash, expiresAt],
  );

  const verificationUrl = `${emailClientUrl}/verify-email/${token}`;
  const safeName = escapeHtml(name || "there");

  if (process.env.NODE_ENV !== "production") {
    console.log(`[dev] verification link for ${email}: ${verificationUrl}`);
  }

  try {
    await sendEmail({
      to: email,
      subject: "Verify your Uni Finder email address",
      text:
        `Hello ${name || "there"},\n\n` +
        `Verify your email address to activate your Uni Finder account:\n${verificationUrl}\n\n` +
        `This link expires in 24 hours. If you did not create this account, you can ignore this email.\n\n` +
        "Regards,\nUni Finder Team",
      html:
        `<p>Hello ${safeName},</p>` +
        "<p>Verify your email address to activate your Uni Finder account:</p>" +
        `<p><a href="${verificationUrl}">Verify my email address</a></p>` +
        "<p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>" +
        "<p>Regards,<br>Uni Finder Team</p>",
    });
  } catch (error) {

    console.error(
      `[email verification] delivery failed for ${email}; token kept so the console link still works in dev.`,
    );
    error.isEmailDeliveryError = true;
    throw error;
  }
};

const sendVerificationEmailWithRetry = async (payload, attempts = 2) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await sendVerificationEmail(payload);
      return;
    } catch (error) {
      console.error(
        `[verification email] attempt ${attempt}/${attempts} failed for ${payload.email}:`,
        error.message,
      );
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 1500));
    }
  }
};

const issueSession = async (user) => {
  let universityId = null;
  if (user.role === "university") {
    try {
      const rows = await queryAsync(
        "SELECT id FROM universities WHERE owner_uid = ? LIMIT 1",
        [user.id],
      );
      if (rows.length) universityId = rows[0].id;
    } catch {}
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  if (universityId) payload.university_id = universityId;

  const token = jwt.sign(payload, env.JWT_SECRET || "secretkey", { expiresIn: "1d" });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      ...(universityId ? { university_id: universityId } : {}),
    },
  };
};

export const signup = (req, res) => {
  const { name, username, email, password, role } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }
  if (typeof username !== "string" || !username.trim()) {
    return res.status(400).json({ message: "Username is required" });
  }
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }
  const allowedRoles = ["student", "university", "campus", "hostel", "campus_hostel"];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: "A valid role is required" });
  }

  db.query(
    "SELECT id FROM Student_signup WHERE LOWER(email) = ? LIMIT 1",
    [normalizedEmail],
    (dupErr, dupRows) => {
      if (dupErr) {
        console.error("[signup] duplicate-check DB error:", dupErr.message);
        return res.status(500).json({ message: "Server error, please try again" });
      }
      if (dupRows.length > 0) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const userId = uuidv4();
      const hashedPassword = bcrypt.hashSync(password, 10);
      const assignedId = assignedIdFor(role, userId);
      const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

      const sql = `
        INSERT INTO Student_signup
          (id, name, username, email, password, role, assigned_id, email_verified, email_verification_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `;

      db.query(
        sql,
        [userId, name.trim(), username.trim(), normalizedEmail, hashedPassword, role, assignedId, verificationExpiresAt],
        (err) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              return res.status(409).json({ message: "An account with this email already exists" });
            }
            console.error("[signup] insert DB error:", err.message);
            return res.status(500).json({ message: "Server error, please try again" });
          }

          res.status(201).json({
            message: "Account created. Check your email for a verification link.",
            verificationRequired: true,
            email: normalizedEmail,
          });

          sendVerificationEmailWithRetry({
            userId,
            email: normalizedEmail,
            name: name.trim(),
            expiresAt: verificationExpiresAt,
          });
        },
      );
    },
  );
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ message: "Invalid or expired verification link" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const rows = await queryAsync(
      `SELECT user.id, user.name, user.username, user.email, user.role, user.email_verified
       FROM email_verification_tokens AS verification
       INNER JOIN Student_signup AS user ON user.id = verification.user_id
       WHERE verification.token_hash = ?
         AND verification.used_at IS NULL
         AND verification.expires_at > NOW()
         AND user.email_verification_expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );

    if (!rows.length) {
      const usedRows = await queryAsync(
        `SELECT user.role, user.email_verified
         FROM email_verification_tokens AS verification
         INNER JOIN Student_signup AS user ON user.id = verification.user_id
         WHERE verification.token_hash = ?
         LIMIT 1`,
        [tokenHash],
      );
      if (usedRows.length && Number(usedRows[0].email_verified) === 1) {
        return res.status(200).json({
          message: "This email is already verified. You can sign in.",
          alreadyVerified: true,
          role: usedRows[0].role,
        });
      }
      return res.status(400).json({ message: "Invalid, expired, or already used verification link" });
    }

    const user = rows[0];
    await queryAsync("UPDATE Student_signup SET email_verified = 1 WHERE id = ?", [user.id]);
    await queryAsync(
      "UPDATE email_verification_tokens SET used_at = NOW() WHERE token_hash = ?",
      [tokenHash],
    );

    const session = await issueSession(user);
    return res.status(200).json({
      message: "Email verified. Let's finish your registration.",
      alreadyVerified: false,
      ...session,
    });
  } catch (error) {
    console.error("[verifyEmail] DB error:", error.message);
    return res.status(500).json({ message: "Could not verify your email. Please try again." });
  }
};

export const resendVerificationEmail = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email);
  if (!normalizedEmail) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }

  try {
    const users = await queryAsync(
      `SELECT id, name, email, email_verified, email_verification_expires_at
       FROM Student_signup
       WHERE LOWER(email) = ? AND email_verification_expires_at > NOW()
       LIMIT 1`,
      [normalizedEmail],
    );
    if (
      !users.length ||
      Number(users[0].email_verified) === 1
    ) {
      return res.status(202).json({
        message: "If an unverified account exists for this address, a verification email will be sent.",
      });
    }

    const recentTokens = await queryAsync(
      `SELECT id FROM email_verification_tokens
       WHERE user_id = ?
         AND created_at > DATE_SUB(NOW(), INTERVAL ${VERIFICATION_RESEND_COOLDOWN_SECONDS} SECOND)
       LIMIT 1`,
      [users[0].id],
    );
    if (recentTokens.length) {
      return res.status(429).json({
        message: "Please wait a minute before requesting another verification email.",
      });
    }

    await sendVerificationEmail({
      userId: users[0].id,
      email: users[0].email,
      name: users[0].name || "there",
      expiresAt: users[0].email_verification_expires_at,
    });
    return res.status(202).json({
      message: "If an unverified account exists for this address, a verification email will be sent.",
    });
  } catch (error) {
    console.error(
      error.isEmailDeliveryError
        ? "[resendVerificationEmail] email delivery failed:"
        : "[resendVerificationEmail] database error:",
      error.message,
    );
    return res.status(503).json({
      message: error.isEmailDeliveryError
        ? "The verification email could not be sent. Please check the mail service and try again later."
        : "Could not process the verification request. Please try again later.",
    });
  }
};

export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ message: "Password is required" });
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  db.query("SELECT * FROM Student_signup WHERE LOWER(email) = ?", [normalizedEmail], async (err, result) => {
    if (err) {
      console.error("[login] DB error:", err.message);
      return res.status(500).json({ message: "Server error, please try again" });
    }
    if (result.length === 0) return res.status(404).json({ message: "No account found with this email" });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });
    if (!Number(user.email_verified)) {
      return res.status(403).json({
        message: "Please verify your email address before signing in.",
        verificationRequired: true,
      });
    }

    const session = await issueSession(user);

    return res.status(200).json({
      message: "Login Successful",
      ...session,
    });
  });
};

export const forgotPassword = (req, res) => {
  const { email } = req.body;

  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  db.query(
    "SELECT id, name FROM Student_signup WHERE LOWER(email) = ? LIMIT 1",
    [normalizedEmail],
    async (err, rows) => {
      if (err) {
        console.error("[forgotPassword] DB error:", err.message);

        return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
      }

      if (rows.length === 0) {
        return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
      }

      const user = rows[0];
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const resetId = uuidv4();

      db.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`,
        [resetId, user.id, tokenHash, expiresAt],
        (insertErr) => {
          if (insertErr) {
            console.error("[forgotPassword] token insert error:", insertErr.message);
            return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
          }

          const resetUrl = `${emailClientUrl}/reset-password/${token}`;
          sendEmail({
            to: normalizedEmail,
            subject: "Reset your Uni Finder password",
            text:
              `Hello ${user.name || "User"},\n\n` +
              `We received a request to reset your password. Click the link below to set a new one:\n\n` +
              `${resetUrl}\n\n` +
              `This link expires in 1 hour. If you did not request this, you can safely ignore this email.\n\n` +
              `Regards,\nUni Finder Team`,
            html:
              `<p>Hello ${user.name || "User"},</p>` +
              `<p>We received a request to reset your password. Click the link below to set a new one:</p>` +
              `<p><a href="${resetUrl}">Reset my password</a></p>` +
              `<p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>` +
              `<p>Regards,<br>Uni Finder Team</p>`,
          }).catch((mailErr) => {
            console.error("Reset email failed (non-fatal):", mailErr.message);
          });

          return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
        },
      );
    },
  );
};

export const resetPassword = (req, res) => {
  const { token, password } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Reset token is required" });
  }
  if (!password) {
    return res.status(400).json({ message: "New password is required" });
  }
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  db.query(
    `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at
     FROM password_reset_tokens prt
     WHERE prt.token_hash = ? AND prt.used_at IS NULL AND prt.expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
    (err, rows) => {
      if (err) {
        console.error("[resetPassword] DB error:", err.message);
        return res.status(500).json({ message: "Server error, please try again" });
      }
      if (rows.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      const resetRecord = rows[0];
      const hashedPassword = bcrypt.hashSync(password, 10);

      db.query(
        "UPDATE Student_signup SET password = ? WHERE id = ?",
        [hashedPassword, resetRecord.user_id],
        (updateErr) => {
          if (updateErr) {
            console.error("[resetPassword] password update error:", updateErr.message);
            return res.status(500).json({ message: "Server error, please try again" });
          }

          db.query(
            "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?",
            [resetRecord.id],
            () => {},
          );

          return res.status(200).json({ message: "Password reset successful. You can now log in." });
        },
      );
    },
  );
};
