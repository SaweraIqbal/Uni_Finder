import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listUniversities, searchProgramCatalog } from "../api/university";
import { PAKISTAN_CITIES } from "../data/pakistan_cities";

/* ─── Shared icons ────────────────────────────────────────────────────────── */
const ChevronIcon = ({ isOpen }) => (
  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}
    fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
  </svg>
);

const PinIcon = () => (
  <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd"
        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
        clipRule="evenodd" />
    </svg>
  );
}

/* ─── Generic dropdown option list ───────────────────────────────────────── */
function OptionList({ options, selected, onSelect }) {
  return (
    <ul className="max-h-60 overflow-y-auto [scrollbar-width:thin]">
      {options.length === 0 ? (
        <li className="px-5 py-3 text-sm text-gray-400 text-center">No results</li>
      ) : (
        options.map((opt, i) => (
          <li key={i} onClick={(e) => { e.stopPropagation(); onSelect(opt); }}
            className={`px-4 py-2.5 cursor-pointer text-sm flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors ${
              selected === opt
                ? "bg-orange-50 text-orange-600 font-semibold"
                : "text-gray-700 hover:bg-orange-50/60 hover:text-orange-600"
            }`}>
            <div className="flex items-center gap-2">
              <PinIcon />
              <span>{opt}</span>
            </div>
            {selected === opt && <CheckIcon />}
          </li>
        ))
      )}
    </ul>
  );
}

