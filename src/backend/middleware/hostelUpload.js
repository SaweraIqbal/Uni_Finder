
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "uploads", "hostels");

const createUploader = (folder, maxSize, extensions) => {
  const directory = path.join(uploadRoot, folder);
  fs.mkdirSync(directory, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, directory),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: maxSize, files: 1 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();

      if (!extensions.includes(ext)) {
        return cb(new Error("Unsupported file type"));
      }

      const allowedMime = {
        ".jpg": ["image/jpeg"],
        ".jpeg": ["image/jpeg"],
        ".png": ["image/png"],
        ".webp": ["image/webp"],
        ".pdf": ["application/pdf"],
      };

      if (!allowedMime[ext]?.includes(file.mimetype)) {
        return cb(new Error("Invalid file MIME type"));
      }

      cb(null, true);
    },
  });
};

export const hostelPhotoUpload = createUploader(
  "photos",
  5 * 1024 * 1024,
  [".jpg", ".jpeg", ".png", ".webp"]
);

export const hostelDocumentUpload = createUploader(
  "documents",
  10 * 1024 * 1024,
  [".pdf", ".jpg", ".jpeg", ".png"]
);
