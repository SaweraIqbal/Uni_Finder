import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth_route/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import universityRoutes from "./routes/universityRoutes.js";
import campusRoutes from "./routes/campusRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import db, { dbReady } from "./config/db.js";
import initSchema from "./config/schema.js";
import seedSuperAdmin from "./config/seedAdmin.js";
import seedUniversities from "./config/seedUniversities.js";
import seedPrograms from "./config/seedPrograms.js";
import backfillAssignedIds from "./config/backfillIds.js";
import { cleanupUnverifiedAccounts } from "./utils/cleanupUnverifiedAccounts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// University logos / banners served with long-lived cache + immutable filenames
app.use(
  "/uploads/universities",
  express.static(path.join(__dirname, "uploads", "universities"), {
    maxAge: "365d",
    immutable: true,
    etag: true,
  }),
);

dbReady
  .then(() => {
    initSchema(db, () => {
      let cleanupInProgress = false;
      const cleanupExpiredSignups = async () => {
        if (cleanupInProgress) return;
        cleanupInProgress = true;
        try {
          const deletedCount = await cleanupUnverifiedAccounts(db);
          if (deletedCount) {
            console.log(`[email verification] deleted ${deletedCount} expired unverified account(s)`);
          }
        } catch (error) {
          console.error("[email verification] expired-account cleanup failed:", error.message);
        } finally {
          cleanupInProgress = false;
        }
      };
      cleanupExpiredSignups();
      const cleanupTimer = setInterval(cleanupExpiredSignups, 5 * 60 * 1000);
      cleanupTimer.unref();

      seedSuperAdmin()
        .then(() => seedUniversities())
        .then(() => seedPrograms())
        .catch((seedErr) => console.error("Seed failed:", seedErr));
      setTimeout(backfillAssignedIds, 1500);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error.message);
  });

app.use("/api/auth", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", registrationRoutes);
app.use("/api", universityRoutes);
app.use("/api", campusRoutes);
app.use("/api", contactRoutes);

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