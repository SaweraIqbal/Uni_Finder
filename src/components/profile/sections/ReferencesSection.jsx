/**
 * ReferencesSection — visible for MS, MPhil, PhD. Min/max from REFERENCES_RULES.
 */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SectionCard from "../SectionCard";
import RepeatableRecordEditor from "../RepeatableRecordEditor";
import { fetchReferences, createReference, updateReference as apiUpdate, deleteReference as apiDelete } from "../../../api/studentProfile";
import { REFERENCES_RULES } from "../../../config/profileRequirements";

function RefForm({ draft, onChange, errors }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">Full Name <span className="text-orange-500">*</span></label>
        <input value={draft.ref_name || ""} onChange={(e) => onChange({ ref_name: e.target.value })}
          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300
            ${errors?.ref_name ? "border-red-300" : "border-slate-200"}`}
          placeholder="Referee's full name" />
        {errors?.ref_name && <p className="mt-0.5 text-xs text-red-600">{errors.ref_name}</p>}
      </div>

      {[
        ["designation", "Designation", "Professor / Dr. etc."],
        ["institution", "Institution / University", "Current institution"],
      ].map(([k, label, placeholder]) => (
        <div key={k}>
          <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
          <input value={draft[k] || ""} onChange={(e) => onChange({ [k]: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
              focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder={placeholder} />
        </div>
      ))}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
        <input type="email" value={draft.email || ""} onChange={(e) => onChange({ email: e.target.value })}
          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300
            ${errors?.email ? "border-red-300" : "border-slate-200"}`}
          placeholder="referee@university.edu.pk" />
        {errors?.email && <p className="mt-0.5 text-xs text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
        <input value={draft.phone || ""} onChange={(e) => onChange({ phone: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="03XX-XXXXXXX" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
        <input value={draft.relationship || ""} onChange={(e) => onChange({ relationship: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="e.g. Thesis Supervisor" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">How long known</label>
        <input value={draft.known_duration || ""} onChange={(e) => onChange({ known_duration: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="e.g. 2 years" />
      </div>
    </div>
  );
}

function RefCard({ record, onEdit, onDelete }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{record.ref_name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {record.designation}{record.institution ? ` · ${record.institution}` : ""}
        </p>
        {record.email && <p className="text-xs text-slate-400 mt-0.5">{record.email}</p>}
        {record.relationship && <p className="text-xs text-slate-400">{record.relationship}{record.known_duration ? ` · Known ${record.known_duration}` : ""}</p>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onEdit   && <button type="button" onClick={onEdit}   className="text-xs text-orange-500 hover:text-orange-700">Edit</button>}
        {onDelete && <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>}
      </div>
    </div>
  );
}

export default function ReferencesSection({ targetLevel, onSaved, hidden, onEditChange }) {
  const [refs,      setRefs]      = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);

  useEffect(() => {
    if (hidden) return;
    fetchReferences().then(({ ok, data }) => { if (ok) setRefs(data); });
  }, [hidden]);

  const rule       = REFERENCES_RULES[targetLevel] || { min: 0, max: 3 };
  const isComplete = refs.length >= rule.min;

  const handleAdd = async (draft) => {
    const { ok, data } = await createReference(draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setRefs((p) => [...p, data]);
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
    onSaved?.();
  };

  const handleUpdate = async (id, draft) => {
    const { ok, data } = await apiUpdate(id, draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setRefs((p) => p.map((r) => r.id === id ? data : r));
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
  };

  const handleDelete = async (id) => {
    const { ok, data } = await apiDelete(id);
    if (!ok) { toast.error(data?.message || "Delete failed"); return; }
    setRefs((p) => p.filter((r) => r.id !== id));
    onSaved?.();
  };

  const helperText = rule.min > 0
    ? `${rule.min} referee${rule.min > 1 ? "s" : ""} required for ${targetLevel}. Up to ${rule.max} allowed.`
    : `Up to ${rule.max} referees (optional for ${targetLevel}).`;

  return (
    <SectionCard
      id="references"
      title="References"
      helperText={helperText}
      isComplete={isComplete}
      isEditing={isEditing}
      savedOk={savedOk}
      onEdit={() => setIsEditing(true)}
      onSave={() => { setIsEditing(false); }}
      onCancel={() => setIsEditing(false)}
      hidden={hidden}
      onEditChange={onEditChange}
    >
      {rule.min > 0 && refs.length < rule.min && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Add at least {rule.min} referee{rule.min > 1 ? "s" : ""} to complete this section.
        </div>
      )}

      <RepeatableRecordEditor
        records={refs}
        isEditing={isEditing}
        addLabel="Add referee"
        maxRecords={rule.max}
        renderCard={(rec, actions) => <RefCard record={rec} onEdit={actions.onEdit} onDelete={actions.onDelete} />}
        renderForm={(draft, onChange, errors) => <RefForm draft={draft} onChange={onChange} errors={errors} />}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        emptyState="No referees added yet."
      />
    </SectionCard>
  );
}
