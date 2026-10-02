// C:\Users\Track Computers\Downloads\testfolder\uni-finder\src\components\Universities.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  FiMapPin,
  FiStar,
  FiHeart,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { listUniversities } from "../api/university";
import { fileUrl } from "../api/client";
import { toast } from "react-toastify";

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/unifinder-uni-default/600/400.jpg";

const initialMockUniversities = [
  {
    id: 1,
    name: "LUMS (Lahore University of Management Sciences)",
    img: "https://picsum.photos/seed/lums/600/400.jpg",
    city: "Lahore",
    programs: ["BS CS", "BBA", "BS Economics", "LLB"],
    minFee: "200k",
    maxFee: "300k",
    verified: true,
    type: "Private",
    admissionsOpen: true,
  },
  {
    id: 2,
    name: "FAST-NUCES",
    img: "https://picsum.photos/seed/fast/600/400.jpg",
    city: "Lahore",
    programs: ["BS CS", "BS Software Eng", "BS AI", "BS Cyber Security"],
    minFee: "100k",
    maxFee: "160k",
    verified: true,
    type: "Public",
    admissionsOpen: true,
  },
  {
    id: 3,
    name: "NUST Islamabad",
    img: "https://picsum.photos/seed/nust/600/400.jpg",
    city: "Islamabad",
    programs: ["BS CS", "Mechanical Eng", "BBA", "Biotechnology"],
    minFee: "150k",
    maxFee: "220k",
    verified: true,
    type: "Public",
    admissionsOpen: true,
  },
  {
    id: 4,
    name: "Riphah International University",
    img: "https://picsum.photos/seed/riphah/600/400.jpg",
    city: "Islamabad",
    programs: ["MBBS", "Pharm-D", "BS CS", "DPT"],
    minFee: "90k",
    maxFee: "150k",
    verified: true,
    type: "Private",
    admissionsOpen: false,
  },
  {
    id: 5,
    name: "COMSATS University",
    img: "https://picsum.photos/seed/comsats/600/400.jpg",
    city: "Islamabad",
    programs: ["BS Software Eng", "BS Telecom", "BBA"],
    minFee: "80k",
    maxFee: "130k",
    verified: true,
    type: "Public",
    admissionsOpen: true,
  },
  {
    id: 6,
    name: "Institute of Business Administration (IBA)",
    img: "https://picsum.photos/seed/iba/600/400.jpg",
    city: "Karachi",
    programs: ["BBA", "BS Accounting", "BS CS"],
    minFee: "180k",
    maxFee: "260k",
    verified: true,
    type: "Private",
    admissionsOpen: true,
  },
];

function UniversityCard({ uni, isFav, onToggleFav, onExplore }) {
  const visiblePrograms = uni.programs.slice(0, 2);
  const extraCount = uni.programs.length - 2;

  return (
    <article className="min-w-[280px] max-w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1 transition-all duration-200 scroll-snap-align-start flex flex-col">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={uni.img}
          alt={uni.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Top Right — Admissions Open */}
        {uni.admissionsOpen && (
          <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
            <FiCheckCircle style={{ width: "10px", height: "10px" }} />{" "}
            Admissions Open
          </span>
        )}

        {/* Heart — moved to bottom right */}
        <button
          onClick={(e) => onToggleFav(uni.id, e)}
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-all duration-150 active:scale-95"
          aria-label="Toggle favorite"
        >
          <FiHeart
            className={`w-4 h-4 transition-colors ${
              isFav ? "fill-red-500 text-red-500" : "text-gray-400"
            }`}
          />
        </button>

        <span className="absolute bottom-2.5 left-2.5 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
          {uni.type}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-[15px] leading-snug line-clamp-2 mb-1.5">
          {uni.name}
        </h3>

        <div className="flex flex-wrap gap-1 mb-3">
          {visiblePrograms.map((p, idx) => (
            <span
              key={idx}
              className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md"
            >
              {p}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
              +{extraCount} more
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
          <button
            onClick={() => onExplore(uni.id)}
            className="w-full py-2 border border-orange-500 text-orange-500 text-sm font-medium rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-150 active:scale-95"
          >
            Explore University
          </button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <article className="min-w-[280px] max-w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 scroll-snap-align-start animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="flex gap-1">
          <div className="h-5 bg-gray-100 rounded w-14" />
          <div className="h-5 bg-gray-100 rounded w-14" />
        </div>
        <div className="h-8 bg-gray-100 rounded-lg w-full mt-2" />
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
              img: u.logo_url ? fileUrl(u.logo_url) : FALLBACK_IMAGE,
              city: u.city || "Pakistan",
              programs: u.programs || ["BS CS", "BBA", "Engineering"],
              type: u.type || "Private",
              admissionsOpen: u.admissions_open !== false,
            })),
          );
        } else {
          setUniversities(initialMockUniversities);
        }
      } catch (error) {
        setUniversities(initialMockUniversities);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const isFav = !prev[id];
      toast.success(
        isFav
          ? "Added to saved universities!"
          : "Removed from saved universities",
      );
      return { ...prev, [id]: isFav };
    });
  };

  const handleExplore = (id) => {
    navigate("/universities/" + id);
  };

  const scroll = (direction) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({
        left: direction * 294,
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
            {/* <h2 className="text-2xl font-bold text-gray-800">Universities</h2> */}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition active:scale-95"
              aria-label="Scroll left"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition active:scale-95"
              aria-label="Scroll right"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3.5 overflow-hidden pb-4">
            {[1, 2, 3, 4].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : (
          <div
            ref={trackRef}
            className="flex gap-3.5 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
