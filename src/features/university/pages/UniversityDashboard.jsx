import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../../../assets/Logo.png";
import { getMyVerification } from "../../auth/api/verification";
import { setFlash } from "../../../shared/utils/flash";
import UniversityAdminDashboard from "../../universityAdmin/pages/UniversityAdminDashboard.jsx";
import UniversityVerificationForm from "../../universityAdmin/components/UniversityVerificationForm";
import VerificationPendingScreen from "../../universityAdmin/components/VerificationPendingScreen";
import VerificationRejectedScreen from "../../universityAdmin/components/VerificationRejectedScreen";

export default function UniversityDashboard() {
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const uid = sessionStorage.getItem("userId");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const loadVerification = useCallback(
    async (opts = {}) => {
      const { silent = false } = opts;
      if (!uid) return;
      setChecking(true);
      try {
        const data = await getMyVerification(uid);
        setVerification((prev) => {

          if (prev?.status === "pending" && data?.status === "approved") {
            toast.success("🎉 Your university has been approved! Welcome to your dashboard.");
          }
          return data;
        });
      } catch {
        if (!silent) toast.error("Could not load your verification status.");
      } finally {
        setChecking(false);
        setLoading(false);
      }
    },
    [uid],
  );

  useEffect(() => {
    if (!uid) {
      navigate("/login");
      return;
    }
    loadVerification();
  }, [uid, navigate, loadVerification]);

  const status = verification?.status;

  useEffect(() => {
    if (status !== "pending") return;
    const id = setInterval(() => loadVerification({ silent: true }), 8000);
    return () => clearInterval(id);
  }, [status, loadVerification]);

  const handleLogout = () => {
    const name = (user.name || "").split(" ")[0];
    sessionStorage.clear();
    setFlash(
      name
        ? `👋 Thanks ${name}, see you soon!`
        : "👋 Thanks for visiting — see you soon!",
    );
    navigate("/login");
  };

  if (status === "approved") {
    return (
      <UniversityAdminDashboard
        onLogout={handleLogout}
        universityName={
          verification.university_name ||
          user.university_name ||
          user.name ||
          "My University"
        }
        adminName={
          verification.full_name ||
          user.name ||
          "Admin"
        }
        adminEmail={
          verification.official_email ||
          user.email ||
          ""
        }
      />
    );
  }

  if (loading) return <SplashScreen />;

  if (!verification || resubmitting) {
    return (
      <PreApprovalShell onLogout={handleLogout}>
        <UniversityVerificationForm
          uid={uid}
          defaultName={user.name || ""}
          defaultEmail={user.email || ""}
          existing={verification || null}
          onSubmitted={() => {
            setResubmitting(false);

            loadVerification({ silent: true });
          }}
          onCancel={verification ? () => setResubmitting(false) : undefined}
        />
      </PreApprovalShell>
    );
  }

  if (status === "pending") {
    return (
      <PreApprovalShell onLogout={handleLogout}>
        <VerificationPendingScreen
          verification={verification}
          checking={checking}
          onRefresh={() => loadVerification()}
        />
      </PreApprovalShell>
    );
  }

  if (status === "rejected") {
    return (
      <PreApprovalShell onLogout={handleLogout}>
        <VerificationRejectedScreen
          verification={verification}
          onResubmit={() => setResubmitting(true)}
        />
      </PreApprovalShell>
    );
  }

  return (
    <PreApprovalShell onLogout={handleLogout}>
      <VerificationPendingScreen
        verification={verification}
        checking={checking}
        onRefresh={() => loadVerification()}
      />
    </PreApprovalShell>
  );
}

function PreApprovalShell({ onLogout, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            <img src={logo} alt="Uni Finder logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-gray-800 text-xl leading-none">
            Uni<span className="text-orange-500">Finder</span>
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1 font-medium">
            University Panel
          </span>
        </div>
        <button
          onClick={onLogout}
          className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
        >
          Logout
        </button>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">{children}</main>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mx-auto" />
        <p className="text-gray-400 mt-4 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );
}
