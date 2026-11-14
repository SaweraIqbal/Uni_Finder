/**
 * ResearchProfileSection — visible for MS, MPhil, PhD only.
 */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SectionCard from "../SectionCard";
import RepeatableRecordEditor from "../RepeatableRecordEditor";
import UploadDropzone from "../UploadDropzone";
import { fetchResearch, saveResearch, createPublication, updatePublication as apiUpdatePub, deletePublication as apiDeletePub } from "../../../api/studentProfile";
import { RESEARCH_RULES } from "../../../config/profileRequirements";

const Field = ({ label, error, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

function PubForm({ draft, onChange, errors }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <Field label="Title" required error={errors?.title}>
          <input value={draft.title || ""} onChange={(e) => onChange({ title: e.target.value })}
            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-800
              focus:outline-none focus:ring-2 focus:ring-orange-300
              ${errors?.title ? "border-red-300" : "border-slate-200"}`}
            placeholder="Publication title" />
        </Field>
      </div>
      <Field label="Journal / Conference">
        <input value={draft.journal_conf || ""} onChange={(e) => onChange({ journal_conf: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="Journal / conference name" />
      </Field>
      <Field label="Year">
        <input type="number" min="2000" max="2030" value={draft.pub_year || ""}
          onChange={(e) => onChange({ pub_year: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="2024" />
      </Field>
      <Field label="DOI / Link">
        <input value={draft.doi_link || ""} onChange={(e) => onChange({ doi_link: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="https://doi.org/... or DOI only" />
      </Field>
      <Field label="HEC Category (W/X/Y/Z)">
        <select value={draft.hec_category || ""} onChange={(e) => onChange({ hec_category: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <option value="">Select</option>
          {["W", "X", "Y", "Z"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
    </div>
  );
}

function PubCard({ record, onEdit, onDelete }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 leading-tight">{record.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {record.journal_conf ? `${record.journal_conf} · ` : ""}{record.pub_year ?? ""}
          {record.hec_category ? ` · HEC-${record.hec_category}` : ""}
        </p>
        {record.doi_link && (
          <a href={record.doi_link.startsWith("http") ? record.doi_link : `https://doi.org/${record.doi_link}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-0.5 block">
            {record.doi_link}
          </a>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onEdit   && <button type="button" onClick={onEdit}   className="text-xs text-orange-500 hover:text-orange-700">Edit</button>}
        {onDelete && <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>}
      </div>
    </div>
  );
}

