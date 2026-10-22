import nodemailer from "nodemailer";

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
const apiUrl = (process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000").replace(/\/+$/, "");

const emailRecipient = (enteredAddress) => {
  const override = process.env.EMAIL_OVERRIDE;
  const isProd = process.env.NODE_ENV === "production";

  if (!override) return enteredAddress;

  if (isProd) {
    console.warn("EMAIL_OVERRIDE ignored in production — sending to real address.");
    return enteredAddress;
  }

  console.log(`📧 DEV override: sending to ${override} instead of ${enteredAddress}`);
  return override;
};

const createTransport = () => {
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const registrationClientUrl = clientUrl;
export const registrationApiUrl = apiUrl;

export const sendRegistrationEmail = async ({ to, subject, text }) => {
  const recipient = emailRecipient(to);
  const transport = createTransport();
  const result = await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: recipient,
    subject,
    text,
  });
  return { recipient, messageId: result.messageId };
};
