import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import heroVideo from "../assets/video1.mp4";
import SearchBar from "../components/SearchBar";
import { campuses, formatPKR } from "../data/campuses";

// ----------- Design tokens / lookup maps -----------
const ADMISSION_STYLE = {
  open: "bg-green-100 text-green-800",
  closed: "bg-slate-100 text-slate-600",
  unknown: "bg-blue-100 text-blue-700",
};
const ADMISSION_LABEL = { open: "Open", closed: "Closed", unknown: "Unknown" };
const UNI_TYPE_STYLE = {
  "Pvt.": "bg-purple-100 text-purple-700",
  "Govt.": "bg-teal-100 text-teal-700",
  "Semi-Govt.": "bg-amber-100 text-amber-700",
};
const SORT_OPTIONS = [
  { id: "alpha", label: "Alphabetical (A\u2013Z)" },
  { id: "fee-low", label: "Fee: Low to High" },
  { id: "fee-high", label: "Fee: High to Low" },
];

// ----------- Program taxonomy (HEC-aligned, deduplicated) -----------
const PROGRAM_TREE = [
  {
    label: "Undergraduate Degrees (4-Year)",
    children: [
      {
        label: "Associate Degrees (AD, 2-Year)",
        children: [
          "Associate Degree in Computing",
          "Associate Degree in Business & Management",
          "Associate Degree in Arts & Humanities",
          "Associate Degree in Social Sciences",
          "Associate Degree in Natural Sciences",
          "Associate Degree in Engineering Technology",
          "Associate Degree in Allied Health Sciences",
          "Associate Degree in Agriculture",
          "Associate Degree in Education",
        ],
      },
      {
        label: "Bachelor of Science / Bachelor of Studies (BS, 4-Year)",
        children: [
          // Computing & IT
          "BS Computer Science (BSCS)",
          "BS Software Engineering (BSSE)",
          "BS Information Technology (BSIT)",
          "BS Data Science (BSDS)",
          "BS Artificial Intelligence (BSAI)",
          "BS Cyber Security (BSCY)",
          "BS Computer Engineering",
          "BS Information Systems",
          // Basic & Applied Sciences
          "BS Physics",
          "BS Chemistry",
          "BS Mathematics",
          "BS Statistics",
          "BS Biology",
          "BS Zoology",
          "BS Botany",
          "BS Biochemistry",
          "BS Microbiology",
          "BS Biotechnology",
          "BS Environmental Science",
          "BS Geology",
          "BS Geography",
          "BS Psychology",
          "BS Sociology",
          "BS Economics",
          "BS Political Science",
          "BS International Relations",
          "BS Media & Communication Studies",
          "BS Islamic Studies",
          "BS Pakistan Studies",
          "BS English",
          "BS Urdu",
          "BS Education",
          "BS Commerce",
          "BS Accounting & Finance",
          "BS Business & Management",
          "BS Public Administration",
          "BS Social Work",
          "BS Library & Information Science",
          "BS Health & Physical Education",
          "BS Sports Sciences",
          "BS Nutrition & Dietetics",
          "BS Food Science & Technology",
          "BS Agriculture",
          "BS Agricultural Sciences",
          "BS Forestry",
          "BS Remote Sensing & GIS",
          "BS Disaster Management",
          "BS Gender Studies",
          "BS History",
          "BS Archaeology",
          "BS Fine Arts",
          "BS Fashion Design",
          "BS Home Economics",
          // Health & Allied (4-year where applicable)
          "BS Nursing (BSN)",
          "BS Allied Health Sciences",
          "BS Medical Lab Technology",
          "BS Radiology & Imaging Technology",
          "BS Physiotherapy (if offered as BS track)",
          "BS Pharmacy (if offered as BS track)",
        ],
      },
      {
        label: "Bachelor of Business Administration (BBA, 4-Year)",
        children: [
          "BBA (General)",
          "BBA with specialization in Finance",
          "BBA with specialization in Marketing",
          "BBA with specialization in HRM",
          "BBA with specialization in Supply Chain & Operations",
          "BBA with specialization in Entrepreneurship",
          "BBA with specialization in Islamic Banking & Finance",
          "BBA with specialization in Business Analytics",
          "BBA with specialization in Digital Business & E-Commerce",
        ],
      },
      {
        label: "Bachelor of Education (B.Ed, 4-Year)",
        children: ["B.Ed (General)", "B.Ed (Honors)"],
      },
      {
        label: "Bachelor of Engineering / B.Sc Engineering (4-Year)",
        children: [
          "BE / B.Sc Electrical Engineering",
          "BE / B.Sc Mechanical Engineering",
          "BE / B.Sc Civil Engineering",
          "BE / B.Sc Chemical Engineering",
          "BE / B.Sc Industrial Engineering",
          "BE / B.Sc Metallurgy & Materials Engineering",
          "BE / B.Sc Mining Engineering",
          "BE / B.Sc Petroleum & Gas Engineering",
          "BE / B.Sc Environmental Engineering",
          "BE / B.Sc Biomedical Engineering",
          "BE / B.Sc Textile Engineering",
          "BE / B.Sc Food Engineering",
          "BE / B.Sc Agricultural Engineering",
          "BE / B.Sc Energy Systems Engineering",
          "BE / B.Sc Mechatronics Engineering",
          "BE / B.Sc Telecommunication Engineering",
          "BE / B.Sc Computer Engineering (Engineering Track)",
          "BE / B.Sc Software Engineering (Engineering Track)",
          "BE / B.Sc Aerospace Engineering",
          "BE / B.Sc City & Regional Planning",
        ],
      },
      {
        label: "5-Year Professional Undergraduate Degrees",
        children: [
          "Doctor of Physical Therapy (DPT)",
          "Doctor of Pharmacy (Pharm.D)",
          "Bachelor of Laws (LLB)",
          "Bachelor of Medicine, Bachelor of Surgery (MBBS)",
          "Bachelor of Dental Surgery (BDS)",
          "Doctor of Veterinary Medicine (DVM)",
          "Bachelor of Architecture (B.Arch)",
          "Bachelor of Nursing (BSN, 5-Year where applicable)",
        ],
      },
    ],
  },
  {
    label: "Graduate & Postgraduate Degrees",
    children: [
      {
        label: "Master of Science (MS) / Master of Philosophy (MPhil)",
        children: [
          "MS Computer Science",
          "MS Software Engineering",
          "MS Information Technology",
          "MS Data Science",
          "MS Artificial Intelligence",
          "MS Cyber Security",
          "MS Physics",
          "MS Chemistry",
          "MS Mathematics",
          "MS Statistics",
          "MS Biology",
          "MS Zoology",
          "MS Botany",
          "MS Biochemistry",
          "MS Microbiology",
          "MS Biotechnology",
          "MS Environmental Science",
          "MS Geology",
          "MS Geography",
          "MS Psychology",
          "MS Sociology",
          "MS Economics",
          "MS Political Science",
          "MS International Relations",
          "MS Media & Communication Studies",
          "MS Islamic Studies",
          "MS Pakistan Studies",
          "MS English",
          "MS Urdu",
          "MS Education",
          "MS Commerce",
          "MS Business & Management",
          "MS Public Administration",
          "MS Social Work",
          "MS Library & Information Science",
          "MS Nutrition & Dietetics",
          "MS Food Science & Technology",
          "MS Agriculture",
          "MS Forestry",
          "MS Remote Sensing & GIS",
          "MS Disaster Management",
          "MS Gender Studies",
          "MS History",
          "MS Archaeology",
          "MS Fine Arts",
          "MS Fashion Design",
          "MS Home Economics",
          "MS Nursing",
          "MS Allied Health Sciences",
          "MS Women, Development & Seerah Studies",
          "MS Women, Entrepreneurship & Seerah Studies",
          "MS Women, Leadership & Seerah Studies",
        ],
      },
      {
        label: "Master of Business Administration (MBA)",
        children: [
          "MBA (General)",
          "MBA (Executive / EMBA)",
          "MBA with specialization in Finance",
          "MBA with specialization in Marketing",
          "MBA with specialization in HRM",
          "MBA with specialization in Supply Chain & Operations",
          "MBA with specialization in Entrepreneurship",
          "MBA with specialization in Islamic Finance",
          "MBA with specialization in Business Analytics",
          "MBA with specialization in Fintech",
          "MBA with specialization in Digital Marketing",
        ],
      },
      {
        label: "Other Masterâ€™s Degrees",
        children: [
          "Master of Education (M.Ed)",
          "Master of Laws (LLM)",
          "Master of Architecture (M.Arch)",
          "Master of Public Health (MPH)",
          "Master of Philosophy (MPhil) â€“ General",
        ],
      },
    ],
  },
  {
    label: "Doctor of Philosophy (PhD)",
    children: [
      "PhD Computer Science",
      "PhD Software Engineering",
      "PhD Information Technology",
      "PhD Data Science",
      "PhD Artificial Intelligence",
      "PhD Cyber Security",
      "PhD Physics",
      "PhD Chemistry",
      "PhD Mathematics",
      "PhD Statistics",
      "PhD Biology",
      "PhD Zoology",
      "PhD Botany",
      "PhD Biochemistry",
      "PhD Microbiology",
      "PhD Biotechnology",
      "PhD Environmental Science",
      "PhD Geology",
      "PhD Geography",
      "PhD Psychology",
      "PhD Sociology",
      "PhD Economics",
      "PhD Political Science",
      "PhD International Relations",
      "PhD Media & Communication Studies",
      "PhD Islamic Studies",
      "PhD Pakistan Studies",
      "PhD English",
      "PhD Urdu",
      "PhD Education",
      "PhD Commerce",
      "PhD Business & Management",
      "PhD Public Administration",
      "PhD Social Work",
      "PhD Library & Information Science",
      "PhD Nutrition & Dietetics",
      "PhD Food Science & Technology",
      "PhD Agriculture",
      "PhD Forestry",
      "PhD Remote Sensing & GIS",
      "PhD Disaster Management",
      "PhD Gender Studies",
      "PhD History",
      "PhD Archaeology",
      "PhD Fine Arts",
      "PhD Fashion Design",
      "PhD Home Economics",
      "PhD Nursing",
      "PhD Allied Health Sciences",
      "PhD Engineering (all disciplines)",
      "PhD Law",
      "PhD Architecture",
    ],
  },
];
// ----------- Fee presets -----------
const FEE_MIN_BOUND = 15000;
const FEE_MAX_BOUND = 500000;
const FEE_PRESETS = [
  15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000, 200000,
  250000, 300000, 400000, 500000,
];
const FEE_GAP = 5000;

