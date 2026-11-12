import { sendEmail } from "../../shared/email/emailService.js";

const clean = (v) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export async function reportMissingUniversity(req, res) {
  const name = clean(req.body?.name ?? "");
  const email = clean(req.body?.email ?? "").toLowerCase();
  const universityName = clean(req.body?.universityName ?? "");
  const message = clean(req.body?.message ?? "");

  const errors = {};

  if (!name || name.length < 2 || name.length > 80) {
    errors.name = "Please enter your full name (2–80 characters).";
  }

  if (!email || !EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!universityName || universityName.length < 3 || universityName.length > 160) {
    errors.universityName = "Please enter the university name (3–160 characters).";
  }

  if (message && message.length > 500) {
    errors.message = "Additional details must be 500 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  const adminRecipient =
    process.env.CONTACT_EMAIL ||
    (process.env.EMAIL_FROM?.match(/<(.+)>/))?.[1] ||
    process.env.SMTP_USER;

  if (!adminRecipient) {
    console.error("[contact] No admin recipient configured (CONTACT_EMAIL / EMAIL_FROM / SMTP_USER).");
    return res.status(503).json({ message: "Email service is not configured. Please try again later." });
  }

  const adminText = [
    "A university admin has reported that their university is not listed on UniFinder.",
    "",
    `Name            : ${name}`,
    `Email           : ${email}`,
    `University name : ${universityName}`,
    message ? `Additional notes: ${message}` : "",
    "",
    "Please review and add the university if appropriate, then follow up with the requester.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const adminHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <div style="background:#c88410;padding:24px 32px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;color:#fff;font-size:18px">Missing University Request</h2>
        <p style="margin:4px 0 0;color:#fef3c7;font-size:13px">UniFinder — University Not Found Report</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:140px;vertical-align:top">Name</td>
            <td style="padding:8px 0;font-weight:600;color:#111827">${escapeHtml(name)}</td>
          </tr>
          <tr style="border-top:1px solid #f3f4f6">
            <td style="padding:8px 0;color:#6b7280;vertical-align:top">Email</td>
            <td style="padding:8px 0;color:#111827">
              <a href="mailto:${escapeHtml(email)}" style="color:#c88410">${escapeHtml(email)}</a>
            </td>
          </tr>
          <tr style="border-top:1px solid #f3f4f6">
            <td style="padding:8px 0;color:#6b7280;vertical-align:top">University</td>
            <td style="padding:8px 0;font-weight:600;color:#111827">${escapeHtml(universityName)}</td>
          </tr>
          ${message ? `
          <tr style="border-top:1px solid #f3f4f6">
            <td style="padding:8px 0;color:#6b7280;vertical-align:top">Notes</td>
            <td style="padding:8px 0;color:#374151;white-space:pre-wrap">${escapeHtml(message)}</td>
          </tr>` : ""}
        </table>
        <div style="margin-top:24px;padding:14px 16px;background:#fef9ee;border:1px solid #fde68a;border-radius:8px;font-size:13px;color:#92400e">
          Reply directly to <strong>${escapeHtml(email)}</strong> to follow up with this user.
        </div>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">UniFinder · Automated contact report</p>
    </div>
  `;

  const userText = [
    `Hi ${name},`,
    "",
    "We've received your request to add your university to UniFinder.",
    "",
    `University requested: ${universityName}`,
    "",
    "Our team will review your submission and get back to you within 2–3 business days.",
    "If your university is approved, you'll be notified and can then complete your admin verification.",
    "",
    "Thanks for helping us grow the UniFinder database!",
    "",
    "— The UniFinder Team",
  ].join("\n");

  const userHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <div style="background:#c88410;padding:24px 32px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;color:#fff;font-size:18px">We've received your request</h2>
        <p style="margin:4px 0 0;color:#fef3c7;font-size:13px">UniFinder — University Request Confirmation</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
        <p style="font-size:15px;margin-top:0">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.6">
          We've received your request to add <strong>${escapeHtml(universityName)}</strong> to UniFinder.
          Our team will review your submission and get back to you within <strong>2–3 business days</strong>.
        </p>
        <p style="font-size:14px;color:#374151;line-height:1.6">
          Once your university is added, you'll receive a follow-up email so you can complete
          your University Admin Verification.
        </p>
        <div style="margin-top:24px;padding:14px 16px;background:#fef9ee;border:1px solid #fde68a;border-radius:8px;font-size:13px;color:#92400e">
          Have questions? Reply to this email or contact us at
          <a href="mailto:${escapeHtml(adminRecipient)}" style="color:#c88410">${escapeHtml(adminRecipient)}</a>.
        </div>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">UniFinder · You're receiving this because you submitted a university request.</p>
    </div>
  `;

  const results = await Promise.allSettled([
    sendEmail({
      to: adminRecipient,
      subject: `[UniFinder] Missing University: ${universityName}`,
      text: adminText,
      html: adminHtml,
    }),
    sendEmail({
      to: email,
      subject: "We've received your university request — UniFinder",
      text: userText,
      html: userHtml,
    }),
  ]);

  const adminFailed = results[0].status === "rejected";
  const userFailed = results[1].status === "rejected";

  if (adminFailed) {
    console.error("[contact] Admin notification email failed:", results[0].reason?.message);
  }
  if (userFailed) {
    console.error("[contact] User confirmation email failed:", results[1].reason?.message);
  }

  if (adminFailed) {
    return res.status(503).json({
      message: "We could not send your request at this time. Please try again later.",
    });
  }

  return res.status(200).json({
    message: "Request received. We'll be in touch within 2–3 business days.",
    confirmationSent: !userFailed,
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
