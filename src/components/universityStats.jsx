import { useEffect, useRef, useState } from "react";
import activeUsersIcon from "../assets/activeusers.png";
import campusIcon      from "../assets/campuses.png";
import programIcon     from "../assets/program.png";
import establishedIcon from "../assets/established.png";

/**
 * Derive the four stat items from live university data,
 * falling back to sensible static values when fields are absent.
 */
function buildStats(university) {
  const campuses =
    university?.live_campus_count ??
    university?.total_campuses ??
    "4";

  const programs =
    university?.live_program_count ??
    university?.programs_count ??
    "25";

  const students =
    university?.active_students ??
    university?.students ??
    "15,000";

  const established =
    university?.established_year ?? "2002";

  return [
    {
      id: "total_campuses",
      iconSrc: campusIcon,
      iconAlt: "Total Campuses",
      value: String(campuses),
      suffix: "",
      label: "Total Campuses",
    },
    {
      id: "total_programs",
      iconSrc: programIcon,
      iconAlt: "Total Programs",
      value: String(programs),
      suffix: "",
      label: "Total Programs",
    },
    {
      id: "students",
      iconSrc: activeUsersIcon,
      iconAlt: "Active Students",
      value: String(students).replace(/\+$/, ""),
      suffix: "+",
      label: "Active Students",
    },
    {
      id: "established",
      iconSrc: establishedIcon,
      iconAlt: "Established",
      value: String(established),
      suffix: "",
      label: "Established",
    },
  ];
}

function StatCard({ stat, isVisible, delay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`
        flex flex-col justify-between gap-3 p-5 bg-white
        border border-slate-200 rounded-2xl
        transition-all duration-300 ease-in-out cursor-default
        ${hovered ? "-translate-y-0.5 shadow-md border-slate-300" : "shadow-sm"}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ transitionDelay: `${delay}ms` }}
      role="article"
      aria-label={`${stat.label}: ${stat.value}${stat.suffix}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: label left, icon right */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-tight">
          {stat.label}
        </p>

        <div
          className={`
            w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
            border transition-all duration-200
            ${hovered ? "bg-orange-50 border-orange-200/70" : "bg-gray-50 border-slate-200/60"}
          `}
        >
          <img
            src={stat.iconSrc}
            alt={stat.iconAlt}
            className="w-[22px] h-[22px] object-contain"
          />
        </div>
      </div>

      {/* Large value */}
      <div className="text-[26px] font-bold leading-none text-slate-800 tabular-nums">
        {stat.value}
        {stat.suffix && (
          <span className="text-orange-500 font-bold">{stat.suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function UniversityStats({ university, className = "" }) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const stats = buildStats(university);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`py-0 bg-transparent ${className}`}
      ref={sectionRef}
      aria-label="University statistics"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-5 lg:px-7">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.id}
              stat={stat}
              isVisible={isVisible}
              delay={i * 70}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
