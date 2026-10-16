import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CAMPUS_DEFAULT_IMAGE, getCampusDetail } from "../api/campus";
import { fileUrl } from "../api/client";
import { getCampusById } from "../data/campuses";
import { findUniversity } from "../data/universities";
import { sectorLabel } from "../components/shared/heroSection";
import ProgramsOffered from "../components/campus/ProgramsOffered";
import CampusTransport from "../components/campus/CampusTransport";
import Scholarships from "../components/campus/Scholarships";
import CampusFacilities from "../components/campus/CampusFacilities";
import NearbyHostels from "../components/campus/NearbyHostels";

import programIcon from "../assets/program.png";
import activeUsersIcon from "../assets/activeusers.png";
import establishedIcon from "../assets/established.png";
import employmentIcon from "../assets/employmentrate.png";

// --- helpers ---
function inferLevel(name = "") {
  const n = name.toLowerCase();
  if (n.includes("ph.d") || n.includes("phd")) return "PhD";
  if (
    n.includes("master") ||
    n.includes("mba") ||
    n.startsWith("ms ") ||
    n.includes("(ms")
  )
    return "MS";
  return "UG";
}
function inferDuration(level) {
  if (level === "PhD") return "3 Years";
  if (level === "MS") return "2 Years";
  return "4 Years";
}
function toPageCampus(raw) {
  if (!raw) return null;
  const programs = (raw.programs || []).map((p, i) => {
    if (typeof p !== "string") return p;
    const level = inferLevel(p);
    return {
      name: p,
      level,
      duration: inferDuration(level),
      accent: i % 2 ? "blue" : "orange",
    };
  });
  const uni = raw.universityId ? findUniversity(raw.universityId) : null;
  return {
    ...raw,
    name: raw.campusName || raw.name,
    university_name: raw.universityName,
    programs,
    images: Array.isArray(raw.images) && raw.images.length
      ? raw.images
      : raw.cover_image || raw.coverImage
        ? [{ image_url: raw.cover_image || raw.coverImage }]
        : [],
    hec_rank: raw.hec_rank ?? raw.hecRank ?? uni?.hec_rank,
    sector: raw.sector ?? uni?.sector ?? raw.universityType,
    university_employment_rate: raw.university_employment_rate ?? uni?.employment_rate,
    established: raw.established ?? raw.university_established_year ?? uni?.established_year,
  };
}
function mediaUrl(url) {
  if (!url) return CAMPUS_DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(url)) return url;
  return fileUrl(url) || CAMPUS_DEFAULT_IMAGE;
}
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// --- SVG Icons ---
const IconArrowLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconMapPin = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F97316"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconPhone = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F97316"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55a16 16 0 0 0 6 6l1.27-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconMail = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F97316"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconLocation = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F97316"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconExternalLink = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const IconArrowRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconX = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconStar = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill={filled ? "#F97316" : "none"}
    stroke="#F97316"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// --- Hero Section ---
