import { useCallback, useEffect, useState } from "react";
import { Search, X, ExternalLink, RefreshCw } from "lucide-react";
import Modal from "./Modal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import {
  listVerifications,
  approveVerification,
  rejectVerification,
} from "../../api/verification.js";
import { API, authHeaders } from "../../api/client.js";

/* ── helpers ─────────────────────────────────────────────────── */
const STATUS_TABS = ["pending", "approved", "rejected"];

const STATUS_STYLES = {
  pending:  "bg-amber-50  text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50    text-red-600",
};

const DOMAIN_ICON = {
  match:    { icon: "✅", label: "Match",    cls: "text-emerald-700" },
  unknown:  { icon: "⚠️", label: "Unknown",  cls: "text-amber-700"  },
  mismatch: { icon: "⚠️", label: "Mismatch", cls: "text-amber-700"  },
};

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[s] || "bg-gray-100 text-gray-600"}`}>
      {s}
    </span>
  );
}

/* ── main component ──────────────────────────────────────────── */
export default function UniversityVerifications() {
  const [activeTab, setActiveTab]       = useState("pending");
  const [rows, setRows]                 = useState([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [search, setSearch]             = useState("");
  const [selectedId, setSelectedId]     = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // "approve" | "reject" | null
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toasts, showToast, removeToast } = useToast();

  /* fetch real data whenever tab changes */
  const loadRows = useCallback(async (tab) => {
    // Don't fetch if there's no token — user has logged out
    if (!sessionStorage.getItem("token")) return;

    setLoadingList(true);
    setRows([]);
    setSelectedId(null);
    try {
      const { ok, status, data } = await listVerifications(tab);
      // 401/403 means session expired or logged out — stop silently, no toast
      if (status === 401 || status === 403) return;
      if (!ok) throw new Error(data?.message || "Failed to load verifications");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast("error", err.message || "Could not load verifications.");
    } finally {
      setLoadingList(false);
    }
  // showToast is now stable (memoized in useToast), safe as a dep
  }, [showToast]);

  useEffect(() => {
    let mounted = true;
    // Only run if still mounted (guards against setState after unmount/logout)
    const safeLoad = async () => {
      if (!mounted) return;
      await loadRows(activeTab);
    };
    safeLoad();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // intentionally exclude loadRows — it only changes when showToast changes (never)

  const selectedApp = rows.find((r) => r.id === selectedId) ?? null;

  /* search across name, reference, applicant */
  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.university_name || "").toLowerCase().includes(q) ||
      (r.reference_no    || "").toLowerCase().includes(q) ||
      (r.full_name       || "").toLowerCase().includes(q) ||
      (r.email           || "").toLowerCase().includes(q)
    );
  });

  /* approve */
  const handleApprove = async () => {
    if (!selectedId) return;
    const app = rows.find((r) => r.id === selectedId);

    if ((app?.domain_state || "") !== "match" && !app?.loe_path) {
      showToast("error", "Cannot approve: domain mismatch with no authorization letter on file.");
      return;
    }

    setActionLoading("approve");
    try {
      const { ok, data } = await approveVerification(selectedId);
      if (!ok) throw new Error(data?.message || "Approval failed.");
      showToast("success", "University approved successfully.");
      setSelectedId(null);
      await loadRows(activeTab);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* open reject reason modal */
  const handleReject = () => {
    if (!selectedId) return;
    setRejectionReason("");
    setShowRejectModal(true);
  };

  /* confirm rejection */
  const handleRejectConfirm = async () => {
    if (rejectionReason.trim().length < 10) {
      showToast("error", "Rejection reason must be at least 10 characters.");
      return;
    }
    setActionLoading("reject");
    setShowRejectModal(false);
    try {
      const { ok, data } = await rejectVerification(selectedId, rejectionReason.trim());
      if (!ok) throw new Error(data?.message || "Rejection failed.");
      showToast("error", "University application rejected.");
      setSelectedId(null);
      await loadRows(activeTab);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
      setRejectionReason("");
    }
  };

  /* LOE url for admin-authenticated streaming */
  const loeUrl = (app) =>
    app?.loe_path
      ? `${API}/api/admin/verifications/${app.id}/authorization-letter`
      : null;

  const loeFetchHeaders = () => authHeaders();

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          University Verifications
        </h1>
        <p className="text-gray-500 text-sm sm:text-[15px] mt-1">
          Review and manage university account verification requests
        </p>
      </div>

      {/* search + refresh */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <p className="text-white font-semibold text-lg">Search Applications</p>
        <p className="text-slate-400 text-sm mt-1 mb-4">
          Search by university name, reference number, or applicant
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-slate-700 text-white placeholder-slate-400 rounded-lg pl-9 pr-4 py-2.5 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              aria-label="Search verifications"
            />
          </div>
          <button
            onClick={() => loadRows(activeTab)}
            disabled={loadingList}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm border border-slate-600 transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={loadingList ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearch(""); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${
              activeTab === tab
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-slate-700 hover:border-orange-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* list */}
      {loadingList ? (
        <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center py-20">
          <span className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <Search size={28} className="text-orange-400" />
          </div>
          <p className="text-slate-700 font-semibold text-lg">No results</p>
          <p className="text-gray-400 text-sm mt-1">
            {rows.length === 0
              ? `No ${activeTab} applications.`
              : "Try adjusting your search."}
          </p>
        </div>
      ) : (
        <>
          {/* mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.university_name}</p>
                    <p className="text-xs text-gray-500 truncate">{r.full_name} · {r.designation}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.reference_no}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className={`text-xs ${DOMAIN_ICON[r.domain_state]?.cls || "text-gray-500"}`}>
                    {DOMAIN_ICON[r.domain_state]?.icon} Domain {DOMAIN_ICON[r.domain_state]?.label || "—"}
                  </span>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className="text-xs font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "University",
                    "Applicant",
                    "Reference",
                    "Domain",
                    "Submitted",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider px-5 py-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const domainInfo = DOMAIN_ICON[r.domain_state];
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        i < filtered.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      {/* UNIVERSITY */}
                      <td className="px-5 py-4">
                        <p className="text-slate-800 font-medium text-sm leading-tight">
                          {r.university_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {r.university_type && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                              {r.university_type}
                            </span>
                          )}
                          {r.hec_rank && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                              HEC {r.hec_rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* APPLICANT */}
                      <td className="px-5 py-4">
                        <p className="text-slate-700 text-sm font-medium">{r.full_name}</p>
                        <p className="text-gray-400 text-xs">
                          {r.designation === "Other" ? (r.designation_other || "Other") : r.designation}
                        </p>
                      </td>

                      {/* REFERENCE */}
                      <td className="px-5 py-4 text-slate-600 text-sm font-mono">
                        {r.reference_no || "—"}
                      </td>

                      {/* DOMAIN */}
                      <td className="px-5 py-4">
                        {domainInfo ? (
                          <span className={`text-sm ${domainInfo.cls}`}>
                            {domainInfo.icon} {domainInfo.label}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>

                      {/* SUBMITTED */}
                      <td className="px-5 py-4 text-slate-500 text-sm">
                        {fmt(r.created_at)}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* ACTION */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedId(r.id)}
                          className="text-xs font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────── */}
      <Modal
        open={selectedId !== null}
        onClose={() => { if (!actionLoading) setSelectedId(null); }}
        maxWidth="max-w-2xl"
      >
        {selectedApp && (
          <DetailModal
            app={selectedApp}
            loeUrl={loeUrl(selectedApp)}
            loeFetchHeaders={loeFetchHeaders}
            actionLoading={actionLoading}
            onClose={() => setSelectedId(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </Modal>

      {/* ── Reject reason modal ───────────────────────────────────── */}
      <Modal
        open={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectionReason(""); }}
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Reject Application</h2>
          <p className="text-sm text-slate-600">
            Provide a reason for rejection. The applicant will see this and can resubmit once corrected.
          </p>
          <div>
            <label htmlFor="rejection-reason" className="block text-sm font-medium text-slate-700 mb-1.5">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Describe what needs to be corrected…"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              {rejectionReason.trim().length}/10 minimum characters
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setShowRejectModal(false); setRejectionReason(""); }}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={rejectionReason.trim().length < 10 || actionLoading !== null}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Detail modal content ────────────────────────────────────── */
function DetailModal({ app, loeUrl, loeFetchHeaders, actionLoading, onClose, onApprove, onReject }) {
  const status = (app.status || "").toLowerCase();
  const isPending = status === "pending";

  const domainInfo = DOMAIN_ICON[app.domain_state];
  const designationLabel =
    app.designation === "Other"
      ? app.designation_other || "Other"
      : app.designation || "—";

  // Approve disabled: domain not 'match' AND no LOE
  const approveBlocked = app.domain_state !== "match" && !app.loe_path;

  return (
    <>
      {/* header */}
      <div className="flex items-start justify-between p-6 border-b border-gray-100">
        <div className="min-w-0 flex-1 pr-4">
          <h2 className="text-slate-800 font-bold text-lg leading-tight">
            {app.university_name}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {app.reference_no || "No ref"}
            </span>
            <StatusBadge status={app.status} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors shrink-0"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">

        {/* Applicant block */}
        <Section title="Applicant">
          <Row label="Full Name"    value={app.full_name || "—"} />
          <Row label="Designation"  value={designationLabel} />
          <Row label="Official Email" value={app.email || "—"} />
          <Row label="Phone"        value={app.phone || "—"} />
        </Section>

        {/* Auto-checks */}
        <Section title="Automated Checks">
          {/* Domain check */}
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">
              {app.domain_state === "match" ? "✅" : "⚠️"}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700">Domain Check</p>
              {app.domain_state === "match" ? (
                <p className="text-xs text-emerald-700 mt-0.5">
                  Matches official university records ({app.oric_domain || "—"})
                </p>
              ) : (
                <p className="text-xs text-amber-700 mt-0.5">
                  {app.domain_state === "unknown"
                    ? "Domain not verified — LOE required"
                    : `Domain mismatch with records (expected: ${app.oric_domain || "—"}) — LOE required`}
                </p>
              )}
            </div>
          </div>

          {/* Focal person */}
          {(app.focal_person_name || app.focal_person_email) && (
            <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
              <span className="text-lg leading-none mt-0.5">👤</span>
              <div className="text-sm">
                <p className="font-medium text-slate-700 mb-1">Focal Person (Our Records)</p>
                <p className="text-gray-600">
                  {app.focal_person_name || "—"}{" "}
                  {app.focal_email_match ? (
                    <span className="text-emerald-600 text-xs">✅ email match</span>
                  ) : (
                    <span className="text-amber-600 text-xs">⚠ email mismatch</span>
                  )}
                </p>
                <p className="text-gray-500 text-xs">
                  {app.focal_person_email || "—"}{" "}
                  {app.focal_name_match ? (
                    <span className="text-emerald-600">✅ name match</span>
                  ) : (
                    <span className="text-amber-600">⚠ name mismatch</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </Section>

        {/* University master info */}
        <Section title="University Info">
          <Row label="Type"       value={app.university_type || "—"} />
          <Row label="HEC Rank"   value={app.hec_rank ? `HEC ${app.hec_rank}` : "—"} />
          <Row label="ORIC Domain" value={app.oric_domain || "—"} />
          <Row label="Campuses"   value={app.total_campuses || "—"} />
        </Section>

        {/* Authorization Letter */}
        <Section title="Authorization Letter">
          {loeUrl ? (
            <a
              href={loeUrl}
              target="_blank"
              rel="noopener noreferrer"
              /* pass auth header via window.open isn't possible for direct anchor;
                 admin is already authenticated and the server checks the token */
              className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium underline"
            >
              <ExternalLink size={14} />
              View / Download Authorization Letter
            </a>
          ) : app.domain_state !== "match" ? (
            <p className="text-sm text-red-600 font-medium">⚠ Required but not provided</p>
          ) : (
            <p className="text-sm text-gray-400">Not provided (optional)</p>
          )}
        </Section>

        {/* Submission date */}
        <Section title="Submission">
          <Row label="Submitted" value={fmt(app.created_at)} />
          {app.reviewed_at && (
            <Row label="Reviewed"  value={fmt(app.reviewed_at)} />
          )}
        </Section>

        {/* Rejection reason — shown when rejected */}
        {status === "rejected" && app.reject_reason && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
              Rejection Reason
            </p>
            <p className="text-sm text-red-800 leading-relaxed">{app.reject_reason}</p>
          </div>
        )}

        {/* Approve disabled explainer */}
        {isPending && approveBlocked && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              ⚠ Approve is disabled: domain is not verified and no authorization letter has been provided.
            </p>
          </div>
        )}
      </div>

      {/* actions */}
      <div className="px-6 pb-6 pt-2 border-t border-gray-100">
        {isPending ? (
          <div className="flex gap-3">
            <button
              onClick={onApprove}
              disabled={actionLoading !== null || approveBlocked}
              title={approveBlocked ? "Domain mismatch — LOE required before approving" : ""}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {actionLoading === "approve" && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50 font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              {actionLoading === "reject" && (
                <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
              )}
              Reject
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2">
            <StatusBadge status={app.status} />
            <span className="text-gray-500 text-sm">
              This application has already been {status}.
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0 w-32">{label}</span>
      <span className="text-slate-800 text-right">{value}</span>
    </div>
  );
}
