/**
 * Page 2 — Campus Profile
 * HEC read-only university identity + editable campus details
 * Sections 5-8: Required Documents, Scholarships, Quota / Reservation Policy,
 *               Announcements & Key Dates  (all campus-wide)
 */
import { useMemo, useState } from "react";
import { Lock, MapPin, Calendar, Plus, Trash2, Info, GraduationCap, Bell } from "lucide-react";
import { toast } from "react-toastify";
import {
  Card, FormInput, FormSelect, FormTextarea,
  SaveButton, SectionTitle, StatusPill,
} from "../ui";
import { useCampusAdmin } from "../CampusAdminContext";
import { saveCampus } from "../../../api/campus";

/* ── Document presets ──────────────────────────────────────────────────────── */
const DOC_PRESETS = [
  "Matric Certificate",
  "Intermediate Result Card",
  "Bachelor's Transcript / Degree",
  "Master's Transcript / Degree",
  "GAT Score Card",
  "CNIC / B-Form",
  "Domicile Certificate",
  "Passport-size Photographs",
  "Character Certificate",
  "Medical Fitness Certificate",
  "HEC Equivalence Certificate",
  "Other (specify)",
];

const LEVEL_OPTIONS = [
  { value: "ADP",       label: "ADP" },
  { value: "UG",        label: "Undergraduate" },
  { value: "MS_MPhil",  label: "MS / MPhil" },
  { value: "PhD",       label: "PhD" },
];

const EMPTY_DOC_ROW = () => ({
  name:     DOC_PRESETS[0],
  custom:   "",
  levels:   [],      // array of level values, e.g. ["ADP","UG"]
  all:      false,   // true = "All Levels"
  note:     "",
});

/* ── Scholarship helpers ───────────────────────────────────────────────────── */
const EMPTY_SCHOLARSHIP = () => ({
  name:     "",
  type:     "Merit",
  coverage: "",
  criteria: "",
});

/* ── Announcement helpers ──────────────────────────────────────────────────── */
const EMPTY_ANNOUNCEMENT = () => ({ label: "", date: "" });

/* ── helpers ──────────────────────────────────────────────────────────────── */

function ReadOnlyField({ label, value, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-gray-50 min-h-[38px] flex items-center">
        {children || value}
      </div>
    </div>
  );
}

