/**
 * ActivityLog.jsx — Phase 2 (real API)
 * Full activity log from GET /api/admin/activity.
 * Replaces all 10 hardcoded ACTIVITY_LOG mock entries.
 */
import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast, ToastContainer } from "./Toast.jsx";
import { adminListActivity } from "../../api/verification.js";

const ACTION_CONFIG = {
  profile_updated:             { dot: "bg-blue-500",   text: "text-blue-700",  bg: "bg-blue-50",   label: "Profile Updated" },
  active_students_updated:     { dot: "bg-blue-500",   text: "text-blue-700",  bg: "bg-blue-50",   label: "Students Updated" },
  logo_uploaded:               { dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50",  label: "Logo Uploaded" },
  banner_uploaded:             { dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50",  label: "Banner Uploaded" },
  programs_synced:             { dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50",  label: "Programs Synced" },
  verification_submitted:      { dot: "bg-amber-500",  text: "text-amber-700", bg: "bg-amber-50",  label: "Verification Submitted" },
  verification_status_changed: { dot: "bg-amber-500",  text: "text-amber-700", bg: "bg-amber-50",  label: "Verification Updated" },
  program_request_submitted:   { dot: "bg-orange-500", text: "text-orange-700",bg: "bg-orange-50", label: "Program Request" },
  program_request_approved:    { dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50",  label: "Program Approved" },
  program_request_rejected:    { dot: "bg-red-500",    text: "text-red-700",   bg: "bg-red-50",    label: "Program Rejected" },
};

const getCfg = (action) =>
  ACTION_CONFIG[action] || { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50", label: action };

function fmt(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-PK", { year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" }).format(new Date(iso));
}

function SkeletonRow() {
  return (
    <tr>
      {[18,15,18,40,10].map((w,i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{width:`${w}%`}}/>
        </td>
      ))}
    </tr>
  );
}

export default function ActivityLog() {
  const [activities,  setActivities]  = useState([]);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const { toasts, showToast, removeToast } = useToast();
  const LIMIT = 25;

  const load = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoading(true);
    try {
      const { ok, data } = await adminListActivity({ page, limit: LIMIT });
      if (!ok) throw new Error(data?.error?.message || "Failed to load.");
      setActivities(data.activities || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) { showToast("error", e.message); }
    finally { setLoading(false); }
  }, [page, showToast]);

  useEffect(() => { load(); }, [load]);

  // Local search filter (client-side on loaded page)
  const filtered = activities.filter((a) =>
    !search ||
    (a.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.university_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.actor_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Activity Log</h1>
        <p className="text-gray-500 text-sm mt-1">Complete audit trail — {total} total events</p>
      </div>

      {/* Search + refresh */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400 shrink-0"/>
          <input type="text" value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearch(e.target.value); }}
            placeholder="Filter by description, university, or actor…"
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"/>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-orange-300 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
          Refresh
        </button>
        <p className="text-xs text-slate-400 self-center">
          Showing {filtered.length} of {activities.length} on this page
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50">
                {["Timestamp", "University", "Action", "Description", "Actor"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && activities.length === 0
                ? Array.from({length:10}).map((_,i) => <SkeletonRow key={i}/>)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400 text-sm">
                      {activities.length === 0
                        ? "No activity recorded yet. Events will appear here as university admins use the dashboard."
                        : "No events match your filter."}
                    </td>
                  </tr>
                )
                : filtered.map((a) => {
                  const cfg = getCfg(a.action);
                  return (
                    <tr key={a.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap tabular-nums">{fmt(a.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-[140px] truncate" title={a.university_name}>
                        {a.university_name || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-sm">
                        <p className="line-clamp-2">{a.description}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{a.actor_name || "—"}</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Page {page} of {pages} · {total} total</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1,p-1))} disabled={page<=1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} className="text-slate-600"/></button>
              <button type="button" onClick={() => setPage((p) => Math.min(pages,p+1))} disabled={page>=pages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} className="text-slate-600"/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
