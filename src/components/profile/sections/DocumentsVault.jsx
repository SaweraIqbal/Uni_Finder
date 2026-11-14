/**
 * DocumentsVault — unified list of all uploaded files, with Missing detection.
 */
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import SectionCard from "../SectionCard";
import StatusChip from "../StatusChip";
import { fetchDocuments, deleteStudentFile, studentFileUrl } from "../../../api/studentProfile";
import { DOC_TYPE_META } from "../../../config/profileRequirements";

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsVault({ targetLevel, missingDocs = [], onRefresh }) {
  const [docs,     setDocs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await fetchDocuments();
    if (ok) setDocs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (filename) => {
    if (!window.confirm("Delete this file? This cannot be undone.")) return;
    setDeleting(filename);
    const { ok, data } = await deleteStudentFile(filename);
    setDeleting(null);
    if (!ok) { toast.error(data?.message || "Delete failed"); return; }
    toast.success("File deleted");
    load();
    onRefresh?.();
  };

  // Build missing rows: required doc types that have no uploaded file
  const uploadedTypes = new Set(docs.map((d) => d.doc_type));
  const missingRows   = missingDocs
    .filter((d) => !uploadedTypes.has(d.doc_type))
    .map((d) => ({ ...d, status: "Missing" }));

  const allRows = [
    ...docs.map((d) => ({ ...d, status: "Uploaded" })),
    ...missingRows,
  ];

  return (
    <SectionCard
      id="documents"
      title="Documents Vault"
      helperText="All your uploaded files in one place. Missing required documents are flagged in amber."
      isComplete={missingRows.length === 0}
    >
      {loading ? (
        <p className="text-sm text-slate-400 py-4 text-center">Loading documents…</p>
      ) : allRows.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No documents uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-2">Document</th>
                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Section</th>
                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Size</th>
                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Uploaded</th>
                <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Status</th>
                <th className="px-6 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allRows.map((row, i) => {
                const meta       = DOC_TYPE_META[row.doc_type] || {};
                const isUploaded = row.status === "Uploaded";
                const isDeleting = deleting === row.filename;

                return (
                  <tr key={i} className={`${isDeleting ? "opacity-40" : ""} hover:bg-slate-50/50 transition-colors`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* File type icon */}
                        <svg className={`w-4 h-4 flex-shrink-0 ${isUploaded ? "text-slate-400" : "text-amber-400"}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {meta.label || row.label || row.doc_type}
                          </p>
                          {row.filename && (
                            <p className="text-xs text-slate-400 truncate">{row.filename}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-500">
                        {meta.sectionLabel || row.section || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-500">
                      {isUploaded ? formatBytes(row.size) : "—"}
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-500">
                      {row.uploaded_at
                        ? new Date(row.uploaded_at).toLocaleDateString("en-PK")
                        : "—"}
                    </td>

                    <td className="px-3 py-3">
                      <StatusChip
                        variant={isUploaded ? "uploaded" : "missing"}
                        label={row.status}
                      />
                    </td>

                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        {isUploaded && row.url && (
                          <a
                            href={studentFileUrl(row.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        )}
                        {!isUploaded && row.section && (
                          <a
                            href={`#${row.section}`}
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById(row.section)?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-xs text-orange-600 hover:underline"
                          >
                            Go to section
                          </a>
                        )}
                        {isUploaded && row.filename && (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(row.filename)}
                            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
