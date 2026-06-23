import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listPrograms } from "../../api/university";
import {
  listCampusPrograms,
  addCampusProgram,
  deleteCampusProgram,
} from "../../api/campus";

export default function CampusProgramsTab({ campusId, universityId }) {
  const [uniPrograms, setUniPrograms] = useState([]);
  const [campusPrograms, setCampusPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ program_id: "", fee: "", duration: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [up, cp] = await Promise.all([
        listPrograms(universityId),
        listCampusPrograms(campusId),
      ]);
      setUniPrograms(Array.isArray(up) ? up : []);
      setCampusPrograms(Array.isArray(cp) ? cp : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

  }, [campusId, universityId]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    if (!form.program_id) {
      toast.error("Pick a program");
      return;
    }
    setBusy(true);
    try {
      const { ok, data } = await addCampusProgram({ campus_id: campusId, ...form });
      if (ok) {
        toast.success("Program added");
        setForm({ program_id: "", fee: "", duration: "" });
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
    const { ok } = await deleteCampusProgram(id);
    if (ok) {
      setCampusPrograms((p) => p.filter((x) => x.id !== id));
      toast.success("Removed");
    } else {
      toast.error("Delete failed");
    }
  };

  const addedIds = new Set(campusPrograms.map((c) => c.program_id));
  const available = uniPrograms.filter((p) => !addedIds.has(p.id));

  return (
    <div className="space-y-6 max-w-4xl">
      <form onSubmit={add} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Programs at this Campus</h2>
        <p className="text-sm text-gray-500 mb-4">
          Pick from your university's programs and set this campus's fee.
        </p>

        {uniPrograms.length === 0 ? (
          <p className="text-sm text-amber-600">
            Your university has no programs yet. The university admin needs to add programs first.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Program</label>
              <select
                name="program_id"
                value={form.program_id}
                onChange={change}
                className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm bg-white"
              >
                <option value="">— Select —</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.level ? `(${p.level})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Fee at this campus" name="fee" value={form.fee} onChange={change} placeholder="PKR 250,000" />
            <Input label="Duration" name="duration" value={form.duration} onChange={change} placeholder="4 years" />
          </div>
        )}

        {uniPrograms.length > 0 && (
          <button
            type="submit"
            disabled={busy}
            className="mt-5 bg-[#c88410] hover:bg-[#a66d0d] text-white px-8 py-3 rounded-xl font-medium disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add Program"}
          </button>
        )}
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : campusPrograms.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No programs added to this campus yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Level</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {campusPrograms.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-5 py-3 text-gray-600">{p.level || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{p.fee || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{p.duration || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">
                      Remove
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
      <input {...props} className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm" />
    </div>
  );
}
