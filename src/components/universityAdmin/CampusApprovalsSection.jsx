/**
 * CampusApprovalsSection.jsx — University Admin Dashboard
 *
 * Tier-1 campus registration review for the university admin.
 * Shows only registrations addressed to THIS university (server-filtered).
 *
 * Actions:
 *   Approve   → sets uni_tier1_approved=1 (status stays 'pending' until super admin acts)
 *   Reject    → status → 'rejected'; campus admin sees reason and can resubmit
 *   Resubmit  → status → 'resubmission_requested'; campus admin sees required docs
 */
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw, Search, X, MapPin, FileText,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Clock, Building2, Phone, Mail, User, Trash2, Plus,
} from "lucide-react";
import { toast } from "react-toastify";

import { PageHeader } from "./ui";
import { useUniversityAdmin } from "./UniversityAdminContext";
import {
  uniAdminListCampusRegistrations,
  uniAdminUpdateCampusStatus,
} from "../../api/university";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
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
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

/* ─── Status pill ─────────────────────────────────────────────────────────── */
const PILL = {
  pending:                { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Pending"       },
  approved:               { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Approved"      },
  rejected:               { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400",    label: "Rejected"      },
  resubmission_requested: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400", label: "Resubmit Req." },
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

/* ─── Tier-1 badge ─────────────────────────────────────────────────────────── */
function Tier1Badge({ approved }) {
  return approved ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
      <CheckCircle2 className="w-3 h-3" /> Approved by you
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
      <Clock className="w-3 h-3" /> Awaiting your review
    </span>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {[220, 90, 90, 120, 90, 80].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-3.5 bg-slate-100 rounded" style={{ width: w }} />
          {i === 0 && <div className="h-2.5 bg-slate-100 rounded mt-1.5 w-2/3" />}
        </td>
      ))}
    </tr>
  );
}

/* ─── Modals ───────────────────────────────────────────────────────────────── */
function RejectModal({ onCancel, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 10;
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Reject Registration</h2>
      <p className="text-sm text-slate-500">
        This will return the request to the campus admin. They can resubmit once corrected.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Rejection Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe what needs to be corrected…"
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">{reason.trim().length}/10 minimum characters</p>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} disabled={loading}
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onConfirm(reason.trim())} disabled={!valid || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors">
          {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          Confirm Reject
        </button>
      </div>
    </div>
  );
}

function ApproveModal({ campusName, onCancel, onConfirm, loading }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Approve & Forward</h2>
      </div>
      <p className="text-sm text-slate-600">
        Approve <span className="font-semibold text-slate-800">{campusName}</span>?
        The request will be forwarded to Super Admin for final approval.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} disabled={loading}
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
          {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          Yes, Approve
        </button>
      </div>
    </div>
  );
}

function ResubmitModal({ onCancel, onConfirm, loading }) {
  const [docs,  setDocs]  = useState(["HEC Campus Recognition Certificate"]);
  const [note,  setNote]  = useState("");
  const [input, setInput] = useState("");

  const addDoc = () => {
    const v = input.trim();
    if (v && !docs.includes(v)) setDocs((d) => [...d, v]);
    setInput("");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Request Resubmission</h2>
      </div>
      <p className="text-sm text-slate-500">Specify what the campus admin needs to provide.</p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Required Documents <span className="text-red-500">*</span>
        </label>
        <div className="space-y-1.5 mb-2">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-amber-800">{d}</span>
              <button type="button" onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-amber-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc())}
            placeholder="Add required document…"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <button type="button" onClick={addDoc}
            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none text-sm"
          placeholder="Additional context for the campus admin…" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} disabled={loading}
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={() => onConfirm({ requiredDocs: docs, note: note.trim() })}
          disabled={!docs.length || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors">
          {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          Send Request
        </button>
      </div>
    </div>
  );
}