/** Orange-filled radio button matching the design system */
function RadioOption({ name, value, checked, onChange, label }) {
  return (
    <label className="relative flex items-center gap-2.5 cursor-pointer select-none group">
      <span
        className={`
          w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
          transition-colors
          ${checked
            ? "border-orange-500 bg-orange-500"
            : "border-gray-300 bg-white group-hover:border-orange-300"}
        `}
      >
        {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <input
        type="radio" name={name} value={value} checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

/**
 * Derive admission status for the preview pill.
 * Returns { type: 'open'|'closing'|'closed'|'not_set', daysLeft }
 */
function admissionStatus(openStr, closeStr) {
  if (!openStr || !closeStr) return { type: "not_set" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const open  = new Date(openStr);
  const close = new Date(closeStr);
  if (isNaN(open) || isNaN(close)) return { type: "not_set" };
  if (today > close) return { type: "closed" };
  const daysLeft = Math.ceil((close - today) / 86400000);
  if (today >= open) return { type: daysLeft <= 14 ? "closing" : "open", daysLeft };
  return { type: "not_set" };
}

function dateInputValue(value) {
  const date = value ? String(value).slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date !== "0000-00-00" ? date : "";
}

export default function CampusProfilePage() {
  const { campus, ownerUid, setIsDirty } = useCampusAdmin();

  const [form, setForm] = useState({
    name:              campus?.name              || "",
    campus_type:       campus?.campus_type       || "Main Campus",
    address:           campus?.address           || "",
    description:       campus?.description       || "",
    why_choose:        campus?.why_choose        || "",
    city:              campus?.city              || "",
    province:          campus?.province          || "Punjab",
    lat:               campus?.lat              != null ? String(campus.lat)  : "",
    lng:               campus?.lng              != null ? String(campus.lng)  : "",
    students:          campus?.students          || "",
    phone:             campus?.phone             || "",
    whatsapp:          campus?.whatsapp          || "",
    email:             campus?.email             || "",
    office_hours:      campus?.office_hours      || "",
    // Shifts
    shift_morning:     campus?.shift_morning === 1 || campus?.shift_morning === true,
    shift_evening:     campus?.shift_evening === 1 || campus?.shift_evening === true,
    shift_weekend:     campus?.shift_weekend === 1 || campus?.shift_weekend === true,
    // Gender / environment
    gender_policy:     campus?.gender_policy     || "co-education",
    class_arrangement: campus?.class_arrangement || "",
    // Admissions calendar
    intake_name:       campus?.intake_name       || "",
    admission_open:    dateInputValue(campus?.admission_open),
    admission_close:   dateInputValue(campus?.admission_close),
    classes_start:     dateInputValue(campus?.classes_start),
    admission_status_override: campus?.admission_status_override || "",
  });

  // Section 5 — Required Documents (campus-wide, degree-level matrix)
  const [reqDocs, setReqDocs] = useState(() => {
    try {
      const saved = campus?.required_documents;
      if (!saved) return [];
      return typeof saved === "string" ? JSON.parse(saved) : saved;
    } catch { return []; }
  });

  const addDocRow    = () => { setIsDirty(true); setReqDocs((r) => [...r, EMPTY_DOC_ROW()]); };
  const removeDocRow = (idx) => { setIsDirty(true); setReqDocs((r) => r.filter((_, i) => i !== idx)); };
  const updateDocRow = (idx, field, val) => {
    setIsDirty(true);
    setReqDocs((rows) =>
      rows.map((r, i) => {
        if (i !== idx) return r;
        if (field === "all") return { ...r, all: val, levels: val ? [] : r.levels };
        if (field === "level_toggle") {
          const next = r.levels.includes(val) ? r.levels.filter((l) => l !== val) : [...r.levels, val];
          return { ...r, levels: next, all: false };
        }
        return { ...r, [field]: val };
      })
    );
  };

  // Section 6 — Scholarships (campus-wide)
  const [scholarships, setScholarships] = useState(() => {
    try {
      const saved = campus?.scholarships;
      if (!saved) return [];
      return typeof saved === "string" ? JSON.parse(saved) : saved;
    } catch { return []; }
  });

  const addScholarship    = () => { setIsDirty(true); setScholarships((r) => [...r, EMPTY_SCHOLARSHIP()]); };
  const removeScholarship = (idx) => { setIsDirty(true); setScholarships((r) => r.filter((_, i) => i !== idx)); };
  const updateScholarship = (idx, field, val) => {
    setIsDirty(true);
    setScholarships((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };

  // Section 7 — Quota / Reservation Policy (campus-wide, free text)
  const [quotaPolicy, setQuotaPolicy] = useState(campus?.quota_policy || "");

  // Section 8 — Announcements & Key Dates (campus-wide)
  const [announcements, setAnnouncements] = useState(() => {
    try {
      const saved = campus?.announcements;
      if (!saved) return [];
      return typeof saved === "string" ? JSON.parse(saved) : saved;
    } catch { return []; }
  });

  const addAnnouncement    = () => { setIsDirty(true); setAnnouncements((r) => [...r, EMPTY_ANNOUNCEMENT()]); };
  const removeAnnouncement = (idx) => { setIsDirty(true); setAnnouncements((r) => r.filter((_, i) => i !== idx)); };
  const updateAnnouncement = (idx, field, val) => {
    setIsDirty(true);
    setAnnouncements((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };

  const [busy,  setBusy]  = useState(false);
  const [saved, setSaved] = useState(false);

  const change = (field) => (e) => {
    setIsDirty(true);
    setSaved(false);
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const toggleField = (field) => {
    setIsDirty(true);
    setSaved(false);
    setForm((f) => ({ ...f, [field]: !f[field] }));
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const { ok, data } = await saveCampus({
        campus_admin_uid: ownerUid,
        ...form,
        admission_open: form.admission_open || null,
        admission_close: form.admission_close || null,
        classes_start: form.classes_start || null,
        required_documents: JSON.stringify(reqDocs),
        scholarships:       JSON.stringify(scholarships),
        quota_policy:       quotaPolicy,
        announcements:      JSON.stringify(announcements),
      });
      if (ok) {
        setSaved(true);
        setIsDirty(false);
        toast.success("Changes saved");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(data?.message || "Save failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  /* admission status preview — override wins if set */
  const admStatus = useMemo(() => {
    const ov = form.admission_status_override;
    if (ov === "open")    return { type: "open",    daysLeft: null };
    if (ov === "closed")  return { type: "closed" };
    if (ov === "unknown") return { type: "not_set" };
    // no override — derive from dates
    return admissionStatus(form.admission_open, form.admission_close);
  }, [form.admission_open, form.admission_close, form.admission_status_override]);

  const isCoEd = form.gender_policy === "co-education";

  return (
    <div className="space-y-6">

      {/* ── Card 1: University Identity (read-only) ─────────────────────── */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <SectionTitle title="University Identity" />
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <Lock className="w-3 h-3" />
            Read-only · Sourced from University Admin
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReadOnlyField
            label="University Name"
            value={campus?.university_name || "—"}
          />
          <ReadOnlyField label="Sector" value={campus?.sector || "—"} />
          <ReadOnlyField label="HEC Recognition">
            <StatusPill variant="success" label="Recognized" />
          </ReadOnlyField>
          <ReadOnlyField
            label="ORIC Domain"
            value={campus?.oric_domain || "—"}
          />
          <ReadOnlyField
            label="HEC National Rank"
            value={campus?.hec_rank ? `#${campus.hec_rank}` : "—"}
          />
          <ReadOnlyField
            label="Campus Count"
            value={campus?.campus_count ?? "—"}
          />
        </div>
      </Card>

      {/* ── Campus story ───────────────────────────────────────────────── */}
      <Card>
        <SectionTitle title="About & Why Choose This Campus" />
        <FormTextarea
          label="About This Campus"
          value={form.description}
          onChange={change("description")}
          rows={4}
          placeholder="Share an accurate overview of this campus, its learning environment, and what students can expect."
        />
        <FormTextarea
          label="Why Choose This Campus"
          value={form.why_choose}
          onChange={change("why_choose")}
          rows={4}
          className="mt-4"
          placeholder="Describe the campus's distinct strengths, academic environment, and student opportunities."
        />
      </Card>

      {/* ── Card 2: Campus Details ───────────────────────────────────────── */}
      <Card>
        <SectionTitle number="1" title="Campus Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormInput
            label="Campus Name"
            value={form.name}
            onChange={change("name")}
            placeholder="e.g. Tarogil Main Campus"
            className="lg:col-span-2"
          />
          <FormSelect
            label="Campus Type"
            value={form.campus_type}
            onChange={change("campus_type")}
          >
            <option>Main Campus</option>
            <option>Sub Campus</option>
            <option>Regional Campus</option>
          </FormSelect>
          <FormInput
            label="Active Students"
            value={form.students}
            onChange={change("students")}
            placeholder="e.g. 2,500 students"
          />
        </div>

        <FormTextarea
          label="Full Address"
          value={form.address}
          onChange={change("address")}
          rows={2}
          className="mt-4"
          placeholder="Street, Area, City, Province"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <FormInput
            label="City"
            value={form.city}
            onChange={change("city")}
            placeholder="e.g. Lahore"
          />
          <FormSelect
            label="Province"
            value={form.province}
            onChange={change("province")}
          >
            {["Punjab","Sindh","KPK","Balochistan","Islamabad","AJK","GB"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </FormSelect>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-2">
            Map Coordinates
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <FormInput
              placeholder="Latitude"
              value={form.lat}
              onChange={change("lat")}
              className="w-36"
            />
            <FormInput
              placeholder="Longitude"
              value={form.lng}
              onChange={change("lng")}
              className="w-36"
            />
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <MapPin className="w-3.5 h-3.5" /> Pick on map
            </button>
          </div>
        </div>

      </Card>

      {/* ── Card 3 (section 2): Contact ──────────────────────────────────── */}
      <Card>
        <SectionTitle number="2" title="Contact Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Admissions Phone"
            value={form.phone}
            onChange={change("phone")}
            placeholder="+92 42 XXXX XXXX"
          />
          <FormInput
            label="WhatsApp"
            value={form.whatsapp}
            onChange={change("whatsapp")}
            placeholder="+92 3XX XXXXXXX"
          />
          <FormInput
            label="Email"
            value={form.email}
            onChange={change("email")}
            type="email"
            placeholder="admissions@campus.edu.pk"
          />
          <FormInput
            label="Office Hours"
            value={form.office_hours}
            onChange={change("office_hours")}
            placeholder="Mon–Fri, 9:00 AM – 4:00 PM"
          />
        </div>
      </Card>

      {/* ── Card 4 (section 3): Shifts & Environment ─────────────────────── */}
      <Card>
        <SectionTitle number="3" title="Shifts & Environment" />
        <div className="space-y-6">

          {/* Shifts checkboxes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Shifts Offered
            </label>
            <div className="flex flex-wrap gap-5">
              {[
                { key: "shift_morning", label: "Morning" },
                { key: "shift_evening", label: "Evening" },
                { key: "shift_weekend", label: "Weekend" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="relative flex items-center gap-2 cursor-pointer select-none"
                >
                  <span
                    className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                      transition-colors
                      ${form[key]
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300 bg-white"}
                    `}
                    onClick={() => toggleField(key)}
                  >
                    {form[key] && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={() => toggleField(key)}
                    className="sr-only"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender Policy — 3 radio options */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-3">
              Gender Policy
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { value: "co-education",  label: "Co-Education"  },
                { value: "women-only",    label: "Women Only"    },
                { value: "men-only",      label: "Men Only"      },
              ].map(({ value, label }) => (
                <RadioOption
                  key={value}
                  name="gender_policy"
                  value={value}
                  checked={form.gender_policy === value}
                  onChange={change("gender_policy")}
                  label={label}
                />
              ))}
            </div>

            {/* Conditional: Class Arrangement — only when Co-Education selected */}
            {isCoEd && (
              <div
                className="mt-4 pl-4 border-l-2 border-orange-100"
              >
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Class Arrangement
                </label>
                <select
                  value={form.class_arrangement}
                  onChange={change("class_arrangement")}
                  className="
                    w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2
                    text-sm text-slate-700 bg-white
                    focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500
                  "
                >
                  <option value="">Select arrangement (optional)</option>
                  <option value="mixed">Mixed Classes</option>
                  <option value="segregated">Segregated Sections</option>
                  <option value="timing">Timing-based Separation</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Mixed Classes · Segregated Sections · Timing-based Separation
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Card 5 (section 4): Admissions Calendar ───────────────────────── */}
      <Card>
        <SectionTitle number="4" title="Admissions Calendar" />
        <p className="text-xs text-slate-400 -mt-3 mb-5">
          Drives the Open / Closing Soon / Closed status shown to students.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Intake Name */}
          <FormInput
            label="Intake Name"
            value={form.intake_name}
            onChange={change("intake_name")}
            placeholder="e.g. Fall 2026"
            className="sm:col-span-2"
          />

          {/* Forms Open */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Forms Open
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.admission_open}
                onChange={change("admission_open")}
                className="
                  w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-sm
                  text-slate-700 bg-white
                  focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500
                "
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Forms Close */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Forms Close
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.admission_close}
                onChange={change("admission_close")}
                className="
                  w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-sm
                  text-slate-700 bg-white
                  focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500
                "
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Classes Start — optional */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Classes Start
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">optional</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.classes_start}
                onChange={change("classes_start")}
                className="
                  w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-sm
                  text-slate-400 bg-white
                  focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500
                "
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Manual override + status preview ── */}
        <div className="mt-5 space-y-3">
          {/* Override buttons */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Manual Override
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                Overrides the date-based status shown to students
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "open",
                  label: "Open",
                  active:   "bg-green-500 border-green-500 text-white",
                  inactive: "border-gray-200 text-slate-600 hover:border-green-400 hover:text-green-600",
                },
                {
                  value: "closed",
                  label: "Closed",
                  active:   "bg-red-500 border-red-500 text-white",
                  inactive: "border-gray-200 text-slate-600 hover:border-red-400 hover:text-red-600",
                },
                {
                  value: "unknown",
                  label: "Unknown",
                  active:   "bg-slate-500 border-slate-500 text-white",
                  inactive: "border-gray-200 text-slate-500 hover:border-slate-400",
                },
              ].map(({ value, label, active, inactive }) => {
                const isActive = form.admission_status_override === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setSaved(false);
                      // clicking the active button clears the override
                      setForm((f) => ({
                        ...f,
                        admission_status_override: isActive ? "" : value,
                      }));
                    }}
                    className={`
                      px-4 py-1.5 rounded-lg border text-sm font-medium
                      transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
                      ${isActive ? active : inactive}
                      ${isActive ? "focus:ring-orange-400" : "focus:ring-gray-300"}
                    `}
                  >
                    {label}
                    {isActive && (
                      <span className="ml-1.5 text-[10px] opacity-80">✓ active</span>
                    )}
                  </button>
                );
              })}

              {/* Clear override */}
              {form.admission_status_override && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDirty(true);
                    setSaved(false);
                    setForm((f) => ({ ...f, admission_status_override: "" }));
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear override
                </button>
              )}
            </div>
          </div>

          {/* Read-only status preview */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-xs text-slate-500 shrink-0">
              Status shown to students:
            </span>

            {admStatus.type === "open" && (
              <>
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Open
                </span>
                {admStatus.daysLeft != null && (
                  <span className="text-xs text-slate-400">
                    Closes in {admStatus.daysLeft} day{admStatus.daysLeft !== 1 ? "s" : ""}
                  </span>
                )}
                {form.admission_status_override === "open" && (
                  <span className="text-xs text-slate-400 italic">
                    (manually set)
                  </span>
                )}
              </>
            )}

            {admStatus.type === "closing" && (
              <>
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  Closing Soon
                </span>
                <span className="text-xs text-slate-400">
                  {admStatus.daysLeft} day{admStatus.daysLeft !== 1 ? "s" : ""} left
                </span>
              </>
            )}

            {admStatus.type === "closed" && (
              <>
                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  Closed
                </span>
                {form.admission_status_override === "closed" && (
                  <span className="text-xs text-slate-400 italic">
                    (manually set)
                  </span>
                )}
              </>
            )}

            {admStatus.type === "not_set" && (
              <span className="text-xs text-slate-400 italic">
                {form.admission_status_override === "unknown"
                  ? "Unknown (manually set)"
                  : "Set Forms Open & Close dates to preview status"}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── Card 6 (section 5): Required Documents ────────────────────────── */}
      <Card>
        <SectionTitle number="5" title="Required Documents" />
        <p className="text-xs text-slate-400 -mt-3 mb-5">
          Campus-wide admission documents. Specify which degree levels each document applies to.
        </p>

        <div className="space-y-3">
          {reqDocs.length === 0 && (
            <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-4 text-sm text-slate-400">
              <Info className="w-4 h-4 shrink-0" />
              No documents added yet. Click below to add the first requirement.
            </div>
          )}

          {reqDocs.map((doc, idx) => {
            const isOther = doc.name === "Other (specify)";
            return (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 space-y-3"
              >
                {/* Row 1: preset select + optional custom name + trash */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Document preset */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Document
                      </label>
                      <select
                        value={doc.name}
                        onChange={(e) => updateDocRow(idx, "name", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                      >
                        {DOC_PRESETS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom name — only shown when "Other" selected */}
                    {isOther && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Custom Document Name
                        </label>
                        <input
                          type="text"
                          value={doc.custom}
                          placeholder="e.g. HEC Equivalence Letter"
                          onChange={(e) => updateDocRow(idx, "custom", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                        />
                      </div>
                    )}

                    {/* Note */}
                    <div className={isOther ? "sm:col-span-2" : ""}>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Note <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={doc.note}
                        placeholder="e.g. provisional acceptable, 50+ required…"
                        onChange={(e) => updateDocRow(idx, "note", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Delete row */}
                  <button
                    type="button"
                    onClick={() => removeDocRow(idx)}
                    className="mt-6 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Row 2: Required For checkboxes */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-2">
                    Required For
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {/* All Levels toggle */}
                    <label className="relative flex items-center gap-2 cursor-pointer select-none">
                      <span
                        className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                          ${doc.all ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"}
                        `}
                        onClick={() => updateDocRow(idx, "all", !doc.all)}
                      >
                        {doc.all && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        checked={doc.all}
                        onChange={() => updateDocRow(idx, "all", !doc.all)}
                        className="sr-only"
                      />
                      <span className={`text-sm font-medium ${doc.all ? "text-orange-600" : "text-slate-600"}`}>
                        All Levels
                      </span>
                    </label>

                    <span className="text-slate-200 self-center">|</span>

                    {/* Individual level checkboxes */}
                    {LEVEL_OPTIONS.map(({ value, label }) => {
                      const checked = doc.all || doc.levels.includes(value);
                      return (
                        <label key={value} className="relative flex items-center gap-2 cursor-pointer select-none">
                          <span
                            className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                              ${checked
                                ? doc.all
                                  ? "border-orange-300 bg-orange-200"
                                  : "border-orange-500 bg-orange-500"
                                : "border-gray-300 bg-white"}
                            `}
                            onClick={() => !doc.all && updateDocRow(idx, "level_toggle", value)}
                          >
                            {checked && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={doc.all}
                            onChange={() => updateDocRow(idx, "level_toggle", value)}
                            className="sr-only"
                          />
                          <span className={`text-sm ${doc.all ? "text-slate-400" : "text-slate-600"}`}>
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add document row button */}
          <button
            type="button"
            onClick={addDocRow}
            className="w-full border-2 border-dashed border-orange-300 rounded-xl py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Document Requirement
          </button>
        </div>
      </Card>

      {/* ── Card 7 (section 6): Scholarships ─────────────────────────────── */}
      <Card>
        <SectionTitle number="6" title="Scholarships" />
        <p className="text-xs text-slate-400 -mt-3 mb-5">
          Campus-wide scholarship programmes available to admitted students.
        </p>

        <div className="space-y-3">
          {scholarships.length === 0 && (
            <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-4 text-sm text-slate-400">
              <GraduationCap className="w-4 h-4 shrink-0" />
              No scholarships added yet.
            </div>
          )}

          {scholarships.map((row, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={row.name}
                      placeholder="e.g. HEC Need-Based"
                      onChange={(e) => updateScholarship(idx, "name", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Type</label>
                    <select
                      value={row.type}
                      onChange={(e) => updateScholarship(idx, "type", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                    >
                      {["Merit","Need-based","Kinship","Sports","Minority","HEC","Other"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Coverage</label>
                    <input
                      type="text"
                      value={row.coverage}
                      placeholder="e.g. 100%, 50%, Full tuition"
                      onChange={(e) => updateScholarship(idx, "coverage", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Criteria</label>
                    <input
                      type="text"
                      value={row.criteria}
                      placeholder="e.g. 80%+ marks, income ≤ 45K"
                      onChange={(e) => updateScholarship(idx, "criteria", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeScholarship(idx)}
                  className="mt-5 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove scholarship"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addScholarship}
            className="w-full border-2 border-dashed border-orange-300 rounded-xl py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Scholarship
          </button>
        </div>
      </Card>

      {/* ── Card 8 (section 7): Quota / Reservation Policy ───────────────── */}
      <Card>
        <SectionTitle number="7" title="Quota / Reservation Policy" />
        <p className="text-xs text-slate-400 -mt-3 mb-4">
          Describe any reserved seats or quota allocations applicable campus-wide.
        </p>
        <textarea
          value={quotaPolicy}
          onChange={(e) => { setIsDirty(true); setQuotaPolicy(e.target.value); }}
          rows={4}
          placeholder={
            "e.g.\n" +
            "• 5% seats reserved for HEC Need-Based Scholarship nominees\n" +
            "• 2% reserved for disabled students (per HEC policy)\n" +
            "• 5% reserved for foreign / overseas Pakistani students"
          }
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500 placeholder:text-slate-300"
        />
        <p className="mt-2 text-[11px] text-slate-400">
          Plain text. Each bullet point is shown to students on the campus public page.
        </p>
      </Card>

      {/* ── Card 9 (section 8): Announcements & Key Dates ────────────────── */}
      <Card>
        <SectionTitle number="8" title="Announcements & Key Dates" />
        <p className="text-xs text-slate-400 -mt-3 mb-5">
          Campus-wide important dates shown to students as an admissions calendar.
        </p>

        <div className="space-y-3">
          {announcements.length === 0 && (
            <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-4 text-sm text-slate-400">
              <Bell className="w-4 h-4 shrink-0" />
              No dates added yet.
            </div>
          )}

          {announcements.map((row, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={row.label}
                    placeholder="e.g. Form Submission Deadline"
                    onChange={(e) => updateAnnouncement(idx, "label", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateAnnouncement(idx, "date", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAnnouncement(idx)}
                className="mt-4 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remove date"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addAnnouncement}
            className="w-full border-2 border-dashed border-orange-300 rounded-xl py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Date / Announcement
          </button>
        </div>
      </Card>

      {/* ── Save bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end pt-2 pb-6">
        <SaveButton onClick={handleSave} busy={busy} saved={saved} />
      </div>
    </div>
  );
}

export function CampusProfileActions() {
  return null;
}
