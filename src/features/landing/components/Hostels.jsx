import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiCheckCircle, FiHome } from "react-icons/fi";
import { User, Venus } from "lucide-react";
import { API, fileUrl } from "../../../shared/api/client";

const TYPE_BADGE = {
  campus: "bg-emerald-600",
  private: "bg-[#ff6a00]",
};

function formatRent(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "";
  return num >= 1000 ? `${Number((num / 1000).toFixed(1))}k` : String(Math.round(num));
}

function toCard(hostel) {
  const minRent = formatRent(hostel.rent_min);
  const maxRent = formatRent(hostel.rent_max);

  return {
    id: hostel.id,
    name: hostel.name,
    isCampus: hostel.hostel_type === "university",
    typeLabel:
      hostel.type_label ||
      (hostel.hostel_type === "university" ? "Campus Hostel" : "Private Hostel"),
    Location: hostel.location || "",
    nearby: hostel.nearby_distance || "",
    minFee: minRent,
    maxFee: maxRent && maxRent !== minRent ? maxRent : "",
    image: hostel.cover_photo ? fileUrl(hostel.cover_photo) : null,
    gender:
      hostel.gender === "girls"
        ? "Girls Hostel"
        : hostel.gender === "boys"
          ? "Boys Hostel"
          : "Student Hostel",
    amenities: Array.isArray(hostel.amenities) ? hostel.amenities : [],
    rooms: hostel.rooms_count || 0,
    seats: hostel.seats_available || 0,
  };
}

function getGenderStyle(gender) {
  if (gender === "Girls Hostel") {
    return "bg-orange-500 hover:bg-orange-600";
  }
  return "bg-gray-800 hover:bg-black";
}

function HostelCard({ hostel, onViewDetails }) {
  const genderBg = getGenderStyle(hostel.gender);

  return (
    <article className="min-w-[280px] max-w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 hover:-translate-y-1.5 transition-all duration-300 scroll-snap-align-start flex flex-col group">

      <div className="relative h-44 overflow-hidden bg-slate-100">
        {hostel.image ? (
          <img
            src={hostel.image}
            alt={hostel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 via-slate-50 to-slate-100 text-slate-400">
            <FiHome size={30} />
            <span className="text-[11px] font-medium">Photos coming soon</span>
          </div>
        )}

        <span
          className={
            "absolute top-2.5 left-2.5 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-lg " +
            (hostel.isCampus ? TYPE_BADGE.campus : TYPE_BADGE.private)
          }
        >
          {hostel.typeLabel}
        </span>

        <span
          className={
            "absolute bottom-2.5 left-2.5 " +
            genderBg +
            " text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 transition-colors duration-200"
          }
        >
          {hostel.gender === "Girls Hostel" ? (
            <Venus style={{ width: "12px", height: "12px" }} strokeWidth={2.5} />
          ) : (
            <User style={{ width: "12px", height: "12px" }} strokeWidth={2.5} />
          )}
          {hostel.gender}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-[15px] leading-snug line-clamp-2 mb-1.5 group-hover:text-orange-600 transition-colors duration-200">
          {hostel.name}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
          <FiMapPin
            className="text-orange-400"
            style={{ width: "12px", height: "12px", flexShrink: 0 }}
          />
          <span className="line-clamp-1">{hostel.Location}</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-right">
            {hostel.minFee ? (
              <>
                <span className="text-lg font-extrabold text-orange-600">
                  ₨ {hostel.minFee}
                  {hostel.maxFee ? ` – ${hostel.maxFee}` : ""}
                </span>
                <span className="text-[10px] text-gray-400 font-normal">/mo</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-500">
                Rent on request
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {hostel.amenities.slice(0, 2).map(function (amenity, idx) {
            return (
              <span
                key={idx}
                className="flex items-center gap-1 bg-gray-50 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-gray-100 group-hover:border-orange-100 group-hover:bg-orange-50/50 transition-colors duration-200"
              >
                <FiCheckCircle
                  className="text-orange-500"
                  style={{ width: "10px", height: "10px" }}
                />
                {amenity}
              </span>
            );
          })}
          {hostel.amenities.length > 2 && (
            <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
              +{hostel.amenities.length - 2}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <button
            onClick={function () {
              onViewDetails(hostel);
            }}
            className="w-full py-2.5 border-2 border-orange-500 text-orange-500 text-sm font-semibold rounded-lg hover:bg-orange-500 hover:text-white hover:shadow-md hover:shadow-orange-200/50 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Hostels() {
  const navigate = useNavigate();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadHostels = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API}/api/hostels/public`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load hostels.");
        }

        if (!cancelled) {
          setHostels((data.hostels || []).map(toCard));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load hostels.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHostels();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewDetails = (hostel) => {
    navigate(`/hostels/${hostel.id}`);
  };

  const carousel = hostels.length >= 4;

  return (
    <section id="hostels" className="py-5 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        <div className="mb-5 flex justify-between items-end">
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
              Accommodation
            </p>
            <h2 className="text-2xl font-bold text-gray-800">
              Hostels on UniFinder
            </h2>
          </div>

        </div>

        <p className="text-sm text-gray-500 mb-4 max-w-2xl">
          Explore verified campus and private hostels, transparent mess menus, and
          convenient accommodation near your campus.
        </p>

        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Campus Hostel
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-orange-700">
            <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />
            Private Hostel
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex gap-3.5 overflow-hidden">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="min-w-[280px] max-w-[280px] animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white"
              >
                <div className="h-44 bg-slate-100" />
                <div className="space-y-3 p-4">
                  <div className="h-3.5 w-4/5 rounded bg-slate-100" />
                  <div className="h-3 w-3/5 rounded bg-slate-100" />
                  <div className="h-5 w-1/2 rounded bg-slate-100" />
                  <div className="h-9 w-full rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : hostels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <FiHome className="mx-auto mb-3 text-slate-300" size={32} />
            <p className="text-sm font-semibold text-slate-700">
              No approved hostels yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Hostels appear here automatically once owners complete their details
              and get approved.
            </p>
          </div>
        ) : (
          <>

            <style>{`
              .hostel-marquee {
                animation: hostel-scroll 35s linear infinite;
                will-change: transform;
              }

              @keyframes hostel-scroll {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
              }

              @media (prefers-reduced-motion: reduce) {
                .hostel-marquee { animation-duration: 90s; }
              }
            `}</style>

            <div className="overflow-hidden">
              {carousel ? (
                <div className="hostel-marquee flex w-max">
                  {[0, 1].map(function (group) {
                    return (
                      <div
                        key={group}
                        className="flex shrink-0 gap-3.5 pr-3.5"
                        aria-hidden={group === 1 ? "true" : undefined}
                      >
                        {hostels.map(function (hostel) {
                          return (
                            <HostelCard
                              key={`${group}-${hostel.id}`}
                              hostel={hostel}
                              onViewDetails={handleViewDetails}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-3.5 overflow-x-auto pb-2">
                  {hostels.map(function (hostel) {
                    return (
                      <HostelCard
                        key={hostel.id}
                        hostel={hostel}
                        onViewDetails={handleViewDetails}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {[
            "Physically Audited",
            "Zero Commission",
            "Room Previews",
            "Mess Menus Available",
          ].map(function (badge, idx) {
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"
              >
                <FiCheckCircle
                  className="text-orange-500"
                  style={{ width: "14px", height: "14px" }}
                />
                {badge}
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}
