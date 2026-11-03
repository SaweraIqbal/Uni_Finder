import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API, authHeaders } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function HostelRegistrationStatusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const hostelId = location.state?.hostelId;
  const [hostel, setHostel] = useState(null);
  const [error, setError] = useState("");
  const redirected = useRef(false);

  useEffect(() => {
    let active = true;
    let timer;

    const loadStatus = async () => {
      try {
        const response = await fetch(`${API}/api/hostels/mine`, { headers: authHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load registration status.");
        const registrations = Array.isArray(data.hostels) ? data.hostels : [];
        const current = registrations.find((item) => item.id === hostelId) || registrations[0];
        if (active) {
          setHostel(current || null);
          setError(current ? "" : "No hostel registration was found for this account.");
        }

        if (current?.status === "approved" && !redirected.current) {
          redirected.current = true;
          if (active) setHostel(current);
          timer = setTimeout(() => {
            logout();
            sessionStorage.removeItem("token");
            navigate("/login", { replace: true, state: { message: "Hostel approved. Please log in to open your dashboard." } });
          }, 2500);
        }
      } catch (e) {
        if (active) setError(e.message);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => {
      active = false;
      clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [hostelId, logout, navigate]);

  const title = hostel?.status === "approved"
    ? "Verification approved"
    : hostel?.status === "rejected"
      ? "Registration rejected"
      : "Verification pending";
  const message = hostel?.status === "pending_campus"
    ? "Your campus hostel registration is waiting for the campus admin's review."
    : hostel?.status === "pending_admin"
      ? "Your independent hostel registration is waiting for the super admin's review."
      : hostel?.status === "approved"
        ? "Your hostel is approved. Redirecting you to login; sign in again to open the dashboard."
        : hostel?.status === "rejected"
          ? `Your registration was rejected.${hostel.review_reason ? ` Reason: ${hostel.review_reason}` : ""}`
          : "Your submitted hostel registration is being checked.";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Hostel registration</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-800">{title}</h1>
        {hostel && <p className="mt-2 text-sm text-slate-500">{hostel.name}</p>}
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
        {hostel?.status !== "approved" && <p className="mt-5 text-xs text-slate-400">This page refreshes automatically. Dashboard access is only available after approval.</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {hostel?.status === "rejected" && <button onClick={() => navigate("/login", { replace: true })} className="mt-6 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Back to login</button>}
      </section>
    </main>
  );
}
