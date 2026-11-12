import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MapPin, Bed, BookOpen, Award, ChevronDown, ChevronUp,
  ArrowLeft, Navigation, AlertCircle, CheckCircle2,
  GraduationCap, Building2, Users, Phone, X,
  Wifi, Library, Monitor, FlaskConical, Utensils,
  MoonStar, Trophy, Dumbbell, Bus, BriefcaseMedical,
  CarFront, CreditCard, Theater, ShieldCheck, Accessibility,
  Armchair, Landmark, Search, Trash2, Plus,
  Sparkles, Star, DoorOpen, Banknote, BadgeCheck, Layers, Info,
  Loader2,
} from "lucide-react";
import { compareCampuses, CAMPUS_DEFAULT_IMAGE } from "../api/campus";
import { API, fileUrl } from "../../../shared/api/client";

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

async function fetchRoadDistance(originLat, originLng, destLat, destLng) {

  if (ORS_API_KEY) {
    try {
      const orsRes = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        {
          method: "POST",
          headers: {
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json, application/geo+json",
          },
          body: JSON.stringify({
            coordinates: [
              [originLng, originLat],
              [destLng,   destLat],
            ],
          }),
        }
      );
      if (orsRes.ok) {
        const data = await orsRes.json();
        const seg  = data?.features?.[0]?.properties?.segments?.[0];
        if (seg) {
          return {
            km:      seg.distance / 1000,
            minutes: Math.round(seg.duration / 60),
            source:  "ors",
          };
        }
      }
    } catch {}
  }

  const osrmUrl =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${originLng},${originLat};${destLng},${destLat}?overview=false`;
  const osrmRes = await fetch(osrmUrl);
  if (!osrmRes.ok) throw new Error(`OSRM ${osrmRes.status}`);
  const osrmData = await osrmRes.json();
  const leg = osrmData?.routes?.[0]?.legs?.[0];
  if (!leg) throw new Error("OSRM: no route found");
  return {
    km:      leg.distance / 1000,
    minutes: Math.round(leg.duration / 60),
    source:  "osrm",
  };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const r = (d) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FACILITIES = [
  { id: "wifi",       label: "WiFi",             Icon: Wifi },
  { id: "library",    label: "Library",           Icon: Library },
  { id: "comp_labs",  label: "Computer Labs",     Icon: Monitor },
  { id: "sci_labs",   label: "Science Labs",      Icon: FlaskConical },
  { id: "cafeteria",  label: "Cafeteria",         Icon: Utensils },
  { id: "prayer",     label: "Prayer Area",       Icon: MoonStar },
  { id: "sports",     label: "Sports Grounds",    Icon: Trophy },
  { id: "gym",        label: "Gym",               Icon: Dumbbell },
  { id: "transport",  label: "Transport",         Icon: Bus },
  { id: "medical",    label: "Medical Room",      Icon: BriefcaseMedical },
  { id: "parking",    label: "Parking",           Icon: CarFront },
  { id: "atm",        label: "ATM",               Icon: CreditCard },
  { id: "auditorium", label: "Auditorium",        Icon: Theater },
  { id: "cctv",       label: "Security / CCTV",  Icon: ShieldCheck },
  { id: "disability", label: "Disability Access", Icon: Accessibility },
  { id: "lounges",    label: "Student Lounges",   Icon: Armchair },
  { id: "bank",       label: "Bank",              Icon: Landmark },
];

const COL_BORDER = ["border-orange-200", "border-blue-200",   "border-emerald-200"];
const COL_BG     = ["bg-orange-50",      "bg-blue-50",        "bg-emerald-50"];
const COL_DOT    = ["bg-orange-500",     "bg-blue-600",       "bg-emerald-600"];
const COL_TEXT   = ["text-orange-600",   "text-blue-600",     "text-emerald-600"];
const campusGridColumns = (count) =>
  count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-3";
const campusCardGridColumns = (count) =>
  count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3";

const dash    = (v) => (v == null || v === "" || v === 0 || v === "0" ? "—" : v);
const Rs      = (n) => (n ? `Rs ${Number(n).toLocaleString("en-PK")}` : "—");
const programDisplayName = (program) => {
  const degree = program.degree_type || "";
  const name = program.name || "";
  return degree && !name.toLowerCase().startsWith(degree.toLowerCase())
    ? `${degree} ${name}`
    : name;
};
const parseFee = (value) => Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
const semesterFeeRows = (program) =>
  (Array.isArray(program.details?.fees) ? program.details.fees : [])
    .filter((fee) => String(fee.frequency || "").toLowerCase() === "per semester")
    .map((fee) => ({ ...fee, numericAmount: parseFee(fee.amount) }))
    .filter((fee) => fee.numericAmount > 0);
const totalSemesterCharges = (program) => {
  const rows = semesterFeeRows(program);
  return rows.length
    ? rows.reduce((total, fee) => total + fee.numericAmount, 0)
    : parseFee(program.details?.semester_fee) || parseFee(program.fee);
};
const semesterFee = totalSemesterCharges;
const hasCoordinates = (campus) =>
  campus.lat !== null && campus.lat !== "" && campus.lat !== undefined &&
  campus.lng !== null && campus.lng !== "" && campus.lng !== undefined &&
  Number.isFinite(Number(campus.lat)) && Number.isFinite(Number(campus.lng));
const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
};
function mediaUrl(url) {
  if (!url) return CAMPUS_DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(url)) return url;
  return fileUrl(url) || CAMPUS_DEFAULT_IMAGE;
}
function levelBadge(lvl) {
  return ({
    Undergraduate: "bg-sky-50 text-sky-700 border-sky-200",
    MS:            "bg-violet-50 text-violet-700 border-violet-200",
    MPhil:         "bg-violet-50 text-violet-700 border-violet-200",
    PhD:           "bg-rose-50 text-rose-700 border-rose-200",
    ADP:           "bg-teal-50 text-teal-700 border-teal-200",
    Diploma:       "bg-amber-50 text-amber-700 border-amber-200",
  })[lvl] || "bg-gray-50 text-gray-600 border-gray-200";
}

function Section({ title, icon: Icon, children, defaultOpen = true, priority = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border ${priority ? "border-orange-200" : "border-gray-200"} bg-white overflow-hidden shadow-sm`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left ${
          priority ? "bg-orange-50 hover:bg-orange-100" : "bg-gray-50 hover:bg-gray-100"
        } transition-colors`}
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={17} className={priority ? "text-orange-500" : "text-gray-400"} strokeWidth={1.75} />}
          <span className={`text-sm font-bold ${priority ? "text-orange-700" : "text-gray-700"}`}>{title}</span>
          {badge != null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" />
               : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function CompareGrid({ rows, campuses }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[420px]">
        <tbody>
          {rows.map(({ label, values }) => (
            <tr key={label} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
              <td className="py-3 pr-4 text-xs font-semibold text-gray-500 whitespace-nowrap w-36 align-top">{label}</td>
              {values.slice(0, campuses.length).map((val, i) => (
                <td key={i} className="py-3 px-2 text-sm text-gray-800 align-top" style={{ width: `${60 / campuses.length}%` }}>
                  {val ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapPickerModal({ onConfirm, onClose }) {
  const mapRef    = useRef(null);
  const leafletRef = useRef(null);
  const markerRef  = useRef(null);
  const [picked, setPicked] = useState(null);

  useEffect(() => {

    import("leaflet").then((L) => {
      if (mapRef.current && !leafletRef.current) {

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current, { center: [30.3753, 69.3451], zoom: 5 });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          else markerRef.current = L.marker([lat, lng]).addTo(map);
          setPicked({ lat, lng });
        });

        leafletRef.current = map;
      }
    });

    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-800">Pin your location</p>
            <p className="text-xs text-gray-400 mt-0.5">Click anywhere on the map to drop a pin</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <style>{`@import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');`}</style>
        <div ref={mapRef} style={{ height: 380, width: "100%" }} />

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
          {picked ? (
            <span className="text-xs text-gray-500">
              <span className="font-semibold text-gray-800">{picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}</span>
            </span>
          ) : (
            <span className="text-xs text-gray-400">No pin dropped yet</span>
          )}
          <button
            type="button"
            disabled={!picked}
            onClick={() => { onConfirm(picked); onClose(); }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Use this location
          </button>
        </div>
      </div>
    </div>
  );
}

