
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
import {
  getUniversityCampusHostels,
  getAllCampusHostels,
  getCampusHostelById,
    reviewUniversityCampusHostel,
    viewCampusHostelDocument,
    reviewSuperAdminCampusHostel,
    getMyCampusHostel,
} from "../controllers/campus_controller/campusHostelController.js";
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


const HOSTEL_FIELDS = [
  "hostelDoc_cnic",
  "hostelDoc_ownership",
  "hostelDoc_utility",
];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 4,
  },
  fileFilter: (_req, file, cb) => {
    const isCampusDocument = file.fieldname === "document";
    const isHostelDocument = HOSTEL_FIELDS.includes(file.fieldname);

    if (isCampusDocument) {
      return cb(
        null,
        file.mimetype === "application/pdf"
      );
    }

    if (isHostelDocument) {
      return cb(
        null,
        [
          "application/pdf",
          "image/jpeg",
          "image/png",
        ].includes(file.mimetype)
      );
    }

    cb(new Error("UNEXPECTED_FIELD"));
  },
});

const uploadMiddleware = (req, res, next) => {
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "hostelDoc_cnic", maxCount: 1 },
    { name: "hostelDoc_ownership", maxCount: 1 },
    { name: "hostelDoc_utility", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Each file must be 10 MB or smaller."
            : "Invalid upload fields or too many files.",
      });
    }

    // Existing controller still expects req.file.
    // Preserve compatibility until controller is updated.
    req.file = req.files?.document?.[0] || null;

    next();
  });
};

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
// Campus Hostel Verification — University Admin
router.get(
  "/campus-hostels/university",
  verifyToken,
  authorizeRoles("university"),
  getUniversityCampusHostels
);

// Campus Hostel Verification — Super Admin
router.get(
  "/campus-hostels/admin",
  verifyToken,
  authorizeRoles("admin"),
  getAllCampusHostels
);
router.get(
  "/campus-hostels/mine",
  verifyToken,
  authorizeRoles("campus"),
  getMyCampusHostel
);
// Single Campus Hostel Verification — Both reviewers
router.get(
  "/campus-hostels/:id",
  verifyToken,
  authorizeRoles("university", "admin"),
  getCampusHostelById
);

// University Admin — Approve / Reject Campus Hostel
router.patch(
  "/campus-hostels/:id/university-review",
  verifyToken,
  authorizeRoles("university"),
  reviewUniversityCampusHostel
);

router.patch(
  "/campus-hostels/:id/super-admin-review",
  verifyToken,
  authorizeRoles("admin"),
  reviewSuperAdminCampusHostel
);


// Secure Campus Hostel Document View
router.get(
  "/campus-hostel-documents/:documentId/view",
  verifyToken,
  authorizeRoles("university", "admin"),
  viewCampusHostelDocument
);


export default router;
