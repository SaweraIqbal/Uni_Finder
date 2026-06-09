// University gallery images: add / list / delete.
import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

// POST /university/images  (multipart: image file + university_id + caption)
export const addImage = (req, res) => {
  const { university_id, caption } = req.body;
  if (!university_id || !req.file) {
    return res.status(400).json({ message: "university_id and image are required" });
  }
  const id = uuidv4();
  const imageUrl = `/uploads/${req.file.filename}`;
  db.query(
    "INSERT INTO university_images (id, university_id, image_url, caption) VALUES (?,?,?,?)",
    [id, university_id, imageUrl, caption || null],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(201).json({ message: "Image added", id, image_url: imageUrl });
    }
  );
};

// GET /university/:id/images
export const listImages = (req, res) => {
  db.query(
    "SELECT * FROM university_images WHERE university_id = ? ORDER BY created_at DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows);
    }
  );
};

// DELETE /university/images/:imageId
export const deleteImage = (req, res) => {
  db.query(
    "DELETE FROM university_images WHERE id = ?",
    [req.params.imageId],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json({ message: "Image deleted" });
    }
  );
};
