import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, BedDouble, Users, Eye, EyeOff, Plus, RefreshCw, ShieldCheck, MapPin, Phone, X, ArrowRight } from "lucide-react";
import { API, authHeaders } from "../../../api/client";
import { useCampusAdmin } from "../CampusAdminContext";

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50";
const statusStyle = {
  approved: "bg-emerald-50 text-emerald-700",
  live: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  pending_super_admin: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-700",
};
const labelStatus = (s) => ({ pending_super_admin: "Awaiting Super Admin", approved: "Live", pending: "Pending review", rejected: "Rejected" }[s] || s || "Unknown");

function Stat({ icon: Icon, label, value, hint }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Icon size={19}/></div>
    <p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{hint}</p>
  </div>;
}

function HostelForm({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: "", hostel_type: "Campus Hostel", gender: "Boys", rooms: "", rent_min: "", walk_dist: "", contact: "", amenities: [] });
  const [amenity, setAmenity] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const submit = e => { e.preventDefault(); onSave({ ...form, amenities: form.amenities }); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
    <form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-bold">Add campus hostel</h3><p className="text-sm text-slate-500">Create a hostel record for this campus.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={19}/></button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Hostel name<input required className={`${input} mt-1.5`} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Boys Hostel 1"/></label>
        <label className="text-sm font-medium">Hostel type<select className={`${input} mt-1.5`} value={form.hostel_type} onChange={e=>set("hostel_type",e.target.value)}><option>Campus Hostel</option><option>Private Hostel</option></select></label>
        <label className="text-sm font-medium">Residents<select className={`${input} mt-1.5`} value={form.gender} onChange={e=>set("gender",e.target.value)}><option>Boys</option><option>Girls</option><option>Mixed</option></select></label>
        <label className="text-sm font-medium">Total rooms<input type="number" min="1" className={`${input} mt-1.5`} value={form.rooms} onChange={e=>set("rooms",e.target.value)} placeholder="e.g. 120"/></label>
        <label className="text-sm font-medium">Starting monthly rent (Rs.)<input type="number" min="0" className={`${input} mt-1.5`} value={form.rent_min} onChange={e=>set("rent_min",e.target.value)} placeholder="e.g. 8000"/></label>
        <label className="text-sm font-medium">Distance from campus<input className={`${input} mt-1.5`} value={form.walk_dist} onChange={e=>set("walk_dist",e.target.value)} placeholder="e.g. On campus / 5 min walk"/></label>
        <label className="text-sm font-medium">Contact number<input className={`${input} mt-1.5`} value={form.contact} onChange={e=>set("contact",e.target.value)} placeholder="+92..."/></label>
        <div className="sm:col-span-2"><label className="text-sm font-medium">Amenities</label><div className="mt-1.5 flex gap-2"><input className={input} value={amenity} onChange={e=>setAmenity(e.target.value)} placeholder="Add an amenity (Wi-Fi, mess, laundry...)"/><button type="button" className="rounded-xl border px-4 text-sm font-medium" onClick={()=>{if(amenity.trim()){set("amenities",[...form.amenities,amenity.trim()]);setAmenity("");}}}>Add</button></div><div className="mt-2 flex flex-wrap gap-2">{form.amenities.map((a,i)=><button type="button" key={`${a}-${i}`} onClick={()=>set("amenities",form.amenities.filter((_,j)=>j!==i))} className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-700">{a} ×</button>)}</div></div>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm">Cancel</button><button disabled={saving} className={btn}>{saving ? "Saving..." : "Create hostel"}</button></div>
    </form>
  </div>;
}

export default function HostelsPage() {
  const { campus, navigateTo, addToast } = useCampusAdmin();
  const campusId = campus?.id;
  const [hostels,setHostels] = useState([]);
  const [available,setAvailable] = useState(true);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [showForm,setShowForm] = useState(false);
  const [error,setError] = useState("");
  const load = useCallback(async () => {
    if (!campusId) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/campus/${campusId}/hostels`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not load campus hostels");
      setHostels(Array.isArray(data.hostels) ? data.hostels : []);
      setAvailable(Boolean(data.hostel_available));
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  },[campusId]);
  useEffect(()=>{load();},[load]);
  const stats = useMemo(()=>({
    total:hostels.length,
    rooms:hostels.reduce((n,h)=>n+Number(h.rooms||0),0),
    pending:hostels.filter(h=>["pending","pending_super_admin"].includes(h.status)).length,
    live:hostels.filter(h=>["approved","live"].includes(h.status)).length
  }),[hostels]);
  const create = async payload => {
    setSaving(true);
    try {
      const res=await fetch(`${API}/api/campus/${campusId}/hostels`,{method:"POST",headers:{...authHeaders(),"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json(); if(!res.ok) throw new Error(data.message||"Could not create hostel");
      addToast(data.message || "Hostel submitted for approval"); setShowForm(false); await load();
    } catch(e){addToast(e.message,"error");} finally{setSaving(false);}
  };
  const toggle = async () => {
    setSaving(true);
    try {
      const res=await fetch(`${API}/api/campus/${campusId}/hostel-availability`,{method:"PUT",headers:{...authHeaders(),"Content-Type":"application/json"},body:JSON.stringify({hostel_available:!available})});
      const data=await res.json(); if(!res.ok) throw new Error(data.message||"Could not update visibility");
      setAvailable(Boolean(data.hostel_available)); addToast("Hostel visibility updated");
    } catch(e){addToast(e.message,"error");} finally{setSaving(false);}
  };
  if (!campusId) return <div className="rounded-2xl border bg-white p-8 text-center"><Building2 className="mx-auto text-orange-500" size={30}/><h2 className="mt-3 font-semibold">Campus profile not loaded</h2><p className="mt-1 text-sm text-slate-500">Please refresh the dashboard and try again.</p></div>;
  return <div className="space-y-6">
    <section className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Campus accommodation</p><h2 className="text-2xl font-bold text-slate-800">Hostel Dashboard</h2><p className="mt-1 text-sm text-slate-500">Manage campus hostel records, visibility and approval progress.</p></div><div className="flex gap-2"><button onClick={load} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" title="Refresh"><RefreshCw size={16}/></button><button onClick={()=>setShowForm(true)} className={btn}><Plus size={17}/> Add hostel</button></div></section>
    <section className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${available?"border-emerald-200 bg-emerald-50":"border-slate-200 bg-slate-100"}`}><div className="flex items-center gap-3"><div className={`rounded-xl p-3 ${available?"bg-emerald-100 text-emerald-700":"bg-slate-200 text-slate-600"}`}>{available?<Eye size={20}/>:<EyeOff size={20}/>}</div><div><h3 className="font-semibold text-slate-800">Hostel visibility</h3><p className="text-sm text-slate-600">{available?"Hostel information is enabled on the campus profile.":"Hostel information is hidden from the campus profile."}</p></div></div><button disabled={saving} onClick={toggle} className="rounded-xl border border-white bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">{available?"Hide from profile":"Show on profile"}</button></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={Building2} label="Total hostels" value={stats.total} hint="Registered with this campus"/><Stat icon={BedDouble} label="Total rooms" value={stats.rooms} hint="Across all listed hostels"/><Stat icon={ShieldCheck} label="Awaiting review" value={stats.pending} hint="Campus or final review pending"/><Stat icon={Users} label="Approved hostels" value={stats.live} hint="Visible after final approval"/></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"><div><h3 className="font-semibold text-slate-800">Campus hostel records</h3><p className="text-xs text-slate-500">New campus-hostel submissions enter the approval workflow.</p></div><button onClick={()=>navigateTo("hostel-approvals")} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700">Review approvals <ArrowRight size={15}/></button></div>
      {loading?<div className="p-10 text-center text-sm text-slate-500">Loading hostels…</div>:error?<div className="p-6 text-sm text-red-600">{error} <button onClick={load} className="ml-2 underline">Retry</button></div>:hostels.length===0?<div className="p-10 text-center"><Building2 className="mx-auto text-slate-300" size={32}/><p className="mt-3 font-medium text-slate-700">No hostels added yet</p><p className="mt-1 text-sm text-slate-500">Add the first hostel to start managing campus accommodation.</p><button onClick={()=>setShowForm(true)} className={`${btn} mt-4`}><Plus size={16}/> Add first hostel</button></div>:<div className="divide-y">{hostels.map(h=><article key={h.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Building2 size={21}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-slate-800">{h.name}</h4><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[h.status]||"bg-slate-100 text-slate-600"}`}>{labelStatus(h.status)}</span></div><p className="mt-1 text-xs text-slate-500">{h.hostel_type||"Campus Hostel"} · {h.gender||"Gender not specified"}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><BedDouble size={13}/>{h.rooms??"—"} rooms</span><span>{h.rent_min!=null?`From Rs. ${Number(h.rent_min).toLocaleString("en-PK")}/month`:"Rent not set"}</span>{h.walk_dist&&<span className="inline-flex items-center gap-1"><MapPin size={13}/>{h.walk_dist}</span>}{h.contact&&<span className="inline-flex items-center gap-1"><Phone size={13}/>{h.contact}</span>}</div>{Array.isArray(h.amenities)&&h.amenities.length>0&&<div className="mt-2 flex flex-wrap gap-1.5">{h.amenities.map((a,i)=><span key={`${a}-${i}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{a}</span>)}</div>}</div><div className="text-xs text-slate-400">{h.created_at?new Date(h.created_at).toLocaleDateString():""}</div></article>)}</div>}
    </section>
    {showForm&&<HostelForm onClose={()=>setShowForm(false)} onSave={create} saving={saving}/>}
  </div>;
}
