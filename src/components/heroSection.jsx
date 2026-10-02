import { useRef, useState, useEffect } from "react";
import { API } from "../api/client";

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1800&auto=format&fit=crop&q=80";

/** Map raw sector values to Private / Government / Semi-Government. */
export function sectorLabel(sector) {
  const s = (sector ?? "").toString().toLowerCase().trim();
  if (s === "government" || s === "govt" || s === "govt." || s === "public") {
    return "Government";
  }
  if (s.includes("semi")) return "Semi-Government";
  return "Private";
}

function resolveBanner(university) {
  const raw = university?.banner_url;
  if (!raw) return DEFAULT_BANNER;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API}${raw}`;
}

export default function HeroSection({ university }) {
  const bannerRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  const bannerUrl = resolveBanner(university);
  const title = university?.name || "University of Central Punjab";
  const hecRank = university?.hec_rank ?? university?.ranking;
  const sector = sectorLabel(university?.sector);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (bannerRef.current) {
      bannerRef.current.style.transform = `translateY(${scrollY * 0.25}px)`;
    }
  }, [scrollY]);

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "clamp(220px, 32vw, 400px)" }}
    >
      <div
        ref={bannerRef}
        className="absolute will-change-transform"
        style={{
          inset: "-60px 0 -60px 0",
          backgroundImage: `url('${bannerUrl}')`,
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

      <div className="relative z-10 h-full flex flex-col justify-end">
        <div className="max-w-6xl mx-auto w-full px-6 pb-20">
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
              HEC Rank #{hecRank}
            </span>

            <span className="inline-flex items-center bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 shadow-sm">
              {sector}
            </span>
          </div>

          <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight drop-shadow-md">
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
