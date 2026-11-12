import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./features/auth/authRoutes.js";
import dashboardRoutes from "./features/admin/dashboardRoutes.js";
import universityRoutes from "./features/university/universityRoutes.js";
import campusRoutes from "./features/campus/campusRoutes.js";
import registrationRoutes from "./features/campus/registrationRoutes.js";
import contactRoutes from "./features/contact/contactRoutes.js";
import db, { dbReady } from "./shared/db.js";
import initSchema from "./shared/schema.js";
import seedSuperAdmin from "./seeds/seedAdmin.js";
import seedUniversities from "./seeds/seedUniversities.js";
import seedPrograms from "./seeds/seedPrograms.js";
import backfillAssignedIds from "./seeds/backfillIds.js";
import { cleanupUnverifiedAccounts } from "./features/auth/cleanupUnverifiedAccounts.js";
import createHostelSchema from "./shared/hostelSchema.js";
import hostelRoutes from "./features/hostel/hostelRoutes.js";
import hostelModuleRoutes from "./features/hostel/hostelModuleRoutes.js";
import hostelProfileRoutes from "./features/hostel/hostelProfileRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
      createHostelSchema(db).catch((err) => {
        console.error("Hostel schema initialization failed:", err.message);
      });

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
app.use("/api/hostels", hostelRoutes);
app.use("/api/hostels", hostelModuleRoutes);
app.use("/api/hostels", hostelProfileRoutes);

app.use(
  "/uploads/hostels/photos",
  express.static(path.resolve("uploads/hostels/photos"))
);

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
