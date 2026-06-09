import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth_route/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import universityRoutes from "./routes/universityRoutes.js";
import db from "./config/db.js";
import initSchema from "./config/schema.js";
import seedSuperAdmin from "./config/seedAdmin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded docs/images (e.g. /uploads/161234-charter.pdf)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

db.connect((err) => {
  if (err) {
    console.log("DB Connection Error:", err);
  } else {
    console.log("MySQL Connected");
    db.query(
      `
      CREATE TABLE IF NOT EXISTS Student_signup (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100),
        username VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(20)
      )`,
      (err) => {
        if (err) {
          console.log("Table create error:", err);
        } else {
          console.log("Student table ready");

          db.query(
            `
            CREATE TABLE IF NOT EXISTS Student_Profile (
              std_id VARCHAR(255) PRIMARY KEY,
              user_uid VARCHAR(255) NOT NULL,
              full_name VARCHAR(100),
              username VARCHAR(100),
              email VARCHAR(100),
              dob DATE,
              age INT,
              cnic VARCHAR(20),
              address TEXT,
              gender VARCHAR(20),
              FOREIGN KEY (user_uid) REFERENCES Student_signup(id) ON DELETE CASCADE
            )
          `,
            (err) => {
              if (err) {
                console.log("Profile table create error:", err);
              } else {
                console.log("Student Profile table ready");
              }

              // Create all Uni Finder tables (verification, universities, campuses, ...)
              initSchema(db);

              // Ensure a default SuperAdmin login always exists
              seedSuperAdmin();
            },
          );
        }
      },
    );
  }
});

app.use("/api/auth", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", universityRoutes);

// Turn upload / unexpected errors into clean JSON instead of crashing the request.
app.use((err, req, res, next) => {
  if (err) {
    console.log("Request error:", err.message);
    return res.status(400).json({ message: err.message || "Upload error" });
  }
  next();
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
