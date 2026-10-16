import React, { useState } from "react";
import {
  FiUserPlus,
  FiSearch,
  FiSend,
  FiCheckSquare,
  FiArrowRight,
  FiShield,
  FiZap,
  FiCheck,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    id: 1,
    stepNum: "01",
    title: "Create Single Profile",
    shortDesc: "Sign up, build your profile, and upload documents just once.",
    icon: <FiUserPlus className="w-6 h-6" />,
    badge: "Takes 2 Minutes",
    highlights: [
      "Upload documents once, based on your program level",
      "Secure JWT-based authentication",
      "Single reusable profile for BS, MS & PhD applications",
    ],
    actionText: "Build Your Profile",
    actionRoute: "/signup/student",
    previewBg: "from-orange-500/10 to-amber-500/10",
  },
  {
    id: 2,
    stepNum: "02",
    title: "Search & Compare",
    shortDesc:
      "Filter institutions by merit, location, and fees. Compare side-by-side.",
    icon: <FiSearch className="w-6 h-6" />,
    badge: "19+ Verified Campuses",
    highlights: [
      "Filter by fee range, entry test, and city",
      "Side by side comparison across campuses",
      "See distance from your location to each campus",
    ],
    actionText: "Explore Universities",
    actionRoute: "/homepage",
    previewBg: "from-blue-500/10 to-indigo-500/10",
  },
  {
    id: 3,
    stepNum: "03",
    title: "1-Click Apply",
    shortDesc: "Submit applications to multiple universities instantly.",
    icon: <FiSend className="w-6 h-6" />,
    badge: "Instant Submission",
    highlights: [
      "No repetitive form filling required",
      "Submit once, applies across your saved universities",
      "Track status from 'Submitted' to 'Confirmed'",
    ],
    actionText: "View Open Admissions",
    actionRoute: "/homepage",
    previewBg: "from-emerald-500/10 to-teal-500/10",
  },
  {
    id: 4,
    stepNum: "04",
    title: "Hostel Discovery",
    shortDesc: "Find physically verified hostels near your university.",
    icon: <FiCheckSquare className="w-6 h-6" />,
    badge: "Trusted Hostels",
    highlights: [
      "Browse 100% verified hostel properties",
      "View room amenities and mess menu details",
      "Check rent, capacity, and gender-specific availability",
    ],
    actionText: "Find Hostels",
    actionRoute: "/#hostels",
    previewBg: "from-purple-500/10 to-pink-500/10",
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const currentStep = steps[activeStep];

  // Function to check if user is logged in
  // Note: Adjust this based on how you store auth state (e.g., Context, Redux, or localStorage)
  const isAuthenticated = () => {
    return localStorage.getItem("token"); // Assuming you save a JWT token on login
  };

  const handleActionClick = () => {
    // Special condition for Step 1
    if (currentStep.id === 1) {
      if (isAuthenticated()) {
        navigate("/profile"); // Logged in users go to profile
      } else {
        navigate("/signup/student"); // Guests go to signup
      }
      return;
    }

    // Default behavior for other steps
    if (currentStep.actionRoute.startsWith("/#")) {
      const id = currentStep.actionRoute.replace("/#", "");
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(currentStep.actionRoute);
    }
  };

  return (
    <section
      id="how-it-works"
      className="bg-slate-900 text-white py-10 relative overflow-hidden"
    >
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-1.5 rounded-full mb-4">
            <FiZap className="w-3.5 h-3.5" />
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight">
            From First Search to Campus Life <br />
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              In 4 Interactive Steps
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            Say goodbye to application chaos. See how UniFinder simplifies your
            journey.
          </p>
        </div>

        {/* Step Numbers & Connector Line */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 relative">
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(idx)}
                className={`group relative text-left p-4 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? "bg-slate-800/90 border-orange-500 shadow-lg shadow-orange-500/20 scale-[1.02]"
                    : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      isActive
                        ? "bg-orange-500 text-slate-950"
                        : "bg-slate-700 text-gray-300"
                    }`}
                  >
                    Step {s.stepNum}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-orange-500 text-slate-950"
                        : "bg-slate-700/80 text-gray-400 group-hover:text-white"
                    }`}
                  >
                    {s.icon}
                  </div>
                </div>

                <h4
                  className={`text-sm font-bold mb-1 transition-colors ${
                    isActive ? "text-orange-400" : "text-white"
                  }`}
                >
                  {s.title}
                </h4>

                <p className="text-xs text-gray-400 line-clamp-2">
                  {s.shortDesc}
                </p>

                {/* Progress bar line under button */}
                <div className="w-full bg-slate-700/50 h-1 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full bg-orange-500 transition-all duration-500 ${
                      isActive ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Interactive Showcase Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-500">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <FiShield className="w-3.5 h-3.5 text-orange-400" />
                {currentStep.badge}
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {currentStep.title}
              </h3>

              <p className="text-gray-300 text-sm leading-relaxed">
                {currentStep.shortDesc}
              </p>

              <div className="space-y-3 pt-2">
                {currentStep.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50"
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
                      <FiCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-200 font-medium">
                      {h}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={handleActionClick}
                  className="px-6 py-3 bg-orange-500 text-slate-950 rounded-xl font-bold text-sm hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/25 flex items-center gap-2 group"
                >
                  <span>{currentStep.actionText}</span>
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Visual Box - Simplified & Cleaned */}
            <div className="lg:col-span-5">
              <div
                className={`relative rounded-2xl p-6 bg-gradient-to-br ${currentStep.previewBg} border border-slate-700/80 space-y-4 h-full flex flex-col justify-center`}
              >
                <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-slate-950 flex items-center justify-center font-bold">
                      {currentStep.stepNum}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Current Phase</p>
                      <p className="text-sm font-bold text-white">
                        {currentStep.title}
                      </p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>

                {/* Progress Bar - Cleaned up */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Overall Progress</span>
                    <span className="text-orange-400 font-bold">
                      {((activeStep + 1) / 4) * 100}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-500"
                      style={{ width: `${((activeStep + 1) / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Interactive Navigation controls */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    disabled={activeStep === 0}
                    onClick={() =>
                      setActiveStep((prev) => Math.max(0, prev - 1))
                    }
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-gray-300 hover:text-white disabled:opacity-40 border border-slate-700 transition"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-400 font-medium">
                    {activeStep + 1} / {steps.length}
                  </span>
                  <button
                    disabled={activeStep === steps.length - 1}
                    onClick={() =>
                      setActiveStep((prev) =>
                        Math.min(steps.length - 1, prev + 1),
                      )
                    }
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-orange-500 text-slate-950 hover:bg-orange-400 disabled:opacity-40 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
