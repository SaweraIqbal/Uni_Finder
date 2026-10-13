import { useRef, useState, useEffect } from "react";
import { API } from "../api/client";

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1800&auto=format&fit=crop&q=80";
const DEFAULT_LOGO =
  "https://ui-avatars.com/api/?name=U&background=f97316&color=fff&size=128&bold=true";

/** Map raw sector values → display label. */
export function sectorLabel(sector) {
  const s = (sector ?? "").toString().toLowerCase().trim();
  if (s === "government" || s === "govt" || s === "govt." || s === "public")
    return "Government";
  if (s.includes("semi")) return "Semi-Government";
  return "Private";
}

function resolveUrl(raw) {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API}${raw}`;
}

export default function HeroSection({ university, onCompare, isWishlisted, onWishlist }) {
  const bannerRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [wished, setWished] = useState(isWishlisted ?? false);

  const bannerUrl = resolveUrl(university?.banner_url) ?? DEFAULT_BANNER;
  const logoUrl   = resolveUrl(university?.logo_url)   ?? DEFAULT_LOGO;
  const title     = university?.name || "University of Central Punjab";
  const hecRank   = university?.hec_rank ?? university?.ranking;
  const sector    = sectorLabel(university?.university_type ?? university?.sector);

  // sync external wishlist state
  useEffect(() => { setWished(isWishlisted ?? false); }, [isWishlisted]);

  // parallax
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (bannerRef.current)
      bannerRef.current.style.transform = `translateY(${scrollY * 0.25}px)`;
  }, [scrollY]);

  function handleWishlist() {
    setWished((v) => !v);
    onWishlist?.(!wished);
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "320px" }}
      aria-label="University hero banner"
    >
      {/* ── Parallax background image ── */}
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

      {/* ── Dark gradient overlay (bottom-heavy) ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.08) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Content layer ── */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Top-right: Add to Compare + Wishlist */}
        <div className="flex justify-end px-6 pt-5 gap-3">
          <button
            onClick={onCompare}
            className="
              inline-flex items-center gap-2
              bg-orange-500 hover:bg-orange-600 active:scale-95
              text-white text-[13px] font-semibold
              rounded-full px-4 py-2 shadow-md
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300
            "
            aria-label="Add this university to compare"
          >
            {/* ± icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add to Compare
          </button>

          <button
            onClick={handleWishlist}
            className="
              w-9 h-9 flex items-center justify-center
              rounded-full border-2 border-white/80
              bg-white/10 backdrop-blur-sm
              hover:bg-white/20 active:scale-95
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60
            "
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wished}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24"
              fill={wished ? "#f97316" : "none"}
              stroke={wished ? "#f97316" : "white"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Bottom: pills + logo + title */}
        <div className="mt-auto">
          <div className="max-w-6xl mx-auto w-full px-6 pb-20">

            {/* Badge pills */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {hecRank ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  HEC Rank #{hecRank}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  HEC Recognized
                </span>
              )}

              <span className="inline-flex items-center bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 shadow-sm">
                {sector}
              </span>
            </div>

            {/* Logo + Title row */}
            <div className="flex items-center gap-5">
              {/* 72px circular logo with white ring */}
              <img
                src={logoUrl}
                alt={`${title} logo`}
                className="w-[72px] h-[72px] rounded-full object-cover ring-4 ring-white shadow-lg flex-shrink-0"
                onError={(e) => { e.currentTarget.src = DEFAULT_LOGO; }}
              />

              <h1 className="font-bold text-3xl sm:text-4xl md:text-[2.6rem] text-white leading-tight drop-shadow-md">
                {title}
              </h1>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
