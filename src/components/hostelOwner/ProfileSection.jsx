import { useEffect, useRef, useState } from "react";
import { toast } from 'react-toastify';
import { Clock, PencilLine, FileText, MapPin, Check, ChevronDown } from 'lucide-react';
const API = "http://localhost:5000";

const MAX_MB = 10;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

const DOCS = [
  { id: 'cnic', title: 'Owner CNIC' },
  { id: 'ownership', title: 'Proof of Ownership or Lease' },
  { id: 'utility', title: 'Recent Utility Bill' },
];

const VERIFICATION = {
  not_submitted: {
    pill: 'Not Submitted',
    pillCls: 'bg-slate-100 text-slate-700',
    text: 'Complete the profile and submit when you are ready. Filling fields alone does not start review.',
  },
  submitted: {
    pill: 'Under review',
    pillCls: 'bg-amber-100 text-amber-800',
    text: 'Your profile is with the university verification team. Fields are locked until review finishes.',
  },
  approved: {
    pill: 'Approved',
    pillCls: 'bg-emerald-100 text-emerald-800',
    text: 'Your hostel profile is verified.',
  },
  rejected: {
    pill: 'Rejected',
    pillCls: 'bg-red-100 text-red-800',
    text: 'Fix the issues listed in Status Tracking and submit again.',
  },
};

const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const input =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-slate-50 disabled:text-slate-500';

