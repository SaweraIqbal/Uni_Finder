import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeroSection from "../components/heroSection";
import HostelCarousel from "../components/hostelCarousel";
import UniversityInfo from "../components/universityInfo";
import UniversityStats from "../components/universityStats";
import UniversityPrograms from "../components/universityPrograms";
import UniversityGallery from "../components/universityGallery";
import { getUniversityById, listUniversities } from "../api/university";

export default function UniversityDetailPage() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const [university, setUniversity] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        if (id) {
          setUniversity(await getUniversityById(id));
        } else {
          // No id given — show the first available real university (if any).
          const all = await listUniversities();
          if (Array.isArray(all) && all.length) {
            setUniversity(await getUniversityById(all[0].id));
          }
        }
      } catch {
        // fall back to placeholder content
      }
    })();
  }, [id]);

  // `university` may be null -> components fall back to their placeholder text.
  return (
    <main className="overflow-x-hidden bg-gray-50 text-gray-900 text-base font-normal">
      <HeroSection university={university} />
      <UniversityInfo university={university} />
      <UniversityStats university={university} />
      <UniversityPrograms universityId={university?.id} />
      <UniversityGallery universityId={university?.id} />
      <HostelCarousel />
    </main>
  );
}
