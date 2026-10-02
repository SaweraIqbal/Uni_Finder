import { useMemo, useState } from "react";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PROGRAMS = [
  { name: "BS Computer Science", level: "Undergraduate", duration: "4 Years", fee: "PKR 45k/sem", eligibility: "85% Min" },
  { name: "BBA (Hons)", level: "Undergraduate", duration: "4 Years", fee: "PKR 40k/sem", eligibility: "80% Min" },
  { name: "BS Software Engineering", level: "Undergraduate", duration: "4 Years", fee: "PKR 46k/sem", eligibility: "85% Min" },
  { name: "BS Artificial Intelligence", level: "Undergraduate", duration: "4 Years", fee: "PKR 47k/sem", eligibility: "85% Min" },
  { name: "BS Data Science", level: "Undergraduate", duration: "4 Years", fee: "PKR 46k/sem", eligibility: "80% Min" },
  { name: "MBA", level: "Postgraduate", duration: "2 Years", fee: "PKR 55k/sem", eligibility: "3.0 GPA Min" },
  { name: "MS Computer Science", level: "Postgraduate", duration: "2 Years", fee: "PKR 50k/sem", eligibility: "3.2 GPA Min" },
  { name: "MS Data Science", level: "Postgraduate", duration: "2 Years", fee: "PKR 52k/sem", eligibility: "3.0 GPA Min" },
  { name: "PhD Computer Science", level: "PhD", duration: "3-5 Years", fee: "Funded", eligibility: "MS Required" },
  { name: "PhD Management Sciences", level: "PhD", duration: "3-5 Years", fee: "Funded", eligibility: "MS Required" },
];

const FILTERS = ["All", "Undergraduate", "Postgraduate", "PhD"];
const GROUPS = [
  { key: "Undergraduate", label: "Undergraduate Programs" },
  { key: "Postgraduate", label: "Postgraduate Programs" },
  { key: "PhD", label: "PhD Programs" },
];

function levelBadge(level) {
  if (level === "Undergraduate") return "bg-sky-50 text-sky-600 border-sky-200";
  if (level === "Postgraduate") return "bg-violet-50 text-violet-600 border-violet-200";
  return "bg-orange-50 text-orange-600 border-orange-200";
}

export default function ProgramsOffered() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROGRAMS.filter((p) => {
      const matchesLevel = filter === "All" || p.level === filter;
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.level.toLowerCase().includes(q) ||
        p.fee.toLowerCase().includes(q) || p.eligibility.toLowerCase().includes(q);
      return matchesLevel && matchesQuery;
    });
  }, [filter, query]);

  const grouped = GROUPS.map((g) => ({ ...g, rows: filtered.filter((p) => p.level === g.key) })).filter((g) => g.rows.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Programs Offered</h2>
        <p className="text-sm text-gray-500 mt-1">Explore undergraduate, postgraduate, and PhD programs available at this campus.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-orange-500 text-white shadow-sm border border-orange-500"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50"
                }`}>
                {f}
              </button>
            );
          })}
        </div>
        <div className="relative w-full md:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-slate-200 bg-white text-gray-700 placeholder:text-slate-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="hidden md:grid grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.9fr_0.8fr] px-5 py-3 bg-slate-50/80 border-b border-gray-100">
          {["Program", "Level", "Duration", "Fee", "Eligibility", ""].map((h) => (
            <span key={h || "apply"} className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
          ))}
        </div>

        {grouped.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-gray-400">No programs match your filters.</div>
        )}

        {grouped.map((group) => (
          <div key={group.key}>
            <div className="px-5 py-2 bg-slate-50 border-y border-gray-100">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{group.label}</span>
            </div>
            {group.rows.map((p, idx) => (
              <div key={p.name}
                className={`grid grid-cols-1 md:grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.9fr_0.8fr] items-center gap-y-1.5 px-5 py-3.5 hover:bg-orange-50/30 transition-colors duration-150 ${
                  idx !== group.rows.length - 1 ? "border-b border-gray-100" : ""
                }`}>
                <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                <span><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${levelBadge(p.level)}`}>{p.level}</span></span>
                <span className="text-sm text-gray-500">{p.duration}</span>
                <span className="text-sm font-medium text-gray-700">{p.fee}</span>
                <span className="text-sm text-gray-500">{p.eligibility}</span>
                <div className="md:justify-self-end">
                  <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600 hover:gap-2 transition-all duration-200">
                    Apply Now
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}