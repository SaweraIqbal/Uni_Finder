import React, { useState } from "react";
import {
  FiXCircle,
  FiCheckCircle,
  FiArrowRight,
  FiAlertTriangle,
  FiDollarSign,
  FiZap,
  FiSliders,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function ProblemFuture() {
  const navigate = useNavigate();

  // Interactive Comparison View State
  const [viewMode, setViewMode] = useState("after"); // 'before' | 'after'

  return (
    <section className="bg-white py-5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 space-y-24">
        {/* SECTION 1: THE PROBLEM VS SOLUTION */}
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full mb-4">
            <FiAlertTriangle className="w-3.5 h-3.5" />
            The Problem We Solve
          </span>

          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
            University Admissions Don't Have to Be{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Stressful & Chaotic
            </span>
          </h2>

          <p className="text-gray-600 leading-relaxed text-base mb-5 max-w-xl mx-auto text-justify">
            Every year, thousands of Pakistani students struggle with scattered
            websites, fake hostel photos, hidden fees, and complex forms.
            UniFinder unifies your entire journey into one smooth dashboard.
          </p>

          {/* Interactive Toggle Switch */}
          <div className="inline-flex items-center p-1.5 bg-gray-100 rounded-2xl mb-7 border border-gray-200">
            <button
              onClick={() => setViewMode("before")}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === "before"
                  ? "bg-red-500 text-white shadow-md"
                  : "text-gray-600 hover:text-red-500"
              }`}
            >
              ❌ Traditional Way
            </button>
            <button
              onClick={() => setViewMode("after")}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === "after"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-600 hover:text-emerald-600"
              }`}
            >
              ✅ The UniFinder Way
            </button>
          </div>

          {/* Before vs After Cards */}
          <div className="grid md:grid-cols-2 gap-8 text-left">
            {/* Without UniFinder */}
            <div
              className={`p-8 rounded-3xl border transition-all duration-500 ${
                viewMode === "before"
                  ? "bg-red-50/90 border-red-300 shadow-xl scale-[1.02]"
                  : "bg-red-50/30 border-red-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 text-red-600 font-extrabold text-lg mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                  <FiXCircle className="w-6 h-6" />
                </div>
                <span>Without UniFinder</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-3 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Opening 20+ tabs with outdated prospectus data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Unverified hostel scams & misleading photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Surprise semester charges & hidden bus fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>
                    Filling out 5 different application portals manually
                  </span>
                </li>
              </ul>
            </div>

            {/* With UniFinder */}
            <div
              className={`p-8 rounded-3xl border transition-all duration-500 ${
                viewMode === "after"
                  ? "bg-emerald-50/90 border-emerald-300 shadow-xl scale-[1.02]"
                  : "bg-emerald-50/30 border-emerald-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 text-emerald-700 font-extrabold text-lg mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <span>With UniFinder</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-3 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Compare all campuses on 1 clean matrix</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>100% physically audited & verified hostels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Transparent fee structures, no hidden charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Single common profile, apply everywhere instantly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
