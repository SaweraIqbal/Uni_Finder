import express from "express";
import multer from "multer";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import {
  submitDocuments,
  getMyVerification,
  listRequests,
  approveRequest,
  rejectRequest,
} from "../controllers/university_controller/verificationController.js";
import {
  getMyUniversity,
  saveUniversity,
  listUniversities,
  getUniversityById,
  updateAccount,
  getAccount,
  uploadAvatar,
} from "../controllers/university_controller/universityController.js";
import {
  addImage,
  listImages,
  deleteImage,
} from "../controllers/university_controller/imagesController.js";
import {
  addProgram,
  listPrograms,
  deleteProgram,
} from "../controllers/university_controller/programsController.js";
import { searchAccount } from "../controllers/admin_controller/searchController.js";
import {
  adminListUniversities,
  adminListPrograms,
  adminListProgramRequests,
  adminApproveProgramRequest,
  adminRejectProgramRequest,
  adminListActivity,
} from "../controllers/admin_controller/adminController.js";
import {
  submitProgramRequest,
  getMyProgramRequests,
} from "../controllers/university_controller/programRequestsController.js";
import {
  confirmUniversityAdminEmail,
  requestApplicationInformation,
  setUniversityPassword,
  showUniversityPasswordSetup,
  streamAuthorizationLetter,
  submitUniversityAdminApplication,
} from "../controllers/university_controller/universityAdminApplicationController.js";
import {
  getMe,
  getMyStats,
  getMyPrograms,
  getMyActivity,
  patchMyProfile,
  uploadLogo,
  uploadBanner,
  getProgramCatalog,
  runSeed,
  syncHec,
  health,
} from "../controllers/university_controller/universityMeController.js";

const router = express.Router();

// ── Multer instances ──────────────────────────────────────────────────────────

// Verification letter upload (memory storage, mime checked in controller)
const applicationLetterUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|png|jpe?g)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only PDF, JPG or PNG files up to 5 MB are allowed."), ok);
  },
});

// Logo upload — memory storage, max 2 MB, PNG/JPG only (SVG rejected by magic bytes in controller)
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(png|jpe?g)$/i.test(file.originalname);
    if (!ok) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PNG and JPG are accepted for logos."));
    }
    cb(null, true);
  },
});

// Banner upload — memory storage, max 5 MB
const bannerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(png|jpe?g)$/i.test(file.originalname);
    if (!ok) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PNG and JPG are accepted for banners."));
    }
    cb(null, true);
  },
});

// Multer error handler helper
const handleUploadError = (uploadMiddleware, fieldName) => (req, res, next) => {
  uploadMiddleware.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: { code: "FILE_TOO_LARGE", message: "File exceeds size limit." } });
      }
      return res.status(400).json({ error: { code: "UPLOAD_ERROR", message: err.message } });
    }
    next();
  });
};

// ── New /me routes (auth required, university role only) ──────────────────────

router.get(
  "/universities/me",
  verifyToken, authorizeRoles("university"),
  getMe,
);
router.get(
  "/universities/me/stats",
  verifyToken, authorizeRoles("university"),
  getMyStats,
);
router.get(
  "/universities/me/programs",
  verifyToken, authorizeRoles("university"),
  getMyPrograms,
);
router.get(
  "/universities/me/activity",
  verifyToken, authorizeRoles("university"),
  getMyActivity,
);
router.patch(
  "/universities/me/profile",
  verifyToken, authorizeRoles("university"),
  express.json(),
  patchMyProfile,
);
router.post(
  "/universities/me/logo",
  verifyToken, authorizeRoles("university"),
  handleUploadError(logoUpload, "logo"),
  uploadLogo,
);
router.post(
  "/universities/me/banner",
  verifyToken, authorizeRoles("university"),
  handleUploadError(bannerUpload, "banner"),
  uploadBanner,
);

// ── University /me program-requests ──────────────────────────────────────────
router.post(
  "/universities/me/program-requests",
  verifyToken, authorizeRoles("university"),
  express.json(),
  submitProgramRequest,
);
router.get(
  "/universities/me/program-requests",
  verifyToken, authorizeRoles("university"),
  getMyProgramRequests,
);

// ── Public program catalog (student search) ───────────────────────────────────
router.get("/programs/catalog", getProgramCatalog);

