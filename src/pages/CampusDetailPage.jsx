import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getCampusDetail, CAMPUS_DEFAULT_IMAGE } from "../api/campus";
import { fileUrl } from "../api/client";
import CampusHeroSection from "../components/campus/CampusHeroSection";
import BentoStats from "../components/campus/BentoStats";
import CampusDetail from "../components/campus/campusDetail";
import ApplyCard from "../components/campus/ApplyCard";

export default function CampusDetailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");
  const [campus, setCampus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (id) {
          const data = await getCampusDetail(id);
          if (active) setCampus(data);
        }
      } catch {

      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        Loading campus…
      </div>
    );
  }

  if (!campus) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <span className="text-5xl mb-4">🏫</span>
        <h2 className="text-lg font-semibold text-slate-700 mb-1">
          Campus not found
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 text-sm font-medium text-orange-500 hover:underline"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const heroImage =
    (campus.images?.[0] && fileUrl(campus.images[0].image_url)) ||
    fileUrl(campus.university_banner) ||
    CAMPUS_DEFAULT_IMAGE;

  const location = [campus.city, campus.university_name]
    .filter(Boolean)
    .join(" · ");

  const onApply = () => navigate("/login");

  return (
    <main className="font-sans bg-white text-slate-900">
      <CampusHeroSection
        universityName={campus.name}
        location={location || "—"}
        campusType="Campus"
        heroImage={heroImage}
        onBack={() => navigate(-1)}
      />
      <BentoStats heroImage={heroImage} onApply={onApply} />
      <CampusDetail programs={campus.programs} />
      <ApplyCard onApply={onApply} onDownload={onApply} />
    </main>
  );
}
