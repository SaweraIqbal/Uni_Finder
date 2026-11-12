import { useCallback, useEffect, useState } from "react";
import { Upload, Star, Pencil, Trash2, X, Plus, RefreshCw, Link2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  PrimaryBtn,
  FilterChip,
  FormInput,
  FormSelect,
  SecondaryBtn,
  ConfirmModal,
} from "../ui";
import {
  addCampusImage,
  addCampusImageLink,
  deleteCampusImage,
  featureCampusImage,
  listCampusImages,
} from "../../../campus/api/campus";
import { useCampusAdmin } from "../CampusAdminContext";
import { API } from "../../../../shared/api/client";

const CATEGORIES = ["All","Campus Building","Classrooms","Labs","Library","Cafeteria","Grounds","Prayer Area","Hostel","Events"];

const imgUrl = (url) =>
  url?.startsWith("http") ? url : `${API}${url}`;

export default function GalleryPage({ externalUploadTrigger = 0 }) {
  const { campus, refetch } = useCampusAdmin();
  const campusId = campus?.id;

  const [images,      setImages]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [catFilter,   setCatFilter]   = useState("All");
  const [deleteId,    setDeleteId]    = useState(null);
  const [uploadOpen,  setUploadOpen]  = useState(false);

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

  useEffect(() => {
    if (externalUploadTrigger > 0) setUploadOpen(true);
  }, [externalUploadTrigger]);

  const filtered = catFilter === "All"
    ? images
    : images.filter((i) => i.category === catFilter);

  const toggleFeatured = async (id) => {
    setImages((imgs) => imgs.map((img) => img.id === id ? { ...img, featured: !img.featured } : img));
    try {
      await featureCampusImage(id);
    } catch {

      setImages((imgs) => imgs.map((img) => img.id === id ? { ...img, featured: !img.featured } : img));
      toast.error("Could not update featured status.");
    }
  };

  const doDelete = async () => {
    try {
      const { ok, data } = await deleteCampusImage(deleteId);
      if (ok || data?.deleted) {
        setImages((imgs) => imgs.filter((img) => img.id !== deleteId));
        refetch();
        if (ok) toast.success("Image removed");
        else toast.error(data?.message || "Image was removed from the gallery, but its file could not be deleted.");
      } else {
        toast.error(data?.message || "Delete failed");
        loadImages();
      }
    } catch {
      toast.error("Delete failed");
      loadImages();
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">

      <div className="flex items-start gap-2 rounded-xl bg-orange-50 border border-orange-100 px-4 py-2.5 text-sm text-orange-700">
        <Star className="w-4 h-4 mt-0.5 flex-shrink-0 fill-orange-400 text-orange-400" />
        <span>
          <strong>Star any photo</strong> to set it as the <strong>banner image</strong> shown on campus cards across the platform. The first uploaded photo is used by default until you star one.
        </span>
      </div>

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
              className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video group shadow-sm border border-slate-100"
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

              {img.featured && (
                <span className="absolute top-2 left-10 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                  Banner
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleFeatured(img.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors focus:outline-none"
                title={img.featured ? "Remove as banner photo" : "⭐ Set as banner photo (shown on campus cards)"}
              >
                <Star className={`w-4 h-4 ${img.featured ? "fill-orange-400 text-orange-400" : "text-white"}`} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(img.id)}
                aria-label={`Delete ${img.caption || "campus image"}`}
                title="Delete image"
                className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-red-600 shadow hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

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
          defaultCategory={catFilter === "All" ? "Campus Building" : catFilter}
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

function UploadModal({ onClose, campusId, onUploaded, defaultCategory }) {
  const [file,      setFile]      = useState(null);
  const [caption,   setCaption]   = useState("");
  const [category,  setCategory]  = useState(defaultCategory);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [source,    setSource]    = useState("file");
  const [imageUrl,  setImageUrl]  = useState("");

  const selectImageFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)) {
      toast.error("Choose a PNG, JPG, or WebP image.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    setFile(selectedFile);
    setSource("file");
  }, []);

  useEffect(() => {
    const handlePaste = (event) => {
      const imageItem = Array.from(event.clipboardData?.items || [])
        .find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;
      event.preventDefault();
      const pastedFile = imageItem.getAsFile();
      if (pastedFile) {
        const extension = pastedFile.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const namedFile = new File([pastedFile], `pasted-image.${extension}`, { type: pastedFile.type });
        selectImageFile(namedFile);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectImageFile]);

  const handleUpload = async () => {
    if (source === "file" && !file) { toast.error("Please select or paste an image"); return; }
    if (source === "url" && !imageUrl.trim()) { toast.error("Please enter an image URL"); return; }
    if (!campusId)  { toast.error("Campus not loaded"); return; }
    setUploading(true);
    try {
      let result;
      if (source === "url") {
        result = await addCampusImageLink({
            image_url: imageUrl.trim(),
            caption,
            category,
            campus_id: campusId,
          });
      } else {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("caption", caption);
        fd.append("category", category);
        fd.append("campus_id", campusId);
        result = await addCampusImage(fd);
      }
      const { ok, data } = result;
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
          <div className="flex gap-2">
            <button type="button" onClick={() => setSource("file")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${source === "file" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-slate-600"}`}>
              Upload or paste
            </button>
            <button type="button" onClick={() => setSource("url")}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${source === "url" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-slate-600"}`}>
              <Link2 className="w-4 h-4" /> Add image link
            </button>
          </div>
          {source === "file" ? (
            <label
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
                dragOver ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); selectImageFile(e.dataTransfer.files[0]); }}
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-orange-500" />
              </div>
              {file
                ? <p className="text-sm font-medium text-slate-700">{file.name}</p>
                : <>
                    <p className="text-sm font-medium text-slate-600">Drag & drop, click to select, or paste an image</p>
                    <p className="text-xs text-slate-400">PNG, JPG, WebP — max 5 MB</p>
                  </>}
              <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp"
                onChange={(e) => selectImageFile(e.target.files[0])} />
            </label>
          ) : (
            <FormInput
              label="Image URL"
              type="url"
              placeholder="https://example.com/campus-image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          )}
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
