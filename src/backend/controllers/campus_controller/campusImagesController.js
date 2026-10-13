import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

// ════════════════════════════════════════════════════════════════════════════
// POST /api/campus/images   (multipart: image, campus_id, caption, category)
// ════════════════════════════════════════════════════════════════════════════
export const addCampusImage = (req, res) => {
  const { campus_id, caption, category } = req.body;
  if (!campus_id || !req.file)
    return res.status(400).json({ message: "campus_id and image are required" });

  const id       = uuidv4();
  const imageUrl = `/uploads/${req.file.filename}`;

  db.query(
    `INSERT INTO campus_images (id, campus_id, image_url, caption, category)
     VALUES (?,?,?,?,?)`,
    [id, campus_id, imageUrl, caption || null, category || "Campus Building"],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(201).json({ message: "Image added", id, image_url: imageUrl });
    }
  );
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/campus/:campusId/images
// ════════════════════════════════════════════════════════════════════════════
export const listCampusImages = (req, res) => {
  db.query(
    `SELECT id, image_url, caption, category, featured, created_at
     FROM campus_images
     WHERE campus_id=?
     ORDER BY featured DESC, created_at DESC`,
    [req.params.campusId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      return res.status(200).json(rows);
    }
  );
};

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/campus/images/:imageId
// ════════════════════════════════════════════════════════════════════════════
export const deleteCampusImage = (req, res) => {
  db.query("DELETE FROM campus_images WHERE id=?", [req.params.imageId], (err) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    return res.status(200).json({ message: "Image deleted" });
  });
};

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/campus/images/:imageId/feature   —  toggle featured flag
// ════════════════════════════════════════════════════════════════════════════
export const featureCampusImage = (req, res) => {
  const { imageId } = req.params;
  // Read current value, flip it
  db.query("SELECT campus_id, featured FROM campus_images WHERE id=?", [imageId], (err, rows) => {
    if (err || !rows.length)
      return res.status(404).json({ message: "Image not found" });

    const { campus_id, featured } = rows[0];
    const newFeatured = featured ? 0 : 1;

    db.query(
      "UPDATE campus_images SET featured=? WHERE id=?",
      [newFeatured, imageId],
      (e2) => {
        if (e2) return res.status(500).json({ message: "DB error", error: e2.message });
        return res.status(200).json({ message: "Feature toggled", featured: !!newFeatured });
      }
    );
  });
};
