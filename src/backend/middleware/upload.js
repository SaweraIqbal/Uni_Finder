// Multer disk storage for uploaded docs/images.
// Files are saved under backend/uploads/ and we store the public path
// (e.g. /uploads/161234-charter.pdf) in MySQL. Later this path can be
// swapped for an S3 URL without touching the rest of the code.
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");

// Make sure the uploads folder exists.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, "_")
      .slice(0, 40);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

// Accept common doc + image types, max 10 MB each.
const fileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx|png|jpe?g|webp/i;
  const ok =
    allowed.test(path.extname(file.originalname)) ||
    /pdf|image|word|officedocument/i.test(file.mimetype);
  cb(ok ? null : new Error("Only PDF, DOC/DOCX or image files are allowed"), ok);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
