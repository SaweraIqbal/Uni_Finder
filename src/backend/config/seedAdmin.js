
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "./db.js";

const DEFAULT_ADMIN = {
  name: "Super Admin",
  username: "superadmin",
  email: "superadmin@unifinder.com",
  password: "Admin@123",
  role: "admin",
};

export const seedSuperAdmin = () =>
  new Promise((resolve) => {
    const { name, username, email, password, role } = DEFAULT_ADMIN;
    const hashed = bcrypt.hashSync(password, 10);

    db.query(
      "SELECT id FROM Student_signup WHERE email = ?",
      [email],
      (err, rows) => {
        if (err) {
          console.log("Seed admin error:", err.message);
          return resolve();
        }

        if (rows.length > 0) {
          // Always sync the password hash so a stale hash never causes a 401
          db.query(
            "UPDATE Student_signup SET password = ?, name = ?, username = ? WHERE email = ?",
            [hashed, name, username, email],
            (updErr) => {
              if (updErr) console.log("Seed admin update error:", updErr.message);
              else console.log(`SuperAdmin password synced -> ${email} / ${password}`);
              resolve();
            },
          );
          return;
        }

        db.query(
          "INSERT INTO Student_signup (id, name, username, email, password, role) VALUES (?,?,?,?,?,?)",
          [uuidv4(), name, username, email, hashed, role],
          (err2) => {
            if (err2) console.log("Seed admin insert error:", err2.message);
            else console.log(`SuperAdmin seeded -> ${email} / ${password}`);
            resolve();
          }
        );
      }
    );
  });

if (process.argv[1] && process.argv[1].endsWith("seedAdmin.js")) {
  seedSuperAdmin().then(() => process.exit(0));
}

export default seedSuperAdmin;
