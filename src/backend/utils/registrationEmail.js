/**
 * registrationEmail.js — Backward-compatible wrapper around emailService.js.
 *
 * Re-exports the email helpers from the unified service so existing imports
 * (sendRegistrationEmail, registrationClientUrl, registrationApiUrl) keep working.
 */

import { sendEmail, emailClientUrl, emailApiUrl } from "./emailService.js";

export const registrationClientUrl = emailClientUrl;
export const registrationApiUrl = emailApiUrl;

/**
 * Backward-compatible wrapper. Old callers used:
 *   sendRegistrationEmail({ to, subject, text })
 * which returned { recipient, messageId }.
 */
export const sendRegistrationEmail = async ({ to, subject, text, html }) => {
  const result = await sendEmail({ to, subject, text, html });
  return { recipient: result.recipient, messageId: result.messageId };
};
