import express from "express";

import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/admin/dashboard",
  verifyToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({
      message: "Welcome Admin",
      user: req.user
    });
  }
);

router.get(
  "/student/dashboard",
  verifyToken,
  authorizeRoles("student"),
  (req, res) => {
    res.json({
      message: "Welcome Student",
      user: req.user
    });
  }
);

export default router;