import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../../config/db.js";

const UPLOADS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "uploads",
);

// POST /api/campus/images   (multipart image or JSON image_url, plus campus_id, caption, category)
export const addCampusImage = (req, res) => {
  const { campus_id, caption, category } = req.body;
  const externalUrl = typeof req.body.image_url === "string" ? req.body.image_url.trim() : "";
  if (!campus_id || (!req.file && !externalUrl))
    return res.status(400).json({ message: "campus_id and an image or image_url are required" });
  if (req.file && (
    !["image/png", "image/jpeg", "image/webp"].includes(req.file.mimetype) ||
    req.file.size > 5 * 1024 * 1024
  )) {
    fs.unlink(path.join(UPLOADS_DIR, path.basename(req.file.filename)))
      .catch((error) => console.error("Campus image upload cleanup failed:", error.message));
    return res.status(400).json({ message: "Choose a PNG, JPG, or WebP image up to 5 MB." });
  }
  if (externalUrl) {
    try {
      const parsed = new URL(externalUrl);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || externalUrl.length > 500) {
        return res.status(400).json({ message: "Enter a valid HTTP or HTTPS image URL" });
      }
    } catch {
      return res.status(400).json({ message: "Enter a valid HTTP or HTTPS image URL" });
    }
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : externalUrl;
  const id = uuidv4();
  const discardUpload = () => {
    if (req.file) {
      fs.unlink(path.join(UPLOADS_DIR, path.basename(req.file.filename)))
        .catch((error) => console.error("Campus image upload cleanup failed:", error.message));
    }
  };

  db.query(
    "SELECT id FROM campuses WHERE id = ? AND campus_admin_uid = ? LIMIT 1",
    [campus_id, req.user.id],
    (ownerError, campuses) => {
      if (ownerError) {
        discardUpload();
        return res.status(500).json({ message: "DB error", error: ownerError.message });
      }
      if (!campuses.length) {
        discardUpload();
        return res.status(403).json({ message: "You can only add images to your own campus." });
      }

      db.query(
        `INSERT INTO campus_images (id, campus_id, image_url, caption, category)
         VALUES (?,?,?,?,?)`,
        [id, campus_id, imageUrl, caption || null, category || "Campus Building"],
        (err) => {
          if (err) {
            discardUpload();
            return res.status(500).json({ message: "DB error", error: err.message });
          }

          // Auto-set cover_image if the campus doesn't have one yet
          db.query(
            "UPDATE campuses SET cover_image=?, updated_at=NOW() WHERE id=? AND (cover_image IS NULL OR cover_image='')",
            [imageUrl, campus_id],
            (eCover) => {
              if (eCover) console.error("auto cover_image set failed:", eCover.message);
            }
          );

          return res.status(201).json({ message: "Image added", id, image_url: imageUrl });
        },
      );
    },
  );
};

// GET /api/campus/:campusId/images
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

// DELETE /api/campus/images/:imageId
export const deleteCampusImage = (req, res) => {
  const { imageId } = req.params;
  db.query(
    `SELECT ci.image_url
     FROM campus_images ci
     JOIN campuses c ON c.id = ci.campus_id
     WHERE ci.id = ? AND c.campus_admin_uid = ?
     LIMIT 1`,
    [imageId, req.user.id],
    (lookupError, rows) => {
      if (lookupError)
        return res.status(500).json({ message: "DB error", error: lookupError.message });
      if (!rows.length) return res.status(404).json({ message: "Image not found" });

      db.query("DELETE FROM campus_images WHERE id=?", [imageId], async (deleteError, result) => {
        if (deleteError)
          return res.status(500).json({ message: "DB error", error: deleteError.message });
        if (!result.affectedRows)
          return res.status(404).json({ message: "Image not found" });

        const match = /^\/uploads\/([^/\\]+)$/.exec(rows[0].image_url || "");
        if (match && match[1] !== "." && match[1] !== ".." && path.basename(match[1]) === match[1]) {
          const filePath = path.resolve(UPLOADS_DIR, match[1]);
          try {
            await fs.unlink(filePath);
          } catch (fileError) {
            if (fileError.code !== "ENOENT") {
              console.error("Campus image file deletion failed:", fileError.message);
              return res.status(500).json({
                message: "Image removed from the gallery, but its file could not be deleted.",
                deleted: true,
              });
            }
          }
        }

        return res.status(200).json({ message: "Image deleted" });
      });
    },
  );
};

// PUT /api/campus/images/:imageId/feature   —  toggle featured flag
export const featureCampusImage = (req, res) => {
  const { imageId } = req.params;
  // Read current value, flip it
  db.query("SELECT campus_id, image_url, featured FROM campus_images WHERE id=?", [imageId], (err, rows) => {
    if (err || !rows.length)
      return res.status(404).json({ message: "Image not found" });

    const { campus_id, image_url, featured } = rows[0];
    const newFeatured = featured ? 0 : 1;

    db.query(
      "UPDATE campus_images SET featured=? WHERE id=?",
      [newFeatured, imageId],
      (e2) => {
        if (e2) return res.status(500).json({ message: "DB error", error: e2.message });

        // When starring an image, sync it to campuses.cover_image so listing cards
        // always reflect the campus admin's explicit choice immediately.
        if (newFeatured) {
          db.query(
            "UPDATE campuses SET cover_image=?, updated_at=NOW() WHERE id=?",
            [image_url, campus_id],
            (e3) => {
              if (e3) console.error("cover_image sync failed:", e3.message);
            }
          );
        }

        return res.status(200).json({ message: "Feature toggled", featured: !!newFeatured });
      }
    );
  });
};
