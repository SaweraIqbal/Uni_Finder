import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "12k+", label: "Active students" },
  { value: "94%", label: "Graduate employment" },
  { value: "60+", label: "Partner countries" },
];

const mvCards = [
  {
    id: "mission",
    variant: "mission",
    tag: "Core purpose",
    title: "Our Mission",
    body: "To foster a community of scholars and leaders through rigorous inquiry, collaborative discovery, and a deep commitment to societal betterment.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    id: "vision",
    variant: "vision",
    tag: "Long-term goal",
    title: "Our Vision",
    body: "To be a global leader in interdisciplinary education, bridging the gap between knowledge and societal impact across generations.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

function FadeIn({ isVisible, delay = 0, children, className = "" }) {
  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function AboutCard({ isVisible }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <FadeIn isVisible={isVisible} delay={0}>
      <div
        className="group relative bg-white rounded-2xl p-7 border border-slate-200/70
          flex flex-col justify-center overflow-hidden h-full
          transition-all duration-300 ease-in-out
          hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
        role="article"
      >
        <span
          className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-2xl
            scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center"
          aria-hidden="true"
        />

        <p className="text-[11px] font-semibold tracking-widest uppercase text-orange-500 mb-2.5">
          Est. 1892 · Lahore, Pakistan
        </p>

        <h2 className="text-[22px] leading-tight text-slate-800 mb-3 font-bold">
          Dedicated to Academic Rigor
        </h2>

        <p className="text-sm leading-relaxed text-slate-500">
          St. Jude University is a world-renowned institution fostering an
          environment where innovation meets tradition. Over a century of
          excellence in scholarship and research.
        </p>

        <div
          className="overflow-hidden transition-all duration-400 ease-in-out"
          style={{
            maxHeight: expanded ? "120px" : "0px",
            marginTop: expanded ? "12px" : "0px",
          }}
          aria-hidden={!expanded}
        >
          <p className="text-sm leading-relaxed text-slate-500">
            Our graduates lead industries across 60+ countries. With a 94%
            graduate employment rate and 12 research centers, we bridge
            knowledge with real-world impact through interdisciplinary
            collaboration and hands-on learning.
          </p>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-4 self-start flex items-center gap-1.5 text-sm font-semibold
            text-orange-500 hover:gap-2.5 transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
            focus-visible:ring-offset-2 rounded bg-transparent border-0 cursor-pointer p-0"
        >
          {expanded ? "Read less" : "Read more"}
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
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </FadeIn>
  );
}

function RankingCard({ isVisible }) {
  return (
    <FadeIn isVisible={isVisible} delay={80}>
      <div
        className="relative bg-slate-800 rounded-2xl p-7 h-full
          flex flex-col items-center justify-center text-center overflow-hidden
          transition-all duration-300 ease-in-out
          hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-800/20"
        role="article"
        aria-label="Global ranking: number 48"
      >
        <span
          className="absolute bottom-[-30px] right-[-30px] w-[120px] h-[120px]
            rounded-full border border-orange-500/25 pointer-events-none"
          aria-hidden="true"
        />
        <span
          className="absolute bottom-[-52px] right-[-52px] w-[170px] h-[170px]
            rounded-full border border-orange-500/10 pointer-events-none"
          aria-hidden="true"
        />

        <span
          className="inline-flex items-center gap-1.5 bg-orange-500/15 border
            border-orange-500/30 rounded-full px-3 py-1 text-[11px] font-semibold
            tracking-widest uppercase text-orange-400 mb-4"
        >
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
            aria-hidden="true"
          >
            <path d="M8 21h8M12 17V3M5 8l7-5 7 5" />
          </svg>
          Global standing
        </span>

        <div className="relative z-10 flex items-start leading-none">
          <span className="text-orange-400 font-bold text-2xl mt-2 mr-0.5">
            #
          </span>
          <span className="text-white text-6xl leading-none">48</span>
        </div>

        <p className="text-[11px] font-semibold tracking-widest uppercase text-white/40 mt-2 relative z-10">
          World University Ranking
        </p>

        <div className="flex gap-2 mt-4 flex-wrap justify-center relative z-10">
          {["QS Ranked", "Times Higher Ed", "2026"].map((pill) => (
            <span
              key={pill}
              className="rounded-full px-2.5 py-1 text-[11px] text-white/55"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "0.5px solid rgba(255,255,255,0.14)",
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

function MissionVisionCard({ card, isVisible, delay }) {
  const isMission = card.variant === "mission";

  return (
    <FadeIn isVisible={isVisible} delay={delay}>
      <div
        className={`rounded-2xl p-6 flex flex-col gap-3 overflow-hidden h-full
          transition-all duration-300 ease-in-out hover:-translate-y-1 ${
            isMission
              ? "bg-orange-500 hover:shadow-lg hover:shadow-orange-500/30"
              : "bg-white border border-slate-200/70 hover:border-slate-300 hover:shadow-lg"
          }`}
        role="article"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
              isMission
                ? "bg-white/20 text-white"
                : "bg-orange-50 text-orange-500"
            }`}
          >
            {card.icon}
          </div>
          <h3
            className={`text-base font-semibold ${
              isMission ? "text-white" : "text-slate-800"
            }`}
          >
            {card.title}
          </h3>
        </div>

        <p
          className={`text-[13.5px] leading-relaxed ${
            isMission ? "text-white/85" : "text-slate-500"
          }`}
        >
          {card.body}
        </p>

        <span
          className={`mt-auto self-start text-[11px] font-semibold tracking-widest uppercase
            rounded-full px-2.5 py-1 ${
              isMission
                ? "bg-white/20 text-white"
                : "bg-orange-50 text-orange-500"
            }`}
        >
          {card.tag}
        </span>
      </div>
    </FadeIn>
  );
}

function StatCard({ stat, isVisible, delay }) {
  const match = stat.value.match(/^(\d+)(.*)$/);
  const num = match ? match[1] : stat.value;
  const suffix = match ? match[2] : "";

  return (
    <FadeIn isVisible={isVisible} delay={delay}>
      <div
        className="bg-white rounded-xl p-4 text-center border border-slate-100
          transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md"
        role="listitem"
      >
        <div className="text-[26px] leading-none text-slate-800 font-bold">
          {num}
          <span className="text-orange-500">{suffix}</span>
        </div>
        <p className="text-xs font-semibold text-slate-400 mt-1.5 uppercase tracking-wide">
          {stat.label}
        </p>
      </div>
    </FadeIn>
  );
}

export default function UniversityInfo({ university }) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <section
      className="py-16 bg-gray-50"
      ref={sectionRef}
      aria-label="University information"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <AboutCard isVisible={isVisible} />
          <RankingCard isVisible={isVisible} />
          {mvCards.map((card, i) => (
            <MissionVisionCard
              key={card.id}
              card={card}
              isVisible={isVisible}
              delay={160 + i * 80}
            />
          ))}
        </div>

        <div
          className="grid grid-cols-3 gap-2.5 mt-3.5"
          role="list"
          aria-label="University statistics"
        >
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              stat={stat}
              isVisible={isVisible}
              delay={320 + i * 60}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
