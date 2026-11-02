import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, X, XCircle, ArrowRight } from "lucide-react";
import { API, authHeaders } from "../../../api/client";
import { useCampusAdmin } from "../CampusAdminContext";

const badge = { pending:"bg-amber-50 text-amber-700", pending_super_admin:"bg-blue-50 text-blue-700", approved:"bg-emerald-50 text-emerald-700", rejected:"bg-red-50 text-red-700" };
const statusText = { pending:"Needs campus review", pending_super_admin:"Awaiting Super Admin", approved:"Approved", rejected:"Rejected" };

export default function HostelApprovalsPage() {
  const { campus, addToast, navigateTo } = useCampusAdmin();
  const [items,setItems] = useState([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState("");
  const [selected,setSelected] = useState(null);
  const [reason,setReason] = useState("");
  const [error,setError] = useState("");
  const load=useCallback(async()=>{
    if(!campus?.id){setLoading(false);return;}
    setLoading(true);setError("");
    try{
      const res=await fetch(`${API}/api/campus/${campus.id}/hostel-approvals`,{headers:authHeaders()});
      const data=await res.json();if(!res.ok)throw new Error(data.message||"Could not load hostel approvals");
      setItems(Array.isArray(data)?data:[]);
    }catch(e){setError(e.message);}finally{setLoading(false);}
  },[campus?.id]);
  useEffect(()=>{load();},[load]);
  const review=async(id,decision)=>{
    if(decision==="rejected"&&!reason.trim())return addToast("Please provide a rejection reason.","error");
    setBusy(id);
    try{
      const res=await fetch(`${API}/api/campus/hostel-approvals/${id}/${decision==="approved"?"approve":"reject"}`,{
        method:"PUT",headers:{...authHeaders(),"Content-Type":"application/json"},
        ...(decision==="rejected"?{body:JSON.stringify({reason})}:{})
      });
      const data=await res.json();if(!res.ok)throw new Error(data.message||"Review action failed");
      addToast(data.message||"Hostel review updated");setSelected(null);setReason("");await load();
    }catch(e){addToast(e.message,"error");}finally{setBusy("");}
  };
  const pending=items.filter(x=>x.status==="pending");
  const forwarded=items.filter(x=>x.status==="pending_super_admin");
  const reviewed=items.filter(x=>["approved","rejected"].includes(x.status));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">Campus accommodation workflow</p><h2 className="text-2xl font-bold text-slate-800">Hostel Approvals</h2><p className="mt-1 text-sm text-slate-500">Review campus-hostel submissions before forwarding them for final approval.</p></div><div className="flex gap-2"><button onClick={()=>navigateTo("hostels")} className="rounded-xl border bg-white px-3 py-2.5 text-sm font-medium">Hostel dashboard</button><button onClick={load} className="rounded-xl border bg-white px-3 py-2.5"><RefreshCw size={16}/></button></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Campus review</p><p className="mt-1 text-2xl font-bold">{pending.length}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Forwarded to Super Admin</p><p className="mt-1 text-2xl font-bold">{forwarded.length}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Reviewed</p><p className="mt-1 text-2xl font-bold">{reviewed.length}</p></div></div>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex items-center justify-between border-b px-5 py-4"><div><h3 className="font-semibold">Campus hostel applications</h3><p className="text-xs text-slate-500">Only Campus Hostel submissions appear in this queue.</p></div><ShieldCheck className="text-orange-500" size={21}/></div>
      {loading?<div className="p-10 text-center text-sm text-slate-500">Loading applications…</div>:error?<div className="p-6 text-sm text-red-600">{error} <button onClick={load} className="underline">Retry</button></div>:items.length===0?<div className="p-10 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={32}/><p className="mt-3 font-medium">No hostel applications</p><p className="mt-1 text-sm text-slate-500">New campus-hostel submissions will appear here.</p></div>:<div className="divide-y">{items.map(h=><article key={h.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-slate-800">{h.name}</h4><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge[h.status]||"bg-slate-100 text-slate-600"}`}>{statusText[h.status]||h.status}</span></div><p className="mt-1 text-xs text-slate-500">{h.gender||"Gender not specified"} · {h.rooms??"—"} rooms {h.rent_min!=null?`· From Rs. ${Number(h.rent_min).toLocaleString("en-PK")}/month`:""}</p>{h.rejection_reason&&<p className="mt-2 text-sm text-red-600">Reason: {h.rejection_reason}</p>}</div><div className="flex flex-wrap gap-2">{h.status==="pending"?<><button disabled={!!busy} onClick={()=>review(h.id,"approved")} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy===h.id?"Processing…":<><CheckCircle2 size={14}/> Approve & forward</>}</button><button disabled={!!busy} onClick={()=>{setSelected(h);setReason("");}} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"><XCircle size={14}/> Reject</button></>:h.status==="pending_super_admin"?<span className="inline-flex items-center gap-1.5 text-xs text-blue-700"><Clock3 size={14}/> Awaiting final decision</span>:<span className="text-xs text-slate-400">No action required</span>}</div></article>)}</div>}
    </section>
    {selected&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h3 className="font-semibold">Reject {selected.name}</h3><button onClick={()=>setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div><p className="mt-2 text-sm text-slate-500">Share the reason so the applicant understands what needs to change.</p><textarea rows={4} value={reason} onChange={e=>setReason(e.target.value)} maxLength={2000} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-400" placeholder="Enter rejection reason…"/><div className="mt-4 flex justify-end gap-2"><button onClick={()=>setSelected(null)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button><button disabled={!!busy||!reason.trim()} onClick={()=>review(selected.id,"rejected")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirm rejection</button></div></div></div>}
  </div>;
}
