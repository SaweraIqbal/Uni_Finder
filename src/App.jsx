import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import { showFlashOnce } from "./utils/flash";

function FlashToaster() {
  const location = useLocation();
  useEffect(() => {
    showFlashOnce();
  }, [location.pathname]);
  return null;
}

import Layout from "./components/Layout";
import LandingPage from "./pages/landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HomePage from "./pages/homepage.jsx";
import Profile from "./pages/profile.jsx";
import AdminDashboard from "./pages/AdminDashboard";
import UniversityDocuments from "./pages/UniversityDocuments.jsx";
import UniversityDashboard from "./pages/UniversityDashboard.jsx";
import CampusDashboard from "./pages/CampusDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import UniversityDetailPage from "./pages/UniversityDetailPage.jsx";
import CampusDetailPage from "./pages/CampusDetailPage.jsx";
import CompareCampusesPage from "./pages/CompareCampusesPage.jsx";

// Campus Registration pre-dashboard flow
// Routes: /campus/register  and  /campus/registration-status
// These are shown BEFORE dashboard access (status ≠ "approved").
// TODO: In production, CampusDashboard or ProtectedRoute redirects here when status ≠ approved.
import CampusRegisterPage from "./pages/CampusRegisterPage.jsx";
import CampusRegistrationStatusPage from "./pages/CampusRegistrationStatusPage.jsx";
import { CampusRegistrationProvider } from "./context/CampusRegistrationContext.jsx";

/**
 * Layout wrapper that provides CampusRegistrationProvider to both
 * /campus/register and /campus/registration-status so they share state.
 * Uses <Outlet /> so react-router renders the matched child route inside.
 */
function CampusRegLayout() {
  return (
    <CampusRegistrationProvider>
      <Outlet />
    </CampusRegistrationProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="bottom-right" autoClose={3000} />
        <FlashToaster />
        <Routes>
          {/* ── Auth ── */}
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
          <Route path="/signup/:role"   element={<Signup />} />

          {/* ── University Admin Dashboard ── */}
          <Route
            path="/university/dashboard"
            element={
              <ProtectedRoute role="university">
                <UniversityDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Campus Admin Dashboard (approved state) ──
           *   CampusDashboard checks request status internally:
           *   - approved   → renders CampusAdminDashboard (10-page shell)
           *   - pending    → renders pending status UI
           *   - rejected   → renders rejected UI with resubmit form
           *   TODO: redirect pending/rejected to /campus/registration-status
           *         so both flows use the same status page.
           */}
          <Route
            path="/campus/dashboard"
            element={
              <ProtectedRoute role="campus">
                <CampusDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Campus Registration pre-dashboard flow ──
           *   Shared CampusRegistrationProvider keeps form + status state
           *   in sync between the form page and the status page.
           *   TODO: Wrap with ProtectedRoute role="campus" when auth is enforced.
           */}
          <Route element={<CampusRegLayout />}>
            <Route
              path="/campus/register"
              element={<CampusRegisterPage />}
            />
            <Route
              path="/campus/registration-status"
              element={<CampusRegistrationStatusPage />}
            />
          </Route>

          {/* ── Super Admin Dashboard ── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Public routes (shared Layout with Navbar/Footer) ── */}
          <Route element={<Layout />}>
            <Route path="/"                    element={<LandingPage />} />
            <Route path="/profile"             element={<Profile />} />
            <Route path="/homepage"            element={<HomePage />} />
            <Route path="/university"          element={<UniversityDetailPage />} />
            <Route path="/universities/:id"    element={<UniversityDetailPage />} />
            <Route path="/campus-detail"       element={<CampusDetailPage />} />
            <Route path="/compare-campuses"    element={<CompareCampusesPage />} />
            <Route path="/university/documents" element={<UniversityDocuments />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
