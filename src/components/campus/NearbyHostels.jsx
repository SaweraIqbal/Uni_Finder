import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BedDouble,
  Building2,
  ChevronDown,
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API, fileUrl } from "../../api/client";

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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" />
          <path d="M12 13v8" />
          <path d="M9 18h6" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21v-2a6 6 0 0 1 13 0v2" />
        </svg>
      )}
      {TYPE_LABEL[gender] || "Hostel"}
    </span>
  );
}

function HostelGallery({ hostel }) {
  const photos = photosOf(hostel);
  const [index, setIndex] = useState(0);
  const active = photos[index];

  if (photos.length === 0) {
    return (
      <div className="relative h-40 bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center">
        <Building2 size={44} className="text-orange-300" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-48 bg-slate-100">
        <img
          src={fileUrl(active)}
          alt={hostel.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-2.5 right-2.5 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] font-semibold text-white">
          {index + 1} / {photos.length}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {photos.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors
                ${i === index ? "border-orange-500" : "border-transparent hover:border-orange-200"}`}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={fileUrl(url)} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
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
  const [details, setDetails] = useState(null);

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
            /* non-JSON body (e.g. route not found) */
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
            Hostels listed by this campus, with photos and contact details.
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

                  {h.address && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} className="flex-shrink-0 text-orange-400" />
                      <span className="line-clamp-1">{h.address}</span>
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
                      onClick={() => setDetails(h)}
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

      {details && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15, 23, 42, 0.45)" }}
          onClick={() => setDetails(null)}
        >
          <div
            className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <HostelGallery key={details.id} hostel={details} />
            <button
              type="button"
              onClick={() => setDetails(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 text-gray-600 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={16} />
            </button>
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
              {!!(details.rooms || details.rent_min) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {details.rooms ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      <BedDouble size={13} className="text-orange-400" /> {details.rooms} rooms
                    </span>
                  ) : null}
                  {details.rent_min ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      <Wallet size={13} className="text-orange-400" /> Rs.{" "}
                      {Number(details.rent_min).toLocaleString("en-PK")}
                      {details.rent_max != null && details.rent_max !== details.rent_min
                        ? ` – ${Number(details.rent_max).toLocaleString("en-PK")}`
                        : ""}/month
                    </span>
                  ) : null}
                </div>
              )}
              {details.about && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{details.about}</p>}
              {(details.floors || details.nearby_distance || details.check_in_time || details.check_out_time) && (
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                  {details.floors && <p><span className="text-slate-500">Floors</span><br /><strong>{details.floors}</strong></p>}
                  {details.nearby_distance && <p><span className="text-slate-500">Nearby campus</span><br /><strong>{details.nearby_distance}</strong></p>}
                  {details.check_in_time && <p><span className="text-slate-500">Check-in</span><br /><strong>{details.check_in_time}</strong></p>}
                  {details.check_out_time && <p><span className="text-slate-500">Check-out</span><br /><strong>{details.check_out_time}</strong></p>}
                </div>
              )}
              {Array.isArray(details.room_details) && details.room_details.length > 0 && (
                <section className="mt-5">
                  <h4 className="font-semibold text-slate-800">Rooms & pricing</h4>
                  <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr><th className="p-2.5">Room</th><th className="p-2.5">Rooms</th><th className="p-2.5">Available beds</th><th className="p-2.5">Monthly rent</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {details.room_details.map((room) => (
                          <tr key={room.id}>
                            <td className="p-2.5 font-medium">{room.room_type}</td>
                            <td className="p-2.5">{room.total_rooms}</td>
                            <td className="p-2.5">{room.available_beds}</td>
                            <td className="p-2.5">Rs. {Number(room.monthly_rent || 0).toLocaleString("en-PK")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {Array.isArray(details.amenities) && details.amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {details.amenities.map((a, i) => (
                    <span key={`${a}-${i}`} className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700">
                      {a}
                    </span>
                  ))}
                </div>
              )}
              {Array.isArray(details.facilities) && details.facilities.length > 0 && (
                <section className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-800">Facilities & charges</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {details.facilities.map((facility, index) => (
                      <span key={`${facility?.name || facility}-${index}`} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                        {typeof facility === "string" ? facility : `${facility.name}${facility.amount ? ` · Rs. ${facility.amount}` : ""}`}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              {Array.isArray(details.hostel_rules) && details.hostel_rules.length > 0 && (
                <section className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-800">Hostel rules</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {details.hostel_rules.map((rule, index) => (
                      <li key={index}>{typeof rule === "string" ? rule : [rule.category, rule.text].filter(Boolean).join(": ")}</li>
                    ))}
                  </ul>
                </section>
              )}
              {(details.owner_name || details.owner_contact || details.warden_name || details.warden_contact) && (
                <div className="mt-4 rounded-xl border border-slate-100 p-4 text-sm">
                  <h4 className="font-semibold text-slate-800">Contact details</h4>
                  {details.owner_name && <p className="mt-2 text-slate-600">Owner / Manager: {details.owner_name}</p>}
                  {details.owner_contact && <a className="mt-1 block text-orange-600" href={`tel:${details.owner_contact}`}>Owner: {details.owner_contact}</a>}
                  {details.warden_name && <p className="mt-2 text-slate-600">Warden: {details.warden_name}</p>}
                  {details.warden_contact && <a className="mt-1 block text-orange-600" href={`tel:${details.warden_contact}`}>Warden: {details.warden_contact}</a>}
                </div>
              )}
              {(details.mess_details && Object.keys(details.mess_details).length > 0 || details.additional_fees && Object.keys(details.additional_fees).length > 0) && (
                <details className="mt-4 rounded-xl border border-slate-100 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">Mess, security & additional charges</summary>
                  <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-600">{JSON.stringify({ mess: details.mess_details, charges: details.additional_fees }, null, 2)}</pre>
                </details>
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
