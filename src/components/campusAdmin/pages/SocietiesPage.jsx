/**
 * Page 8 — Societies & Clubs
 * Real API: listCampusSocieties, addCampusSociety, updateCampusSociety, deleteCampusSociety
 */
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import {
  Card, PrimaryBtn, SecondaryBtn, SectionTitle,
  FormInput, FormSelect, FormTextarea, IconBtn, ConfirmModal,
} from "../ui";
import {
  listCampusSocieties,
  addCampusSociety,
  updateCampusSociety,
  deleteCampusSociety,
} from "../../../api/campus";
import { useCampusAdmin } from "../CampusAdminContext";

const CATEGORIES = [
  "Technical","Sports","Literary","Cultural","Media",
  "Religious","Social Welfare","Entrepreneurship",
];

const CAT_COLORS = {
  Technical:       { bg: "bg-blue-100",   text: "text-blue-700"   },
  Sports:          { bg: "bg-green-100",  text: "text-green-700"  },
  Literary:        { bg: "bg-purple-100", text: "text-purple-700" },
  Cultural:        { bg: "bg-pink-100",   text: "text-pink-700"   },
  Media:           { bg: "bg-sky-100",    text: "text-sky-700"    },
  Religious:       { bg: "bg-amber-100",  text: "text-amber-700"  },
  "Social Welfare":{ bg: "bg-teal-100",   text: "text-teal-700"   },
  Entrepreneurship:{ bg: "bg-orange-100", text: "text-orange-700" },
};

function CategoryBadge({ category }) {
  const c = CAT_COLORS[category] || { bg:"bg-gray-100", text:"text-gray-700" };
  return <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>{category}</span>;
}

function SocietyCard({ society, onEdit, onDelete }) {
  return (
    <Card className="relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <IconBtn title="Edit" onClick={() => onEdit(society)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
        <IconBtn danger title="Delete" onClick={() => onDelete(society.id)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
      </div>
      <div className="flex items-start gap-4 pr-16">
        <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
          {society.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-slate-800 leading-tight mb-1">{society.name}</p>
          <CategoryBadge category={society.category} />
          <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">{society.description}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SocietiesPage() {
  const { campus } = useCampusAdmin();
  const campusId   = campus?.id;

  const [societies,  setSocieties]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [formOpen,   setFormOpen]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({ name: "", category: "Technical", description: "" });

  const load = useCallback(async () => {
    if (!campusId) return;
    setLoading(true);
    try {
      const data = await listCampusSocieties(campusId);
      setSocieties(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load societies.");
    } finally {
      setLoading(false);
    }
  }, [campusId]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ name:"", category:"Technical", description:"" }); setFormOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name:s.name, category:s.category, description:s.description || "" }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editing) {
        const { ok } = await updateCampusSociety(editing.id, form);
        if (!ok) throw new Error("Update failed");
        toast.success("Society updated");
      } else {
        const { ok } = await addCampusSociety(campusId, form);
        if (!ok) throw new Error("Add failed");
        toast.success("Society added");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await deleteCampusSociety(deleteId);
      toast.success("Society removed");
      await load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  const change = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  if (loading && societies.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[1,2].map((n) => (
          <div key={n} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {societies.map((s) => (
          <SocietyCard key={s.id} society={s} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} />
        ))}
      </div>

      {formOpen ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle title={editing ? "Edit Society" : "Add Society"} />
            <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Society Name *" placeholder="e.g. Photography Society" value={form.name} onChange={change("name")} />
              <FormSelect label="Category" value={form.category} onChange={change("category")}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </FormSelect>
            </div>
            <FormTextarea label="Short Description" placeholder="What does this society do?" value={form.description} onChange={change("description")} rows={3} />
            <div className="flex items-center justify-end gap-3 pt-1">
              <SecondaryBtn onClick={() => setFormOpen(false)}>Cancel</SecondaryBtn>
              <PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Society"}</PrimaryBtn>
            </div>
          </div>
        </Card>
      ) : (
        <PrimaryBtn onClick={openAdd}><Plus className="w-4 h-4" /> Add Society</PrimaryBtn>
      )}

      {deleteId && (
        <ConfirmModal title="Remove this society?" message="This cannot be undone." onConfirm={doDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}

export function SocietiesActions({ onAdd }) {
  return <PrimaryBtn onClick={onAdd}><Plus className="w-4 h-4" /> Add Society</PrimaryBtn>;
}