/* ─── Desktop City field — direct type-to-filter input ───────────────────── */
function CityField({ value, onChange, setActiveDropdown, isOpen, onOpen, borderClass }) {
  const inputRef = useRef(null);

  // Filter cities based on what the user has typed
  const q = value.trim().toLowerCase();
  const filtered = q
    ? PAKISTAN_CITIES.filter((c) => c.toLowerCase().includes(q))
    : PAKISTAN_CITIES;

  const handleSelect = (city) => {
    onChange(city);
    setActiveDropdown(null);
    inputRef.current?.blur();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setActiveDropdown(null);
  };

  return (
    <div className={`flex-1 relative ${borderClass}`}>
      {/* Input trigger */}
      <div className="w-full h-full px-5 py-2.5 flex flex-col items-start justify-center">
        <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 transition-colors ${isOpen ? "text-orange-500" : "text-gray-400"}`}>
          City
        </span>
        <div className="flex items-center w-full gap-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              onOpen();           // open dropdown as user types
            }}
            onFocus={onOpen}
            placeholder="Select City…"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none min-w-0"
          />
          {value ? (
            <button type="button" onClick={handleClear}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <ChevronIcon isOpen={isOpen} />
          )}
        </div>
      </div>

      {/* Dropdown list */}
      {isOpen && filtered.length > 0 && (
        <>
          <div className="absolute top-full left-0 right-0 h-2 z-10" />
          <div className="absolute w-[260px] left-0 top-[calc(100%+0.25rem)] bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden">
            <OptionList options={filtered} selected={value} onSelect={handleSelect} />
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Mobile City field — same inline type-to-filter ─────────────────────── */
function MobileCityField({ value, onChange, setActiveDropdown, isOpen, onOpen, hasBorder }) {
  const inputRef = useRef(null);

  const q = value.trim().toLowerCase();
  const filtered = q
    ? PAKISTAN_CITIES.filter((c) => c.toLowerCase().includes(q))
    : PAKISTAN_CITIES;

  const handleSelect = (city) => {
    onChange(city);
    setActiveDropdown(null);
    inputRef.current?.blur();
  };

  return (
    <div className={hasBorder ? "border-b border-gray-100" : ""}>
      <div className="w-full px-4 py-3.5 flex flex-col items-start">
        <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors ${isOpen ? "text-orange-500" : "text-gray-400"}`}>
          City
        </span>
        <div className="flex items-center w-full gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); onOpen(); }}
            onFocus={onOpen}
            placeholder="Type or select city…"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
          />
          {value && (
            <button type="button" onClick={() => { onChange(""); setActiveDropdown(null); }}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Inline expanding list */}
      {isOpen && filtered.length > 0 && (
        <div className="border-t border-gray-100">
          <OptionList options={filtered} selected={value} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}

/* ─── Desktop dropdown field — used for University ───────────────────────── */
function DropdownField({ label, value, options, isOpen, onToggle, onSelect, setActiveDropdown, borderClass }) {
  return (
    <div className={`flex-1 relative ${borderClass}`}>
      <div onClick={onToggle}
        className={`w-full h-full px-5 py-2.5 flex justify-between items-center cursor-pointer transition-colors duration-200 rounded-full ${
          isOpen ? "bg-gray-50 shadow-sm" : "hover:bg-gray-50"
        }`}>
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
                <li key={i}
                  onClick={(e) => { e.stopPropagation(); onSelect(option); setActiveDropdown(null); }}
                  className={`px-5 py-2.5 cursor-pointer transition-all duration-150 text-sm flex items-center justify-between border-b border-gray-50 last:border-0 ${
                    value === option
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-gray-700 hover:bg-orange-50/50 hover:text-orange-600 hover:pl-6"
                  }`}>
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

/* ─── Mobile dropdown field — used for University ────────────────────────── */
function MobileDropdownField({ label, value, options, isOpen, onToggle, onSelect, setActiveDropdown, hasBorder }) {
  return (
    <div className={hasBorder ? "border-b border-gray-100" : ""}>
      <div onClick={onToggle}
        className={`w-full px-4 py-3.5 flex justify-between items-center cursor-pointer transition-colors duration-200 ${
          isOpen ? "bg-gray-50" : "hover:bg-gray-50/70"
        }`}>
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
              <li key={i}
                onClick={(e) => { e.stopPropagation(); onSelect(option); setActiveDropdown(null); }}
                className={`px-5 py-2.5 cursor-pointer transition-all duration-150 text-sm flex items-center justify-between border-b border-gray-100 last:border-0 ${
                  value === option
                    ? "bg-orange-50 text-orange-600 font-semibold"
                    : "text-gray-700 hover:bg-orange-50/50 hover:text-orange-600"
                }`}>
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

/* ─── Main SearchBar ──────────────────────────────────────────────────────── */
function SearchBar({ onShowAdvancedFilters, searchValues, onSearchChange, resultsPath = "/homepage" }) {
  const navigate = useNavigate();
  const { program, city, university } = searchValues;
  const [activeDropdown, setActiveDropdown] = useState(null);
  const wrapperRef = useRef(null);
  const [universities, setUniversities] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programLoading, setProgramLoading] = useState(false);
  const programDebounceRef = useRef(null);

  // Fetch university names on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await listUniversities();
        if (Array.isArray(data)) {
          setUniversities([...new Set(data.map((u) => u.name).filter(Boolean))]);
        }
      } catch (e) {
        console.error("Failed to load universities:", e);
      }
    })();
  }, []);

  // Debounced program catalog search
  const fetchPrograms = useCallback((q) => {
    if (programDebounceRef.current) clearTimeout(programDebounceRef.current);
    programDebounceRef.current = setTimeout(async () => {
      setProgramLoading(true);
      try {
        const data = await searchProgramCatalog({ q: q.trim(), limit: 12 });
        const results = (data.results || []).map((r) => ({
          label: r.name,
          level: r.level || "",
          count: r.university_count || 1,
        }));
        setPrograms(results);
      } catch { setPrograms([]); }
      finally { setProgramLoading(false); }
    }, 250);
  }, []);

  // Load popular programs on mount (empty query = top by university_count)
  useEffect(() => {
    fetchPrograms("");
  }, [fetchPrograms]);

  // Close all dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = () => {
    navigate(resultsPath, { state: { program, city, university } });
  };

  const toggleDropdown = (name) =>
    setActiveDropdown(activeDropdown === name ? null : name);

  return (
    <div ref={wrapperRef} className="w-full max-w-4xl mx-auto">

      {/* ── Desktop pill (md+) ── */}
      <div className="hidden md:flex bg-white rounded-full shadow-xl shadow-black/10 border border-gray-100 p-1 items-stretch">

        {/* Program — live search */}
        <div className="flex-1 relative border-r border-gray-100">
          <div className="w-full h-full px-5 py-2.5 flex flex-col items-start justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-400">Program</span>
            <input
              type="text"
              value={program}
              onChange={(e) => {
                onSearchChange((prev) => ({ ...prev, program: e.target.value }));
                fetchPrograms(e.target.value);
                setActiveDropdown("program");
              }}
              onFocus={() => setActiveDropdown("program")}
              placeholder="Search programs…"
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
            />
          </div>
          {activeDropdown === "program" && (
            <>
              <div className="absolute top-full left-0 right-0 h-2 z-10" />
              <ul className="absolute w-full min-w-[260px] left-0 top-[calc(100%+0.25rem)] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                {programLoading && (
                  <li className="px-5 py-3 text-sm text-gray-400 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Searching…
                  </li>
                )}
                {!programLoading && programs.length === 0 && (
                  <li className="px-5 py-3 text-sm text-gray-400 text-center">No programs found</li>
                )}
                {!programLoading && programs.map((opt, i) => (
                  <li key={i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSearchChange((prev) => ({ ...prev, program: opt.label }));
                      setActiveDropdown(null);
                    }}
                    className="px-5 py-2.5 cursor-pointer text-sm border-b border-gray-50 last:border-0 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                    {opt.label}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* City — type-to-filter from 127 Pakistan cities */}
        <CityField
          value={city}
          onChange={(val) => onSearchChange((prev) => ({ ...prev, city: val }))}
          isOpen={activeDropdown === "city"}
          onOpen={() => setActiveDropdown("city")}
          setActiveDropdown={setActiveDropdown}
          borderClass="border-r border-gray-100"
        />

        {/* University — click dropdown */}
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

        <button onClick={handleSearch}
          className="bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40 py-3 px-8 rounded-full whitespace-nowrap flex items-center justify-center gap-2 shrink-0">
          <span>Explore Now</span>
          <ArrowIcon />
        </button>
      </div>

      {/* ── Mobile stacked card ── */}
      <div className="flex flex-col md:hidden bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 overflow-hidden">

        {/* Program */}
        <div className="border-b border-gray-100 relative">
          <div className="w-full px-4 py-3.5 flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-400">Program</span>
            <input
              type="text"
              value={program}
              onChange={(e) => {
                onSearchChange((prev) => ({ ...prev, program: e.target.value }));
                fetchPrograms(e.target.value);
                setActiveDropdown("program-mobile");
              }}
              onFocus={() => setActiveDropdown("program-mobile")}
              placeholder="Search programs…"
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
            />
          </div>
          {activeDropdown === "program-mobile" && (
            <ul className="bg-white border-t border-gray-100 max-h-48 overflow-y-auto">
              {programLoading && (
                <li className="px-5 py-3 text-sm text-gray-400 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Searching…
                </li>
              )}
              {!programLoading && programs.length === 0 && (
                <li className="px-5 py-3 text-sm text-gray-400 text-center">No programs found</li>
              )}
              {!programLoading && programs.map((opt, i) => (
                <li key={i}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSearchChange((prev) => ({ ...prev, program: opt.label }));
                    setActiveDropdown(null);
                  }}
                  className="px-5 py-2.5 cursor-pointer text-sm border-b border-gray-100 last:border-0 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* City — mobile type-to-filter */}
        <MobileCityField
          value={city}
          onChange={(val) => onSearchChange((prev) => ({ ...prev, city: val }))}
          isOpen={activeDropdown === "city"}
          onOpen={() => setActiveDropdown("city")}
          setActiveDropdown={setActiveDropdown}
          hasBorder
        />

        {/* University */}
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
          <button onClick={handleSearch}
            className="w-full bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40 py-3.5 rounded-xl flex items-center justify-center gap-2">
            <span>Explore Now</span>
            <ArrowIcon />
          </button>
        </div>
      </div>

    </div>
  );
}

export default SearchBar;
