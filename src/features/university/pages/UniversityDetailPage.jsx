import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import HeroSection       from "../../../shared/components/heroSection";
import UniversityStats   from "../components/universityStats";
import UniversityInfo    from "../components/universityInfo";
import UniversityGallery from "../components/universityGallery";
import UniversityCampuses from "../components/universityCampuses";
import ContactAdmissions from "../components/ContactAdmissions";
import { getUniversityById } from "../api/university";
import { findUniversity }    from "../../../data/universities";

export default function UniversityDetailPage() {
  const { id: routeId } = useParams();
  const [params] = useSearchParams();
  const id = routeId || params.get("id") || "ucp";

  const [university, setUniversity] = useState(() => findUniversity(id));
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {

    setUniversity(findUniversity(id));
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

  return (
    <main className="overflow-x-hidden bg-gray-50 text-gray-900 text-base font-normal">

      <HeroSection university={university} />

      <UniversityStats
        university={university}
        className="-mt-12 sm:-mt-14 relative z-20 pb-4"
      />

      <UniversityInfo university={university} />

      <UniversityCampuses universityId={university?.id} />

      <ContactAdmissions university={university} />

      <UniversityGallery universityId={university?.id} />

      {error && (
        <div
          role="alert"
          className="
            fixed bottom-4 right-4 z-50
            bg-white border border-orange-200 text-orange-700
            text-sm rounded-xl px-4 py-3 shadow-lg max-w-xs
          "
        >
          <span className="font-semibold">Note: </span>{error}
          <span className="text-slate-400"> Showing cached data.</span>
        </div>
      )}
    </main>
  );
}

