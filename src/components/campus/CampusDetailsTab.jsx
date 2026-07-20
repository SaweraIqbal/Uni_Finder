import { useState } from "react";
import { toast } from "react-toastify";
import { saveCampus } from "../../api/campus";

export default function CampusDetailsTab({ ownerUid, initial, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    city: initial?.city || "",
    address: initial?.address || "",
    history: initial?.history || "",
    duration: initial?.duration || "",
    fee: initial?.fee || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
  });
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Campus name is required");
      return;
    }
    setBusy(true);
    try {
      const { ok, data } = await saveCampus({ campus_admin_uid: ownerUid, ...form });
      if (ok) {
        toast.success(data.message || "Saved");
        onSaved?.();
      } else {
        toast.error(data.message || "Save failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-3xl space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Campus Details</h2>
      <p className="text-sm text-gray-500">These details appear under your university's page.</p>

      <Input label="Campus Name *" name="name" value={form.name} onChange={change} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="City" name="city" value={form.city} onChange={change} />
        <Input label="Duration / Established" name="duration" value={form.duration} onChange={change} placeholder="e.g. since 2005" />
        <Input label="Fee" name="fee" value={form.fee} onChange={change} placeholder="PKR 200,000 / year" />
        <Input label="Phone" name="phone" value={form.phone} onChange={change} />
        <Input label="Email" name="email" value={form.email} onChange={change} />
        <Input label="Address" name="address" value={form.address} onChange={change} />
      </div>
      <Textarea label="History / About this campus" name="history" value={form.history} onChange={change} rows={4} />

      <button
        type="submit"
        disabled={busy}
        className="bg-[#c88410] hover:bg-[#a66d0d] text-white px-8 py-3 rounded-xl font-medium disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save Campus"}
      </button>
    </form>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <input {...props} className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm" />
    </div>
  );
}
function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <textarea {...props} className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm" />
    </div>
  );
}
