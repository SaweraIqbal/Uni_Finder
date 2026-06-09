import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAccount, updateAccount } from "../../api/university";

// Lets the uni admin manage their own login account (name, username, email,
// and optionally a new password).
export default function ProfileTab({ uid }) {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAccount(uid);
        if (data) setForm((f) => ({ ...f, name: data.name || "", username: data.username || "", email: data.email || "" }));
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { user_uid: uid, name: form.name, username: form.username, email: form.email };
      if (form.password.trim()) payload.password = form.password.trim();

      const { ok, data } = await updateAccount(payload);
      if (ok) {
        toast.success(data.message || "Profile updated");
        // keep local storage user in sync so the navbar/greeting updates
        const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
        sessionStorage.setItem(
          "user",
          JSON.stringify({ ...stored, name: form.name, username: form.username, email: form.email })
        );
        setForm((f) => ({ ...f, password: "" }));
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return <div className="text-gray-400">Loading…</div>;

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
      <h2 className="text-lg font-bold text-gray-800 mb-1">My Profile</h2>
      <p className="text-sm text-gray-500 mb-6">Manage your admin account details.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full Name" name="name" value={form.name} onChange={change} />
        <Field label="Username" name="username" value={form.username} onChange={change} />
        <div className="md:col-span-2">
          <Field label="Email" name="email" type="email" value={form.email} onChange={change} />
        </div>
        <div className="md:col-span-2">
          <Field
            label="New Password (leave blank to keep current)"
            name="password"
            type="password"
            value={form.password}
            onChange={change}
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-6 bg-[#c88410] hover:bg-[#a66d0d] text-white px-8 py-3 rounded-xl font-medium disabled:opacity-60"
      >
        {busy ? "Saving…" : "Update Profile"}
      </button>
    </form>
  );
}

function Field({ label, ...props }) {
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
