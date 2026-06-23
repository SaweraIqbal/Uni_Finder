
import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

export const addCampusImage = (req, res) => {
  const { campus_id, caption } = req.body;
  if (!campus_id || !req.file) {
    return res.status(400).json({ message: "campus_id and image are required" });
  }
  const id = uuidv4();
  const imageUrl = `/uploads/${req.file.filename}`;
  db.query(
    "INSERT INTO campus_images (id, campus_id, image_url, caption) VALUES (?,?,?,?)",
    [id, campus_id, imageUrl, caption || null],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(201).json({ message: "Image added", id, image_url: imageUrl });
    }
  );
};

export const listCampusImages = (req, res) => {
  db.query(
    "SELECT * FROM campus_images WHERE campus_id = ? ORDER BY created_at DESC",
    [req.params.campusId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows);
    }
  );
};

export const deleteCampusImage = (req, res) => {
  db.query("DELETE FROM campus_images WHERE id = ?", [req.params.imageId], (err) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    return res.status(200).json({ message: "Image deleted" });
  });
};