function HeroSection({ campus, heroImage, onBack }) {
  const bannerRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const location = [campus.area, campus.city, campus.province]
    .filter(Boolean)
    .join(", ");
  const isMain =
    campus.isMain ||
    campus.campusCategory === "Main Campus" ||
    campus._mainFlag ||
    campus.is_main;
  const sector = sectorLabel(campus.sector || campus.universityType || "");
  const hecRank = campus.hec_rank ?? campus.hecRank ?? campus.ranking;
  const title = campus.university_name
    ? `${campus.university_name} - ${campus.name}`
    : campus.name;

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (bannerRef.current)
      bannerRef.current.style.transform = `translateY(${scrollY * 0.25}px)`;
  }, [scrollY]);

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "clamp(220px, 32vw, 400px)" }}
      role="banner"
    >
      <div
        ref={bannerRef}
        className="absolute will-change-transform"
        style={{
          inset: "-60px 0 -60px 0",
          backgroundImage: `url('${heroImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.40) 45%, rgba(0,0,0,0.10) 100%)",
        }}
        aria-hidden="true"
      />
      <button
        onClick={onBack}
        aria-label="Go back"
        className="absolute top-4 left-5 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white border border-white/20 transition-all duration-200 hover:scale-110 hover:bg-white/30 hover:shadow-lg shadow-sm"
        style={{
          background: "rgba(255,255,255,0.16)",
          backdropFilter: "blur(8px)",
        }}
      >
        <IconArrowLeft />
      </button>
      {isMain && (
        <span className="absolute top-4 right-5 z-20 bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
          Main Campus
        </span>
      )}
      <div className="relative z-10 h-full flex flex-col justify-end">
        <div className="max-w-6xl mx-auto w-full px-6 md:px-5 lg:px-7 pb-20">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {hecRank != null && (
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 21h8M12 17V3M5 8l7-5 7 5" />
              </svg>
                HEC #{hecRank}
              </span>
            )}
            {(campus.sector || campus.universityType) && (
              <span className="inline-flex items-center bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 shadow-sm">
                {sector}
              </span>
            )}
          </div>
          <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight drop-shadow-md">
            {title}
          </h1>
          {location && (
            <div className="flex items-center gap-1.5 mt-2">
              <IconMapPin />
              <span className="text-sm text-white/80 font-medium">
                {location}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// --- Stat Card ---
function StatCard({ stat, isVisible, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`flex flex-col justify-between gap-3 p-5 bg-white border border-slate-200 rounded-2xl cursor-default transition-all duration-300 ease-in-out ${hovered ? "-translate-y-1 shadow-lg shadow-orange-100/60 border-orange-200" : "shadow-sm hover:shadow-md"} ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}
      role="article"
      aria-label={`${stat.label}: ${stat.value}${stat.suffix || ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-tight">
          {stat.label}
        </p>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${hovered ? "bg-orange-50 border-orange-200 scale-110" : "bg-gray-50 border-slate-200/60"}`}
        >
          <img
            src={stat.iconSrc}
            alt={stat.iconAlt}
            className="w-[22px] h-[22px] object-contain"
          />
        </div>
      </div>
      <div className="text-[26px] font-bold leading-none text-slate-800 tabular-nums">
        {stat.value}
        {stat.suffix && (
          <span className="text-orange-500 font-bold">{stat.suffix}</span>
        )}
      </div>
    </div>
  );
}

