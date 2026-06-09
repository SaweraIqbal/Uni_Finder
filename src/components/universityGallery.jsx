import { useEffect, useState } from "react";
import { listImages } from "../api/university";
import { fileUrl } from "../api/client";

// Public photo gallery on the university detail page.
// Renders nothing if the university has no images yet.
export default function UniversityGallery({ universityId }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (!universityId) return;
    (async () => {
      const data = await listImages(universityId);
      setImages(Array.isArray(data) ? data : []);
    })();
  }, [universityId]);

  if (!images.length) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
          Campus life
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gallery</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative rounded-xl overflow-hidden border border-gray-100 group">
              <img
                src={fileUrl(img.image_url)}
                alt={img.caption || "campus"}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {img.caption && (
                <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                  {img.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
