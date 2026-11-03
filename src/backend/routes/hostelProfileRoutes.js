
import { Router } from "express";

import {
  verifyToken,
  authorizeRoles
} from "../middleware/authMiddleware.js";
import requireApprovedHostel from "../middleware/requireApprovedHostel.js";

import {
  getHostelProfile,
  updateHostelProfile
} from "../controllers/hostel_controller/hostelProfileController.js";

const router = Router();

router.use(verifyToken, authorizeRoles("hostel", "campus_hostel"));
router.use(requireApprovedHostel);

router.get("/:id/profile", getHostelProfile);
router.patch("/:id/profile", updateHostelProfile);

export default router;
