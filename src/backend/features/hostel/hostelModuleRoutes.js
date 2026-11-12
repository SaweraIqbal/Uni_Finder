import express from "express";

import {
  verifyToken,
  authorizeRoles,
} from "../../shared/middleware/authMiddleware.js";

import {
  hostelPhotoUpload,
  hostelDocumentUpload,
} from "./middleware/hostelUpload.js";

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
} from "./controllers/hostelModuleController.js";

const router = express.Router();

router.use(verifyToken, authorizeRoles("hostel", "campus_hostel"));

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

router.post("/:id/rooms", addRoom);

router.get("/:id/rooms", getRooms);

router.patch("/:id/rooms/:roomId", updateRoom);

router.delete("/:id/rooms/:roomId", deleteRoom);

router.get("/:id/listing", getListing);

router.patch("/:id/listing", saveListing);

router.post(
  "/:id/photos",
  uploadOne(hostelPhotoUpload, "photo"),
  addPhoto
);

router.get("/:id/photos", getPhotos);

router.delete("/:id/photos/:photoId", deletePhoto);

router.post(
  "/:id/documents",
  uploadOne(hostelDocumentUpload, "document"),
  addDocument
);

router.get("/:id/documents", getDocuments);

router.delete("/:id/documents/:documentId", deleteDocument);

export default router;
