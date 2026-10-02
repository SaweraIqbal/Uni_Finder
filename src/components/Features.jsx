import React, { useState } from "react";
import { FiArrowRight, FiCheckCircle, FiX, FiClock } from "react-icons/fi";

import searchIcon from "../assets/search.png";
import compareIcon from "../assets/compare.png";
import profileIcon from "../assets/profile.png";
import hostelIcon from "../assets/hostel.png";
import budgetIcon from "../assets/budget.png";

const features = [
  {
    id: 1,
    eyebrow: "SEARCH ACROSS CAMPUSES",
    heading: "Smart University Search",
    subheading:
      "Filter every campus by type, fees, entry test, and more — find the exact match in seconds.",
    image: searchIcon,
    detailTitle: "Centralized Search & Filters",
    details: [
      "Filter by university type — Govt, Semi-Govt, or Private",
      "Set your tuition budget and minimum merit score",
      "Narrow by entry test — ECAT, MDCAT, NAT, GAT, NTS, or no test required",
      "Show only campuses with hostel or scholarship availability",
    ],
  },
  {
    id: 2,
    eyebrow: "SIDE BY SIDE COMPARISON",
    heading: "Side-by-Side Comparison",
    subheading:
      "Compare campuses using your own filters, ranked by distance from you.",
    image: compareIcon,
    detailTitle: "Comprehensive Evaluation Matrix",
    details: [
      "Compare tuition fee breakdowns per semester",
      "Evaluate faculty ratio and research facilities",
      "Enter your location to see distance from each campus",
      "Review campus size and transport availability",
    ],
  },
  {
    id: 3,
    eyebrow: "1-CLICK SUBMISSIONS",
    heading: "Apply with single profile",
    subheading: "Create profile once, upload documents once, apply everywhere.",
    image: profileIcon,
    detailTitle: "Unified Student Application",
    details: [
      "Upload academic documents once, based on your program level",
      "Use a single reusable profile for BS, MS, and PhD applications",
      "Eliminate repetitive form submissions",
      "Track application status from Submitted to Confirmed",
    ],
  },
  {
    id: 4,
    eyebrow: "TRUSTED HOSTELS",
    heading: "Hostel Discovery",
    subheading: "Browse physically verified hostels near your university.",
    image: hostelIcon,
    detailTitle: "Authentic Accommodation Listings",
    details: [
      "Browse 100% verified hostel properties",
      "View room amenities and mess menu details",
      "Calculate distance from university campus",
      "Check rent, capacity, and gender-specific availability",
    ],
  },
  {
    id: 5,
    eyebrow: "COMING SOON",
    heading: "Commute & Budget Calculator",
    subheading:
      "Estimate total costs including tuition, hostel, and transport.",
    image: budgetIcon,
    detailTitle: "Total Cost of Education Forecaster",
    details: [
      "Calculate estimated semester or degree cost",
      "Includes tuition, hostel rent, and transport",
      "Plan finances for out-of-city accommodations",
      "Transparent expense estimation",
    ],
    isComingSoon: true,
  },
];

export default function Features() {
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <section
      id="features"
      className="bg-gradient-to-b from-white via-orange-50/20 to-white py-10 relative overflow-hidden"
    >
      {/* Decorative Background */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-100/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            Why Choose UniFinder
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Everything You Need,{" "}
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              One Unified Platform
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Stop jumping between fragmented portals. UniFinder integrates
            university search, applications, verified hostels, and budget tools
            into one smooth experience.
          </p>
        </div>

        {/* Cards Grid / Scrollable Area */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {features.map((feature) => (
              <div
                key={feature.id}
                onClick={() => setSelectedFeature(feature)}
                className={`group relative bg-white border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-2 snap-start flex-shrink-0 w-[340px] overflow-hidden ${
                  feature.isComingSoon
                    ? "border-dashed border-gray-300 hover:border-orange-300 opacity-90"
                    : "border-gray-100 hover:border-orange-200"
                }`}
              >
                {/* Top Icon & Eyebrow Section */}
                <div
                  className={`relative h-44 overflow-hidden flex flex-col items-center justify-center border-b ${
                    feature.isComingSoon
                      ? "bg-gradient-to-br from-slate-50 to-gray-50 border-gray-100"
                      : "bg-gradient-to-br from-orange-50 to-amber-50/50 border-gray-100"
                  }`}
                >
                  <img
                    src={feature.image}
                    alt={feature.heading}
                    className={`w-16 h-16 object-contain mb-3 transition-transform duration-300 group-hover:scale-110 ${
                      feature.isComingSoon
                        ? "opacity-40 grayscale"
                        : "[filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(346deg)_brightness(98%)_contrast(99%)]"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold tracking-wide px-3 py-1 rounded-full shadow-sm ${
                      feature.isComingSoon
                        ? "text-gray-500 bg-gray-100"
                        : "text-orange-700 bg-orange-100/80 backdrop-blur-sm"
                    }`}
                  >
                    {feature.isComingSoon && (
                      <FiClock className="w-3 h-3 inline mr-1 -mt-0.5" />
                    )}
                    {feature.eyebrow}
                  </span>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-grow justify-between">
                  <div>
                    <h3
                      className={`text-lg font-bold mb-2 transition-colors ${
                        feature.isComingSoon
                          ? "text-slate-500 group-hover:text-slate-600"
                          : "text-slate-800 group-hover:text-orange-600"
                      }`}
                    >
                      {feature.heading}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                      {feature.subheading}
                    </p>
                  </div>

                  {/* Interactive Hover Link */}
                  <div
                    className={`flex items-center gap-2 text-sm font-semibold pt-4 border-t mt-auto ${
                      feature.isComingSoon
                        ? "text-gray-400 border-gray-100 group-hover:text-gray-500"
                        : "text-orange-500 group-hover:text-orange-600 border-gray-100"
                    }`}
                  >
                    <span>
                      {feature.isComingSoon
                        ? "Preview Coming Soon"
                        : "Explore Feature Details"}
                    </span>
                    <FiArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
            {/* Modal Header */}
            <div
              className={`relative h-32 overflow-hidden flex items-center justify-center border-b ${
                selectedFeature.isComingSoon
                  ? "bg-gradient-to-br from-slate-50 to-gray-50 border-gray-100"
                  : "bg-gradient-to-br from-orange-50 to-amber-50/50 border-gray-100"
              }`}
            >
              <img
                src={selectedFeature.image}
                alt={selectedFeature.heading}
                className={`w-20 h-20 object-contain drop-shadow-md ${
                  selectedFeature.isComingSoon
                    ? "opacity-40 grayscale"
                    : "[filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(346deg)_brightness(98%)_contrast(99%)]"
                }`}
              />

              <button
                onClick={() => setSelectedFeature(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-slate-800 bg-white/90 hover:bg-white p-2 rounded-full transition shadow-sm border border-gray-100"
              >
                <FiX className="w-5 h-5" />
              </button>

              {/* Coming Soon badge in modal */}
              {selectedFeature.isComingSoon && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  <FiClock className="w-3 h-3" />
                  Coming Soon
                </span>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <div className="flex flex-col mb-4">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
                  {selectedFeature.eyebrow}
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  {selectedFeature.heading}
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-3 font-medium leading-relaxed">
                {selectedFeature.subheading}
              </p>

              <div className="bg-orange-50/60 rounded-2xl p-5 border border-orange-100 mb-3">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FiCheckCircle className="text-orange-500 w-5 h-5" />
                  {selectedFeature.detailTitle}
                </h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  {selectedFeature.details.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 shadow-md transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
