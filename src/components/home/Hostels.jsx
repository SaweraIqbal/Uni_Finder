import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiCheckCircle, FiHome } from "react-icons/fi";
import { User, Venus } from "lucide-react";
import { API, fileUrl } from "../../api/client";

const TYPE_BADGE = {
  campus: "bg-emerald-600",
  private: "bg-[#ff6a00]",
};

function formatRent(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return amount >= 1000
    ? `${Number((amount / 1000).toFixed(1))}k`
    : String(Math.round(amount));
}

function toCard(hostel) {
  const minFee = formatRent(hostel.rent_min);
  const maxRent = formatRent(hostel.rent_max);
  return {
    ...hostel,
    isCampus: hostel.hostel_type === "university",
    typeLabel: hostel.type_label ||
      (hostel.hostel_type === "university" ? "Campus Hostel" : "Private Hostel"),
    Location: hostel.location || hostel.campus_name || hostel.campus_city || "",
    nearby: hostel.nearby_distance || "",
    minFee,
    maxFee: maxRent && maxRent !== minFee ? maxRent : "",
    image: hostel.cover_photo ? fileUrl(hostel.cover_photo) : null,
    gender: hostel.gender === "girls"
      ? "Girls Hostel"
      : hostel.gender === "boys"
        ? "Boys Hostel"
        : "Student Hostel",
    amenities: Array.isArray(hostel.amenities) ? hostel.amenities : [],
  };
}

function getGenderStyle(gender) {
  return gender === "Girls Hostel"
    ? "bg-orange-500 hover:bg-orange-600"
    : "bg-gray-800 hover:bg-black";
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
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 via-slate-50 to-slate-100 text-slate-400">
            <FiHome size={30} />
            <span className="text-[11px] font-medium">Photos coming soon</span>
          </div>
        )}

        <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg ${hostel.isCampus ? TYPE_BADGE.campus : TYPE_BADGE.private}`}>
          {hostel.typeLabel}
        </span>
        <span className={`absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-lg ${genderBg}`}>
          {hostel.gender === "Girls Hostel"
            ? <Venus size={12} strokeWidth={2.5} />
            : <User size={12} strokeWidth={2.5} />}
          {hostel.gender}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-gray-800 transition-colors group-hover:text-orange-600">
          {hostel.name}
        </h3>
        <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
          <FiMapPin className="shrink-0 text-orange-400" size={12} />
          <span className="line-clamp-1">{hostel.Location || "Location not provided"}</span>
        </div>
        {hostel.nearby && (
          <p className="mb-2 text-[11px] text-gray-400">{hostel.nearby} from campus</p>
        )}

        <div className="mb-3 flex items-center justify-between">
          <div className="text-right">
            {hostel.minFee ? (
              <>
                <span className="text-lg font-extrabold text-orange-600">
                  ₨ {hostel.minFee}{hostel.maxFee ? ` – ${hostel.maxFee}` : ""}
                </span>
                <span className="text-[10px] font-normal text-gray-400">/mo</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-500">Rent on request</span>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          {hostel.amenities.slice(0, 2).map((amenity, index) => (
            <span key={`${amenity}-${index}`} className="flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              <FiCheckCircle className="text-orange-500" size={10} />
              {amenity}
            </span>
          ))}
          {hostel.amenities.length > 2 && (
            <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
              +{hostel.amenities.length - 2}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onViewDetails(hostel)}
          className="mt-auto w-full cursor-pointer rounded-lg border-2 border-orange-500 py-2.5 text-sm font-semibold text-orange-500 transition-all hover:bg-orange-500 hover:text-white active:scale-95"
        >
          View Details
        </button>
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
    const controller = new AbortController();
    fetch(`${API}/api/hostels/public`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not load hostels.");
        return Array.isArray(data.hostels) ? data.hostels.map(toCard) : [];
      })
      .then((items) => {
        setHostels(items);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Could not load hostels.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleViewDetails = (hostel) => {
    navigate(`/hostels/${encodeURIComponent(hostel.id)}`);
  };
  const carousel = hostels.length >= 4;

  return (
    <section id="hostels" className="overflow-hidden bg-gray-50 py-5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
            Accommodation
          </p>
          <h2 className="text-2xl font-bold text-gray-800">Hostels on UniFinder</h2>
        </div>

        <p className="mb-4 max-w-2xl text-sm text-gray-500">
          Explore published campus and private hostel listings, including room prices,
          amenities and accommodation details.
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
          <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex gap-3.5 overflow-hidden">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="min-w-[280px] max-w-[280px] animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white">
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
        ) : !error && hostels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <FiHome className="mx-auto mb-3 text-slate-300" size={32} />
            <p className="text-sm font-semibold text-slate-700">No published hostels yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Approved listings will appear here once their required details are complete.
            </p>
          </div>
        ) : !error ? (
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
                  {[0, 1].map((group) => (
                    <div key={group} className="flex shrink-0 gap-3.5 pr-3.5" aria-hidden={group === 1 ? "true" : undefined}>
                      {hostels.map((hostel) => (
                        <HostelCard
                          key={`${group}-${hostel.id}`}
                          hostel={hostel}
                          onViewDetails={handleViewDetails}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3.5 overflow-x-auto pb-2">
                  {hostels.map((hostel) => (
                    <HostelCard
                      key={hostel.id}
                      hostel={hostel}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
