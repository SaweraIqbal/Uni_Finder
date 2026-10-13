/**
 * CampusAdminDashboard.jsx
 * Root shell — renders Sidebar + Header + Footer + active page
 * Wrap with <CampusAdminProvider> before mounting.
 */
import { useState } from "react";
import { Sidebar, Header, Footer } from "./Layout";
import { useCampusAdmin } from "./CampusAdminContext";

// Pages
import OverviewPage,          { OverviewActions }          from "./pages/OverviewPage";
import CampusProfilePage                                   from "./pages/CampusProfilePage";
import ProgramOfferingsPage,  { ProgramOfferingsActions }  from "./pages/ProgramOfferingsPage";
import ProgramRequestsPage                                 from "./pages/ProgramRequestsPage";
import FacilitiesPage                                      from "./pages/FacilitiesPage";
import GalleryPage,           { GalleryActions }           from "./pages/GalleryPage";
import SocietiesPage,         { SocietiesActions }         from "./pages/SocietiesPage";
import HostelsPage                                         from "./pages/HostelsPage";
import HostelApprovalsPage                                 from "./pages/HostelApprovalsPage";
import ActivityLogPage                                     from "./pages/ActivityLogPage";

/* ─── Per-page right-side header actions ─────────────────────────────────── */
function PageActions({ page, uploadOpen, setUploadOpen, addSociety, setAddSociety }) {
  switch (page) {
    case "overview":
      return <OverviewActions />;
    case "gallery":
      return <GalleryActions onUpload={() => setUploadOpen(true)} />;
    case "societies":
      return <SocietiesActions onAdd={() => setAddSociety(true)} />;
    default:
      return null;
  }
}

/* ─── Page renderer ──────────────────────────────────────────────────────── */
function ActivePage({ page, galleryUploadTrigger, societyAddTrigger }) {
  switch (page) {
    case "overview":          return <OverviewPage />;
    case "campus-profile":    return <CampusProfilePage />;
    case "program-offerings": return <ProgramOfferingsPage />;
    case "program-requests":  return <ProgramRequestsPage />;
    case "facilities":        return <FacilitiesPage />;
    case "gallery":           return <GalleryPage externalUploadTrigger={galleryUploadTrigger} />;
    case "societies":         return <SocietiesPage externalAddTrigger={societyAddTrigger} />;
    case "hostels":           return <HostelsPage />;
    case "hostel-approvals":  return <HostelApprovalsPage />;
    case "activity":          return <ActivityLogPage />;
    default:                  return <OverviewPage />;
  }
}

/* ─── Shell ──────────────────────────────────────────────────────────────── */
export default function CampusAdminDashboard() {
  const { currentPage } = useCampusAdmin();

  // These let Header action buttons communicate intent to their page
  const [galleryUpload, setGalleryUpload] = useState(0);
  const [societyAdd,    setSocietyAdd]    = useState(0);

  const rightContent = (
    <PageActions
      page={currentPage}
      uploadOpen={galleryUpload}
      setUploadOpen={() => setGalleryUpload((n) => n + 1)}
      addSociety={societyAdd}
      setAddSociety={() => setSocietyAdd((n) => n + 1)}
    />
  );

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Header rightContent={rightContent} />

        {/* Scrollable content area */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-8 py-8">
            <ActivePage
              page={currentPage}
              galleryUploadTrigger={galleryUpload}
              societyAddTrigger={societyAdd}
            />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
