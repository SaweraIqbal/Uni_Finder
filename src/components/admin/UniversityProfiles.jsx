/**
 * UniversityProfiles.jsx — Phase 2 (real API)
 * Super-admin view of all 282 universities from HEC master list.
 * Data from GET /api/admin/universities.
 * Replaces all hardcoded mock rows (UCP, FAST, COMSATS, LUMS, Bahria).
 */
import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import Modal from "./Modal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import { adminListUniversities } from "../../api/verification.js";
import { API } from "../../api/client.js";

const CLAIM_STYLES = {
  claimed:   "bg-emerald-50 text-emerald-700",
  pending:   "bg-amber-50  text-amber-700",
  unclaimed: "bg-slate-100 text-slate-500",
};
const CLAIM_LABELS = {
  claimed:   "Claimed",
  pending:   "Pending Verification",
  unclaimed: "Unclaimed",
};

function ClaimBadge({ state }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${CLAIM_STYLES[state] || CLAIM_STYLES.unclaimed}`}>
      {CLAIM_LABELS[state] || state}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[40, 15, 15, 20, 10, 15].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function UniversityProfiles() {
  const [universities, setUniversities] = useState([]);
  const [total,        setTotal]        = useState(0);
  const [pages,        setPages]        = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [claimedFilter,setClaimedFilter]= useState("");
  const [selectedId,   setSelectedId]   = useState(null);
  const { toasts, showToast, removeToast } = useToast();
  const LIMIT = 25;

  const load = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoading(true);
    try {
      const { ok, data } = await adminListUniversities({
        q: search, type: typeFilter, claimed: claimedFilter, page, limit: LIMIT,
      });
      if (!ok) throw new Error(data?.error?.message || "Failed to load.");
      setUniversities(data.universities || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, claimedFilter, page, showToast]);

  useEffect(() => { load(); }, [load]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const selected = universities.find((u) => u.id === selectedId) ?? null;

  const fileToUrl = (p) => p
    ? `${API}${p.replace(/\\/g, "/").replace(/^.*\/uploads\//, "/uploads/")}`
    : null;

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">University Profiles</h1>
        <p className="text-gray-500 text-sm mt-1">
          HEC master list — {total} universities total
        </p>
      </div>

      {/* Search + filters */}
      <div className="bg-slate-800 rounded-2xl p-6 space-y-4">
        <p className="text-white font-semibold text-lg">Search Universities</p>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-slate-700 text-white placeholder-slate-400 rounded-lg pl-9 pr-4 py-2.5 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">All Types</option>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
          <select value={claimedFilter} onChange={(e) => { setClaimedFilter(e.target.value); setPage(1); }}
            className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">All Status</option>
            <option value="true">Claimed</option>
            <option value="false">Unclaimed</option>
          </select>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm border border-slate-600 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading && universities.length === 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["University", "Programs", "ORIC Domain", "Rank", "Type", "Status"].map((h) => (
                  <th key={h} className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{Array.from({length: 8}).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : universities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search size={28} className="text-orange-400 mb-4" />
            <p className="text-slate-700 font-semibold">No universities found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["University", "Programs", "ORIC Domain", "Rank", "Type", "Status"].map((h) => (
                    <th key={h} className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {universities.map((u, i) => (
                  <tr key={u.id}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${i < universities.length - 1 ? "border-b border-gray-100" : ""}`}
                    onClick={() => setSelectedId(u.id)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {u.logo_url ? (
                          <img src={fileToUrl(u.logo_url)} alt="" className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-100"
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold shrink-0">
                            {(u.name || "").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-slate-800 font-medium text-sm leading-tight">{u.name}</p>
                          <p className="text-gray-400 text-xs">{u.focal_person_name || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{u.program_count ?? 0}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {u.oric_domain || <span className="text-slate-300">Not available</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {u.hec_rank ?? <span className="text-slate-300 text-xs">Unranked</span>}
                    </td>
                    <td className="px-5 py-4">
                      {u.university_type ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.university_type === "Public" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {u.university_type}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <ClaimBadge state={u.claim_state || "unclaimed"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Page {page} of {pages} · {total} universities</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} className="text-slate-600" /></button>
              <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} className="text-slate-600" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={selectedId !== null} onClose={() => setSelectedId(null)} maxWidth="max-w-xl">
        {selected && (
          <>
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                {selected.logo_url ? (
                  <img src={fileToUrl(selected.logo_url)} alt="" className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100"
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">
                    {(selected.name || "").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-slate-800 font-bold text-lg leading-tight">{selected.name}</h2>
                  <ClaimBadge state={selected.claim_state || "unclaimed"} />
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ["HEC Rank",     selected.hec_rank ?? "Unranked"],
                ["Type",         selected.university_type || "—"],
                ["ORIC Domain",  selected.oric_domain || "Not available"],
                ["Campus Count", selected.campus_count ?? "—"],
                ["Programs",     selected.program_count ?? 0],
                ["Focal Person", selected.focal_person_name || "—"],
                ["Focal Email",  selected.focal_person_email || "—"],
                ["Est. Year",    selected.established_year || "—"],
                ["Active Students", selected.active_students ?? "—"],
                ["Reference",    selected.latest_reference || "—"],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="text-slate-800 font-medium text-xs break-all">{v}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
