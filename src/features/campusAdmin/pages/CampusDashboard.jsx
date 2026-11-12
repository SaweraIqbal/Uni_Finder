import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getMyCampusRequest } from "../../campus/api/campus";
import { API, authHeaders } from "../../../shared/api/client";
import { CampusAdminProvider } from "../components/CampusAdminContext";
import CampusAdminDashboard from "../components/CampusAdminDashboard";
import { setFlash } from "../../../shared/utils/flash";
export default function CampusDashboard() {
  const navigate = useNavigate();
  const uid  = sessionStorage.getItem("userId");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [request, setRequest] = useState(undefined);
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

  if (loading || request === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm text-slate-400">Loading your campus…</p>
        </div>
      </div>
    );
  }

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

  return <Navigate to={request ? "/campus/registration-status" : "/campus/register"} replace />;
}
