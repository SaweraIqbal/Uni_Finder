/**
 * Page 6 — Facilities & Environment
 * Real API: getCampusFacilities (on mount), saveCampusFacilities (on save)
 */
import { useCallback, useEffect, useState } from "react";
import {
  Accessibility,
  Armchair,
  BriefcaseMedical,
  Bus,
  CarFront,
  Check,
  CreditCard,
  Dumbbell,
  FlaskConical,
  Info,
  Landmark,
  Library,
  MoonStar,
  Monitor,
  ShieldCheck,
  Theater,
  Trophy,
  Utensils,
  Wifi,
} from "lucide-react";
import { toast } from "react-toastify";
import { Card, SectionTitle, FormInput, FormTextarea, SaveButton } from "../ui";
import { getCampusFacilities, saveCampusFacilities } from "../../../api/campus";
import { useCampusAdmin } from "../CampusAdminContext";

const ALL_FACILITIES = [
  { id:"wifi",        label:"WiFi",              icon:Wifi },
  { id:"library",     label:"Library",            icon:Library },
  { id:"comp_labs",   label:"Computer Labs",      icon:Monitor },
  { id:"sci_labs",    label:"Science Labs",       icon:FlaskConical },
  { id:"cafeteria",   label:"Cafeteria",          icon:Utensils },
  { id:"prayer",      label:"Prayer Area",        icon:MoonStar },
  { id:"sports",      label:"Sports Grounds",     icon:Trophy },
  { id:"gym",         label:"Gym",                icon:Dumbbell },
  { id:"transport",   label:"Transport",          icon:Bus },
  { id:"medical",     label:"Medical Room",       icon:BriefcaseMedical },
  { id:"parking",     label:"Parking",            icon:CarFront },
  { id:"atm",         label:"ATM",                icon:CreditCard },
  { id:"auditorium",  label:"Auditorium",         icon:Theater },
  { id:"cctv",        label:"Security & CCTV",    icon:ShieldCheck },
  { id:"disability",  label:"Disability Access",  icon:Accessibility },
  { id:"lounges",     label:"Student Lounges",    icon:Armchair },
];

