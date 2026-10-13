/**
 * Page 4 — Program Offering Detail (full form, 6 sections)
 * Scholarships, Quota Note, Documents & Key Dates moved to campus-wide level.
 * Real API: getProgramDetail on mount, saveProgramDetail on save
 */
import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import {
  Card, PrimaryBtn, SecondaryBtn, SaveButton, SectionTitle,
  FormInput, FormSelect, FormTextarea, StatusPill, IconBtn, Toggle,
} from "../ui";
import { getCampusProgramDetail, saveCampusProgramDetail } from "../../../api/campus";

/* ─── Repeatable row wrapper ──────────────────────────────────────────────── */
function RepeatRow({ children, onRemove }) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-lg px-4 py-3">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {children}
      </div>
      <IconBtn danger title="Remove row" onClick={onRemove}>
        <Trash2 className="w-3.5 h-3.5" />
      </IconBtn>
    </div>
  );
}

function AddRowBtn({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-2 border-dashed border-orange-300 rounded-lg py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors font-medium flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}

/* ─── Default section data ────────────────────────────────────────────────── */
// All sections start empty — data is only populated from the saved API response.
const EMPTY_SHIFTS      = { morning: false, evening: false, weekend: false };
const EMPTY_ELIGIBILITY = [];
const EMPTY_MERIT       = [];
const EMPTY_FEES        = [];

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function ProgramDetailPage({ program, onBack }) {
  const [busy,    setBusy]    = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  // Section 1 — Offering Basics
  const [shifts,  setShifts]  = useState(EMPTY_SHIFTS);
  const [seats,   setSeats]   = useState("");
  const [duration, setDuration] = useState(program?.duration || "");
  const [contact, setContact] = useState("");

  // Section 2 — Eligibility
  const [eligibility, setEligibility] = useState(EMPTY_ELIGIBILITY);

  // Section 3 — Entry Test
  const [entryTest, setEntryTest] = useState("None");
  const [testBody,  setTestBody]  = useState("");
  const [testNote,  setTestNote]  = useState("");

  // Section 4 — Interview
  const [interviewOn,   setInterviewOn]   = useState(false);
  const [interviewNote, setInterviewNote] = useState("");

  // Section 5 — Merit
  const [merit, setMerit] = useState(EMPTY_MERIT);

  // Section 6 — Fee Structure
  const [fees, setFees] = useState(EMPTY_FEES);

  // ── Load from API on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!program?.id) { setLoading(false); return; }
    getCampusProgramDetail(program.id)
      .then(({ ok, data }) => {
        if (!ok || !data?.details) return; // leave everything empty for new programs
        const d = data.details;

        // Only overwrite if the field was actually saved (not undefined/null)
        if (d.shifts  !== undefined) setShifts(d.shifts);
        if (d.seats   !== undefined) setSeats(d.seats   ?? "");
        if (d.contact !== undefined) setContact(d.contact ?? "");
        if (data.duration !== undefined) setDuration(data.duration ?? "");
        if (Array.isArray(d.eligibility)) setEligibility(d.eligibility);
        if (d.entryTest  !== undefined) setEntryTest(d.entryTest  ?? "None");
        if (d.testBody   !== undefined) setTestBody(d.testBody    ?? "");
        if (d.testNote   !== undefined) setTestNote(d.testNote    ?? "");
        if (d.interviewOn   !== undefined) setInterviewOn(!!d.interviewOn);
        if (d.interviewNote !== undefined) setInterviewNote(d.interviewNote ?? "");
        if (Array.isArray(d.merit)) setMerit(d.merit);
        if (Array.isArray(d.fees))  setFees(d.fees);

        // Sync shifts toggle from the flat shifts string on the row if details.shifts missing
        if (d.shifts === undefined && data.shifts) {
          const s = data.shifts.split(",").map((x) => x.trim().toLowerCase());
          setShifts({
            morning: s.includes("morning"),
            evening: s.includes("evening"),
            weekend: s.includes("weekend"),
          });
        }
      })
      .catch(() => { /* leave empty — server unreachable */ })
      .finally(() => setLoading(false));
  }, [program?.id]);

  // ── Save to API ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!program?.id) return;
    setBusy(true);
    const activeShifts = Object.entries(shifts)
      .filter(([, v]) => v)
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
      .join(", ");

    const details = {
      shifts, seats, contact,
      eligibility, entryTest, testBody, testNote,
      interviewOn, interviewNote,
      merit, fees,
    };

    const { ok } = await saveCampusProgramDetail(program.id, {
      shifts: activeShifts,
      duration: duration.trim() || null,
      fee: fees[0]?.amount ? fees[0].amount.replace(/,/g, "") : null,
      details,
    });
    setBusy(false);
    if (ok) {
      setSaved(true);
      toast.success("Changes saved");
      setTimeout(() => setSaved(false), 3000);
    } else {
      toast.error("Save failed. Please try again.");
    }
  };

  /* helpers */
  const addRow    = (setter, template) => setter((rows) => [...rows, { ...template }]);
  const removeRow = (setter, idx)      => setter((rows) => rows.filter((_, i) => i !== idx));
  const updateRow = (setter, idx, field, val) =>
    setter((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium">
            <ChevronLeft className="w-4 h-4" /> Program Offerings
          </button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-32 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* breadcrumb + title */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Program Offerings
        </button>
        <span className="text-slate-400">/</span>
        <span className="text-sm text-slate-600">{program?.name || "Program Detail"}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{program?.name || "Program"} — Offering Details</h2>
        </div>
        <div className="flex items-center gap-3">
          <SaveButton onClick={handleSave} busy={busy} saved={saved} />
        </div>
      </div>

      {/* ── Section 1: Offering Basics ── */}
      <Card>
        <SectionTitle number="1" title="Offering Basics" />
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Shifts Offered</label>
            <div className="flex flex-wrap gap-4">
              {Object.entries(shifts).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={() => setShifts((s) => ({ ...s, [key]: !s[key] }))}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-sm text-slate-700 capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput label="Total Seats" value={seats} onChange={(e) => setSeats(e.target.value)} />
            <FormInput label="Degree Duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 4 Years" />
            <FormInput label="Program Contact Email" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* ── Section 2: Eligibility ── */}
      <Card>
        <SectionTitle number="2" title="Eligibility Criteria" />
        <div className="space-y-2">
          {eligibility.map((row, i) => (
            <RepeatRow key={i} onRemove={() => removeRow(setEligibility, i)}>
              <FormSelect label="Qualification" value={row.qualification} onChange={(e) => updateRow(setEligibility, i, "qualification", e.target.value)}>
                {["Pre-Engineering","Pre-Medical","ICS","FA/FSc","A-Level","DAE (relevant field)","Other"].map((o) => <option key={o}>{o}</option>)}
              </FormSelect>
              <FormInput label="Min %" value={row.minPct} onChange={(e) => updateRow(setEligibility, i, "minPct", e.target.value)} />
              <FormInput label="Required Subjects" value={row.subjects} onChange={(e) => updateRow(setEligibility, i, "subjects", e.target.value)} />
              <FormInput label="Note" value={row.note} onChange={(e) => updateRow(setEligibility, i, "note", e.target.value)} />
            </RepeatRow>
          ))}
          <AddRowBtn label="Add Qualification Row" onClick={() => addRow(setEligibility, { qualification:"Other", minPct:"50", subjects:"", note:"" })} />
        </div>
      </Card>

      {/* ── Section 3: Entry Test ── */}
      <Card>
        <SectionTitle number="3" title="Entry Test" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect label="Test Type" value={entryTest} onChange={(e) => setEntryTest(e.target.value)}>
            {["None","ECAT","MDCAT","NTS-NAT","University's Own Test","Other"].map((o) => <option key={o}>{o}</option>)}
          </FormSelect>
          <FormInput label="Conducting Body" value={testBody} onChange={(e) => setTestBody(e.target.value)} />
          <FormTextarea label="Note" value={testNote} onChange={(e) => setTestNote(e.target.value)} rows={2} className="sm:col-span-2" />
        </div>
      </Card>

      {/* ── Section 4: Interview ── */}
      <Card>
        <SectionTitle number="4" title="Interview" />
        <div className="flex items-center gap-4 flex-wrap">
          <Toggle checked={interviewOn} onChange={setInterviewOn} label="Interview Required" />
          {interviewOn && (
            <FormInput
              placeholder="Interview note or details…"
              value={interviewNote}
              onChange={(e) => setInterviewNote(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
          )}
        </div>
      </Card>

      {/* ── Section 5: Merit Formula ── */}
      <Card>
        <SectionTitle number="5" title="Merit Formula" />
        <div className="space-y-2">
          {merit.map((row, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
              <FormInput
                placeholder="Component"
                value={row.component}
                onChange={(e) => updateRow(setMerit, i, "component", e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2 w-28">
                <FormInput
                  placeholder="%"
                  value={row.weight}
                  onChange={(e) => updateRow(setMerit, i, "weight", e.target.value)}
                />
                <span className="text-sm text-slate-500 shrink-0">%</span>
              </div>
              <IconBtn danger onClick={() => removeRow(setMerit, i)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
            </div>
          ))}
          <AddRowBtn label="Add Component" onClick={() => addRow(setMerit, { component:"", weight:"" })} />
        </div>
        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Shown to students exactly as published. No calculation on platform.
          </p>
        </div>
      </Card>

      {/* ── Section 6: Fee Structure ── */}
      <Card>
        <SectionTitle number="6" title="Fee Structure" />
        <div className="space-y-2">
          {fees.map((row, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormInput placeholder="Fee Head" value={row.head} onChange={(e) => updateRow(setFees, i, "head", e.target.value)} />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 shrink-0">Rs.</span>
                  <FormInput placeholder="Amount" value={row.amount} onChange={(e) => updateRow(setFees, i, "amount", e.target.value)} />
                </div>
                <FormSelect value={row.frequency} onChange={(e) => updateRow(setFees, i, "frequency", e.target.value)}>
                  {["One-time","Per Semester","Annual","Per Month"].map((o) => <option key={o}>{o}</option>)}
                </FormSelect>
              </div>
              <IconBtn danger onClick={() => removeRow(setFees, i)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
            </div>
          ))}
          <AddRowBtn label="Add Fee Head" onClick={() => addRow(setFees, { head:"", amount:"", frequency:"Per Semester" })} />
        </div>
      </Card>

      {/* sticky bottom bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-8 px-8 py-3 flex items-center justify-end z-10">
        <SaveButton onClick={handleSave} busy={busy} saved={saved} />
      </div>
    </div>
  );
}