function Field({ label, error, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Segmented({ value, options, onChange, disabled, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
            value === o.value
              ? 'bg-white text-[#ff6a00] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[#ff6a00]">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function DocCard({ title, file, onPick, disabled, uploading }) {
  const ref = useRef(null);
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#ff6a00] shadow-sm">
          <FileText size={18} />
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            file ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {file ? 'Uploaded' : 'Not Uploaded'}
        </span>
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-1 truncate text-xs text-slate-500">
        {file ? (file.original_name || file.name) : `PDF, JPG or PNG · Max ${MAX_MB} MB`}
      </p>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : file ? 'Replace file' : 'Choose file'}
      </button>
    </div>
  );
}


export default function ProfileSection({
  hostelId,
  initial,
  campuses = [],
}) {
  const [form, setForm] = useState({ ...initial, gps: "", nearbyDistance: "" });
  const [docs, setDocs] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(
    initial?.verification || "not_submitted"
  );
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!hostelId) {
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);

        const token = sessionStorage.getItem("token");

        const response = await fetch(
          `http://localhost:5000/api/hostels/${hostelId}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        if (cancelled) return;

        const profile = data.profile;
        const existingDocs = Array.isArray(data.documents) ? data.documents : [];
        setDocs(Object.fromEntries(existingDocs.map(d => [d.document_type, d])));

        setForm((previous) => ({
          ...previous,
          name: profile.name ?? "",
          about: profile.about ?? "",
          gender: profile.gender ?? "boys",
          ownership: profile.hostel_type ?? "private",
          campusId: profile.campus_id ?? "",
          address: profile.address ?? "",
          gps:
            profile.lat != null && profile.lng != null
              ? `${profile.lat}, ${profile.lng}`
              : "",
          floors: profile.floors ?? "",
          owner: {
            name: profile.owner_name ?? "",
            contact: profile.owner_contact ?? "",
          },
          warden: {
            name: profile.warden_name ?? "",
            contact: profile.warden_contact ?? "",
          },
        }));

        const statusMap = {
          draft: "not_submitted",
          under_review: "submitted",
          approved: "approved",
          rejected: "rejected",
        };

        setStatus(
          statusMap[profile.status] ?? "not_submitted"
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Load Profile Error:", error);
          toast.error(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [hostelId]);

  const locked = status !== "not_submitted";

  const v = VERIFICATION[status];



  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setPerson = (who, key, value) =>
    setForm((f) => ({ ...f, [who]: { ...f[who], [key]: value } }));

  const pickDoc = async (id, file) => {
    if (!file || locked) return;
    if (!ALLOWED.includes(file.type)) return toast.error('Only PDF, JPG or PNG files are allowed.');
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`File must be under ${MAX_MB} MB.`);
    const token = sessionStorage.getItem('token');
    if (!token) return toast.error('Please login again.');
    try {
      setUploadingDoc(id);
      const body = new FormData();
      body.append('document', file);
      body.append('document_type', id);
      const res = await fetch(`${API}/api/hostels/${hostelId}/documents`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Document upload failed');
      const listRes = await fetch(`${API}/api/hostels/${hostelId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!listRes.ok) throw new Error('Uploaded, but could not refresh documents');
      const listData = await listRes.json();
      const list = Array.isArray(listData) ? listData : (listData.documents || []);
      setDocs(Object.fromEntries(list.map(d => [d.document_type, d])));
      toast.success('Document uploaded to database.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingDoc('');
    }
  };
  const validate = () => {
    const e = {};
    if (!String(form.name ?? '').trim()) e.name = 'Enter the hostel name.';
    if (!String(form.about ?? '').trim()) e.about = 'Add a short introduction.';
    if (form.ownership === 'campus' && !form.campusId) e.campusId = 'Select the affiliated campus.';
    if (!String(form.address ?? '').trim()) e.address = 'Enter the full address.';
    const parts = String(form.gps ?? '').split(',').map(x => Number(x.trim()));
    if (!String(form.gps ?? '').trim() || parts.length !== 2 ||
        !parts.every(Number.isFinite) || parts[0] < -90 || parts[0] > 90 ||
        parts[1] < -180 || parts[1] > 180) {
      e.gps = 'Enter valid GPS coordinates as latitude, longitude.';
    }
    if (!form.floors || Number(form.floors) < 1) e.floors = 'Enter the number of floors.';
    if (!String(form.owner?.name ?? '').trim() || !String(form.owner?.contact ?? '').trim()) e.owner = 'Enter owner name and contact.';
    if (!String(form.warden?.name ?? '').trim() || !String(form.warden?.contact ?? '').trim()) e.warden = 'Enter warden name and contact.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

const [saving, setSaving] = useState(false);

const handleSaveProfile = async () => {
  if (!hostelId) {
    toast.error("Please select a hostel.");
    return;
  }

  if (!validate()) {
    toast.error("Please fill the highlighted profile fields before saving.");
    return;
  }

  try {
    setSaving(true);

    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.error("Please login again.");
      return;
    }

    const gpsParts = String(form.gps || "")
      .split(",")
      .map((value) => Number(value.trim()));

    const hasGps =
      gpsParts.length === 2 &&
      gpsParts.every(Number.isFinite) &&
      gpsParts[0] >= -90 && gpsParts[0] <= 90 &&
      gpsParts[1] >= -180 && gpsParts[1] <= 180;

    if (form.gps?.trim() && !hasGps) {
      toast.error("Enter GPS as latitude, longitude.");
      return;
    }

    const payload = {
      name: form.name,
      about: form.about,
      gender: form.gender,
      hostel_type: form.ownership,
      campus_id:
        form.ownership === "campus"
          ? form.campusId || null
          : null,
      address: form.address,
      floors: Number(form.floors),
      owner_name: form.owner.name,
      owner_contact: form.owner.contact,
      warden_name: form.warden.name,
      warden_contact: form.warden.contact,
    };

    if (hasGps) {
      payload.lat = gpsParts[0];
      payload.lng = gpsParts[1];
    }

    const response = await fetch(
      `${API}/api/hostels/${hostelId}/profile`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save profile");
    }

    toast.success("Hostel profile saved successfully!");
  } catch (error) {
    console.error("Save Profile Error:", error);
    toast.error(error.message);
  } finally {
    setSaving(false);
  }
};
  const handleSubmit = async () => {
    if (locked || submitting) return;
    try {
      setSubmitting(true);
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API}/api/hostels/${hostelId}/submit`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification submission failed');
      setStatus('submitted');
      toast.success('Verification request submitted.');
    } catch (err) {
      toast.error(err.message + ' (Check that the submit API is implemented.)');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return <div className="rounded-2xl bg-white p-6 text-slate-600">Loading hostel profile from database...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Verification status */}
      <div className={`${card} flex flex-wrap items-center gap-4 p-5`}>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <Clock size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Verification Status</h2>
          <p className="text-sm text-slate-500">{v.text}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${v.pillCls}`}>{v.pill}</span>
      </div>

      {/* Basic info */}
      <div className={card}>
        <SectionHeader
          icon={PencilLine}
          title="Basic Info"
          subtitle="Tell students and campus administrators about your hostel."
        />
        <div className="space-y-6 p-6">
          <Field label="Hostel Name" htmlFor="h-name" error={errors.name}>
            <input id="h-name" className={input} value={form.name} disabled={locked}
              onChange={(e) => set('name', e.target.value)} />
          </Field>

          <Field label="About This Hostel" htmlFor="h-about" error={errors.about}>
            <textarea id="h-about" rows={4} className={`${input} resize-y`} disabled={locked}
              placeholder="Share a short introduction, the hostel environment, and what makes it a good place to live."
              value={form.about} onChange={(e) => set('about', e.target.value)} />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Hostel Gender Type">
              <Segmented label="Hostel gender type" value={form.gender} disabled={locked}
                onChange={(val) => set('gender', val)}
                options={[{ value: 'boys', label: 'Boys' }, { value: 'girls', label: 'Girls' }]} />
            </Field>
            <Field label="Ownership Type">
              <Segmented label="Ownership type" value={form.ownership} disabled={locked}
                onChange={(val) =>
                  setForm((f) => ({ ...f, ownership: val, campusId: val === 'campus' ? f.campusId : '' }))
                }
                options={[{ value: 'private', label: 'Private Hostel' }, { value: 'campus', label: 'Campus Hostel' }]} />
              <p className="mt-2 text-xs text-amber-700">Ownership Type locks when you submit for verification.</p>
            </Field>
          </div>

          {form.ownership === 'campus' && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
              <label htmlFor="h-campus" className="mb-2 block text-xs font-medium text-slate-700">
                Affiliated Campus (required)
              </label>
              <div className="relative">
                <select
                  id="h-campus"
                  value={form.campusId}
                  disabled={locked}
                  onChange={(e) => set('campusId', e.target.value)}
                  className={`${input} appearance-none pr-10`}
                >
                  <option value="">Select affiliated campus</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
              {errors.campusId && <p className="mt-1 text-xs text-red-600">{errors.campusId}</p>}
              <p className="mt-2 text-xs text-slate-500">
                Your submission goes to the University Admin first, then Super Admin.
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Full Address" htmlFor="h-address" error={errors.address}>
              <textarea id="h-address" rows={3} className={`${input} resize-y`} disabled={locked}
                value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Nearby Campus / University Distance" htmlFor="h-distance" error={errors.nearbyDistance}>
              <input id="h-distance" className={input} disabled={locked}
                placeholder="Example: 0.8 km from UCP Lahore"
                value={form.nearbyDistance} onChange={(e) => set('nearbyDistance', e.target.value)} />
            </Field>
          </div>

          {/* Map + GPS */}
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div
              className="relative min-h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            >
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#ff6a00] text-white ring-4 ring-white">
                  <MapPin size={20} />
                </div>
                <span className="rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm">{form.gps}</span>
              </div>
              <button
                type="button"
                disabled={locked}
                onClick={() => toast.info('Map picker will be connected later.')}
                className="absolute bottom-4 right-4 rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Adjust map pin
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Confirmed GPS Coordinates" htmlFor="h-gps" error={errors.gps}>
                <input id="h-gps" className={input} disabled={locked} value={form.gps}
                  onChange={(e) => set('gps', e.target.value)} />
              </Field>
              <Field label="Total Floors" htmlFor="h-floors" error={errors.floors}>
                <input id="h-floors" type="number" min="1" className={input} disabled={locked}
                  value={form.floors} onChange={(e) => set('floors', e.target.value)} />
              </Field>
              <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                The coordinate shown beside the map pin is the location that will be submitted.
              </p>
            </div>
          </div>

          {/* Contacts */}
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { key: 'owner', title: 'Owner / Manager', tone: 'bg-slate-50' },
              { key: 'warden', title: 'Warden / On-site Contact', tone: 'bg-orange-50' },
            ].map(({ key, title, tone }) => (
              <fieldset key={key} className={`rounded-2xl p-5 ${tone}`}>
                <legend className="sr-only">{title}</legend>
                <h3 className="font-semibold">{title}</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" htmlFor={`${key}-name`}>
                    <input id={`${key}-name`} className={input} disabled={locked} value={form[key].name}
                      onChange={(e) => setPerson(key, 'name', e.target.value)} />
                  </Field>
                  <Field label="Contact" htmlFor={`${key}-contact`}>
                    <input id={`${key}-contact`} type="tel" className={input} disabled={locked}
                      value={form[key].contact} onChange={(e) => setPerson(key, 'contact', e.target.value)} />
                  </Field>
                </div>
                {errors[key] && <p className="mt-2 text-xs text-red-600">{errors[key]}</p>}
              </fieldset>
            ))}
          </div>
        </div>
      </div>

      {/* Documents and verification submission: one section */}
      <div className={card}>
        <SectionHeader icon={FileText} title="Documents & Verification"
          subtitle="Upload documents first, then request verification. Saving a draft does not submit it." />
        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {DOCS.map(d => (
              <DocCard key={d.id} title={d.title} file={docs[d.id]}
                disabled={locked || Boolean(uploadingDoc)} uploading={uploadingDoc === d.id}
                onPick={f => pickDoc(d.id, f)} />
            ))}
          </div>
          {errors.docs && <p className="text-xs text-red-600">{errors.docs}</p>}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <div>
              <h3 className="font-semibold">Submit for Verification</h3>
              <p className="text-sm text-slate-500">
                Private: Super Admin. Campus: University Admin, then Super Admin.
                Only profile editing is locked after the backend accepts submission.
              </p>
            </div>
            <button type="button" disabled={locked || submitting || Boolean(uploadingDoc)}
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e65f00] disabled:opacity-60">
              {locked && <Check size={16} />}
              {locked ? 'Submitted' : submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      </div>

      {/* Independent profile draft save */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="font-semibold text-slate-900">Save Hostel Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Save profile fields to MySQL without starting verification.</p>
        </div>
        <button type="button" onClick={handleSaveProfile} disabled={saving || locked}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}