
import express from "express";

import {
  verifyToken,
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import requireApprovedHostel from "../middleware/requireApprovedHostel.js";

import {
  hostelPhotoUpload,
  hostelDocumentUpload,
} from "../middleware/hostelUpload.js";

import {
  addRoom,
  getRooms,
  updateRoom,
  deleteRoom,
  getListing,
  saveListing,
  addPhoto,
  getPhotos,
  deletePhoto,
  addDocument,
  getDocuments,
  deleteDocument,
} from "../controllers/hostel_controller/hostelModuleController.js";

const router = express.Router();

// Hostel owner authentication
router.use(verifyToken, authorizeRoles("hostel", "campus_hostel"));
router.use(requireApprovedHostel);

// Upload middleware helper
const uploadOne = (middleware, field) => (req, res, next) => {
  middleware.single(field)(req, res, (err) => {
    if (err) {
      return res.status(
        err.code === "LIMIT_FILE_SIZE" ? 413 : 400
      ).json({
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: `Valid ${field} file required`,
      });
    }

    next();
  });
};

// =============================
// ROOMS MANAGEMENT
// =============================

router.post("/:id/rooms", addRoom);

router.get("/:id/rooms", getRooms);

router.patch("/:id/rooms/:roomId", updateRoom);

router.delete("/:id/rooms/:roomId", deleteRoom);

// =============================
// LISTING DETAILS
// =============================

router.get("/:id/listing", getListing);

router.patch("/:id/listing", saveListing);

// =============================
// HOSTEL PHOTOS
// =============================

router.post(
  "/:id/photos",
  uploadOne(hostelPhotoUpload, "photo"),
  addPhoto
);

router.get("/:id/photos", getPhotos);

router.delete("/:id/photos/:photoId", deletePhoto);

// =============================
// HOSTEL DOCUMENTS
// =============================

router.post(
  "/:id/documents",
  uploadOne(hostelDocumentUpload, "document"),
  addDocument
);

router.get("/:id/documents", getDocuments);

router.delete("/:id/documents/:documentId", deleteDocument);

export default router;
