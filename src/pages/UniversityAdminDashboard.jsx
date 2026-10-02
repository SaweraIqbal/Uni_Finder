import { UniversityAdminProvider, useUniversityAdmin } from "../components/universityAdmin/UniversityAdminContext";
import { Footer, Header, Sidebar } from "../components/universityAdmin/Layout";
import { SideSheet } from "../components/universityAdmin/ui";
import OverviewSection from "../components/universityAdmin/OverviewSection";
import UniversityProfileSection from "../components/universityAdmin/UniversityProfileSection";
import CampusApprovalsSection from "../components/universityAdmin/CampusApprovalsSection";
import ProgramRequestsSection from "../components/universityAdmin/ProgramRequestsSection";
import ActivityLogSection from "../components/universityAdmin/ActivityLogSection";
import ProgramsSection from "../components/universityAdmin/ProgramsSection";

function DashboardInner() {
  const { currentPage } = useUniversityAdmin();

  const pages = {
    overview:           <OverviewSection />,
    profile:            <UniversityProfileSection />,
    campuses:           <CampusApprovalsSection />,
    programs:           <ProgramsSection />,
    "program-requests": <ProgramRequestsSection />,
    activity:           <ActivityLogSection />,
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
