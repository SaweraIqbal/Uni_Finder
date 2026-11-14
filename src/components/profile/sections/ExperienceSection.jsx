/**
 * ExperienceSection â€” work, awards, certifications, CV upload.
 * CV required for MS / MPhil / PhD.
 */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SectionCard from "../SectionCard";
import RepeatableRecordEditor from "../RepeatableRecordEditor";
import UploadDropzone from "../UploadDropzone";
import DatePicker from "../DatePicker";
import {
  fetchExperience,
  createExperience,
  updateExperience as apiUpdate,
  deleteExperience as apiDelete,
} from "../../../api/studentProfile";
import { EXPERIENCE_ENTRY_TYPES, CV_REQUIRED_LEVELS } from "../../../config/profileRequirements";

function ExpForm({ draft, onChange, errors }) {
  const isWorkType = ["work", "internship"].includes(draft.entry_type);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Type <span className="text-orange-500">*</span></label>
        <select value={draft.entry_type || ""} onChange={(e) => onChange({ entry_type: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="">Select type</option>
          {EXPERIENCE_ENTRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {errors?.entry_type && <p className="mt-0.5 text-xs text-red-600">{errors.entry_type}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Title <span className="text-orange-500">*</span></label>
        <input value={draft.title || ""} onChange={(e) => onChange({ title: e.target.value })}
          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300
            ${errors?.title ? "border-red-300" : "border-slate-200"}`}
          placeholder="Position / award / certificate name" />
        {errors?.title && <p className="mt-0.5 text-xs text-red-600">{errors.title}</p>}
      </div>

      {draft.entry_type !== "cv" && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Organisation</label>
          <input value={draft.organization || ""} onChange={(e) => onChange({ organization: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
              focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Company / institution" />
        </div>
      )}

      {isWorkType && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <DatePicker value={draft.start_date || ""}
              onChange={(iso) => onChange({ start_date: iso })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End Date {draft.is_current ? <span className="text-slate-400">(currently employed)</span> : ""}
            </label>
            {!draft.is_current && (
              <DatePicker value={draft.end_date || ""}
                onChange={(iso) => onChange({ end_date: iso })} />
            )}
            <label className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={Boolean(draft.is_current)}
                onChange={(e) => onChange({ is_current: e.target.checked, end_date: e.target.checked ? "" : draft.end_date })}
                className="accent-orange-500" />
              Currently employed here
            </label>
          </div>
        </>
      )}

      {draft.entry_type !== "cv" && (
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <textarea value={draft.description || ""} onChange={(e) => onChange({ description: e.target.value })}
            rows={2} placeholder="Brief description"
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
              focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
        </div>
      )}

      <div className="sm:col-span-2">
        <UploadDropzone
          label={draft.entry_type === "cv" ? "CV / Resume (PDF)" : "Supporting Document (optional)"}
          docType={draft.entry_type === "cv" ? "cv" : "other"}
          required={draft.entry_type === "cv"}
          currentUrl={draft.document_url}
          onUploaded={(url) => onChange({ document_url: url })}
          onDelete={() => onChange({ document_url: "" })}
        />
      </div>
    </div>
  );
}

function ExpCard({ record, onEdit, onDelete }) {
  const typeLabel = EXPERIENCE_ENTRY_TYPES.find((t) => t.value === record.entry_type)?.label || record.entry_type;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{record.title}</span>
          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{typeLabel}</span>
        </div>
        {record.organization && <p className="text-xs text-slate-500 mt-0.5">{record.organization}</p>}
        {record.start_date && (
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(record.start_date).toLocaleDateString("en-PK")}
            {" â€“ "}
            {record.is_current ? "Present" : record.end_date ? new Date(record.end_date).toLocaleDateString("en-PK") : ""}
          </p>
        )}
        {record.document_url && <p className="text-xs text-green-600 mt-0.5">ðŸ“Ž Document uploaded</p>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onEdit   && <button type="button" onClick={onEdit}   className="text-xs text-orange-500 hover:text-orange-700">Edit</button>}
        {onDelete && <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>}
      </div>
    </div>
  );
}

export default function ExperienceSection({ targetLevel, onSaved, onEditChange }) {
  const [entries,   setEntries]   = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);

  useEffect(() => {
    fetchExperience().then(({ ok, data }) => { if (ok) setEntries(data); });
  }, []);

  const cvRequired = CV_REQUIRED_LEVELS.includes(targetLevel);
  const hasCV      = entries.some((e) => e.entry_type === "cv");
  const isComplete = !cvRequired || hasCV;

  const handleAdd = async (draft) => {
    const { ok, data } = await createExperience(draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setEntries((p) => [...p, data]);
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
    onSaved?.();
  };

  const handleUpdate = async (id, draft) => {
    const { ok, data } = await apiUpdate(id, draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setEntries((p) => p.map((r) => r.id === id ? data : r));
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
  };

  const handleDelete = async (id) => {
    const { ok, data } = await apiDelete(id);
    if (!ok) { toast.error(data?.message || "Delete failed"); return; }
    setEntries((p) => p.filter((r) => r.id !== id));
    onSaved?.();
  };

  return (
    <SectionCard
      id="experience"
      title="Experience & Achievements"
      helperText={cvRequired ? `CV / Resume upload is required for ${targetLevel}.` : "CV upload is optional. Add any work experience, awards, or certifications."}
      isComplete={isComplete}
      isEditing={isEditing}
      savedOk={savedOk}
      onEdit={() => setIsEditing(true)}
      onSave={() => { setIsEditing(false); }}
      onCancel={() => setIsEditing(false)}
      onEditChange={onEditChange}
    >
      {cvRequired && !hasCV && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          A CV / Resume is required for {targetLevel}. Add an entry with type "CV / Resume".
        </div>
      )}

      <RepeatableRecordEditor
        records={entries}
        isEditing={isEditing}
        addLabel="Add entry"
        renderCard={(rec, actions) => <ExpCard record={rec} onEdit={actions.onEdit} onDelete={actions.onDelete} />}
        renderForm={(draft, onChange, errors) => <ExpForm draft={draft} onChange={onChange} errors={errors} />}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        emptyState="No entries added yet."
      />
    </SectionCard>
  );
}

