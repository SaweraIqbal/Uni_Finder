import { useState } from "react";
import { Search } from "lucide-react";
import { useUniversityAdmin } from "./UniversityAdminContext";
import { EmptyState, PageHeader, formatDate } from "./ui";

const ACTION_CONFIG = {
  profile_updated:             { dot: "bg-blue-500",   text: "text-blue-700",  bg: "bg-blue-50",  label: "Profile Updated" },
  active_students_updated:     { dot: "bg-blue-500",   text: "text-blue-700",  bg: "bg-blue-50",  label: "Students Updated" },
  logo_uploaded:               { dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50", label: "Logo Uploaded" },
  banner_uploaded:             { dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50", label: "Banner Uploaded" },
  programs_synced:             { dot: "bg-green-500",  text: "text-green-700", bg: "bg-green-50", label: "Programs Synced" },
  verification_submitted:      { dot: "bg-amber-500",  text: "text-amber-700", bg: "bg-amber-50", label: "Verification Submitted" },
  verification_status_changed: { dot: "bg-amber-500",  text: "text-amber-700", bg: "bg-amber-50", label: "Verification Updated" },
};

export default function ActivityLogSection() {
  const { activityLog, loadingActivity } = useUniversityAdmin();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const filtered = (Array.isArray(activityLog) ? activityLog : []).filter((entry) => {
    const matchSearch = !search ||
      entry.description.toLowerCase().includes(search.toLowerCase()) ||
      (entry.actor_name || "").toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || entry.action === actionFilter;
    const matchFrom = !dateFrom || new Date(entry.created_at) >= new Date(dateFrom);
    const matchTo   = !dateTo   || new Date(entry.created_at) <= new Date(`${dateTo}T23:59:59Z`);
    return matchSearch && matchAction && matchFrom && matchTo;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-w-0">
      <PageHeader
        title="Activity Log"
        subtitle="Audit trail of all profile and data actions for your university."
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or actor…"
              className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="all">All Actions</option>
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <input
            type="date" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
            title="From date"
          />
          <input
            type="date" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
            title="To date"
          />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Showing {filtered.length} of {(activityLog || []).length} entries
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loadingActivity ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message={activityLog?.length === 0
              ? "No activity yet. Actions like saving your profile, uploading assets, or syncing programs will appear here."
              : "No entries match your filters."}
            icon="📋"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Timestamp", "Actor", "Action", "Description"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((entry) => {
                  const cfg = ACTION_CONFIG[entry.action] || { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50", label: entry.action };
                  return (
                    <tr key={entry.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-[140px] truncate">
                        {entry.actor_name || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-sm">
                        <p className="line-clamp-2">{entry.description}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
