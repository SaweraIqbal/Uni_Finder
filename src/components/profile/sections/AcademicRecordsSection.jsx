/**
 * AcademicRecordsSection â€” repeatable academic record cards.
 * Required record types driven by ACADEMIC_REQUIRED_TYPES[targetLevel].
 */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SectionCard from "../SectionCard";
import RepeatableRecordEditor from "../RepeatableRecordEditor";
import UploadDropzone from "../UploadDropzone";
import StatusChip from "../StatusChip";
import DatePicker from "../DatePicker";
import {
  fetchAcademicRecords,
  createAcademicRecord,
  updateAcademicRecord as apiUpdateRecord,
  deleteAcademicRecord as apiDeleteRecord,
} from "../../../api/studentProfile";
import {
  ACADEMIC_REQUIRED_TYPES,
  ACADEMIC_LEVEL_LABELS,
  PHD_RECORD_EXTRA_FIELDS,
} from "../../../config/profileRequirements";

const LEVEL_OPTIONS = [
  "Matric", "Intermediate", "ADP", "Bachelor", "Master", "MS_MPhil", "PhD",
];

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

function RecordForm({ draft, onChange, errors, targetLevel }) {
  const needEquiv  = draft.is_olevel;
  const isAwaited  = draft.result_status === "Result awaited";
  const isPHDLevel = targetLevel === "PhD" && draft.level_type === "MS_MPhil";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Record Type" required error={errors?.level_type}>
        <select
          value={draft.level_type || ""}
          onChange={(e) => onChange({ level_type: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="">Select level</option>
          {LEVEL_OPTIONS.map((l) => (
            <option key={l} value={l}>{ACADEMIC_LEVEL_LABELS[l] || l}</option>
          ))}
        </select>
      </Field>

      <Field label="Institution" required error={errors?.institution}>
        <TinyInput value={draft.institution || ""} error={errors?.institution}
          onChange={(e) => onChange({ institution: e.target.value })} placeholder="School / University name" />
      </Field>

      <Field label="Board / University" error={errors?.board_university}>
        <TinyInput value={draft.board_university || ""} error={errors?.board_university}
          onChange={(e) => onChange({ board_university: e.target.value })} placeholder="BISE Lahore / UET etc." />
      </Field>

      <Field label="Degree / Program" error={errors?.degree_program}>
        <TinyInput value={draft.degree_program || ""} error={errors?.degree_program}
          onChange={(e) => onChange({ degree_program: e.target.value })} placeholder="SSC / BSc CS etc." />
      </Field>

      <Field label="Group / Discipline" error={errors?.group_discipline}>
        <TinyInput value={draft.group_discipline || ""} error={errors?.group_discipline}
          onChange={(e) => onChange({ group_discipline: e.target.value })} placeholder="Pre-Engineering / CS" />
      </Field>

      <Field label="Roll / Registration No." error={errors?.roll_reg_number}>
        <TinyInput value={draft.roll_reg_number || ""} error={errors?.roll_reg_number}
          onChange={(e) => onChange({ roll_reg_number: e.target.value })} />
      </Field>

      <Field label="Start Year" error={errors?.start_year}>
        <TinyInput type="number" min="1990" max="2030" value={draft.start_year || ""}
          error={errors?.start_year}
          onChange={(e) => onChange({ start_year: e.target.value })} placeholder="2018" />
      </Field>

      <Field label="End Year" error={errors?.end_year}>
        <TinyInput type="number" min="1990" max="2035" value={draft.end_year || ""}
          error={errors?.end_year}
          onChange={(e) => onChange({ end_year: e.target.value })} placeholder="2020" />
      </Field>

      <Field label="Result Status" required error={errors?.result_status}>
        <select
          value={draft.result_status || "Completed"}
          onChange={(e) => onChange({ result_status: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800
            focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="Completed">Completed</option>
          <option value="Result awaited">Result awaited</option>
          <option value="In progress">In progress</option>
        </select>
      </Field>

      {isAwaited && (
        <Field label="Expected Completion" error={errors?.expected_completion}>
          <DatePicker value={draft.expected_completion || ""}
            error={errors?.expected_completion}
            onChange={(iso) => onChange({ expected_completion: iso })} />
        </Field>
      )}

      {/* Score toggle */}
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">Score Type</label>
        <div className="flex gap-3">
          {["marks", "cgpa"].map((type) => (
            <label key={type} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input type="radio" checked={draft.score_type === type}
                onChange={() => onChange({ score_type: type })}
                className="accent-orange-500" />
              {type === "marks" ? "Marks" : "CGPA"}
            </label>
          ))}
        </div>
      </div>

      {draft.score_type === "marks" ? (
        <>
          <Field label="Marks Obtained" error={errors?.marks_obtained}>
            <TinyInput type="number" value={draft.marks_obtained || ""}
              onChange={(e) => onChange({ marks_obtained: e.target.value })}
              error={errors?.marks_obtained} placeholder="980" />
          </Field>
          <Field label="Total Marks" error={errors?.marks_total}>
            <TinyInput type="number" value={draft.marks_total || ""}
              onChange={(e) => onChange({ marks_total: e.target.value })}
              error={errors?.marks_total} placeholder="1100" />
          </Field>
        </>
      ) : (
        <>
          <Field label="CGPA" error={errors?.cgpa}>
            <TinyInput type="number" step="0.01" value={draft.cgpa || ""}
              onChange={(e) => onChange({ cgpa: e.target.value })}
              error={errors?.cgpa} placeholder="3.5" />
          </Field>
          <Field label="Scale (e.g. 4.0)" error={errors?.cgpa_scale}>
            <TinyInput type="number" step="0.01" value={draft.cgpa_scale || ""}
              onChange={(e) => onChange({ cgpa_scale: e.target.value })}
              error={errors?.cgpa_scale} placeholder="4.0" />
          </Field>
        </>
      )}

      <Field label="Division / Grade" error={errors?.division_grade}>
        <TinyInput value={draft.division_grade || ""}
          onChange={(e) => onChange({ division_grade: e.target.value })}
          error={errors?.division_grade} placeholder="A1 / 1st Division" />
      </Field>

      {["Bachelor", "Master", "MS_MPhil"].includes(draft.level_type) && (
        <Field label="Degree Duration (years)" error={errors?.degree_duration}>
          <TinyInput type="number" min="2" max="6" value={draft.degree_duration || ""}
            onChange={(e) => onChange({ degree_duration: e.target.value })}
            error={errors?.degree_duration} placeholder="4" />
        </Field>
      )}

      {/* O/A-Level flag */}
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={Boolean(draft.is_olevel)}
            onChange={(e) => onChange({ is_olevel: e.target.checked })}
            className="accent-orange-500" />
          This is an O-Level / A-Level or foreign degree (requires IBCC/HEC equivalence)
        </label>
      </div>

      {/* PhD: extra fields on MS/MPhil record */}
      {isPHDLevel && (
        <>
          <Field label="Thesis Title" required error={errors?.thesis_title}>
            <TinyInput value={draft.thesis_title || ""} error={errors?.thesis_title}
              onChange={(e) => onChange({ thesis_title: e.target.value })}
              placeholder="Your MS/MPhil thesis title" />
          </Field>
          <Field label="Supervisor Name" required error={errors?.supervisor}>
            <TinyInput value={draft.supervisor || ""} error={errors?.supervisor}
              onChange={(e) => onChange({ supervisor: e.target.value })}
              placeholder="Supervisor's full name" />
          </Field>
        </>
      )}

      {/* File uploads */}
      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
        <UploadDropzone
          label="Certificate / Transcript"
          docType="transcript"
          currentUrl={draft.certificate_url}
          onUploaded={(url) => onChange({ certificate_url: url })}
          onDelete={() => onChange({ certificate_url: "" })}
        />
        {needEquiv && (
          <UploadDropzone
            label="IBCC / HEC Equivalence"
            docType="equivalence"
            currentUrl={draft.equivalence_url}
            onUploaded={(url) => onChange({ equivalence_url: url })}
            onDelete={() => onChange({ equivalence_url: "" })}
            required
          />
        )}
      </div>
    </div>
  );
}

function RecordCard({ record, onEdit, onDelete }) {
  const isExpired = record.result_status === "Result awaited" || record.result_status === "In progress";
  const scoreDisplay = record.score_type === "cgpa"
    ? `CGPA ${record.cgpa ?? "â€”"}/${record.cgpa_scale ?? "4.0"}`
    : record.marks_obtained != null
      ? `${record.marks_obtained}/${record.marks_total ?? "?"}`
      : null;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">
            {ACADEMIC_LEVEL_LABELS[record.level_type] || record.level_type}
          </span>
          {isExpired
            ? <StatusChip variant="awaited" label={record.result_status} />
            : <StatusChip variant="complete" label="Completed" />}
          {record.is_olevel ? <StatusChip variant="incomplete" label="O/A-Level" /> : null}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {record.institution}
          {record.board_university ? ` Â· ${record.board_university}` : ""}
          {record.start_year ? ` Â· ${record.start_year}â€“${record.end_year || "present"}` : ""}
        </p>
        {scoreDisplay && (
          <p className="text-xs text-slate-600 mt-0.5">{scoreDisplay}</p>
        )}
        {record.thesis_title && (
          <p className="text-xs text-slate-500 mt-0.5 italic">Thesis: {record.thesis_title}</p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onEdit   && <button type="button" onClick={onEdit}   className="text-xs text-orange-500 hover:text-orange-700">Edit</button>}
        {onDelete && <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>}
      </div>
    </div>
  );
}

export default function AcademicRecordsSection({ targetLevel, onSaved, onEditChange }) {
  const [records,   setRecords]   = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);

  const load = async () => {
    const { ok, data } = await fetchAcademicRecords();
    if (ok) setRecords(data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (draft) => {
    const { ok, data } = await createAcademicRecord(draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setRecords((p) => [...p, data]);
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
    onSaved?.();
  };

  const handleUpdate = async (id, draft) => {
    const { ok, data } = await apiUpdateRecord(id, draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setRecords((p) => p.map((r) => r.id === id ? data : r));
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
    onSaved?.();
  };

  const handleDelete = async (id) => {
    const { ok, data } = await apiDeleteRecord(id);
    if (!ok) { toast.error(data?.message || "Delete failed"); return; }
    setRecords((p) => p.filter((r) => r.id !== id));
    onSaved?.();
  };

  const requiredTypes  = ACADEMIC_REQUIRED_TYPES[targetLevel] || [];
  const presentTypes   = records.map((r) => r.level_type);
  const missingTypes   = requiredTypes.filter((t) => !presentTypes.includes(t));
  const isComplete     = missingTypes.length === 0 && records.length > 0;

  return (
    <SectionCard
      id="academic"
      title="Academic Records"
      helperText="Add a record for each qualification. Required types are shown below."
      isComplete={isComplete}
      isEditing={isEditing}
      savedOk={savedOk}
      onEdit={() => setIsEditing(true)}
      onSave={() => { setIsEditing(false); setSavedOk(true); setTimeout(() => setSavedOk(false), 3000); }}
      onCancel={() => setIsEditing(false)}
      onEditChange={onEditChange}
    >
      {/* Missing-types banner */}
      {missingTypes.length > 0 && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <span className="font-medium">Required for {targetLevel}:</span>{" "}
          {missingTypes.map((t) => ACADEMIC_LEVEL_LABELS[t] || t).join(", ")}
        </div>
      )}

      <RepeatableRecordEditor
        records={records}
        isEditing={isEditing}
        addLabel="Add academic record"
        renderCard={(rec, actions) => (
          <RecordCard record={rec} onEdit={actions.onEdit} onDelete={actions.onDelete} />
        )}
        renderForm={(draft, onChange, errors) => (
          <RecordForm draft={draft} onChange={onChange} errors={errors} targetLevel={targetLevel} />
        )}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        emptyState="No academic records added yet."
      />
    </SectionCard>
  );
}

