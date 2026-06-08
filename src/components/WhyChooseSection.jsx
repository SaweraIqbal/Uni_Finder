import React from "react";

function WhyChooseSection() {
  const features = [
    {
      icon: "🎓",
      title: "Top Universities",
      description:
        "Discover the best universities across Pakistan with updated data and comprehensive information.",
    },
    {
      icon: "⚡",
      title: "Smart Search & Filters",
      description:
        "Find universities by program, city, fee, and admission status in seconds with advanced filtering.",
    },
    {
      icon: "💼",
      title: "Career-Focused Programs",
      description:
        "Choose programs that match your future career goals with detailed program information.",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Why Choose UniFinder?
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            We help students find the best universities quickly, easily, and
            with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-8 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-2 transition duration-300 bg-gray-50"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-xl text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseSection;