export default function ResearchProfileSection({ targetLevel, onSaved, hidden, onEditChange }) {
  const [profile,   setProfile]   = useState(null);
  const [pubs,      setPubs]      = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);
  const [form, setForm]           = useState({ research_interests: [], sop_url: "", proposal_url: "", orcid: "", google_scholar: "", thesis_abstract: "" });
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    if (hidden) return;
    fetchResearch().then(({ ok, data }) => {
      if (!ok) return;
      setProfile(data.profile);
      setPubs(data.publications || []);
      if (data.profile) {
        const interests = (() => {
          try { return JSON.parse(data.profile.research_interests || "[]"); }
          catch { return []; }
        })();
        setForm({
          research_interests: interests,
          sop_url:         data.profile.sop_url        || "",
          proposal_url:    data.profile.proposal_url   || "",
          orcid:           data.profile.orcid          || "",
          google_scholar:  data.profile.google_scholar || "",
          thesis_abstract: data.profile.thesis_abstract || "",
        });
      }
    });
  }, [hidden]);

  const rules      = RESEARCH_RULES[targetLevel] || {};
  const interests  = Array.isArray(form.research_interests) ? form.research_interests : [];
  const isComplete = (!rules.interests || interests.length > 0)
    && (!rules.sop || form.sop_url)
    && (!rules.proposal || form.proposal_url);

  const addInterest = () => {
    const tag = interestInput.trim();
    if (!tag || interests.includes(tag)) return;
    setForm((p) => ({ ...p, research_interests: [...interests, tag] }));
    setInterestInput("");
  };
  const removeInterest = (tag) => {
    setForm((p) => ({ ...p, research_interests: interests.filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { ok, data } = await saveResearch({
      ...form,
      research_interests: interests,
    });
    setIsSaving(false);
    if (!ok) { toast.error(data?.message || "Save failed"); return; }
    setIsEditing(false);
    setSavedOk(true); setTimeout(() => setSavedOk(false), 4000);
    onSaved?.();
  };

  const handleAddPub = async (draft) => {
    const { ok, data } = await createPublication(draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setPubs((p) => [...p, data]);
    onSaved?.();
  };
  const handleUpdatePub = async (id, draft) => {
    const { ok, data } = await apiUpdatePub(id, draft);
    if (!ok) { toast.error(data?.message || "Save failed"); throw data; }
    setPubs((p) => p.map((r) => r.id === id ? data : r));
  };
  const handleDeletePub = async (id) => {
    const { ok, data } = await apiDeletePub(id);
    if (!ok) { toast.error(data?.message || "Delete failed"); return; }
    setPubs((p) => p.filter((r) => r.id !== id));
  };

  return (
    <SectionCard
      id="research"
      title="Research Profile"
      helperText="Visible for MS, MPhil, and PhD. Required items vary by level."
      isComplete={isComplete}
      isEditing={isEditing}
      isSaving={isSaving}
      savedOk={savedOk}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={() => { setIsEditing(false); }}
      hidden={hidden}
      onEditChange={onEditChange}
    >
      {isEditing ? (
        <div className="space-y-5">
          {/* Research Interests */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Research Interests {rules.interests && <span className="text-orange-500">*</span>}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }}
                placeholder="e.g. Machine Learning — press Enter to add"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button type="button" onClick={addInterest}
                className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-medium hover:bg-orange-600">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs text-orange-700 font-medium">
                  {tag}
                  <button type="button" onClick={() => removeInterest(tag)} className="text-orange-400 hover:text-orange-700 leading-none">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UploadDropzone
              label="Statement of Purpose"
              docType="sop"
              required={rules.sop}
              currentUrl={form.sop_url}
              onUploaded={(url) => setForm((p) => ({ ...p, sop_url: url }))}
              onDelete={() => setForm((p) => ({ ...p, sop_url: "" }))}
            />
            {targetLevel === "PhD" && (
              <UploadDropzone
                label="Research Proposal"
                docType="proposal"
                required={rules.proposal}
                currentUrl={form.proposal_url}
                onUploaded={(url) => setForm((p) => ({ ...p, proposal_url: url }))}
                onDelete={() => setForm((p) => ({ ...p, proposal_url: "" }))}
              />
            )}
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ORCID (optional)">
              <input value={form.orcid} onChange={(e) => setForm((p) => ({ ...p, orcid: e.target.value }))}
                placeholder="0000-0001-2345-6789"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Google Scholar Profile (optional)">
              <input value={form.google_scholar} onChange={(e) => setForm((p) => ({ ...p, google_scholar: e.target.value }))}
                placeholder="https://scholar.google.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
          </div>

          <Field label="Thesis Abstract (optional)">
            <textarea value={form.thesis_abstract}
              onChange={(e) => setForm((p) => ({ ...p, thesis_abstract: e.target.value }))}
              rows={3} placeholder="Brief abstract of your research work"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
          </Field>
        </div>
      ) : (
        <div className="space-y-3">
          {interests.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1.5">Research Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((t) => (
                  <span key={t} className="px-2.5 py-0.5 bg-orange-50 border border-orange-100 rounded-full text-xs text-orange-700">{t}</span>
                ))}
              </div>
            </div>
          )}
          {profile?.sop_url && <p className="text-xs text-slate-500">📄 SOP uploaded</p>}
          {profile?.proposal_url && <p className="text-xs text-slate-500">📄 Research proposal uploaded</p>}
          {profile?.orcid && <p className="text-xs text-slate-500">ORCID: {profile.orcid}</p>}
          {!profile && <p className="text-xs text-slate-400">No research profile added yet.</p>}
        </div>
      )}

      {/* Publications always visible */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Publications <span className="text-xs font-normal text-slate-400">(optional — recommended for PhD)</span></h3>
        <RepeatableRecordEditor
          records={pubs}
          isEditing={isEditing}
          addLabel="Add publication"
          renderCard={(rec, actions) => <PubCard record={rec} onEdit={actions.onEdit} onDelete={actions.onDelete} />}
          renderForm={(draft, onChange, errors) => <PubForm draft={draft} onChange={onChange} errors={errors} />}
          onAdd={handleAddPub}
          onUpdate={handleUpdatePub}
          onDelete={handleDeletePub}
          emptyState="No publications added yet."
        />
      </div>
    </SectionCard>
  );
}
