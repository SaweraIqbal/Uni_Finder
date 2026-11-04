import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API, authHeaders } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLES = {
  pending: { ring: "border-amber-200 bg-amber-50", dot: "text-amber-500", chip: "bg-amber-100 text-amber-700" },
  rejected: { ring: "border-red-200 bg-red-50", dot: "text-red-500", chip: "bg-red-100 text-red-700" },
  approved: { ring: "border-emerald-200 bg-emerald-50", dot: "text-emerald-600", chip: "bg-emerald-100 text-emerald-700" },
};

export default function HostelRegistrationStatusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const hostelId = location.state?.hostelId;
  const [hostel, setHostel] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const redirected = useRef(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/hostels/mine`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load registration status.");
      const registrations = Array.isArray(data.hostels) ? data.hostels : [];
      const current = registrations.find((item) => item.id === hostelId) || registrations[0];
      setHostel(current || null);
      setError(current ? "" : "No hostel registration was found for this account.");

      if (current?.status === "approved" && !redirected.current) {
        redirected.current = true;
        setTimeout(() => {
          logout();
          sessionStorage.removeItem("token");
          navigate("/login", {
            replace: true,
            state: { message: "Hostel approved. Please log in again to open your dashboard." },
          });
        }, 2500);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [hostelId, logout, navigate]);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  const resubmit = async () => {
    if (!hostel) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/hostels/${hostel.id}/resubmit`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not resubmit your hostel.");
      redirected.current = false;
      await loadStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const status = hostel?.status === "approved"
    ? "approved"
    : hostel?.status === "rejected"
      ? "rejected"
      : "pending";
  const theme = STATUS_STYLES[status];
  const isCampusHostel = hostel?.hostel_type === "university";
  const campusName = hostel?.campus_name || "your selected campus";

  const title = status === "approved"
    ? "Verification approved"
    : status === "rejected"
      ? "Registration rejected"
      : "Verification pending";

  const message = status === "rejected"
    ? "Your hostel registration was rejected. Read the reason below, fix the details or documents, and submit again."
    : status === "approved"
      ? isCampusHostel
        ? "Your campus hostel is approved. Redirecting you to login; sign in again to open your dashboard."
        : "Your hostel is approved. Redirecting you to login; sign in again to open your dashboard."
      : isCampusHostel
        ? `Your campus hostel request is with the campus admin of ${campusName}. You will get your dashboard as soon as it is approved.`
        : "Your independent hostel request is with the UniFinder super admin. You will get your dashboard as soon as it is approved.";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className={`mx-auto max-w-xl rounded-2xl border ${theme.ring} p-8 text-center shadow-sm`}>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${theme.chip}`}>
          {status === "pending" ? "Pending review" : status === "rejected" ? "Rejected" : "Approved"}
        </span>
        <h1 className={`mt-4 text-2xl font-bold ${theme.dot}`}>{title}</h1>
        {hostel && <p className="mt-2 text-sm font-medium text-slate-700">{hostel.name}</p>}
        {hostel && (
          <p className="mt-1 text-xs text-slate-500">
            {isCampusHostel ? `Campus hostel · ${campusName}` : "Independent hostel · Super admin review"}
          </p>
        )}
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>

        {status === "rejected" && (
          <div className="mt-5 rounded-xl border border-red-200 bg-white p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Reason given by reviewer</p>
            <p className="mt-2 text-sm text-slate-700">
              {hostel?.review_reason || "No reason was recorded. Update your details and documents, then submit again."}
            </p>
          </div>
        )}

        {status === "pending" && (
          <p className="mt-5 text-xs text-slate-500">
            You can still complete your hostel profile, rooms and photos. This page refreshes automatically after the review.
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {status !== "approved" && (
            <button
              onClick={() => navigate("/hostel/dashboard", { replace: true })}
              className="rounded-xl bg-[#ff6a00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e65f00]"
            >
              Complete hostel details
            </button>
          )}
          {status === "rejected" && (
            <button
              onClick={resubmit}
              disabled={busy}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {busy ? "Submitting..." : "Resubmit for review"}
            </button>
          )}
          <button
            onClick={() => { logout(); sessionStorage.removeItem("token"); navigate("/login", { replace: true }); }}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
