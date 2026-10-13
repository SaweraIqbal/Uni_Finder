/**
 * Page 7 — Campus Gallery
 * Real API: listCampusImages (via context), addCampusImage, deleteCampusImage, featureCampusImage
 */
import { useEffect, useState } from "react";
import { Upload, Star, Pencil, Trash2, X, Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import {
  PrimaryBtn,
  FilterChip,
  FormInput,
  FormSelect,
  SecondaryBtn,
  IconBtn,
  ConfirmModal,
} from "../ui";
import {
  addCampusImage,
  deleteCampusImage,
  featureCampusImage,
  listCampusImages,
} from "../../../api/campus";
import { useCampusAdmin } from "../CampusAdminContext";
import { API } from "../../../api/client";

const CATEGORIES = ["All","Campus Building","Classrooms","Labs","Library","Cafeteria","Grounds","Prayer Area","Hostel","Events"];

/** Convert a stored path to a full URL */
const imgUrl = (url) =>
  url?.startsWith("http") ? url : `${API}${url}`;

export default function GalleryPage() {
  const { campus, refetch } = useCampusAdmin();
  const campusId = campus?.id;

  const [images,      setImages]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [catFilter,   setCatFilter]   = useState("All");
  const [hoverId,     setHoverId]     = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [uploadOpen,  setUploadOpen]  = useState(false);

  // ── Load images ──────────────────────────────────────────────────────────
  const loadImages = async () => {
    if (!campusId) return;
    setLoading(true);
    try {
      const data = await listCampusImages(campusId);
      setImages(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadImages(); }, [campusId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = catFilter === "All"
    ? images
    : images.filter((i) => i.category === catFilter);

  // ── Toggle featured (optimistic + real) ──────────────────────────────────
  const toggleFeatured = async (id) => {
    setImages((imgs) => imgs.map((img) => img.id === id ? { ...img, featured: !img.featured } : img));
    try {
      await featureCampusImage(id);
    } catch {
      // revert on failure
      setImages((imgs) => imgs.map((img) => img.id === id ? { ...img, featured: !img.featured } : img));
      toast.error("Could not update featured status.");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const doDelete = async () => {
    try {
      const { ok } = await deleteCampusImage(deleteId);
      if (ok) {
        setImages((imgs) => imgs.filter((img) => img.id !== deleteId));
        toast.success("Image removed");
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Category chips + refresh ── */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <FilterChip key={c} label={c} active={catFilter === c} onClick={() => setCatFilter(c)} />
        ))}
        <button
          type="button"
          onClick={loadImages}
          disabled={loading}
          className="ml-auto p-2 rounded-lg hover:bg-gray-100 text-slate-400 transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Grid ── */}
      {loading && images.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((n) => (
            <div key={n} className="rounded-2xl bg-gray-100 aspect-video animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((img) => (
            <div
              key={img.id}
              className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video group cursor-pointer shadow-sm border border-slate-100"
              onMouseEnter={() => setHoverId(img.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <img
                src={imgUrl(img.image_url)}
                alt={img.caption || ""}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm font-medium leading-tight">{img.caption || "—"}</p>
                <span className="text-xs text-white/70">{img.category}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleFeatured(img.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors focus:outline-none"
                title={img.featured ? "Unfeature" : "Set as featured"}
              >
                <Star className={`w-4 h-4 ${img.featured ? "fill-orange-400 text-orange-400" : "text-white"}`} />
              </button>
              {hoverId === img.id && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3">
                  <IconBtn danger title="Delete image" onClick={() => setDeleteId(img.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconBtn>
                </div>
              )}
            </div>
          ))}

          {/* Upload tile */}
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="rounded-2xl border-2 border-dashed border-gray-200 aspect-video flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Upload Image</p>
              <p className="text-xs text-slate-400">PNG/JPG, max 5 MB</p>
            </div>
          </button>
        </div>
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          campusId={campusId}
          onUploaded={() => { setUploadOpen(false); loadImages(); toast.success("Image uploaded"); }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Remove this image?"
          message="This will permanently delete the image from your gallery."
          onConfirm={doDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

/* ─── Upload Modal ─────────────────────────────────────────────────────────── */
function UploadModal({ onClose, campusId, onUploaded }) {
  const [file,      setFile]      = useState(null);
  const [caption,   setCaption]   = useState("");
  const [category,  setCategory]  = useState("Campus Building");
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);

  const handleUpload = async () => {
    if (!file)      { toast.error("Please select an image"); return; }
    if (!campusId)  { toast.error("Campus not loaded"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image",     file);
      fd.append("caption",   caption);
      fd.append("category",  category);
      fd.append("campus_id", campusId);
      const { ok, data } = await addCampusImage(fd);
      if (ok) onUploaded?.();
      else toast.error(data?.message || "Upload failed");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-slate-800">Upload Image</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <label
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
              dragOver ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          >
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-orange-500" />
            </div>
            {file
              ? <p className="text-sm font-medium text-slate-700">{file.name}</p>
              : <>
                  <p className="text-sm font-medium text-slate-600">Drag & drop or click to select</p>
                  <p className="text-xs text-slate-400">PNG, JPG — max 5 MB</p>
                </>}
            <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <FormSelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
          </FormSelect>
          <FormInput label="Caption" placeholder="e.g. CS Department Lab"
            value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

export function GalleryActions({ onUpload }) {
  return (
    <PrimaryBtn onClick={onUpload}>
      <Upload className="w-4 h-4" /> Upload Images
    </PrimaryBtn>
  );
}
