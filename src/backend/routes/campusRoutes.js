/**
 * campusRoutes.js — all campus-admin backend routes
 *
 *  Public (no auth):
 *    GET  /campus/:uid/profile
 *    GET  /campus/:campusId/images
 *    GET  /campus/:campusId/programs
 *    GET  /campuses  /campuses/:id  /campuses/university/:uniId
 *
 *  Campus admin (verifyToken + authorizeRoles("campus")):
 *    POST   /campus/profile                         — save campus details
 *    GET    /campus/:campusId/overview-stats        — KPIs for overview page
 *    GET    /campus/:campusId/activity              — activity feed
 *    POST   /campus/images                          — upload image
 *    DELETE /campus/images/:imageId                 — delete image
 *    PUT    /campus/images/:imageId/feature         — toggle featured
 *    GET    /campus/:campusId/societies             — list
 *    POST   /campus/:campusId/societies             — add
 *    PUT    /campus/societies/:id                   — update
 *    DELETE /campus/societies/:id                   — delete
 *    GET    /campus/:campusId/facilities            — load
 *    PUT    /campus/:campusId/facilities            — save
 *    GET    /campus/:campusId/hostels               — list (with availability flag)
 *    PUT    /campus/:campusId/hostel-availability   — toggle show/hide
 *    GET    /campus/:campusId/hostel-approvals      — pending hostel approvals
 *    PUT    /campus/hostel-approvals/:id/approve    — forward to super admin
 *    PUT    /campus/hostel-approvals/:id/reject     — reject
 *    GET    /campus/programs/:id/detail             — rich offering detail
 *    PUT    /campus/programs/:id/detail             — save rich detail
 *    PUT    /campus/programs/:id/publish
 *    PUT    /campus/programs/:id/unpublish
 *    GET    /campus/:campusId/program-requests      — list requests
 *    POST   /campus/program-requests                — submit new request
 *
 *  Legacy (university admin):
 *    POST /campus/request, GET /campus/request/:uid, etc.
 */
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
  getOverviewStats,
  getCampusActivity,
} from "../controllers/campus_controller/campusController.js";

import {
  addCampusImage,
  listCampusImages,
  deleteCampusImage,
  featureCampusImage,
} from "../controllers/campus_controller/campusImagesController.js";

import {
  listCampusPrograms,
  listUniversityApprovedPrograms,
  addCampusProgram,
  deleteCampusProgram,
} from "../controllers/campus_controller/campusProgramsController.js";

import {
  listSocieties,
  addSociety,
  updateSociety,
  deleteSociety,
} from "../controllers/campus_controller/campusSocietiesController.js";

import {
  getFacilities,
  saveFacilities,
} from "../controllers/campus_controller/campusFacilitiesController.js";

import {
  listHostels,
  addHostel,
  setHostelAvailability,
  listHostelApprovals,
  approveHostel,
  rejectHostel,
} from "../controllers/campus_controller/campusHostelsController.js";

import {
  getProgramDetail,
  saveProgramDetail,
  publishProgram,
  unpublishProgram,
  listProgramRequests,
  submitProgramRequest,
} from "../controllers/campus_controller/campusProgramDetailsController.js";

const router = express.Router();
const campusAuth = [verifyToken, authorizeRoles("campus")];

// ── Legacy verification flow ──────────────────────────────────────────────
router.post("/campus/request",                   submitCampusRequest);
router.get ("/campus/request/:uid",              getMyCampusRequest);
router.get ("/campus/requests/owner/:ownerUid",  listCampusRequestsForOwner);
router.put ("/campus/requests/:id/approve",      verifyToken, authorizeRoles("university"), approveCampusRequest);
router.put ("/campus/requests/:id/reject",       verifyToken, authorizeRoles("university"), rejectCampusRequest);

// ── Campus profile ────────────────────────────────────────────────────────
router.get ("/campus/:uid/profile",              getMyCampus);            // public
router.post("/campus/profile",                   ...campusAuth, saveCampus);

// ── Overview stats + activity ─────────────────────────────────────────────
router.get("/campus/:campusId/overview-stats",   ...campusAuth, getOverviewStats);
router.get("/campus/:campusId/activity",         ...campusAuth, getCampusActivity);

// ── Images ────────────────────────────────────────────────────────────────
router.get   ("/campus/:campusId/images",          listCampusImages);     // public
router.post  ("/campus/images",                    ...campusAuth, upload.single("image"), addCampusImage);
router.delete("/campus/images/:imageId",           ...campusAuth, deleteCampusImage);
router.put   ("/campus/images/:imageId/feature",   ...campusAuth, featureCampusImage);

// ── Programs (basic list + add + delete) ─────────────────────────────────
router.get   ("/campus/:campusId/programs",               listCampusPrograms);
router.get   ("/universities/:universityId/programs/approved", listUniversityApprovedPrograms);
router.post  ("/campus/programs",                         ...campusAuth, addCampusProgram);
router.delete("/campus/programs/:id",                     ...campusAuth, deleteCampusProgram);

// ── Program detail (rich form save / load) ────────────────────────────────
router.get("/campus/programs/:id/detail",        ...campusAuth, getProgramDetail);
router.put("/campus/programs/:id/detail",        ...campusAuth, express.json(), saveProgramDetail);
router.put("/campus/programs/:id/publish",       ...campusAuth, publishProgram);
router.put("/campus/programs/:id/unpublish",     ...campusAuth, unpublishProgram);

// ── Program requests ──────────────────────────────────────────────────────
router.get ("/campus/:campusId/program-requests", ...campusAuth, listProgramRequests);
router.post("/campus/program-requests",           ...campusAuth, express.json(), submitProgramRequest);

// ── Societies ─────────────────────────────────────────────────────────────
router.get   ("/campus/:campusId/societies",     ...campusAuth, listSocieties);
router.post  ("/campus/:campusId/societies",     ...campusAuth, express.json(), addSociety);
router.put   ("/campus/societies/:id",           ...campusAuth, express.json(), updateSociety);
router.delete("/campus/societies/:id",           ...campusAuth, deleteSociety);

// ── Facilities ────────────────────────────────────────────────────────────
router.get("/campus/:campusId/facilities",       ...campusAuth, getFacilities);
router.put("/campus/:campusId/facilities",       ...campusAuth, express.json(), saveFacilities);

// ── Hostels ───────────────────────────────────────────────────────────────
router.get("/campus/:campusId/hostels",              ...campusAuth, listHostels);
router.post("/campus/:campusId/hostels",             ...campusAuth, express.json(), addHostel);
router.put("/campus/:campusId/hostel-availability",  ...campusAuth, express.json(), setHostelAvailability);
router.get("/campus/:campusId/hostel-approvals",     ...campusAuth, listHostelApprovals);
router.put("/campus/hostel-approvals/:id/approve",   ...campusAuth, approveHostel);
router.put("/campus/hostel-approvals/:id/reject",    ...campusAuth, express.json(), rejectHostel);

// ── Public search / detail ────────────────────────────────────────────────
router.get("/campuses",                           searchCampuses);
router.get("/campuses/university/:universityId",  listCampusesByUniversity);
router.get("/campuses/:id",                       getCampusById);

export default router;
