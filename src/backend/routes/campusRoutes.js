import express from "express";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import {
  submitCampusRequest,
  getMyCampusRequest,
  listCampusRequestsForOwner,
  approveCampusRequest,
  rejectCampusRequest,
} from "../controllers/campus_controller/campusVerificationController.js";
import {
  getMyCampus,
  saveCampus,
  listCampusesByUniversity,
  searchCampuses,
  getCampusById,
} from "../controllers/campus_controller/campusController.js";
import {
  addCampusImage,
  listCampusImages,
  deleteCampusImage,
} from "../controllers/campus_controller/campusImagesController.js";
import {
  listCampusPrograms,
  addCampusProgram,
  deleteCampusProgram,
} from "../controllers/campus_controller/campusProgramsController.js";

const router = express.Router();

router.post("/campus/request", submitCampusRequest);
router.get("/campus/request/:uid", getMyCampusRequest);

router.get("/campus/requests/owner/:ownerUid", listCampusRequestsForOwner);
router.put("/campus/requests/:id/approve", verifyToken, authorizeRoles("university"), approveCampusRequest);
router.put("/campus/requests/:id/reject", verifyToken, authorizeRoles("university"), rejectCampusRequest);

router.get("/campus/:uid/profile", getMyCampus);
router.post("/campus/profile", saveCampus);

router.post("/campus/images", upload.single("image"), addCampusImage);
router.get("/campus/:campusId/images", listCampusImages);
router.delete("/campus/images/:imageId", deleteCampusImage);

router.get("/campus/:campusId/programs", listCampusPrograms);
router.post("/campus/programs", addCampusProgram);
router.delete("/campus/programs/:id", deleteCampusProgram);

router.get("/campuses", searchCampuses);
router.get("/campuses/university/:universityId", listCampusesByUniversity);
router.get("/campuses/:id", getCampusById);

export default router;
