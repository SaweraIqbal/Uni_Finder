import { useEffect, useRef, useState } from "react";

export default function UniversityInfo({ university }) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.08 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Live data with sensible static fallbacks matching the reference design
  const aboutText =
    university?.about_text ||
    "The University of Central Punjab is a premier institution dedicated to academic excellence and holistic student development. We foster an environment of innovation, critical thinking, and ethical leadership, preparing our graduates to meet global challenges head-on.";

  const moreText =
    university?.description ||
    "Our world-class faculty and state-of-the-art facilities provide an unparalleled learning environment that bridges theory with real-world application, empowering students to lead in their respective fields.";

  const mission =
    university?.mission ||
    "To provide quality education, fostering research, innovation, and ethical values, enabling students to become responsible global citizens and leaders in their respective fields.";

  const fadeBase = "transition-all duration-500 ease-out";
  const fadeIn = isVisible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-5";

  return (
    <section
      className="py-14 bg-white"
      ref={sectionRef}
      aria-label="About the university"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-[1.65fr_1fr] gap-10 md:gap-12 items-start">
          {/* ── Left column: About text ───────────────────────── */}
          <div
            className={`${fadeBase} ${fadeIn}`}
            style={{ transitionDelay: "0ms" }}
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              About the University
            </h2>

            <p className="text-[14.5px] leading-relaxed text-slate-500">
              {aboutText}
            </p>

            {/* Expandable additional text */}
            <div
              className="overflow-hidden transition-all duration-400 ease-in-out"
              style={{ maxHeight: expanded ? "200px" : "0px" }}
              aria-hidden={!expanded}
            >
              <p className="text-[14.5px] leading-relaxed text-slate-500 mt-3">
                {moreText}
              </p>
            </div>

            {/* Read More toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="
                mt-5 inline-flex items-center gap-1.5
                text-sm font-semibold text-orange-500
                hover:gap-3 transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
                focus-visible:ring-offset-2 rounded bg-transparent border-0 cursor-pointer p-0
              "
            >
              {expanded ? "Read Less" : "Read More"}
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
                aria-hidden="true"
                style={{
                  transform: expanded
                    ? "rotate(180deg) translateX(-2px)"
                    : "none",
                  transition: "transform 0.3s ease",
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* ── Right column: Mission card ────────────────────── */}
          <div
            className={`${fadeBase} ${fadeIn}`}
            style={{ transitionDelay: "150ms" }}
          >
            {/* Card with prominent orange left accent border */}
            <div
              className="relative bg-slate-50 rounded-xl p-6 overflow-hidden h-full 
                transition-all duration-300 ease-out
                hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(249,115,22,0.12)] 
                hover:-translate-y-0.5 group"
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 rounded-l-xl 
             transition-all duration-300 ease-out 
             group-hover:w-2 group-hover:bg-orange-600"
                aria-hidden="true"
              />

              {/* "Our Mission" label */}
              <p
                className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-500 mb-3 
              transition-colors duration-300 group-hover:text-orange-600"
              >
                Our Mission
              </p>

              {/* Mission statement in italic quote style */}
              <p className="text-[15px] leading-relaxed text-slate-600 italic">
                &ldquo;{mission}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
