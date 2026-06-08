import React, { useState, useEffect, useRef } from "react";

function StatsSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: "150+", label: "Universities Covered" },
    { value: "25K+", label: "Students Helped" },
    { value: "1M+", label: "Monthly Searches" },
  ];

  return (
    <section ref={ref} className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-16">
          Our Impact in Numbers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`transition-all duration-700 ${idx === 0 ? "delay-0" : idx === 1 ? "delay-200" : "delay-400"} ${
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h3 className="text-6xl font-bold text-orange-500 mb-3">
                {stat.value}
              </h3>
              <p className="text-gray-600 text-lg">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
