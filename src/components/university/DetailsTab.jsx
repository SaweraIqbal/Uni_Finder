import { useState } from "react";
import { toast } from "react-toastify";
import { saveUniversity } from "../../api/university";
import { fileUrl, API } from "../../api/client";

// Rich form whose sections mirror the public university detail page, so whatever
// the admin fills here shows up live for students. `initial` is the existing
// record (or null). Calls onSaved() so the parent can refresh.
export default function DetailsTab({ ownerUid, initial, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    tagline: initial?.tagline || "",
    hero_subtitle: initial?.hero_subtitle || "",
    established_year: initial?.established_year || "",
    city: initial?.city || "",
    about_title: initial?.about_title || "",
    about_text: initial?.about_text || "",
    description: initial?.description || "",
    mission: initial?.mission || "",
    vision: initial?.vision || "",
    ranking: initial?.ranking || "",
    ranking_label: initial?.ranking_label || "",
    students: initial?.students || "",
    employment_rate: initial?.employment_rate || "",
    partner_countries: initial?.partner_countries || "",
    total_campuses: initial?.total_campuses || "",
    website: initial?.website || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    address: initial?.address || "",
  });
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("University name is required");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("owner_uid", ownerUid);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logo) fd.append("logo", logo);
      if (banner) fd.append("banner", banner);

      const { ok, data } = await saveUniversity(fd);
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

  const logoPreview = logo ? URL.createObjectURL(logo) : fileUrl(initial?.logo_url);
  const bannerPreview = banner ? URL.createObjectURL(banner) : fileUrl(initial?.banner_url);

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl pb-10">
      {/* Branding: logo + banner */}
      <Section title="Branding" subtitle="Logo and the big banner image at the top of your page.">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
            {logoPreview ? (
              <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-300 text-xs">Logo</span>
            )}
          </div>
          <FileBtn label={logoPreview ? "Change logo" : "Upload logo"} onChange={setLogo} />
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 h-36 flex items-center justify-center">
          {bannerPreview ? (
            <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-300 text-sm">Banner image</span>
          )}
        </div>
        <div className="mt-2">
          <FileBtn label={bannerPreview ? "Change banner" : "Upload banner"} onChange={setBanner} />
        </div>
      </Section>

      {/* Hero */}
      <Section title="Hero" subtitle="The headline students see first.">
        <Input label="University Name *" name="name" value={form.name} onChange={change} />
        <Input label="Tagline / Headline" name="tagline" value={form.tagline} onChange={change} placeholder="Excellence in Education, Leadership for Life" />
        <Textarea label="Hero subtitle" name="hero_subtitle" value={form.hero_subtitle} onChange={change} rows={2} />
      </Section>

      {/* About */}
      <Section title="About" subtitle="The 'About' card on your page.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Established Year" name="established_year" value={form.established_year} onChange={change} placeholder="1999" />
          <Input label="City" name="city" value={form.city} onChange={change} placeholder="Lahore" />
        </div>
        <Input label="About title" name="about_title" value={form.about_title} onChange={change} placeholder="Dedicated to Academic Rigor" />
        <Textarea label="About text" name="about_text" value={form.about_text} onChange={change} rows={4} />
        <Textarea label="Short description (used in listings)" name="description" value={form.description} onChange={change} rows={2} />
      </Section>

      {/* Mission & Vision */}
      <Section title="Mission & Vision">
        <Textarea label="Mission" name="mission" value={form.mission} onChange={change} rows={3} />
        <Textarea label="Vision" name="vision" value={form.vision} onChange={change} rows={3} />
      </Section>

      {/* Ranking & Stats */}
      <Section title="Ranking & Stats" subtitle="Numbers shown in the highlight cards.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="World Ranking (number)" name="ranking" value={form.ranking} onChange={change} placeholder="48" />
          <Input label="Ranking label" name="ranking_label" value={form.ranking_label} onChange={change} placeholder="QS World Ranking 2026" />
          <Input label="Total students" name="students" value={form.students} onChange={change} placeholder="25,000+" />
          <Input label="Graduate employment" name="employment_rate" value={form.employment_rate} onChange={change} placeholder="94%" />
          <Input label="Partner countries" name="partner_countries" value={form.partner_countries} onChange={change} placeholder="60+" />
          <Input label="Total campuses" name="total_campuses" value={form.total_campuses} onChange={change} placeholder="4" />
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Website" name="website" value={form.website} onChange={change} placeholder="https://" />
          <Input label="Public Email" name="email" value={form.email} onChange={change} />
          <Input label="Phone" name="phone" value={form.phone} onChange={change} />
          <Input label="Address" name="address" value={form.address} onChange={change} />
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="bg-[#c88410] hover:bg-[#a66d0d] text-white px-8 py-3 rounded-xl font-medium disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save & Publish"}
        </button>
        {initial?.id && (
          <a
            href={`/university?id=${initial.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#c88410] font-medium hover:underline"
          >
            View public page ↗
          </a>
        )}
      </div>
    </form>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      <div className={subtitle ? "space-y-4" : "space-y-4 mt-4"}>{children}</div>
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

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <textarea
        {...props}
        className="w-full border-2 border-gray-200 focus:border-[#c88410] outline-none rounded-xl p-3 text-sm"
      />
    </div>
  );
}

function FileBtn({ label, onChange }) {
  return (
    <label className="text-sm text-[#c88410] font-medium cursor-pointer hover:underline">
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files[0])}
      />
    </label>
  );
}
