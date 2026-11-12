import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import db from "../db.js";

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
const apiUrl = (process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000").replace(/\/+$/, "");

export const emailClientUrl = clientUrl;
export const emailApiUrl = apiUrl;

const resolveRecipient = (enteredAddress) => {
  const override = process.env.EMAIL_OVERRIDE;
  const isProd = process.env.NODE_ENV === "production";

  if (!override) return { recipient: enteredAddress, overridden: false };

  if (isProd) {
    console.warn("EMAIL_OVERRIDE ignored in production — sending to real address.");
    return { recipient: enteredAddress, overridden: false };
  }

  return { recipient: override, overridden: true, original: enteredAddress };
};

let cachedTransport = null;

const createTransport = () => {
  if (cachedTransport) return cachedTransport;

  if (process.env.SMTP_URL) {
    cachedTransport = nodemailer.createTransport(process.env.SMTP_URL);
    return cachedTransport;
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }
  const port = Number(process.env.SMTP_PORT || 587);
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    pool: true,

    maxConnections: 3,
    maxMessages: 100,
    idleTimeout: 10 * 60 * 1000,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransport;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) throw new Error("sendEmail: 'to' is required.");
  if (!subject) throw new Error("sendEmail: 'subject' is required.");

  const { recipient, overridden, original } = resolveRecipient(to);
  const transport = createTransport();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: recipient,
    subject,
    text,
  };
  if (html) mailOptions.html = html;
  if (overridden) {
    mailOptions.headers = { "X-Original-Recipient": original };
  }

  const result = await transport.sendMail(mailOptions);

  if (overridden) {
    console.log(`📧 DEV override: sent to ${recipient} instead of ${original}`);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `📧 Mail accepted: to=${recipient} accepted=${(result.accepted || []).length} rejected=${(result.rejected || []).length}`,
    );
  }

  return {
    recipient,
    messageId: result.messageId,
    overridden,
    accepted: result.accepted || [],
    rejected: result.rejected || [],
  };
};

export const sendNotification = ({ recipientUid, recipientEmail, subject, body, type, html }) => {
  const id = uuidv4();

  if (recipientUid || recipientEmail) {
    db.query(
      `INSERT INTO notifications (id, recipient_uid, recipient_email, subject, body, type)
       VALUES (?,?,?,?,?,?)`,
      [id, recipientUid || null, recipientEmail || null, subject, body, type || null],
      (err) => {
        if (err && err.code !== "ER_NO_SUCH_TABLE") {
          console.error("Notification save error:", err.message);
        }
      },
    );
  }

  if (recipientEmail) {
    sendEmail({
      to: recipientEmail,
      subject,
      text: body,
      html,
    }).catch((err) => {
      console.error("sendNotification email delivery failed (non-fatal):", err.message);
    });
  }

  return id;
};

export default sendNotification;
