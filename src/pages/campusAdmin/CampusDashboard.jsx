/**
 * CampusDashboard.jsx  —  /campus/dashboard
 *
 * Gate logic:
 *  - No userId in session            → redirect to /login
 *  - Loading API                     → spinner
 *  - status === "approved"           → full CampusAdminDashboard (10-page shell)
 *  - any other status (or no request) → redirect to /campus/register
 *    so the new registration flow handles pending / rejected / resubmission.
 *
 * TODO: When backend is live, remove the Navigate fallback and let the API
 *       response drive the redirect in this component.
 */
import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { getMyCampusRequest } from "../../api/campus";
import { API, authHeaders } from "../../api/client";
import { CampusAdminProvider } from "../../components/campusAdmin/CampusAdminContext";
import CampusAdminDashboard from "../../components/campusAdmin/CampusAdminDashboard";
import { setFlash } from "../../utils/flash";
export default function CampusDashboard() {
  const navigate = useNavigate();
  const uid  = sessionStorage.getItem("userId");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [request, setRequest] = useState(undefined); // undefined = not fetched yet
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    const name = (JSON.parse(sessionStorage.getItem("user") || "{}").name || "").split(" ")[0];
    sessionStorage.clear();
    setFlash(name ? `👋 Thanks ${name}, see you soon!` : "👋 Thanks for visiting — see you soon!");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!uid) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);

    fetch(`${API}/api/campus-registrations/mine`, { headers: authHeaders() })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (json?.data) return json.data;
        }
        return getMyCampusRequest(uid);
      })
      .then((data) => setRequest(data ?? null))
      .catch(() =>
        getMyCampusRequest(uid)
          .then((data) => setRequest(data ?? null))
          .catch(() => setRequest(null))
      )
      .finally(() => setLoading(false));
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Still fetching ────────────────────────────────────────────────────────
  if (loading || request === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm text-slate-400">Loading your campus…</p>
        </div>
      </div>
    );
  }

  // ── Approved → full 10-page Campus Admin Dashboard ───────────────────────
  if (request?.status === "approved") {
    return (
      <CampusAdminProvider
        ownerUid={uid}
        adminName={user.name || user.email || "Campus Admin"}
        adminEmail={user.email || ""}
        onLogout={handleLogout}
      >
        <CampusAdminDashboard />
      </CampusAdminProvider>
    );
  }

  // ── Any other status (no request / pending / rejected / resubmission) ─────
  return <Navigate to={request ? "/campus/registration-status" : "/campus/register"} replace />;
}
