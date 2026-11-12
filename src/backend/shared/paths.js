import path from "path";
import { fileURLToPath } from "url";

export const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const UPLOADS_DIR = path.join(BACKEND_ROOT, "uploads");
export const PRIVATE_UPLOADS_DIR = path.join(BACKEND_ROOT, "private_uploads");
export const PRIVATE_DIR = path.join(BACKEND_ROOT, "private");
export const DATA_DIR = path.join(BACKEND_ROOT, "data");
export const BACKUPS_DIR = path.join(BACKEND_ROOT, "backups");
export const PROJECT_ROOT = path.resolve(BACKEND_ROOT, "..", "..");