/* ─── Review Drawer ────────────────────────────────────────────────────────── */
function ReviewDrawer({ reg, onClose, onApprove, onReject, onResubmit, actionLoading }) {
  if (!reg) return null;
  const isPending    = reg.status === "pending";
  const tier1Done    = reg.tier1?.approved;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={() => !actionLoading && onClose()} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[500px] bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-base font-bold text-slate-800 leading-tight truncate">{reg.officialName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{reg.publicId}</span>
              <StatusPill status={reg.status} />
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={!!actionLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm">

          {/* Tier-1 status banner */}
          <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
            tier1Done ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"
          }`}>
            {tier1Done
              ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              : <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />}
            <div>
              <p className={`text-xs font-semibold ${tier1Done ? "text-green-700" : "text-amber-700"}`}>
                {tier1Done ? "You approved this — awaiting Super Admin." : "Awaiting your review (Tier-1)."}
              </p>
              {tier1Done && reg.tier1.approvedAt && (
                <p className="text-xs text-green-600 mt-0.5">Approved on {fmtDate(reg.tier1.approvedAt)}</p>
              )}
            </div>
          </div>

          {/* Campus details */}
          <section className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Campus</p>
            <InfoRow icon={Building2} label="Name"     value={reg.officialName} />
            <InfoRow icon={Building2} label="Type"     value={reg.campusType} />
            <InfoRow icon={MapPin}    label="Location" value={`${reg.city}, ${reg.province}`} />
            <InfoRow icon={MapPin}    label="Address"  value={reg.address || "—"} />
          </section>

          {/* Registrant */}
          <section className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Registrant</p>
            <InfoRow icon={User}  label="Name"        value={reg.registrantName} />
            <InfoRow icon={User}  label="Designation" value={reg.designation} />
            <InfoRow icon={Phone} label="Phone"       value={reg.phone} />
            <InfoRow icon={Mail}  label="Email"       value={reg.officialEmail || reg.registrantEmail || "—"} />
          </section>

          {/* Document */}
          {reg.document?.originalName && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Document</p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{reg.document.originalName}</p>
                  <p className="text-xs text-gray-400">{fmtBytes(reg.document.size)}</p>
                </div>
              </div>
            </section>
          )}

          {/* Rejection info */}
          {reg.rejection?.reason && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rejection</p>
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1">
                <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {reg.rejection.reason}
                </span>
                {reg.rejection.note && (
                  <p className="text-sm text-red-700 mt-1">{reg.rejection.note}</p>
                )}
              </div>
            </section>
          )}

          {/* Resubmission docs */}
          {reg.resubmission?.requiredDocs?.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Resubmission Required</p>
              <div className="flex flex-wrap gap-2">
                {reg.resubmission.requiredDocs.map((d) => (
                  <span key={d} className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{d}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Submitted date */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Submitted: <span className="text-slate-600 font-medium">{fmtDate(reg.submittedAt)}</span>
            </p>
          </div>
        </div>

        {/* Action footer — only when still reviewable */}
        {isPending && !tier1Done && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              <button type="button" onClick={onApprove} disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors focus:outline-none">
                {actionLoading === "approve"
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <CheckCircle2 className="w-4 h-4" />}
                Approve & Forward
              </button>
              <button type="button" onClick={onReject} disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors focus:outline-none">
                {actionLoading === "reject"
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <XCircle className="w-4 h-4" />}
                Reject
              </button>
            </div>
            <button type="button" onClick={onResubmit} disabled={!!actionLoading}
              className="w-full flex items-center justify-center gap-1.5 border-2 border-amber-400 text-amber-700 hover:bg-amber-50 disabled:opacity-50 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors focus:outline-none">
              {actionLoading === "request_resubmission"
                ? <span className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-500 rounded-full animate-spin" />
                : <AlertTriangle className="w-4 h-4" />}
              Request Resubmission
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-xs text-gray-400">{label}: </span>
        <span className="text-sm text-slate-700 font-medium break-words">{value || "—"}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Section
═══════════════════════════════════════════════════════════════════════════ */
const STATUS_TABS = ["All", "Pending", "Approved", "Rejected"];

export default function CampusApprovalsSection() {
  const { fetchCampusRequests } = useUniversityAdmin();

  const [registrations, setRegistrations] = useState([]);
  const [stats,         setStats]         = useState({ pending:0, approved:0, rejected:0, total:0 });
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [activeTab,     setActiveTab]     = useState("All");
  const [selectedId,    setSelectedId]    = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // modals
  const [showApprove,  setShowApprove]  = useState(false);
  const [showReject,   setShowReject]   = useState(false);
  const [showResubmit, setShowResubmit] = useState(false);

  const selectedReg = registrations.find((r) => r.id === selectedId) ?? null;

  const load = useCallback(async (tab = "All") => {
    if (!sessionStorage.getItem("token")) return;
    setLoading(true);
    setRegistrations([]);
    try {
      const statusParam = tab === "All" ? "" : tab.toLowerCase();
      const { ok, status, data } = await uniAdminListCampusRegistrations({ status: statusParam });
      if (status === 401 || status === 403) return;
      if (!ok) throw new Error(data?.message || "Failed to load.");
      setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      toast.error(e.message || "Could not load campus registrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => { if (mounted) await load(activeTab); };
    run();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filtered = registrations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.officialName   || "").toLowerCase().includes(q) ||
      (r.city           || "").toLowerCase().includes(q) ||
      (r.publicId       || "").toLowerCase().includes(q) ||
      (r.registrantName || "").toLowerCase().includes(q)
    );
  });

  const tabCount = (tab) => {
    if (tab === "All") return stats.total;
    return stats[tab.toLowerCase()] ?? 0;
  };

  const closeDrawer    = () => { if (!actionLoading) setSelectedId(null); };
  const closeAllModals = () => { setShowApprove(false); setShowReject(false); setShowResubmit(false); };

  const doAction = async (action, body = {}) => {
    if (!selectedId) return;
    setActionLoading(action);
    closeAllModals();
    try {
      const { ok, data } = await uniAdminUpdateCampusStatus(selectedId, { action, ...body });
      if (!ok) throw new Error(data?.message || "Action failed.");
      const labels = { approve: "approved and forwarded", reject: "rejected", request_resubmission: "resubmission requested" };
      toast.success(`Campus ${labels[action] || "updated"}.`);
      setSelectedId(null);
      await load(activeTab);
      fetchCampusRequests?.(); // refresh sidebar badge
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <PageHeader
        title="Campus Approvals"
        subtitle="Review and approve campus registration requests for your university."
      />

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending",  value: stats.pending,  color: "text-amber-600"  },
          { label: "Approved", value: stats.approved, color: "text-green-600"  },
          { label: "Rejected", value: stats.rejected, color: "text-red-600"    },
          { label: "Total",    value: stats.total,    color: "text-slate-800"  },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + refresh ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campus, city, ID…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button type="button" onClick={() => load(activeTab)} disabled={loading}
          className="flex items-center gap-2 border border-gray-200 bg-white text-slate-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button key={t} type="button" onClick={() => { setActiveTab(t); setSearch(""); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 ${
              activeTab === t
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-slate-700 hover:border-orange-300"
            }`}>
            {t}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
              activeTab === t ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {tabCount(t)}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <THead />
            <tbody>{[1,2,3].map((n) => <SkeletonRow key={n} />)}</tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState search={search} tab={activeTab} />
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
              <THead />
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id}
                    className={`hover:bg-gray-50 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-semibold text-sm leading-tight">{r.officialName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{r.publicId}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">{r.city}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">{fmtDate(r.submittedAt)}</td>
                    <td className="px-6 py-4"><Tier1Badge approved={r.tier1?.approved} /></td>
                    <td className="px-6 py-4"><StatusPill status={r.status} /></td>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => setSelectedId(r.id)}
                        className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 active:scale-[0.97] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-400">
                        Review <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.officialName}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{r.publicId}</p>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                  <Tier1Badge approved={r.tier1?.approved} />
                  <button type="button" onClick={() => setSelectedId(r.id)}
                    className="text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Drawers & Modals ── */}
      <ReviewDrawer
        reg={selectedReg}
        onClose={closeDrawer}
        onApprove={() => setShowApprove(true)}
        onReject={() => setShowReject(true)}
        onResubmit={() => setShowResubmit(true)}
        actionLoading={actionLoading}
      />

      {/* Approve confirm */}
      {showApprove && (
        <ModalOverlay onClose={() => !actionLoading && setShowApprove(false)}>
          <ApproveModal
            campusName={selectedReg?.officialName}
            onCancel={() => setShowApprove(false)}
            onConfirm={() => doAction("approve")}
            loading={actionLoading === "approve"}
          />
        </ModalOverlay>
      )}

      {/* Reject */}
      {showReject && (
        <ModalOverlay onClose={() => !actionLoading && setShowReject(false)}>
          <RejectModal
            onCancel={() => setShowReject(false)}
            onConfirm={(reason) => doAction("reject", { reason })}
            loading={actionLoading === "reject"}
          />
        </ModalOverlay>
      )}

      {/* Resubmission */}
      {showResubmit && (
        <ModalOverlay onClose={() => !actionLoading && setShowResubmit(false)}>
          <ResubmitModal
            onCancel={() => setShowResubmit(false)}
            onConfirm={({ requiredDocs, note }) => doAction("request_resubmission", { requiredDocs, note })}
            loading={actionLoading === "request_resubmission"}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

/* ─── Table header ─────────────────────────────────────────────────────────── */
function THead() {
  return (
    <thead>
      <tr className="border-b border-gray-100">
        {["Campus", "City", "Submitted", "Your Review", "Status", "Action"].map((h) => (
          <th key={h} className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-6 py-4">
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState({ search, tab }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <MapPin className="w-7 h-7 text-slate-400" />
      </div>
      <h2 className="text-base font-semibold text-slate-700 mb-1">No registrations found</h2>
      <p className="text-sm text-slate-400 max-w-sm">
        {search
          ? "Try adjusting your search."
          : tab === "All"
          ? "No campus registrations have been submitted for your university yet."
          : `No ${tab.toLowerCase()} campus registrations.`}
      </p>
    </div>
  );
}

/* ─── Simple modal overlay (no external dep) ──────────────────────────────── */
function ModalOverlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
