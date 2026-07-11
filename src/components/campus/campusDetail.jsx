import React, { useState, useEffect, useRef } from "react";

/* ─── NOTE: Add this to your <head> in index.html ─────────────────────────────
   <link
     href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
     rel="stylesheet"
   />
   <link
     href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
     rel="stylesheet"
   />
   And in tailwind.config.js:
     fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
─────────────────────────────────────────────────────────────────────────────── */

// ─── MATERIAL ICON ──────────────────────────────────────────────────────────
const Icon = ({ name, size = 24, filled = false, className = "" }) => (
  <span
    className={`material-symbols-outlined select-none ${className}`}
    style={{
      fontSize: size,
      fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
    }}
  >
    {name}
  </span>
);

// ─── INTERSECTION OBSERVER HOOK ─────────────────────────────────────────────
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
      { threshold, rootMargin: "0px 0px -60px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const reveal = (v) =>
  `transition-all duration-700 ease-out ${
    v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
  }`;

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const PROGRAMS = [
  {
    name: "Cyber Security",
    level: "UG",
    accent: "orange",
    duration: "4 Years",
  },
  {
    name: "Artificial Intelligence",
    level: "MS",
    accent: "blue",
    duration: "3 Years",
  },
  {
    name: "Biomedical Engineering",
    level: "MS",
    accent: "orange",
    duration: "4 Years",
  },
  { name: "Data Science", level: "MS", accent: "blue", duration: "2 Years" },
];

const FACILITIES = [
  { icon: "wifi", label: "Gigabit Campus", sub: "High-speed connectivity" },
  { icon: "local_library", label: "Digital Library", sub: "2,384+ Resources" },
  { icon: "pool", label: "Sports Arena", sub: "Olympic-size pool" },
  { icon: "restaurant", label: "Main Cuisine", sub: "Healthy dining" },
];

const HOSTELS = [
  {
    name: "North Square Residence",
    desc: "Single rooms with private baths, common lounges, and 24/7 security.",
    price: "3,400",
    img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=700&auto=format&fit=crop&q=80",
  },
  {
    name: "Lakeside Towers",
    desc: "Spacious shared suites with balcony views and high-speed fibre internet.",
    price: "3,000",
    img: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=700&auto=format&fit=crop&q=80",
  },
  {
    name: "Innovation Villa",
    desc: "Premium co-living suites with private study pods and research access.",
    price: "3,500",
    img: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=700&auto=format&fit=crop&q=80",
  },
];

const TRANSPORT_STOPS = [
  {
    title: "Central Metro Station",
    label: "First Stop — 07:00 AM",
    desc: "Main city link with frequency every 15 minutes.",
  },
  {
    title: "Academic Block East",
    label: "Mid Stop — 07:20 AM",
    desc: "Drops students right at the engineering & science center.",
  },
  {
    title: "Sports & Wellness Hub",
    label: "Final Stop — 07:45 AM",
    desc: "Terminates at the recreation and gymnasium area.",
  },
];

const REVIEWS = [
  {
    name: "Ayesha Khan",
    rating: 5,
    date: "March 2024",
    initials: "AK",
    comment:
      "The campus facilities are world-class. The library has everything you need and the faculty is incredibly supportive of student growth.",
  },
  {
    name: "Bilal Ahmed",
    rating: 4,
    date: "February 2024",
    initials: "BA",
    comment:
      "Great hostel facilities and the shuttle service runs on time every day. The sports arena is a massive bonus for health-conscious students.",
  },
  {
    name: "Sara Malik",
    rating: 5,
    date: "January 2024",
    initials: "SM",
    comment:
      "One of the best campuses in Pakistan. The AI and CS programs are top-notch with an industry-relevant curriculum that actually gets you hired.",
  },
];

const RATING_BARS = [
  { label: "5 stars", pct: 72, count: 179 },
  { label: "4 stars", pct: 19, count: 47 },
  { label: "3 stars", pct: 6, count: 15 },
  { label: "2 stars", pct: 2, count: 5 },
  { label: "1 star", pct: 1, count: 2 },
];

// ─── STICKY TABS ────────────────────────────────────────────────────────────
function StickyTabs({ active }) {
  const tabs = ["programs", "facilities", "hostels", "transport", "reviews"];
  return (
    <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 overflow-x-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 flex gap-8">
        {tabs.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className={`py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              active === id
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-slate-500 hover:text-orange-500 border-b-2 border-transparent"
            }`}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── PROGRAMS SECTION ───────────────────────────────────────────────────────
function ProgramsSection() {
  const [ref, v] = useReveal();
  const [filter, setFilter] = useState("All");
  const FILTERS = ["All", "UG", "MS", "PhD"];
  const rows = PROGRAMS.filter((p) => filter === "All" || p.level === filter);

  const badge = (level, accent) => {
    if (accent === "orange")
      return "inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-orange-100 text-orange-600 border border-orange-200";
    if (accent === "blue")
      return "inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-600 border border-blue-200";
    return "inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-500";
  };

  return (
    <section id="programs" ref={ref} className={`py-20 bg-white ${reveal(v)}`}>
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              Our Academic Programs
            </h2>
            <p className="text-base text-slate-500 mt-2">
              Expertly curated courses for the leaders of tomorrow.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                    : "bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-500"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[1fr_110px_130px_120px] bg-orange-500 px-6 py-3.5">
            {["Course Name", "Level", "Duration", ""].map((h, i) => (
              <span
                key={i}
                className={`text-xs font-bold text-white uppercase tracking-widest ${i === 3 ? "text-right" : ""}`}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Empty state */}
          {rows.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              No programs found for this level.
            </div>
          )}

          {/* Rows */}
          {rows.map((p, idx) => (
            <div
              key={p.name}
              className={`grid grid-cols-1 md:grid-cols-[1fr_110px_130px_120px] items-center gap-y-2 md:gap-y-0 px-6 py-4 hover:bg-orange-50/40 transition-colors cursor-pointer group ${
                idx !== rows.length - 1 ? "border-b border-slate-200" : ""
              }`}
              onClick={(e) => {
                if (e.target.tagName !== "BUTTON") {
                  e.currentTarget.querySelector("button")?.click();
                }
              }}
            >
              <span className="text-sm font-semibold text-slate-800 md:text-base">
                {p.name}
              </span>
              <span>
                <span className={badge(p.level, p.accent)}>{p.level}</span>
              </span>
              <span className="text-sm text-slate-500">{p.duration}</span>
              <div className="flex md:justify-end">
                <button className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-orange-200">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FACILITIES SECTION ─────────────────────────────────────────────────────
function FacilitiesSection() {
  const [ref, v] = useReveal();

  return (
    <section
      id="facilities"
      ref={ref}
      className={`py-20 bg-orange-50/30 ${reveal(v)}`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            World-Class Facilities
          </h2>
          <p className="text-base text-slate-500 mt-3 max-w-2xl mx-auto">
            Providing a state-of-the-art environment for research, learning, and
            personal growth.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FACILITIES.map((f, i) => (
            <div
              key={f.label}
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-slate-200"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                <Icon name={f.icon} size={26} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HOSTELS SECTION ────────────────────────────────────────────────────────
function HostelsSection() {
  const [ref, v] = useReveal();
  const [saved, setSaved] = useState({});
  const toggle = (n) => setSaved((p) => ({ ...p, [n]: !p[n] }));

  return (
    <section id="hostels" ref={ref} className={`py-20 bg-white ${reveal(v)}`}>
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Campus Living
          </h2>
          <p className="text-base text-slate-500 mt-2">
            Your home away from home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {HOSTELS.map((h, i) => (
            <div
              key={h.name}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={h.img}
                  alt={h.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                <button
                  onClick={() => toggle(h.name)}
                  className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm py-1 px-3 rounded-full shadow-md hover:bg-white transition-colors"
                  aria-label={saved[h.name] ? "Unsave hostel" : "Save hostel"}
                >
                  <Icon
                    name="favorite"
                    size={16}
                    filled={saved[h.name]}
                    className={
                      saved[h.name] ? "text-red-500" : "text-slate-400"
                    }
                  />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-800">{h.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {h.desc}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-slate-800">
                      PKR {h.price}
                    </span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                  <button
                    onClick={() => toggle(h.name)}
                    className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                      saved[h.name]
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-500"
                    }`}
                  >
                    {saved[h.name] ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TRANSPORT SECTION ──────────────────────────────────────────────────────
function TransportSection() {
  const [refL, vL] = useReveal();
  const [refR, vR] = useReveal();

  return (
    <section id="transport" className="py-20 bg-orange-50/30">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left — timeline */}
          <div ref={refL} className={reveal(vL)}>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mb-6">
              Shuttle Network
            </h2>
            <p className="text-base text-slate-500 mb-12">
              Connecting you to every corner of the campus with our dedicated
              fleet.
            </p>

            <div className="relative pl-8 border-l-2 border-orange-200 space-y-10">
              {TRANSPORT_STOPS.map((s) => (
                <div key={s.title} className="relative">
                  <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                  <h5 className="text-lg font-semibold text-slate-800">
                    {s.title}
                  </h5>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-0.5">
                    {s.label}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — map card */}
          <div
            ref={refR}
            className={`bg-white rounded-3xl p-3 shadow-md overflow-hidden group border border-slate-200 ${reveal(vR)}`}
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-inner">
              <img
                alt="Campus Aerial Map View"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src="https://i.pinimg.com/736x/0f/29/d5/0f29d571805aaba3761fdfa5059866a7.jpg"
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />

              {/* Live tracking badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full px-4 flex justify-center pointer-events-none">
                <div className="bg-white/70 backdrop-blur-md px-5 py-2 rounded-full border border-white/40 shadow-lg flex items-center gap-3 animate-pulse">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs">
                    Live Tracking
                  </span>
                  <div className="h-3 w-px bg-slate-300" />
                  <span className="text-slate-500 text-xs">
                    8 Shuttles Active
                  </span>
                </div>
              </div>

              {/* Bus marker */}
              <div className="absolute top-1/2 left-1/3 -translate-y-1/2 group-hover:-translate-y-[calc(50%+4px)] transition-transform duration-500 pointer-events-none">
                <div className="bg-orange-500 text-white p-2 rounded-full shadow-lg">
                  <Icon name="directions_bus" size={16} />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-0.5 rounded">
                  Shuttle #104
                </div>
              </div>

              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition-colors">
                  <Icon name="add" size={18} />
                </button>
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition-colors">
                  <Icon name="remove" size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── STARS COMPONENT ────────────────────────────────────────────────────────
function Stars({ count, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          filled={i <= count}
          className={i <= count ? "text-orange-500" : "text-slate-200"}
        />
      ))}
    </div>
  );
}

// ─── REVIEWS SECTION ────────────────────────────────────────────────────────
function ReviewsSection() {
  const [ref, v] = useReveal();

  return (
    <section id="reviews" ref={ref} className={`py-20 bg-white ${reveal(v)}`}>
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Student Reviews
          </h2>
          <p className="text-base text-slate-500 mt-2">
            Real experiences from our campus community.
          </p>
        </div>

        {/* Rating overview card */}
        <div className="flex flex-col md:flex-row gap-10 items-start mb-14 p-7 bg-orange-50 rounded-2xl border border-orange-100">
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-6xl font-extrabold text-orange-500 leading-none">
              4.8
            </span>
            <Stars count={5} size={18} />
            <p className="text-xs text-slate-500 mt-2 text-center">
              Based on 248 reviews
            </p>
          </div>

          <div className="flex-1 space-y-2.5 w-full">
            {RATING_BARS.map((bar) => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-14 flex-shrink-0">
                  {bar.label}
                </span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-700"
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-7 text-right flex-shrink-0">
                  {bar.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {REVIEWS.map((r, i) => (
            <div
              key={r.name}
              className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {r.name}
                  </p>
                  <p className="text-xs text-slate-400">{r.date}</p>
                </div>
              </div>
              <Stars count={r.rating} />
              <p className="text-sm leading-relaxed text-slate-600 mt-3">
                {r.comment}
              </p>
              <button className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-500 transition-colors">
                <Icon name="thumb_up" size={13} />
                Helpful
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold px-7 py-3 rounded-xl transition-all shadow-sm shadow-orange-200 text-sm">
            <Icon name="rate_review" size={18} />
            Write a Review
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── ROOT COMPONENT ─────────────────────────────────────────────────────────
export default function CampusDetail() {
  const [active, setActive] = useState("programs");

  useEffect(() => {
    const ids = ["programs", "facilities", "hostels", "transport", "reviews"];
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.25, rootMargin: "-70px 0px -40% 0px" },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <div className="font-sans min-h-screen bg-white text-slate-900 antialiased">
      <StickyTabs active={active} />
      <ProgramsSection />
      <FacilitiesSection />
      <HostelsSection />
      <TransportSection />
      <ReviewsSection />
    </div>
  );
}
