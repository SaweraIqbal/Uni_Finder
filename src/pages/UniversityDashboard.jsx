import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/Logo.png";
import { getMyVerification } from "../api/verification";
import { setFlash } from "../utils/flash";
import UniversityAdminDashboard from "./UniversityAdminDashboard";
import UniversityVerificationForm from "../components/universityAdmin/UniversityVerificationForm";
import VerificationPendingScreen from "../components/universityAdmin/VerificationPendingScreen";
import VerificationRejectedScreen from "../components/universityAdmin/VerificationRejectedScreen";

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
          // Toast when the admin just approved while the user was waiting
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

  // Poll every 8s while pending so the dashboard appears quickly after approval
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

  // ── Approved → show full dashboard immediately ──────────────────
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

  /* ---------- 2. First load ---------- */
  if (loading) return <SplashScreen />;

  /* ---------- 3. First-time form OR resubmission ---------- */
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
            // Silent reload — shows pending screen without a full splash
            loadVerification({ silent: true });
          }}
          onCancel={verification ? () => setResubmitting(false) : undefined}
        />
      </PreApprovalShell>
    );
  }

  /* ---------- 4. Pending ---------- */
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

  /* ---------- 5. Rejected ---------- */
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

  /* ---------- fallback: treat unknown as pending ---------- */
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

/* ---------- shared layout for all pre-approval states ---------- */
function PreApprovalShell({ onLogout, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8" />
          <span className="text-lg font-semibold">
            Uni <span className="text-orange-500">Finder</span>
            <span className="text-gray-400 font-normal text-sm ml-2">
              University Panel
            </span>
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
