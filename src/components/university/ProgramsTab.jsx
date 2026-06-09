import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listPrograms, addProgram, deleteProgram } from "../../api/university";

const EMPTY = { name: "", level: "BS", duration: "", fee: "", description: "" };

// Programs manager: add programs (name/level/duration/fee), list and delete them.
export default function ProgramsTab({ universityId }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listPrograms(universityId);
      setPrograms(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universityId]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Program name is required");
      return;
    }
    setBusy(true);
    try {
      const { ok, data } = await addProgram({ university_id: universityId, ...form });
      if (ok) {
        toast.success("Program added");
        setForm(EMPTY);
        load();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    const { ok } = await deleteProgram(id);
    if (ok) {
      toast.success("Program removed");
      setPrograms((p) => p.filter((x) => x.id !== id));
    } else {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Add form */}
      <form onSubmit={add} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Add Program</h2>
        <p className="text-sm text-gray-500 mb-4">
          Programs you add appear on your public university page.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Program Name *" name="name" value={form.name} onChange={change} placeholder="BS Computer Science" />
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Level</label>
            <select
              name="level"
              value={form.level}
              onChange={change}
              className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm bg-white"
            >
              {["BS", "MS", "MPhil", "PhD", "Diploma", "Associate"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <Input label="Duration" name="duration" value={form.duration} onChange={change} placeholder="4 years" />
          <Input label="Fee (per year/sem)" name="fee" value={form.fee} onChange={change} placeholder="PKR 250,000" />
          <div className="md:col-span-2">
            <Input label="Description" name="description" value={form.description} onChange={change} />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-5 bg-[#c88410] hover:bg-[#a66d0d] text-white px-8 py-3 rounded-xl font-medium disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add Program"}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : programs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No programs added yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Level</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-5 py-3 text-gray-600">{p.level || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{p.duration || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{p.fee || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
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
