import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { UPLOADS_DIR } from "../../../shared/paths.js";

const IMAGES = [".jpg", ".jpeg", ".png", ".webp"];
const IMAGE_MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const createUploader = (folder, { fields, maxPerField = 10, maxSize }) => {
  const directory = path.join(UPLOADS_DIR, folder);
  fs.mkdirSync(directory, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, directory),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const id = crypto.randomUUID();
        file.id = id;
        cb(null, `${id}${ext}`);
      },
    }),
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();

      if (!IMAGES.includes(ext) || IMAGE_MIME[ext] !== file.mimetype) {
        return cb(new Error("Only JPG, PNG or WEBP images are allowed"));
      }

      cb(null, true);
    },
  }).fields(fields.map((field) => ({ name: field.name, maxCount: field.maxCount ?? maxPerField })));
};

export const campusHostelPhotoUpload = createUploader(path.join("hostels", "campus"), {
  fields: [{ name: "cover" }, { name: "photos", maxCount: 12 }],
  maxSize: 5 * 1024 * 1024,
});

export const campusHostelExtraPhotoUpload = createUploader(path.join("hostels", "campus"), {
  fields: [{ name: "photos", maxCount: 12 }],
  maxSize: 5 * 1024 * 1024,
});