/* ── Transport route builder helpers ──────────────────────────────────────── */
const mkStop  = (name = "") => ({ id: crypto.randomUUID(), name });
const mkRoute = (name = "", duration = "") => ({
  id: crypto.randomUUID(), name, duration, expanded: true,
  stops: [mkStop(""), mkStop("")],
});
function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
function ChevronIcon({ open }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function TransportRoutes({ routes, setRoutes, fee, setFee }) {
  const upd = (rid, patch) => setRoutes((rs) => rs.map((r) => r.id === rid ? { ...r, ...patch } : r));
  const delRoute = (rid) => setRoutes((rs) => rs.filter((r) => r.id !== rid));
  const updStop = (rid, sid, name) =>
    setRoutes((rs) => rs.map((r) => r.id !== rid ? r : { ...r, stops: r.stops.map((s) => s.id === sid ? { ...s, name } : s) }));
  const delStop = (rid, sid) =>
    setRoutes((rs) => rs.map((r) => r.id !== rid ? r : { ...r, stops: r.stops.filter((s) => s.id !== sid) }));
  const addStop = (rid) =>
    setRoutes((rs) => rs.map((r) => r.id !== rid ? r : { ...r, stops: [...r.stops, mkStop("")] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Transport Fee</label>
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
          <span className="text-sm text-slate-500">Rs.</span>
          <input type="text" value={fee} onChange={(e) => setFee(e.target.value)}
            className="w-28 text-sm text-slate-700 outline-none" placeholder="0" />
          <span className="text-sm text-slate-400">/ month</span>
        </div>
      </div>
      <div className="space-y-3">
        {routes.map((route, ri) => (
          <div key={route.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
              <span className="text-[11px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-sm shrink-0">Route {ri+1}</span>
              <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">{route.name || "Unnamed Route"}</span>
              <span className="text-xs text-slate-400 shrink-0 hidden sm:block">· {route.stops.length} stops · {route.duration || "—"}</span>
              <button type="button" onClick={() => delRoute(route.id)} className="p-1 text-slate-300 hover:text-red-400 transition-colors shrink-0"><TrashIcon /></button>
              <button type="button" onClick={() => upd(route.id, { expanded: !route.expanded })} className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"><ChevronIcon open={route.expanded} /></button>
            </div>
            {route.expanded && (
              <div className="px-4 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Route Name</label>
                    <input type="text" value={route.name} onChange={(e) => upd(route.id, { name: e.target.value })}
                      placeholder="e.g. Gulberg Terminal → Campus"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Duration</label>
                    <input type="text" value={route.duration} onChange={(e) => upd(route.id, { duration: e.target.value })}
                      placeholder="e.g. ~35 mins"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">STOPS</p>
                  <div className="space-y-2">
                    {route.stops.map((stop, si) => {
                      const isFirst = si === 0, isLast = si === route.stops.length - 1;
                      return (
                        <div key={stop.id} className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 w-6 text-right shrink-0">{si+1}</span>
                          <input type="text" value={stop.name} onChange={(e) => updStop(route.id, stop.id, e.target.value)}
                            placeholder="Stop name"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-300 transition-colors" />
                          {isFirst
                            ? <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0 w-[72px] text-center">Source</span>
                            : isLast
                            ? <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full shrink-0 w-[72px] text-center">Destination</span>
                            : <span className="w-[72px] shrink-0" />}
                          <button type="button" onClick={() => delStop(route.id, stop.id)} disabled={route.stops.length <= 2}
                            className="p-1 text-slate-300 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
                            <TrashIcon />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => addStop(route.id)} className="mt-3 flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium">
                    <PlusIcon /> Add Stop
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setRoutes((rs) => [...rs, mkRoute()])}
        className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium mx-auto">
        <PlusIcon /> Add Route
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function FacilitiesPage() {
  const { campus, setIsDirty } = useCampusAdmin();
  const campusId = campus?.id;

  const [selected,     setSelected]     = useState(new Set());
  const [routes,       setRoutes]       = useState([]);
  const [transportFee, setTransportFee] = useState("");
  const [dressCode,    setDressCode]    = useState("");
  const [timings,      setTimings]      = useState("");
  const [attendance,   setAttendance]   = useState("");
  const [discipline,   setDiscipline]   = useState("");
  const [busy,         setBusy]         = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [dataLoaded,   setDataLoaded]   = useState(false);

  // ── Load saved data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!campusId) return;
    (async () => {
      try {
        const { ok, data } = await getCampusFacilities(campusId);
        if (ok && data) {
          setSelected(new Set(Array.isArray(data.selected_ids) ? data.selected_ids : []));
          setRoutes(Array.isArray(data.transport_routes) ? data.transport_routes : []);
          setTransportFee(data.transport_fee || "");
          setDressCode(data.dress_code || "");
          setTimings(data.class_timings || "");
          setAttendance(data.attendance_policy || "");
          setDiscipline(data.discipline_policy || "");
        }
      } catch { /* non-fatal */ }
      setDataLoaded(true);
    })();
  }, [campusId]);

  const dirty = () => { setIsDirty(true); setSaved(false); };

  const toggle = (id) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    dirty();
  };

  const handleSave = async () => {
    if (!campusId) { toast.error("Campus not loaded"); return; }
    setBusy(true);
    try {
      const { ok } = await saveCampusFacilities(campusId, {
        selected_ids:      Array.from(selected),
        transport_routes:  routes,
        transport_fee:     transportFee,
        dress_code:        dressCode,
        class_timings:     timings,
        attendance_policy: attendance,
        discipline_policy: discipline,
      });
      if (ok) {
        setSaved(true);
        setIsDirty(false);
        toast.success("Changes saved");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error("Save failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const showTransport = selected.has("transport");

  return (
    <div className="space-y-6">
      {/* Facilities grid */}
      <Card>
        <SectionTitle number="1" title="Facilities at this Campus" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ALL_FACILITIES.map(({ id, label, icon: Icon }) => {
            const active = selected.has(id);
            return (
              <button key={id} type="button" onClick={() => toggle(id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                  active ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                }`}>
                {active && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
                <Icon className="w-7 h-7 text-slate-700" strokeWidth={1.75} aria-hidden="true" />
                <span className={`text-xs font-medium text-center leading-tight ${active ? "text-orange-700" : "text-slate-600"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Transport Routes */}
      {showTransport && (
        <Card>
          <div className="flex items-start gap-3 mb-5">
            <div>
              <p className="text-sm font-semibold text-slate-800">Transport Routes</p>
              <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" /> Shown because Transport is selected
              </p>
            </div>
          </div>
          <TransportRoutes
            routes={routes}
            setRoutes={(v) => { setRoutes(v); dirty(); }}
            fee={transportFee}
            setFee={(v) => { setTransportFee(v); dirty(); }}
          />
        </Card>
      )}

      {/* Campus Environment */}
      <Card>
        <SectionTitle number={showTransport ? "3" : "2"} title="Campus Environment" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Dress Code" value={dressCode}
            onChange={(e) => { setDressCode(e.target.value); dirty(); }} />
          <FormInput label="Class Timings" value={timings}
            onChange={(e) => { setTimings(e.target.value); dirty(); }} />
          <FormInput label="Attendance Policy" value={attendance}
            onChange={(e) => { setAttendance(e.target.value); dirty(); }} />
          <FormTextarea label="Discipline & Anti-Ragging Policy" value={discipline}
            onChange={(e) => { setDiscipline(e.target.value); dirty(); }}
            rows={3} className="sm:col-span-2" />
        </div>
      </Card>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-8 px-8 py-3 flex justify-end z-10">
        <SaveButton onClick={handleSave} busy={busy} saved={saved} />
      </div>
    </div>
  );
}
