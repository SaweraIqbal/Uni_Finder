import { useRef, useState } from "react";
import {
  FiMapPin,
  FiCheckCircle,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";

const hostels = [];

function getGenderStyle(gender) {
  if (gender === "Girls Hostel") {
    return "bg-orange-500 hover:bg-orange-600";
  }
  return "bg-gray-800 hover:bg-black";
}

function HostelCard({ hostel, onViewDetails }) {
  const genderBg = getGenderStyle(hostel.gender);

  return (
    <article className="min-w-[280px] max-w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 hover:-translate-y-1.5 transition-all duration-300 scroll-snap-align-start flex flex-col group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={hostel.image}
          alt={hostel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Distance badge — top right */}
        <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
          <FiMapPin className="text-orange-500" style={{ width: "10px", height: "10px" }} />
          {hostel.distance}
        </span>

        {/* Gender badge — bottom left */}
        <span
          className={
            "absolute bottom-2.5 left-2.5 " +
            genderBg +
            " text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 transition-colors duration-200"
          }
        >
          {hostel.gender === "Girls Hostel" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "12px", height: "12px" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="5" />
              <path d="M12 13v8" />
              <path d="M9 18h6" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "12px", height: "12px" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21v-2a6 6 0 0 1 13 0v2" />
            </svg>
          )}
          {hostel.gender}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-[15px] leading-snug line-clamp-2 mb-1.5 group-hover:text-orange-600 transition-colors duration-200">
          {hostel.name}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
          <FiMapPin
            className="text-orange-400"
            style={{ width: "12px", height: "12px", flexShrink: 0 }}
          />
          <span className="line-clamp-1">{hostel.location}</span>
        </div>

        {/* Fee range */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-extrabold text-orange-600">
              &#8360; {hostel.minFee} &ndash; {hostel.maxFee}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">/mo</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {hostel.amenities.slice(0, 2).map(function (amenity, idx) {
            return (
              <span
                key={idx}
                className="flex items-center gap-1 bg-gray-50 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-gray-100 group-hover:border-orange-100 group-hover:bg-orange-50/50 transition-colors duration-200"
              >
                <FiCheckCircle
                  className="text-orange-500"
                  style={{ width: "10px", height: "10px" }}
                />
                {amenity}
              </span>
            );
          })}
          {hostel.amenities.length > 2 && (
            <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
              +{hostel.amenities.length - 2}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <button
            onClick={function () {
              onViewDetails(hostel);
            }}
            className="w-full py-2.5 border-2 border-orange-500 text-orange-500 text-sm font-semibold rounded-lg hover:bg-orange-500 hover:text-white hover:shadow-md hover:shadow-orange-200/50 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

export default function HostelCarousel() {
  const trackRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);

  const scroll = (direction) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: direction * 294, behavior: "smooth" });
    }
  };

  function handleViewDetails(hostel) {
    setSelectedHostel(hostel);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setSelectedHostel(null);
  }

  return (
    <section className="py-10 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-5 flex justify-between items-end">
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
              Accommodation
            </p>
            <h2 className="text-2xl font-bold text-gray-800">Nearby Hostels</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition active:scale-95"
              aria-label="Scroll left"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition active:scale-95"
              aria-label="Scroll right"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-5 max-w-2xl">
          Verified hostels near this campus with transparent pricing, real photos, and direct booking.
        </p>

        {/* Carousel */}
        <div
          ref={trackRef}
          className="flex gap-3.5 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {hostels.map((hostel) => (
            <HostelCard key={hostel.id} hostel={hostel} onViewDetails={handleViewDetails} />
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {["Physically Audited", "Zero Commission", "Real Photos", "Mess Menus Available"].map(
            function (badge, idx) {
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"
                >
                  <FiCheckCircle
                    className="text-orange-500"
                    style={{ width: "14px", height: "14px" }}
                  />
                  {badge}
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showModal && selectedHostel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="relative bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-orange-100 text-center"
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-slate-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-200/50">
              <FiClock className="text-white" style={{ width: "36px", height: "36px" }} />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Coming Soon</h3>
            <p className="text-sm text-gray-500 mb-2 leading-relaxed">Detailed page for</p>
            <p className="text-base font-bold text-orange-600 mb-6 line-clamp-2">
              {selectedHostel.name}
            </p>

            <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Distance</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedHostel.distance}</p>
              </div>
              <span className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Price</p>
                <p className="text-xs font-bold text-orange-600 mt-0.5">
                  &#8360; {selectedHostel.minFee} &ndash; {selectedHostel.maxFee}
                  <span className="text-gray-400 font-normal">/mo</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              We are working on bringing you full room galleries, mess menus, student reviews, and
              instant booking.
            </p>

            <button
              onClick={handleCloseModal}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition active:scale-95 shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
