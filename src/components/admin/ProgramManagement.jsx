/**
 * ProgramManagement.jsx — Phase 2 (real API)
 * All programs across all universities, paginated, from GET /api/admin/programs.
 * Removes all 12 hardcoded mock programs.
 */
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Search, RefreshCw } from "lucide-react";
import { useToast, ToastContainer } from "./Toast.jsx";
import { adminListPrograms } from "../../api/verification.js";

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
      {[35,15,15,20,15].map((w,i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{width:`${w}%`}}/>
        </td>
      ))}
    </tr>
  );
}

export default function ProgramManagement() {
  const [programs,    setPrograms]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [expandedId,  setExpandedId]  = useState(null);
  const { toasts, showToast, removeToast } = useToast();
  const LIMIT = 25;

  const load = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoading(true);
    try {
      const { ok, data } = await adminListPrograms({ level: levelFilter, q: search, page, limit: LIMIT });
      if (!ok) throw new Error(data?.error?.message || "Failed to load programs.");
      setPrograms(data.programs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) { showToast("error", e.message); }
    finally { setLoading(false); }
  }, [levelFilter, search, page, showToast]);

  useEffect(() => { load(); }, [load]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Program Management</h1>
        <p className="text-gray-500 text-sm mt-1">{total} programs across all universities</p>
      </div>

      {/* Search + filter bar */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <p className="text-white font-semibold text-lg mb-4">Search Programs</p>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-slate-700 text-white placeholder-slate-400 rounded-lg pl-9 pr-4 py-2.5 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
          </div>
          <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
            className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">All Levels</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm border border-slate-600 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""}/>
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["Program", "University", "Level", "Specialization / Track", "Status"].map((h) => (
                  <th key={h} className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && programs.length === 0
                ? Array.from({length: 10}).map((_,i) => <SkeletonRow key={i}/>)
                : programs.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400">
                      No programs found.
                      {(search || levelFilter) && (
                        <button onClick={() => { setSearchInput(""); setLevelFilter(""); }}
                          className="block mx-auto mt-2 text-orange-500 underline text-sm">
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                )
                : programs.map((p) => (
                  <>
                    <tr key={p.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 leading-tight">{p.name}</p>
                        {p.degree_type && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 rounded">{p.degree_type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px]">
                        <p className="truncate">{p.university_name}</p>
                        <p className="text-slate-400">{p.university_type} {p.hec_rank ? `· Rank ${p.hec_rank}` : ""}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.level
                          ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[p.level] || "bg-slate-100 text-slate-600"}`}>{p.level}</span>
                          : <span className="text-slate-300 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px]">
                        {p.specialization && <span className="block truncate">{p.specialization}</span>}
                        {p.track && <span className="italic text-[10px] text-slate-400">{p.track}</span>}
                        {!p.specialization && !p.track && <span className="text-slate-300">—</span>}
                        {/* extra column button */}
                        {p.extra && (
                          <button type="button" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                            className="flex items-center gap-0.5 text-[10px] text-orange-500 hover:text-orange-700 mt-0.5">
                            <ChevronDown size={10} className={expandedId === p.id ? "rotate-180 transition-transform" : "transition-transform"}/>
                            Extra details
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {p.status === "approved" ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                    {/* Extra row */}
                    {expandedId === p.id && p.extra && (
                      <tr key={`${p.id}-extra`} className="bg-orange-50/30">
                        <td colSpan={5} className="px-4 py-2">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Additional Details</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(typeof p.extra === "string" ? JSON.parse(p.extra) : p.extra).map(([k,v]) => (
                              <span key={k} className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1">
                                <span className="text-slate-400">{k}: </span>
                                <span className="text-slate-700">{v}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Page {page} of {pages} · {total} programs</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page<=1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} className="text-slate-600"/></button>
              <button type="button" onClick={() => setPage((p) => Math.min(pages, p+1))} disabled={page>=pages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} className="text-slate-600"/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
