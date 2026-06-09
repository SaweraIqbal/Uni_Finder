import { useEffect, useRef, useState } from "react";
import { API } from "../api/client";

const DEFAULT_BANNER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Xz3eug4e42KFeJWWhUMRobzf3lfoNu7Jv9W-QR1dER6bNbt-0OXDIdxDkj8EtJITofOwuoDh7iNGbXQRT19Lk278bD8oieqE-neuEFHnmRnP8j9qBDjRxqKzNUWoROLnLIgusQsYCQ-SeCSq1r3TfPQ1Jp9CLw-LEnbJUJNMDG1Tntw2KJ9UZdTmX6s7ya5rBfgCAjxiOCE4WT9Zg4k7ZZARVdftxEm1uw6mI8rKPowGJgMftda-uPpLTFawPp6qSKqN1KM-QTM";

export default function HeroSection({ university }) {
  const parallaxRef = useRef(null);
  const [scrollPos, setScrollPos] = useState(0);

  const bannerUrl = university?.banner_url
    ? `${API}${university.banner_url}`
    : DEFAULT_BANNER;
  const title =
    university?.tagline || "Excellence in Education, Leadership for Life";
  const subtitle =
    university?.hero_subtitle ||
    "To empower students through innovative learning and research.";

  useEffect(() => {
    const handleScroll = () => {
      const pos = window.pageYOffset;
      setScrollPos(pos < window.innerHeight ? pos * 0.4 : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (parallaxRef.current) {
      parallaxRef.current.style.transform = `translateY(${scrollPos}px)`;
    }
  }, [scrollPos]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Parallax Background */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 z-0 parallax-bg will-change-transform"
        style={{
          backgroundImage: `url('${bannerUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-orange-500/40 backdrop-brightness-75"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-6">
        <h1 className="font-bold text-4xl md:text-6xl text-white mb-4 drop-shadow-lg">
          {title}
        </h1>
        <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            className="bg-orange-500 text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            aria-label="Explore campus"
          >
            Explore Campus
          </button>
          <button
            className="border-2 border-white text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-white/10 backdrop-blur-sm active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            aria-label="Learn more about St. Jude University"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
