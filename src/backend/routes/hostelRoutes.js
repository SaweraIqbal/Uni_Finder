
import express from "express";

import {
  verifyToken,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
  createHostel,
  getMyHostels,
  getMyHostelById,
  updateHostel,
  deleteHostel,
  registerHostel,
  getHostelReviewQueue,
  reviewHostelRegistration,
  resubmitHostelRegistration,
  downloadHostelReviewDocument,
} from "../controllers/hostel_controller/hostelController.js";
import hostelRegistrationUpload from "../middleware/hostelRegistrationUpload.js";

const router = express.Router();

router.get("/review-queue", verifyToken, authorizeRoles("admin", "campus"), getHostelReviewQueue);
router.patch("/:id/review", verifyToken, authorizeRoles("admin", "campus"), express.json(), reviewHostelRegistration);
router.get("/:id/review-documents/:documentId", verifyToken, authorizeRoles("admin", "campus"), downloadHostelReviewDocument);

// All hostel-owner routes require authentication
router.use(verifyToken, authorizeRoles("hostel", "campus_hostel"));

router.post("/register", hostelRegistrationUpload, registerHostel);
router.get("/mine", getMyHostels);
router.post("/:id/resubmit", resubmitHostelRegistration);
router.post("/", createHostel);
router.get("/:id", getMyHostelById);
router.patch("/:id", updateHostel);
router.delete("/:id", deleteHostel);

export default router;
