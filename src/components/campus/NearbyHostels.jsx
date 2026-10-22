import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Heart, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Fallback image used when no hostel image is available
const HOSTEL_IMAGE_BOYS =
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700&auto=format&fit=crop";
const HOSTEL_IMAGE_GIRLS =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&auto=format&fit=crop";

const PRICE_OPTIONS = [
  { id: "all",    label: "All prices" },
  { id: "low",    label: "Low to High" },
  { id: "high",   label: "High to Low" },
  { id: "under10", label: "Under Rs 10,000" },
  { id: "10to15", label: "Rs 10,000 – 15,000" },
  { id: "15to20", label: "Rs 15,000 – 20,000" },
  { id: "over20", label: "Over Rs 20,000" },
];

const GENDER_OPTIONS = [
  { id: "all",   label: "All hostels" },
  { id: "Boys",  label: "Boys only" },
  { id: "Girls", label: "Girls only" },
];

function formatPrice(n) {
  if (!n) return "Contact for price";
  return `Rs ${Number(n).toLocaleString("en-PK")}/mo`;
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
              onClick={() => { onChange(opt.id); setOpen(false); }}
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

export default function NearbyHostels({ hostels = [] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [priceFilter, setPriceFilter]   = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [saved, setSaved]               = useState({});
  const [details, setDetails]           = useState(null);

  // Normalise DB rows into the shape the UI needs
  const normalised = useMemo(() =>
    hostels.map((h) => ({
      id:        h.id,
      name:      h.name,
      type:      h.gender === "Girls" ? "Girls Hostel" : "Boys Hostel",
      ownership: h.hostel_type === "Campus Hostel" ? "Campus Own Hostel" : "Private Hostel",
      price:     Number(h.rent_min) || 0,
      distLabel: h.walk_dist || "On-Campus",
      contact:   h.contact || "",
      amenities: Array.isArray(h.amenities) ? h.amenities : [],
      rooms_detail: Array.isArray(h.rooms_detail) ? h.rooms_detail : [],
      image:     h.gender === "Girls" ? HOSTEL_IMAGE_GIRLS : HOSTEL_IMAGE_BOYS,
    })),
  [hostels]);

  const list = useMemo(() => {
    let rows = [...normalised];

    // Gender filter
    if (genderFilter !== "all") rows = rows.filter((h) => h.type === `${genderFilter} Hostel`);

    // Price filters
    if (priceFilter === "under10")  rows = rows.filter((h) => h.price < 10000);
    if (priceFilter === "10to15")   rows = rows.filter((h) => h.price >= 10000 && h.price < 15000);
    if (priceFilter === "15to20")   rows = rows.filter((h) => h.price >= 15000 && h.price <= 20000);
    if (priceFilter === "over20")   rows = rows.filter((h) => h.price > 20000);
    if (priceFilter === "low")      rows.sort((a, b) => a.price - b.price);
    if (priceFilter === "high")     rows.sort((a, b) => b.price - a.price);

    return rows;
  }, [normalised, priceFilter, genderFilter]);

  const onHeart = (id) => {
    if (!isLoggedIn) { navigate("/login"); return; }
    setSaved((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (hostels.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
        <h2 className="text-xl font-bold text-gray-800">Campus Hostels</h2>
        <p className="text-sm text-gray-500 mt-3">No hostel information has been published by this campus yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Campus Hostels</h2>
          <p className="text-sm text-gray-500 mt-1">
            Official on-campus accommodation published by this campus.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            label="Filter by Gender"
            icon={SlidersHorizontal}
            options={GENDER_OPTIONS}
            value={genderFilter}
            onChange={setGenderFilter}
          />
          <Dropdown
            label="Filter by Price"
            options={PRICE_OPTIONS}
            value={priceFilter}
            onChange={setPriceFilter}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-14 text-sm text-gray-400">
          No hostels match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((h) => {
            const extra = h.amenities.length > 3 ? h.amenities.length - 3 : 0;
            const shown = extra ? h.amenities.slice(0, 3) : h.amenities;
            const liked = !!saved[h.id];
            return (
              <article
                key={h.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row hover:shadow-md hover:border-orange-100 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative sm:w-[42%] min-h-[140px] flex-shrink-0 overflow-hidden">
                  <img
                    src={h.image}
                    alt={h.name}
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm
                        ${h.type === "Girls Hostel" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-700"}`}
                    >
                      {h.type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                        h.ownership === "Campus Own Hostel"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-900/80 text-white backdrop-blur-sm"
                      }`}
                    >
                      {h.ownership}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-4 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">{h.name}</h3>
                      <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <MapPin size={11} className="text-orange-400" />
                        {h.distLabel}
                      </p>
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

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {shown.map((a) => (
                      <span
                        key={a}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100"
                      >
                        {a}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600">
                        +{extra}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                        Starting from
                      </p>
                      <p className="text-sm font-bold text-orange-500">{formatPrice(h.price)}</p>
                    </div>
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
            <div className="relative h-40">
              <img src={details.image} alt="" className="w-full h-full object-cover" />
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
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                    ${details.type === "Girls Hostel" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-700"}`}
                >
                  {details.type}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    details.ownership === "Campus Own Hostel"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {details.ownership}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mt-2">{details.name}</h3>
              <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                <MapPin size={12} className="text-orange-400" />
                {details.distLabel}
              </p>
              <p className="text-sm font-bold text-orange-500 mt-2">{formatPrice(details.price)}</p>

              {/* Room types */}
              {details.rooms_detail.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Room Types</p>
                  <div className="space-y-2">
                    {details.rooms_detail.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-700">{r.room_type}</span>
                        <span className="text-orange-600 font-semibold">
                          Rs {Number(r.monthly_rent).toLocaleString("en-PK")}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {details.amenities.map((a) => (
                  <span
                    key={a}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100"
                  >
                    {a}
                  </span>
                ))}
              </div>

              {/* Contact */}
              {details.contact && (
                <p className="mt-3 text-xs text-slate-500">
                  Contact: <span className="font-semibold text-gray-700">{details.contact}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