function HeaderCards({ campuses, onRemove, onAddCampus }) {
  return (
    <div className={`grid gap-4 ${campusCardGridColumns(campuses.length)}`}>
      {campuses.map((c, i) => {
        const img = c.images?.[0]?.image_url
          ? mediaUrl(c.images[0].image_url)
          : mediaUrl(c.cover_image || c.university_banner);
        const shifts = [
          c.shift_morning && "Morning",
          c.shift_evening && "Evening",
          c.shift_weekend && "Weekend",
        ].filter(Boolean);
        return (
          <article key={c.id} className={`rounded-2xl border-2 overflow-hidden ${COL_BG[i]} ${COL_BORDER[i]} relative`}>
            <div className="relative h-36 overflow-hidden">
              <img src={img} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${COL_DOT[i]}`}>
                {i + 1}
              </div>
              {c.is_main && (
                <span className="absolute top-3 right-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                  Main Campus
                </span>
              )}

              <button
                type="button"
                onClick={() => onRemove(c.id)}
                disabled={campuses.length === 1}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/85 hover:bg-red-50 text-red-500 hover:text-red-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                title={campuses.length === 1 ? "Add another campus before removing this one" : "Remove from comparison"}
                aria-label="Remove campus"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                {c.logo_url && (
                  <img src={mediaUrl(c.logo_url)} alt="" className="w-6 h-6 rounded-full object-contain border border-white shadow-sm flex-shrink-0" />
                )}
                <p className="text-[11px] font-semibold text-gray-500 truncate">{c.university_name || "—"}</p>
              </div>
              <h2 className="text-base font-bold text-gray-800 leading-snug">{c.name}</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={11} className="text-orange-400 flex-shrink-0" />
                <span className="truncate">{[c.city, c.province].filter(Boolean).join(", ") || "—"}</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {c.sector       && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{c.sector}</span>}
                {c.hec_rank     && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">HEC #{c.hec_rank}</span>}
                {c.gender_policy && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{c.gender_policy}</span>}
                {shifts.map((s) => (
                  <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{s}</span>
                ))}
              </div>
            </div>
          </article>
        );
      })}
      {campuses.length < 3 && (
        <button
          type="button"
          onClick={onAddCampus}
          className="col-span-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-white px-4 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
        >
          <Plus size={16} /> Add another campus
        </button>
      )}
    </div>
  );
}

function CampusPickerModal({ selectedIds, onSelect, onClose, addingCampusId }) {
  const [campusOptions, setCampusOptions] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API}/api/campuses`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load campuses.");
        return response.json();
      })
      .then((data) => {
        if (active) setCampusOptions(Array.isArray(data) ? data : []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load campuses.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const options = campusOptions.filter((campus) => {
    if (selectedIds.includes(String(campus.id))) return false;
    const text = `${campus.name} ${campus.university_name} ${campus.city} ${campus.province}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Add a campus to compare</h2>
            <p className="mt-0.5 text-xs text-gray-500">Choose another campus without leaving this page.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close campus picker"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <div className="border-b border-gray-100 p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campus, university, or city"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
        <div className="min-h-32 flex-1 overflow-y-auto p-3">
          {loading && <p className="py-8 text-center text-sm text-gray-400">Loading campuses…</p>}
          {!loading && error && <p role="alert" className="py-8 text-center text-sm text-red-600">{error}</p>}
          {!loading && !error && !options.length && (
            <p className="py-8 text-center text-sm text-gray-400">No other campuses found.</p>
          )}
          <div className="space-y-2">
            {options.map((campus) => (
              <button
                key={campus.id}
                type="button"
                onClick={() => onSelect(campus.id)}
                disabled={addingCampusId != null}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-100 p-3 text-left hover:border-orange-200 hover:bg-orange-50 disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-800">{campus.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">
                    {[campus.university_name, campus.city, campus.province].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-orange-600">
                  {addingCampusId === campus.id ? "Adding…" : "Add"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeeAndPrograms({ campuses, selectedProgram, onProgramChange }) {
  const [query, setQuery] = useState("");

  const { allNames, lookup } = useMemo(() => {
    const nameSet = new Set();
    const lk = {};

    campuses.forEach((c) => {
      (c.programs || []).forEach((p) => {
        const display = programDisplayName(p);
        nameSet.add(display);
        if (!lk[display]) lk[display] = {};
        lk[display][c.id] = p;
      });
    });

    return {
      allNames:  [...nameSet].sort(),
      lookup:    lk,
    };
  }, [campuses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allNames.filter((n) => n.toLowerCase().includes(q)) : allNames;
  }, [allNames, query]);

  const handleSelect = (name) => {
    onProgramChange(name);
    setQuery("");
  };

  const selectedEntry = selectedProgram ? campuses.map((c) => lookup[selectedProgram]?.[c.id] || null) : null;

  return (
    <div className="space-y-5">

      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={selectedProgram ? `Comparing: ${selectedProgram} — type to change…` : "Search programs…"}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
          />
          {selectedProgram && (
            <button
              type="button"
              onClick={() => onProgramChange(null)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {(query || !selectedProgram) && filtered.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden max-h-52 overflow-y-auto">
            {filtered.map((name) => {
              const isIn = campuses.filter((c) => !!lookup[name]?.[c.id]);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`w-full flex items-center justify-between text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors ${
                    selectedProgram === name ? "bg-orange-50 text-orange-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  <span>{name}</span>
                  <span className="text-[10px] text-gray-400 ml-3 flex-shrink-0">
                    {isIn.length}/{campuses.length} campus{campuses.length !== 1 ? "es" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedProgram && selectedEntry && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
            <BookOpen size={14} className="text-orange-500" />
            <span className="text-sm font-bold text-gray-800">{selectedProgram}</span>
          </div>
          <div className={`grid divide-x divide-gray-100 ${campusGridColumns(campuses.length)}`}>
            {campuses.map((c, i) => {
              const entry = selectedEntry[i];
              if (!entry) {
                return (
                  <div key={c.id} className="p-4">
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${COL_TEXT[i]}`}>{c.name}</div>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <X size={14} />
                      <span className="text-sm text-gray-400">Not offered</span>
                    </div>
                  </div>
                );
              }
              const feeRows = semesterFeeRows(entry);
              const totalCharges = totalSemesterCharges(entry);
              const d  = entry.details || {};
              const eligibility = Array.isArray(d.eligibility)
                ? d.eligibility.map((e) => [e.qualification, e.minPct && `${e.minPct}%`].filter(Boolean).join(" · ")).join("; ")
                : null;
              const entryTest = d.entryTest && d.entryTest !== "None" ? d.entryTest : null;
              return (
                <div key={c.id} className="p-4 space-y-2.5">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${COL_TEXT[i]}`}>{c.name}</div>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${levelBadge(entry.level)}`}>
                    {entry.level || "—"}
                  </span>
                  <div className="space-y-1.5">
                    {feeRows.map((fee, feeIndex) => (
                      <Row
                        key={`${fee.head || "charge"}-${feeIndex}`}
                        label={fee.head || "Semester charge"}
                        value={Rs(fee.numericAmount)}
                      />
                    ))}
                    <Row
                      label="Total semester charges"
                      value={totalCharges ? `${Rs(totalCharges)}/sem` : "Not published"}
                      highlight
                    />
                    {!feeRows.length && totalCharges > 0 && (
                      <p className="text-[10px] text-gray-400">
                        Itemized semester charges aren’t published; total uses the listed semester fee.
                      </p>
                    )}
                    <Row label="Duration"     value={entry.duration || "—"} />
                    <Row label="Shifts"       value={entry.shifts || "—"} />
                    <Row label="Entry Test"   value={entryTest || "—"} />
                    <Row label="Eligibility"  value={eligibility || "—"} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!selectedProgram && allNames.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">No published programs found for these campuses.</p>
      )}
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={`text-xs ${highlight ? "text-orange-600 font-semibold" : "text-gray-600"}`}>
      <span className="text-gray-400 font-normal">{label}: </span>{value}
    </div>
  );
}

function DistanceSection({ campuses, userCoords, locationError, requestLocation, onOpenMap }) {

  const [roadDistances, setRoadDistances] = useState({});

  useEffect(() => {
    if (!userCoords) return;
    let active = true;

    campuses.forEach((c) => {
      if (!hasCoordinates(c)) return;
      const key = `${userCoords.lat},${userCoords.lng}:${c.id}:${c.lat},${c.lng}`;
      fetchRoadDistance(
        userCoords.lat, userCoords.lng,
        Number(c.lat), Number(c.lng)
      )
        .then((result) => {
          if (active) setRoadDistances((previous) => ({ ...previous, [key]: result }));
        })
        .catch(() => {
          if (active) setRoadDistances((previous) => ({ ...previous, [key]: "error" }));
        });
    });

    return () => { active = false; };
  }, [userCoords, campuses]);

  const anyCoordsSet = campuses.some(hasCoordinates);

  return (
    <div className="space-y-4">

      {!userCoords && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
          <Navigation size={15} className="text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700 flex-1 min-w-0">Share your location to see driving distances.</p>
          <button type="button" onClick={requestLocation}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0">
            Use my GPS
          </button>
          <button type="button" onClick={onOpenMap}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0">
            Pick on map
          </button>
        </div>
      )}

      {locationError && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 flex-1">{locationError}</p>
          <button type="button" onClick={onOpenMap}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors flex-shrink-0">
            Pick on map
          </button>
        </div>
      )}

      {userCoords && (
        <div className="flex items-center justify-between gap-3 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Location set — fetching actual road distances…
          </span>
          <button type="button" onClick={onOpenMap}
            className="text-xs font-semibold text-emerald-700 hover:underline flex-shrink-0">
            Change →
          </button>
        </div>
      )}

      {!anyCoordsSet && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            These campuses don't have map coordinates yet. A campus admin must set its pin in Campus Profile → Map Coordinates.
          </p>
        </div>
      )}

      <div className={`grid gap-3 ${campusGridColumns(campuses.length)}`}>
        {campuses.map((c, i) => {
          const hasCoords = hasCoordinates(c);
          const distanceKey = userCoords && hasCoords
            ? `${userCoords.lat},${userCoords.lng}:${c.id}:${c.lat},${c.lng}`
            : null;
          const rd = !userCoords
            ? null
            : !hasCoords
              ? "no_coords"
              : roadDistances[distanceKey] || "loading";
          const mapsUrl =
            `https://www.google.com/maps/dir/?api=1` +
            `&origin=${userCoords?.lat},${userCoords?.lng}` +
            `&destination=${Number(c.lat)},${Number(c.lng)}`;

          return (
            <div key={c.id} className={`rounded-xl border-2 p-4 text-center ${COL_BG[i]} ${COL_BORDER[i]}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 truncate">{c.name}</p>
              <MapPin size={22} className={`mx-auto mb-2 ${rd && rd !== "no_coords" && rd !== "loading" && rd !== "error" ? "text-orange-500" : "text-gray-300"}`} />

              {!userCoords && !hasCoords && <p className="text-sm text-gray-400">No location data</p>}
              {!userCoords &&  hasCoords && <p className="text-sm text-gray-400">Enable location to calculate</p>}

              {userCoords && rd === "no_coords" && (
                <>
                  <p className="text-sm font-semibold text-gray-500">Coordinates not set</p>
                  <p className="text-xs text-gray-400 mt-1">{[c.city, c.province].filter(Boolean).join(", ") || "Unknown location"}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Ask the campus admin to set its map pin.</p>
                </>
              )}

              {userCoords && rd === "loading" && (
                <div className="flex flex-col items-center gap-1 py-1">
                  <Loader2 className="animate-spin h-6 w-6 text-orange-400" />
                  <p className="text-xs text-gray-400">Calculating…</p>
                </div>
              )}

              {userCoords && rd === "error" && (
                <>
                  <p className="text-sm font-semibold text-red-400">Route unavailable</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{[c.city, c.province].filter(Boolean).join(", ")}</p>
                  {userCoords && hasCoords && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors shadow-sm">
                      <MapPin size={11} /> Open in Google Maps →
                    </a>
                  )}
                </>
              )}

              {userCoords && rd && rd !== "no_coords" && rd !== "loading" && rd !== "error" && (
                <>
                  <p className="text-2xl font-bold text-gray-800">
                    {rd.km < 1 ? `${(rd.km * 1000).toFixed(0)} m` : `${rd.km.toFixed(1)} km`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">road distance</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{[c.city, c.province].filter(Boolean).join(", ")}</p>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors shadow-sm">
                    <MapPin size={11} /> Open in Google Maps →
                  </a>
                </>
              )}
            </div>
          );
        })}
      </div>

      <CompareGrid campuses={campuses} rows={[
        { label: "City",     values: campuses.map((c) => dash(c.city)) },
        { label: "Province", values: campuses.map((c) => dash(c.province)) },
        { label: "Address",  values: campuses.map((c) => dash(c.address)) },
      ]} />
    </div>
  );
}

function HostelsSection({ campuses }) {
  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${campusGridColumns(campuses.length)}`}>
        {campuses.map((c, i) => {
          const live  = (c.hostels || []).filter((h) => h.status === "live" || !h.status);
          const boys  = live.filter((h) => h.gender === "Boys");
          const girls = live.filter((h) => h.gender === "Girls");
          const prices = live.map((h) => Number(h.rent_min)).filter((n) => n > 0);
          return (
            <div key={c.id} className={`rounded-xl border-2 p-4 ${COL_BG[i]} ${COL_BORDER[i]}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 truncate">{c.name}</p>
              {live.length === 0 ? (
                <p className="text-sm text-gray-400">No hostel listed</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xl font-bold text-gray-800">{live.length} <span className="text-sm font-normal text-gray-500">hostel{live.length !== 1 ? "s" : ""}</span></p>
                  <div className="flex flex-wrap gap-1">
                    {boys.length  > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">{boys.length} Boys</span>}
                    {girls.length > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">{girls.length} Girls</span>}
                  </div>
                  {prices.length > 0 && <p className="text-xs text-gray-600">From <span className="font-semibold text-orange-600">{Rs(Math.min(...prices))}/mo</span></p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <CompareGrid campuses={campuses} rows={[
        { label: "Boys Hostels",  values: campuses.map((c) => (c.hostels || []).filter((h) => h.gender === "Boys").length  || "—") },
        { label: "Girls Hostels", values: campuses.map((c) => (c.hostels || []).filter((h) => h.gender === "Girls").length || "—") },
        { label: "Starting Rent", values: campuses.map((c) => {
            const prices = (c.hostels || []).map((h) => Number(h.rent_min)).filter((n) => n > 0);
            return prices.length ? Rs(Math.min(...prices)) + "/mo" : "—";
          })
        },
        { label: "Hostel Types",  values: campuses.map((c) => {
            const t = [...new Set((c.hostels || []).map((h) => h.hostel_type))].filter(Boolean);
            return t.length ? t.join(", ") : "—";
          })
        },
      ]} />
    </div>
  );
}

function ScholarshipsSection({ campuses }) {
  const [drawer, setDrawer] = useState(null);
  const lists = campuses.map((c) => (Array.isArray(c.scholarships) ? c.scholarships : []));

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${campusGridColumns(campuses.length)}`}>
        {campuses.map((c, i) => (
          <div key={c.id} className={`rounded-xl border-2 p-5 text-center ${COL_BG[i]} ${COL_BORDER[i]}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 truncate">{c.name}</p>
            <p className="text-3xl font-bold text-gray-800">{lists[i].length}</p>
            <p className="text-xs text-gray-500 mb-3">scholarship{lists[i].length !== 1 ? "s" : ""} available</p>
            {lists[i].length > 0 && (
              <button type="button" onClick={() => setDrawer(i)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-colors ${COL_BORDER[i]} ${COL_TEXT[i]} bg-white hover:bg-white/70`}>
                View Details →
              </button>
            )}
          </div>
        ))}
      </div>

      {drawer !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)" }} onClick={() => setDrawer(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${COL_BG[drawer]}`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{campuses[drawer].name}</p>
                <h3 className="text-sm font-bold text-gray-800 mt-0.5">{lists[drawer].length} Scholarship{lists[drawer].length !== 1 ? "s" : ""}</h3>
              </div>
              <button type="button" onClick={() => setDrawer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/80 transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {lists[drawer].map((s, idx) => (
                <div key={idx} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{s.name || "—"}</p>
                    {s.coverage && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 flex-shrink-0">{s.coverage}</span>}
                  </div>
                  {s.type     && <p className="text-[11px] text-gray-400 mt-0.5">{s.type}</p>}
                  {s.criteria && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{s.criteria}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FacilitiesSection({ campuses }) {
  const allIds = useMemo(() => {
    const s = new Set();
    campuses.forEach((c) => (c.facilities?.selected_ids || []).forEach((id) => s.add(id)));
    return FACILITIES.map((f) => f.id).filter((id) => s.has(id));
  }, [campuses]);

  if (allIds.length === 0)
    return <p className="text-sm text-gray-400 text-center py-8">No facility data published for these campuses.</p>;

  return (
    <div className="space-y-6">
      <div className={`grid gap-3 ${campusGridColumns(campuses.length)}`}>
        {campuses.map((c, i) => {
          const count = (c.facilities?.selected_ids || []).filter((id) => allIds.includes(id)).length;
          return (
            <div key={c.id} className={`rounded-xl border-2 p-3 flex items-center gap-3 ${COL_BG[i]} ${COL_BORDER[i]}`}>
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${COL_DOT[i]}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-700 truncate">{c.name}</p>
                <p className={`text-xs font-semibold ${COL_TEXT[i]}`}>{count} of {allIds.length} facilities</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {allIds.map((id) => {
          const { label, Icon } = FACILITIES.find((f) => f.id === id);
          const campusHas = campuses.map((c) => (c.facilities?.selected_ids || []).includes(id));
          const allHave   = campusHas.every(Boolean);
          const noneHave  = campusHas.every((v) => !v);
          return (
            <div key={id} className={`rounded-xl border p-3 flex flex-col gap-2 ${allHave ? "border-emerald-200 bg-emerald-50" : noneHave ? "border-gray-100 bg-gray-50 opacity-50" : "border-amber-100 bg-amber-50/50"}`}>
              <div className="flex items-center gap-2">
                <Icon size={15} strokeWidth={1.75} className={allHave ? "text-emerald-600" : noneHave ? "text-gray-300" : "text-amber-500"} />
                <span className="text-xs font-semibold text-gray-700 leading-tight">{label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {campuses.map((_, ci) => (
                  <span key={ci} title={`Campus ${ci + 1}: ${campusHas[ci] ? "Yes" : "No"}`}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${campusHas[ci] ? COL_DOT[ci] : "bg-gray-200"}`}>
                    {ci + 1}
                  </span>
                ))}
                {allHave  && <span className="text-[10px] text-emerald-600 font-semibold ml-1">All</span>}
                {noneHave && <span className="text-[10px] text-gray-400 font-semibold ml-1">None</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 pt-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> All campuses have it</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Some campuses have it</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> None have it</span>
      </div>
      {campuses.some((c) => c.facilities?.dress_code || c.facilities?.class_timings || c.facilities?.attendance_policy) && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Campus Environment</p>
          <CompareGrid campuses={campuses} rows={[
            { label: "Dress Code",        values: campuses.map((c) => dash(c.facilities?.dress_code)) },
            { label: "Class Timings",     values: campuses.map((c) => dash(c.facilities?.class_timings)) },
            { label: "Attendance Policy", values: campuses.map((c) => dash(c.facilities?.attendance_policy)) },
          ]} />
        </div>
      )}
    </div>
  );
}

function SocietiesSection({ campuses }) {
  const [drawer, setDrawer] = useState(null);
  const lists = campuses.map((c) => (Array.isArray(c.societies) ? c.societies : []));

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${campusGridColumns(campuses.length)}`}>
        {campuses.map((c, i) => (
          <div key={c.id} className={`rounded-xl border-2 p-5 text-center ${COL_BG[i]} ${COL_BORDER[i]}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 truncate">{c.name}</p>
            {lists[i].length > 0 ? (
              <>
                <p className="text-3xl font-bold text-gray-800">{lists[i].length}</p>
                <p className="text-xs text-gray-500 mb-3">societ{lists[i].length !== 1 ? "ies" : "y"} available</p>
                <button type="button" onClick={() => setDrawer(i)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-colors ${COL_BORDER[i]} ${COL_TEXT[i]} bg-white hover:bg-white/70`}>
                  View Details →
                </button>
              </>
            ) : (
              <p className="text-sm font-semibold text-gray-500 py-2">Not published</p>
            )}
          </div>
        ))}
      </div>

      {drawer !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)" }} onClick={() => setDrawer(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${COL_BG[drawer]}`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{campuses[drawer].name}</p>
                <h3 className="text-sm font-bold text-gray-800 mt-0.5">
                  {lists[drawer].length} Societ{lists[drawer].length !== 1 ? "ies" : "y"} &amp; Club{lists[drawer].length !== 1 ? "s" : ""}
                </h3>
              </div>
              <button type="button" onClick={() => setDrawer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/80 transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {lists[drawer].map((society, idx) => (
                <div key={society.id || idx} className="px-5 py-4">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{society.name || "—"}</p>
                  {society.category && <p className="text-[11px] text-gray-400 mt-0.5">{society.category}</p>}
                  {society.description && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{society.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PRIORITIES = [
  { key: "admission_open", label: "Admission open",  Icon: DoorOpen,   desc: "Currently accepting applications" },
  { key: "lowest_fee",     label: "Lowest fee",      Icon: Banknote,   desc: "Cheapest semester fee — select a program first" },
  { key: "closest",        label: "Closest to me",   Icon: MapPin,     desc: "Nearest campus — needs your location" },
  { key: "hostel",         label: "Hostel available", Icon: Bed,        desc: "Has a published hostel" },
  { key: "scholarship",    label: "Scholarships",    Icon: BadgeCheck, desc: "Offers at least one scholarship" },
  { key: "facilities",     label: "Facilities",      Icon: Layers,     desc: "Most campus facilities" },
];

function scoreCampuses(campuses, priorityKey, userCoords, selectedProgram) {
  switch (priorityKey) {
    case "admission_open": {
      return campuses.map((c) => {
        const s    = c.admission_status_override;
        const open = s === "open" || s === "closing_soon";
        if (open)        return { campusId: c.id, score: 100, detail: s === "closing_soon" ? "Closing soon" : "Open" };
        if (!open && s)  return { campusId: c.id, score: 0,   detail: "Closed" };
        const now = new Date(), o = c.admission_open ? new Date(c.admission_open) : null, cl = c.admission_close ? new Date(c.admission_close) : null;
        if (o && cl && now >= o && now <= cl) return { campusId: c.id, score: 100, detail: "Open" };
        return { campusId: c.id, score: 0, detail: "Closed / unknown" };
      });
    }
    case "lowest_fee": {
      const fees = campuses.map((c) => {
        const matchingProgram = (c.programs || []).find(
          (program) => programDisplayName(program) === selectedProgram,
        );
        const fee = matchingProgram ? semesterFee(matchingProgram) : 0;
        return fee > 0 ? fee : null;
      });
      const valid = fees.filter((f) => f !== null);
      if (!valid.length) return campuses.map((c) => ({ campusId: c.id, score: 0, detail: "No fee data" }));
      const minFee = Math.min(...valid), maxFee = Math.max(...valid);
      return campuses.map((c, i) => {
        if (fees[i] === null) return { campusId: c.id, score: 0, detail: "No fee data" };
        const score = maxFee === minFee ? 100 : Math.round(100 - ((fees[i] - minFee) / (maxFee - minFee)) * 100);
        return { campusId: c.id, score, detail: `Rs ${fees[i].toLocaleString("en-PK")}/sem` };
      });
    }
    case "closest": {
      if (!userCoords) return campuses.map((c) => ({ campusId: c.id, score: 0, detail: "Location not shared" }));
      const dists = campuses.map((c) =>
        hasCoordinates(c) ? haversineKm(userCoords.lat, userCoords.lng, Number(c.lat), Number(c.lng)) : null
      );
      const valid = dists.filter((d) => d !== null);
      if (!valid.length) return campuses.map((c) => ({ campusId: c.id, score: 0, detail: "No coordinates" }));
      const minD = Math.min(...valid), maxD = Math.max(...valid);
      return campuses.map((c, i) => {
        if (dists[i] === null) return { campusId: c.id, score: 0, detail: "No coordinates" };
        const score = maxD === minD ? 100 : Math.round(100 - ((dists[i] - minD) / (maxD - minD)) * 100);
        const km = dists[i];
        return { campusId: c.id, score, detail: km < 1 ? `${(km * 1000).toFixed(0)} m away` : `${km.toFixed(1)} km away` };
      });
    }
    case "hostel":
      return campuses.map((c) => {
        const live = (c.hostels || []).filter((h) => h.status === "live" || !h.status);
        return live.length ? { campusId: c.id, score: 100, detail: `${live.length} hostel${live.length > 1 ? "s" : ""}` }
                           : { campusId: c.id, score: 0,   detail: "No hostel" };
      });
    case "scholarship": {
      const counts = campuses.map((c) => (Array.isArray(c.scholarships) ? c.scholarships : []).length);
      const maxC = Math.max(...counts);
      return campuses.map((c, i) => ({
        campusId: c.id,
        score: maxC === 0 ? 0 : Math.round((counts[i] / maxC) * 100),
        detail: counts[i] ? `${counts[i]} scholarship${counts[i] > 1 ? "s" : ""}` : "None listed",
      }));
    }
    case "facilities": {
      const counts = campuses.map((c) => (c.facilities?.selected_ids || []).length);
      const maxC = Math.max(...counts);
      return campuses.map((c, i) => ({
        campusId: c.id,
        score: maxC === 0 ? 0 : Math.round((counts[i] / maxC) * 100),
        detail: counts[i] ? `${counts[i]} facilit${counts[i] > 1 ? "ies" : "y"}` : "None listed",
      }));
    }
    default:
      return campuses.map((c) => ({ campusId: c.id, score: 0, detail: "" }));
  }
}

function PriorityPicker({ campuses, userCoords, selectedProgram }) {
  const [selected, setSelected] = useState([]);
  const [result,   setResult]   = useState(null);

  useEffect(() => { setResult(null); }, [selected, userCoords, selectedProgram, campuses]);

  useEffect(() => {
    setSelected((prev) => prev.filter((k) => {
      if (k === "closest"    && !userCoords)      return false;
      if (k === "lowest_fee" && !selectedProgram) return false;
      return true;
    }));
  }, [userCoords, selectedProgram]);

  const toggle = (key) => {
    if (key === "closest" && !userCoords) {
      toast.warning("Set your location in Distance from You before choosing Closest to me.", { toastId: "need-location" });
      return;
    }
    if (key === "lowest_fee" && !selectedProgram) {
      toast.warning("Select a program in Fee & Programs before choosing Lowest fee.", { toastId: "need-program" });
      return;
    }
    setResult(null);
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 3)   return prev;
      return [...prev, key];
    });
  };

  const clear = () => { setSelected([]); setResult(null); };

  const findBestMatch = () => {
    if (!selected.length) return;
    if (selected.includes("closest") && !userCoords) {
      toast.warning("Please enable your location first.", { toastId: "need-location" });
      return;
    }
    if (selected.includes("lowest_fee") && !selectedProgram) {
      toast.warning("Please select a program first in the Fee & Programs section.", { toastId: "need-program" });
      return;
    }

    const weights = [3, 2, 1];
    const totals  = campuses.map((c) => ({ campusId: c.id, total: 0, breakdown: [] }));

    selected.forEach((key, rank) => {
      const w      = weights[rank] || 1;
      const scores = scoreCampuses(campuses, key, userCoords, selectedProgram);
      scores.forEach(({ campusId, score, detail }) => {
        const entry = totals.find((t) => t.campusId === campusId);
        if (!entry) return;
        entry.total += score * w;
        entry.breakdown.push({ key, score, detail, weight: w });
      });
    });

    const maxTotal    = Math.max(...totals.map((t) => t.total));
    const winnerEntry = totals.find((t) => t.total === maxTotal);
    const winner      = campuses.find((c) => c.id === winnerEntry?.campusId);
    setResult({ winner, totals, priorities: selected });
  };

  const isLocked = (key) =>
    (key === "closest"    && !userCoords)    ||
    (key === "lowest_fee" && !selectedProgram);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Sparkles size={15} className="text-orange-500" />
              What matters most to you?
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Pick up to 3 in order of importance. We'll score each campus and show the best fit.
            </p>
          </div>
          <button
            type="button"
            onClick={findBestMatch}
            disabled={!selected.length}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
          >
            Find best match
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {PRIORITIES.map(({ key, label, Icon }) => {
            const rank   = selected.indexOf(key);
            const active = rank !== -1;
            const locked = isLocked(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                title={!locked ? PRIORITIES.find((p) => p.key === key)?.desc : undefined}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-orange-200 ${
                  active
                    ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                    : locked
                    ? "bg-gray-50 border-gray-200 text-gray-400"
                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                <Icon size={12} strokeWidth={2} />
                {label}
                {active && (
                  <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] font-bold flex items-center justify-center leading-none">
                    {rank + 1}
                  </span>
                )}
              </button>
            );
          })}
          {selected.length > 0 && (
            <button type="button" onClick={clear}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Clear
            </button>
          )}
        </div>

      </div>

      {result && <BestMatchResult result={result} campuses={campuses} />}
    </div>
  );
}

function BestMatchResult({ result, campuses }) {
  const { winner, totals, priorities } = result;

  if (!winner) {
    return (
      <div className="px-5 py-4 text-sm text-gray-400 text-center">
        Not enough data to determine a best match for these priorities.
      </div>
    );
  }

  const winnerIdx  = campuses.findIndex((c) => c.id === winner.id);
  const winnerDot  = COL_DOT[winnerIdx]    || "bg-orange-500";
  const winnerBg   = COL_BG[winnerIdx]     || "bg-orange-50";
  const winnerBorder = COL_BORDER[winnerIdx] || "border-orange-200";

  const maxPossible = [3, 2, 1].slice(0, priorities.length).reduce((a, b) => a + b * 100, 0);

  return (
    <div className="px-5 py-5 space-y-5 bg-gray-50/60">

      <div className={`rounded-xl border-2 ${winnerBorder} ${winnerBg} p-4 flex items-center gap-4`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${winnerDot}`}>
          {winnerIdx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Best match for you</p>
          <p className="text-base font-bold text-gray-900 leading-tight truncate">{winner.name}</p>
          <p className="text-xs text-gray-500 truncate">{winner.university_name}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <Star size={20} className="text-orange-400 fill-orange-400 mx-auto" />
          <p className="text-[10px] font-bold text-gray-500 mt-0.5">Top pick</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Score breakdown</p>
        {totals.slice().sort((a, b) => b.total - a.total).map((entry) => {
          const campus    = campuses.find((c) => c.id === entry.campusId);
          const campusIdx = campuses.findIndex((c) => c.id === entry.campusId);
          const pct       = maxPossible > 0 ? Math.round((entry.total / maxPossible) * 100) : 0;
          const isWinner  = entry.campusId === winner.id;
          const barColor  = isWinner ? "bg-orange-500" : (COL_DOT[campusIdx] || "bg-gray-400");

          return (
            <div key={entry.campusId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${COL_DOT[campusIdx] || "bg-gray-400"}`}>
                    {campusIdx + 1}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 truncate">{campus?.name || "Campus"}</span>
                  {isWinner && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 flex-shrink-0">Best</span>}
                </div>
                <span className="text-xs font-bold text-gray-700 flex-shrink-0">{pct}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.breakdown.map(({ key, score, detail }) => {
                  const p    = PRIORITIES.find((pr) => pr.key === key);
                  const rank = priorities.indexOf(key);
                  return (
                    <span key={key} title={`Priority ${rank + 1}: ${p?.label} — ${detail}`}
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        score >= 80 ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : score >= 40 ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                      {p?.label}: <span className="font-bold ml-0.5">{detail}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Scores are weighted: 1st priority ×3, 2nd ×2, 3rd ×1. Based on published data only.
      </p>
    </div>
  );
}

export default function CompareCampusesPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { selectedIds = [] } = location.state || {};

  const [campuses,      setCampuses]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [userCoords,    setUserCoords]    = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showMapPicker,   setShowMapPicker]   = useState(false);
  const [showCampusPicker, setShowCampusPicker] = useState(false);
  const [addingCampusId, setAddingCampusId] = useState(null);

  useEffect(() => {
    if (!selectedIds.length) { setError("No campuses selected."); setLoading(false); return; }
    compareCampuses(selectedIds)
      .then((data) => { if (!data.length) throw new Error("No data returned."); setCampuses(data); })
      .catch((e) => setError(e.message || "Failed to load."))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const requestLocation = () => {
    if (!("geolocation" in navigator)) { setLocationError("Browser does not support geolocation."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationError(null); },
      (err)  => setLocationError(err.code === 1 ? "Location access denied. Allow it in browser settings." : "Could not get location."),
      { timeout: 10000 }
    );
  };

  const handleRemoveCampus = (campusId) => {
    const remaining = campuses.filter((c) => c.id !== campusId);
    setCampuses(remaining);
    if (!remaining.some((campus) =>
      (campus.programs || []).some((program) => programDisplayName(program) === selectedProgram)
    )) {
      setSelectedProgram(null);
    }
  };

  const handleAddCampus = async (campusId) => {
    if (campuses.length >= 3 || campuses.some((campus) => String(campus.id) === String(campusId))) return;
    setAddingCampusId(campusId);
    try {
      const ids = [...campuses.map((campus) => campus.id), campusId];
      const updatedCampuses = await compareCampuses(ids);
      if (updatedCampuses.length !== ids.length) {
        throw new Error("Could not load the selected campus. Please try another.");
      }
      setCampuses(updatedCampuses);
      setShowCampusPicker(false);
      toast.success("Campus added to comparison.");
    } catch (addError) {
      toast.error(addError.message || "Could not add campus.");
    } finally {
      setAddingCampusId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading comparison…</p>
        </div>
      </div>
    );
  }

  if (error || !campuses.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle size={48} className="text-orange-400 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Could not load comparison</h1>
          <p className="text-gray-500 text-sm">{error || "No data available."}</p>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all">
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const admissionRows = [
    { label: "Admission Open",    values: campuses.map((c) => fmtDate(c.admission_open)) },
    { label: "Admission Close",   values: campuses.map((c) => fmtDate(c.admission_close)) },
    { label: "Intake",            values: campuses.map((c) => dash(c.intake_name)) },
    { label: "Classes Start",     values: campuses.map((c) => fmtDate(c.classes_start)) },
    { label: "Class Arrangement", values: campuses.map((c) => dash(c.class_arrangement)) },
    { label: "Students Enrolled", values: campuses.map((c) => dash(c.students)) },
    { label: "Admission Status",  values: campuses.map((c) => {
        const s = c.admission_status_override;
        if (!s) return "—";
        return s === "open"     ? <span className="text-emerald-600 font-semibold">Open</span>
             : s === "closed"   ? <span className="text-red-500 font-semibold">Closed</span>
             : s === "upcoming" ? <span className="text-amber-600 font-semibold">Upcoming</span>
             : <span className="capitalize">{s}</span>;
      })
    },
  ];

  const contactRows = [
    { label: "Phone",        values: campuses.map((c) => c.phone    ? <a href={`tel:${c.phone}`}    className="text-orange-600 hover:underline">{c.phone}</a>    : "—") },
    { label: "WhatsApp",     values: campuses.map((c) => c.whatsapp ? <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{c.whatsapp}</a> : "—") },
    { label: "Email",        values: campuses.map((c) => c.email    ? <a href={`mailto:${c.email}`}  className="text-orange-600 hover:underline">{c.email}</a>    : "—") },
    { label: "Office Hours", values: campuses.map((c) => dash(c.office_hours)) },
  ];

  const totalPrograms  = campuses.reduce((s, c) => s + (c.programs  || []).length, 0);
  const totalSocieties = campuses.reduce((s, c) => s + (c.societies || []).length, 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {showMapPicker && (
        <MapPickerModal
          onConfirm={(coords) => { setUserCoords(coords); setLocationError(null); }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
      {showCampusPicker && (
        <CampusPickerModal
          selectedIds={campuses.map((campus) => String(campus.id))}
          onSelect={handleAddCampus}
          onClose={() => setShowCampusPicker(false)}
          addingCampusId={addingCampusId}
        />
      )}

      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-orange-500 transition-colors flex-shrink-0">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <GraduationCap size={17} className="text-orange-500 flex-shrink-0" />
            <h1 className="text-sm font-bold text-gray-800 truncate">
              Comparing {campuses.length} Campus{campuses.length !== 1 ? "es" : ""}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {campuses.map((c, i) => (
              <span key={c.id} className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white ${COL_DOT[i]}`}>
                {i + 1}. {c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        <PriorityPicker
          campuses={campuses}
          userCoords={userCoords}
          selectedProgram={selectedProgram}
        />

        <HeaderCards
          campuses={campuses}
          onRemove={handleRemoveCampus}
          onAddCampus={() => setShowCampusPicker(true)}
        />

        <Section title="Fee & Programs" icon={BookOpen} badge={`${totalPrograms} programs`}>
          <FeeAndPrograms
            campuses={campuses}
            selectedProgram={selectedProgram}
            onProgramChange={setSelectedProgram}
          />
        </Section>

        <Section title="Distance from You" icon={Navigation}>
          <DistanceSection
            campuses={campuses}
            userCoords={userCoords}
            locationError={locationError}
            requestLocation={requestLocation}
            onOpenMap={() => setShowMapPicker(true)}
          />
        </Section>

        <Section title="Hostels" icon={Bed}>
          <HostelsSection campuses={campuses} />
        </Section>

        <Section title="Scholarships" icon={Award}>
          <ScholarshipsSection campuses={campuses} />
        </Section>

        <Section title="Admission Info" icon={GraduationCap}>
          <CompareGrid campuses={campuses} rows={admissionRows} />
        </Section>

        <Section title="Facilities" icon={Building2}>
          <FacilitiesSection campuses={campuses} />
        </Section>

        <Section title="Societies & Clubs" icon={Users} badge={totalSocieties ? `${totalSocieties} total` : "Not published"}>
          <SocietiesSection campuses={campuses} />
        </Section>

        <Section title="Contact" icon={Phone}>
          <CompareGrid campuses={campuses} rows={contactRows} />
        </Section>

      </main>
    </div>
  );
}
