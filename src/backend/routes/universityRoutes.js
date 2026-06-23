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

const router = express.Router();

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

router.get("/university/verification/:uid", getMyVerification);

router.get("/universities", listUniversities);
router.get("/universities/:id", getUniversityById);

router.post("/university/images", upload.single("image"), addImage);
router.get("/university/:id/images", listImages);
router.delete("/university/images/:imageId", deleteImage);

router.post("/university/programs", addProgram);
router.get("/university/:id/programs", listPrograms);
router.delete("/university/programs/:programId", deleteProgram);

router.get("/university/account/:uid", getAccount);
router.put("/university/account", updateAccount);
router.post("/account/:uid/avatar", upload.single("avatar"), uploadAvatar);

router.get("/university/:uid/profile", getMyUniversity);
router.post(
  "/university/profile",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  saveUniversity
);

router.get("/admin/search", verifyToken, authorizeRoles("admin"), searchAccount);

router.get("/admin/verifications", verifyToken, authorizeRoles("admin"), listRequests);
router.put("/admin/verifications/:id/approve", verifyToken, authorizeRoles("admin"), approveRequest);
router.put("/admin/verifications/:id/reject", verifyToken, authorizeRoles("admin"), rejectRequest);

export default router;
