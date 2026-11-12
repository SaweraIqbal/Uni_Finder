import express from "express";
import { verifyToken, authorizeRoles } from "../../shared/middleware/authMiddleware.js";
import { upload } from "../../shared/middleware/upload.js";
import {
  campusHostelPhotoUpload,
  campusHostelExtraPhotoUpload,
} from "./middleware/campusHostelUpload.js";

import {
  submitCampusRequest,
  getMyCampusRequest,
  listCampusRequestsForOwner,
  approveCampusRequest,
  rejectCampusRequest,
} from "./controllers/campusVerificationController.js";

import {
  getMyCampus,
  saveCampus,
  listCampusesByUniversity,
  searchCampuses,
  getCampusById,
  compareCampuses,
  getOverviewStats,
  getCampusActivity,
  listApprovedCampusHostels,
} from "./controllers/campusController.js";

import {
  addCampusImage,
  listCampusImages,
  deleteCampusImage,
  featureCampusImage,
} from "./controllers/campusImagesController.js";

import {
  listCampusPrograms,
  listUniversityApprovedPrograms,
  addCampusProgram,
  deleteCampusProgram,
} from "./controllers/campusProgramsController.js";

import {
  listSocieties,
  addSociety,
  updateSociety,
  deleteSociety,
} from "./controllers/campusSocietiesController.js";

import {
  getFacilities,
  saveFacilities,
} from "./controllers/campusFacilitiesController.js";

import {
  listHostels,
  addHostel,
  setHostelAvailability,
  addHostelPhotos,
  setHostelCover,
  deleteHostelPhoto,
} from "./controllers/campusHostelsController.js";

import {
  getProgramDetail,
  saveProgramDetail,
  publishProgram,
  unpublishProgram,
  listProgramRequests,
  submitProgramRequest,
} from "./controllers/campusProgramDetailsController.js";

const router = express.Router();
const campusAuth = [verifyToken, authorizeRoles("campus")];

router.post("/campus/request",                   submitCampusRequest);
router.get ("/campus/request/:uid",              getMyCampusRequest);
router.get ("/campus/requests/owner/:ownerUid",  listCampusRequestsForOwner);
router.put ("/campus/requests/:id/approve",      verifyToken, authorizeRoles("university"), approveCampusRequest);
router.put ("/campus/requests/:id/reject",       verifyToken, authorizeRoles("university"), rejectCampusRequest);

router.get ("/campus/:uid/profile",              getMyCampus);
router.post("/campus/profile",                   ...campusAuth, saveCampus);

router.get("/campus/:campusId/overview-stats",   ...campusAuth, getOverviewStats);
router.get("/campus/:campusId/activity",         ...campusAuth, getCampusActivity);

router.get   ("/campus/:campusId/images",          listCampusImages);
router.post  ("/campus/images",                    ...campusAuth, upload.single("image"), addCampusImage);
router.delete("/campus/images/:imageId",           ...campusAuth, deleteCampusImage);
router.put   ("/campus/images/:imageId/feature",   ...campusAuth, featureCampusImage);

router.get   ("/campus/:campusId/programs",               listCampusPrograms);
router.get   ("/universities/:universityId/programs/approved", listUniversityApprovedPrograms);
router.post  ("/campus/programs",                         ...campusAuth, addCampusProgram);
router.delete("/campus/programs/:id",                     ...campusAuth, deleteCampusProgram);

router.get("/campus/programs/:id/detail",        ...campusAuth, getProgramDetail);
router.put("/campus/programs/:id/detail",        ...campusAuth, express.json(), saveProgramDetail);
router.put("/campus/programs/:id/publish",       ...campusAuth, publishProgram);
router.put("/campus/programs/:id/unpublish",     ...campusAuth, unpublishProgram);

router.get ("/campus/:campusId/program-requests", ...campusAuth, listProgramRequests);
router.post("/campus/program-requests",           ...campusAuth, express.json(), submitProgramRequest);

router.get   ("/campus/:campusId/societies",     ...campusAuth, listSocieties);
router.post  ("/campus/:campusId/societies",     ...campusAuth, express.json(), addSociety);
router.put   ("/campus/societies/:id",           ...campusAuth, express.json(), updateSociety);
router.delete("/campus/societies/:id",           ...campusAuth, deleteSociety);

router.get("/campus/:campusId/facilities",       ...campusAuth, getFacilities);
router.put("/campus/:campusId/facilities",       ...campusAuth, express.json(), saveFacilities);

router.get   ("/campus/:campusId/hostels",             ...campusAuth, listHostels);
router.post  ("/campus/:campusId/hostels",             ...campusAuth, campusHostelPhotoUpload, addHostel);
router.put   ("/campus/:campusId/hostel-availability", ...campusAuth, express.json(), setHostelAvailability);
router.post  ("/campus/hostels/:hostelId/photos",      ...campusAuth, campusHostelExtraPhotoUpload, addHostelPhotos);
router.put   ("/campus/hostels/:hostelId/photos/:photoId/cover", ...campusAuth, setHostelCover);
router.delete("/campus/hostels/:hostelId/photos/:photoId",       ...campusAuth, deleteHostelPhoto);

router.get("/campuses",                           searchCampuses);
router.get("/campuses/compare",                   compareCampuses);
router.get("/campuses/university/:universityId",  listCampusesByUniversity);
router.get("/campuses/:id",                       getCampusById);
router.get("/campuses/:id/hostels",                listApprovedCampusHostels);

export default router;
