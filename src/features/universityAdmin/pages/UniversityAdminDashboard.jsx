import { UniversityAdminProvider, useUniversityAdmin } from "../components/UniversityAdminContext";
import { Footer, Header, Sidebar } from "../components/Layout";
import { SideSheet } from "../components/ui";
import OverviewSection from "../components/OverviewSection";
import UniversityProfileSection from "../components/UniversityProfileSection";
import CampusApprovalsSection from "../components/CampusApprovalsSection";
import ProgramRequestsSection from "../components/ProgramRequestsSection";
import ActivityLogSection from "../components/ActivityLogSection";
import ProgramsSection from "../components/ProgramsSection";
import GallerySection from "../components/GallerySection";

function DashboardInner() {
  const { currentPage } = useUniversityAdmin();

const pages = {
  overview:              <OverviewSection />,
  profile:               <UniversityProfileSection />,
  gallery:               <GallerySection />,
  campuses:              <CampusApprovalsSection />,
  programs:              <ProgramsSection />,
  "program-requests":    <ProgramRequestsSection />,
  activity:              <ActivityLogSection />,
};

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {pages[currentPage] ?? <OverviewSection />}
        </main>
        <Footer />
      </div>
      <SideSheet />
    </div>
  );
}

export default function UniversityAdminDashboard({
  onLogout,
  universityName,
  adminName,
  adminEmail,
}) {
  return (
    <UniversityAdminProvider
      onLogout={onLogout}
      universityName={universityName}
      adminName={adminName}
      adminEmail={adminEmail}
    >
      <DashboardInner />
    </UniversityAdminProvider>
  );
}
