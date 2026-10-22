import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import HeroSection        from "../components/shared/heroSection";
import UniversityStats    from "../components/university/universityStats";
import UniversityInfo     from "../components/university/universityInfo";
import UniversityGallery  from "../components/university/universityGallery";
import UniversityCampuses from "../components/university/universityCampuses";
import ContactAdmissions  from "../components/university/ContactAdmissions";
import { getUniversityById } from "../api/university";

export default function UniversityDetailPage() {
  const { id: routeId } = useParams();
  const [params] = useSearchParams();
  const id = routeId || params.get("id");

  const [university, setUniversity] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!id) {
      setError("No university specified.");
      setLoading(false);
      return;
    }

    setUniversity(null);
    setLoading(true);
    setError(null);

    let cancelled = false;
    getUniversityById(id)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setUniversity(data);
        } else {
          setError("University not found.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load university:", err);
          setError("Could not load university data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading university...</p>
        </div>
      </div>
    );
  }

  if (error || !university) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
            fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">University not found</h2>
        <p className="text-sm text-gray-400">{error || "The university you are looking for does not exist."}</p>
      </div>
    );
  }

  return (
    <main className="overflow-x-hidden bg-gray-50 text-gray-900 text-base font-normal">
      {/* Hero — full-width 320 px tall */}
      <HeroSection university={university} />

      {/* Stat cards — overlap the hero's bottom edge */}
      <UniversityStats
        university={university}
        className="-mt-12 sm:-mt-14 relative z-20 pb-4"
      />

      {/* About + Mission */}
      <UniversityInfo university={university} />

      {/* Campus carousel */}
      <UniversityCampuses universityId={university?.id} />

      {/* Contact & Admissions band — below campus cards */}
      <ContactAdmissions university={university} />

      {/* Photo gallery */}
      <UniversityGallery universityId={university?.id} />
    </main>
  );
}
