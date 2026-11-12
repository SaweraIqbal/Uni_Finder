import express from "express";
import { reportMissingUniversity } from "./contactController.js";

const router = express.Router();

router.post("/contact/university-not-found", reportMissingUniversity);

export default router;
