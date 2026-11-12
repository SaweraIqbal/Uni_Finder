import { sendNotification as _sendNotification, sendEmail, emailClientUrl, emailApiUrl } from "./emailService.js";

export { sendEmail, emailClientUrl, emailApiUrl };
export const sendNotification = _sendNotification;
export default _sendNotification;
