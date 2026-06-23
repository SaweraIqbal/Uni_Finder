import React, { useEffect, useRef, useState } from "react";

const Icon = ({ name, size = 24, filled = false, className = "" }) => (
  <span
    className={`material-symbols-outlined ${filled ? "fill" : ""} ${className}`}
    style={{ fontSize: size }}
  >
    {name}
  </span>
);

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

export default function ApplyCard({ onApply, onDownload }) {
  const [ref, visible] = useReveal();

  return (
    <section
      ref={ref}
      className={`py-20 px-[1rem] md:px-[5rem] transition-all duration-600 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 p-12 text-center text-white shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-[36px] leading-[44px] tracking-[-0.02em] font-extrabold mb-6 md:text-[48px] md:leading-[56px]">
            Ready to join our community?
          </h2>
          <p className="text-[18px] leading-[28px] mb-10 max-w-2xl mx-auto opacity-90">
            Start your journey today and discover a world of possibilities at
            Tech-Poly University.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button
              onClick={onDownload}
              className="bg-white text-orange-500 px-10 py-4 rounded-full text-[20px] leading-[28px] font-semibold hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Download Prospectus
            </button>
            <button
              onClick={onApply}
              className="bg-white/20 text-white px-10 py-4 rounded-full text-[20px] leading-[28px] font-semibold border border-white/30 hover:bg-white/30 hover:-translate-y-0.5 transition-all"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
