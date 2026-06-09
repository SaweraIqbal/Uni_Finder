import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import heroVideo from "../assets/video1.mp4";
import logo from "../assets/Logo.png";
import SearchBar from "../components/SearchBar";
import { listUniversities } from "../api/university";
import { fileUrl } from "../api/client";
import WhyChooseSection from "../components/WhyChooseSection";
import PopularUniversities from "../components/PopularUniversities";
import StatsSection from "../components/StatsSection";
import Footer from "../components/footer";
import { useLocation } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state || {};
  const [filters, setFilters] = useState({
    admissionStatus: "",
    genderType: [],
    minMarks: 50,
    minFee: 0,
    maxFee: 1000000,
    entryTests: [],
    hostelAvailable: false,
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  const [searchValues, setSearchValues] = useState({
    program: locationState.program || "",
    city: locationState.city || "",
    university: locationState.university || "",
  });

  const handleResetAll = () => {
    setFilters({
      admissionStatus: "",
      genderType: [],
      minMarks: 50,
      minFee: 0,
      maxFee: 1000000,
      entryTests: [],
      hostelAvailable: false,
    });
    setSearchValues({ program: "", city: "", university: "" });
  };

  const { program, city, university } = locationState;
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          className="absolute w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black bg-opacity-45"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <div className="text-center text-white mb-12">
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              Find Your Future at the Perfect University
            </h2>
            <p className="text-lg md:text-xl text-gray-100 max-w-3xl mx-auto">
              Discover universities, compare programs, explore admissions, and
              make informed decisions for your academic future.
            </p>
          </div>

          {/* Search Bar Component */}
          <SearchBar
            onShowAdvancedFilters={() => setShowAdvancedFilters(true)}
            searchValues={searchValues}
            onSearchChange={setSearchValues}
          />
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Advanced Filters */}
          {showAdvancedFilters && (
            <div className="lg:col-span-1">
              <AdvancedFilters
                filters={filters}
                setFilters={setFilters}
                onResetAll={handleResetAll}
              />
            </div>
          )}

          {/* Universities Grid */}
          <div
            className={showAdvancedFilters ? "lg:col-span-3" : "lg:col-span-4"}
          >
            <UniversityGrid
              filters={filters}
              searchProgram={searchValues.program}
              searchCity={searchValues.city}
              searchUniversity={searchValues.university}
            />
          </div>
        </div>
      </section>

      <WhyChooseSection />
      <PopularUniversities />
      <StatsSection />
    </div>
  );
}