// ── Admin seed / sync ─────────────────────────────────────────────────────────
router.post("/seed",     verifyToken, authorizeRoles("admin"), runSeed);
router.post("/sync-hec", verifyToken, authorizeRoles("admin"), syncHec);

// ── Health ────────────────────────────────────────────────────────────────────
router.get("/health", health);

// ── Verification flow (existing — untouched) ──────────────────────────────────
router.post(
  "/university/documents",
  upload.fields([
    { name: "hecCertificate",        maxCount: 1 },
    { name: "charterCertificate",    maxCount: 1 },
    { name: "accreditationDocument", maxCount: 1 },
    { name: "universityLogo",        maxCount: 1 },
  ]),
  submitDocuments,
);

router.post(
  "/university/verification",
  verifyToken, authorizeRoles("university"),
  (req, res) => {
    applicationLetterUpload.single("authorization_letter")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          errors: { authorization_letter: "Only PDF, JPG or PNG files up to 5 MB are allowed." },
        });
      }
      return submitUniversityAdminApplication(req, res);
    });
  },
);

router.get("/university/verification/confirm/:token", confirmUniversityAdminEmail);
router.get("/university/invitation/:token",  showUniversityPasswordSetup);
router.post("/university/invitation/:token", express.urlencoded({ extended: false }), setUniversityPassword);
router.get("/university/verification/:uid",  getMyVerification);

// ── University public list / detail ──────────────────────────────────────────
router.get("/universities",    listUniversities);
router.get("/universities/:id", getUniversityById);

// ── University images (now auth-guarded on write) ─────────────────────────────
router.post(
  "/university/images",
  verifyToken, authorizeRoles("university"),
  upload.single("image"),
  addImage,
);
router.get("/university/:id/images", listImages);
router.delete(
  "/university/images/:imageId",
  verifyToken, authorizeRoles("university"),
  deleteImage,
);

// ── University programs (legacy; now auth-guarded on write) ───────────────────
router.post(
  "/university/programs",
  verifyToken, authorizeRoles("university"),
  addProgram,
);
router.get("/university/:id/programs", listPrograms);
router.delete(
  "/university/programs/:programId",
  verifyToken, authorizeRoles("university"),
  deleteProgram,
);

// ── Account / profile (legacy, now auth-guarded on write) ─────────────────────
router.get("/university/account/:uid", getAccount);
router.put(
  "/university/account",
  verifyToken, authorizeRoles("university"),
  updateAccount,
);
router.post(
  "/account/:uid/avatar",
  verifyToken,
  upload.single("avatar"),
  uploadAvatar,
);
router.get("/university/:uid/profile", getMyUniversity);
router.post(
  "/university/profile",
  verifyToken, authorizeRoles("university"),
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "banner", maxCount: 1 }]),
  saveUniversity,
);

// ── Super-Admin verification management ──────────────────────────────────────
router.get("/admin/search",    verifyToken, authorizeRoles("admin"), searchAccount);
router.get("/admin/verifications",          verifyToken, authorizeRoles("admin"), listRequests);
router.put("/admin/verifications/:id/approve", verifyToken, authorizeRoles("admin"), approveRequest);
router.put("/admin/verifications/:id/reject",  verifyToken, authorizeRoles("admin"), rejectRequest);
router.post(
  "/admin/verifications/:id/request-information",
  verifyToken, authorizeRoles("admin"),
  requestApplicationInformation,
);
router.get(
  "/admin/verifications/:id/authorization-letter",
  verifyToken, authorizeRoles("admin"),
  streamAuthorizationLetter,
);

// ── Super-Admin university profiles, programs, activity ───────────────────────
router.get(
  "/admin/universities",
  verifyToken, authorizeRoles("admin"),
  adminListUniversities,
);
router.get(
  "/admin/programs",
  verifyToken, authorizeRoles("admin"),
  adminListPrograms,
);
router.get(
  "/admin/program-requests",
  verifyToken, authorizeRoles("admin"),
  adminListProgramRequests,
);
router.put(
  "/admin/program-requests/:id/approve",
  verifyToken, authorizeRoles("admin"),
  express.json(),
  adminApproveProgramRequest,
);
router.put(
  "/admin/program-requests/:id/reject",
  verifyToken, authorizeRoles("admin"),
  express.json(),
  adminRejectProgramRequest,
);
router.get(
  "/admin/activity",
  verifyToken, authorizeRoles("admin"),
  adminListActivity,
);

export default router;
