import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CAMPUS_DEFAULT_IMAGE } from "../api/campus";
import { fileUrl } from "../api/client";
import { getCampusById } from "../data/campuses";
import { findUniversity } from "../data/universities";
import { sectorLabel } from "../components/heroSection";
import ProgramsOffered from "../components/campus/ProgramsOffered";
import CampusTransport from "../components/campus/CampusTransport";
import Scholarships from "../components/campus/Scholarships";
import CampusFacilities from "../components/campus/CampusFacilities";
import NearbyHostels from "../components/campus/NearbyHostels";

import programIcon from "../assets/program.png";
import activeUsersIcon from "../assets/activeusers.png";
import phdFacultyIcon from "../assets/phdfaculty.png";
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
    images:
      raw.cover_image || raw.coverImage
        ? [{ image_url: raw.cover_image || raw.coverImage }]
        : [],
    hec_rank: raw.hec_rank ?? raw.hecRank ?? uni?.hec_rank,
    sector: raw.sector ?? uni?.sector ?? raw.universityType,
    phd_faculty: raw.phd_faculty ?? uni?.phd_faculty,
    employment_rate: raw.employment_rate ?? uni?.employment_rate,
    established: raw.established ?? uni?.established_year,
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
  const hecRank = campus.hec_rank ?? campus.hecRank ?? campus.ranking ?? "34";
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
            <span className="inline-flex items-center bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 shadow-sm">
              {sector}
            </span>
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
      iconAlt: "Offered Programs",
      value: programCount || "25",
      suffix: "+",
      label: "Offered Programs",
    },
    {
      id: "students",
      iconSrc: activeUsersIcon,
      iconAlt: "Active Students",
      value: campus.students?.replace(/[^0-9,]/g, "") || "15,000",
      suffix: "+",
      label: "Active Students",
    },
    {
      id: "phd_faculty",
      iconSrc: phdFacultyIcon,
      iconAlt: "PhD Faculty",
      value: campus.phd_faculty
        ? String(campus.phd_faculty).replace(/[^0-9]/g, "")
        : "85",
      suffix: "%",
      label: "PhD Faculty",
    },
    {
      id: "employment_rate",
      iconSrc: employmentIcon,
      iconAlt: "Employment Rate",
      value: campus.employment_rate
        ? String(campus.employment_rate).replace(/[^0-9]/g, "")
        : "92",
      suffix: "%",
      label: "Employment Rate",
    },
  ];
  return (
    <section
      ref={sectionRef}
      className={`py-0 bg-transparent ${className}`}
      aria-label="Campus statistics"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-5 lg:px-7">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
  "admissions",
  "scholarships",
  "facilities",
  "transport",
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
            {id === "admissions"
              ? "Admissions & Fees"
              : id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Gallery ---
const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&auto=format&fit=crop",
];

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
function OverviewTab({ campus, heroImage }) {
  const [ref, v] = useReveal();
  const [showGallery, setShowGallery] = useState(false);
  const email = campus.email || "info@ucp.edu.pk";
  const phone = campus.phone || "+92 42 111 000 827";
  const mapUrl =
    campus.lat && campus.lng
      ? `https://www.google.com/maps?q=${campus.lat},${campus.lng}`
      : `https://www.google.com/maps/search/${encodeURIComponent(campus.name)}`;
  const hostel = campus.hostelAvailable ? "Available" : "Not Available";
  const transport = campus.transportRoutes || "3 Routes";
  const affiliation = campus.affiliation || "HEC";
  const established = campus.established || "2009";
  const educationType = campus.genderType || "Co-Ed";
  const galleryImages = [
    heroImage,
    ...GALLERY_IMAGES.filter((img) => img !== heroImage),
  ].slice(0, 6);

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
              <p className="text-sm leading-relaxed text-gray-600">
                Located in the heart of {campus.city || "Lahore"}, the{" "}
                {campus.name} of {campus.university_name} offers a dynamic
                environment for higher education. Boasting state-of-the-art
                facilities and a commitment to academic excellence, the campus
                serves as a hub for innovation and scholarly pursuit in the
                region.
              </p>
              <p className="text-sm leading-relaxed text-gray-600 mt-3">
                With a strong emphasis on industry linkages and hands-on
                learning, {campus.university_name} provides students with
                unparalleled opportunities for personal and professional growth,
                preparing them for leadership roles in a rapidly evolving global
                landscape.
              </p>
            </div>

            <div className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xl font-bold text-gray-800">
                  Why Choose This Campus
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                Beyond academics, the {campus.name} is built around a genuinely
                connected student experience. Modern lecture halls and research
                labs sit alongside dedicated career services, active student
                societies, and a campus-wide focus on mentorship so students are
                not just attending classes, they are building a network that
                carries into their careers. With regular industry visits,
                on-campus recruitment drives, and a faculty that stays closely
                involved in student progress, this campus is designed to feel
                less like a degree factory and more like a launchpad.
              </p>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                Contact Info
              </h3>
              <div className="space-y-3.5">
                {[
                  {
                    icon: <IconPhone />,
                    label: "Phone",
                    content: (
                      <span className="text-sm font-semibold text-gray-700">
                        {phone}
                      </span>
                    ),
                  },
                  {
                    icon: <IconMail />,
                    label: "Email",
                    content: (
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-orange-500 hover:text-orange-600 hover:underline transition-colors"
                      >
                        {email}
                      </a>
                    ),
                  },
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
                  {
                    label: "Education Type",
                    value: educationType,
                    highlight: false,
                  },
                  {
                    label: "Hostel",
                    value: hostel,
                    highlight: campus.hostelAvailable,
                  },
                  { label: "Transport", value: transport, highlight: false },
                  {
                    label: "Affiliation",
                    value: affiliation,
                    highlight: false,
                  },
                  {
                    label: "Established",
                    value: established,
                    highlight: false,
                  },
                ].map(({ label, value, highlight }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-xs text-gray-500">{label}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${highlight ? "bg-green-50 text-green-600" : "text-gray-800"}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Campus Gallery</h2>
            <button
              onClick={() => setShowGallery(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 hover:gap-2.5 transition-all duration-200"
            >
              View All <IconArrowRight />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 grid-rows-2 gap-3 h-[200px] sm:h-[280px]">
            <div
              className="sm:col-span-2 sm:row-span-2 rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
              onClick={() => setShowGallery(true)}
            >
              <img
                src={galleryImages[0]}
                alt="Campus photo 1"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            {[1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
                onClick={() => setShowGallery(true)}
              >
                <img
                  src={galleryImages[idx]}
                  alt={`Campus photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
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

// --- Admissions & Fees Tab ---
function AdmissionsTab() {
  const [ref, v] = useReveal();
  const steps = [
    {
      num: "01",
      title: "Check Eligibility",
      desc: "Review the minimum marks and entry test requirements for your desired program.",
    },
    {
      num: "02",
      title: "Submit Application",
      desc: "Complete the online application form and upload required documents.",
    },
    {
      num: "03",
      title: "Entry Test",
      desc: "Appear in the scheduled entry test or submit SAT/NTS scores if applicable.",
    },
    {
      num: "04",
      title: "Merit List",
      desc: "Wait for the official merit list announcement and confirm your seat.",
    },
    {
      num: "05",
      title: "Fee Submission",
      desc: "Pay the semester fee within the deadline to secure your admission.",
    },
  ];
  const feeItems = [
    { label: "Registration Fee", value: "Rs 5,000", note: "One-time" },
    { label: "Security Deposit", value: "Rs 10,000", note: "Refundable" },
    { label: "Tuition Fee (CS)", value: "Rs 45,000", note: "Per semester" },
    { label: "Tuition Fee (BBA)", value: "Rs 40,000", note: "Per semester" },
    { label: "Lab & Facility", value: "Rs 5,000", note: "Per semester" },
    { label: "Exam Fee", value: "Rs 2,500", note: "Per semester" },
  ];
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10 space-y-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Admissions &amp; Fees
          </h2>
          <p className="text-sm text-gray-500">
            Step-by-step admission process and fee structure for this campus.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="group p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-200 hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              <span className="text-3xl font-black text-orange-100 group-hover:text-orange-200 transition-colors duration-300">
                {s.num}
              </span>
              <h3 className="text-sm font-bold text-gray-800 mt-2">
                {s.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-4">
            Fee Structure
          </h3>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-3 px-5 py-3 bg-slate-50 border-b border-gray-100">
              {["Item", "Amount", "Note"].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-bold uppercase tracking-widest text-slate-400"
                >
                  {h}
                </span>
              ))}
            </div>
            {feeItems.map((item, i) => (
              <div
                key={item.label}
                className={`grid grid-cols-1 sm:grid-cols-3 items-center gap-y-1 px-5 py-3.5 hover:bg-orange-50/40 transition-colors duration-150 ${i !== feeItems.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <span className="text-sm font-semibold text-gray-800">
                  {item.label}
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {item.value}
                </span>
                <span className="text-xs text-gray-400">{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
    setLoading(true);
    const raw = id ? getCampusById(id) : null;
    setCampus(toPageCampus(raw));
    setLoading(false);
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
        return <ProgramsOffered />;
      case "scholarships":
        return <Scholarships />;
      case "facilities":
        return <CampusFacilities />;
      case "transport":
        return <CampusTransport />;
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
