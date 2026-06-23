import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listUniversities } from "../api/university";
const ChevronIcon = ({ isOpen }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

function SearchBar({
  onShowAdvancedFilters,
  searchValues,
  onSearchChange,
  resultsPath = "/homepage",
}) {
  const navigate = useNavigate();

  const { program, city, university } = searchValues;
  const [activeDropdown, setActiveDropdown] = useState(null);



  const [universities, setUniversities] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await listUniversities();
        if (Array.isArray(data)) {
          setUniversities([...new Set(data.map((u) => u.name).filter(Boolean))]);
          setCities([
            ...new Set(
              data
                .map((u) => (u.city || "").split(",")[0].trim())
                .filter(Boolean),
            ),
          ]);
        }
      } catch {

      }
    })();
  }, []);

  const programs = [
    "BS Computer Science",
    "Software Engineering",
    "BBA",
    "MBBS",
    "BS Engineering",
  ];

  const handleSearch = () => {
    navigate(resultsPath, {
      state: {
        program,
        city,
        university,
      },
    });
  };
  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };
  const DropdownField = ({
    label,
    value,
    options,
    isOpen,
    onToggle,
    onSelect,
    borderClass,
    isFirst,
  }) => (
    <div className={`flex-1 relative group ${borderClass}`}>

      <div
        onClick={onToggle}
        className={`w-full px-6 py-4 flex justify-between items-center cursor-pointer transition-colors duration-200 ${
          isOpen ? "bg-gray-50" : "hover:bg-gray-50 bg-transparent"
        } ${isFirst ? "rounded-t-full md:rounded-l-full md:rounded-tr-none" : ""}`}
      >
        <span
          className={`outline-none ${value ? "text-gray-900 font-medium" : "text-gray-400"}`}
        >
          {value || label}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </div>


      {isOpen && (
        <ul className="absolute w-full top-full left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-down">
          {options.map((option, i) => (
            <li
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(option);
                setActiveDropdown(null);
              }}
              className={`px-6 py-3 cursor-pointer transition-colors duration-150 ${
                value === option
                  ? "bg-orange-50 text-orange-600 font-semibold"
                  : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-3xl md:rounded-full shadow-2xl flex flex-col md:flex-row relative w-full max-w-4xl mx-auto border border-gray-100">

      <DropdownField
        label="Program"
        value={program}
        options={programs}
        isOpen={activeDropdown === "program"}
        onToggle={() => toggleDropdown("program")}
        onSelect={(val) =>
          onSearchChange((prev) => ({ ...prev, program: val }))
        }
        borderClass="border-b md:border-b-0 md:border-r border-gray-200"
        isFirst={true}
      />


      <DropdownField
        label="City"
        value={city}
        options={cities}
        isOpen={activeDropdown === "city"}
        onToggle={() => toggleDropdown("city")}
        onSelect={(val) => onSearchChange((prev) => ({ ...prev, city: val }))}
        borderClass="border-b md:border-b-0 md:border-r border-gray-200"
      />


      <DropdownField
        label="University"
        value={university}
        options={universities}
        isOpen={activeDropdown === "university"}
        onToggle={() => toggleDropdown("university")}
        onSelect={(val) =>
          onSearchChange((prev) => ({ ...prev, university: val }))
        }
        borderClass="border-b md:border-b-0 md:border-r border-gray-200"
      />


      <button
        onClick={handleSearch}
        className="bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all duration-200 hover:shadow-lg py-4 px-8 rounded-2xl md:rounded-r-full whitespace-nowrap m-1 md:m-0"
      >
        Explore Now
      </button>
    </div>
  );
}

export default SearchBar;
