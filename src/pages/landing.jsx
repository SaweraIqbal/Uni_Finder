import React, { useState, useEffect } from "react";
import { FiArrowUp } from "react-icons/fi";
import heroVideo from "../assets/video2.mp4";
import SearchBar from "../components/SearchBar";
import StatsSection from "../components/StatsSection";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import CompareUniversities from "../components/CompareUniversities";
import Universities from "../components/Universities";
import Hostels from "../components/Hostels";
// import Reviews from "../components/Reviews";
import ProblemFuture from "../components/ProblemFuture";
import { useLocation } from "react-router-dom";

export default function LandingPage() {
  const location = useLocation();
  const [searchValues, setSearchValues] = useState({
    program: "",
    city: "",
    university: "",
  });

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(
    function () {
      var hash = window.location.hash;
      if (hash) {
        var el = document.querySelector(hash);
        if (el) {
          setTimeout(function () {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }
    },
    [location],
  );
  return (
    <div className="bg-white min-h-screen relative text-slate-900 font-sans">
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-[60] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Removed overflow-hidden to match your HomePage exactly */}
      <section className="relative min-h-[420px] sm:min-h-[520px] lg:min-h-[640px] flex justify-center bg-slate-950">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black bg-opacity-45" />

        {/* Added relative z-10 exactly like your HomePage */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center items-center">
          <div className="text-center text-white mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Find Your Future at the Perfect University
            </h2>
            <p className="text-sm sm:text-lg md:text-xl text-gray-100 max-w-3xl mx-auto">
              Discover universities, compare programs, explore admissions, and
              make informed decisions for your academic future.
            </p>
          </div>

          <SearchBar
            onShowAdvancedFilters={() => setShowAdvancedFilters(true)}
            searchValues={searchValues}
            onSearchChange={setSearchValues}
          />
        </div>
      </section>

      <Universities />
      <Hostels />
      <Features />
      <HowItWorks />
      <CompareUniversities />
      {/* <Reviews /> */}
      <ProblemFuture />

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/30 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <FiArrowUp className="w-5 h-5" />
        </button>
      )}

      <StatsSection />
    </div>
  );
}

