/**
 * UnsavedWarning
 * Works with the existing <BrowserRouter> (no data-router required).
 *
 * Two guards:
 *  1. Browser beforeunload  — warns on tab close / hard refresh.
 *  2. React-Router useNavigate intercept via a custom link-click listener
 *     on <a> tags that point to in-app routes — shows a modal before leaving.
 *
 * Usage:  <UnsavedWarning when={isDirty} />
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function UnsavedWarning({ when = false }) {
  const navigate = useNavigate();
  const [pendingPath, setPendingPath] = useState(null); // path the user tried to go to

  // ── 1. Block browser refresh / tab close ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!when) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);

  // ── 2. Intercept navbar <a> clicks while dirty ────────────────────────────
  // We attach a single document-level mousedown listener.
  // When the user clicks any <a href="..."> that is an internal path,
  // we cancel it and show our modal instead.
  useEffect(() => {
    if (!when) return;

    const handleClick = (e) => {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only intercept internal paths (start with /)
      if (!href.startsWith("/")) return;

      // Don't intercept hash-only links (section scroll)
      if (href.startsWith("#")) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingPath(href);
    };

    document.addEventListener("click", handleClick, true); // capture phase
    return () => document.removeEventListener("click", handleClick, true);
  }, [when]);

  const handleStay = () => setPendingPath(null);

  const handleLeave = useCallback(() => {
    const path = pendingPath;
    setPendingPath(null);
    if (path) navigate(path);
  }, [pendingPath, navigate]);

  if (!pendingPath) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Unsaved changes</h3>
            <p className="mt-1 text-sm text-slate-500">
              You have unsaved changes. If you leave now your edits will be lost.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleStay}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200
                       text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Stay &amp; Save
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white
                       hover:bg-red-600 transition-colors"
          >
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  );
}
