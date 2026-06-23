import { useState } from "react";
import { toast } from "react-toastify";
import { searchAccount } from "../../api/verification";
import StatusBadge from "../StatusBadge";

export default function AccountSearch() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const run = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setNotFound(false);
    setResult(null);
    try {
      const { ok, status, data } = await searchAccount(q.trim());
      if (ok) setResult(data);
      else if (status === 404) setNotFound(true);
      else toast.error(data.message || "Search failed");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Search Account by ID</h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter an assigned ID (e.g. UNI-D2C3D8 / CMP-51712E) or an email to pull up all their data.
      </p>

      <form onSubmit={run} className="flex gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="UNI-XXXXXX, CMP-XXXXXX or email"
          className="flex-1 border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-[#c88410] hover:bg-[#a66d0d] text-white px-6 rounded-xl font-medium disabled:opacity-60"
        >
          {busy ? "Searching…" : "Search"}
        </button>
      </form>

      {notFound && (
        <p className="mt-4 text-sm text-red-500">No account found for “{q}”.</p>
      )}

      {result && (
        <div className="mt-5 space-y-4">

          <Card title="Account">
            <Row label="Name" value={result.user.name} />
            <Row label="Email" value={result.user.email} />
            <Row label="Username" value={result.user.username} />
            <Row label="Role" value={result.user.role} />
            <Row label="Assigned ID" value={result.user.assigned_id} highlight />
          </Card>

          {result.user.role === "university" && (
            <>
              {result.verification && (
                <Card title="Verification">
                  <Row label="University" value={result.verification.university_name} />
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-gray-400 text-sm w-32">Status</span>
                    <StatusBadge status={result.verification.status} />
                  </div>
                  {result.verification.reject_reason && (
                    <Row label="Reject reason" value={result.verification.reject_reason} />
                  )}
                </Card>
              )}
              {result.university && (
                <Card title="University Details">
                  <Row label="Name" value={result.university.name} />
                  <Row label="City" value={result.university.city} />
                  <Row label="Website" value={result.university.website} />
                  <Row label="Phone" value={result.university.phone} />
                </Card>
              )}
            </>
          )}

          {result.user.role === "campus" && (
            <>
              {result.campusVerification && (
                <Card title="Campus Request">
                  <Row label="Campus" value={result.campusVerification.campus_name} />
                  <Row label="University" value={result.campusVerification.university_name} />
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-gray-400 text-sm w-32">Status</span>
                    <StatusBadge status={result.campusVerification.status} />
                  </div>
                  {result.campusVerification.reject_reason && (
                    <Row label="Reject reason" value={result.campusVerification.reject_reason} />
                  )}
                </Card>
              )}
              {result.campus && (
                <Card title="Campus Details">
                  <Row label="Name" value={result.campus.name} />
                  <Row label="City" value={result.campus.city} />
                  <Row label="Fee" value={result.campus.fee} />
                  <Row label="Duration" value={result.campus.duration} />
                </Card>
              )}
            </>
          )}

          {result.profile && (
            <Card title="Profile">
              <Row label="CNIC" value={result.profile.cnic} />
              <Row label="Gender" value={result.profile.gender} />
              <Row label="Address" value={result.profile.address} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#c88410] mb-2">{title}</p>
      {children}
    </div>
  );
}
function Row({ label, value, highlight }) {
  return (
    <div className="flex items-start gap-2 py-1 text-sm">
      <span className="text-gray-400 w-32 flex-shrink-0">{label}</span>
      <span className={highlight ? "font-bold text-[#c88410]" : "text-gray-800"}>
        {value || "—"}
      </span>
    </div>
  );
}
