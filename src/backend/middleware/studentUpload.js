/**
 * studentUpload.js
 *
 * Two multer configs:
 *
 * 1. avatarUpload  — profile photos only.
 *    Stored at: /uploads/students/avatars/{userId}{ext}  (public, overwritten on update)
 *    Served as: /uploads/students/avatars/{userId}.jpg  (static, no auth needed)
 *
 * 2. studentUpload (default) — all other student documents.
 *    Stored at: /uploads/students/{userId}/{timestamp}-{name}{ext}  (private, auth-gated)
 *
 * Allowed types for both: PDF, JPG, JPEG, PNG  — max 10 MB.
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const BASE_DIR   = path.join(__dirname, "..", "uploads", "students");
const AVATAR_DIR = path.join(BASE_DIR, "avatars");

fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_MIME = /^(application\/pdf|image\/jpeg|image\/jpg|image\/png)$/i;
const ALLOWED_EXT  = /\.(pdf|jpg|jpeg|png)$/i;
const IMG_MIME     = /^image\/(jpeg|jpg|png|webp)$/i;
const IMG_EXT      = /\.(jpg|jpeg|png|webp)$/i;
const MAX_SIZE     = 10 * 1024 * 1024;

// ── 1. Avatar (public) ───────────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const userId = req.user?.id;
    if (!userId) return cb(new Error("Unauthenticated upload"));
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    // Fixed filename per user so the URL never changes — overwrite on update
    cb(null, `${String(userId).replace(/[^a-zA-Z0-9_-]/g, "")}_avatar${ext}`);
  },
});

const avatarFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (IMG_MIME.test(file.mimetype) && IMG_EXT.test(ext)) cb(null, true);
  else cb(new Error("Only JPG, PNG or WEBP images are allowed for avatars"), false);
};

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: MAX_SIZE },
});

// ── 2. Documents (private) ───────────────────────────────────────────────────
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id;
    if (!userId) return cb(new Error("Unauthenticated upload"));
    const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const dir = path.join(BASE_DIR, safeId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const docFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.test(file.mimetype) && ALLOWED_EXT.test(ext)) cb(null, true);
  else cb(new Error("Only PDF, JPG, and PNG files are allowed"), false);
};

export const studentUpload = multer({
  storage: docStorage,
  fileFilter: docFilter,
  limits: { fileSize: MAX_SIZE },
});

export default studentUpload;
