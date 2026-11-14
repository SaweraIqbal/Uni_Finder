/**
 * AdmissionPreferencesSection — all optional, all levels.
 */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SectionCard from "../SectionCard";
import { fetchPreferences, savePreferences } from "../../../api/studentProfile";

const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Hyderabad", "Abbottabad", "Bahawalpur", "Sargodha", "Sukkur",
];

const STUDY_MODES = [
  { value: "on-campus", label: "On-Campus" },
  { value: "evening",   label: "Evening" },
  { value: "weekend",   label: "Weekend" },
];

export default function AdmissionPreferencesSection({ onSaved, onEditChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);
  const [prefs,     setPrefs]     = useState(null);

  const [form, setForm] = useState({
    preferred_programs: [],
    preferred_cities:   [],
    study_mode:         "",
    hostel_needed:      false,
    programInput:       "",
  });

  useEffect(() => {
    fetchPreferences().then(({ ok, data }) => {
      if (ok && data) {
        setPrefs(data);
        setForm({
          preferred_programs: data.preferred_programs || [],
          preferred_cities:   data.preferred_cities   || [],
          study_mode:         data.study_mode         || "",
          hostel_needed:      Boolean(data.hostel_needed),
          programInput:       "",
        });
      }
    });
  }, []);

  const addProgram = () => {
    const val = form.programInput.trim();
    if (!val || form.preferred_programs.includes(val)) return;
    setForm((p) => ({ ...p, preferred_programs: [...p.preferred_programs, val], programInput: "" }));
  };
  const removeProgram = (p) => setForm((f) => ({ ...f, preferred_programs: f.preferred_programs.filter((x) => x !== p) }));

  const toggleCity = (city) => {
    setForm((f) => ({
      ...f,
      preferred_cities: f.preferred_cities.includes(city)
        ? f.preferred_cities.filter((c) => c !== city)
        : [...f.preferred_cities, city],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { ok, data } = await savePreferences({
      preferred_programs: form.preferred_programs,
      preferred_cities:   form.preferred_cities,
      study_mode:         form.study_mode,
      hostel_needed:      form.hostel_needed,
    });
    setIsSaving(false);
    if (!ok) { toast.error(data?.message || "Save failed"); return; }

    // Reload from DB so read-only view shows saved data immediately
    const { ok: rok, data: rdata } = await fetchPreferences();
    if (rok && rdata) {
      setPrefs(rdata);
      setForm({
        preferred_programs: rdata.preferred_programs || [],
        preferred_cities:   rdata.preferred_cities   || [],
        study_mode:         rdata.study_mode         || "",
        hostel_needed:      Boolean(rdata.hostel_needed),
        programInput:       "",
      });
    } else {
      // Fallback: use what we submitted
      setPrefs({
        preferred_programs: form.preferred_programs,
        preferred_cities:   form.preferred_cities,
        study_mode:         form.study_mode,
        hostel_needed:      form.hostel_needed,
      });
    }
    setIsEditing(false);
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
    onSaved?.();
  };

  // Preferences are always "complete" (all optional)
  const isComplete = Boolean(prefs);

  return (
    <SectionCard
      id="preferences"
      title="Admission Preferences"
      helperText="Help us match you with the right programs. All fields are optional."
      isComplete={isComplete}
      isEditing={isEditing}
      isSaving={isSaving}
      savedOk={savedOk}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={() => setIsEditing(false)}
      onEditChange={onEditChange}
    >
      {isEditing ? (
        <div className="space-y-5">
          {/* Preferred programs */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Programs / Disciplines</label>
            <div className="flex gap-2 mb-2">
              <input
                value={form.programInput}
                onChange={(e) => setForm((p) => ({ ...p, programInput: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProgram(); } }}
                placeholder="e.g. Computer Science — press Enter"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button type="button" onClick={addProgram}
                className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-medium hover:bg-orange-600">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.preferred_programs.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700">
                  {p}
                  <button type="button" onClick={() => removeProgram(p)} className="text-slate-400 hover:text-slate-700">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred cities */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Cities</label>
            <div className="flex flex-wrap gap-2">
              {PAKISTAN_CITIES.map((city) => (
                <button key={city} type="button" onClick={() => toggleCity(city)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${form.preferred_cities.includes(city)
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"}`}>
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Study mode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Study Mode</label>
            <div className="flex gap-3 flex-wrap">
              {STUDY_MODES.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="study_mode" value={value}
                    checked={form.study_mode === value}
                    onChange={(e) => setForm((p) => ({ ...p, study_mode: e.target.value }))}
                    className="accent-orange-500" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Hostel */}
          <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
            <span className="relative inline-flex items-center">
              <input type="checkbox" checked={form.hostel_needed}
                onChange={(e) => setForm((p) => ({ ...p, hostel_needed: e.target.checked }))}
                className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer
                peer-checked:bg-orange-500 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow
                peer-checked:translate-x-4 transition-transform" />
            </span>
            I need hostel accommodation
          </label>
        </div>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {prefs?.preferred_programs?.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-400 font-medium">Preferred Programs</dt>
              <dd className="flex flex-wrap gap-1.5 mt-1">
                {prefs.preferred_programs.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-700">{p}</span>
                ))}
              </dd>
            </div>
          )}
          {prefs?.preferred_cities?.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-400 font-medium">Preferred Cities</dt>
              <dd className="mt-0.5 text-slate-700">{prefs.preferred_cities.join(", ")}</dd>
            </div>
          )}
          {prefs?.study_mode && (
            <div>
              <dt className="text-xs text-slate-400 font-medium">Study Mode</dt>
              <dd className="text-slate-700 capitalize">{prefs.study_mode.replace("-", " ")}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-slate-400 font-medium">Hostel Needed</dt>
            <dd className="text-slate-700">{prefs?.hostel_needed ? "Yes" : "No"}</dd>
          </div>
          {!prefs && <div className="sm:col-span-2 text-xs text-slate-400">No preferences set yet.</div>}
        </dl>
      )}
    </SectionCard>
  );
}
