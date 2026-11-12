import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { useUniversityAdmin } from "./UniversityAdminContext";
import { Input, PageHeader, StatusChip, Textarea } from "./ui";
import { patchMeProfile, uploadMeLogo, uploadMeBanner } from "../../university/api/university";

const ACCEPT = "image/png,image/jpeg,image/svg+xml";
const MAX_LOGO_MB   = 2;
const MAX_BANNER_MB = 5;

function validateImageFile(file, maxMb) {
  if (!file) return "No file selected.";
  const okType =
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/svg+xml";
  if (!okType) return "Only PNG, JPG, and SVG images are accepted.";
  if (file.size > maxMb * 1024 * 1024) return `File must be under ${maxMb} MB.`;
  return null;
}

async function toPngFile(file) {
  const svgText = await file.text();
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  const size = Math.max(img.width, img.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  URL.revokeObjectURL(url);

  const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([pngBlob], `${baseName}.png`, { type: "image/png" });
}

function StatTile({ label, value, Icon, color, bg, loading }) {
  return (
    <div className="flex items-center gap-4 bg-slate-50 rounded-2xl px-5 py-4">
      <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-16 rounded bg-slate-200 animate-pulse" />
        ) : (
          <p className={`text-2xl font-bold ${color}`}>{value ?? "—"}</p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ImageUploadWidget({
  label, hint, currentUrl, maxMb, inputRef,
  uploading, uploadError, onFileChange,
}) {

  const [failedUrl, setFailedUrl] = useState(null);
  const showPreview = Boolean(currentUrl) && failedUrl !== currentUrl;

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      <p className="text-xs text-slate-400 mb-2">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onFileChange}
      />
      {showPreview ? (
        <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <img
            src={currentUrl}
            alt={label}
            loading="lazy"
            className="w-full object-contain max-h-28"
            onError={() => setFailedUrl(currentUrl)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Change"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 text-slate-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <span className="w-5 h-5 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
          <span className="text-xs font-medium">
            {uploading ? "Uploading…" : "Choose Image"}
          </span>
            <span className="text-[10px] text-slate-300">
             PNG, JPG, or SVG · max {maxMb} MB
           </span>
        </button>
      )}
      {uploadError && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">{uploadError}</p>
      )}
    </div>
  );
}

export default function UniversityProfileSection() {
  const {
    university,
    stats,
    loadingMe,
    loadingStats,
    addToast,
    refetch,
  } = useUniversityAdmin();

  const [form, setForm] = useState({
    established_year:  "",
    about_text:        "",
    mission_statement: "",
    active_students:   "",
    website_url:       "",
    admissions_email:  "",
    admissions_phone:  "",
  });
  const [formDirty,    setFormDirty]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState(null);

  const [logoUrl,      setLogoUrl]      = useState(null);
  const [bannerUrl,    setBannerUrl]    = useState(null);
  const [uploadingLogo,   setUploadingLogo]   = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoError,    setLogoError]    = useState(null);
  const [bannerError,  setBannerError]  = useState(null);

  const logoRef   = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    if (!university) return;
    setForm({
      established_year:  university.established_year ?? "",
      about_text:        university.about_text        ?? "",
      mission_statement: university.mission_statement ?? "",
      active_students:   university.active_students   ?? 0,
      website_url:       university.website_url       ?? "",
      admissions_email:  university.admissions_email  ?? "",
      admissions_phone:  university.admissions_phone  ?? "",
    });
    setLogoUrl(university.logo_url   || null);
    setBannerUrl(university.banner_url || null);
    setFormDirty(false);
  }, [university]);

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFormDirty(true);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!formDirty || saving) return;
    const snapshot = { ...form };

    setSaving(true);
    setSaveError(null);

    const payload = {};
    if (form.established_year !== "" && form.established_year !== null) {
      payload.established_year = Number(form.established_year);
    }
    if (form.about_text        !== undefined) payload.about_text        = form.about_text;
    if (form.mission_statement !== undefined) payload.mission_statement = form.mission_statement;
    if (form.active_students   !== "")       payload.active_students    = Number(form.active_students);

    payload.website_url      = form.website_url      ?? "";
    payload.admissions_email = form.admissions_email ?? "";
    payload.admissions_phone = form.admissions_phone ?? "";

    try {
      const { ok, data } = await patchMeProfile(payload);
      if (!ok) {

        setForm(snapshot);
        setSaveError(data?.error?.message || data?.error?.fields
          ? Object.values(data.error.fields || {}).join(" ")
          : "Could not save changes.");
        addToast("Changes could not be saved.", "error");
      } else {
        setFormDirty(false);
        addToast("Profile saved successfully.", "success");
        refetch();
      }
    } catch {
      setForm(snapshot);
      setSaveError("Network error — changes not saved.");
      addToast("Network error — changes not saved.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setLogoError(null);
    const err = validateImageFile(file, MAX_LOGO_MB);
    if (err) { setLogoError(err); return; }

    const isSvg = file.type === "image/svg+xml";
    const uploadFile = isSvg ? await toPngFile(file) : file;

    const previewUrl = URL.createObjectURL(uploadFile);
    setLogoUrl(previewUrl);
    setUploadingLogo(true);
    try {
      const { ok, status, data } = await uploadMeLogo(uploadFile);
      if (status === 415) {
        setLogoUrl(university?.logo_url || null);
        setLogoError("Only PNG and JPG images are accepted. SVG is not allowed.");
        return;
      }
      if (!ok) {
        setLogoUrl(university?.logo_url || null);
        setLogoError(data?.error?.message || "Logo upload failed.");
        return;
      }
      setLogoUrl(data.logo_url);
      addToast("Logo updated.", "success");
      refetch();
    } catch {
      setLogoUrl(university?.logo_url || null);
      setLogoError("Network error — logo not uploaded.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setBannerError(null);
    const err = validateImageFile(file, MAX_BANNER_MB);
    if (err) { setBannerError(err); return; }

    const isSvg = file.type === "image/svg+xml";
    const uploadFile = isSvg ? await toPngFile(file) : file;

    const previewUrl = URL.createObjectURL(uploadFile);
    setBannerUrl(previewUrl);
    setUploadingBanner(true);
    try {
      const { ok, status, data } = await uploadMeBanner(uploadFile);
      if (status === 415) {
        setBannerUrl(university?.banner_url || null);
        setBannerError("Only PNG and JPG images are accepted. SVG is not allowed.");
        return;
      }
      if (!ok) {
        setBannerUrl(university?.banner_url || null);
        setBannerError(data?.error?.message || "Banner upload failed.");
        return;
      }
      setBannerUrl(data.banner_url);
      addToast("Banner updated.", "success");
      refetch();
    } catch {
      setBannerUrl(university?.banner_url || null);
      setBannerError("Network error — banner not uploaded.");
    } finally {
      setUploadingBanner(false);
    }
  };

  if (loadingMe && !university) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-64 rounded bg-slate-200 animate-pulse" />
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-5 rounded bg-slate-100 animate-pulse" style={{ width: `${60 + i * 7}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const uni = university || {};
  const rankDisplay = uni.hec_rank != null ? `#${uni.hec_rank}` : "Unranked";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8 min-w-0">
      <PageHeader
        title="University Profile"
        subtitle="HEC-sourced data is read-only. Edit profile metadata below."
      />

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900/10">
            <Building2 className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Institutional Identity</h2>
            <p className="text-xs text-slate-400">Read-only · Sourced from HEC Master List</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { label: "University Name",  value: uni.name            || "—" },
            { label: "Sector",           value: uni.university_type || "—" },
            { label: "HEC Recognition",  value: "Recognized",         badge: true },
            { label: "ORIC Domain",      value: uni.oric_domain      || "Not available" },
            { label: "HEC National Rank",value: rankDisplay },
            { label: "Focal Person",     value: uni.focal_person_name  || "—" },
            { label: "Focal Email",      value: uni.focal_person_email || "—" },
            { label: "Campus Count",     value: uni.campus_count != null ? String(uni.campus_count) : "—" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <p className="text-xs text-slate-400 font-medium">{item.label}</p>
              {item.badge ? (
                <StatusChip status="verified" label={item.value} />
              ) : (
                <p className="text-sm font-semibold text-slate-800 break-all">{item.value}</p>
              )}
              <p className="text-[10px] text-slate-300">Source: HEC Master List</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-800">Institution Statistics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Live aggregates from platform records</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label="Campuses"
            value={uni.campus_count ?? "—"}
            Icon={MapPin}
            color="text-orange-600"
            bg="bg-orange-50"
            loading={loadingMe}
          />
          <StatTile
            label="Total Programs"
            value={stats?.program_count ?? "—"}
            Icon={BookOpen}
            color="text-blue-600"
            bg="bg-blue-50"
            loading={loadingStats}
          />
          <StatTile
            label="Active Students"
            value={typeof form.active_students === "number" || form.active_students !== ""
              ? Number(form.active_students).toLocaleString()
              : "—"}
            Icon={Users}
            color="text-green-600"
            bg="bg-green-50"
            loading={loadingMe}
          />
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-800">Editable Metadata</h2>
          <p className="text-xs text-slate-400 mt-0.5">Displayed publicly on UniFinder.</p>
        </div>
        <div className="p-6 space-y-5">
          <Input
            label="Established Year"
            type="number"
            min={600}
            max={new Date().getFullYear()}
            value={form.established_year}
            onChange={handleFormChange("established_year")}
            placeholder="e.g. 1882"
          />
          <Textarea
            label="About the University"
            rows={4}
            value={form.about_text}
            onChange={handleFormChange("about_text")}
            placeholder="Describe your university…"
          />
          <Textarea
            label="Mission Statement"
            rows={3}
            value={form.mission_statement}
            onChange={handleFormChange("mission_statement")}
            placeholder="Your mission…"
          />
          <Input
            label="Active Students"
            type="number"
            min={0}
            value={form.active_students}
            onChange={handleFormChange("active_students")}
            placeholder="e.g. 12000"
          />

          {saveError && (
            <p className="text-sm text-red-600" role="alert">{saveError}</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !formDirty}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {saving && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {saving ? "Saving…" : formDirty ? "Save Changes" : "Saved ✓"}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 shrink-0">
            <Globe className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Contact &amp; Web Presence</h2>
            <p className="text-xs text-slate-400 mt-0.5">Shown to students on your public profile.</p>
          </div>
        </div>
        <div className="p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Website URL
              </span>
            </label>
            <Input
              type="url"
              value={form.website_url}
              onChange={handleFormChange("website_url")}
              placeholder="https://www.university.edu.pk"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Admissions Email
                </span>
              </label>
              <Input
                type="email"
                value={form.admissions_email}
                onChange={handleFormChange("admissions_email")}
                placeholder="admissions@university.edu.pk"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Admissions Phone
                </span>
              </label>
              <Input
                type="tel"
                value={form.admissions_phone}
                onChange={handleFormChange("admissions_phone")}
                placeholder="+92 51 123 4567"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-800">Logo & Banner</h2>
          <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, or SVG (SVG converted to PNG). Resized to 512 px.</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ImageUploadWidget
            label="University Logo"
            hint={`PNG, JPG, or SVG · max ${MAX_LOGO_MB} MB · SVG converted to PNG`}
            currentUrl={logoUrl}
            maxMb={MAX_LOGO_MB}
            inputRef={logoRef}
            uploading={uploadingLogo}
            uploadError={logoError}
            onFileChange={handleLogoFile}
          />
          <ImageUploadWidget
            label="Hero / Banner Image"
            hint={`PNG, JPG, or SVG · max ${MAX_BANNER_MB} MB · SVG converted to PNG`}
            currentUrl={bannerUrl}
            maxMb={MAX_BANNER_MB}
            inputRef={bannerRef}
            uploading={uploadingBanner}
            uploadError={bannerError}
            onFileChange={handleBannerFile}
          />
        </div>
      </section>

      {uni.verification && (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">Domain Verification</h2>
          </div>
          <div className="p-6 flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${uni.verification.domain_verified ? "bg-green-50" : "bg-amber-50"}`}>
              {uni.verification.domain_verified
                ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : <Building2    className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <StatusChip
                status={uni.verification.domain_verified ? "verified" : "pending"}
                label={uni.verification.domain_verified ? "Domain Verified" : "Domain Not Verified"}
              />
              <p className="text-xs text-slate-500 mt-2">
                {uni.oric_domain
                  ? `Official domain: ${uni.oric_domain}`
                  : "No ORIC domain on record — authorization letter required."}
              </p>
              {!uni.verification.domain_verified && uni.verification.loe_on_file && (
                <p className="text-xs text-green-700 mt-1">✅ Authorization letter on file.</p>
              )}
              {!uni.verification.domain_verified && !uni.verification.loe_on_file && (
                <p className="text-xs text-amber-700 mt-1">⚠ No authorization letter on file.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
