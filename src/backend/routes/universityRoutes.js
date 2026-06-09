import express from "express";
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

const router = express.Router();

// UNI ADMIN: submit verification documents (multipart/form-data)
router.post(
  "/university/documents",
  upload.fields([
    { name: "hecCertificate", maxCount: 1 },
    { name: "charterCertificate", maxCount: 1 },
    { name: "accreditationDocument", maxCount: 1 },
    { name: "universityLogo", maxCount: 1 },
  ]),
  submitDocuments
);

// UNI ADMIN: my latest verification status
router.get("/university/verification/:uid", getMyVerification);

// PUBLIC: browse universities (real data shown to students)
router.get("/universities", listUniversities);
router.get("/universities/:id", getUniversityById);

// UNI ADMIN: gallery images
router.post("/university/images", upload.single("image"), addImage);
router.get("/university/:id/images", listImages);
router.delete("/university/images/:imageId", deleteImage);

// UNI ADMIN: programs
router.post("/university/programs", addProgram);
router.get("/university/:id/programs", listPrograms);
router.delete("/university/programs/:programId", deleteProgram);

// UNI ADMIN: account/profile
router.get("/university/account/:uid", getAccount);
router.put("/university/account", updateAccount);

// UNI ADMIN: university profile (details + logo + banner)
router.get("/university/:uid/profile", getMyUniversity);
router.post(
  "/university/profile",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  saveUniversity
);

// SUPERADMIN: list / approve / reject
router.get("/admin/verifications", verifyToken, authorizeRoles("admin"), listRequests);
router.put("/admin/verifications/:id/approve", verifyToken, authorizeRoles("admin"), approveRequest);
router.put("/admin/verifications/:id/reject", verifyToken, authorizeRoles("admin"), rejectRequest);

export default router;
