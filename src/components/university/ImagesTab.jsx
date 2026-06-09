import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listImages, addImage, deleteImage } from "../../api/university";
import { fileUrl } from "../../api/client";

// Gallery manager: upload campus/university photos, see them, delete them.
// `universityId` is the saved university's id.
export default function ImagesTab({ universityId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listImages(universityId);
      setImages(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universityId]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Choose an image first");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("university_id", universityId);
      fd.append("caption", caption);
      fd.append("image", file);
      const { ok, data } = await addImage(fd);
      if (ok) {
        toast.success("Image added");
        setFile(null);
        setCaption("");
        load();
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    const { ok } = await deleteImage(id);
    if (ok) {
      toast.success("Image removed");
      setImages((imgs) => imgs.filter((i) => i.id !== id));
    } else {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Upload form */}
      <form onSubmit={upload} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Gallery</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload campus photos. These show on your public university page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm"
          />
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-[#c88410] hover:bg-[#a66d0d] text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Add Image"}
          </button>
        </div>
      </form>

      {/* Grid */}
      {loading ? (
        <div className="text-gray-400">Loading…</div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          No images yet. Upload your first campus photo above.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-100">
              <img src={fileUrl(img.image_url)} alt={img.caption || "campus"} className="w-full h-40 object-cover" />
              {img.caption && (
                <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                  {img.caption}
                </p>
              )}
              <button
                onClick={() => remove(img.id)}
                className="absolute top-2 right-2 bg-white/90 text-red-500 w-7 h-7 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition"
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
