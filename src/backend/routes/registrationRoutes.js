
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
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    cb(null, file.fieldname === "document" && file.mimetype === "application/pdf");
  },
});

const uploadMiddleware = (req, res, next) => {
  upload.single("document")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Each file must be 10 MB or smaller."
            : "Invalid upload fields or too many files.",
      });
    }

    next();
  });
};

const router = express.Router();

router.get("/universities/approved", getApprovedUniversities);

router.post("/campus-registrations",
  verifyToken, authorizeRoles("campus"), uploadMiddleware, submitRegistration);

router.get("/campus-registrations/mine",
  verifyToken, authorizeRoles("campus"), getMyRegistration);

router.post("/campus-registrations/:id/resubmit",
  verifyToken, authorizeRoles("campus"), uploadMiddleware, resubmitRegistration);

router.get("/campus-registrations",
  verifyToken, authorizeRoles("university"), getUniversityCampusRegistrations);

router.patch("/campus-registrations/:id/tier1",
  verifyToken, authorizeRoles("university"), express.json(), uniUpdateRegistrationStatus);

// Also used indirectly via adminController.adminUpdateCampusRegistrationStatus.
router.patch("/campus-registrations/:id/status",
  verifyToken, authorizeRoles("admin"), express.json(), updateRegistrationStatus);
export default router;
