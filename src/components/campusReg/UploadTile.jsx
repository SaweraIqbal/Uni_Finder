/**
 * UploadTile.jsx
 * Reusable dashed-border file upload tile.
 * Captures name/size only — NO real upload.
 *
 * TODO: Replace with POST /api/uploads (multipart) when submitting the form.
 */
import { useRef, useState } from "react";
import { Paperclip, Upload, X } from "lucide-react";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES  = ["application/pdf"];
const ALLOWED_EXT    = ".pdf";

function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadTile({
  label         = "Upload Document",
  hint          = "PDF only · max 10 MB",
  file,            // { name, size } | null — controlled
  onChange,        // (fileInfo | null) => void
  error,           // external validation error string
  highlight,       // amber highlight mode (resubmission)
  required = false,
}) {
  const inputRef     = useRef(null);
  const [internalErr, setInternalErr] = useState(null);
  const displayError = internalErr || error;

  const validate = (f) => {
    if (!ALLOWED_TYPES.includes(f.type) && !f.name.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files are allowed.";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File is too large (${formatBytes(f.size)}). Maximum is 10 MB.`;
    }
    return null;
  };

  const handleChange = (e) => {
    setInternalErr(null);
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validate(f);
    if (err) {
      setInternalErr(err);
      onChange(null);
      e.target.value = "";
      return;
    }
    // Store name + size for display, plus the raw File object so the form
    // page can append it to FormData before POSTing.
    // files stored on server disk via /uploads — swap to cloud storage in production
    onChange({ name: f.name, size: f.size, _file: f });
    e.target.value = ""; // allow re-selecting same file
  };

  const handleRemove = () => {
    setInternalErr(null);
    onChange(null);
  };

  const borderColor = displayError
    ? "border-red-400"
    : highlight
    ? "border-amber-400 bg-amber-50"
    : "border-gray-200 hover:border-orange-300";

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXT}
        className="hidden"
        onChange={handleChange}
        aria-label={label}
      />

      {file ? (
        /* ── File chip ── */
        <div className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 bg-white transition-colors ${borderColor}`}>
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Paperclip className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
          </div>
          {highlight && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
              Required
            </span>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors focus:outline-none shrink-0"
            aria-label="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* ── Drop / click zone ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 min-h-[88px] ${borderColor}`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${highlight ? "bg-amber-100" : "bg-gray-100"}`}>
            <Upload className={`w-5 h-5 ${highlight ? "text-amber-500" : "text-slate-400"}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
          </div>
          {highlight && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Required for resubmission
            </span>
          )}
        </button>
      )}

      {displayError && (
        <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
          <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          {displayError}
        </p>
      )}
    </div>
  );
}
