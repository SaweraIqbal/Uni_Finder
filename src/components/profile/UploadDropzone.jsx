/**
 * UploadDropzone
 * - When no file: shows drag-and-drop area
 * - When file uploaded: shows file row only; drop zone collapses to a small "Replace" link
 * - View uses authenticated fetch to open file in new tab as a blob URL
 * - Date inputs: styled via CSS class (see DateInput export below)
 */
import { useState, useRef } from "react";
import { uploadStudentFile } from "../../api/studentProfile";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXT   = /\.(pdf|jpg|jpeg|png)$/i;
const BASE = "http://localhost:5000";

/** Fetch a private file with JWT and open it in a new tab as a blob URL */
async function openAuthFile(url) {
  const token = sessionStorage.getItem("token");
  try {
    const fullUrl = url.startsWith("http") ? url : `${BASE}${url}`;
    const res = await fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) { alert("Could not open file. Please try again."); return; }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    // Revoke after a short delay so the new tab has time to load
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch {
    alert("Could not open file.");
  }
}

export default function UploadDropzone({
  label = "Upload file",
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSizeMB = 10,
  currentUrl,
  docType = "other",
  onUploaded,
  onDelete,
  disabled = false,
  required = false,
}) {
  const inputRef              = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [opening, setOpening]   = useState(false);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const validate = (file) => {
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.test(file.name)) {
      return "Only PDF, JPG, and PNG files are allowed";
    }
    if (file.size > maxBytes) {
      return `File must be under ${maxSizeMB} MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`;
    }
    return null;
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    const err = validate(file);
    if (err) { setError(err); return; }
    setProgress(0);
    const { ok, data } = await uploadStudentFile(file, docType, setProgress);
    setProgress(null);
    if (!ok) { setError(data?.message || "Upload failed — please try again"); return; }
    onUploaded?.(data.url, data.filename);
  };

  const onInputChange = (e) => { handleFile(e.target.files?.[0]); e.target.value = ""; };
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleView = async () => {
    if (!currentUrl || opening) return;
    setOpening(true);
    await openAuthFile(currentUrl);
    setOpening(false);
  };

  const filename = currentUrl ? currentUrl.split("/").pop() : null;
  const hasFile  = Boolean(currentUrl);

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>

      {/* ── File already uploaded ── */}
      {hasFile && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5
          bg-green-50 border border-green-200 rounded-xl text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate text-green-700 font-medium text-xs">{filename}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleView}
              disabled={opening}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {opening ? "Opening…" : "View"}
            </button>
            {!disabled && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-slate-500 hover:text-orange-600"
              >
                Replace
              </button>
            )}
            {onDelete && !disabled && (
              <button
                type="button"
                onClick={onDelete}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input — always present for Replace */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={onInputChange}
      />

      {/* ── Drop zone — only shown when NO file uploaded ── */}
      {!hasFile && !disabled && (
        <div
          className={`relative flex flex-col items-center justify-center gap-2 px-4 py-5
            border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-150
            ${dragging ? "border-orange-400 bg-orange-50"
              : error   ? "border-red-300 bg-red-50"
              : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/40"}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          {progress !== null ? (
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 bg-orange-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs text-slate-500 text-center">
                <span className="font-medium text-orange-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400">PDF, JPG, PNG — max {maxSizeMB} MB</p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
