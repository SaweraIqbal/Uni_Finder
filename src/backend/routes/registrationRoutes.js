/**
 * registrationRoutes.js
 * Campus Registration API endpoints — two-tier approval flow.
 *
 *  Campus admin (registrant):
 *   POST  /api/campus-registrations               — submit new request
 *   GET   /api/campus-registrations/mine          — own status
 *   POST  /api/campus-registrations/:id/resubmit  — resubmit after rejection
 *
 *  University admin (tier-1 reviewer):
 *   GET   /api/campus-registrations               — list for own university
 *   PATCH /api/campus-registrations/:id/tier1     — approve / reject / request_resubmission
 *
 *  Super admin (tier-2 — final approval):
 *   PATCH /api/campus-registrations/:id/status    — gated: tier-1 must be approved first
 *   (also served via /api/admin/campus-registrations in adminController + universityRoutes)
 */
import express from "express";
import multer  from "multer";
import path    from "path";
import { fileURLToPath } from "url";

import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getApprovedUniversities,
  submitRegistration,
  getMyRegistration,
  resubmitRegistration,
  getUniversityCampusRegistrations,
  uniUpdateRegistrationStatus,
  updateRegistrationStatus,
} from "../controllers/campus_controller/registrationController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file,  cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("PDF_ONLY"));
  },
});

const uploadMiddleware = (req, res, next) =>
  upload.single("document")(req, res, (err) => {
    if (!err) return next();
    const msg = err.message === "PDF_ONLY"
      ? "Only PDF files are allowed."
      : "File too large — maximum size is 10 MB.";
    return res.status(400).json({ errors: { document: msg } });
  });

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/universities/approved", getApprovedUniversities);

// ── Campus admin (registrant) ──────────────────────────────────────────────────
router.post("/campus-registrations",
  verifyToken, authorizeRoles("campus"), uploadMiddleware, submitRegistration);

router.get("/campus-registrations/mine",
  verifyToken, authorizeRoles("campus"), getMyRegistration);

router.post("/campus-registrations/:id/resubmit",
  verifyToken, authorizeRoles("campus"), uploadMiddleware, resubmitRegistration);

// ── University admin (tier-1 reviewer) ────────────────────────────────────────
router.get("/campus-registrations",
  verifyToken, authorizeRoles("university"), getUniversityCampusRegistrations);

router.patch("/campus-registrations/:id/tier1",
  verifyToken, authorizeRoles("university"), express.json(), uniUpdateRegistrationStatus);

// ── Super admin (tier-2 — gated by tier-1) ────────────────────────────────────
// Also used indirectly via adminController.adminUpdateCampusRegistrationStatus.
router.patch("/campus-registrations/:id/status",
  verifyToken, authorizeRoles("admin"), express.json(), updateRegistrationStatus);

export default router;
