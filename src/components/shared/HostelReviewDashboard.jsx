import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, Search, XCircle } from "lucide-react";
import { API, authHeaders } from "../../api/client";

const STATUS_LABELS = {
  pending_admin: "Pending",
  pending_campus: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
  : "-";

export default function HostelReviewDashboard({ reviewer, campus, onQueueChange }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/hostels/review-queue`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load hostel registrations.");
      const list = Array.isArray(data.hostels) ? data.hostels : [];
      setHostels(list);
      onQueueChange?.(list.filter((hostel) => hostel.status.startsWith("pending_")).length);
      setSelected((current) => current ? list.find((hostel) => hostel.id === current.id) || null : null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [onQueueChange]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    pending: hostels.filter((hostel) => hostel.status.startsWith("pending_")).length,
    approved: hostels.filter((hostel) => hostel.status === "approved").length,
    rejected: hostels.filter((hostel) => hostel.status === "rejected").length,
    total: hostels.length,
  }), [hostels]);

  const filtered = useMemo(() => hostels.filter((hostel) => {
    const status = STATUS_LABELS[hostel.status] || hostel.status;
    const matchesTab = filter === "All" || status === filter;
    const text = `${hostel.name} ${hostel.owner_name} ${hostel.owner_email} ${hostel.campus_name || ""} ${hostel.campus_id || ""}`.toLowerCase();
    return matchesTab && text.includes(query.toLowerCase());
  }), [filter, hostels, query]);

  const review = async (decision, reason = "", hostel = selected) => {
    if (!hostel) return;
    if (decision === "rejected" && reason.trim().length < 10) {
      setError("Rejection reason must be at least 10 characters.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/hostels/${hostel.id}/review`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update the hostel review.");
      setSelected(null);
      setRejecting(false);
      setRejectReason("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const download = async (hostel, documentItem) => {
    try {
      const response = await fetch(`${API}/api/hostels/${hostel.id}/review-documents/${documentItem.id}`, { headers: authHeaders() });
      if (!response.ok) throw new Error("Could not download verification document.");
      const url = URL.createObjectURL(await response.blob());
      const link = window.document.createElement("a");
      link.href = url;
      link.download = documentItem.original_name || "hostel-document";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  };

  const tabs = [
    { label: "All", count: counts.total },
    { label: "Pending", count: counts.pending },
    { label: "Approved", count: counts.approved },
    { label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Hostels</h1>
        <p className="mt-1 text-slate-500">
          {reviewer === "campus"
            ? `Review hostel registration requests for ${campus?.name || "your campus"}.`
            : "Review independent hostel registrations and their verification documents."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending Approval", value: counts.pending, color: "text-orange-500", Icon: Clock3 },
          { label: "Approved", value: counts.approved, color: "text-emerald-600", Icon: CheckCircle2 },
          { label: "Total Hostels", value: counts.total, color: "text-slate-800", Icon: XCircle },
        ].map(({ label, value, color, Icon }) => (
          <article key={label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon size={18} className={color} />
            </div>
            <p className={`mt-3 text-4xl font-bold ${color}`}>{value}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hostel, owner, campus..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-orange-400" />
        </label>
        <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </section>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.label} onClick={() => setFilter(tab.label)} className={`rounded-full border px-4 py-2 text-sm font-medium ${filter === tab.label ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"}`}>
            {tab.label} <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${filter === tab.label ? "bg-white/20" : "bg-slate-100"}`}>{tab.count}</span>
          </button>
        ))}
      </nav>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <section className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full min-w-[800px]">
          <thead><tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-5 py-4">Hostel / Owner</th>
            <th className="px-5 py-4">Campus</th>
            <th className="px-5 py-4">Type</th>
            <th className="px-5 py-4">Submitted</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Action</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">Loading hostel registrations...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">No hostel registrations found.</td></tr>
                : filtered.map((hostel) => {
                  const status = STATUS_LABELS[hostel.status] || hostel.status;
                  const statusClass = status === "Approved" ? "bg-emerald-50 text-emerald-700" : status === "Rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
                  return <tr key={hostel.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-800">{hostel.name}</p><p className="mt-0.5 text-xs text-slate-500">{hostel.owner_name} | {hostel.owner_email}</p></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{hostel.campus_name || "Independent hostel"}{hostel.campus_id && <p className="mt-0.5 font-mono text-xs text-slate-400">ID: {hostel.campus_id}</p>}</td>
                    <td className="px-5 py-4 text-sm capitalize text-slate-600">{hostel.hostel_type === "university" ? "Campus" : "Private"} | {hostel.gender || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(hostel.created_at)}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{status}</span></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2">
                      <button onClick={() => setSelected(hostel)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Review</button>
                      {hostel.status.startsWith("pending_") && <>
                        <button disabled={busy} onClick={() => review("approved", "", hostel)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve</button>
                        <button disabled={busy} onClick={() => { setSelected(hostel); setRejecting(true); setRejectReason(""); }} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50">Reject</button>
                      </>}
                    </div></td>
                  </tr>;
                })}
          </tbody>
        </table>
      </section>

      {selected && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setSelected(null); }}>
        <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-slate-100 p-5">
            <div><h2 className="text-xl font-bold text-slate-800">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.owner_name} | {selected.owner_email}</p></div>
            <button onClick={() => setSelected(null)} disabled={busy} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
          </header>
          <div className="space-y-4 p-5 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <p><span className="text-slate-400">Status:</span> <strong>{STATUS_LABELS[selected.status] || selected.status}</strong></p>
              <p><span className="text-slate-400">Campus:</span> <strong>{selected.campus_name || "Independent hostel"}</strong></p>
              {selected.campus_id && <p className="sm:col-span-2"><span className="text-slate-400">Campus ID:</span> <strong className="font-mono">{selected.campus_id}</strong></p>}
              <p><span className="text-slate-400">Accommodation:</span> <strong>{selected.gender || "-"}</strong></p>
              <p><span className="text-slate-400">Contact:</span> <strong>{selected.contact_phone || "-"}</strong></p>
              <p className="sm:col-span-2"><span className="text-slate-400">Address:</span> <strong>{selected.address || "-"}</strong></p>
            </div>
            {selected.review_reason && <p className="rounded-xl bg-red-50 p-3 text-red-700"><strong>Rejection reason:</strong> {selected.review_reason}</p>}
            <div><h3 className="mb-2 font-semibold text-slate-700">Verification documents</h3><div className="flex flex-wrap gap-2">
              {(selected.documents || []).map((documentItem) => <button key={documentItem.id} onClick={() => download(selected, documentItem)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">{documentItem.original_name || documentItem.document_type}</button>)}
              {(selected.documents || []).length === 0 && <span className="text-slate-400">No documents found.</span>}
            </div></div>
          </div>
          <footer className="flex justify-end gap-2 border-t border-slate-100 p-5">
            {selected.status.startsWith("pending_") ? <>
              <button disabled={busy} onClick={() => { setRejecting(true); setRejectReason(""); }} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50">Reject</button>
              <button disabled={busy} onClick={() => review("approved")} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Approve</button>
            </> : <button onClick={() => setSelected(null)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">Close</button>}
          </footer>
        </section>
      </div>}

      {rejecting && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
        <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-800">Reject hostel registration</h2>
          <p className="mt-1 text-sm text-slate-500">Enter a reason. The hostel owner will see it on the verification status page.</p>
          <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} maxLength={2000} placeholder="Write the rejection reason..." className="mt-4 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-400" />
          <p className="mt-1 text-xs text-slate-400">Minimum 10 characters.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button disabled={busy} onClick={() => setRejecting(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
            <button disabled={busy || rejectReason.trim().length < 10} onClick={() => review("rejected", rejectReason)} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Submit rejection</button>
          </div>
        </section>
      </div>}
    </div>
  );
}
