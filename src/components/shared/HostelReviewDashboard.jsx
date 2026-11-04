import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  ImageOff,
  MapPin,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { API, authHeaders } from "../../api/client";

const STATUS_LABELS = {
  pending_admin: "Pending super admin",
  pending_campus: "Pending campus admin",
  approved: "Approved",
  rejected: "Rejected",
};

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
  : "-";

const formatRent = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `Rs ${amount.toLocaleString("en-PK")}`;
};

const statusClass = (status) => status === "approved"
  ? "bg-emerald-50 text-emerald-700"
  : status === "rejected"
    ? "bg-red-50 text-red-700"
    : "bg-amber-50 text-amber-700";

const documentClass = (status) => status === "verified"
  ? "bg-emerald-50 text-emerald-700"
  : status === "rejected"
    ? "bg-red-50 text-red-700"
    : "bg-amber-50 text-amber-700";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700">{value || "-"}</p>
    </div>
  );
}

export default function HostelReviewDashboard({ reviewer, campus, onQueueChange }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
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

  useEffect(() => {
    if (!selected) return;
    const onEscape = (event) => { if (event.key === "Escape" && !busy) setSelected(null); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [busy, selected]);

  const counts = useMemo(() => ({
    pending: hostels.filter((hostel) => hostel.status.startsWith("pending_")).length,
    approved: hostels.filter((hostel) => hostel.status === "approved").length,
    rejected: hostels.filter((hostel) => hostel.status === "rejected").length,
    total: hostels.length,
  }), [hostels]);

  const filtered = useMemo(() => hostels.filter((hostel) => {
    const label = STATUS_LABELS[hostel.status] || hostel.status;
    const matchesTab = filter === "All"
      || (filter === "Pending" && label.startsWith("Pending"))
      || label === filter;
    const text = `${hostel.name} ${hostel.owner_name} ${hostel.owner_email} ${hostel.campus_name || ""}`.toLowerCase();
    return matchesTab && text.includes(query.toLowerCase());
  }), [filter, hostels, query]);

  const openDrawer = (hostel) => {
    setSelected(hostel);
    setRejectReason("");
    setError("");
  };

  const review = async (hostel, decision) => {
    if (!hostel) return;
    if (decision === "rejected" && rejectReason.trim().length < 10) {
      setError("Write a rejection reason of at least 10 characters so the owner knows what to fix.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/hostels/${hostel.id}/review`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: decision === "rejected" ? rejectReason : "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update the hostel review.");
      setSelected(null);
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
                  const label = STATUS_LABELS[hostel.status] || hostel.status;
                  return <tr key={hostel.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-800">{hostel.name}</p><p className="mt-0.5 text-xs text-slate-500">{hostel.owner_name} | {hostel.owner_email}</p></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{hostel.campus_name || "Independent hostel"}</td>
                    <td className="px-5 py-4 text-sm capitalize text-slate-600">{hostel.hostel_type === "university" ? "Campus" : "Private"} | {hostel.gender || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(hostel.created_at)}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(hostel.status)}`}>{label}</span></td>
                    <td className="px-5 py-4"><button onClick={() => openDrawer(hostel)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Review</button></td>
                  </tr>;
                })}
          </tbody>
        </table>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setSelected(null); }}>
          <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div className="min-w-0">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(selected.status)}`}>{STATUS_LABELS[selected.status] || selected.status}</span>
                <h2 className="mt-2 truncate text-xl font-bold text-slate-800">{selected.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.hostel_type === "university" ? "Campus hostel" : "Independent hostel"} · submitted {formatDate(selected.created_at)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} disabled={busy} aria-label="Close review panel" className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <section className="grid gap-4 sm:grid-cols-2">
                <Field label="Owner" value={selected.owner_name} />
                <Field label="Owner email" value={selected.owner_email} />
                <Field label="Accommodation" value={selected.gender} />
                <Field label="Contact number" value={selected.contact_phone} />
                <Field label="Campus" value={selected.campus_name || "Independent hostel"} />
                <Field label="Contact email" value={selected.contact_email} />
                <Field label="GPS" value={selected.lat != null && selected.lng != null ? `${selected.lat}, ${selected.lng}` : "Not set"} />
                <Field label="Floors" value={selected.floors} />
              </section>

              <section>
                <p className="text-xs uppercase tracking-wide text-slate-400">Address</p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="break-words">{selected.address || "-"}</span>
                </p>
              </section>

              {selected.about && (
                <section>
                  <p className="text-xs uppercase tracking-wide text-slate-400">About</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{selected.about}</p>
                </section>
              )}

              <section className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Rooms</p>
                <p className="mt-1 text-sm text-slate-700">
                  {Number(selected.room_types) || 0} room types · {Number(selected.total_rooms) || 0} rooms · {formatRent(selected.rent_min)}
                  {selected.rent_max && String(selected.rent_max) !== String(selected.rent_min) ? ` – ${formatRent(selected.rent_max)}` : ""}
                </p>
                {(Number(selected.room_types) || 0) === 0 && <p className="mt-1 text-xs text-amber-700">The owner has not added rooms yet.</p>}
              </section>

              <section>
                <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Hostel photos</p>
                {(selected.photos || []).length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selected.photos.map((photo) => (
                      <img key={photo.id} src={`${API}${photo.image_url}`} alt={photo.caption || selected.name} className="h-24 w-full rounded-lg border border-slate-100 object-cover" />
                    ))}
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-slate-400"><ImageOff size={15} /> No photos uploaded.</p>
                )}
              </section>

              <section>
                <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Verification documents</p>
                {(selected.documents || []).length ? (
                  <ul className="space-y-2">
                    {selected.documents.map((documentItem) => (
                      <li key={documentItem.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                        <span className="min-w-0 truncate text-sm text-slate-700">{documentItem.original_name || documentItem.document_type}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${documentClass(documentItem.verification_status)}`}>{documentItem.verification_status}</span>
                          <button onClick={() => download(selected, documentItem)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                            <Download size={13} /> Open
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-red-600">No verification documents uploaded. Reject with a reason so the owner can upload them.</p>}
              </section>

              {selected.review_reason && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700"><strong>Last rejection reason:</strong> {selected.review_reason}</p>
              )}

              {selected.status.startsWith("pending_") && (
                <section>
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Rejection reason (needed only for reject)</p>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Tell the owner exactly what to fix, minimum 10 characters."
                    className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-400"
                  />
                </section>
              )}
            </div>

            <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 p-5">
              <button disabled={busy} onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Close</button>
              {selected.status.startsWith("pending_") && (
                <>
                  <button disabled={busy} onClick={() => review(selected, "rejected")} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50">Reject</button>
                  <button disabled={busy} onClick={() => review(selected, "approved")} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    {busy ? "Saving..." : "Approve & unlock dashboard"}
                  </button>
                </>
              )}
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
