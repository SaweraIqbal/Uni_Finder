/**
 * Page 5 — Program Requests
 * Real API: listCampusProgramRequests (on mount), submitCampusProgramRequest (on submit)
 */
import { useCallback, useEffect, useState } from "react";
import { Plus, X, Info, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { Card, PrimaryBtn, SecondaryBtn, StatusPill, SectionTitle, FormInput, FormSelect, FormTextarea } from "../ui";
import { listCampusProgramRequests, submitCampusProgramRequest } from "../../../api/campus";
import { useCampusAdmin } from "../CampusAdminContext";

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" });
  } catch { return iso; }
};

const STATUS_MAP = {
  pending:   { variant: "pending",  label: "Pending University Review" },
  approved:  { variant: "success",  label: "Approved — forwarded to Super Admin" },
  rejected:  { variant: "rejected", label: "Rejected" },
};

export default function ProgramRequestsPage() {
  const { campus } = useCampusAdmin();
  const campusId = campus?.id;

  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [formOpen,    setFormOpen]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [openNote,    setOpenNote]    = useState(null);
  const [form, setForm] = useState({ name: "", level: "Undergraduate", justification: "" });

  const load = useCallback(async () => {
    if (!campusId) return;
    setLoading(true);
    try {
      const data = await listCampusProgramRequests(campusId);
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load program requests.");
    } finally {
      setLoading(false);
    }
  }, [campusId]);

  useEffect(() => { load(); }, [load]);

  const change = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Program name is required"); return; }
    if (!campusId) { toast.error("Campus not loaded"); return; }
    setSubmitting(true);
    try {
      const { ok, data } = await submitCampusProgramRequest({
        campus_id:     campusId,
        program_name:  form.name.trim(),
        level:         form.level,
        justification: form.justification.trim(),
      });
      if (ok) {
        toast.success("Program request submitted.");
        setFormOpen(false);
        setForm({ name: "", level: "Undergraduate", justification: "" });
        await load();
      } else {
        toast.error(data?.message || "Submit failed.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Requests table — hidden until there is at least one request */}
      {(loading || requests.length > 0) && (
      <Card className="p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <SectionTitle title="Submitted Requests" />
          <button type="button" onClick={load} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading && requests.length === 0 ? (
          <div className="px-6 py-8 space-y-3">
            {[1,2].map((n) => (
              <div key={n} className="h-10 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {["Program Requested","Level","Justification","Submitted","Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((row) => {
                  const s = STATUS_MAP[row.status] || { variant:"draft", label: row.status };
                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-gray-50 transition-colors" style={{ height:56 }}>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{row.program_name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.level}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[220px]">
                        <span className="line-clamp-2">{row.justification || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap tabular-nums">{fmtDate(row.submitted_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill variant={s.variant} label={s.label} />
                          {row.rejection_note && (
                            <div className="relative">
                              <button type="button" onClick={() => setOpenNote(openNote === row.id ? null : row.id)}
                                className="text-xs text-orange-600 hover:text-orange-700 font-medium underline focus:outline-none">
                                View note
                              </button>
                              {openNote === row.id && (
                                <>
                                  <div className="fixed inset-0 z-20" onClick={() => setOpenNote(null)} />
                                  <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl shadow-xl border border-slate-100 p-4 w-72 text-sm text-slate-700">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Rejection Note</p>
                                      <button type="button" onClick={() => setOpenNote(null)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-slate-600">{row.rejection_note}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      )}

      {/* New Request form */}
      {!formOpen ? (
        <PrimaryBtn onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> New Program Request</PrimaryBtn>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle title="New Program Request" />
            <button type="button" onClick={() => setFormOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Program Name *" placeholder="e.g. BS Artificial Intelligence"
                value={form.name} onChange={change("name")} />
              <FormSelect label="Level" value={form.level} onChange={change("level")}>
                {["Undergraduate","MS","MPhil","PhD","Associate Degree"].map((l) => <option key={l}>{l}</option>)}
              </FormSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">University</label>
              <input disabled value={campus?.university_name || "Your University"}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-gray-50 cursor-not-allowed" />
            </div>
            <FormTextarea label="Justification *" placeholder="Explain why this program is needed at this campus…"
              value={form.justification} onChange={change("justification")} rows={3} />
            <div className="flex items-center justify-end gap-3 pt-2">
              <SecondaryBtn onClick={() => setFormOpen(false)}>Cancel</SecondaryBtn>
              <PrimaryBtn onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Request"}
              </PrimaryBtn>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5 text-orange-500" />
        </div>
        <p className="text-sm text-slate-600">
          Requests go to <span className="font-medium text-slate-800">University Admin</span> for tier-1 review first. If approved, they are forwarded to Super Admin before the program appears in your offerings.
        </p>
      </div>
    </div>
  );
}

export function ProgramRequestsActions({ onNew }) {
  return <PrimaryBtn onClick={onNew}><Plus className="w-4 h-4" /> New Program Request</PrimaryBtn>;
}
