/**
 * PersonalInfoSection
 * Required for all levels. Masks CNIC and mobile after save.
 */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SectionCard from "../SectionCard";
import UploadDropzone from "../UploadDropzone";
import DatePicker from "../DatePicker";
import {
  fetchProfileForEdit,
  saveProfile,
  deleteStudentFile,
} from "../../../api/studentProfile";
import {
  PERSONAL_REQUIRED_FIELDS,
  PERSONAL_FIELD_LABELS,
} from "../../../config/profileRequirements";

const PAKISTAN_PROVINCES = [
  "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan",
  "Islamabad Capital Territory", "Azad Kashmir", "Gilgit-Baltistan",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const Field = ({ label, error, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label}
      {required && <span className="text-orange-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const Input = ({ error, ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800
      focus:outline-none focus:ring-2 focus:ring-orange-300 transition
      ${error ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}
      disabled:bg-slate-50 disabled:text-slate-400`}
  />
);

export default function PersonalInfoSection({ profile, onProfileSaved, onEditChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);
  const [form, setForm]           = useState({});
  const [errors, setErrors]       = useState({});

  // Populate form from full (unmasked) profile when entering edit mode
  const startEdit = async () => {
    const { ok, data } = await fetchProfileForEdit();
    if (ok && data) {
      setForm({
        full_name:         data.full_name         || "",
        father_name:       data.father_name       || "",
        dob:               data.dob ? data.dob.split("T")[0] : "",
        gender:            data.gender            || "",
        cnic:              data.cnic              || "",
        mobile:            data.mobile            || "",
        nationality:       data.nationality       || "Pakistani",
        domicile_province: data.domicile_province || "",
        domicile_district: data.domicile_district || "",
        city:              data.city              || "",
        address:           data.address           || "",
        religion:          data.religion          || "",
        blood_group:       data.blood_group       || "",
        disability_notes:  data.disability_notes  || "",
        guardian_contact:  data.guardian_contact  || "",
        photo_url:         data.photo_url         || "",
        cnic_doc_url:      data.cnic_doc_url      || "",
        username:          data.username          || "",
      });
    }
    setErrors({});
    setIsEditing(true);
  };

  const cancel = () => { setIsEditing(false); setErrors({}); };

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  };

  // Derive age from DOB for display â€” never sent to server
  const derivedAge = form.dob
    ? Math.floor((Date.now() - new Date(form.dob)) / (365.25 * 24 * 3600 * 1000))
    : null;

  const validate = () => {
    const errs = {};
    if (!form.full_name?.trim()) errs.full_name = "Required";
    if (!form.father_name?.trim()) errs.father_name = "Required";
    if (!form.dob) errs.dob = "Required";
    else if (derivedAge < 10 || derivedAge > 70) errs.dob = "Date of birth seems invalid";
    if (!form.gender) errs.gender = "Required";
    if (!form.cnic?.trim()) {
      errs.cnic = "Required";
    } else {
      const cnicClean = form.cnic.replace(/-/g, "");
      if (!/^\d{13}$/.test(cnicClean)) errs.cnic = "Format: 12345-1234567-1";
    }
    if (!form.mobile?.trim()) {
      errs.mobile = "Required";
    } else {
      const mob = form.mobile.replace(/[-\s]/g, "");
      if (!/^03\d{9}$/.test(mob)) errs.mobile = "Format: 03XX-XXXXXXX";
    }
    if (!form.nationality?.trim())       errs.nationality       = "Required";
    if (!form.domicile_province?.trim()) errs.domicile_province = "Required";
    if (!form.domicile_district?.trim()) errs.domicile_district = "Required";
    if (!form.address?.trim())           errs.address           = "Required";
    if (!form.city?.trim())              errs.city              = "Required";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSaving(true);
    const { ok, data } = await saveProfile(form);
    setIsSaving(false);

    if (!ok) {
      toast.error(data?.message || "Save failed");
      return;
    }
    setIsEditing(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 4000);
    onProfileSaved?.();
  };

  // Check completeness from displayed (masked) profile
  const isComplete = PERSONAL_REQUIRED_FIELDS.every((f) => Boolean(profile?.[f]));

  return (
    <SectionCard
      id="personal"
      title="Personal Information"
      helperText="Your details as they appear on your CNIC. Required fields are marked with an orange asterisk."
      isComplete={isComplete}
      isEditing={isEditing}
      isSaving={isSaving}
      savedOk={savedOk}
      onEdit={startEdit}
      onSave={handleSave}
      onCancel={cancel}
      onEditChange={onEditChange}
    >
      {isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Row 1 */}
          <Field label={PERSONAL_FIELD_LABELS.full_name} required error={errors.full_name}>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
              placeholder="As on CNIC" error={errors.full_name} />
          </Field>
          <Field label={PERSONAL_FIELD_LABELS.father_name} required error={errors.father_name}>
            <Input value={form.father_name} onChange={(e) => set("father_name", e.target.value)}
              placeholder="Father / Guardian name" error={errors.father_name} />
          </Field>

          {/* Row 2 */}
          <Field label={PERSONAL_FIELD_LABELS.dob} required error={errors.dob}>
            <DatePicker
              value={form.dob}
              onChange={(iso) => set("dob", iso)}
              error={errors.dob}
              max={new Date().toISOString().split("T")[0]}
              disablePast={false}
            />
            {derivedAge !== null && !errors.dob && (
              <p className="mt-0.5 text-xs text-slate-400">Age: {derivedAge}</p>
            )}
          </Field>
          <Field label={PERSONAL_FIELD_LABELS.gender} required error={errors.gender}>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800
                focus:outline-none focus:ring-2 focus:ring-orange-300
                ${errors.gender ? "border-red-300" : "border-slate-200"}`}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          {/* Row 3 */}
          <Field label={PERSONAL_FIELD_LABELS.cnic} required error={errors.cnic}>
            <Input value={form.cnic} onChange={(e) => set("cnic", e.target.value)}
              placeholder="12345-1234567-1" error={errors.cnic} />
          </Field>
          <Field label={PERSONAL_FIELD_LABELS.mobile} required error={errors.mobile}>
            <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)}
              placeholder="03XX-XXXXXXX" error={errors.mobile} />
          </Field>

          {/* Row 4 */}
          <Field label={PERSONAL_FIELD_LABELS.nationality} required error={errors.nationality}>
            <Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)}
              error={errors.nationality} />
          </Field>
          <Field label={PERSONAL_FIELD_LABELS.domicile_province} required error={errors.domicile_province}>
            <select value={form.domicile_province} onChange={(e) => set("domicile_province", e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800
                focus:outline-none focus:ring-2 focus:ring-orange-300
                ${errors.domicile_province ? "border-red-300" : "border-slate-200"}`}>
              <option value="">Select province</option>
              {PAKISTAN_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          {/* Row 5 */}
          <Field label={PERSONAL_FIELD_LABELS.domicile_district} required error={errors.domicile_district}>
            <Input value={form.domicile_district} onChange={(e) => set("domicile_district", e.target.value)}
              placeholder="District" error={errors.domicile_district} />
          </Field>
          <Field label={PERSONAL_FIELD_LABELS.city} required error={errors.city}>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)}
              placeholder="Current city" error={errors.city} />
          </Field>

          {/* Full-width address */}
          <div className="sm:col-span-2">
            <Field label={PERSONAL_FIELD_LABELS.address} required error={errors.address}>
              <textarea
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                rows={2}
                placeholder="Permanent address"
                className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800
                  focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none
                  ${errors.address ? "border-red-300 bg-red-50" : "border-slate-200"}`}
              />
            </Field>
          </div>

          {/* Optional fields */}
          <Field label="Religion (optional)">
            <Input value={form.religion} onChange={(e) => set("religion", e.target.value)} placeholder="e.g. Islam" />
          </Field>
          <Field label="Blood Group (optional)">
            <select value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800
                focus:outline-none focus:ring-2 focus:ring-orange-300">
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Disability / Special Needs (optional)">
              <Input value={form.disability_notes}
                onChange={(e) => set("disability_notes", e.target.value)}
                placeholder="Leave blank if not applicable" />
            </Field>
          </div>

          <Field label="Guardian Contact Number (optional)">
            <Input value={form.guardian_contact}
              onChange={(e) => set("guardian_contact", e.target.value)}
              placeholder="03XX-XXXXXXX" />
          </Field>

          {/* Uploads */}
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <UploadDropzone
              label="Profile Photo"
              accept=".jpg,.jpeg,.png"
              docType="photo"
              required
              currentUrl={form.photo_url}
              onUploaded={(url) => set("photo_url", url)}
              onDelete={() => set("photo_url", "")}
            />
            <UploadDropzone
              label="CNIC / B-Form Copy"
              accept=".pdf,.jpg,.jpeg,.png"
              docType="cnic_doc"
              required
              currentUrl={form.cnic_doc_url}
              onUploaded={(url) => set("cnic_doc_url", url)}
              onDelete={() => set("cnic_doc_url", "")}
            />
          </div>
        </div>
      ) : (
        /* Read-only view */
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ["Full Name",         profile?.full_name],
            ["Father / Guardian", profile?.father_name],
            ["Date of Birth",     profile?.dob ? new Date(profile.dob).toLocaleDateString("en-PK") : null],
            ["Gender",            profile?.gender],
            ["CNIC",              profile?.cnic],
            ["Mobile",            profile?.mobile],
            ["Nationality",       profile?.nationality],
            ["Province",          profile?.domicile_province],
            ["District",          profile?.domicile_district],
            ["City",              profile?.city],
            ["Address",           profile?.address],
            ["Religion",          profile?.religion],
            ["Blood Group",       profile?.blood_group],
          ].map(([label, val]) => val ? (
            <div key={label}>
              <dt className="text-xs text-slate-400 font-medium">{label}</dt>
              <dd className="text-slate-700 mt-0.5">{val}</dd>
            </div>
          ) : null)}
        </dl>
      )}
    </SectionCard>
  );
}