function CampusStats({ campus, className = "" }) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);
  const programCount = (campus.programs || []).length;
  const stats = [
    {
      id: "programs",
      iconSrc: programIcon,
      iconAlt: "Published programs",
      value: String(programCount),
      label: "Published Programs",
    },
    {
      id: "established",
      iconSrc: establishedIcon,
      iconAlt: "Established year",
      value: campus.established ? String(campus.established) : "Unknown",
      label: "Established Year",
    },
    {
      id: "students",
      iconSrc: activeUsersIcon,
      iconAlt: "Active students",
      value: campus.students ? String(campus.students) : "Unknown",
      label: "Active Students",
    },
  ];
  if (campus.university_employment_rate) {
    stats.push({
      id: "employment_rate",
      iconSrc: employmentIcon,
      iconAlt: "University employment rate",
      value: String(campus.university_employment_rate).replace(/[^0-9]/g, ""),
      suffix: "%",
      label: "University Employment Rate",
    });
  }
  return (
    <section
      ref={sectionRef}
      className={`py-0 bg-transparent ${className}`}
      aria-label="Campus statistics"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-5 lg:px-7">
        <div className={`grid grid-cols-2 ${stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-4`}>
          {stats.map((s, i) => (
            <StatCard
              key={s.id}
              stat={s}
              delay={i * 70}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
// --- Tabs ---
const TAB_IDS = [
  "overview",
  "programs",
  "admission-procedure",
  "admissions-info",
  "scholarships",
  "facilities",
  "transport",
  "gallery",
  "societies",
  "hostels",
  // "reviews",
];
function Tabs({ active, setActive }) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 overflow-x-auto">
      <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 flex gap-1">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`py-4 px-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 capitalize border-b-2 ${
              active === id
                ? "text-orange-500 border-orange-500"
                : "text-gray-500 border-transparent hover:text-orange-400 hover:border-orange-200"
            }`}
          >
            {({
              "admission-procedure": "Admission Procedure",
              "admissions-info": "Admissions Information",
            })[id] || id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Gallery ---

function GalleryModal({ images, onClose }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loaded, setLoaded] = useState({});
  const [errored, setErrored] = useState({});
  const [closing, setClosing] = useState(false);
  const [lbClosing, setLbClosing] = useState(false);
  const validImages = images.filter((_, i) => !errored[i]);
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 280);
  };
  const openLightbox = (i) => {
    setLbClosing(false);
    setLightboxIndex(i);
  };
  const closeLightbox = () => {
    setLbClosing(true);
    setTimeout(() => setLightboxIndex(null), 250);
  };
  const goPrev = () => {
    setLbClosing(false);
    setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  };
  const goNext = () => {
    setLbClosing(false);
    setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  };
  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex !== null) {
        if (e.key === "ArrowLeft") goPrev();
        else if (e.key === "ArrowRight") goNext();
        else if (e.key === "Escape") closeLightbox();
      } else {
        if (e.key === "Escape") handleClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  const FallbackImage = ({ label }) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 rounded-xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-1 opacity-50"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)" }}
      onClick={handleClose}
    >
      {lightboxIndex === null && (
        <div
          className={`relative bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col transition-all duration-300 ease-out ${closing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Campus Gallery
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {validImages.length} photos &middot; Click to expand
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
              aria-label="Close gallery"
            >
              <IconX />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img, i) =>
                errored[i] ? (
                  <div
                    key={i}
                    className="aspect-[4/3] rounded-xl overflow-hidden"
                  >
                    <FallbackImage label="Unavailable" />
                  </div>
                ) : (
                  <div
                    key={i}
                    className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 cursor-pointer group relative"
                    onClick={() => openLightbox(i)}
                  >
                    {!loaded[i] && (
                      <div className="absolute inset-0 animate-pulse bg-gray-200 rounded-xl" />
                    )}
                    <img
                      src={img}
                      alt={`Campus photo ${i + 1}`}
                      loading="lazy"
                      onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
                      onError={() => setErrored((p) => ({ ...p, [i]: true }))}
                      className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90 ${loaded[i] ? "opacity-100" : "opacity-0"}`}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
      {lightboxIndex !== null && (
        <div
          className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/95 transition-opacity duration-250 ${lbClosing ? "opacity-0" : "opacity-100"}`}
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-70 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white hover:scale-110 transition-all duration-200"
            aria-label="Close lightbox"
          >
            <IconX />
          </button>
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-70 bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full">
            {lightboxIndex + 1} / {images.length}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-3 md:left-6 z-70 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/25 hover:text-white hover:scale-110 transition-all duration-200"
            aria-label="Previous photo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {errored[lightboxIndex] ? (
              <FallbackImage label="Photo unavailable" />
            ) : (
              <img
                src={images[lightboxIndex]}
                alt={`Campus photo ${lightboxIndex + 1}`}
                onError={() =>
                  setErrored((p) => ({ ...p, [lightboxIndex]: true }))
                }
                className={`max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-300 ease-out ${lbClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
              />
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-3 md:right-6 z-70 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/25 hover:text-white hover:scale-110 transition-all duration-200"
            aria-label="Next photo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-70 flex gap-2 px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
            {images.map((img, i) =>
              errored[i] ? null : (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLbClosing(false);
                    setLightboxIndex(i);
                  }}
                  className={`w-12 h-9 rounded-md overflow-hidden flex-shrink-0 transition-all duration-200 border-2 ${i === lightboxIndex ? "border-white scale-110 opacity-100" : "border-transparent opacity-50 hover:opacity-80"}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Overview Tab ---
function ExpandableText({ text }) {
  const paragraphRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const paragraph = paragraphRef.current;
    if (!paragraph || expanded) return;

    const measure = () => setCanExpand(paragraph.scrollHeight > paragraph.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paragraph);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <>
      <p
        ref={paragraphRef}
        className="text-sm leading-relaxed text-gray-600 whitespace-pre-line"
        style={expanded ? undefined : {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 4,
          overflow: "hidden",
        }}
      >
        {text}
      </p>
      {canExpand && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </>
  );
}

function OverviewTab({ campus, heroImage }) {
  const [ref, v] = useReveal();
  const [showGallery, setShowGallery] = useState(false);
  const email = campus.email;
  const phone = campus.phone;
  const transportRoutes = campus.facilities?.transport_routes || [];
  const transportFeeAvailable = Boolean(String(campus.facilities?.transport_fee || "").trim());
  const mapUrl =
    campus.lat && campus.lng
      ? `https://www.google.com/maps?q=${campus.lat},${campus.lng}`
      : `https://www.google.com/maps/search/${encodeURIComponent(campus.name)}`;
  const established = campus.established;
  const galleryImages = (campus.images || [])
    .map((image) => mediaUrl(image.image_url))
    .filter(Boolean);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xl font-bold text-gray-800">
                  About this Campus
                </h2>
              </div>
              <ExpandableText text={campus.description?.trim() || "Campus information has not been added yet."} />
            </div>

            {campus.why_choose?.trim() && (
              <div className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-bold text-gray-800">
                    Why Choose This Campus
                  </h2>
                </div>
                <ExpandableText text={campus.why_choose} />
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                Contact Info
              </h3>
              <div className="space-y-3.5">
                {[
                  ...(phone ? [{
                    icon: <IconPhone />,
                    label: "Phone",
                    content: <a href={`tel:${phone}`} className="text-sm font-semibold text-gray-700">{phone}</a>,
                  }] : []),
                  ...(email ? [{
                    icon: <IconMail />,
                    label: "Email",
                    content: <a href={`mailto:${email}`} className="text-sm font-semibold text-orange-500 hover:text-orange-600 hover:underline transition-colors">{email}</a>,
                  }] : []),
                  {
                    icon: <IconLocation />,
                    label: "Location",
                    content: (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-gray-700 hover:text-orange-500 flex items-center gap-1.5 transition-colors"
                      >
                        View on Map <IconExternalLink />
                      </a>
                    ),
                  },
                ].map(({ icon, label, content }) => (
                  <div key={label} className="flex items-start gap-3 group/row">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover/row:bg-orange-100 transition-colors duration-200">
                      {icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      {content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                Campus Info
              </h3>
              <div className="space-y-2.5">
                {[
                  campus.campus_type && { label: "Campus Type", value: campus.campus_type },
                  campus.gender_policy && { label: "Gender Policy", value: campus.gender_policy },
                  campus.class_arrangement && { label: "Class Arrangement", value: campus.class_arrangement },
                  campus.office_hours && { label: "Office Hours", value: campus.office_hours },
                  campus.established && { label: "University Established", value: campus.established },
                  campus.hostel_available != null && { label: "Hostel", value: campus.hostel_available ? "Available" : "Not Available" },
                  (transportRoutes.length > 0 || transportFeeAvailable) && {
                    label: "Transport",
                    value: transportRoutes.length > 0 ? `${transportRoutes.length} Routes` : "Available",
                  },
                ].filter(Boolean).map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-gray-800">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {galleryImages.length > 0 && <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Campus Gallery</h2>
            <button
              onClick={() => setShowGallery(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 hover:gap-2.5 transition-all duration-200"
            >
              View All <IconArrowRight />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryImages.slice(0, 3).map((image, idx) => (
              <button key={image} type="button" className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 group" onClick={() => setShowGallery(true)} aria-label={`Open campus gallery, image ${idx + 1}`}>
                <img src={image} alt={campus.images[idx]?.caption || `${campus.name} campus`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </button>
            ))}
          </div>
        </div>}
      </div>
      {showGallery && (
        <GalleryModal
          images={galleryImages}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}

// --- Admission Procedure Tab ---
function AdmissionsTab() {
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="border-y border-gray-200 py-10 text-center">
        <h2 className="text-xl font-bold text-gray-800">Admission Procedure</h2>
        <p className="text-sm text-gray-500 mt-2">Coming soon</p>
      </div>
    </div>
  );
}

function formatCampusDate(value) {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function AdmissionsInformationTab({ campus }) {
  const documents = Array.isArray(campus.required_documents) ? campus.required_documents : [];
  const announcements = Array.isArray(campus.announcements) ? campus.announcements : [];
  const levels = { ADP: "ADP", UG: "Undergraduate", MS_MPhil: "MS / MPhil", PhD: "PhD" };
  const dates = [
    campus.intake_name && { label: "Intake", value: campus.intake_name },
    campus.admission_open && { label: "Forms Open", value: formatCampusDate(campus.admission_open) },
    campus.admission_close && { label: "Forms Close", value: formatCampusDate(campus.admission_close) },
    campus.classes_start && { label: "Classes Start", value: formatCampusDate(campus.classes_start) },
    campus.admission_status_override && { label: "Admission Status", value: campus.admission_status_override },
  ].filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Admissions Information</h2>
        <p className="text-sm text-gray-500 mt-1">Dates, requirements, and announcements published by this campus.</p>
      </div>

      <section>
        <h3 className="text-base font-bold text-gray-800 mb-3">Admissions Calendar</h3>
        {dates.length ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 border-y border-gray-200">
            {dates.map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-semibold text-gray-800 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="text-sm text-gray-500">No admissions dates have been published.</p>}
      </section>

      <section>
        <h3 className="text-base font-bold text-gray-800 mb-3">Required Documents</h3>
        {documents.length ? (
          <ul className="divide-y divide-gray-100 border-y border-gray-200">
            {documents.map((doc, index) => {
              const applicableLevels = doc.all ? ["All levels"] : (doc.levels || []).map((level) => levels[level] || level);
              return (
                <li key={`${doc.name}-${index}`} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{doc.custom || doc.name}</p>
                    {doc.note && <p className="text-xs text-gray-500 mt-1">{doc.note}</p>}
                  </div>
                  <span className="text-xs text-gray-500">{applicableLevels.length ? applicableLevels.join(", ") : "Level not specified"}</span>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-gray-500">No document requirements have been published.</p>}
      </section>

      {campus.quota_policy?.trim() && (
        <section>
          <h3 className="text-base font-bold text-gray-800 mb-3">Quota & Reservation Policy</h3>
          <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{campus.quota_policy}</p>
        </section>
      )}

      <section>
        <h3 className="text-base font-bold text-gray-800 mb-3">Announcements & Key Dates</h3>
        {announcements.length ? (
          <ul className="divide-y divide-gray-100 border-y border-gray-200">
            {announcements.map((item, index) => (
              <li key={`${item.label}-${index}`} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                <span className="text-sm text-gray-500">{formatCampusDate(item.date) || "To be announced"}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-500">No announcements have been published.</p>}
      </section>
    </div>
  );
}

function CampusGalleryTab({ images }) {
  const [showGallery, setShowGallery] = useState(false);
  const galleryImages = images
    .map((image) => ({ ...image, url: mediaUrl(image.image_url) }))
    .filter((image) => image.url);
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <h2 className="text-xl font-bold text-gray-800">Campus Gallery</h2>
      {galleryImages.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:auto-rows-[140px] gap-3 mt-5">
          {galleryImages.map((image, index) => {
            const tileSize = index === 0 && galleryImages.length >= 3
              ? "sm:col-span-2 sm:row-span-2"
              : index === 4 && galleryImages.length >= 5
                ? "sm:col-span-2"
                : "";
            return (
              <button
                key={image.id || image.url}
                type="button"
                onClick={() => setShowGallery(true)}
                className={`relative min-h-[180px] sm:min-h-0 overflow-hidden rounded-xl bg-gray-100 text-left group ${tileSize}`}
                aria-label={`Open campus gallery image ${index + 1}${image.caption ? `: ${image.caption}` : ""}`}
              >
                <img src={image.url} alt={image.caption || `Campus image ${index + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {(image.caption || image.category) && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pb-3 pt-10 text-white">
                    {image.caption && <span className="block text-sm font-semibold">{image.caption}</span>}
                    {image.category && <span className="block text-xs text-white/80 mt-0.5">{image.category}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : <p className="text-sm text-gray-500 mt-3">No campus photos have been uploaded.</p>}
      {showGallery && <GalleryModal images={galleryImages.map((image) => image.url)} onClose={() => setShowGallery(false)} />}
    </div>
  );
}

function CampusSocietiesTab({ societies }) {
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <h2 className="text-xl font-bold text-gray-800">Campus Societies</h2>
      {societies.length ? (
        <div className="divide-y divide-gray-100 border-y border-gray-200 mt-5">
          {societies.map((society) => (
            <article key={society.id} className="py-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-gray-800">{society.name}</h3>
                {society.category && <span className="text-xs text-gray-500">{society.category}</span>}
              </div>
              {society.description && <p className="text-sm text-gray-600 mt-2">{society.description}</p>}
            </article>
          ))}
        </div>
      ) : <p className="text-sm text-gray-500 mt-3">No societies have been added.</p>}
    </div>
  );
}

// // --- Reviews Tab ---
// function ReviewsTab() {
//   const [ref, v] = useReveal();
//   const reviews = [
//     {
//       name: "Ahmed Raza",
//       program: "BS CS - 2022",
//       rating: 5,
//       text: "Excellent faculty and research opportunities. The campus environment is very professional and motivating.",
//       avatar: "AR",
//     },
//     {
//       name: "Fatima Malik",
//       program: "BBA - 2023",
//       rating: 4,
//       text: "Great campus with good facilities. The cafeteria and library are top-notch. Would recommend to everyone.",
//       avatar: "FM",
//     },
//     {
//       name: "Usman Khan",
//       program: "MS SE - 2021",
//       rating: 5,
//       text: "The industry connections and placement support are outstanding. Got placed in a top company within 3 months.",
//       avatar: "UK",
//     },
//     {
//       name: "Sara Ahmed",
//       program: "BS IT - 2023",
//       rating: 4,
//       text: "Very supportive faculty and a vibrant student community. The events and societies make campus life enjoyable.",
//       avatar: "SA",
//     },
//   ];
//   const avg = (
//     reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
//   ).toFixed(1);
//   return (
//     <div
//       ref={ref}
//       className={`transition-all duration-700 ease-out ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
//     >
//       <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
//         <div className="mb-6">
//           <h2 className="text-xl font-bold text-gray-800">Student Reviews</h2>
//           <p className="text-sm text-gray-500 mt-1">
//             What students say about studying at this campus.
//           </p>
//         </div>
//         <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
//           <div className="text-center">
//             <div className="text-4xl font-black text-orange-500">{avg}</div>
//             <div className="flex gap-0.5 justify-center mt-1">
//               {[1, 2, 3, 4, 5].map((s) => (
//                 <IconStar key={s} filled={s <= Math.round(Number(avg))} />
//               ))}
//             </div>
//             <p className="text-xs text-gray-400 mt-1">
//               {reviews.length} reviews
//             </p>
//           </div>
//           <div className="flex-1 space-y-1.5">
//             {[5, 4, 3, 2, 1].map((star) => {
//               const count = reviews.filter((r) => r.rating === star).length;
//               const pct = Math.round((count / reviews.length) * 100);
//               return (
//                 <div key={star} className="flex items-center gap-2">
//                   <span className="text-xs text-gray-500 w-2">{star}</span>
//                   <IconStar filled={true} />
//                   <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-orange-400 rounded-full"
//                       style={{ width: `${pct}%` }}
//                     />
//                   </div>
//                   <span className="text-xs text-gray-400 w-6 text-right">
//                     {count}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {reviews.map((r, i) => (
//             <div
//               key={i}
//               className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-100 hover:-translate-y-0.5 transition-all duration-300"
//             >
//               <div className="flex items-start gap-3 mb-3">
//                 <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
//                   {r.avatar}
//                 </div>
//                 <div className="flex-1">
//                   <p className="text-sm font-bold text-gray-800">{r.name}</p>
//                   <p className="text-xs text-gray-400">{r.program}</p>
//                 </div>
//                 <div className="flex gap-0.5">
//                   {[1, 2, 3, 4, 5].map((s) => (
//                     <IconStar key={s} filled={s <= r.rating} />
//                   ))}
//                 </div>
//               </div>
//               <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// --- Main Page ---
export default function CampusDetailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");
  const [campus, setCampus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!id) {
      setCampus(null);
      setLoading(false);
      return;
    }

    const staticRaw = getCampusById(id);
    let active = true;
    let latestRequest = 0;
    const loadCampus = (showLoading = false) => {
      const requestId = ++latestRequest;
      if (showLoading) setLoading(true);
      getCampusDetail(id)
        .then((liveRaw) => {
          if (!active || requestId !== latestRequest) return;
          if (!liveRaw) {
            setCampus(staticRaw ? toPageCampus(staticRaw) : null);
            return;
          }
          const normalised = {
            ...liveRaw,
            campusName:     liveRaw.name || liveRaw.campusName,
            universityName: liveRaw.university_name,
            universityId:   liveRaw.university_id,
            programs:       Array.isArray(liveRaw.programs)
              ? liveRaw.programs
              : [],
            coverImage:     liveRaw.cover_image || liveRaw.university_banner || null,
          };
          setCampus(toPageCampus(normalised));
        })
        .catch(() => {
          if (active && requestId === latestRequest) {
            setCampus(staticRaw ? toPageCampus(staticRaw) : null);
          }
        })
        .finally(() => {
          if (active && requestId === latestRequest) setLoading(false);
        });
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadCampus();
    };
    loadCampus(true);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading campus...</p>
        </div>
      </div>
    );
  }

  if (!campus) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          Campus not found
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          The campus you are looking for does not exist or was removed.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors"
        >
          <IconArrowLeft /> Go back
        </button>
      </div>
    );
  }

  const heroImage =
    mediaUrl(campus.images?.[0]?.image_url) || CAMPUS_DEFAULT_IMAGE;

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab campus={campus} heroImage={heroImage} />;
      case "programs":
        return <ProgramsOffered programs={campus.programs || []} />;
      case "admission-procedure":
        return <AdmissionsTab />;
      case "admissions-info":
        return <AdmissionsInformationTab campus={campus} />;
      case "scholarships":
        return <Scholarships scholarships={campus.scholarships || []} />;
      case "facilities":
        return <CampusFacilities facilities={campus.facilities} />;
      case "transport":
        return <CampusTransport facilities={campus.facilities} />;
      case "gallery":
        return <CampusGalleryTab images={campus.images || []} />;
      case "societies":
        return <CampusSocietiesTab societies={campus.societies || []} />;
      case "hostels":
        return <NearbyHostels />;
      case "admissions":
        return <AdmissionsTab />;
      // case "reviews":
      //   return <ReviewsTab />;
      default:
        return null;
    }
  };

  return (
    <main className="overflow-x-hidden bg-gray-50 min-h-screen text-gray-900 text-base font-normal">
      <HeroSection
        campus={campus}
        heroImage={heroImage}
        onBack={() => navigate(-1)}
      />
      <CampusStats
        campus={campus}
        className="-mt-12 sm:-mt-14 relative z-20 pb-4"
      />
      <div className="mt-2">
        <Tabs active={activeTab} setActive={setActiveTab} />
        {renderTab()}
      </div>
    </main>
  );
}


