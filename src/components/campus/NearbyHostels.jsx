import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../api/client";

const GENDER_OPTIONS = [
  { id: "all", label: "All hostels" },
  { id: "boys", label: "Boys" },
  { id: "girls", label: "Girls" },
  { id: "both", label: "Boys & Girls" },
];

const DISTANCE_OPTIONS = [
  { id: "all", label: "Any distance" },
  { id: "nearest", label: "Nearest first" },
  { id: "under1", label: "Under 1 km" },
  { id: "1to2", label: "1 – 2 km" },
  { id: "over2", label: "Over 2 km" },
];

const TYPE_LABEL = {
  boys: "Boys Hostel",
  girls: "Girls Hostel",
  both: "Boys & Girls Hostel",
};

const typeClass = (gender) =>
  gender === "girls"
    ? "bg-rose-50 text-rose-600"
    : gender === "both"
      ? "bg-violet-50 text-violet-700"
      : "bg-sky-50 text-sky-700";

const mapsUrl = (h) =>
  h.latitude != null && h.longitude != null
    ? `https://www.google.com/maps?q=${h.latitude},${h.longitude}`
    : null;

function Dropdown({ label, icon: Icon, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-500 transition-colors"
      >
        {Icon && <Icon size={14} />}
        {current?.label === options[0].label ? label : current?.label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-sm transition-colors
                ${value === opt.id ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NearbyHostels({ campusId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [genderFilter, setGenderFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [saved, setSaved] = useState({});
  const [details, setDetails] = useState(null);

  // Sirf wohi hostels aate hain jo University Admin + Super Admin dono approve kar chuke hon.
  useEffect(() => {
    if (!campusId) {
      setHostels([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${API}/api/campuses/${encodeURIComponent(campusId)}/hostels`)
      .then(async (r) => {
        if (!r.ok) {
          let msg = "";
          try {
            msg = (await r.json()).message || "";
          } catch {
            /* non-JSON body (e.g. route not found) */
          }
          throw new Error(
            `Could not load hostels (HTTP ${r.status}${msg ? ` - ${msg}` : ""}).`
          );
        }
        return r.json();
      })
      .then((rows) => {
        if (!cancelled) setHostels(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not load hostels.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campusId]);

  // Distance filter tabhi dikhao jab kam az kam ek hostel ki distance maloom ho.
  const hasDistance = hostels.some((h) => h.distance_km != null);

  const list = useMemo(() => {
    let rows = [...hostels];

    if (genderFilter !== "all") rows = rows.filter((h) => h.gender === genderFilter);

    const d = (h) => h.distance_km;
    if (distanceFilter === "under1") rows = rows.filter((h) => d(h) != null && d(h) < 1);
    if (distanceFilter === "1to2") rows = rows.filter((h) => d(h) != null && d(h) >= 1 && d(h) <= 2);
    if (distanceFilter === "over2") rows = rows.filter((h) => d(h) != null && d(h) > 2);
    if (distanceFilter === "nearest")
      rows.sort((a, b) => (d(a) ?? Infinity) - (d(b) ?? Infinity));

    return rows;
  }, [hostels, genderFilter, distanceFilter]);

  const onHeart = (id) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setSaved((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Campus Hostels</h2>
          <p className="text-sm text-gray-500 mt-1">
            Verified hostels approved by the university and UniFinder.
          </p>
        </div>
        {hostels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown
              label="Filter by Type"
              icon={SlidersHorizontal}
              options={GENDER_OPTIONS}
              value={genderFilter}
              onChange={setGenderFilter}
            />
            {hasDistance && (
              <Dropdown
                label="Distance from Campus"
                options={DISTANCE_OPTIONS}
                value={distanceFilter}
                onChange={setDistanceFilter}
              />
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-14 text-sm text-gray-400">Loading hostels…</div>
      ) : error ? (
        <div className="text-center py-14 text-sm text-red-500">{error}</div>
      ) : hostels.length === 0 ? (
        <div className="text-center py-14 text-sm text-gray-400">
          No verified hostel is listed for this campus yet.
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-14 text-sm text-gray-400">
          No hostels match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((h) => {
            const liked = !!saved[h.id];
            return (
              <article
                key={h.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row hover:shadow-md hover:border-orange-100 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative sm:w-[34%] min-h-[120px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center">
                  <Building2 size={40} className="text-orange-300" />
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ${typeClass(h.gender)}`}
                    >
                      {TYPE_LABEL[h.gender] || "Hostel"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm bg-emerald-600 text-white">
                      {h.ownership}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-4 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-800 truncate">{h.name}</h3>
                      {h.address && (
                        <p className="flex items-start gap-1 text-xs text-slate-400 mt-1">
                          <MapPin size={11} className="text-orange-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{h.address}</span>
                        </p>
                      )}
                      {h.distance_km != null && (
                        <p className="text-xs text-slate-400 mt-1">{h.distance_km} km from campus</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onHeart(h.id)}
                      aria-label={liked ? "Unsave hostel" : "Save hostel"}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-orange-50 flex-shrink-0"
                    >
                      <Heart
                        size={16}
                        className={liked ? "text-orange-500 fill-orange-500" : "text-slate-400"}
                      />
                    </button>
                  </div>

                  <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                      <ShieldCheck size={12} /> Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetails(h)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border-2 border-orange-500 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
                    >
                      View Details <span aria-hidden="true">›</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {details && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15, 23, 42, 0.45)" }}
          onClick={() => setDetails(null)}
        >
          <div
            className="relative bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-32 bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center">
              <Building2 size={48} className="text-orange-300" />
              <button
                type="button"
                onClick={() => setDetails(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-gray-600 flex items-center justify-center"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${typeClass(details.gender)}`}>
                  {TYPE_LABEL[details.gender] || "Hostel"}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {details.ownership}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mt-2">{details.name}</h3>

              {details.address && (
                <p className="flex items-start gap-1.5 text-sm text-slate-500 mt-2">
                  <MapPin size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  {details.address}
                </p>
              )}
              {details.distance_km != null && (
                <p className="text-sm text-slate-500 mt-1.5">{details.distance_km} km from campus</p>
              )}
              {details.phone && (
                <a
                  href={`tel:${details.phone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 mt-2"
                >
                  <Phone size={14} /> {details.phone}
                </a>
              )}
              {mapsUrl(details) && (
                <a
                  href={mapsUrl(details)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-4 text-center px-4 py-2 rounded-lg border-2 border-orange-500 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
                >
                  View on Map
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
