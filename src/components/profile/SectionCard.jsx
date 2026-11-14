/**
 * SectionCard — reusable wrapper for every profile section.
 *
 * Props:
 *   id          string   — used for scroll-to anchoring
 *   title       string
 *   helperText  string   (optional)
 *   isComplete  bool
 *   isEditing   bool
 *   isSaving    bool
 *   savedOk     bool     — flash "Saved ✓" after a successful save
 *   onEdit      ()=>void
 *   onSave      ()=>void
 *   onCancel    ()=>void
 *   children    ReactNode  — the form fields (shown in both view and edit mode)
 *   hidden      bool     — when true, renders nothing (level-gated sections)
 *   onEditChange (bool)=>void — called whenever edit mode opens or closes
 */
import { useEffect } from "react";
import StatusChip from "./StatusChip";

export default function SectionCard({
  id,
  title,
  helperText,
  isComplete = false,
  isEditing = false,
  isSaving = false,
  savedOk = false,
  onEdit,
  onSave,
  onCancel,
  children,
  hidden = false,
  onEditChange,   // (isEditing: bool) => void  — notifies parent when edit mode changes
}) {
  if (hidden) return null;

  // Notify parent whenever this card's edit mode changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    onEditChange?.(isEditing);
  }, [isEditing]); // onEditChange intentionally omitted — parent ref is stable

  const handleEdit = () => { onEdit?.(); };
  const handleCancel = () => { onCancel?.(); };
  const handleSave = () => { onSave?.(); };

  return (
    <section
      id={id}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-slate-800 leading-tight">{title}</h2>
            <StatusChip variant={isComplete ? "complete" : "incomplete"} />
          </div>
          {helperText && (
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{helperText}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {savedOk && !isEditing && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}

          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                         border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600
                         transition-colors duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414A2 2 0 018.586 12.5z" />
              </svg>
              Edit
            </button>
          )}

          {isEditing && (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                           border border-slate-200 text-slate-600 hover:bg-slate-50
                           disabled:opacity-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold
                           bg-orange-500 text-white hover:bg-orange-600
                           disabled:opacity-60 transition-colors duration-150"
              >
                {isSaving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving…
                  </>
                ) : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
