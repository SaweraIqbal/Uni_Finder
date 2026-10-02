import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  Users,
} from "lucide-react";
import { useUniversityAdmin } from "./UniversityAdminContext";
import { Input, PageHeader, StatusChip, Textarea } from "./ui";
import { patchMeProfile, uploadMeLogo, uploadMeBanner } from "../../api/university";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Accept PNG and JPG only — no SVG, no WebP (per spec) */
const ACCEPT = "image/png,image/jpeg";
const MAX_LOGO_MB   = 2;
const MAX_BANNER_MB = 5;

function validateImageFile(file, maxMb) {
  if (!file) return "No file selected.";
  const okType = file.type === "image/png" || file.type === "image/jpeg";
  if (!okType) return "Only PNG and JPG images are accepted. SVG is not allowed.";
  if (file.size > maxMb * 1024 * 1024) return `File must be under ${maxMb} MB.`;
  return null;
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

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

// ── Image upload widget ───────────────────────────────────────────────────────

function ImageUploadWidget({
  label, hint, currentUrl, maxMb, inputRef,
  uploading, uploadError, onFileChange,
}) {
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
      {currentUrl ? (
        <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <img
            src={currentUrl}
            alt={label}
            loading="lazy"
            className="w-full object-contain max-h-28"
            onError={(e) => { e.currentTarget.src = ""; e.currentTarget.style.display = "none"; }}
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
            PNG or JPG · max {maxMb} MB
          </span>
        </button>
      )}
      {uploadError && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">{uploadError}</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UniversityProfileSection() {
  const {
    university,
    stats,
    loadingMe,
    loadingStats,
    addToast,
    refetch,
  } = useUniversityAdmin();

  // ── Editable form state (initialised from /me data) ──────────────────────
  const [form, setForm] = useState({
    established_year:  "",
    about_text:        "",
    mission_statement: "",
    active_students:   "",
  });
  const [formDirty,    setFormDirty]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState(null);

  // ── Image state ───────────────────────────────────────────────────────────
  const [logoUrl,      setLogoUrl]      = useState(null);
  const [bannerUrl,    setBannerUrl]    = useState(null);
  const [uploadingLogo,   setUploadingLogo]   = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoError,    setLogoError]    = useState(null);
  const [bannerError,  setBannerError]  = useState(null);

  const logoRef   = useRef(null);
  const bannerRef = useRef(null);

  // Populate form when /me data arrives
  useEffect(() => {
    if (!university) return;
    setForm({
      established_year:  university.established_year ?? "",
      about_text:        university.about_text        ?? "",
      mission_statement: university.mission_statement ?? "",
      active_students:   university.active_students   ?? 0,
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

  // ── Save Changes (optimistic: update local state, rollback on failure) ────
  const handleSave = async () => {
    if (!formDirty || saving) return;
    const snapshot = { ...form };

    // Optimistic local update
    setSaving(true);
    setSaveError(null);

    const payload = {};
    if (form.established_year !== "" && form.established_year !== null) {
      payload.established_year = Number(form.established_year);
    }
    if (form.about_text        !== undefined) payload.about_text        = form.about_text;
    if (form.mission_statement !== undefined) payload.mission_statement = form.mission_statement;
    if (form.active_students   !== "")       payload.active_students    = Number(form.active_students);

    try {
      const { ok, data } = await patchMeProfile(payload);
      if (!ok) {
        // Rollback
        setForm(snapshot);
        setSaveError(data?.error?.message || data?.error?.fields
          ? Object.values(data.error.fields || {}).join(" ")
          : "Could not save changes.");
        addToast("Changes could not be saved.", "error");
      } else {
        setFormDirty(false);
        addToast("Profile saved successfully.", "success");
        refetch(); // refresh /me and /me/stats
      }
    } catch {
      setForm(snapshot);
      setSaveError("Network error — changes not saved.");
      addToast("Network error — changes not saved.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Logo upload ────────────────────────────────────────────────────────────
  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setLogoError(null);
    const err = validateImageFile(file, MAX_LOGO_MB);
    if (err) { setLogoError(err); return; }

    // Optimistic preview
    const previewUrl = URL.createObjectURL(file);
    setLogoUrl(previewUrl);
    setUploadingLogo(true);
    try {
      const { ok, status, data } = await uploadMeLogo(file);
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

  // ── Banner upload ──────────────────────────────────────────────────────────
  const handleBannerFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setBannerError(null);
    const err = validateImageFile(file, MAX_BANNER_MB);
    if (err) { setBannerError(err); return; }

    const previewUrl = URL.createObjectURL(file);
    setBannerUrl(previewUrl);
    setUploadingBanner(true);
    try {
      const { ok, status, data } = await uploadMeBanner(file);
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

  // ── Skeleton while loading ─────────────────────────────────────────────────
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

      {/* ── HEC Institutional Identity (read-only) ── */}
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

      {/* ── Institution Statistics (from /me/stats) ── */}
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

      {/* ── Editable Metadata ── */}
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
          {/* TODO(DEFAULT): replaced by SUM(campuses.active_students) when campus module lands */}

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

      {/* ── Logo & Banner ── */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-800">Logo & Banner</h2>
          <p className="text-xs text-slate-400 mt-0.5">PNG or JPG only. SVG is not accepted.</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ImageUploadWidget
            label="University Logo"
            hint={`PNG or JPG · max ${MAX_LOGO_MB} MB · resized to 512 px`}
            currentUrl={logoUrl}
            maxMb={MAX_LOGO_MB}
            inputRef={logoRef}
            uploading={uploadingLogo}
            uploadError={logoError}
            onFileChange={handleLogoFile}
          />
          <ImageUploadWidget
            label="Hero / Banner Image"
            hint={`PNG or JPG · max ${MAX_BANNER_MB} MB · resized to 1920 px wide`}
            currentUrl={bannerUrl}
            maxMb={MAX_BANNER_MB}
            inputRef={bannerRef}
            uploading={uploadingBanner}
            uploadError={bannerError}
            onFileChange={handleBannerFile}
          />
        </div>
      </section>

      {/* ── Domain verification info (read-only status from /me) ── */}
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
