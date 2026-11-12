import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  Heart,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Venus,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { API, fileUrl } from "../../../shared/api/client";

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

const photosOf = (h) =>
  (Array.isArray(h?.photos) ? h.photos : [])
    .map((p) => p?.image_url)
    .filter(Boolean);

const shortRent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1000) return String(Math.round(n));
  const k = n / 1000;
  return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
};

const rentLabel = (h) => {
  const min = shortRent(h.rent_min);
  const max = shortRent(h.rent_max);
  if (!min && !max) return null;
  if (!min || !max || min === max) return min || max;
  return `${min} – ${max}`;
};

function GenderBadge({ gender }) {
  const girls = gender === "girls";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-lg ${
        girls ? "bg-orange-500" : "bg-gray-800"
      }`}
    >
      {girls ? (
        <Venus size={12} strokeWidth={2.5} />
      ) : (
        <User size={12} strokeWidth={2.5} />
      )}
      {TYPE_LABEL[gender] || "Hostel"}
    </span>
  );
}

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
  const [loadedCampusId, setLoadedCampusId] = useState("");
  const [error, setError] = useState("");
  const loading = Boolean(campusId && loadedCampusId !== campusId);

  const [genderFilter, setGenderFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [saved, setSaved] = useState({});

  useEffect(() => {
    if (!campusId) return;
    let cancelled = false;
    fetch(`${API}/api/campuses/${encodeURIComponent(campusId)}/hostels`)
      .then(async (r) => {
        if (!r.ok) {
          let msg = "";
          try {
            msg = (await r.json()).message || "";
          } catch {

          }
          throw new Error(
            `Could not load hostels (HTTP ${r.status}${msg ? ` - ${msg}` : ""}).`
          );
        }
        return r.json();
      })
      .then((rows) => {
        if (!cancelled) {
          setHostels(Array.isArray(rows) ? rows : []);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not load hostels.");
      })
      .finally(() => {
        if (!cancelled) setLoadedCampusId(campusId);
      });
    return () => {
      cancelled = true;
    };
  }, [campusId]);

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
            Hostels listed by this campus, plus verified hostel listings within
            5 km of the campus.
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

      {!campusId ? (
        <div className="text-center py-14 text-sm text-gray-400">Campus details are unavailable.</div>
      ) : loading ? (
        <div className="text-center py-14 text-sm text-gray-400">Loading hostels…</div>
      ) : error ? (
        <div className="text-center py-14 text-sm text-red-500">{error}</div>
      ) : hostels.length === 0 ? (
        <div className="text-center py-14 text-sm text-gray-400">
          This campus has not listed any hostel yet.
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-14 text-sm text-gray-400">
          No hostels match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {list.map((h) => {
            const liked = !!saved[h.id];
            const amenities = Array.isArray(h.amenities) ? h.amenities : [];
            const rent = rentLabel(h);
            return (
              <article
                key={h.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  {h.cover_url ? (
                    <img
                      src={fileUrl(h.cover_url)}
                      alt={h.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-orange-50 to-slate-100">
                      <Building2 size={40} className="text-orange-300" />
                    </div>
                  )}
                  <span
                    className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg ${
                      h.ownership === "Private Hostel"
                        ? "bg-[#ff6a00]"
                        : "bg-emerald-600"
                    }`}
                  >
                    {h.ownership || "Campus Hostel"}
                  </span>
                  <div className="absolute bottom-2.5 left-2.5">
                    <GenderBadge gender={h.gender} />
                  </div>
                  <button
                    type="button"
                    onClick={() => onHeart(h.id)}
                    aria-label={liked ? "Unsave hostel" : "Save hostel"}
                    className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm hover:text-orange-500"
                  >
                    <Heart size={16} className={liked ? "fill-orange-500 text-orange-500" : ""} />
                  </button>
                  {photosOf(h).length > 0 && (
                    <span className="absolute right-2.5 bottom-2.5 rounded-full bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold text-white">
                      {photosOf(h).length} photos
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-800 transition-colors group-hover:text-orange-600">
                    {h.name}
                  </h3>

                  {(h.address || h.distance_km != null) && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} className="flex-shrink-0 text-orange-400" />
                      <span className="line-clamp-1">
                        {h.distance_km != null ? `${h.distance_km} km from campus` : h.address}
                      </span>
                    </p>
                  )}

                  {rent && (
                    <p className="mt-2 text-lg font-extrabold text-orange-600">
                      Rs {rent}
                      <span className="text-[10px] font-normal text-gray-400">/mo</span>
                    </p>
                  )}

                  <div className="mt-2 flex min-h-7 flex-wrap gap-1">
                    {amenities.slice(0, 2).map((amenity, index) => (
                      <span
                        key={`${amenity}-${index}`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600 transition-colors group-hover:border-orange-100 group-hover:bg-orange-50/50"
                      >
                        <ShieldCheck size={10} className="text-orange-500" />
                        {amenity}
                      </span>
                    ))}
                    {amenities.length > 2 && (
                      <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                        +{amenities.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/hostels/${h.id}`)}
                      className="w-full cursor-pointer rounded-lg border-2 border-orange-500 py-2.5 text-sm font-semibold text-orange-500 transition-all duration-200 hover:bg-orange-500 hover:text-white hover:shadow-md active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
