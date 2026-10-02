import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/Logo.png";
import {
  getMyCampusRequest,
  submitCampusRequest,
  listUniversitiesForPicker,
} from "../api/campus";
import CampusPanel from "../components/campus/CampusPanel";
import { setFlash } from "../utils/flash";

export default function CampusDashboard() {
  const navigate = useNavigate();
  const uid = sessionStorage.getItem("userId");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRequest(await getMyCampusRequest(uid));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!uid) {
      navigate("/login");
      return;
    }
    load();

  }, []);

  const handleLogout = () => {
    const name = (JSON.parse(sessionStorage.getItem("user") || "{}").name || "").split(" ")[0];
    sessionStorage.clear();
    setFlash(name ? `👋 Thanks ${name}, see you soon!` : "👋 Thanks for visiting — see you soon!");
    navigate("/login");
  };

  const status = request?.status;

  if (status === "approved") {
    return <CampusPanel ownerUid={uid} adminEmail={user.email} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8" />
          <span className="text-lg font-semibold">
            Uni <span className="text-[#c88410]">Finder</span>
            <span className="text-gray-400 font-normal text-sm ml-2">Campus Panel</span>
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
        {user.assigned_id && (
          <span className="inline-block bg-[#c88410]/10 border border-[#c88410]/20 text-[#c88410] font-semibold text-sm px-3 py-1 rounded-lg mb-2">
            Your ID: {user.assigned_id}
          </span>
        )}
        <p className="text-gray-500 mb-8">Campus registration status</p>

        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
            Loading…
          </div>
        ) : !request ? (
          <RequestForm uid={uid} onSubmitted={load} />
        ) : status === "pending" ? (
          <StatusCard
            tone="amber"
            icon="⏳"
            title="Request Pending"
            text={`Your request for campus "${request.campus_name}" at ${request.university_name || "the university"} is awaiting the university admin's approval. You'll get an email once decided.`}
          />
        ) : status === "rejected" ? (
          <div>
            <StatusCard
              tone="red"
              icon="❌"
              title="Request Rejected"
              text={`Your campus request "${request.campus_name}" was not approved.`}
            />
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mt-4">
              <p className="text-sm text-red-500 font-medium mb-1">Reason</p>
              <p className="text-red-700">{request.reject_reason}</p>
            </div>
            <div className="mt-5">
              <RequestForm uid={uid} onSubmitted={load} resubmit />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function RequestForm({ uid, onSubmitted, resubmit }) {
  const [unis, setUnis] = useState([]);
  const [form, setForm] = useState({
    university_id: "",
    campus_name: "",
    city: "",
    address: "",
    contact_no: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listUniversitiesForPicker().then((d) => setUnis(Array.isArray(d) ? d : []));
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.university_id || !form.campus_name.trim()) {
      toast.error("Please pick a university and enter a campus name");
      return;
    }
    setBusy(true);
    try {
      const { ok, data } = await submitCampusRequest({ campus_admin_uid: uid, ...form });
      if (ok) {
        toast.success(data.message || "Request submitted");
        onSubmitted();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h2 className="text-lg font-bold text-gray-800">
        {resubmit ? "Re-submit Campus Request" : "Register a Campus"}
      </h2>
      <p className="text-sm text-gray-500">
        Choose the university and your campus details. The request goes to that
        university's admin for approval.
      </p>

      <div>
        <label className="text-sm text-gray-600 mb-1 block">University *</label>
        <select
          name="university_id"
          value={form.university_id}
          onChange={change}
          className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm bg-white"
        >
          <option value="">— Select a university —</option>
          {unis.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} {u.city ? `(${u.city})` : ""}
            </option>
          ))}
        </select>
      </div>

      <Input label="Campus Name *" name="campus_name" value={form.campus_name} onChange={change} placeholder="e.g. Lahore Campus" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="City" name="city" value={form.city} onChange={change} />
        <Input label="Contact Number" name="contact_no" value={form.contact_no} onChange={change} />
      </div>
      <Input label="Address" name="address" value={form.address} onChange={change} />

      <button
        type="submit"
        disabled={busy}
        className="bg-[#c88410] hover:bg-[#a66d0d] text-white px-8 py-3 rounded-xl font-medium disabled:opacity-60"
      >
        {busy ? "Submitting…" : resubmit ? "Re-submit Request" : "Submit Request"}
      </button>
    </form>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <input
        {...props}
        className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm"
      />
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
