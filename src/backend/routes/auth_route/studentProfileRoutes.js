/**
 * studentProfileRoutes.js
 * All routes are student-only (verifyToken + authorizeRoles('student')).
 * Mounted at /api/student in server.js
 */

import express from "express";
import { verifyToken, authorizeRoles } from "../../middleware/authMiddleware.js";
import { studentUpload, avatarUpload } from "../../middleware/studentUpload.js";

import {
  getProfile,
  getProfileForEdit,
  upsertProfile,
  getCompleteness,
  getAcademicRecords,
  addAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord,
  getTestScores,
  addTestScore,
  updateTestScore,
  deleteTestScore,
  getResearch,
  upsertResearch,
  addPublication,
  updatePublication,
  deletePublication,
  getReferences,
  addReference,
  updateReference,
  deleteReference,
  getExperience,
  addExperience,
  updateExperience,
  deleteExperience,
  getPreferences,
  upsertPreferences,
} from "../../controllers/auth_controller/studentProfileController.js";

import {
  uploadFile,
  uploadAvatarFile,
  serveFile,
  deleteFile,
  getDocuments,
} from "../../controllers/auth_controller/studentFilesController.js";

const router = express.Router();

// All routes require a valid student JWT
const guard = [verifyToken, authorizeRoles("student")];

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/profile",        ...guard, getProfile);
router.get("/profile/edit",   ...guard, getProfileForEdit);
router.put("/profile",        ...guard, upsertProfile);
router.get("/completeness",   ...guard, getCompleteness);

// ── Academic Records ──────────────────────────────────────────────────────────
router.get("/academic-records",        ...guard, getAcademicRecords);
router.post("/academic-records",       ...guard, addAcademicRecord);
router.put("/academic-records/:id",    ...guard, updateAcademicRecord);
router.delete("/academic-records/:id", ...guard, deleteAcademicRecord);

// ── Entry Test Scores ─────────────────────────────────────────────────────────
router.get("/test-scores",        ...guard, getTestScores);
router.post("/test-scores",       ...guard, addTestScore);
router.put("/test-scores/:id",    ...guard, updateTestScore);
router.delete("/test-scores/:id", ...guard, deleteTestScore);

// ── Research Profile ──────────────────────────────────────────────────────────
router.get("/research",                          ...guard, getResearch);
router.put("/research",                          ...guard, upsertResearch);
router.post("/research/publications",            ...guard, addPublication);
router.put("/research/publications/:id",         ...guard, updatePublication);
router.delete("/research/publications/:id",      ...guard, deletePublication);

// ── References ────────────────────────────────────────────────────────────────
router.get("/references",        ...guard, getReferences);
router.post("/references",       ...guard, addReference);
router.put("/references/:id",    ...guard, updateReference);
router.delete("/references/:id", ...guard, deleteReference);

// ── Experience & Achievements ─────────────────────────────────────────────────
router.get("/experience",        ...guard, getExperience);
router.post("/experience",       ...guard, addExperience);
router.put("/experience/:id",    ...guard, updateExperience);
router.delete("/experience/:id", ...guard, deleteExperience);

// ── Admission Preferences ─────────────────────────────────────────────────────
router.get("/preferences", ...guard, getPreferences);
router.put("/preferences", ...guard, upsertPreferences);

// ── Files ─────────────────────────────────────────────────────────────────────
// Avatar (photo) upload — stored publicly, no auth needed to view
router.post(
  "/upload/avatar",
  ...guard,
  (req, res, next) => {
    avatarUpload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || "Upload error" });
      next();
    });
  },
  uploadAvatarFile
);

// General document upload — stored privately
router.post(
  "/upload",
  ...guard,
  (req, res, next) => {
    studentUpload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || "Upload error" });
      next();
    });
  },
  uploadFile
);

// Serve (authenticated — no studentUpload needed)
router.get("/files/:filename",    ...guard, serveFile);
router.delete("/files/:filename", ...guard, deleteFile);

// ── Documents Vault ───────────────────────────────────────────────────────────
router.get("/documents", ...guard, getDocuments);

export default router;
