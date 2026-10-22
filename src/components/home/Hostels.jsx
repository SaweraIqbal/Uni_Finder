// C:\Users\Track Computers\Downloads\testfolder\uni-finder\src\components\Hostels.jsx
import React, { useState, useRef } from "react";
import {
  FiMapPin,
  FiStar,
  FiCheckCircle,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";

const hostelList = [
  {
    id: 1,
    name: "Al-Noor Executive Boys Hostel",
    Location: "ALi Town, Lahore",
    minFee: "12k",
    maxFee: "18k",
    reviews: "142",
    image: "https://picsum.photos/seed/hostel-room-1/700/400.jpg",
    amenities: [
      "High-speed WiFi",
      "Air Conditioned",
      "3-Time Mess",
      "Security & CCTV",
    ],
    gender: "Boys Hostel",
  },
  {
    id: 2,
    name: "LUMS Residency Girls Hostel",
    Location: "Farozpur Road, Lahore",
    minFee: "18k",
    maxFee: "25k",
    image: "https://picsum.photos/seed/hostel-room-2/700/400.jpg",
    amenities: [
      "Biometric Entry",
      "AC & Generator",
      "Hygiene Mess",
      "Laundry Service",
    ],
    gender: "Girls Hostel",
  },
  {
    id: 3,
    name: "Capital Executive Student Lodge",
    Location: "G-10, Islamabad",
    minFee: "14k",
    maxFee: "22k",
    reviews: "210",
    image: "https://picsum.photos/seed/hostel-room-3/700/400.jpg",
    amenities: [
      "UPS Back-up",
      "Weekly Mess Menu",
      "Daily Housekeeping",
      "Study Room",
    ],
    gender: "Boys Hostel",
  },
  {
    id: 4,
    name: "Blue Area Scholars Lodge",
    Location: "Blue Area, Islamabad",
    minFee: "10k",
    maxFee: "16k",
    reviews: "87",
    image: "https://picsum.photos/seed/hostel-room-4/700/400.jpg",
    amenities: ["WiFi", "Mess Included", "Laundry", "Parking"],
    gender: "Boys Hostel",
  },
  {
    id: 5,
    name: "DHA Phase 5 Girls Residence",
    Location: "DHA Phase 5, Lahore",
    minFee: "20k",
    maxFee: "30k",
    image: "https://picsum.photos/seed/hostel-room-5/700/400.jpg",
    amenities: ["24/7 Security", "AC Rooms", "3 Meals", "Transport"],
    gender: "Girls Hostel",
  },
  {
    id: 6,
    name: "I-8 Student Enclave",
    Location: "I-8, Islamabad",
    minFee: "12k",
    maxFee: "20k",
    image: "https://picsum.photos/seed/hostel-room-6/700/400.jpg",
    amenities: ["Generator", "Hot Water", "Mess", "Common Room"],
    gender: "Boys Hostel",
  },
];

function getGenderStyle(gender) {
  if (gender === "Girls Hostel") {
    return "bg-orange-500 hover:bg-orange-600";
  }
  return "bg-gray-800 hover:bg-black";
}

function HostelCard({ hostel, onViewDetails }) {
  var genderBg = getGenderStyle(hostel.gender);

  return (
    <article className="min-w-[280px] max-w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 hover:-translate-y-1.5 transition-all duration-300 scroll-snap-align-start flex flex-col group">
      {/* Image area */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={hostel.image}
          alt={hostel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gender badge — visible with solid background */}
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
          <span className="line-clamp-1">{hostel.Location}</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-right">
            <span className="text-lg font-extrabold text-orange-600">
              ₨ {hostel.minFee} – {hostel.maxFee}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">/mo</span>
          </div>
        </div>

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

export default function Hostels() {
  var trackRef = useRef(null);

  var modalState = useState(false);
  var showModal = modalState[0];
  var setShowModal = modalState[1];

  var hostelState = useState(null);
  var selectedHostel = hostelState[0];
  var setSelectedHostel = hostelState[1];

  function scroll(direction) {
    if (trackRef.current) {
      trackRef.current.scrollBy({
        left: direction * 294,
        behavior: "smooth",
      });
    }
  }

  function handleViewDetails(hostel) {
    setSelectedHostel(hostel);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setSelectedHostel(null);
  }

  return (
    <section id="hostels" className="py-5 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-5 flex justify-between items-end">
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
              Accommodation
            </p>
            <h2 className="text-2xl font-bold text-gray-800">
              Universities Hostels
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={function () {
                scroll(-1);
              }}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition active:scale-95"
              aria-label="Scroll left"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={function () {
                scroll(1);
              }}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition active:scale-95"
              aria-label="Scroll right"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-5 max-w-2xl">
          Physically audited hostels with real room photos, transparent mess
          menus, and zero-commission direct booking near your campus.
        </p>

        {/* Carousel */}
        <div
          ref={trackRef}
          className="flex gap-3.5 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {hostelList.map(function (hostel) {
            return (
              <HostelCard
                key={hostel.id}
                hostel={hostel}
                onViewDetails={handleViewDetails}
              />
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {[
            "Physically Audited",
            "Zero Commission",
            "Real Photos",
            "Mess Menus Available",
          ].map(function (badge, idx) {
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
          })}
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

            {/* Animated icon */}
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-200/50">
              <FiClock
                className="text-white"
                style={{ width: "36px", height: "36px" }}
              />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
              Coming Soon
            </h3>

            <p className="text-sm text-gray-500 mb-2 leading-relaxed">
              Detailed page for
            </p>

            <p className="text-base font-bold text-orange-600 mb-6 line-clamp-2">
              {selectedHostel.name}
            </p>

            <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">
                  Distance
                </p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {selectedHostel.distance}
                </p>
              </div>
              <span className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">
                  Price
                </p>
                <p className="text-xs font-bold text-orange-600 mt-0.5">
                  ₨ {selectedHostel.minFee} – {selectedHostel.maxFee}
                  <span className="text-gray-400 font-normal">/mo</span>
                </p>
              </div>
              <span className="w-px h-8 bg-gray-200" />
            </div>

            <p className="text-xs text-gray-400 mb-6">
              We are working on bringing you full room galleries, mess menus,
              student reviews, and instant booking.
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
