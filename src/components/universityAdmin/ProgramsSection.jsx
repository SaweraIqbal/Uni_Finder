/**
 * ProgramsSection.jsx
 * Real programs page — fetches from GET /api/universities/me/programs.
 * Features: level filter, free-text search, pagination, loading skeleton,
 * empty state, error state. No mock data.
 */
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useUniversityAdmin } from "./UniversityAdminContext";
import { EmptyState, PageHeader, StatusChip } from "./ui";
import { getMePrograms } from "../../api/university";

const LEVELS = ["Undergraduate", "MS", "MPhil", "PhD", "ADP", "Diploma"];

const LEVEL_COLORS = {
  Undergraduate: "bg-blue-50 text-blue-700",
  MS:            "bg-purple-50 text-purple-700",
  MPhil:         "bg-indigo-50 text-indigo-700",
  PhD:           "bg-rose-50 text-rose-700",
  ADP:           "bg-amber-50 text-amber-700",
  Diploma:       "bg-slate-100 text-slate-600",
};

function SkeletonRow() {
  return (
    <tr>
      {[40, 15, 20, 25].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded bg-slate-100 animate-pulse"
            style={{ width: `${w}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function ProgramsSection() {
  const { university } = useUniversityAdmin();

  const [programs,     setPrograms]     = useState([]);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // Filters
  const [levelFilter,  setLevelFilter]  = useState("");
  const [searchText,   setSearchText]   = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [page,         setPage]         = useState(1);
  const LIMIT = 25;

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMePrograms({
        level:  levelFilter || undefined,
        q:      searchText  || undefined,
        page,
        limit:  LIMIT,
      });
      setPrograms(data.programs || []);
      setTotal(data.total   || 0);
      setTotalPages(data.pages || 1);
    } catch (e) {
      setError(e.message || "Could not load programs.");
    } finally {
      setLoading(false);
    }
  }, [levelFilter, searchText, page]);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  // Debounce search input → searchText
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchText(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleLevelChange = (lvl) => {
    setLevelFilter(lvl);
    setPage(1);
  };

  if (!university && !loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <EmptyState message="University data not loaded yet." icon="⏳" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto min-w-0 space-y-5">
      <PageHeader
        title="Programs"
        subtitle={total > 0 ? `${total} program${total !== 1 ? "s" : ""} offered` : "Your university's approved program list"}
      />

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search programs…"
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
            aria-label="Search programs"
          />
        </div>

        {/* Level filter */}
        <select
          value={levelFilter}
          onChange={(e) => handleLevelChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 shrink-0"
          aria-label="Filter by level"
        >
          <option value="">All Levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* ── Level tabs (pill shortcuts) ── */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleLevelChange("")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            levelFilter === "" ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300"
          }`}
        >
          All
        </button>
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => handleLevelChange(l)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              levelFilter === l ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}{" "}
          <button
            type="button"
            onClick={fetchPrograms}
            className="underline font-medium ml-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Program Name", "Degree Type", "Level", "Specialization / Track", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-orange-400" />
                      </div>
                      <p className="text-slate-500 text-sm">
                        {searchText || levelFilter
                          ? "No programs match your filters."
                          : "No programs found. Run the seed to import programs from the Excel file."}
                      </p>
                      {(searchText || levelFilter) && (
                        <button
                          type="button"
                          onClick={() => { setSearchInput(""); setLevelFilter(""); setPage(1); }}
                          className="text-xs text-orange-600 underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                programs.map((prog) => (
                  <tr key={prog.id} className="hover:bg-orange-50/30 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 leading-tight">
                        {prog.name}
                      </p>
                      {prog.original_name && prog.original_name !== prog.name && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {prog.original_name}
                        </p>
                      )}
                    </td>

                    {/* Degree type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {prog.degree_type || "—"}
                      </span>
                    </td>

                    {/* Level */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {prog.level ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[prog.level] || "bg-slate-100 text-slate-600"}`}>
                          {prog.level}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* Specialization / Track */}
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">
                      {prog.specialization && (
                        <span className="block truncate">{prog.specialization}</span>
                      )}
                      {prog.track && (
                        <span className="text-[10px] text-slate-400 italic">{prog.track}</span>
                      )}
                      {!prog.specialization && !prog.track && (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusChip
                        status={prog.status === "approved" ? "verified" : "pending"}
                        label={prog.status === "approved" ? "Approved" : "Pending"}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Page {page} of {totalPages} · {total} programs total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
