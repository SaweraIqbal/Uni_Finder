/**
 * EntryTestSection â€” repeatable test score rows with expiry detection.
 */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SectionCard from "../SectionCard";
import RepeatableRecordEditor from "../RepeatableRecordEditor";
import UploadDropzone from "../UploadDropzone";
import StatusChip from "../StatusChip";
import DatePicker from "../DatePicker";
import {
  fetchTestScores,
  createTestScore,
  updateTestScore as apiUpdate,
  deleteTestScore as apiDelete,
} from "../../../api/studentProfile";
import { TEST_REQUIRED, TEST_TYPES, GAT_HELPER } from "../../../config/profileRequirements";

const Field = ({ label, error, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
  </div>
);

const TinyInput = ({ error, ...props }) => (
  <input
    {...props}
    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-800
      focus:outline-none focus:ring-2 focus:ring-orange-300
      ${error ? "border-red-300 bg-red-50" : "border-slate-200"}`}
  />
);

function TestForm({ draft, onChange, errors }) {
  const isOther = draft.test_type === "Other" || draft.test_type === "University-specific";
  const helper  = GAT_HELPER[draft.test_type];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Test Type" required error={errors?.test_type}>
        <select
          value={draft.test_type || ""}
          onChange={(e) => onChange({ test_type: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="">Select test</option>
          {TEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      {isOther && (
        <Field label="Test Name" required error={errors?.test_name}>
          <TinyInput value={draft.test_name || ""} error={errors?.test_name}
            onChange={(e) => onChange({ test_name: e.target.value })} placeholder="Enter test name" />
        </Field>
      )}

      <Field label="Score" error={errors?.score}>
        <TinyInput type="number" step="0.01" value={draft.score || ""}
          error={errors?.score}
          onChange={(e) => onChange({ score: e.target.value })} placeholder="e.g. 1200" />
      </Field>

      <Field label="Percentile (optional)">
        <TinyInput type="number" step="0.1" value={draft.percentile || ""}
          onChange={(e) => onChange({ percentile: e.target.value })} placeholder="e.g. 85.5" />
      </Field>

      <Field label="Test Date" error={errors?.test_date}>
        <DatePicker value={draft.test_date || ""}
          error={errors?.test_date}
          onChange={(iso) => onChange({ test_date: iso })} />
      </Field>

      <Field label="Validity / Expiry Date">
        <DatePicker value={draft.expiry_date || ""}
          onChange={(iso) => onChange({ expiry_date: iso })} />
      </Field>

      {helper && (
        <div className="sm:col-span-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
          â„¹ {helper}
        </div>
      )}

      <div className="sm:col-span-2">
        <UploadDropzone
          label="Score Card (optional)"
          docType="scorecard"
          currentUrl={draft.scorecard_url}
          onUploaded={(url) => onChange({ scorecard_url: url })}
          onDelete={() => onChange({ scorecard_url: "" })}
        />
      </div>
    </div>
  );
}

function TestCard({ record, onEdit, onDelete }) {
  const isExpired = record.expiry_date && new Date(record.expiry_date) < new Date();
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">
            {record.test_name || record.test_type}
          </span>
          {isExpired
            ? <StatusChip variant="expired" />
            : <StatusChip variant="uploaded" label="Valid" />}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Score: {record.score ?? "â€”"}
          {record.percentile ? ` Â· ${record.percentile}%ile` : ""}
          {record.test_date ? ` Â· ${new Date(record.test_date).toLocaleDateString("en-PK")}` : ""}
          {record.expiry_date ? ` Â· Expires ${new Date(record.expiry_date).toLocaleDateString("en-PK")}` : ""}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onEdit   && <button type="button" onClick={onEdit}   className="text-xs text-orange-500 hover:text-orange-700">Edit</button>}
        {onDelete && <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>}
      </div>
    </div>
  );
}

export default function EntryTestSection({ targetLevel, onSaved, onEditChange }) {
  const [scores,    setScores]    = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);

  useEffect(() => {
    fetchTestScores().then(({ ok, data }) => { if (ok) setScores(data); });
  }, []);

  const reqTest    = TEST_REQUIRED[targetLevel];
  // Complete only when:
  //   - there IS a required test type AND the student has it, OR
  //   - there is no required test type AND the student has added at least one score
  //   (never auto-complete on an empty list)
  const hasReqTest = reqTest
    ? scores.some((s) => s.test_type === reqTest)
    : scores.length > 0;
  const isComplete = hasReqTest;

  const isBSPathway = targetLevel === "BS";
  const helperText  = isBSPathway
    ? "Required for medical/engineering pathways (MDCAT/ECAT); recommended for all BS programs."
    : reqTest
      ? `${reqTest} is required for ${targetLevel}.`
      : "Entry test scores are optional for this level.";

  const handleAdd = async (draft) => {
    const { ok, data } = await createTestScore(draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setScores((p) => [...p, data]);
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
    onSaved?.();
  };

  const handleUpdate = async (id, draft) => {
    const { ok, data } = await apiUpdate(id, draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setScores((p) => p.map((r) => r.id === id ? data : r));
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
    onSaved?.();
  };

  const handleDelete = async (id) => {
    const { ok, data } = await apiDelete(id);
    if (!ok) { toast.error(data?.message || "Delete failed"); return; }
    setScores((p) => p.filter((r) => r.id !== id));
    onSaved?.();
  };

  return (
    <SectionCard
      id="tests"
      title="Entry Test & Exam Scores"
      helperText={helperText}
      isComplete={isComplete}
      isEditing={isEditing}
      savedOk={savedOk}
      onEdit={() => setIsEditing(true)}
      onSave={() => { setIsEditing(false); }}
      onCancel={() => setIsEditing(false)}
      onEditChange={onEditChange}
    >
      {reqTest && !hasReqTest && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <span className="font-medium">{reqTest}</span> is required for {targetLevel}.
        </div>
      )}

      <RepeatableRecordEditor
        records={scores}
        isEditing={isEditing}
        addLabel="Add test score"
        renderCard={(rec, actions) => <TestCard record={rec} onEdit={actions.onEdit} onDelete={actions.onDelete} />}
        renderForm={(draft, onChange, errors) => <TestForm draft={draft} onChange={onChange} errors={errors} />}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        emptyState="No test scores added yet."
      />
    </SectionCard>
  );
}

