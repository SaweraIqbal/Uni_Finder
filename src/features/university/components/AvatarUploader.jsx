import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "react-toastify";
import { uploadAvatar } from "../api/university";
import { fileUrl } from "../../../shared/api/client";

export default function AvatarUploader({ uid, avatarUrl, name = "", onUploaded, size = 96 }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const resolve = (u) => (!u ? null : u.startsWith("http") ? u : fileUrl(u));
  const src =
    preview ||
    resolve(avatarUrl) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=c88410&color=fff`;

  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const { ok, data } = await uploadAvatar(uid, file);
      if (ok) {
        toast.success("Profile picture updated");
        onUploaded?.(fileUrl(data.avatar_url));
      } else {
        toast.error(data.message || "Upload failed");
        setPreview(null);
      }
    } catch {
      toast.error("Something went wrong");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#c88410] bg-gray-100 shadow">
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      </div>

      <label
        title="Change profile picture"
        className={`absolute bottom-0 right-0 bg-[#c88410] hover:bg-[#a66d0d] text-white rounded-full p-1.5 cursor-pointer shadow flex items-center justify-center ${
          busy ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <Pencil width={14} height={14} />
        <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
      </label>
    </div>
  );
}

