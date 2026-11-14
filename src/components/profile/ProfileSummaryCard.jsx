/**
 * ProfileSummaryCard — summary card with public profile photo.
 *
 * Photos are now stored at /uploads/students/avatars/{userId}_avatar.jpg
 * and served as static files — no auth header needed for <img> tags.
 * Sensitive documents (CNIC, transcripts) remain private.
 */
import { useRef } from "react";
import ProgressBar from "./ProgressBar";
import { LEVELS } from "../../config/profileRequirements";
import { uploadAvatar } from "../../api/studentProfile";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const BASE = "http://localhost:5000";

/** Build a full displayable URL for a photo (public path). */
function photoSrc(url, displayName) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BASE}${url}`;
}

export default function ProfileSummaryCard({ profile, completeness, onLevelChange, onAvatarSaved }) {
  const { updateUser } = useAuth();
  const avatarRef = useRef(null);

  const pct         = completeness?.percentage ?? profile?.profile_completeness ?? 0;
  const displayName = profile?.full_name || profile?.name || "Student";
  const email       = profile?.signup_email || profile?.email || "";
  const level       = profile?.target_level || "BS";

  // Priority: profile photo → signup avatar → generated initials
  const avatarSrc =
    photoSrc(profile?.photo_url, displayName) ??
    photoSrc(profile?.avatar_url, displayName) ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=f97316&color=fff&size=300`;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }

    const { ok, data } = await uploadAvatar(file);
    if (!ok) { toast.error(data?.message || "Photo upload failed"); return; }

    // Update navbar avatar in AuthContext
    updateUser({ avatar: `${BASE}${data.url}` });
    onAvatarSaved?.(data.url);
    toast.success("Profile photo updated");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

        {/* ── Avatar ── */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-orange-200 bg-slate-100">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=f97316&color=fff&size=300`;
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            title="Change photo"
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-orange-500 hover:bg-orange-600
              text-white rounded-full flex items-center justify-center shadow transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414A2 2 0 018.586 12.5z" />
            </svg>
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="sr-only"
            onChange={handleAvatarChange}
          />
        </div>

        {/* ── Name + email + completeness ── */}
        <div className="flex-1 min-w-0 w-full text-center sm:text-left">
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight truncate">{displayName}</h1>
          {email && <p className="text-sm text-slate-400 mt-0.5 truncate">{email}</p>}
          <div className="mt-3 w-full max-w-xs sm:max-w-none">
            <ProgressBar percentage={pct} />
          </div>
        </div>

        {/* ── Target level selector ── */}
        <div className="flex-shrink-0 text-center sm:text-right">
          <label className="block text-xs text-slate-400 font-medium mb-1.5">Target Level</label>
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-end">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLevelChange(l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors
                  ${l === level
                    ? "bg-orange-500 text-white border-orange-500"
                    : "text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-600"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
