import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BedDouble, Building2, Camera, Eye, EyeOff, ImageOff,
  MapPin, Phone, Plus, RefreshCw, Star, X,
} from "lucide-react";
import { API, authHeaders, fileUrl } from "../../../api/client";
import { useCampusAdmin } from "../CampusAdminContext";

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

function Stat({ icon: Icon, label, value, hint }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Icon size={19}/></div>
    <p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{hint}</p>
  </div>;
}

const emptyForm = {
  name: "", hostel_type: "Campus Hostel", gender: "Boys", rooms: "", rent_min: "",
  walk_dist: "", distance_km: "", latitude: "", longitude: "", contact: "", address: "", amenities: [],
};

const toNumber = (v) => (v === "" || v == null ? null : Number(v));

const validateGeo = ({ distance_km, latitude, longitude }) => {
  const distance = toNumber(distance_km);
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (distance !== null && (distance < 0 || distance > 5)) return "Distance from campus must be between 0 and 5 km.";
  if ((lat !== null && (lat < -90 || lat > 90)) || (lng !== null && (lng < -180 || lng > 180))) return "Latitude and longitude must be valid GPS coordinates.";
  if ((lat !== null) !== (lng !== null)) return "Latitude and longitude must be entered together.";
  return null;
};

function ImagePicker({ label, hint, multiple, files, onChange, max = 12 }) {
  const pick = (list) => {
    const picked = Array.from(list || []);
    if (!multiple) return onChange(picked.slice(0, 1));
    return onChange([...files, ...picked.slice(0, Math.max(0, max - files.length))]);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {files.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-slate-400 hover:text-red-600">Clear</button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {files.map((file, i) => (
          <div key={`${file.name}-${i}`} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
            <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-red-600"
              aria-label={`Remove ${file.name}`}
            ><X size={11}/></button>
          </div>
        ))}
        {(!multiple || files.length < max) && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500">
            <Camera size={17}/>
            <span className="text-[10px] font-medium">{multiple ? "Add" : "Cover"}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple={multiple}
              className="hidden"
              onChange={(e) => { pick(e.target.files); e.target.value = ""; }}
            />
          </label>
        )}
      </div>
    </div>
  );
}

