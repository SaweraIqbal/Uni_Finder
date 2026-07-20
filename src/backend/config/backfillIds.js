

import db from "./db.js";
import { assignedIdFor } from "../utils/assignedId.js";

export const backfillAssignedIds = () => {
  db.query(
    `SELECT id, role FROM Student_signup
     WHERE role IN ('university','campus') AND (assigned_id IS NULL OR assigned_id = '')`,
    (err, rows) => {
      if (err) {
        console.log("Backfill assigned_id error:", err.message);
        return;
      }
      if (!rows.length) return;
      rows.forEach((r) => {
        const aid = assignedIdFor(r.role, r.id);
        if (aid)
          db.query("UPDATE Student_signup SET assigned_id=? WHERE id=?", [aid, r.id], () => {});
      });
      console.log(`Assigned IDs backfilled for ${rows.length} account(s)`);
    }
  );
};

export default backfillAssignedIds;
