import { useEffect, useRef, useState } from "react";

const stats = [
  {
    id: "students",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3" />
        <path d="M8 11c-1.657 0-3-1.343-3-3s1.343-3 3-3" />
        <path d="M12 13c2.761 0 5 1.567 5 3.5V18H7v-1.5C7 14.567 9.239 13 12 13z" />
        <path d="M19 14c1.5.5 3 1.5 3 3v1h-3" />
        <path d="M5 14c-1.5.5-3 1.5-3 3v1h3" />
        <circle cx="12" cy="7" r="3" />
      </svg>
    ),
    value: "25,000",
    suffix: "+",
    label: "Total students",
  },
  {
    id: "campuses",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    value: "4",
    suffix: "",
    label: "Total campuses",
  },
  {
    id: "transport",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
        <rect x="9" y="11" width="14" height="10" rx="2" />
        <circle cx="12" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
      </svg>
    ),
    value: "24/7",
    suffix: "",
    label: "Campus transport",
  },
  {
    id: "hostels",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    value: "12",
    suffix: "",
    label: "Campus hostels",
  },
];

// ─── Single stat card ─────────────────────────────────────────────────────────

function StatCard({ stat, isVisible, delay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`
        flex flex-col items-center gap-2 p-5 bg-white
        border border-slate-200/70 rounded-2xl
        transition-all duration-300 ease-in-out cursor-default
        focus-within:ring-2 focus-within:ring-orange-400 focus-within:ring-offset-2
        ${hovered ? "-translate-y-1 border-slate-300 shadow-lg" : ""}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ transitionDelay: `${delay}ms` }}
      role="article"
      aria-label={`${stat.label}: ${stat.value}${stat.suffix}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon chip */}
      <div
        className={`
          w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
          border transition-all duration-200
          ${
            hovered
              ? "bg-orange-50 border-orange-200/60 text-orange-500"
              : "bg-gray-50 border-slate-200/60 text-slate-400"
          }
        `}
      >
        {stat.icon}
      </div>

      {/* Value */}
      <div className="text-[22px] font-bold leading-none text-slate-800 mt-0.5 tabular-nums">
        {stat.value}
        {stat.suffix && (
          <span className="text-orange-500 text-base font-bold">
            {stat.suffix}
          </span>
        )}
      </div>

      {/* Divider bar – slides in on hover */}
      <div
        className={`h-0.5 rounded-full bg-orange-500 transition-all duration-200 ${
          hovered ? "w-5 opacity-100" : "w-0 opacity-0"
        }`}
        aria-hidden="true"
      />

      <p className="text-xs font-semibold text-slate-400 text-center leading-snug uppercase tracking-wide">
        {stat.label}
      </p>
    </div>
  );
}

export default function UniversityStats({ university }) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Override the data-backed values; keep the icons + decorative ones.
  const liveStats = stats.map((s) => {
    if (s.id === "students" && university?.students)
      return { ...s, value: university.students, suffix: "" };
    if (s.id === "campuses" && university?.total_campuses)
      return { ...s, value: university.total_campuses, suffix: "" };
    return s;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="py-12 bg-gray-50"
      ref={sectionRef}
      aria-label="University statistics"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {liveStats.map((stat, i) => (
            <StatCard
              key={stat.id}
              stat={stat}
              isVisible={isVisible}
              delay={i * 60}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
