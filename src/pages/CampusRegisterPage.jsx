/**
 * CampusRegisterPage.jsx  —  /campus/register
 *
 * Sections A–E: campus affiliation, identity, verification, optional hostel, declaration.
 * Map picker removed. Phone accepts 03XXXXXXXXX or +923XXXXXXXXX.
 * Universities fetched live from GET /api/universities/approved.
 * Submit → POST /api/campus-registrations (FormData + optional PDF).
 * Resubmit → POST /api/campus-registrations/:id/resubmit.
 * Server 400 field errors mapped directly onto form fields.
 * Server 409 duplicate shown under University select.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate }  from "react-router-dom";
import { ChevronDown, Search, X, AlertTriangle, FileText, UploadCloud, CheckCircle2 } from "lucide-react";
import { toast }        from "react-toastify";

import CampusRegShell              from "../components/campusReg/CampusRegShell";
import UploadTile                  from "../components/campusReg/UploadTile";
import { useCampusRegistration }   from "../context/CampusRegistrationContext";
import { API, authHeaders }        from "../api/client";
import { CAMPUS_TYPES, PROVINCES, DESIGNATIONS } from "../constants/campusRegistration";

/* ─── constants ───────────────────────────────────────────────────────────── */
// client-side phone regex mirrors the server's normalisePhone()
const PHONE_RE_LOCAL = /^03\d{9}$/;
const PHONE_RE_INTL  = /^\+923\d{9}$/;
const EMAIL_RE       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhone(raw) {
  const s = (raw || "").replace(/[\s\-()]/g, "");
  return PHONE_RE_LOCAL.test(s) || PHONE_RE_INTL.test(s);
}
function phonePreview(raw) {
  const s = (raw || "").replace(/[\s\-()]/g, "");
  if (PHONE_RE_LOCAL.test(s)) return `+92${s.slice(1)}`;
  if (PHONE_RE_INTL.test(s))  return s;
  return null;
}

/* ─── tiny shared primitives ─────────────────────────────────────────────── */
function Label({ children, required }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}
function FieldErr({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
      {msg}
    </p>
  );
}
const inputCls = (err) =>
  `w-full border rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 bg-white
   transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300
   ${err ? "border-red-400" : "border-gray-200 focus:border-orange-500"}`;
const selectCls = (err) =>
  `w-full border rounded-lg px-3 py-2 text-sm text-slate-700 bg-white
   transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300
   ${err ? "border-red-400" : "border-gray-200 focus:border-orange-500"}`;

