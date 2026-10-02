import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import HeroSection from "../components/heroSection";
import HostelCarousel from "../components/hostelCarousel";
import UniversityInfo from "../components/universityInfo";
import UniversityStats from "../components/universityStats";
import UniversityPrograms from "../components/universityPrograms";
import UniversityGallery from "../components/universityGallery";
import UniversityCampuses from "../components/universityCampuses";
import { findUniversity } from "../data/universities";

export default function UniversityDetailPage() {
  const { id: routeId } = useParams();
  const [params] = useSearchParams();
  const id = routeId || params.get("id") || "ucp";

  const university = useMemo(() => findUniversity(id), [id]);

  return (
    <main className="overflow-x-hidden bg-gray-50 text-gray-900 text-base font-normal">
      <HeroSection university={university} />
      <UniversityStats
        university={university}
        className="-mt-12 sm:-mt-14 relative z-20 pb-4"
      />
      <UniversityInfo university={university} />
      <UniversityPrograms universityId={university?.id} />
      <UniversityCampuses universityId={university?.id} />
      <UniversityGallery universityId={university?.id} />
      {/* <HostelCarousel /> */}
    </main>
  );
}
