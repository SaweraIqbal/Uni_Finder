import HeroSection from "../components/heroSection";
import HostelCarousel from "../components/hostelCarousel";
import UniversityInfo from "../components/universityInfo";
import UniversityStats from "../components/universityStats";

export default function UniversityDetailPage() {
  return (
    <main className="overflow-x-hidden bg-gray-50 text-gray-900 text-base font-normal">
      <HeroSection />
      <UniversityInfo />
      <UniversityStats />
      <HostelCarousel />
    </main>
  );
}
