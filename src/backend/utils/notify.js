// Simulated email system. Every "email" is saved to the notifications table
// and printed to the console. To go live later, send a real email here too.
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";

export const sendNotification = ({ recipientUid, recipientEmail, subject, body, type }) => {
  const id = uuidv4();
  db.query(
    `INSERT INTO notifications (id, recipient_uid, recipient_email, subject, body, type)
     VALUES (?,?,?,?,?,?)`,
    [id, recipientUid || null, recipientEmail || null, subject, body, type || null],
    (err) => {
      if (err) {
        console.log("Notification save error:", err.message);
        return;
      }
      console.log("\n================ EMAIL (simulated) ================");
      console.log("To     :", recipientEmail || recipientUid);
      console.log("Subject:", subject);
      console.log("Type   :", type);
      console.log(body);
      console.log("===================================================\n");
    }
  );
  return id;
};

export default sendNotification;
