import { useMemo, useState } from "react";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const levelGroup = (level) => {
  if (["MS", "MPhil"].includes(level)) return "Postgraduate";
  return level || "Other";
};

const levelLabel = (level) => ({
  UG: "Undergraduate",
  MS: "Postgraduate",
  MPhil: "Postgraduate",
})[level] || level || "Not specified";

function levelBadge(level) {
  if (level === "Undergraduate") return "bg-sky-50 text-sky-600 border-sky-200";
  if (level === "Postgraduate") return "bg-violet-50 text-violet-600 border-violet-200";
  return "bg-orange-50 text-orange-600 border-orange-200";
}

export default function ProgramsOffered({ programs = [] }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => programs.map((program) => {
    const details = program.details || {};
    const degree = program.degree_type || "";
    const name = program.name || "Program";
    const displayName = degree && !name.toLowerCase().startsWith(degree.toLowerCase())
      ? `${degree} ${name}`
      : name;
    const feeRows = Array.isArray(details.fees) ? details.fees : [];
    const fee = feeRows.length
      ? feeRows.map((item) => `${item.head}: PKR ${item.amount}${item.frequency ? ` / ${item.frequency}` : ""}`).join(" · ")
      : program.fee ? `PKR ${program.fee}` : "";
    const eligibility = Array.isArray(details.eligibility)
      ? details.eligibility.map((item) => [item.qualification, item.minPct && `${item.minPct}% minimum`, item.subjects].filter(Boolean).join(" · ")).filter(Boolean).join("; ")
      : "";
    const merit = Array.isArray(details.merit)
      ? details.merit.map((item) => item.component && item.weight ? `${item.component} ${item.weight}%` : "").filter(Boolean).join(" · ")
      : "";
    return {
      ...program,
      details,
      name: displayName,
      level: levelLabel(program.level),
      group: levelGroup(program.level),
      duration: program.duration || "",
      fee,
      eligibility,
      extras: [
        eligibility,
        details.entryTest && details.entryTest !== "None" && `Entry test: ${details.entryTest}${details.testBody ? ` (${details.testBody})` : ""}`,
        details.interviewOn && `Interview required${details.interviewNote ? `: ${details.interviewNote}` : ""}`,
        merit && `Merit: ${merit}`,
      ].filter(Boolean),
    };
  }), [programs]);

  const filters = ["All", ...new Set(rows.map((program) => program.group))];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      const matchesLevel = filter === "All" || p.group === filter;
      const searchable = [p.name, p.level, p.fee, p.eligibility, ...p.extras].join(" ").toLowerCase();
      const matchesQuery = !q || searchable.includes(q);
      return matchesLevel && matchesQuery;
    });
  }, [filter, query, rows]);

  const grouped = [...new Set(filtered.map((program) => program.group))].map((key) => ({
    key,
    label: key === "Other" ? "Other Programs" : `${key} Programs`,
    rows: filtered.filter((program) => program.group === key),
  }));

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Programs Offered</h2>
        <p className="text-sm text-gray-500 mt-1">Explore undergraduate, postgraduate, and PhD programs available at this campus.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
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
        <div className="hidden md:grid grid-cols-[1.4fr_0.8fr_0.7fr_1.4fr] px-5 py-3 bg-slate-50/80 border-b border-gray-100">
          {["Program", "Level", "Duration", "Fees"].map((h) => (
            <span key={h || "apply"} className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-gray-500">No published programs have been added to this campus.</div>
        )}
        {rows.length > 0 && grouped.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-gray-400">No programs match your filters.</div>
        )}

        {grouped.map((group) => (
          <div key={group.key}>
            <div className="px-5 py-2 bg-slate-50 border-y border-gray-100">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{group.label}</span>
            </div>
            {group.rows.map((p, idx) => (
              <div key={p.id || p.name}
                className={`grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_0.7fr_1.4fr] items-center gap-y-1.5 px-5 py-3.5 hover:bg-orange-50/30 transition-colors duration-150 ${
                  idx !== group.rows.length - 1 ? "border-b border-gray-100" : ""
                }`}>
                <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                <span><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${levelBadge(p.level)}`}>{p.level}</span></span>
                <span className="text-sm text-gray-500">{p.duration || "Not provided"}</span>
                <span className="text-sm font-medium text-gray-700">{p.fee || "Not provided"}</span>
                {p.extras.length > 0 && <p className="md:col-span-4 text-xs leading-relaxed text-gray-500">{p.extras.join(" · ")}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}