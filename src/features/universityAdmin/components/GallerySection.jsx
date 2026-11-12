import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { EmptyState, Modal, PageHeader } from "./ui";
import { useUniversityAdmin } from "./UniversityAdminContext";
import {
  deleteMyGalleryImage,
  getMyGallery,
  uploadMyGalleryImage,
} from "../../university/api/university";
import { API } from "../../../shared/api/client";

const MAX_MB = 5;
const ACCEPT = "image/png,image/jpeg,image/webp";

const imgUrl = (url) => (url?.startsWith("http") ? url : `${API}${url}`);

export default function GallerySection() {
  const { university, addToast } = useUniversityAdmin();
  const [images, setImages] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyGallery();
      setImages(Array.isArray(data.images) ? data.images : []);
      setCampuses(Array.isArray(data.campuses) ? data.campuses : []);
    } catch (e) {
      setError(e.message || "Could not load gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pickFile = (selected) => {
    if (!selected) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(selected.type)) {
      addToast("Choose a PNG, JPG or WebP image.", "error");
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      addToast(`Image must be ${MAX_MB} MB or smaller.`, "error");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const upload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const { ok, status, data } = await uploadMyGalleryImage({ file, caption });
      if (!ok) {
        addToast(
          status === 415
            ? "Only PNG, JPG or WebP images are accepted."
            : data?.error?.message || "Upload failed.",
          "error",
        );
        return;
      }
      addToast("Photo added to your gallery.", "success");
      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview(null);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      setImages((prev) => [{ id: data.id, image_url: data.image_url, caption: data.caption }, ...prev]);
    } catch {
      addToast("Network error — photo not uploaded.", "error");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const { ok, data } = await deleteMyGalleryImage(deleteTarget.id);
      if (!ok) {
        addToast(data?.error?.message || "Could not delete photo.", "error");
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
      addToast("Photo removed.", "success");
    } catch {
      addToast("Network error — photo not deleted.", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (!university && loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-56 rounded bg-slate-200 animate-pulse" />
        <div className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 min-w-0">
      <PageHeader
        title="Gallery"
        subtitle="Photos of your university and campuses shown on the public pages."
      />

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50">
            <Upload className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Add University Photo</h2>
            <p className="text-xs text-slate-400 mt-0.5">PNG, JPG or WebP · max {MAX_MB} MB</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative rounded-2xl border-2 border-dashed border-slate-200 aspect-video md:aspect-auto md:h-full min-h-[130px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-colors overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Selected" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Choose photo</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Caption (optional)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                placeholder="e.g. Main Campus Library"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={upload}
                disabled={!file || uploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploading ? "Uploading…" : "Add Photo"}
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(preview);
                    setPreview(null);
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">University Photos</h2>
            <p className="text-xs text-slate-400 mt-0.5">{images.length} photo{images.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="aspect-video rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {error}{" "}
            <button type="button" onClick={load} className="font-medium underline">Retry</button>
          </div>
        ) : images.length === 0 ? (
          <EmptyState message="No university photos yet. Add your first photo above." icon={<ImageIcon className="w-5 h-5" />} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video">
                <img
                  src={imgUrl(img.image_url)}
                  alt={img.caption || "University photo"}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                {img.caption && (
                  <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs px-3 pt-6 pb-2 truncate">
                    {img.caption}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(img)}
                  title="Delete photo"
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Campus Photos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            These are managed by each campus admin. They appear on the campus public pages.
          </p>
        </div>

        {loading ? (
          <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        ) : campuses.length === 0 ? (
          <EmptyState message="No campuses linked to this university yet." icon={<ImageIcon className="w-5 h-5" />} />
        ) : (
          <div className="space-y-4">
            {campuses.map((campus) => (
              <div key={campus.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  {campus.cover_image ? (
                    <img
                      src={imgUrl(campus.cover_image)}
                      alt=""
                      loading="lazy"
                      className="w-14 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{campus.name}</p>
                    <p className="text-xs text-slate-400">
                      {campus.images.length} photo{campus.images.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {campus.images.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2">
                    No gallery photos uploaded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {campus.images.map((img) => (
                      <div key={img.id} className="relative rounded-lg overflow-hidden aspect-video bg-slate-100">
                        <img
                          src={imgUrl(img.image_url)}
                          alt={img.caption || campus.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        {img.featured && (
                          <span className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                            Banner
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {deleteTarget && (
        <Modal
          title="Remove this photo?"
          onClose={() => setDeleteTarget(null)}
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium"
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          }
        >
          <p className="text-sm text-slate-600">
            This removes the photo from your public gallery. The file is deleted from the server.
          </p>
        </Modal>
      )}
    </div>
  );
}
