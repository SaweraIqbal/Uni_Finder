import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import logo from "../assets/Logo.png";
import { getMyVerification } from "../api/verification";
import UniversityPanel from "../components/university/UniversityPanel";

// University admin landing. While verification is pending/rejected/not-submitted
// this is a status screen. Once approved, the full management dashboard
// (details, images, programs, users) takes over.
export default function UniversityDashboard() {
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  const uid = sessionStorage.getItem("userId");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!uid) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const data = await getMyVerification(uid);
        setVerification(data);
      } catch {
        toast.error("Could not load your verification status.");
      } finally {
        setLoading(false);
      }
    })();
  }, [uid, navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const status = verification?.status;

  // Approved -> full management dashboard takes over the whole screen.
  if (status === "approved") {
    return <UniversityPanel ownerUid={uid} adminEmail={user.email} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Poppins',sans-serif]">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8" />
          <span className="text-lg font-semibold">
            Uni <span className="text-[#c88410]">Finder</span>
            <span className="text-gray-400 font-normal text-sm ml-2">
              University Panel
            </span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          Logout
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Welcome{user.email ? `, ${user.email}` : ""}
        </h1>
        <p className="text-gray-500 mb-8">University verification status</p>

        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
            Loading…
          </div>
        ) : !verification ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-600 mb-4">
              You haven't submitted your verification documents yet.
            </p>
            <button
              onClick={() => navigate("/university/documents")}
              className="bg-[#c88410] hover:bg-[#a66d0d] text-white px-6 py-3 rounded-xl font-medium"
            >
              Submit Documents
            </button>
          </div>
        ) : status === "pending" ? (
          <StatusCard
            tone="amber"
            icon="⏳"
            title="Verification Pending"
            text={`Your request for "${verification.university_name}" has been submitted and is under review by the SuperAdmin. You'll receive an email once a decision is made.`}
          />
        ) : status === "rejected" ? (
          <div>
            <StatusCard
              tone="red"
              icon="❌"
              title="Verification Rejected"
              text={`Unfortunately your request for "${verification.university_name}" was not approved.`}
            />
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mt-4">
              <p className="text-sm text-red-500 font-medium mb-1">Reason</p>
              <p className="text-red-700">{verification.reject_reason}</p>
            </div>
            <button
              onClick={() => navigate("/university/documents")}
              className="mt-5 bg-[#c88410] hover:bg-[#a66d0d] text-white px-6 py-3 rounded-xl font-medium"
            >
              Re-submit Documents
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

const TONES = {
  amber: "bg-amber-50 border-amber-100 text-amber-800",
  red: "bg-red-50 border-red-100 text-red-800",
  green: "bg-green-50 border-green-100 text-green-800",
};

function StatusCard({ tone, icon, title, text }) {
  return (
    <div className={`rounded-2xl p-6 border ${TONES[tone]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="opacity-90">{text}</p>
    </div>
  );
}
