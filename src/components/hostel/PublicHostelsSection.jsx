import { useEffect, useState } from "react";
import { BedDouble, Building2, MapPin, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { API, fileUrl } from "../../api/client";

const money = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `Rs ${amount.toLocaleString("en-PK")}`
    : "Rent on request";
};

function HostelCard({ hostel }) {
  const rent = hostel.rent_min
    ? `${money(hostel.rent_min)}${hostel.rent_max && hostel.rent_max !== hostel.rent_min ? ` – ${money(hostel.rent_max)}` : ""}`
    : "Rent on request";

  return (
    <Link
      to={`/hostels/${encodeURIComponent(hostel.id)}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-48 bg-slate-100">
        {hostel.cover_photo ? (
          <img
            src={fileUrl(hostel.cover_photo)}
            alt={hostel.name}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <Building2 size={40} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700">
          {hostel.type_label || "Hostel"}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="truncate text-base font-bold text-slate-900">{hostel.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">
              {hostel.location || hostel.campus_name || hostel.campus_city || "Location not provided"}
            </span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Wallet size={14} className="text-orange-500" /> {rent}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble size={14} className="text-orange-500" />
            {Number(hostel.rooms_count) || 0} rooms
          </span>
        </div>
        {hostel.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hostel.amenities.slice(0, 3).map((amenity) => (
              <span key={amenity} className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] text-orange-700">
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function PublicHostelsSection({
  universityId,
  title = "Hostels for students",
  description = "Explore verified hostel listings, room availability, rent and amenities.",
}) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedUniversityId, setLoadedUniversityId] = useState(null);
  const requestUniversityId = String(universityId || "");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (requestUniversityId) params.set("university_id", requestUniversityId);
    const query = params.toString();

    fetch(`${API}/api/hostels/public${query ? `?${query}` : ""}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not load hostels.");
        return Array.isArray(data.hostels) ? data.hostels : [];
      })
      .then((items) => {
        setHostels(items);
        setError("");
        setLoadedUniversityId(requestUniversityId);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Could not load hostels.");
          setLoadedUniversityId(requestUniversityId);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [requestUniversityId]);

  const isLoading = loading || loadedUniversityId !== requestUniversityId;
  const visibleError = loadedUniversityId === requestUniversityId ? error : "";
  return (
    <section className="mx-auto max-w-[1440px] space-y-5 px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </header>

      {visibleError && (
        <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {visibleError}
        </p>
      )}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : !visibleError && hostels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Building2 className="mx-auto text-slate-300" size={32} />
          <p className="mt-3 font-semibold text-slate-700">No live hostel listings yet</p>
          <p className="mt-1 text-sm text-slate-500">Approved hostels will appear here when their details are complete.</p>
        </div>
      ) : !visibleError ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.map((hostel) => <HostelCard key={hostel.id} hostel={hostel} />)}
        </div>
      ) : null}
      {!isLoading && hostels.length > 0 && (
        <p className="text-xs text-slate-400">{hostels.length} published hostel{hostels.length === 1 ? "" : "s"}</p>
      )}
    </section>
  );
}
