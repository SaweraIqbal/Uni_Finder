import { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCampusesForUniversity } from "../../data/campuses";
import { API } from "../../api/client";

const CAMPUS_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1562774053-701939374585?w=900&auto=format&fit=crop&q=80";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getAdmissionStatus(campus) {
  // Manual override wins over date logic
  const override = campus?.admission_status_override;
  if (override === "open")    return { type: "open" };
  if (override === "closed")  return { type: "closed" };
  if (override === "unknown") return { type: "unknown" };

  if (campus?.admission_open && campus?.admission_close) {
    const open  = startOfDay(campus.admission_open);
    const close = startOfDay(campus.admission_close);

    if (!Number.isNaN(open.getTime()) && !Number.isNaN(close.getTime())) {
      const today = startOfDay(new Date());

      if (today > close) return { type: "closed" };

      if (today >= open) {
        const daysRemaining = Math.floor((close - today) / MS_PER_DAY);
        if (daysRemaining <= 14) return { type: "urgent", days: daysRemaining };
        return { type: "open" };
      }

      // Before open date — admission not started yet
      return { type: "upcoming" };
    }
  }

  // Fallback: honour the static admissionStatus string (used by static data)
  const staticStatus = campus?.admissionStatus;
  if (staticStatus === "open")   return { type: "open" };
  if (staticStatus === "closed") return { type: "closed" };

  return { type: "unknown" };
}

function AdmissionBadge({ campus }) {
  const status = getAdmissionStatus(campus);

  if (status.type === "open") {
    return (
      <span className="inline-flex items-center gap-1 bg-green-500 text-white text-[11px] font-medium rounded-full px-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
        Admissions Open
      </span>
    );
  }

  if (status.type === "urgent") {
    const label = status.days === 0 ? "Closes Today" :
                  status.days === 1 ? "1 Day Left"   : `${status.days} Days Left`;
    return (
      <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[11px] font-semibold rounded-full px-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
        {label}
      </span>
    );
  }

  if (status.type === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 bg-blue-500 text-white text-[11px] font-medium rounded-full px-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
        Opening Soon
      </span>
    );
  }

  if (status.type === "closed") {
    return (
      <span className="inline-flex items-center gap-1 bg-gray-400 text-white text-[11px] font-medium rounded-full px-2.5 py-0.5">
        Admissions Closed
      </span>
    );
  }

  // unknown — no dates set yet, show a neutral pill
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-400 text-[11px] font-medium rounded-full px-2.5 py-0.5">
      Status Not Set
    </span>
  );
}

function CampusCard({ campus, onViewDetails }) {
  const img = campus.cover_image || CAMPUS_DEFAULT_IMAGE;
  const location = [campus.city, campus.province].filter(Boolean).join(", ");

  return (
    <article className="min-w-[280px] max-w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1 transition-all duration-200 scroll-snap-align-start flex flex-col">
      <div className="relative h-44 overflow-hidden">
        <img
          src={img}
          alt={campus.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = CAMPUS_DEFAULT_IMAGE;
          }}
        />
        <span className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
          {campus.is_main ? "Main Campus" : (campus.campus_type || "City Campus")}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-[15px] mb-1.5">
          {campus.name}
        </h3>

        {location && (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5 flex-shrink-0 text-orange-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {location}
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {campus.students && (
            <span className="text-gray-500 text-xs">
              {campus.students} Students
            </span>
          )}
          <AdmissionBadge campus={campus} />
        </div>

        <button
          onClick={() => onViewDetails(campus.id)}
          className="mt-auto w-full py-2 border border-orange-500 text-orange-500 text-sm font-medium rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-150 active:scale-95"
        >
          View Campus Details
        </button>
      </div>
    </article>
  );
}

export default function UniversityCampuses({ universityId }) {
  const navigate = useNavigate();
  const trackRef = useRef(null);

  // Static snapshot — shown immediately (or as fallback if API fails)
  const staticCampuses = useMemo(
    () => getCampusesForUniversity(universityId || "ucp"),
    [universityId]
  );

  const [liveCampuses, setLiveCampuses] = useState(null); // null = not yet fetched
  const [fetched,      setFetched]      = useState(false);

  useEffect(() => {
    if (!universityId) return;
    setLiveCampuses(null);
    setFetched(false);

    fetch(`${API}/api/campuses/university/${encodeURIComponent(universityId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setLiveCampuses(Array.isArray(data) ? data : []);
        setFetched(true);
      })
      .catch(() => {
        setLiveCampuses([]);
        setFetched(true);
      });
  }, [universityId]);

  // Normalize live API campus rows to match what CampusCard expects
  const normalizeLive = (c) => {
    // campus_type can be "Main Campus", "main", "City Campus", "city", null etc.
    const type = (c.campus_type || "").toLowerCase();
    const isMain =
      c.is_main === 1 || c.is_main === true ||
      type === "main" || type === "main campus";

    // Resolve cover image — prefix API base if it's a relative path
    let coverImg = c.cover_image || c.university_banner || null;
    if (coverImg && !/^https?:\/\//i.test(coverImg)) {
      coverImg = `${API}${coverImg}`;
    }

    return {
      ...c,
      name:        c.name || c.campusName || "Campus",
      cover_image: coverImg,
      is_main:     isMain,
      // campus_type display label — normalise to human-readable
      campus_type: isMain ? "Main Campus" : (c.campus_type || "City Campus"),
    };
  };

  // Prefer live data; fall back to static while loading or when live is empty
  const campuses =
    liveCampuses && liveCampuses.length > 0
      ? liveCampuses.map(normalizeLive)
      : staticCampuses;

  if (fetched && campuses.length === 0) {
    // Show a placeholder so the section heading always appears
    return (
      <section className="py-12 bg-gray-50" aria-label="Explore campuses">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Explore Our Campuses</h2>
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center gap-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p className="text-slate-500 text-sm mt-1">No campus information available yet.</p>
          </div>
        </div>
      </section>
    );
  }
  if (!fetched && campuses.length === 0) return null;

  const scroll = (direction) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: direction * 294, behavior: "smooth" });
    }
  };

  const handleViewDetails = (campusId) => {
    navigate(`/campus-detail?id=${campusId}`);
  };

  return (
    <section
      className="py-12 bg-gray-50 overflow-hidden"
      aria-label="Explore campuses"
    >
      <div className="max-w-7xl mx-auto px-6 mb-5 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Explore Our Campuses
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition active:scale-95"
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition active:scale-95"
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-3.5 overflow-x-auto px-6 pb-4 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {campuses.map((campus) => (
          <CampusCard
            key={campus.id}
            campus={campus}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    </section>
  );
}
