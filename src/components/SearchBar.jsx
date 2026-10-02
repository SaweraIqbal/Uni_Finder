import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listUniversities, searchProgramCatalog } from "../api/university";

/* -- Shared icons -- */
const ChevronIcon = ({ isOpen }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
  </svg>
);

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* -- Desktop dropdown field (inside pill row) -- */
function DropdownField({ label, value, options, isOpen, onToggle, onSelect, setActiveDropdown, borderClass }) {
  return (
    <div className={`flex-1 relative ${borderClass}`}>
      <div
        onClick={onToggle}
        className={`w-full h-full px-5 py-2.5 flex justify-between items-center cursor-pointer transition-colors duration-200 rounded-full ${
          isOpen ? "bg-gray-50 shadow-sm" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex flex-col items-start min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 transition-colors ${isOpen ? "text-orange-500" : "text-gray-400"}`}>
            {label}
          </span>
          <span className={`text-sm truncate ${value ? "text-gray-900 font-medium" : "text-gray-500"}`}>
            {value || `Select ${label}`}
          </span>
        </div>
        <ChevronIcon isOpen={isOpen} />
      </div>

      {isOpen && (
        <>
          <div className="absolute top-full left-0 right-0 h-2 z-10" />
          <ul className="absolute w-full min-w-[180px] left-0 top-[calc(100%+0.25rem)] bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden max-h-72 overflow-y-auto">
            {options.length === 0 ? (
              <li className="px-5 py-3 text-sm text-gray-400 cursor-default">No options available</li>
            ) : (
              options.map((option, i) => (
                <li
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onSelect(option); setActiveDropdown(null); }}
                  className={`px-5 py-2.5 cursor-pointer transition-all duration-150 text-sm flex items-center justify-between border-b border-gray-50 last:border-0 ${
                    value === option
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-gray-700 hover:bg-orange-50/50 hover:text-orange-600 hover:pl-6"
                  }`}
                >
                  <span>{option}</span>
                  {value === option && <CheckIcon />}
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}

/* -- Mobile dropdown field (inline-expanding inside card) -- */
function MobileDropdownField({ label, value, options, isOpen, onToggle, onSelect, setActiveDropdown, hasBorder }) {
  return (
    <div className={hasBorder ? "border-b border-gray-100" : ""}>
      <div
        onClick={onToggle}
        className={`w-full px-4 py-3.5 flex justify-between items-center cursor-pointer transition-colors duration-200 ${
          isOpen ? "bg-gray-50" : "hover:bg-gray-50/70"
        }`}
      >
        <div className="flex flex-col items-start min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 transition-colors ${isOpen ? "text-orange-500" : "text-gray-400"}`}>
            {label}
          </span>
          <span className={`text-sm truncate ${value ? "text-gray-900 font-medium" : "text-gray-500"}`}>
            {value || `Select ${label}`}
          </span>
        </div>
        <ChevronIcon isOpen={isOpen} />
      </div>

      {isOpen && (
        <ul className="bg-white border-t border-gray-100 max-h-52 overflow-y-auto">
          {options.length === 0 ? (
            <li className="px-5 py-3 text-sm text-gray-400 cursor-default">No options available</li>
          ) : (
            options.map((option, i) => (
              <li
                key={i}
                onClick={(e) => { e.stopPropagation(); onSelect(option); setActiveDropdown(null); }}
                className={`px-5 py-2.5 cursor-pointer transition-all duration-150 text-sm flex items-center justify-between border-b border-gray-100 last:border-0 ${
                  value === option
                    ? "bg-orange-50 text-orange-600 font-semibold"
                    : "text-gray-700 hover:bg-orange-50/50 hover:text-orange-600"
                }`}
              >
                <span>{option}</span>
                {value === option && <CheckIcon />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/* -- Main SearchBar -- */
function SearchBar({ onShowAdvancedFilters, searchValues, onSearchChange, resultsPath = "/homepage" }) {
  const navigate = useNavigate();
  const { program, city, university } = searchValues;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const wrapperRef = useRef(null);
  const [universities, setUniversities] = useState([]);
  const [cities, setCities] = useState([]);
  // Program catalog — real data from /api/programs/catalog
  const [programs, setPrograms] = useState([]);
  const [programLoading, setProgramLoading] = useState(false);
  const programDebounceRef = useRef(null);

  // Fetch universities + cities on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await listUniversities();
        if (Array.isArray(data)) {
          setUniversities([...new Set(data.map((u) => u.name).filter(Boolean))]);
          setCities([...new Set(data.map((u) => (u.city || "").split(",")[0].trim()).filter(Boolean))]);
        }
      } catch (error) {
        console.error("Failed to load search data:", error);
      }
    })();
  }, []);

  // Debounced program catalog search
  const fetchPrograms = useCallback((q) => {
    if (programDebounceRef.current) clearTimeout(programDebounceRef.current);
    if (!q || q.trim().length < 2) {
      setPrograms([]);
      return;
    }
    programDebounceRef.current = setTimeout(async () => {
      setProgramLoading(true);
      try {
        const data = await searchProgramCatalog({ q: q.trim(), limit: 10 });
        const results = (data.results || []).map(
          (r) => `${r.name}${r.level ? ` (${r.level})` : ""}${r.university_count > 1 ? ` — ${r.university_count} universities` : ""}`
        );
        setPrograms(results);
      } catch {
        setPrograms([]);
      } finally {
        setProgramLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    navigate(resultsPath, { state: { program, city, university } });
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-4xl mx-auto">

      {/* Desktop pill (md and above) */}
      <div className="hidden md:flex bg-white rounded-full shadow-xl shadow-black/10 border border-gray-100 p-1 items-stretch">
        {/* Program — live search from catalog */}
        <div className="flex-1 relative border-r border-gray-100">
          <div className="w-full h-full px-5 py-2.5 flex flex-col items-start justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-400">Program</span>
            <input
              type="text"
              value={program}
              onChange={(e) => {
                onSearchChange((prev) => ({ ...prev, program: e.target.value }));
                fetchPrograms(e.target.value);
                setActiveDropdown(e.target.value.length >= 2 ? "program" : null);
              }}
              onFocus={() => { if (program.length >= 2) setActiveDropdown("program"); }}
              placeholder="Search programs…"
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
            />
          </div>
          {activeDropdown === "program" && programs.length > 0 && (
            <>
              <div className="absolute top-full left-0 right-0 h-2 z-10" />
              <ul className="absolute w-full min-w-[240px] left-0 top-[calc(100%+0.25rem)] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                {programLoading && (
                  <li className="px-5 py-3 text-sm text-gray-400">Searching…</li>
                )}
                {programs.map((opt, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      onSearchChange((prev) => ({ ...prev, program: opt.split(" (")[0] }));
                      setActiveDropdown(null);
                    }}
                    className="px-5 py-2.5 cursor-pointer text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-b border-gray-50 last:border-0 truncate"
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <DropdownField
          label="City"
          value={city}
          options={cities}
          isOpen={activeDropdown === "city"}
          onToggle={() => toggleDropdown("city")}
          onSelect={(val) => onSearchChange((prev) => ({ ...prev, city: val }))}
          setActiveDropdown={setActiveDropdown}
          borderClass="border-r border-gray-100"
        />
        <DropdownField
          label="University"
          value={university}
          options={universities}
          isOpen={activeDropdown === "university"}
          onToggle={() => toggleDropdown("university")}
          onSelect={(val) => onSearchChange((prev) => ({ ...prev, university: val }))}
          setActiveDropdown={setActiveDropdown}
          borderClass="border-r border-gray-100"
        />
        <button
          onClick={handleSearch}
          className="bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40 py-3 px-8 rounded-full whitespace-nowrap flex items-center justify-center gap-2 shrink-0"
        >
          <span>Explore Now</span>
          <ArrowIcon />
        </button>
      </div>

      {/* Mobile stacked card (below md) */}
      <div className="flex flex-col md:hidden bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 overflow-hidden">
        {/* Mobile Program — live search */}
        <div className="border-b border-gray-100 relative">
          <div className="w-full px-4 py-3.5 flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-400">Program</span>
            <input
              type="text"
              value={program}
              onChange={(e) => {
                onSearchChange((prev) => ({ ...prev, program: e.target.value }));
                fetchPrograms(e.target.value);
                setActiveDropdown(e.target.value.length >= 2 ? "program-mobile" : null);
              }}
              placeholder="Search programs…"
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
            />
          </div>
          {activeDropdown === "program-mobile" && programs.length > 0 && (
            <ul className="bg-white border-t border-gray-100 max-h-48 overflow-y-auto">
              {programs.map((opt, i) => (
                <li
                  key={i}
                  onClick={() => {
                    onSearchChange((prev) => ({ ...prev, program: opt.split(" (")[0] }));
                    setActiveDropdown(null);
                  }}
                  className="px-5 py-2.5 cursor-pointer text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-b border-gray-100 last:border-0 truncate"
                >
                  {opt}
                </li>
              ))}
            </ul>
          )}
        </div>
        <MobileDropdownField
          label="City"
          value={city}
          options={cities}
          isOpen={activeDropdown === "city"}
          onToggle={() => toggleDropdown("city")}
          onSelect={(val) => onSearchChange((prev) => ({ ...prev, city: val }))}
          setActiveDropdown={setActiveDropdown}
          hasBorder
        />
        <MobileDropdownField
          label="University"
          value={university}
          options={universities}
          isOpen={activeDropdown === "university"}
          onToggle={() => toggleDropdown("university")}
          onSelect={(val) => onSearchChange((prev) => ({ ...prev, university: val }))}
          setActiveDropdown={setActiveDropdown}
          hasBorder={false}
        />
        <div className="px-4 pt-3 pb-4">
          <button
            onClick={handleSearch}
            className="w-full bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40 py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            <span>Explore Now</span>
            <ArrowIcon />
          </button>
        </div>
      </div>

    </div>
  );
}

export default SearchBar;
