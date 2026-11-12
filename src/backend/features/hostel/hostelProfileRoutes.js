
import { Router } from "express";

import {
  verifyToken,
  authorizeRoles
} from "../../shared/middleware/authMiddleware.js";

import {
  getHostelProfile,
  updateHostelProfile
} from "./controllers/hostelProfileController.js";

const router = Router();

router.use(verifyToken, authorizeRoles("hostel", "campus_hostel"));

router.get("/:id/profile", getHostelProfile);
router.patch("/:id/profile", updateHostelProfile);

export default router;
