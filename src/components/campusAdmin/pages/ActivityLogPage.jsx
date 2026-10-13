/**
 * Activity Log Page — full history of campus admin actions
 * Real API: getCampusActivity
 */
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, SectionTitle, FilterChip } from "../ui";
import { getCampusActivity } from "../../../api/campus";
import { useCampusAdmin } from "../CampusAdminContext";

const PAGE_SIZE = 20;

const ACTION_COLORS = {
  create:  "bg-green-100 text-green-700",
  update:  "bg-blue-100  text-blue-700",
  delete:  "bg-red-100   text-red-700",
  publish: "bg-orange-100 text-orange-700",
  approve: "bg-emerald-100 text-emerald-700",
  reject:  "bg-rose-100  text-rose-700",
};

function actionColor(action = "") {
  const key = Object.keys(ACTION_COLORS).find((k) =>
    action.toLowerCase().includes(k)
  );
  return key ? ACTION_COLORS[key] : "bg-slate-100 text-slate-600";
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const FILTERS = ["All", "Create", "Update", "Delete", "Publish", "Approve", "Reject"];

export default function ActivityLogPage() {
  const { campus } = useCampusAdmin();
  const campusId   = campus?.id;

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("All");
  const [page,    setPage]    = useState(1);

  const load = useCallback(async () => {
    if (!campusId) return;
    setLoading(true);
    try {
      const data = await getCampusActivity(campusId, 200);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [campusId]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((item) => {
    if (filter === "All") return true;
    return (item.action || "").toLowerCase().includes(filter.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <FilterChip
              key={f} label={f}
              active={filter === f}
              onClick={() => { setFilter(f); setPage(1); }}
            />
          ))}
        </div>
        <button
          type="button" onClick={load} disabled={loading}
          className="ml-auto p-2 rounded-lg hover:bg-gray-100 text-slate-400 disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* table */}
      <Card className="p-0 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="px-6 py-10 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-10 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Clock className="w-8 h-8" />
            <p className="text-sm">No activity found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {["Time", "Action", "Description", "Actor"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400 px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((item, i) => (
                  <tr
                    key={item.id ?? i}
                    className="border-b border-slate-100 hover:bg-gray-50 transition-colors"
                    style={{ height: 52 }}
                  >
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      <span title={fmtDate(item.created_at)}>
                        {fmtAgo(item.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${actionColor(item.action)}`}>
                        {item.action || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-sm truncate">
                      {item.description || item.action || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {item.actor_name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages} · {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-slate-600 px-2">{page}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
