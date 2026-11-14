/**
 * RepeatableRecordEditor
 * Generic add/edit/delete row editor used by Academic Records, Test Scores,
 * References, Experience, and Publications.
 *
 * Props:
 *   records        array    current list of records
 *   renderCard     (record, { onEdit, onDelete }) => ReactNode   display view
 *   renderForm     (draft, onChange, errors) => ReactNode        edit/add form
 *   emptyState     ReactNode   shown when records is empty
 *   onAdd          (draft) => Promise<void>
 *   onUpdate       (id, draft) => Promise<void>
 *   onDelete       (id) => Promise<void>
 *   maxRecords     number  (optional cap)
 *   addLabel       string  (default "Add record")
 *   isEditing      bool    (parent SectionCard edit mode)
 */
import { useState } from "react";

const EMPTY_DRAFT = {};

export default function RepeatableRecordEditor({
  records = [],
  renderCard,
  renderForm,
  emptyState,
  onAdd,
  onUpdate,
  onDelete,
  maxRecords,
  addLabel = "Add record",
  isEditing = false,
}) {
  const [mode, setMode]       = useState(null);  // null | 'add' | { id }
  const [draft, setDraft]     = useState(EMPTY_DRAFT);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null); // id being deleted
  const [confirmDelete, setConfirmDelete] = useState(null); // id to confirm

  const isAddMode  = mode === "add";
  const isEditMode = mode !== null && mode !== "add";

  const startAdd = () => {
    setMode("add");
    setDraft(EMPTY_DRAFT);
    setErrors({});
  };

  const startEdit = (record) => {
    setMode({ id: record.id });
    setDraft({ ...record });
    setErrors({});
  };

  const cancel = () => {
    setMode(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
  };

  const handleChange = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    // Clear errors for changed fields
    const clearedErrors = { ...errors };
    Object.keys(patch).forEach((k) => delete clearedErrors[k]);
    setErrors(clearedErrors);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isAddMode) {
        await onAdd(draft);
      } else {
        await onUpdate(mode.id, draft);
      }
      setMode(null);
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      // Surface server validation errors
      if (err?.fieldErrors) setErrors(err.fieldErrors);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async (id) => {
    setConfirmDelete(null);
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(null);
    }
  };

  const canAdd = !maxRecords || records.length < maxRecords;

  return (
    <div className="space-y-3">
      {/* Existing records */}
      {records.length === 0 && !isAddMode && (
        <div className="text-sm text-slate-400 py-4 text-center">
          {emptyState ?? "No records added yet."}
        </div>
      )}

      {records.map((record) => {
        const isThisEditing = isEditMode && mode?.id === record.id;
        const isThisDeleting = deleting === record.id;

        return (
          <div
            key={record.id}
            className={`border border-slate-200 rounded-xl overflow-hidden transition-opacity
              ${isThisDeleting ? "opacity-40 pointer-events-none" : ""}`}
          >
            {isThisEditing ? (
              <div className="p-4 space-y-4">
                {renderForm(draft, handleChange, errors)}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-600
                               hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 text-xs rounded-xl bg-orange-500 text-white font-semibold
                               hover:bg-orange-600 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                {renderCard(record, {
                  onEdit:   isEditing ? () => startEdit(record) : undefined,
                  onDelete: isEditing ? () => setConfirmDelete(record.id) : undefined,
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {isAddMode && (
        <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-4 space-y-4">
          {renderForm(draft, handleChange, errors)}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-600
                         hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs rounded-xl bg-orange-500 text-white font-semibold
                         hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {isEditing && !isAddMode && !isEditMode && canAdd && (
        <button
          type="button"
          onClick={startAdd}
          className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700
                     px-3 py-2 rounded-xl border border-dashed border-orange-300 hover:border-orange-400
                     transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {addLabel}
          {maxRecords && <span className="text-xs text-slate-400 font-normal">({records.length}/{maxRecords})</span>}
        </button>
      )}

      {/* Cap message */}
      {isEditing && !canAdd && (
        <p className="text-xs text-slate-400 text-center py-1">
          Maximum {maxRecords} record{maxRecords !== 1 ? "s" : ""} reached.
        </p>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Delete record?</h3>
            <p className="text-sm text-slate-500">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-3 py-2 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirmed(confirmDelete)}
                className="flex-1 px-3 py-2 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
