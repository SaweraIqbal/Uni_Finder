import React, { useState } from "react";

function PopularUniversities() {
  const [scrollPos, setScrollPos] = useState(0);

  const universities = [
    {
      id: 1,
      name: "LUMS Lahore",
      image:
        "https://i.pinimg.com/736x/a8/1c/0c/a81c0cd4a1d61e908d9337b9c45fa47b.jpg",
      programs: 12,
    },
    {
      id: 2,
      name: "FAST University",
      image:
        "https://i.pinimg.com/736x/a8/1c/0c/a81c0cd4a1d61e908d9337b9c45fa47b.jpg",
      programs: 8,
    },
    {
      id: 3,
      name: "NUST Islamabad",
      image:
        "https://i.pinimg.com/736x/a8/1c/0c/a81c0cd4a1d61e908d9337b9c45fa47b.jpg",
      programs: 15,
    },
    {
      id: 4,
      name: "UET Lahore",
      image:
        "https://i.pinimg.com/736x/a8/1c/0c/a81c0cd4a1d61e908d9337b9c45fa47b.jpg",
      programs: 10,
    },
    {
      id: 5,
      name: "Iqra University",
      image:
        "https://i.pinimg.com/736x/a8/1c/0c/a81c0cd4a1d61e908d9337b9c45fa47b.jpg",
      programs: 9,
    },
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-gray-800 mb-12">
          Popular Universities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {universities.map((uni) => (
            <div
              key={uni.id}
              className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 cursor-pointer"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={uni.image}
                  alt={uni.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800">{uni.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {uni.programs} Programs
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PopularUniversities;