function formatFee(n) {
  if (!n && n !== 0) return "";
  if (n >= 100000) {
    const lakh = n / 100000;
    return `${lakh % 1 === 0 ? lakh : Number(lakh.toFixed(1))} lakh`;
  }
  return `${Math.round(n / 1000)}k`;
}

function matchesQuery(node, query) {
  const q = query.toLowerCase();
  if (typeof node === "string") return node.toLowerCase().includes(q);
  if (node.label.toLowerCase().includes(q)) return true;
  if (node.children) return node.children.some((c) => matchesQuery(c, q));
  return false;
}

// ----------- TreeNode -----------
function TreeNode({ node, depth, selected, onSelect, query }) {
  const isLeaf = typeof node === "string";
  const label = isLeaf ? node : node.label;
  const hasChildren = !isLeaf && node.children && node.children.length > 0;
  // Treat string leaves AND childless object nodes as selectable items
  const isSelectableLeaf = isLeaf || !hasChildren;
  const [open, setOpen] = useState(depth === 0);

  if (query && !matchesQuery(node, query)) return null;

  if (isSelectableLeaf) {
    const isSelected = selected.includes(label);
    return (
      <button
        onClick={() => onSelect(label)}
        className={`w-full text-left py-1.5 rounded-lg text-sm transition flex items-center justify-between ${
          isSelected
            ? "bg-orange-50 text-orange-600 font-medium"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${depth * 14 + 12}px`, paddingRight: "12px" }}
      >
        <span>{label}</span>
        {isSelected && (
          <span className="text-orange-400 text-xs shrink-0 ml-2">
            &#10003;
          </span>
        )}
      </button>
    );
  }

  const autoOpen = Boolean(query && matchesQuery(node, query));

  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 py-1.5 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
        style={{ paddingLeft: `${depth * 14 + 12}px`, paddingRight: "12px" }}
      >
        {hasChildren ? (
          <svg
            className={`w-3 h-3 shrink-0 text-gray-400 transition-transform ${
              open || autoOpen ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span>{label}</span>
      </button>
      {(open || autoOpen) && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode
              key={i}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              query={query}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ----------- ProgramPicker -----------
function ProgramPicker({ selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const triggerLabel =
    selected.length === 0
      ? "Degree & Program"
      : selected.length === 1
        ? "1 Program Selected"
        : `${selected.length} Programs Selected`;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger â€” same height/border/radius as other toolbar buttons */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-32 py-2 text-sm font-medium rounded-lg border transition-all whitespace-nowrap flex-1 ${
          selected.length > 0
            ? "bg-orange-50 text-orange-600 border-orange-200 shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
        }`}
      >
        {/* Graduation-cap icon */}
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14l6.16-3.422A12.083 12.083 0 0118 15.5c0 1.5-3 4.5-6 4.5s-6-3-6-4.5c0-1.06.354-2.06.984-2.922L12 14z"
          />
        </svg>
        {triggerLabel}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Popover panel â€” styled like Sort dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-[360px] sm:w-[420px] bg-white rounded-xl shadow-lg border border-gray-100 z-30 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search programs, e.g. BSCS"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>
          {/* Tree â€” scrollable */}
          <div className="max-h-72 overflow-y-auto p-2">
            {PROGRAM_TREE.map((node, i) => (
              <TreeNode
                key={i}
                node={node}
                depth={0}
                selected={selected}
                onSelect={onToggle}
                query={query}
              />
            ))}
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              {selected.length} selected
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-orange-500 hover:text-orange-600"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------- ProgramChip -----------
function ProgramChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-medium pl-3 pr-2 py-1.5 rounded-full border border-orange-100">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-orange-200 transition"
      >
        <svg
          className="w-2.5 h-2.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </span>
  );
}

