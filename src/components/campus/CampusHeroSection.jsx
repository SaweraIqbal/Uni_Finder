import { useEffect, useRef, useState } from "react";

// ─── Inline SVG Icons ──────────────────────────────────────────────────────

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
    width="14"
    height="14"
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

// ─── useReveal hook ────────────────────────────────────────────────────────

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CampusHeroSection({
  universityName = "Tech-Poly University",
  location = "Silicon Valley Innovation Hub",
  campusType = "Main Campus",
  heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuDjqx4Q5HsN1EMdWLtHyai0AtLdvkvKjsB2BU6U-wS4nuKYw9psoXSfwas7b9KmLMItdNOq9qizUhwpbJF50XHrqz5asjmznGdpKhjQq1D6IzdHlz4exVtRYSfnTcCFrv_yb3snvRMYbBTEZQfL8hf45JgWS1W32BxRNQKWhzLPnH3HH3CDvt__-TD94I7swJfM08hWlGd4RJgg0PsAD7iHC0fQyi7TobRFaL-q8xlwRPywCUgYQKEiHL9vg2ViRHx5i3DNrcjrAwC8",
  onBack = () => window.history.back(),
}) {
  const [ref, visible] = useReveal();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className={`
        relative w-full overflow-hidden
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ height: "260px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="banner"
    >
      {/* Hero image — zoom on hover */}
      <img
        src={heroImage}
        alt={`${universityName} main campus`}
        className="w-full h-full object-cover"
        style={{
          transition: "transform 0.6s ease",
          transform: hovered ? "scale(1.04)" : "scale(1)",
        }}
      />

      {/* Bottom-up gradient for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.04) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Back button ── */}
      <button
        onClick={onBack}
        aria-label="Go back"
        className="
          absolute top-4 left-5
          w-9 h-9 rounded-full flex items-center justify-center
          text-white border border-white/20
          transition-all duration-200 hover:scale-105 hover:bg-white/30 active:scale-95
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white
        "
        style={{
          background: "rgba(255,255,255,0.16)",
          backdropFilter: "blur(8px)",
        }}
      >
        <IconArrowLeft />
      </button>

      {/* ── Campus badge ── */}
      <span
        className="
          absolute top-4 right-5
          bg-orange-500 text-white
          text-[11px] font-semibold tracking-widest uppercase
          px-4 py-1.5 rounded-full
          shadow-lg shadow-orange-500/25
        "
        role="status"
        aria-label={`Campus type: ${campusType}`}
      >
        {campusType}
      </span>

      {/* ── University name + location ─────────────────────────────────── */}
      {/* Sits 56px from bottom — leaves room for overlapping stat cards   */}
      <div className="absolute left-6" style={{ bottom: "58px" }}>
        <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight drop-shadow-sm">
          {universityName}
        </h1>
        <div className="flex items-center gap-1.5 mt-1.5">
          <IconMapPin />
          <span className="text-[13px] text-white/75 leading-none">
            {location}
          </span>
        </div>
      </div>
    </div>
  );
}
