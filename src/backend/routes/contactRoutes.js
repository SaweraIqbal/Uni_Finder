/**
 * contactRoutes.js
 *
 * Public-facing contact endpoints. No auth required — the form is visible
 * before a user has fully logged in (verification flow).
 */

import express from "express";
import { reportMissingUniversity } from "../controllers/contactController.js";

const router = express.Router();

// POST /api/contact/university-not-found
router.post("/contact/university-not-found", reportMissingUniversity);

export default router;