// ----------- FeeRangeFilter -----------
function FeeRangeFilter({ minFee, maxFee, onChange }) {
  const minOptions = FEE_PRESETS.filter((p) => p <= maxFee - FEE_GAP);
  const maxOptions = FEE_PRESETS.filter((p) => p >= minFee + FEE_GAP);

  return (
    <div>
      {/* Summary label */}
      <p className="text-xs font-medium text-orange-500 mb-2">
        {formatFee(minFee)} &ndash; {formatFee(maxFee)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">
            Min fee
          </label>
          <select
            value={minFee}
            onChange={(e) =>
              onChange({ minFee: Number(e.target.value), maxFee })
            }
            className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-2 text-gray-700 focus:outline-none focus:border-orange-400"
          >
            {minOptions.map((p) => (
              <option key={p} value={p}>
                {formatFee(p)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">
            Max fee
          </label>
          <select
            value={maxFee}
            onChange={(e) =>
              onChange({ minFee, maxFee: Number(e.target.value) })
            }
            className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-2 text-gray-700 focus:outline-none focus:border-orange-400"
          >
            {maxOptions.map((p) => (
              <option key={p} value={p}>
                {formatFee(p)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ----------- AdvancedFilters (sidebar) -----------
function AdvancedFilters({ filters, setFilters, onResetAll }) {
  const toggle = (key, val) =>
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(val)
        ? prev[key].filter((x) => x !== val)
        : [...prev[key], val],
    }));

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Filters</h3>
        <button
          onClick={onResetAll}
          className="text-sm text-orange-500 hover:underline"
        >
          Reset All
        </button>
      </div>

      {/* University Type */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">University Type</h4>
        <div className="flex gap-1 flex-wrap">
          {["Govt.", "Pvt."].map((t) => (
            <button
              key={t}
              onClick={() => toggle("universityType", t)}
              className={`px-2 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition ${
                filters.universityType.includes(t)
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Campus Category */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Campus Category</h4>
        <div className="flex gap-1 flex-wrap">
          {[
            { label: "Main Campus", value: "Main Campus" },
            { label: "City Campus", value: "City Campus" },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => toggle("campusType", t.value)}
              className={`px-2 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition ${
                filters.campusType.includes(t.value)
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admission Status */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Admission Status</h4>
        <div className="flex gap-1 flex-wrap">
          {[
            { label: "Open", value: "open", dot: "bg-green-500" },
            { label: "Closed", value: "closed", dot: "bg-gray-400" },
            { label: "Unknown", value: "unknown", dot: "bg-blue-400" },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  admissionStatus:
                    prev.admissionStatus === s.value ? "" : s.value,
                }))
              }
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition ${
                filters.admissionStatus === s.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campus Gender Type */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Campus Gender Type</h4>
        <div className="space-y-2">
          {["Co-Education", "Women Only", "Men Only"].map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.genderType.includes(g)}
                onChange={() => toggle("genderType", g)}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm text-gray-600">{g}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Marks */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">
          Minimum Marks: {filters.minMarks}%
        </h4>
        <input
          type="range"
          min="45"
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
          <span>45%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Tuition Fee Range â€” dropdown pair */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">
          Tuition Fee Range (PKR)
        </h4>
        <FeeRangeFilter
          minFee={filters.minFee}
          maxFee={filters.maxFee}
          onChange={({ minFee, maxFee }) =>
            setFilters((prev) => ({ ...prev, minFee, maxFee }))
          }
        />
      </div>

      {/* Entry Test Requirement */}
      <div className="mb-6">
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
          ].map((t) => (
            <label key={t} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.entryTests.includes(t)}
                onChange={() => toggle("entryTests", t)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span className="text-gray-700 text-sm">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Hostel Availability */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-3">
          Hostel Availability
        </h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hostelAvailable}
            onChange={(e) =>
              setFilters((p) => ({ ...p, hostelAvailable: e.target.checked }))
            }
            className="w-4 h-4 rounded accent-orange-500"
          />
          <span className="text-gray-700 text-sm">Hostel Available</span>
        </label>
      </div>

      {/* Scholarship Available */}
      <div className="mb-2">
        <h4 className="font-semibold text-gray-700 mb-3">
          Scholarship Available
        </h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.scholarshipAvailable}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                scholarshipAvailable: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded accent-orange-500"
          />
          <span className="text-gray-700 text-sm">Scholarship Available</span>
        </label>
      </div>
    </div>
  );
}

const MobileFilters = AdvancedFilters;

// ----------- HomePage -----------
function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state || {};

  const [filters, setFilters] = useState({
    admissionStatus: "",
    genderType: [],
    universityType: [],
    campusType: [],
    minMarks: 45,
    minFee: FEE_MIN_BOUND,
    maxFee: FEE_MAX_BOUND,
    entryTests: [],
    hostelAvailable: false,
    scholarshipAvailable: false,
  });

  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchValues, setSearchValues] = useState({
    program: locationState.program || "",
    city: locationState.city || "",
    university: locationState.university || "",
  });

  const handleProgramToggle = (label) =>
    setSelectedPrograms((prev) =>
      prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label],
    );

  const handleProgramRemove = (label) =>
    setSelectedPrograms((prev) => prev.filter((p) => p !== label));

  const handleResetAll = () => {
    setFilters({
      admissionStatus: "",
      genderType: [],
      universityType: [],
      campusType: [],
      minMarks: 45,
      minFee: FEE_MIN_BOUND,
      maxFee: FEE_MAX_BOUND,
      entryTests: [],
      hostelAvailable: false,
      scholarshipAvailable: false,
    });
    setSelectedPrograms([]);
    setSearchValues({ program: "", city: "", university: "" });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ---- Hero ---- */}
      <section className="relative min-h-[420px] sm:min-h-[520px] md:min-h-[600px] flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-45" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center text-white mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Find Your Future at the Perfect University
            </h2>
            <p className="text-sm sm:text-lg md:text-xl text-gray-100 max-w-3xl mx-auto">
              Discover universities, compare programs, explore admissions, and
              make informed decisions for your academic future.
            </p>
          </div>
          <SearchBar
            onShowAdvancedFilters={() => setShowAdvancedFilters(true)}
            searchValues={searchValues}
            onSearchChange={setSearchValues}
          />
        </div>
      </section>

      {/* ---- Content section ---- */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {/* Mobile: floating Filters button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            Filters
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-gray-800">Filters</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <MobileFilters
                  filters={filters}
                  setFilters={setFilters}
                  onResetAll={handleResetAll}
                />
              </div>
            </div>
          </div>
        )}

        {/* CampusGrid handles toolbar (full width) + sidebar + cards internally */}
        <CampusGrid
          filters={filters}
          setFilters={setFilters}
          selectedPrograms={selectedPrograms}
          onProgramToggle={handleProgramToggle}
          onProgramRemove={handleProgramRemove}
          searchProgram={searchValues.program}
          searchCity={searchValues.city}
          searchUniversity={searchValues.university}
          onResetAll={handleResetAll}
          showFilters={showAdvancedFilters}
        />
      </section>
    </div>
  );
}

// ----------- CampusGrid -----------
function CampusGrid({
  filters,
  setFilters,
  showFilters,
  selectedPrograms,
  onProgramToggle,
  onProgramRemove,
  searchProgram,
  searchCity,
  searchUniversity,
  onResetAll,
}) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const MAX_SELECT = 3;

  useEffect(() => {
    const close = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // ---- Real filtering ----
  const filtered = useMemo(() => {
    return campuses.filter((c) => {
      // Hero search filters
      if (searchCity && c.city.toLowerCase() !== searchCity.toLowerCase())
        return false;
      if (
        searchUniversity &&
        !c.universityName
          .toLowerCase()
          .includes(searchUniversity.toLowerCase()) &&
        !c.campusName.toLowerCase().includes(searchUniversity.toLowerCase())
      )
        return false;
      if (
        searchProgram &&
        !(c.programs || []).some((p) =>
          p.toLowerCase().includes(searchProgram.toLowerCase()),
        )
      )
        return false;

      // Sidebar filters
      if (
        filters.admissionStatus &&
        c.admissionStatus !== filters.admissionStatus
      )
        return false;
      if (
        filters.genderType.length > 0 &&
        !filters.genderType.includes(c.genderType)
      )
        return false;
      if (
        filters.universityType.length > 0 &&
        !filters.universityType.includes(c.universityType)
      )
        return false;
      if (
        filters.campusType.length > 0 &&
        !filters.campusType.includes(c.campusCategory)
      )
        return false;
      if (
        c.feePerSemester < filters.minFee ||
        c.feePerSemester > filters.maxFee
      )
        return false;
      if (filters.hostelAvailable && !c.hostelAvailable) return false;
      if (filters.scholarshipAvailable && !c.scholarshipAvailable) return false;
      if (
        filters.entryTests.length > 0 &&
        !(c.entryTests || []).some((t) => filters.entryTests.includes(t))
      )
        return false;
      if (
        filters.minMarks > 45 &&
        (c.minMarksRequired || 45) < filters.minMarks
      )
        return false;

      // Toolbar program filter
      if (
        selectedPrograms.length > 0 &&
        !(c.programs || []).some((p) => selectedPrograms.includes(p))
      )
        return false;

      return true;
    });
  }, [filters, selectedPrograms, searchCity, searchUniversity, searchProgram]);

  const displayed = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "alpha")
      list.sort((a, b) => a.campusName.localeCompare(b.campusName));
    if (sortBy === "fee-low")
      list.sort((a, b) => (a.feePerSemester || 0) - (b.feePerSemester || 0));
    if (sortBy === "fee-high")
      list.sort((a, b) => (b.feePerSemester || 0) - (a.feePerSemester || 0));
    return list;
  }, [filtered, sortBy]);

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label || "Sort";

  const handleToggleSelectMode = () => {
    if (selectMode) {
      setSelectMode(false);
      setSelectedIds([]);
    } else {
      setSelectMode(true);
      setSelectedIds([]);
    }
  };

  const handleCardSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    navigate("/compare-campuses", { state: { selectedIds, filters } });
  };

  return (
    <div className="relative">
      {/* ---- Toolbar row â€” FULL WIDTH ---- */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <ProgramPicker selected={selectedPrograms} onToggle={onProgramToggle} />
        <div className="flex-1 min-w-[8px]" />
        <p className="text-sm text-gray-500 whitespace-nowrap">
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {displayed.length}
          </span>{" "}
          {displayed.length === 1 ? "campus" : "campuses"}
        </p>
        <div className="flex items-center gap-2">
          {/* Select Campuses button */}
          <button
            type="button"
            onClick={handleToggleSelectMode}
            className={
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all " +
              (selectMode
                ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500")
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            {selectMode ? "Cancel" : "Select Campuses"}
          </button>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              className={
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all " +
                (sortBy
                  ? "bg-white text-orange-500 border-orange-200 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 16 4 4 4-4" />
                <path d="M7 20V4" />
                <path d="m21 8-4-4-4 4" />
                <path d="M17 4v16" />
              </svg>
              {activeSortLabel}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={
                  "transition-transform " + (sortOpen ? "rotate-180" : "")
                }
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sortOpen && (
              <div
                role="listbox"
                className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={sortBy === opt.id}
                    onClick={() => {
                      setSortBy(opt.id);
                      setSortOpen(false);
                    }}
                    className={
                      "w-full text-left px-4 py-2.5 text-sm transition " +
                      (sortBy === opt.id
                        ? "bg-orange-50 text-orange-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid / List toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={
                "p-2 rounded transition-all " +
                (viewMode === "grid"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700")
              }
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
              title="List View"
              className={
                "p-2 rounded transition-all " +
                (viewMode === "list"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700")
              }
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
      </div>

      {/* Program chips strip */}
      {selectedPrograms.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedPrograms.map((p) => (
            <ProgramChip
              key={p}
              label={p}
              onRemove={() => onProgramRemove(p)}
            />
          ))}
        </div>
      )}

      {/* Select-mode banner */}
      {selectMode && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Select 2&ndash;3 campuses to compare &nbsp;&middot;&nbsp;
          <span className="font-semibold">
            {selectedIds.length} / {MAX_SELECT} selected
          </span>
        </div>
      )}

      {/* ---- Grid: Sidebar + Cards ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        {showFilters && (
          <div className="hidden lg:block lg:col-span-1">
            <AdvancedFilters
              filters={filters}
              setFilters={setFilters}
              onResetAll={onResetAll}
            />
          </div>
        )}

        {/* Cards */}
        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                No campuses match your filters.
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                Try widening your search criteria.
              </p>
              <button
                onClick={onResetAll}
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {displayed.map((campus) => {
                const isSelected = selectedIds.includes(campus.id);
                const isDisabled =
                  selectMode && !isSelected && selectedIds.length >= MAX_SELECT;
                return (
                  <CampusCard
                    key={campus.id}
                    campus={campus}
                    selectMode={selectMode}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onSelect={handleCardSelect}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky compare bar */}
      {selectMode && selectedIds.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold">
                {selectedIds.length}
              </span>
              <p className="text-sm font-medium text-gray-700">
                {selectedIds.length} campuses selected
                <span className="ml-2 text-gray-400 text-xs font-normal">
                  (max {MAX_SELECT})
                </span>
              </p>
            </div>
            <button
              onClick={handleCompare}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-md"
            >
              Compare
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------- CampusCard -----------
function CampusCard({ campus, selectMode, isSelected, isDisabled, onSelect }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const FALLBACK =
    "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop";

  const handleCardClick = () => {
    if (selectMode) {
      if (!isDisabled) onSelect(campus.id);
    } else {
      navigate(`/campus-detail?id=${campus.id}`);
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    setSaved((v) => !v);
  };

  return (
    <div
      onClick={handleCardClick}
      className={[
        "bg-white border rounded-xl overflow-hidden transition-all duration-200 group flex flex-col h-full",
        selectMode ? "cursor-pointer" : "cursor-pointer hover:-translate-y-0.5",
        isSelected
          ? "border-orange-500 ring-2 ring-orange-400 shadow-lg"
          : "border-gray-100 hover:border-gray-200",
        isDisabled ? "opacity-40 pointer-events-none" : "",
      ].join(" ")}
    >
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img
          src={imgError ? FALLBACK : campus.coverImage}
          alt={campus.campusName}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            !selectMode ? "group-hover:scale-105" : ""
          }`}
        />

        {/* Selected overlay */}
        {selectMode && isSelected && (
          <div className="absolute inset-0 bg-orange-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              ADMISSION_STYLE[campus.admissionStatus] ||
              "bg-gray-100 text-gray-600"
            }`}
          >
            {ADMISSION_LABEL[campus.admissionStatus] || campus.admissionStatus}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              UNI_TYPE_STYLE[campus.universityType] ||
              "bg-gray-100 text-gray-600"
            }`}
          >
            {campus.universityType}
          </span>
        </div>

        {/* Top-right save button */}
        <button
          onClick={handleSave}
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all shadow-sm"
          title={saved ? "Unsave" : "Save campus"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={saved ? "#f97316" : "none"}
            stroke={saved ? "#f97316" : "#6b7280"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="font-bold text-[15px] text-gray-900 leading-tight mb-0.5 line-clamp-1"
          title={campus.campusName}
        >
          {campus.campusName}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/universities/${campus.universityId}`);
          }}
          className="text-xs text-orange-500 hover:text-orange-600 hover:underline font-medium mb-3 block text-left truncate"
          title={campus.universityName}
        >
          {campus.universityName}
        </button>

        <div className="space-y-1.5 mb-4">
          {/* City / Area */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0 text-gray-400"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">
              {campus.city}
              {campus.area ? ` \u00b7 ${campus.area}` : ""}
            </span>
          </div>
        </div>

        {/* CTA â€” normal mode only */}
        {!selectMode && (
          <div className="mt-auto pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/campus-detail?id=${campus.id}`);
              }}
              className="w-full py-2 text-sm font-medium border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-150 active:scale-95"
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
