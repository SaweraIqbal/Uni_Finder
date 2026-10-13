/**
 * CampusApprovals.jsx — Super Admin dashboard section
 *
 * Fully live — all data from:
 *   GET  /api/admin/campus-registrations          (list + stats)
 *   PATCH /api/admin/campus-registrations/:id/status (approve / reject / request_resubmission)
 *
 * Matches the screenshot:
 *   - Stats row: Pending Approval / Approved / Total Campuses
 *   - Filter tabs: All · Pending · Approved · Rejected
 *   - Desktop table: Campus | University | City | Tier-1 (Univ. Admin) | Status | Action
 *   - "Review" button opens a right-side drawer with full details
 *   - Approve → confirm modal
 *   - Reject → textarea reason modal (min 10 chars)
 *   - Request Resubmission → docs modal
 */
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw, Search, X, FileText, CheckCircle2,
  XCircle, AlertTriangle, Clock, ChevronRight, Building2,
  Phone, Mail, MapPin, User, Trash2, Plus, Lock,
} from "lucide-react";
import Modal            from "./Modal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import {
  adminListCampusRegistrations,
  adminUpdateCampusRegistrationStatus,
} from "../../api/verification.js";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return String(iso); }
};

const fmtBytes = (n) => {
  if (!n) return "";
  if (n < 1024)        return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

/* ─── Status pill ────────────────────────────────────────────────────────── */
const PILL = {
  pending:               { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Pending"        },
  approved:              { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved"       },
  rejected:              { bg: "bg-red-50",      text: "text-red-600",     dot: "bg-red-400",     label: "Rejected"       },
  resubmission_requested:{ bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-400",  label: "Resubmission Req." },
};

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  const c = PILL[s] || { bg:"bg-gray-100", text:"text-gray-600", dot:"bg-gray-400", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ─── Tier-1 cell (university admin review status) ───────────────────────── */
// Shows whether the university admin has done their tier-1 review.
// Super admin can only give final approval once uni_tier1_approved = 1.
function Tier1Cell({ reg }) {
  const approved = !!reg.uni_tier1_approved;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
      approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
    }`}>
      {approved
        ? <CheckCircle2 className="w-3 h-3" />
        : <Clock className="w-3 h-3" />}
      {approved ? "Approved" : "Pending"}
    </span>
  );
}

/* ─── Skeleton loader ────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {[220, 100, 90, 110, 90, 80].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-3.5 bg-gray-100 rounded" style={{ width: w }} />
          {i === 0 && <div className="h-2.5 bg-gray-100 rounded mt-1.5 w-2/3" />}
        </td>
      ))}
    </tr>
  );
}

/* ─── Review Drawer ──────────────────────────────────────────────────────── */
function ReviewDrawer({ reg, onClose, onApprove, onReject, onRequestResubmit, actionLoading }) {
  if (!reg) return null;
  const isPending = reg.status === "pending";

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => { if (!actionLoading) onClose(); }}
      />
      {/* panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-lg font-bold text-slate-800 leading-tight truncate">
              {reg.officialName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {reg.publicId}
              </span>
              <StatusPill status={reg.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!!actionLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">

          {/* Campus basics */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Campus</h3>
            <Row icon={Building2} label="Name"     value={reg.officialName} />
            <Row icon={Building2} label="Type"     value={reg.campusType} />
            <Row icon={MapPin}    label="Location" value={`${reg.city}, ${reg.province}`} />
            <Row icon={MapPin}    label="Address"  value={reg.address || "—"} />
            <Row icon={Building2} label="University" value={reg.universityName || "—"} />
          </section>

          {/* Registrant */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Registrant</h3>
            <Row icon={User}  label="Name"        value={reg.registrantName} />
            <Row icon={User}  label="Designation" value={reg.designation} />
            <Row icon={Phone} label="Phone"       value={reg.phone} />
            <Row icon={Mail}  label="Email"       value={reg.officialEmail || reg.registrantEmail || "—"} />
          </section>

          {/* Document */}
          {reg.document?.originalName && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Document</h3>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 font-medium truncate text-sm">{reg.document.originalName}</p>
                  <p className="text-gray-400 text-xs">{fmtBytes(reg.document.size)}</p>
                </div>
              </div>
            </section>
          )}

          {/* Rejection info */}
          {reg.rejection?.reason && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rejection</h3>
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1">
                <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {reg.rejection.reason}
                </span>
                {reg.rejection.note && (
                  <p className="text-sm text-red-700 leading-relaxed mt-1">{reg.rejection.note}</p>
                )}
              </div>
            </section>
          )}

          {/* Resubmission info */}
          {reg.resubmission?.requiredDocs?.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Resubmission Required</h3>
              <div className="flex flex-wrap gap-2">
                {reg.resubmission.requiredDocs.map((d) => (
                  <span key={d} className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {d}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* History */}
          {reg.history?.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">History</h3>
              <ol className="space-y-2">
                {[...reg.history].reverse().map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-medium capitalize text-slate-700">{h.status?.replace(/_/g, " ")}</span>
                      {h.note && <span className="ml-1.5 text-gray-400">— {h.note}</span>}
                      <span className="ml-1.5 text-gray-400">{fmtDate(h.at)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Dates */}
          <section className="space-y-1.5 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">
              Submitted: <span className="text-slate-600 font-medium">{fmtDate(reg.submittedAt)}</span>
            </p>
            {reg.updatedAt && reg.updatedAt !== reg.submittedAt && (
              <p className="text-xs text-gray-400">
                Last updated: <span className="text-slate-600 font-medium">{fmtDate(reg.updatedAt)}</span>
              </p>
            )}
          </section>
        </div>

        {/* action footer — only shown when pending */}
        {isPending && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              {/* Approve is gated by tier-1 */}
              <div className="relative flex-1 group">
                <button
                  type="button"
                  onClick={reg.uni_tier1_approved ? onApprove : undefined}
                  disabled={!!actionLoading || !reg.uni_tier1_approved}
                  className={`w-full flex items-center justify-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 ${
                    reg.uni_tier1_approved
                      ? "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white focus:ring-emerald-400"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {actionLoading === "approve"
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : reg.uni_tier1_approved
                    ? <CheckCircle2 size={16} />
                    : <Lock size={16} />}
                  {reg.uni_tier1_approved ? "Approve" : "Approve (locked)"}
                </button>
                {/* Tooltip when locked */}
                {!reg.uni_tier1_approved && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 text-center text-xs bg-slate-800 text-white px-3 py-2 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                    University Admin must approve first before Super Admin can approve.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onReject}
                disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700
                           disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm
                           px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                {actionLoading === "reject"
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <XCircle size={16} />}
                Reject
              </button>
            </div>
            <button
              type="button"
              onClick={onRequestResubmit}
              disabled={!!actionLoading}
              className="w-full flex items-center justify-center gap-2 border-2 border-amber-400 text-amber-700
                         hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed
                         font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors
                         focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {actionLoading === "request_resubmission"
                ? <span className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-500 rounded-full animate-spin" />
                : <AlertTriangle size={16} />}
              Request Resubmission
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-gray-400 text-xs">{label}: </span>
        <span className="text-slate-700 text-sm font-medium break-words">{value || "—"}</span>
      </div>
    </div>
  );
}

/* ─── Reject modal ───────────────────────────────────────────────────────── */
function RejectModal({ onCancel, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 10;
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Reject Registration</h2>
      <p className="text-sm text-slate-600">
        Provide a reason. The campus admin will see this and can resubmit once corrected.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Rejection Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe what needs to be corrected…"
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">
          {reason.trim().length}/10 minimum characters
        </p>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(reason.trim())}
          disabled={!valid || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          Confirm Rejection
        </button>
      </div>
    </div>
  );
}

/* ─── Approve confirm modal ──────────────────────────────────────────────── */
function ApproveModal({ campusName, onCancel, onConfirm, loading }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Approve Registration</h2>
      </div>
      <p className="text-sm text-slate-600">
        Approve <span className="font-semibold text-slate-800">{campusName}</span>?
        This will allow the campus admin to access the full Campus Admin Dashboard.
      </p>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          Yes, Approve
        </button>
      </div>
    </div>
  );
}

/* ─── Resubmission docs modal ────────────────────────────────────────────── */
function ResubmitModal({ onCancel, onConfirm, loading }) {
  const [docs, setDocs] = useState(["HEC Campus Recognition Certificate"]);
  const [note, setNote] = useState("");
  const [input, setInput] = useState("");

  const addDoc = () => {
    const v = input.trim();
    if (v && !docs.includes(v)) setDocs((d) => [...d, v]);
    setInput("");
  };
  const removeDoc = (i) => setDocs((d) => d.filter((_, idx) => idx !== i));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle size={20} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Request Resubmission</h2>
      </div>
      <p className="text-sm text-slate-600">
        Specify which documents are required. The campus admin will be notified.
      </p>

      {/* doc list */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Required Documents <span className="text-red-500">*</span>
        </label>
        <div className="space-y-1.5 mb-2">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-amber-800">{d}</span>
              <button type="button" onClick={() => removeDoc(i)} className="text-amber-400 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc())}
            placeholder="Add required document…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="button"
            onClick={addDoc}
            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* optional note */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional context for the campus admin…"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm({ requiredDocs: docs, note: note.trim() })}
          disabled={!docs.length || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          Send Request
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════════════════ */
const STATUS_TABS = ["All", "Pending", "Approved", "Rejected"];

export default function CampusApprovals() {
  const { toasts, showToast, removeToast } = useToast();

  /* ── data state ── */
  const [registrations, setRegistrations] = useState([]);
  const [stats,         setStats]         = useState({ pending: 0, approved: 0, rejected: 0, resubmission: 0, total: 0 });
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");

  /* ── UI state ── */
  const [activeTab,    setActiveTab]    = useState("All");
  const [selectedId,   setSelectedId]   = useState(null);   // drawer
  const [actionLoading, setActionLoading] = useState(null); // "approve" | "reject" | "request_resubmission"

  /* ── modal state ── */
  const [showApproveModal,  setShowApproveModal]  = useState(false);
  const [showRejectModal,   setShowRejectModal]   = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);

  /* ── derived ── */
  const selectedReg = registrations.find((r) => r.id === selectedId) ?? null;

  /* ── fetch ── */
  const load = useCallback(async (tab = activeTab) => {
    if (!sessionStorage.getItem("token")) return;
    setLoading(true);
    setRegistrations([]);
    try {
      const statusParam = tab === "All" ? "" : tab.toLowerCase();
      const { ok, status, data } = await adminListCampusRegistrations({ status: statusParam });
      if (status === 401 || status === 403) return;
      if (!ok) throw new Error(data?.message || "Failed to load campus registrations.");
      setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      showToast("error", err.message || "Could not load campus registrations.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, showToast]);

  useEffect(() => {
    let mounted = true;
    const run = async () => { if (mounted) await load(activeTab); };
    run();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* ── client-side search filter ── */
  const filtered = registrations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.officialName    || "").toLowerCase().includes(q) ||
      (r.universityName  || "").toLowerCase().includes(q) ||
      (r.city            || "").toLowerCase().includes(q) ||
      (r.publicId        || "").toLowerCase().includes(q) ||
      (r.registrantName  || "").toLowerCase().includes(q)
    );
  });

  /* ── tab counts ── */
  const tabCount = (tab) => {
    if (tab === "All") return stats.total;
    return stats[tab.toLowerCase()] ?? 0;
  };

  /* ── action handlers ── */
  const closeDrawer = () => { if (!actionLoading) setSelectedId(null); };

  const handleApprove = () => { setShowApproveModal(true); };
  const handleReject  = () => { setShowRejectModal(true);  };
  const handleRequestResubmit = () => { setShowResubmitModal(true); };

  const closeAllModals = () => {
    setShowApproveModal(false);
    setShowRejectModal(false);
    setShowResubmitModal(false);
  };

  const doAction = async (action, body = {}) => {
    if (!selectedId) return;
    setActionLoading(action);
    closeAllModals();
    try {
      const { ok, data } = await adminUpdateCampusRegistrationStatus(selectedId, { action, ...body });
      if (!ok) {
        // Special case: tier-1 gate
        if (data?.code === "TIER1_NOT_APPROVED") {
          showToast("error", "University Admin must approve this campus first.");
          return;
        }
        throw new Error(data?.message || data?.error?.message || "Action failed.");
      }

      const labels = { approve: "approved", reject: "rejected", request_resubmission: "resubmission requested" };
      showToast("success", `Campus ${labels[action] || "updated"} successfully.`);
      setSelectedId(null);
      await load(activeTab);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ── render ── */
  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Campus Approvals</h1>
        <p className="text-gray-500 text-[15px] mt-1">
          Two-tier approval workflow for new campus registrations
        </p>
      </div>

      {/* stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Approval", value: stats.pending,  color: "text-orange-500" },
          { label: "Approved",         value: stats.approved, color: "text-emerald-600" },
          { label: "Total Campuses",   value: stats.total,    color: "text-slate-800"  },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-6 hover:-translate-y-0.5 transition-transform">
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className={`text-4xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* search + refresh */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campus, university, city…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => load(activeTab)}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-200 bg-white text-slate-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setActiveTab(t); setSearch(""); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${
              activeTab === t
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-slate-700 hover:border-orange-300"
            }`}
          >
            {t}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
              activeTab === t ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {tabCount(t)}
            </span>
          </button>
        ))}
      </div>

      {/* ── mobile cards ── */}
      {loading ? (
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl shadow-sm p-4 animate-pulse space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <EmptyState search={search} tab={activeTab} />
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.officialName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.universityName} · {r.city}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{r.publicId}</p>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <Tier1Cell reg={r} />
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="text-xs font-medium text-slate-600 bg-gray-100 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── desktop table ── */}
      <div className="hidden md:block">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <THead />
              <tbody>{[1, 2, 3, 4].map((n) => <SkeletonRow key={n} />)}</tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} tab={activeTab} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <THead />
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      i < filtered.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    {/* Campus */}
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-semibold text-sm leading-tight">{r.officialName}</p>
                      <p className="text-gray-400 text-xs mt-0.5 font-mono">{r.officialEmail || r.registrantEmail}</p>
                    </td>
                    {/* University */}
                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {r.universityName || "—"}
                    </td>
                    {/* City */}
                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {r.city}
                    </td>
                    {/* Tier-1 */}
                    <td className="px-6 py-4">
                      <Tier1Cell reg={r} />
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusPill status={r.status} />
                    </td>
                    {/* Action */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.97]
                                   text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all
                                   focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        Review <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Review drawer ── */}
      {selectedId && (
        <ReviewDrawer
          reg={selectedReg}
          onClose={closeDrawer}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestResubmit={handleRequestResubmit}
          actionLoading={actionLoading}
        />
      )}

      {/* ── Approve confirm modal ── */}
      <Modal open={showApproveModal} onClose={() => !actionLoading && setShowApproveModal(false)} maxWidth="max-w-md">
        <ApproveModal
          campusName={selectedReg?.officialName}
          onCancel={() => setShowApproveModal(false)}
          onConfirm={() => doAction("approve")}
          loading={actionLoading === "approve"}
        />
      </Modal>

      {/* ── Reject modal ── */}
      <Modal open={showRejectModal} onClose={() => !actionLoading && setShowRejectModal(false)} maxWidth="max-w-lg">
        <RejectModal
          onCancel={() => setShowRejectModal(false)}
          onConfirm={(reason) => doAction("reject", { reason })}
          loading={actionLoading === "reject"}
        />
      </Modal>

      {/* ── Resubmission modal ── */}
      <Modal open={showResubmitModal} onClose={() => !actionLoading && setShowResubmitModal(false)} maxWidth="max-w-lg">
        <ResubmitModal
          onCancel={() => setShowResubmitModal(false)}
          onConfirm={({ requiredDocs, note }) => doAction("request_resubmission", { requiredDocs, note })}
          loading={actionLoading === "request_resubmission"}
        />
      </Modal>
    </div>
  );
}

/* ─── Table header ────────────────────────────────────────────────────────── */
function THead() {
  return (
    <thead>
      <tr className="border-b border-gray-100">
        {["Campus", "University", "City", "Tier-1 (Univ. Admin)", "Status", "Action"].map((h) => (
          <th key={h} className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-6 py-4">
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ search, tab }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
        <Building2 size={28} className="text-orange-400" />
      </div>
      <p className="text-slate-700 font-semibold text-lg">No registrations found</p>
      <p className="text-gray-400 text-sm mt-1">
        {search
          ? "Try adjusting your search."
          : tab === "All"
          ? "No campus registrations have been submitted yet."
          : `No ${tab.toLowerCase()} registrations.`}
      </p>
    </div>
  );
}
