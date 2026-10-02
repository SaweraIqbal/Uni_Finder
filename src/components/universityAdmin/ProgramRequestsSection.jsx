/**
 * ProgramRequestsSection.jsx — Phase 2
 * Submit new program requests + view own request history.
 * Calls POST/GET /api/universities/me/program-requests.
 * Refetches stats/activity/pending after every submission.
 */
import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useUniversityAdmin } from "./UniversityAdminContext";
import { EmptyState, PageHeader, StatusChip } from "./ui";
import { API, authHeaders } from "../../api/client";

const LEVELS = ["Undergraduate", "MS", "MPhil", "PhD", "ADP", "Diploma"];

const LEVEL_COLORS = {
  Undergraduate: "bg-blue-50 text-blue-700",
  MS:            "bg-purple-50 text-purple-700",
  MPhil:         "bg-indigo-50 text-indigo-700",
  PhD:           "bg-rose-50 text-rose-700",
  ADP:           "bg-amber-50 text-amber-700",
  Diploma:       "bg-slate-100 text-slate-600",
};

const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const STATUS_CHIP  = { pending: "pending", approved: "verified", rejected: "rejected" };

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiSubmitRequest(payload) {
  const res = await fetch(`${API}/api/universities/me/program-requests`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function apiFetchRequests({ status = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  const res = await fetch(`${API}/api/universities/me/program-requests?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

// ── Submit form component ─────────────────────────────────────────────────────
function RequestForm({ onSubmitted, onCancel, addToast }) {
  const [form, setForm] = useState({ name: "", level: "", degree_type: "", specialization: "", track: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Program name is required.";
    if (!form.level)        e.level = "Please select a level.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const { ok, data } = await apiSubmitRequest({
        name:           form.name.trim(),
        level:          form.level,
        degree_type:    form.degree_type.trim() || undefined,
        specialization: form.specialization.trim() || undefined,
        track:          form.track.trim() || undefined,
      });
      if (!ok) {
        const msg = data?.error?.message || data?.message || "Submission failed.";
        addToast(msg, "error");
        if (data?.error?.code === "CONFLICT") setErrors({ name: msg });
      } else {
        addToast("Program request submitted. Awaiting super-admin approval.", "success");
        onSubmitted();
      }
    } catch {
      addToast("Network error — please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const INPUT = "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-800">New Program Request</h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Program Name <span className="text-red-500">*</span></label>
        <input type="text" value={form.name} onChange={set("name")} placeholder="e.g. Computer Science" className={INPUT} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      {/* Level + Degree Type row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Level <span className="text-red-500">*</span></label>
          <select value={form.level} onChange={set("level")} className={INPUT}>
            <option value="">Select level</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          {errors.level && <p className="mt-1 text-xs text-red-600">{errors.level}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Degree Type <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" value={form.degree_type} onChange={set("degree_type")} placeholder="e.g. BS, MS, MBA" className={INPUT} />
        </div>
      </div>

      {/* Specialization + Track row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Specialization <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" value={form.specialization} onChange={set("specialization")} placeholder="e.g. Data Analytics" className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Track / Shift <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" value={form.track} onChange={set("track")} placeholder="e.g. Weekend Track" className={INPUT} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center gap-2">
          {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </form>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function ProgramRequestsSection() {
  const { addToast, refetch } = useUniversityAdmin();
  const [showForm,  setShowForm]  = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [requests,  setRequests]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const LIMIT = 20;

  const loadRequests = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    setLoading(true);
    try {
      const { ok, data } = await apiFetchRequests({ status: activeTab, page, limit: LIMIT });
      if (ok) {
        setRequests(data.requests || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch { /* network error — show empty */ }
    finally { setLoading(false); }
  }, [activeTab, page]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleSubmitted = () => {
    setShowForm(false);
    setActiveTab("pending");
    setPage(1);
    loadRequests();
    refetch(); // refresh stats + pending actions + activity feed
  };

  const TABS = [
    { id: "pending",  label: "Pending"  },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto min-w-0 space-y-5">
      <PageHeader
        title="Program Requests"
        subtitle="Submit new program additions for super-admin approval."
        action={
          !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={15} />
              Request New Program
            </button>
          )
        }
      />

      {showForm && (
        <RequestForm
          onSubmitted={handleSubmitted}
          onCancel={() => setShowForm(false)}
          addToast={addToast}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setActiveTab(t.id); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          message={
            activeTab === "pending"
              ? "No pending requests. Use \u201cRequest New Program\u201d above to submit one."
              : `No ${activeTab} requests yet.`
          }
          icon="📋"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Program", "Level", "Specialization / Track", "Status", "Submitted", "Notes"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.name}</p>
                      {r.degree_type && <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 rounded">{r.degree_type}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.level ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[r.level] || "bg-slate-100 text-slate-600"}`}>
                          {r.level}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px]">
                      {r.specialization && <span className="block truncate">{r.specialization}</span>}
                      {r.track && <span className="text-[10px] italic text-slate-400">{r.track}</span>}
                      {!r.specialization && !r.track && "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusChip status={STATUS_CHIP[r.status] || "pending"} label={STATUS_LABEL[r.status] || r.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmt(r.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-red-600 max-w-[200px]">
                      {r.rejection_reason ? (
                        <span title={r.rejection_reason} className="line-clamp-2 cursor-help">{r.rejection_reason}</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Page {page} of {pages} · {total} total</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors">
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors">
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
