/**
 * notify.js — Backward-compatible wrapper around emailService.js.
 *
 * Re-exports sendNotification from the unified email service so existing
 * imports continue to work. The new service saves to DB AND sends real SMTP.
 */

import { sendNotification as _sendNotification, sendEmail, emailClientUrl, emailApiUrl } from "./emailService.js";

export { sendEmail, emailClientUrl, emailApiUrl };
export const sendNotification = _sendNotification;
export default _sendNotification;
