/**
 * ProgramApprovals.jsx — Phase 2 (real API)
 * Two tabs: pending program requests (approve/reject) + university verifications.
 * Replaces all hardcoded INITIAL_PROGRAMS mock data.
 */
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Modal from "./Modal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import {
  adminListProgramRequests,
  adminApproveProgramRequest,
  adminRejectProgramRequest,
} from "../../api/verification.js";

const LEVEL_COLORS = {
  Undergraduate: "bg-blue-50 text-blue-700",
  MS:            "bg-purple-50 text-purple-700",
  MPhil:         "bg-indigo-50 text-indigo-700",
  PhD:           "bg-rose-50 text-rose-700",
  ADP:           "bg-amber-50 text-amber-700",
  Diploma:       "bg-slate-100 text-slate-600",
};

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" });
}

function SkeletonRow() {
  return (
    <tr>
      {[35,20,15,15,15].map((w,i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{width:`${w}%`}}/>
        </td>
      ))}
    </tr>
  );
}

export default function ProgramApprovals() {
  const [activeTab,    setActiveTab]    = useState("pending");
  const [requests,     setRequests]     = useState([]);
  const [total,        setTotal]        = useState(0);
  const [pages,        setPages]        = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [actionId,     setActionId]     = useState(null);   // id being approved/rejected
  const [rejectTarget, setRejectTarget] = useState(null);   // { id, name }
  const [rejectReason, setRejectReason] = useState("");
  const { toasts, showToast, removeToast } = useToast();
  const LIMIT = 25;

  const load = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoading(true);
    try {
      const { ok, data } = await adminListProgramRequests({ status: activeTab, page, limit: LIMIT });
      if (!ok) throw new Error(data?.error?.message || "Failed to load.");
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) { showToast("error", e.message); }
    finally { setLoading(false); }
  }, [activeTab, page, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      const { ok, data } = await adminApproveProgramRequest(id);
      if (!ok) throw new Error(data?.error?.message || data?.message || "Approval failed.");
      showToast("success", "Program request approved.");
      load();
    } catch (e) { showToast("error", e.message); }
    finally { setActionId(null); }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || rejectReason.trim().length < 10) {
      showToast("error", "Reason must be at least 10 characters.");
      return;
    }
    setActionId(rejectTarget.id);
    try {
      const { ok, data } = await adminRejectProgramRequest(rejectTarget.id, rejectReason.trim());
      if (!ok) throw new Error(data?.error?.message || data?.message || "Rejection failed.");
      showToast("error", "Program request rejected.");
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch (e) { showToast("error", e.message); }
    finally { setActionId(null); }
  };

  const TABS = [
    { id: "pending",  label: "Pending",  count: activeTab === "pending"  ? total : undefined },
    { id: "approved", label: "Approved", count: undefined },
    { id: "rejected", label: "Rejected", count: undefined },
  ];

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Program Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve university-admin program requests</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} type="button"
            onClick={() => { setActiveTab(t.id); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${
              activeTab === t.id ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-slate-700 hover:border-orange-300"
            }`}>
            {t.label}
            {t.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === t.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
        <button onClick={load} disabled={loading}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-gray-200 text-slate-600 hover:border-orange-300 disabled:opacity-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""}/>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading && requests.length === 0 ? (
          <table className="w-full text-sm"><tbody>{Array.from({length:6}).map((_,i)=><SkeletonRow key={i}/>)}</tbody></table>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-slate-700 font-semibold text-lg">No {activeTab} requests</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === "pending" ? "All clear — no pending program requests." : `No ${activeTab} requests yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Program", "University", "Level", "Submitted", activeTab === "pending" ? "Actions" : "Status"].map((h) => (
                    <th key={h} className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{r.name}</p>
                      {r.specialization && <p className="text-xs text-slate-400">{r.specialization}</p>}
                      {r.track && <p className="text-xs italic text-slate-400">{r.track}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-[160px]">
                      <p className="truncate">{r.university_name}</p>
                      <p className="text-xs text-slate-400">{r.submitted_by_name || r.submitted_by_email || "—"}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {r.level
                        ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[r.level] || "bg-slate-100 text-slate-600"}`}>{r.level}</span>
                        : "—"
                      }
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{fmt(r.created_at)}</td>
                    <td className="px-5 py-4">
                      {activeTab === "pending" ? (
                        <div className="flex gap-2">
                          <button type="button"
                            onClick={() => handleApprove(r.id)}
                            disabled={actionId !== null}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            {actionId === r.id ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/> : null}
                            Approve
                          </button>
                          <button type="button"
                            onClick={() => { setRejectTarget({ id: r.id, name: r.name }); setRejectReason(""); }}
                            disabled={actionId !== null}
                            className="border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${r.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                            {r.status}
                          </span>
                          {r.rejection_reason && (
                            <p className="text-[10px] text-red-500 mt-1 max-w-[180px] line-clamp-2" title={r.rejection_reason}>{r.rejection_reason}</p>
                          )}
                        </div>
                      )}
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

      {/* Rejection reason modal */}
      <Modal open={rejectTarget !== null} onClose={() => { setRejectTarget(null); setRejectReason(""); }} maxWidth="max-w-lg">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Reject Program Request</h2>
          <p className="text-sm text-slate-600">
            Rejecting: <span className="font-medium">{rejectTarget?.name}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              rows={4} placeholder="Explain why this program request is being rejected…"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"/>
            <p className="text-xs text-slate-400 mt-1">{rejectReason.trim().length}/10 minimum</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setRejectTarget(null); setRejectReason(""); }}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleRejectConfirm}
              disabled={rejectReason.trim().length < 10 || actionId !== null}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors">
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