function AdvancedFilters({ filters, setFilters, onResetAll }) {
  const handleAdmissionChange = (status) =>
    setFilters((prev) => ({ ...prev, admissionStatus: status }));

  const handleGenderChange = (gender) =>
    setFilters((prev) => ({
      ...prev,
      genderType: prev.genderType.includes(gender)
        ? prev.genderType.filter((g) => g !== gender)
        : [...prev.genderType, gender],
    }));

  const handleEntryTestChange = (test) =>
    setFilters((prev) => ({
      ...prev,
      entryTests: prev.entryTests.includes(test)
        ? prev.entryTests.filter((t) => t !== test)
        : [...prev.entryTests, test],
    }));

  const handleResetAll = () => {
    setFilters({
      admissionStatus: "",
      genderType: [],
      minMarks: 50,
      minFee: 0,
      maxFee: 1000000,
      entryTests: [],
      hostelAvailable: false,
    });
    setSearchValues({ program: "", city: "", university: "" }); // ← also clears search bar
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Filters</h3>
        <button
          onClick={onResetAll}
          className="text-sm text-orange-500 hover:underline"
        >
          Reset All
        </button>
      </div>

      {/* Admission Status */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">Admission Status</h4>
        <div className="flex gap-1 flex-wrap">
          {[
            { label: "🟢 Open", value: "open" },
            { label: "⚪ Closed", value: "closed" },
            { label: "🔵 Coming", value: "coming" },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => handleAdmissionChange(status.value)}
              className={`px-2 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition ${
                filters.admissionStatus === status.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campus Gender Type */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">Campus Gender Type</h4>
        <div className="space-y-2">
          {["Co-Education", "Women Only", "Men Only"].map((gender) => (
            <label
              key={gender}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.genderType.includes(gender)}
                onChange={() => handleGenderChange(gender)}
                className="w-3.5 h-3.5 accent-orange-500"
              />
              <span className="text-sm text-gray-600">{gender}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Marks */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">
          Minimum Marks: {filters.minMarks}%
        </h4>
        <input
          type="range"
          min="50"
          max="100"
          value={filters.minMarks}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              minMarks: parseInt(e.target.value),
            }))
          }
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Tuition Fee Range */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">
          Tuition Fee Range (PKR)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Min Fee"
            value={filters.minFee === 0 ? "" : filters.minFee}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                minFee: e.target.value === "" ? 0 : parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
          />
          <input
            type="number"
            placeholder="Max Fee"
            value={filters.maxFee === 1000000 ? "" : filters.maxFee}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                maxFee:
                  e.target.value === "" ? 1000000 : parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
          />
        </div>
      </div>

      {/* Entry Test Requirement */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">
          Entry Test Requirement
        </h4>
        <div className="space-y-2">
          {[
            "No Test Required",
            "ECAT",
            "MDCAT",
            "NAT",
            "GAT",
            "NTS",
            "University Own Test",
          ].map((test) => (
            <label
              key={test}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.entryTests.includes(test)}
                onChange={() => handleEntryTestChange(test)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span className="text-gray-700 text-sm">{test}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Hostel Availability */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">
          Hostel Availability
        </h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hostelAvailable}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                hostelAvailable: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded accent-orange-500"
          />
          <span className="text-gray-700">Hostel Available</span>
        </label>
      </div>
    </div>
  );
}

// University Grid Component
function UniversityGrid({
  filters,
  searchProgram,
  searchCity,
  searchUniversity,
}) {
  const [viewMode, setViewMode] = useState("grid");

  // Real universities added by verified admins (shown first, before demo samples).
  const [realUnis, setRealUnis] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await listUniversities();
        if (Array.isArray(data)) {
          setRealUnis(
            data.map((u) => ({
              id: `real-${u.id}`,
              realId: u.id,
              name: u.name,
              location: u.city || "—",
              genderType: "Co-Education",
              entryTests: [],
              programs: u.tagline ? [u.tagline] : ["View details for programs"],
              admissionStatus: "open",
              fee: 0,
              rating: "—",
              image: u.logo_url
                ? fileUrl(u.logo_url)
                : "https://i.pinimg.com/736x/7a/39/0b/7a390b0d75f6973efed81f41df0038d0.jpg",
            }))
          );
        }
      } catch {
        /* keep demo data only */
      }
    })();
  }, []);

  const mockUniversities = [
    {
      id: 1,
      name: "LUMS Lahore",
      location: "Lahore",
      genderType: "Co-Education",
      entryTests: ["NAT", "University Own Test"],
      programs: ["BS Computer Science", "BBA"],
      admissionStatus: "open",
      fee: 800000,
      rating: 4.5,
      image:
        "https://i.pinimg.com/736x/7a/39/0b/7a390b0d75f6973efed81f41df0038d0.jpg",
      hostel: true,
      labs: true,
      library: true,
      exchange: true,
    },
    {
      id: 2,
      name: "FAST University",
      location: "Karachi",
      genderType: "Co-Education",
      entryTests: ["ECAT", "NAT"],
      programs: ["BS Software Engineering", "BS CS"],
      admissionStatus: "open",
      fee: 600000,
      rating: 4.3,
      image:
        "https://i.pinimg.com/736x/7a/39/0b/7a390b0d75f6973efed81f41df0038d0.jpg",
      hostel: true,
      labs: true,
      library: true,
      exchange: false,
    },
    {
      id: 3,
      name: "NUST Islamabad",
      location: "Islamabad",
      genderType: "Co-Education",
      entryTests: ["ECAT", "MDCAT"],
      programs: ["Engineering", "MBBS"],
      admissionStatus: "closed",
      fee: 700000,
      rating: 4.6,
      image:
        "https://i.pinimg.com/736x/7a/39/0b/7a390b0d75f6973efed81f41df0038d0.jpg",
      hostel: true,
      labs: true,
      library: true,
      exchange: true,
    },
  ];

  const universities = [...realUnis, ...mockUniversities];

  const filtered = universities.filter((uni) => {
    // --- Search bar filters ---
    if (
      searchProgram &&
      !uni.programs.some((p) =>
        p.toLowerCase().includes(searchProgram.toLowerCase()),
      )
    )
      return false;

    if (searchCity && uni.location.toLowerCase() !== searchCity.toLowerCase())
      return false;

    if (
      searchUniversity &&
      !uni.name.toLowerCase().includes(searchUniversity.toLowerCase())
    )
      return false;

    // --- Sidebar filters ---
    if (
      filters.admissionStatus &&
      uni.admissionStatus !== filters.admissionStatus
    )
      return false;

    if (
      filters.genderType.length > 0 &&
      !filters.genderType.includes(uni.genderType)
    )
      return false;

    if (uni.fee < filters.minFee || uni.fee > filters.maxFee) return false;

    if (filters.minMarks && uni.minMarks && uni.minMarks < filters.minMarks)
      return false;

    if (filters.hostelAvailable && !uni.hostel) return false;

    if (
      filters.entryTests.length > 0 &&
      !filters.entryTests.some((t) => uni.entryTests.includes(t))
    )
      return false;

    return true;
  });

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "university" : "universities"}
        </p>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded transition-all ${
              viewMode === "grid"
                ? "bg-white text-orange-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            aria-label="Grid view"
            title="Grid View"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>

          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded transition-all ${
              viewMode === "list"
                ? "bg-white text-orange-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            aria-label="List view"
            title="List View"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* No Results State */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🔍</span>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No universities found
          </h3>
          <p className="text-sm text-gray-400">
            Try adjusting your filters or search terms.
          </p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((uni) => (
                <UniversityCard key={uni.id} uni={uni} />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {filtered.map((uni) => (
                <UniversityCard key={uni.id} uni={uni} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UniversityCard({ uni }) {
  const navigate = useNavigate();

  const admissionStyle = {
    open: "bg-green-100 text-green-800",
    closed: "bg-slate-100 text-slate-600",
    coming: "bg-blue-100 text-blue-800",
  };

  const admissionLabel = {
    open: "Open",
    closed: "Closed",
    coming: "Coming Soon",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200">
      {/* Image + Badges */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={uni.image}
          alt={uni.name}
          className="w-full h-full object-cover"
        />
        <span
          className={`absolute top-2.5 right-2.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${admissionStyle[uni.admissionStatus]}`}
        >
          {admissionLabel[uni.admissionStatus]}
        </span>
        <span className="absolute top-2.5 left-2.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
          {uni.genderType}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Name + Location */}
        <p className="font-medium text-[15px] text-gray-900 mb-0.5">
          {uni.name}
        </p>
        <p className="text-xs text-gray-400 mb-3">{uni.location}</p>

        {/* Programs */}
        <div className="mb-3">
          {uni.programs.map((prog, idx) => (
            <p key={idx} className="text-xs text-gray-500 leading-5">
              {prog}
            </p>
          ))}
        </div>

        <hr className="border-t border-gray-100 my-2.5" />

        {/* Rating + Fee */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 text-xs font-medium px-2 py-1 rounded-md">
            &#9733; {uni.rating} / 5
          </span>
          <span className="text-xs font-medium text-orange-600">
            {uni.fee ? `PKR ${uni.fee.toLocaleString()} / sem` : "See details"}
          </span>
        </div>

        {/* Entry Test Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {uni.entryTests.map((test) => (
            <span
              key={test}
              className="text-[11px] bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full"
            >
              {test}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() =>
              navigate(uni.realId ? `/university?id=${uni.realId}` : "/university")
            }
            className="flex-1 py-2 text-sm font-medium border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-150 active:scale-95"
          >
            View details
          </button>
          <button className="flex-1 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-150 active:scale-95">
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
