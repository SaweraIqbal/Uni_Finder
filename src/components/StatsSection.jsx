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
    { value: "150+", label: "Partner Universities" },
    { value: "25K+", label: "Active Students" },
    { value: "1M+", label: "Monthly Searches" },
    { value: "500+", label: "Verified Hostels" },
  ];

  return (
    <section ref={ref} className="bg-gray-50 py-5 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`text-center p-6 bg-white rounded-2xl shadow-sm transition-all duration-700 ${
                idx === 0
                  ? "delay-0"
                  : idx === 1
                    ? "delay-150"
                    : idx === 2
                      ? "delay-300"
                      : "delay-450"
              } ${
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              } hover:shadow-md hover:-translate-y-1 transition-all duration-300`}
            >
              <h3 className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">
                {stat.value}
              </h3>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
