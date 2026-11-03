import db from "../config/db.js";

export default function requireApprovedHostel(req, res, next) {
  db.query(
    "SELECT id FROM hostels WHERE owner_uid = ? AND status = 'approved' LIMIT 1",
    [req.user.id],
    (error, rows) => {
      if (error) {
        console.error("Hostel approval access check failed:", error.message);
        return res.status(500).json({ message: "Could not verify hostel approval." });
      }
      if (!rows.length) {
        return res.status(403).json({ message: "Hostel dashboard access is available after approval." });
      }
      next();
    }
  );
}
