
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
} from "../controllers/hostel_controller/hostelController.js";

const router = express.Router();

// All hostel-owner routes require authentication
router.use(verifyToken, authorizeRoles("hostel"));

router.post("/", createHostel);
router.get("/mine", getMyHostels);
router.get("/:id", getMyHostelById);
router.patch("/:id", updateHostel);
router.delete("/:id", deleteHostel);

export default router;
