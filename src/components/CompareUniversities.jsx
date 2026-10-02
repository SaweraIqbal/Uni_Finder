import React from "react";
import { FiLayers, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function CompareUniversities() {
  const navigate = useNavigate();

  return (
    <section
      id="compare"
      className="bg-gradient-to-b from-white via-orange-50/20 to-white py-5 relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center gap-6">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full">
          <FiLayers className="w-3.5 h-3.5" />
          Smart Comparison Tool
        </span>

        {/* Heading */}
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Compare Campuses{" "}
          <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            Side-by-Side
          </span>
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-base leading-relaxed max-w-xl">
          Evaluate fee structures, faculty ratios, and distance from your
          location. Make informed decisions without opening multiple browser
          tabs.
        </p>
        {/* Demo Video Placeholder */}
        <div className="w-full relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 aspect-video bg-slate-900 mt-4">
          <video
            className="w-full h-full object-cover"
            controls
            poster="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
          >
            {/* Replace this with your actual demo video path */}
            <source
              src="https://www.w3schools.com/html/mov_bbb.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
}