/* ─── Section card ────────────────────────────────────────────────────────── */
function Section({ letter, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {letter}
        </span>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ─── Searchable university select ──────────────────────────────────────────
 * Fetches GET /api/universities/approved on first open.
 * Shows skeleton rows while loading; inline error with Retry on failure;
 * info message when list is empty.
 */
function UniversitySelect({ value, onChange, error }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [unis, setUnis]       = useState(null);  // null = not fetched yet
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  const load = useCallback(async () => {
    setFetching(true);
    setFetchErr(null);
    try {
      const res = await fetch(`${API}/api/universities/approved`);
      if (!res.ok) throw new Error("Could not load universities.");
      const data = await res.json();
      setUnis(Array.isArray(data) ? data : []);
    } catch (e) {
      setFetchErr(e.message);
    } finally {
      setFetching(false);
    }
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (unis === null && !fetching) load();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // close on outside click
  useEffect(() => {
    const h = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = (unis || []).find((u) => u.id === value);
  const filtered = (unis || []).filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      (u.city || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm bg-white
          transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300
          ${error ? "border-red-400" : "border-gray-200 hover:border-orange-400"}`}
      >
        {selected
          ? <span className="text-slate-700 text-left truncate">{selected.name}</span>
          : <span className="text-slate-400">Select a university…</span>}
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* search box */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search universities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm outline-none placeholder-slate-400 text-slate-700"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* list body */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {fetching && (
              // skeleton rows while loading
              [1, 2, 3].map((n) => (
                <li key={n} className="px-4 py-3 flex flex-col gap-1.5 animate-pulse">
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                </li>
              ))
            )}

            {fetchErr && (
              <li className="px-4 py-3 text-sm text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {fetchErr}
                <button
                  type="button"
                  onClick={load}
                  className="ml-auto text-xs text-orange-600 hover:underline font-medium"
                >
                  Retry
                </button>
              </li>
            )}

            {!fetching && !fetchErr && unis !== null && unis.length === 0 && (
              <li className="px-4 py-4 text-sm text-slate-400 text-center">
                No approved universities available yet. Please check back later.
              </li>
            )}

            {!fetching && !fetchErr && filtered.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => { onChange(u.id, u.name); setOpen(false); setQuery(""); }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors
                    ${u.id === value ? "bg-orange-50" : ""}`}
                >
                  <p className="text-sm font-medium text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {u.sector} · {u.city}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="px-4 py-2.5 border-t border-gray-100">
            <p className="text-xs text-slate-400">
              Only approved universities are listed. University not listed? It must
              register on UniFinder first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Optional campus-hostel verification documents ──────────────────────── */
const HOSTEL_DOCUMENTS = [
  { key: "cnic", title: "Owner CNIC" },
  { key: "ownership", title: "Proof of Ownership or Lease" },
  { key: "utility", title: "Recent Utility Bill" },
];
const HOSTEL_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_HOSTEL_FILE_SIZE = 10 * 1024 * 1024;

function HostelDocumentCard({ title, file, onChange, error }) {
  const inputRef = useRef(null);
  const chooseFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!HOSTEL_FILE_TYPES.includes(selected.type)) {
      toast.error("Only PDF, JPG and PNG documents are allowed.");
      event.target.value = "";
      return;
    }
    if (selected.size > MAX_HOSTEL_FILE_SIZE) {
      toast.error("Document must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }
    onChange(selected);
  };

  return (
    <div className={`rounded-2xl border border-dashed p-4 bg-slate-50/70 ${error ? "border-red-400" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="rounded-xl bg-white shadow-sm p-2.5">
          <FileText className="w-5 h-5 text-orange-500" />
        </div>
        <span className={`text-xs rounded-full px-2.5 py-1 ${file ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {file ? "Selected" : "Not Uploaded"}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1">PDF, JPG or PNG · Max 10 MB</p>
      {file && <p className="mt-2 text-xs text-green-700 truncate" title={file.name}>{file.name}</p>}
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={chooseFile} />
      <button type="button" onClick={() => inputRef.current?.click()}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200">
        {file ? "Change file" : "Choose file"}
      </button>
      {file && (
        <button type="button" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
          className="mt-2 text-xs text-red-500 hover:underline">Remove</button>
      )}
      <FieldErr msg={error} />
    </div>
  );
}

/* ─── build initial form from a prefill record (resubmission) ─────────────── */
function buildForm(prefill) {
  return {
    universityId:   prefill?.universityId   || "",
    campusType:     prefill?.campusType     || "",
    officialName:   prefill?.officialName   || "",
    province:       prefill?.province       || "Punjab",
    city:           prefill?.city           || "",
    address:        prefill?.address        || "",
    registrantName: prefill?.registrantName || "",
    designation:    prefill?.designation    || "",
    phone:          prefill?.phone          || "",
    officialEmail:  prefill?.officialEmail  || "",
    document:       prefill?.document       || null,   // { name, size } | null
    hasHostel:      prefill?.hasHostel === true ? "yes" : "no",
    hostelName:     prefill?.hostelName || "",
    hostelGender:   prefill?.hostelGender || "boys",
    hostelAddress:  prefill?.hostelAddress || "",
    hostelPhone:    prefill?.hostelPhone || "",
    hostelGps:      prefill?.hostelGps || "",
    hostelDocuments: { cnic: null, ownership: null, utility: null },
    declaration:    false,
  };
}

/* ─── client-side validate ────────────────────────────────────────────────── */
function validate(f) {
  const e = {};
  if (!f.universityId)                   e.universityId   = "Please select a university.";
  if (!f.campusType)                     e.campusType     = "Please select a campus type.";
  if (!f.officialName.trim())            e.officialName   = "Campus name is required.";
  if (f.officialName.trim().length < 3)  e.officialName   = "Must be at least 3 characters.";
  if (!f.province)                       e.province       = "Please select a province.";
  if (!f.city.trim())                    e.city           = "City is required.";
  if (!f.registrantName.trim())          e.registrantName = "Full name is required.";
  if (f.registrantName.trim().length < 3) e.registrantName = "Must be at least 3 characters.";
  if (!f.designation)                    e.designation    = "Please select a designation.";
  if (!f.phone.trim())                   e.phone          = "Contact number is required.";
  else if (!isValidPhone(f.phone))       e.phone          = "Enter a valid number: 03XXXXXXXXX or +92 3XX XXXXXXX";
  if (f.officialEmail.trim() && !EMAIL_RE.test(f.officialEmail.trim()))
                                         e.officialEmail  = "Enter a valid email address.";
  if (f.hasHostel === "yes") {
    if (!f.hostelName.trim()) e.hostelName = "Hostel name is required.";
    if (!f.hostelAddress.trim()) e.hostelAddress = "Hostel address is required.";
    if (!isValidPhone(f.hostelPhone)) e.hostelPhone = "Enter a valid contact number.";
    const coords = f.hostelGps.split(",").map((part) => Number(part.trim()));
    if (coords.length !== 2 || !coords.every(Number.isFinite) ||
        coords[0] < -90 || coords[0] > 90 || coords[1] < -180 || coords[1] > 180 ||
        !f.hostelGps.trim()) {
      e.hostelGps = "Enter valid GPS coordinates: latitude, longitude.";
    }
    for (const doc of HOSTEL_DOCUMENTS) {
      if (!f.hostelDocuments[doc.key]) e[`hostelDoc_${doc.key}`] = `${doc.title} is required.`;
    }
  }
  if (!f.declaration)                    e.declaration    = "You must confirm the declaration.";
  return e;
}

const FIELD_ORDER = [
  "universityId","campusType","officialName","province","city",
  "registrantName","designation","phone","officialEmail",
  "hostelName","hostelAddress","hostelPhone","hostelGps",
  "hostelDoc_cnic","hostelDoc_ownership","hostelDoc_utility","declaration",
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function CampusRegisterPage() {
  const navigate = useNavigate();
  const { registration, status, refresh, STATUSES } = useCampusRegistration();

  const isResubmission =
    status === STATUSES.REJECTED || status === STATUSES.RESUBMISSION_REQUESTED;

  const [form,       setForm]       = useState(() => buildForm(isResubmission ? registration : null));
  const [errors,     setErrors]     = useState({});
  const [touched,    setTouched]    = useState({});
  const [dupError,   setDupError]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fieldRefs = useRef({});
  const reg       = (name) => (el) => { if (el) fieldRefs.current[name] = el; };

  // When context loads and it's a resubmission, prefill from the record
  useEffect(() => {
    if (isResubmission && registration) {
      setForm(buildForm(registration));
    }
  }, [isResubmission]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    if (field === "universityId" || field === "city") setDupError("");
  };
  const setHostelDoc = (key, file) => {
    setForm((f) => ({ ...f, hostelDocuments: { ...f.hostelDocuments, [key]: file } }));
    setErrors((old) => { const next = { ...old }; delete next[`hostelDoc_${key}`]; return next; });
  };
  const setE  = (field) => (e) => set(field)(e.target.value);
  const blur  = (field) => () => {
    if (!touched[field]) return;
    const errs = validate(form);
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  // ── normalised phone preview ─────────────────────────────────────────────
  const preview = isValidPhone(form.phone) ? phonePreview(form.phone) : null;

  // ── selected university name (for declaration text) ──────────────────────
  // We store the name separately once chosen so it survives dropdown close
  const [selectedUniName, setSelectedUniName] = useState(registration?.universityName || "");
  const handleUniChange = (id) => {
    set("universityId")(id);
    // name is fetched async inside UniversitySelect; read from the dropdown state
    // by listening to a shared list isn't worth the coupling — the declaration
    // text will show the stored name once the user picks.
    // We'll update it from the universities list in the submit payload instead.
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched(FIELD_ORDER.reduce((a, k) => { a[k] = true; return a; }, {}));

    if (Object.keys(errs).length) {
      for (const key of FIELD_ORDER) {
        if (errs[key] && fieldRefs.current[key]) {
          fieldRefs.current[key].scrollIntoView({ behavior: "smooth", block: "center" });
          fieldRefs.current[key].focus?.();
          break;
        }
      }
      return;
    }

    // The current campus API does not support hostel data or documents yet.
    // Do not submit only the campus portion and falsely report hostel verification.
  

    setSubmitting(true);
    setDupError("");

    try {
      // Build FormData — supports optional PDF document
      const fd = new FormData();
      fd.append("universityId",    form.universityId);
      fd.append("campusType",      form.campusType);
      fd.append("officialName",    form.officialName.trim());
      fd.append("province",        form.province);
      fd.append("city",            form.city.trim());
      fd.append("address",         form.address.trim());
      fd.append("registrantName",  form.registrantName.trim());
      fd.append("designation",     form.designation);
      fd.append("phone",           form.phone.trim());
      fd.append("officialEmail",   form.officialEmail.trim());
      fd.append("declarationAccepted", "true");
      if (form.document?._file) {
        // UploadTile stores the raw File on _file when a real file is chosen
        fd.append("document", form.document._file);
      }
      
// Optional campus hostel information
fd.append("hasHostel", form.hasHostel);

if (form.hasHostel === "yes") {
  fd.append("hostelName", form.hostelName.trim());
  fd.append("hostelGender", form.hostelGender);
  fd.append("hostelAddress", form.hostelAddress.trim());
  fd.append("hostelPhone", form.hostelPhone.trim());
  fd.append("hostelGps", form.hostelGps.trim());

  // Hostel verification documents
  const hostelDocs = {
    cnic: "hostelDoc_cnic",
    ownership: "hostelDoc_ownership",
    utility: "hostelDoc_utility",
  };

  for (const [key, fieldName] of Object.entries(hostelDocs)) {
    const file = form.hostelDocuments[key];

    if (file) {
      fd.append(fieldName, file);
    }
  }
}


      const isResub  = isResubmission && registration?.id;
      const endpoint = isResub
        ? `${API}/api/campus-registrations/${registration.id}/resubmit`
        : `${API}/api/campus-registrations`;

      const res = await fetch(endpoint, {
        method:  "POST",
        headers: authHeaders(),   // Authorization header only; no Content-Type (let browser set boundary)
        body:    fd,
      });

      const body = await res.json().catch(() => ({}));

      if (res.status === 400) {
        // Map server field errors onto the form
        const serverErrors = body.errors || {};
        setErrors(serverErrors);
        const firstKey = FIELD_ORDER.find((k) => serverErrors[k]);
        if (firstKey && fieldRefs.current[firstKey]) {
          fieldRefs.current[firstKey].scrollIntoView({ behavior: "smooth", block: "center" });
          fieldRefs.current[firstKey].focus?.();
        }
        return;
      }

      if (res.status === 409) {
        setDupError(body.message || "A registration for this university in this city already exists.");
        fieldRefs.current.universityId?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (!res.ok) {
        toast.error(body.message || "Something went wrong. Try again.");
        return;
      }

      // Success
      toast.success(isResub ? "Request resubmitted successfully." : "Request submitted successfully.");
      await refresh();                              // reload /mine → triggers auto-route to status page
      navigate("/campus/registration-status");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── resubmission required docs ───────────────────────────────────────────
  const requiredDocs = registration?.resubmission?.requiredDocs || [];

  return (
    <CampusRegShell>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* Resubmission banner */}
        {isResubmission && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {status === STATUSES.RESUBMISSION_REQUESTED
                  ? "Resubmission requested by University Admin — please provide:"
                  : "Your request was rejected. Correct the issues below and resubmit."}
              </p>
              {requiredDocs.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {requiredDocs.map((d) => (
                    <li key={d} className="text-sm text-amber-700 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Title card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-800">
            {isResubmission ? "Update & Resubmit Campus Request" : "Register a Campus"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose the university and your campus details. The request goes to that
            university's admin for approval.
          </p>
        </div>

        {/* ── Section A: Campus Affiliation ──────────────────────────────── */}
        <Section letter="A" title="Campus Affiliation">
          <div ref={reg("universityId")}>
            <Label required>University</Label>
            <UniversitySelect
              value={form.universityId}
              onChange={(id, name) => { set("universityId")(id); setSelectedUniName(name); setDupError(""); }}
              error={!!(errors.universityId && touched.universityId)}
            />
            {dupError
              ? <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{dupError}
                </p>
              : <FieldErr msg={touched.universityId ? errors.universityId : ""} />}
          </div>

          <div ref={reg("campusType")}>
            <Label required>Campus Type</Label>
            <select
              value={form.campusType}
              onChange={setE("campusType")}
              onBlur={blur("campusType")}
              className={selectCls(touched.campusType && errors.campusType)}
            >
              <option value="">Select campus type…</option>
              {CAMPUS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {touched.campusType && <FieldErr msg={errors.campusType} />}
          </div>
        </Section>

        {/* ── Section B: Campus Identity & Location ───────────────────────── */}
        <Section letter="B" title="Campus Identity & Location">
          <div ref={reg("officialName")}>
            <Label required>Official Campus Name</Label>
            <input
              type="text"
              value={form.officialName}
              onChange={setE("officialName")}
              onBlur={blur("officialName")}
              placeholder="As per HEC records"
              className={inputCls(touched.officialName && errors.officialName)}
            />
            <p className="mt-1 text-xs text-slate-400">Must match the HEC recognized campuses list.</p>
            {touched.officialName && <FieldErr msg={errors.officialName} />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div ref={reg("province")}>
              <Label required>Province</Label>
              <select
                value={form.province}
                onChange={setE("province")}
                onBlur={blur("province")}
                className={selectCls(touched.province && errors.province)}
              >
                <option value="">Select province…</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
              {touched.province && <FieldErr msg={errors.province} />}
            </div>
            <div ref={reg("city")}>
              <Label required>City</Label>
              <input
                type="text"
                value={form.city}
                onChange={setE("city")}
                onBlur={blur("city")}
                placeholder="e.g. Lahore"
                className={inputCls(touched.city && errors.city)}
              />
              {touched.city && <FieldErr msg={errors.city} />}
            </div>
          </div>

          <div>
            <Label>Full Address</Label>
            <textarea
              value={form.address}
              onChange={setE("address")}
              rows={2}
              placeholder="Street, area, city, province"
              className={`${inputCls(false)} resize-y`}
            />
          </div>
        </Section>

        {/* ── Section C: Verification Details ─────────────────────────────── */}
        <Section letter="C" title="Verification Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div ref={reg("registrantName")}>
              <Label required>Registrant Full Name</Label>
              <input
                type="text"
                value={form.registrantName}
                onChange={setE("registrantName")}
                onBlur={blur("registrantName")}
                placeholder="Your full name"
                className={inputCls(touched.registrantName && errors.registrantName)}
              />
              {touched.registrantName && <FieldErr msg={errors.registrantName} />}
            </div>
            <div ref={reg("designation")}>
              <Label required>Designation</Label>
              <select
                value={form.designation}
                onChange={setE("designation")}
                onBlur={blur("designation")}
                className={selectCls(touched.designation && errors.designation)}
              >
                <option value="">Select designation…</option>
                {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
              {touched.designation && <FieldErr msg={errors.designation} />}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div ref={reg("phone")}>
              <Label required>Contact Number</Label>
              <input
                type="tel"
                value={form.phone}
                onChange={setE("phone")}
                onBlur={blur("phone")}
                placeholder="+92 3XX XXXXXXX"
                className={inputCls(touched.phone && errors.phone)}
              />
              <p className="mt-1 text-xs text-slate-400">+92 3XX XXXXXXX</p>
              {touched.phone && errors.phone
                ? <FieldErr msg={errors.phone} />
                : touched.phone && preview && (
                    <p className="mt-1 text-xs text-green-600">Will be saved as {preview}</p>
                  )}
            </div>
            <div ref={reg("officialEmail")}>
              <Label>Official Email <span className="text-slate-400 font-normal">(optional)</span></Label>
              <input
                type="email"
                value={form.officialEmail}
                onChange={setE("officialEmail")}
                onBlur={blur("officialEmail")}
                placeholder="campus@university.edu.pk"
                className={inputCls(touched.officialEmail && errors.officialEmail)}
              />
              {touched.officialEmail && <FieldErr msg={errors.officialEmail} />}
            </div>
          </div>

          <div>
            <Label>
              Supporting Document{" "}
              <span className="text-slate-400 font-normal">
                {isResubmission ? "" : "(optional)"}
              </span>
            </Label>
            {/* files stored on server disk via /uploads — swap to cloud storage in production */}
            <UploadTile
              label="HEC Campus Recognition Letter OR University Authorization / NOC"
              hint="PDF only · max 10 MB · Optional, but speeds up verification"
              file={form.document}
              onChange={set("document")}
              highlight={status === STATUSES.RESUBMISSION_REQUESTED}
            />
          </div>
        </Section>

        {/* ── Section D: Optional Campus Hostel ──────────────────────────── */}
        <Section letter="D" title="Campus Hostel Information (Optional)">
          <div>
            <Label>Does this campus provide hostel accommodation?</Label>
            <div className="flex flex-wrap gap-5 mt-2">
              {[
                { value: "yes", label: "Yes, hostel available" },
                { value: "no", label: "No hostel" },
              ].map((option) => (
                <label key={option.value} className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="radio" name="hasHostel" value={option.value}
                    checked={form.hasHostel === option.value}
                    onChange={() => set("hasHostel")(option.value)}
                    className="accent-orange-500" />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {form.hasHostel === "yes" ? (
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div ref={reg("hostelName")}>
                <Label required>Official Hostel Name</Label>
                <input value={form.hostelName} onChange={setE("hostelName")}
                  onBlur={blur("hostelName")} placeholder="e.g. Main Campus Boys Hostel"
                  className={inputCls(touched.hostelName && errors.hostelName)} />
                {touched.hostelName && <FieldErr msg={errors.hostelName} />}
              </div>
              <div>
                <Label required>Hostel Gender Type</Label>
                <div className="flex flex-wrap gap-5 mt-2">
                  {["boys", "girls", "both"].map((value) => (
                    <label key={value} className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" name="hostelGender" value={value}
                        checked={form.hostelGender === value} onChange={() => set("hostelGender")(value)}
                        className="accent-orange-500" />
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div ref={reg("hostelAddress")}>
                <Label required>Hostel Address</Label>
                <textarea rows={2} value={form.hostelAddress} onChange={setE("hostelAddress")}
                  onBlur={blur("hostelAddress")} placeholder="Street, area, city, province"
                  className={`${inputCls(touched.hostelAddress && errors.hostelAddress)} resize-y`} />
                {touched.hostelAddress && <FieldErr msg={errors.hostelAddress} />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div ref={reg("hostelPhone")}>
                  <Label required>Hostel Contact Number</Label>
                  <input type="tel" value={form.hostelPhone} onChange={setE("hostelPhone")}
                    onBlur={blur("hostelPhone")} placeholder="03XXXXXXXXX"
                    className={inputCls(touched.hostelPhone && errors.hostelPhone)} />
                  {touched.hostelPhone && <FieldErr msg={errors.hostelPhone} />}
                </div>
                <div ref={reg("hostelGps")}>
                  <Label required>GPS Coordinates</Label>
                  <input value={form.hostelGps} onChange={setE("hostelGps")}
                    onBlur={blur("hostelGps")} placeholder="31.5204, 74.3587"
                    className={inputCls(touched.hostelGps && errors.hostelGps)} />
                  {touched.hostelGps && <FieldErr msg={errors.hostelGps} />}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-base font-semibold text-slate-800">Hostel Verification Documents</h4>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Upload the three documents required for hostel verification.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {HOSTEL_DOCUMENTS.map((doc) => (
                    <div key={doc.key} ref={reg(`hostelDoc_${doc.key}`)}>
                      <HostelDocumentCard title={doc.title} file={form.hostelDocuments[doc.key]}
                        onChange={(file) => setHostelDoc(doc.key, file)}
                        error={touched[`hostelDoc_${doc.key}`] ? errors[`hostelDoc_${doc.key}`] : ""} />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-amber-700">
                  Hostel documents are selected locally. Upload and verification will be enabled when the backend is connected.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              No hostel details or documents required. Continue to Declaration.
            </p>
          )}
        </Section>

        {/* ── Section E: Declaration ──────────────────────────────────────── */}
        <Section letter="E" title="Declaration">
          <div ref={reg("declaration")}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={form.declaration}
                  onChange={(e) => {
                    set("declaration")(e.target.checked);
                    setTouched((t) => ({ ...t, declaration: true }));
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                  ${form.declaration
                    ? "bg-orange-500 border-orange-500"
                    : "bg-white border-gray-300 group-hover:border-orange-400"}`}
                >
                  {form.declaration && (
                    <svg viewBox="0 0 12 10" className="w-3 h-3">
                      <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" fill="none"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                I certify that I am authorized by{" "}
                <span className="font-semibold text-slate-800">
                  {selectedUniName || "[selected university]"}
                </span>{" "}
                to register this campus, and the information provided matches official records.
                False information may lead to permanent rejection.
              </p>
            </label>
            {touched.declaration && <FieldErr msg={errors.declaration} />}
          </div>
        </Section>

        {/* ── Sticky submit bar ──────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-3
                        flex items-center justify-between z-10">
          <p className="text-xs text-slate-400 hidden sm:block">
            All fields marked <span className="text-red-500">*</span> are required.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600
                       active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold text-sm px-6 py-2.5 rounded-xl
                       transition-all duration-150 focus:outline-none focus:ring-2
                       focus:ring-orange-400 focus:ring-offset-2 ml-auto"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Submitting…
              </>
            ) : isResubmission ? "Resubmit Request" : "Submit Request"}
          </button>
        </div>
      </form>
    </CampusRegShell>
  );
}
