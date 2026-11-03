import { useCallback, useEffect, useState } from "react";
import { API, authHeaders } from "../../api/client";

export default function HostelApprovalQueue() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/hostels/review-queue`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load hostel requests.");
      setHostels(data.hostels || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (hostel, decision) => {
    const reason = decision === "rejected"
      ? window.prompt("Enter a rejection reason (minimum 10 characters):") || ""
      : "";
    if (decision === "rejected" && reason.trim().length < 10) return;

    setBusyId(hostel.id);
    try {
      const response = await fetch(`${API}/api/hostels/${hostel.id}/review`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update hostel review.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId("");
    }
  };

  const download = async (hostel, documentItem) => {
    try {
      const response = await fetch(`${API}/api/hostels/${hostel.id}/review-documents/${documentItem.id}`, { headers: authHeaders() });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Could not download document.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = documentItem.original_name || "hostel-document";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Independent Hostel Approvals</h1>
        <p className="mt-1 text-sm text-slate-500">Review independent hostel registrations. Approval unlocks the owner's dashboard.</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading requests…</p> : hostels.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-slate-500">No independent hostel requests are waiting for review.</p>
      ) : hostels.map((hostel) => (
        <article key={hostel.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{hostel.name}</h2>
              <p className="text-sm text-slate-500">{hostel.owner_name} · {hostel.owner_email}</p>
              <p className="mt-1 text-sm text-slate-500">{hostel.address} · {hostel.gender || ""} · {hostel.contact_phone || ""}</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pending super admin review</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(hostel.documents || []).map((document) => (
              <button key={document.id} onClick={() => download(hostel, document)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                {document.original_name || document.document_type}
              </button>
            ))}
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <button disabled={busyId === hostel.id} onClick={() => review(hostel, "approved")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve & unlock dashboard</button>
            <button disabled={busyId === hostel.id} onClick={() => review(hostel, "rejected")} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50">Reject</button>
          </div>
        </article>
      ))}
    </div>
  );
}
