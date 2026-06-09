import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import logo from "../assets/Logo.png";
import StatusBadge from "../components/StatusBadge";
import ReviewDrawer from "../components/admin/ReviewDrawer";
import RejectModal from "../components/admin/RejectModal";
import {
  listVerifications,
  approveVerification,
  rejectVerification,
} from "../api/verification";

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null); // request being viewed
  const [rejecting, setRejecting] = useState(null); // request being rejected
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const admin = JSON.parse(sessionStorage.getItem("user") || "{}");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { ok, status, data } = await listVerifications();
      if (status === 401 || status === 403) {
        toast.error("Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }
      setRequests(ok && Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load requests. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    requests.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [requests]);

  const visible = requests.filter((r) =>
    filter === "all" ? true : r.status === filter
  );

  const approve = async (id) => {
    setBusy(true);
    try {
      const { ok, data } = await approveVerification(id);
      if (ok) {
        toast.success("Approved. Email sent to the university admin.");
        setSelected(null);
        loadRequests();
      } else {
        toast.error(data.message || "Approve failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    setBusy(true);
    try {
      const { ok, data } = await rejectVerification(rejecting.id, reason.trim());
      if (ok) {
        toast.success("Rejected. Reason emailed to the university admin.");
        setRejecting(null);
        setReason("");
        setSelected(null);
        loadRequests();
      } else {
        toast.error(data.message || "Reject failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-['Poppins',sans-serif]">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col">
        <div className="flex items-center gap-2 px-6 py-6 border-b border-white/10">
          <img src={logo} alt="logo" className="w-8" />
          <span className="text-lg font-semibold">
            Uni <span className="text-[#c88410]">Finder</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="px-3 py-2 rounded-lg bg-[#c88410]/20 text-[#f3c277] font-medium">
            Verification Requests
          </div>
          <div className="px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 cursor-pointer">
            Universities
          </div>
          <div className="px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 cursor-pointer">
            Students
          </div>
          <div className="px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 cursor-pointer">
            Settings
          </div>
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-600 transition"
        >
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">SuperAdmin Dashboard</h1>
            <p className="text-gray-500 text-sm">
              Review and verify university registration requests
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-[#c88410] text-white flex items-center justify-center font-semibold">
              {(admin.email || "A")[0].toUpperCase()}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">SuperAdmin</p>
              <p className="text-gray-400 text-xs">{admin.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard label="Pending" value={counts.pending} accent="text-amber-500" />
          <StatCard label="Approved" value={counts.approved} accent="text-green-600" />
          <StatCard label="Rejected" value={counts.rejected} accent="text-red-500" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {["pending", "approved", "rejected", "all"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                filter === t
                  ? "bg-[#c88410] text-white shadow"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No {filter !== "all" ? filter : ""} requests found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium">University</th>
                  <th className="px-6 py-3 font-medium">Admin</th>
                  <th className="px-6 py-3 font-medium">Reg. No</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {r.university_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {r.admin_name}
                      <div className="text-xs text-gray-400">{r.admin_email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.registration_no || "—"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelected(r)}
                        className="text-[#c88410] font-medium hover:underline"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <ReviewDrawer
        request={selected}
        busy={busy}
        onClose={() => setSelected(null)}
        onApprove={approve}
        onReject={(r) => setRejecting(r)}
      />

      <RejectModal
        request={rejecting}
        reason={reason}
        setReason={setReason}
        busy={busy}
        onCancel={() => {
          setRejecting(null);
          setReason("");
        }}
        onConfirm={reject}
      />
    </div>
  );
}