function HostelForm({ onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [cover, setCover] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [amenity, setAmenity] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = e => {
    e.preventDefault();
    const problem = validateGeo(form);
    if (problem) { alert(problem); return; }
    onSave({ form, cover, gallery });
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
    <form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Add campus hostel</h3>
          <p className="text-sm text-slate-500">Create a hostel record — it goes live on your campus page right away.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={19}/></button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Hostel name<input required className={`${input} mt-1.5`} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Boys Hostel 1"/></label>
        <label className="text-sm font-medium">Hostel type<select className={`${input} mt-1.5`} value={form.hostel_type} onChange={e=>set("hostel_type",e.target.value)}><option>Campus Hostel</option><option>Private Hostel</option></select></label>
        <label className="text-sm font-medium">Residents<select className={`${input} mt-1.5`} value={form.gender} onChange={e=>set("gender",e.target.value)}><option>Boys</option><option>Girls</option><option>Mixed</option></select></label>
        <label className="text-sm font-medium">Total rooms<input type="number" min="1" className={`${input} mt-1.5`} value={form.rooms} onChange={e=>set("rooms",e.target.value)} placeholder="e.g. 120"/></label>
        <label className="text-sm font-medium">Starting monthly rent (Rs.)<input type="number" min="0" className={`${input} mt-1.5`} value={form.rent_min} onChange={e=>set("rent_min",e.target.value)} placeholder="e.g. 8000"/></label>
        <label className="text-sm font-medium">Distance from campus (km)<input type="number" min="0" max="5" step="0.1" className={`${input} mt-1.5`} value={form.distance_km} onChange={e=>set("distance_km",e.target.value)} placeholder="e.g. 2.5"/></label>
        <label className="text-sm font-medium">Walking distance<input className={`${input} mt-1.5`} value={form.walk_dist} onChange={e=>set("walk_dist",e.target.value)} placeholder="e.g. On campus / 5 min walk"/></label>
        <label className="text-sm font-medium sm:col-span-2">Address<input className={`${input} mt-1.5`} value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Hostel address shown to students"/></label>
        <label className="text-sm font-medium">Latitude<input type="number" min="-90" max="90" step="0.000001" className={`${input} mt-1.5`} value={form.latitude} onChange={e=>set("latitude",e.target.value)} placeholder="33.6844"/></label>
        <label className="text-sm font-medium">Longitude<input type="number" min="-180" max="180" step="0.000001" className={`${input} mt-1.5`} value={form.longitude} onChange={e=>set("longitude",e.target.value)} placeholder="73.0479"/></label>
        <label className="text-sm font-medium sm:col-span-2">Contact number<input className={`${input} mt-1.5`} value={form.contact} onChange={e=>set("contact",e.target.value)} placeholder="+92..."/></label>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:col-span-2">
          <ImagePicker
            label="Cover image"
            hint="Shown on the hostel card in the campus hostel section."
            files={cover}
            onChange={setCover}
          />
          <ImagePicker
            label="Hostel images"
            hint={`Photos students see when they open this hostel (max 12 · added ${gallery.length}).`}
            multiple
            files={gallery}
            onChange={setGallery}
          />
        </div>

        <div className="sm:col-span-2"><label className="text-sm font-medium">Amenities</label><div className="mt-1.5 flex gap-2"><input className={input} value={amenity} onChange={e=>setAmenity(e.target.value)} placeholder="Add an amenity (Wi-Fi, mess, laundry...)"/><button type="button" className="rounded-xl border px-4 text-sm font-medium" onClick={()=>{if(amenity.trim()){set("amenities",[...form.amenities,amenity.trim()]);setAmenity("");}}}>Add</button></div><div className="mt-2 flex flex-wrap gap-2">{form.amenities.map((a,i)=><button type="button" key={`${a}-${i}`} onClick={()=>set("amenities",form.amenities.filter((_,j)=>j!==i))} className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-700">{a} ×</button>)}</div></div>
      </div>

      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm">Cancel</button><button disabled={saving} className={btn}>{saving ? "Saving..." : "Create & publish"}</button></div>
    </form>
  </div>;
}

function PhotosModal({ hostel, onClose, onChanged, addToast }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState("");
  const photos = hostel.photos || [];

  const upload = async () => {
    if (!files.length) return;
    setBusy("upload");
    try {
      const body = new FormData();
      files.forEach((f) => body.append("photos", f));
      const res = await fetch(`${API}/api/campus/hostels/${hostel.id}/photos`, {
        method: "POST", headers: authHeaders(), body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not upload images");
      addToast(data.message || "Images added");
      setFiles([]);
      await onChanged();
    } catch (e) { addToast(e.message, "error"); }
    finally { setBusy(""); }
  };

  const act = async (kind, photoId) => {
    setBusy(photoId);
    try {
      const url = kind === "cover"
        ? `${API}/api/campus/hostels/${hostel.id}/photos/${photoId}/cover`
        : `${API}/api/campus/hostels/${hostel.id}/photos/${photoId}`;
      const res = await fetch(url, { method: kind === "cover" ? "PUT" : "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      await onChanged();
    } catch (e) { addToast(e.message, "error"); }
    finally { setBusy(""); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-start justify-between">
        <div><h3 className="text-lg font-bold">Manage photos</h3><p className="text-sm text-slate-500">{hostel.name}</p></div>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={19}/></button>
      </div>

      {photos.length === 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          <ImageOff size={18} className="text-slate-400"/> No images yet — the first one you upload becomes the cover.
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200">
              <img src={fileUrl(p.image_url)} alt={p.caption || hostel.name} className="h-full w-full object-cover"/>
              {p.is_cover ? (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">Cover</span>
              ) : (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => act("cover", p.id)}
                  className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600 opacity-0 transition group-hover:opacity-100"
                >Set cover</button>
              )}
              <button
                type="button"
                disabled={!!busy}
                onClick={() => act("delete", p.id)}
                className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/70 p-1 text-white hover:bg-red-600"
                aria-label="Delete photo"
              ><X size={11}/></button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <ImagePicker
          label="Add more images"
          hint="JPG, PNG or WEBP up to 5 MB each."
          multiple
          files={files}
          onChange={setFiles}
        />
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm">Close</button>
        <button disabled={!files.length || busy === "upload"} onClick={upload} className={btn}>
          <Plus size={16}/> {busy === "upload" ? "Uploading..." : files.length ? `Upload ${files.length}` : "Upload"}
        </button>
      </div>
    </div>
  </div>;
}

export default function HostelsPage() {
  const { campus, addToast } = useCampusAdmin();
  const campusId = campus?.id;
  const [hostels, setHostels] = useState([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [photoHostelId, setPhotoHostelId] = useState(null);
  const [error, setError] = useState("");
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [reviewBusyId, setReviewBusyId] = useState("");

  const load = useCallback(async () => {
    if (!campusId) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/campus/${campusId}/hostels`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not load campus hostels");
      setHostels(Array.isArray(data.hostels) ? data.hostels : []);
      setAvailable(Boolean(data.hostel_available));
      const reviewRes = await fetch(`${API}/api/hostels/review-queue`, { headers: authHeaders() });
      const reviewData = await reviewRes.json();
      if (!reviewRes.ok) throw new Error(reviewData.message || "Could not load registration requests.");
      setRegistrationRequests(reviewData.hostels || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  },[campusId]);
  useEffect(()=>{load();},[load]);

  const reviewRegistration = async (hostel, decision) => {
    const reason = decision === "rejected"
      ? window.prompt("Enter a rejection reason (minimum 10 characters):") || ""
      : "";
    if (decision === "rejected" && reason.trim().length < 10) return;
    setReviewBusyId(hostel.id);
    try {
      const res = await fetch(`${API}/api/hostels/${hostel.id}/review`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not update hostel review.");
      addToast(data.message || "Review updated");
      await load();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setReviewBusyId("");
    }
  };

  const downloadReviewDocument = async (hostel, documentItem) => {
    try {
      const res = await fetch(`${API}/api/hostels/${hostel.id}/review-documents/${documentItem.id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Could not download verification document.");
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = documentItem.original_name || "hostel-document";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      addToast(e.message, "error");
    }
  };

  const stats = useMemo(() => {
    const rents = hostels.map(h => toNumber(h.rent_min)).filter(v => v != null);
    return {
      total: hostels.length,
      rooms: hostels.reduce((n,h)=>n+Number(h.rooms||0),0),
      withPhotos: hostels.filter(h=>(h.photos?.length||0) > 0).length,
      minRent: rents.length ? Math.min(...rents) : null,
    };
  },[hostels]);

  const create = async ({ form, cover, gallery }) => {
    const problem = validateGeo(form);
    if (problem) { addToast(problem, "error"); return; }

    setSaving(true);
    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("hostel_type", form.hostel_type);
      body.append("gender", form.gender);
      body.append("amenities", JSON.stringify(form.amenities));
      for (const [key, value] of Object.entries({
        rooms: form.rooms, rent_min: form.rent_min, walk_dist: form.walk_dist,
        distance_km: form.distance_km, latitude: form.latitude, longitude: form.longitude,
        contact: form.contact, address: form.address,
      })) {
        if (value !== "" && value != null) body.append(key, value);
      }
      if (cover[0]) body.append("cover", cover[0]);
      gallery.forEach((f) => body.append("photos", f));

      const res = await fetch(`${API}/api/campus/${campusId}/hostels`, {
        method: "POST", headers: authHeaders(), body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not create hostel");
      addToast(data.message || "Hostel is live on your campus page");
      setShowForm(false);
      await load();
    } catch(e){ addToast(e.message, "error"); } finally{ setSaving(false); }
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

  const photoHostel = hostels.find(h => h.id === photoHostelId) || null;

  return <div className="space-y-6">
    <section className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Campus accommodation</p><h2 className="text-2xl font-bold text-slate-800">Hostel Dashboard</h2><p className="mt-1 text-sm text-slate-500">Every hostel you create goes live on your campus page immediately.</p></div><div className="flex gap-2"><button onClick={load} className={btnGhost} title="Refresh"><RefreshCw size={16}/></button><button onClick={()=>setShowForm(true)} className={btn}><Plus size={17}/> Add hostel</button></div></section>

    <section className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${available?"border-emerald-200 bg-emerald-50":"border-slate-200 bg-slate-100"}`}><div className="flex items-center gap-3"><div className={`rounded-xl p-3 ${available?"bg-emerald-100 text-emerald-700":"bg-slate-200 text-slate-600"}`}>{available?<Eye size={20}/>:<EyeOff size={20}/>}</div><div><h3 className="font-semibold text-slate-800">Hostel visibility</h3><p className="text-sm text-slate-600">{available?"Hostel information is enabled on the campus profile.":"Hostel information is hidden from the campus profile."}</p></div></div><button disabled={saving} onClick={toggle} className="rounded-xl border border-white bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">{available?"Hide from profile":"Show on profile"}</button></section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={Building2} label="Total hostels" value={stats.total} hint="Live on your campus page"/>
      <Stat icon={BedDouble} label="Total rooms" value={stats.rooms} hint="Across all listed hostels"/>
      <Stat icon={Camera} label="With photos" value={stats.withPhotos} hint="Card shows its cover image"/>
      <Stat icon={MapPin} label="Starting rent" value={stats.minRent != null ? `Rs. ${stats.minRent.toLocaleString("en-PK")}` : "—"} hint="Lowest across hostels"/>
    </section>

    <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      <div className="border-b border-amber-100 px-5 py-4">
        <h3 className="font-semibold text-slate-800">Campus hostel registration requests</h3>
        <p className="text-xs text-slate-500">Review requests submitted by campus hostel owners. Approval unlocks their dashboard.</p>
      </div>
      {registrationRequests.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No campus hostel requests are waiting for review.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {registrationRequests.map((request) => (
            <article key={request.id} className="space-y-3 p-5">
              <div>
                <h4 className="font-semibold text-slate-800">{request.name}</h4>
                <p className="text-sm text-slate-500">{request.owner_name} · {request.owner_email} · {request.campus_name || campus?.name}</p>
                <p className="text-sm text-slate-500">{request.gender || ""} · {request.contact_phone || ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(request.documents || []).map((documentItem) => (
                  <button key={documentItem.id} onClick={() => downloadReviewDocument(request, documentItem)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    {documentItem.original_name || documentItem.document_type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button disabled={reviewBusyId === request.id} onClick={() => reviewRegistration(request, "approved")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve & unlock dashboard</button>
                <button disabled={reviewBusyId === request.id} onClick={() => reviewRegistration(request, "rejected")} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50">Reject</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h3 className="font-semibold text-slate-800">Campus hostels</h3>
        <p className="text-xs text-slate-500">No approval needed — a saved hostel appears in your campus hostel section right away.</p>
      </div>
      {loading?<div className="p-10 text-center text-sm text-slate-500">Loading hostels…</div>
      :error?<div className="p-6 text-sm text-red-600">{error} <button onClick={load} className="ml-2 underline">Retry</button></div>
      :hostels.length===0?<div className="p-10 text-center"><Building2 className="mx-auto text-slate-300" size={32}/><p className="mt-3 font-medium text-slate-700">No hostels added yet</p><p className="mt-1 text-sm text-slate-500">Add the first hostel — it will show on your campus page right away.</p><button onClick={()=>setShowForm(true)} className={`${btn} mt-4`}><Plus size={16}/> Add first hostel</button></div>
      :<div className="grid gap-4 p-5 sm:grid-cols-2">{hostels.map(h=><article key={h.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="relative h-36 bg-gradient-to-br from-orange-50 to-slate-100">
          {h.cover_url ? <img src={fileUrl(h.cover_url)} alt={h.name} className="h-full w-full object-cover"/>
            : <div className="flex h-full items-center justify-center"><Building2 size={34} className="text-orange-200"/></div>}
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">Live</span>
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-600"><Camera size={11}/> {h.photos?.length || 0}</span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h4 className="font-semibold text-slate-800">{h.name}</h4>
          <p className="mt-0.5 text-xs text-slate-500">{h.hostel_type||"Campus Hostel"} · {h.gender||"Gender not specified"}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><BedDouble size={13}/>{h.rooms??"—"} rooms</span>
            <span>{h.rent_min!=null?`From Rs. ${Number(h.rent_min).toLocaleString("en-PK")}/month`:"Rent not set"}</span>
            {h.distance_km!=null&&<span className="inline-flex items-center gap-1"><MapPin size={13}/>{Number(h.distance_km).toFixed(1)} km away</span>}
            {h.contact&&<span className="inline-flex items-center gap-1"><Phone size={13}/>{h.contact}</span>}
          </div>
          {Array.isArray(h.amenities)&&h.amenities.length>0&&<div className="mt-3 flex flex-wrap gap-1.5">{h.amenities.map((a,i)=><span key={`${a}-${i}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{a}</span>)}</div>}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-400">{h.created_at?new Date(h.created_at).toLocaleDateString():""}</span>
            <button onClick={()=>setPhotoHostelId(h.id)} className={btnGhost}><Star size={14}/> Manage photos</button>
          </div>
        </div>
      </article>)}</div>}
    </section>

    {showForm&&<HostelForm onClose={()=>setShowForm(false)} onSave={create} saving={saving}/>}
    {photoHostel&&<PhotosModal hostel={photoHostel} onClose={()=>setPhotoHostelId(null)} onChanged={load} addToast={addToast}/>}
  </div>;
}
