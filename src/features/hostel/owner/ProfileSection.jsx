import { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import { Clock, PencilLine, MapPin, ChevronDown } from 'lucide-react';
import GoogleMapPreview from '../../../shared/components/GoogleMapPreview';
import GoogleMapPicker from '../../../shared/components/GoogleMapPicker';

const API = "http://localhost:5000";

const VERIFICATION = {
  submitted: {
    pill: 'Under review',
    pillCls: 'bg-amber-100 text-amber-800',
    text: 'Your profile is with the review team. You can keep editing and saving while you wait.',
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

export default function ProfileSection({
  hostelId,
  initial,
  campuses = [],
  hostelRole = "hostel",
}) {
  const [form, setForm] = useState({ ...initial, gps: "", nearbyDistance: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(initial?.verification || "submitted");
  const [picker, setPicker] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!hostelId) return;

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
        setForm((previous) => ({
          ...previous,
          name: profile.name ?? "",
          about: profile.about ?? "",
          gender: profile.gender ?? "boys",
          ownership: profile.hostel_type === "university" || hostelRole === "campus_hostel" ? "campus" : "private",
          campusId: profile.campus_id ?? "",
          address: profile.address ?? "",
          nearbyDistance: profile.nearby_distance ?? "",
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
          approved: "approved",
          rejected: "rejected",
        };

        setStatus(statusMap[profile.status] ?? "submitted");
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
  }, [hostelId, hostelRole]);

  const v = VERIFICATION[status] ?? VERIFICATION.submitted;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setPerson = (who, key, value) =>
    setForm((f) => ({ ...f, [who]: { ...f[who], [key]: value } }));

  const mapParts = String(form.gps ?? "").split(",").map((part) => part.trim());
  const mapLat = parseFloat(mapParts[0]);
  const mapLng = parseFloat(mapParts[1]);
  const hasMapPin = Number.isFinite(mapLat) && Number.isFinite(mapLng);

  const useCurrentLocation = () => setPicker("locate");

  const validate = () => {
    const e = {};
    if (!String(form.name ?? '').trim()) e.name = 'Enter the hostel name.';
    if (!String(form.about ?? '').trim()) e.about = 'Add a short introduction.';
    if (hostelRole === 'campus_hostel' && !form.campusId) e.campusId = 'Select the affiliated campus.';
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
      address: form.address,
      nearby_distance: form.nearbyDistance,
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
  if (loadingProfile) {
    return <div className="rounded-2xl bg-white p-6 text-slate-600">Loading hostel profile from database...</div>;
  }

  return (
    <div className="space-y-6">

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

      <div className={card}>
        <SectionHeader
          icon={PencilLine}
          title="Basic Info"
          subtitle="Tell students and campus administrators about your hostel."
        />
        <div className="space-y-6 p-6">
          <Field label="Hostel Name" htmlFor="h-name" error={errors.name}>
            <input id="h-name" className={input} value={form.name}
              onChange={(e) => set('name', e.target.value)} />
          </Field>

          <Field label="About This Hostel" htmlFor="h-about" error={errors.about}>
            <textarea id="h-about" rows={4} className={`${input} resize-y`}
              placeholder="Share a short introduction, the hostel environment, and what makes it a good place to live."
              value={form.about} onChange={(e) => set('about', e.target.value)} />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Hostel Gender Type">
              <Segmented label="Hostel gender type" value={form.gender}
                onChange={(val) => set('gender', val)}
                options={[{ value: 'boys', label: 'Boys' }, { value: 'girls', label: 'Girls' }]} />
            </Field>
            <Field label="Hostel Category">
              <p className={`${input} bg-slate-50`}>
                {hostelRole === "campus_hostel" ? "Campus Hostel" : "Independent Hostel"}
              </p>
            </Field>
          </div>

          {hostelRole === 'campus_hostel' && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
              <label htmlFor="h-campus" className="mb-2 block text-xs font-medium text-slate-700">
                Affiliated Campus (required)
              </label>
              <div className="relative">
                <select
                  id="h-campus"
                  value={form.campusId}
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
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Full Address" htmlFor="h-address" error={errors.address}>
              <textarea id="h-address" rows={3} className={`${input} resize-y`}
                value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Nearby Campus / University Distance" htmlFor="h-distance" error={errors.nearbyDistance}>
              <input id="h-distance" className={input}
                placeholder="Example: 0.8 km from UCP Lahore"
                value={form.nearbyDistance} onChange={(e) => set('nearbyDistance', e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">

            <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <GoogleMapPreview
                lat={hasMapPin ? mapLat : ""}
                lng={hasMapPin ? mapLng : ""}
                zoom={hasMapPin ? 16 : 5}
                className="absolute inset-0 h-full w-full"
              />

              {hasMapPin ? (
                <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium shadow-sm">
                  <MapPin size={12} className="text-[#ff6a00]" />
                  <span>{mapLat.toFixed(5)}, {mapLng.toFixed(5)}</span>
                </div>
              ) : (
                <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
                  <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs text-slate-500 shadow-sm">
                    No location set — click below to pick on the map
                  </span>
                </div>
              )}

              <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPicker("adjust")}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-md transition-colors hover:bg-slate-50"
                >
                  {hasMapPin ? 'Adjust map pin' : 'Set on Map'}
                </button>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-md hover:bg-slate-50"
                >
                  Use current location
                </button>
              </div>
            </div>

            {picker && (
              <GoogleMapPicker
                lat={hasMapPin ? mapLat : ''}
                lng={hasMapPin ? mapLng : ''}
                autoLocate={picker === 'locate'}
                onConfirm={(la, ln) => set('gps', `${la}, ${ln}`)}
                onClose={() => setPicker(null)}
              />
            )}

            <div className="space-y-4">
              <Field label="Confirmed GPS Coordinates" htmlFor="h-gps" error={errors.gps}>
                <input id="h-gps" className={input} value={form.gps}
                  onChange={(e) => set('gps', e.target.value)} />
              </Field>
              <p className="-mt-3 text-xs text-slate-500">Enter latitude, longitude manually, or use the current-location button on the map.</p>
              <Field label="Total Floors" htmlFor="h-floors" error={errors.floors}>
                <input id="h-floors" type="number" min="1" className={input}
                  value={form.floors} onChange={(e) => set('floors', e.target.value)} />
              </Field>
              <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                Open the map to drop a pin and drag it to the exact spot, or use your current
                location. The chosen coordinates appear in the field above.
              </p>
            </div>
          </div>

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
                    <input id={`${key}-name`} className={input} value={form[key].name}
                      onChange={(e) => setPerson(key, 'name', e.target.value)} />
                  </Field>
                  <Field label="Contact" htmlFor={`${key}-contact`}>
                    <input id={`${key}-contact`} type="tel" className={input}
                      value={form[key].contact} onChange={(e) => setPerson(key, 'contact', e.target.value)} />
                  </Field>
                </div>
                {errors[key] && <p className="mt-2 text-xs text-red-600">{errors[key]}</p>}
              </fieldset>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="font-semibold text-slate-900">Save Hostel Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Save your latest hostel profile changes.</p>
        </div>
        <button type="button" onClick={handleSaveProfile} disabled={saving}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}