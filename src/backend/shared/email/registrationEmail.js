import { sendEmail, emailClientUrl, emailApiUrl } from "./emailService.js";

export const registrationClientUrl = emailClientUrl;
export const registrationApiUrl = emailApiUrl;

export const sendRegistrationEmail = async ({ to, subject, text, html }) => {
  const result = await sendEmail({ to, subject, text, html });
  return { recipient: result.recipient, messageId: result.messageId };
};
