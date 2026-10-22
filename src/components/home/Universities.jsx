import React, { useState, useEffect, useRef } from "react";
import {
  FiMapPin,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { listUniversities } from "../../api/university";
import { fileUrl } from "../../api/client";
import { toast } from "react-toastify";

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/unifinder-uni-default/600/400.jpg";

const resolveUrl = (p) => {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `http://localhost:5000${p.startsWith("/") ? p : `/${p}`}`;
};

function UniversityCard({ uni, isFav, onToggleFav, onExplore }) {
  const logoSrc = resolveUrl(uni.logoUrl);
  const bannerSrc = resolveUrl(uni.bannerUrl) || FALLBACK_IMAGE;
  const totalCampuses = uni.totalCampuses ?? uni.total_campuses ?? 1;

  return (
    <article className="min-w-[280px] max-w-[280px] sm:min-w-[300px] sm:max-w-[300px] bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 scroll-snap-align-start flex flex-col group">
      {/* ── Top Image Container ── */}
      <div className="relative h-44 overflow-hidden bg-slate-100 shrink-0">
        <img
          src={bannerSrc}
          alt={uni.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* 1. University Logo (Top Left Corner) */}
        <div className="absolute top-3 left-3 z-10">
          {logoSrc ? (
            <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md border border-white/80 overflow-hidden flex items-center justify-center">
              <img
                src={logoSrc}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-white/95 backdrop-blur-sm shadow-md border border-white/80 flex items-center justify-center text-orange-600 font-bold text-xs">
              {(uni.name || "").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* 2. University Type (Top Right Corner — Private/Public) */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-sm ${(uni.type || "").toLowerCase() === "public"
                ? "bg-blue-600/90 text-white"
                : "bg-orange-500 text-white"
              }`}
          >
            {uni.type || "Private"}
          </span>
        </div>

        {/* Favorite Heart Button (Bottom Right) */}
        <button
          onClick={(e) => onToggleFav(uni.id, e)}
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-all duration-150 active:scale-95 z-10"
          aria-label="Toggle favorite"
        >
          <FiHeart
            className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
          />
        </button>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          {/* University HEC Name (handled for long names) */}
          <h3
            title={uni.name}
            className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 min-h-[42px] mb-2 group-hover:text-orange-600 transition-colors"
          >
            {uni.name}
          </h3>

          {/* Details Row: Province + Total Campuses */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            {/* Province */}
            <div className="flex items-center gap-1.5 truncate">
              <FiMapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="truncate font-medium text-slate-700">
                {uni.province || uni.city || "Punjab"}
              </span>
            </div>

            {/* Total Campuses */}
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">
                {totalCampuses} {totalCampuses === 1 ? "Campus" : "Campuses"}
              </span>
            </div>
          </div>
        </div>

        {/* Button: "View Details" */}
        <div className="pt-2">
          <button
            onClick={() => onExplore(uni.id)}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-orange-500/25 transition-all duration-150 active:scale-[0.98]"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <article className="min-w-[280px] max-w-[280px] sm:min-w-[300px] sm:max-w-[300px] bg-white rounded-2xl overflow-hidden border border-gray-100 scroll-snap-align-start animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="h-10 bg-gray-100 rounded-xl w-full mt-2" />
      </div>
    </article>
  );
}

export default function Universities() {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    const fetchUniversities = async () => {
      setLoading(true);
      try {
        const data = await listUniversities();
        if (Array.isArray(data) && data.length > 0) {
          setUniversities(
            data.map((u) => ({
              id: u.id,
              name: u.name,
              logoUrl: u.logo_url,
              bannerUrl: u.banner_url || u.cover_image,
              province: u.province || "Punjab",
              city: u.city || "Pakistan",
              type: u.university_type || u.type || "Private",
              totalCampuses: u.total_campuses || 1,
            })),
          );
        } else {
          setUniversities([]);
        }
      } catch (error) {
        console.error("fetchUniversities error:", error);
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    // Compute the new value before touching state so the toast fires exactly once,
    // not inside the updater (which React Strict Mode calls twice in development).
    const willBeFav = !favorites[id];
    setFavorites((prev) => ({ ...prev, [id]: willBeFav }));
    toast.success(
      willBeFav
        ? "Added to saved universities!"
        : "Removed from saved universities",
      { toastId: `fav-${id}` }   // prevents any duplicate if called twice somehow
    );
  };

  const handleExplore = (id) => {
    navigate("/universities/" + id);
  };

  const scroll = (direction) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({
        left: direction * 314,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="universities" className="py-5 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-5 flex justify-between items-end">
          <div>
            <p className="text-xs font-extrabold text-orange-500 uppercase tracking-widest mb-1">
              All Institutions
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition active:scale-95 shadow-sm"
              aria-label="Scroll left"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition active:scale-95 shadow-sm"
              aria-label="Scroll right"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden pb-4">
            {[1, 2, 3, 4].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : universities.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-gray-100">
            No approved universities found.
          </div>
        ) : (
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {universities.map((uni) => (
              <UniversityCard
                key={uni.id}
                uni={uni}
                isFav={favorites[uni.id] || false}
                onToggleFav={toggleFavorite}
                onExplore={handleExplore}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

