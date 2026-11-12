import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { PRIVATE_UPLOADS_DIR } from "../../../shared/paths.js";

const uploadDir = path.join(PRIVATE_UPLOADS_DIR, "hostels");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes[ext] !== file.mimetype) {
      return cb(new Error("Upload a PDF, JPG, JPEG, or PNG document."));
    }
    cb(null, true);
  },
}).fields([
  { name: "campus_authorization", maxCount: 1 },
  { name: "owner_cnic", maxCount: 1 },
  { name: "utility_bill", maxCount: 1 },
  { name: "ownership_proof", maxCount: 1 },
]);

export default upload;
