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
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ProgramSearchResults from "./pages/ProgramSearchResults";
import HomePage from "./pages/homepage.jsx";
import Profile from "./pages/StudentProfile.jsx";
import UniversityDocuments from "./pages/UniversityDocuments.jsx";
import ProtectedRoute, { PublicOnlyRoute } from "./components/shared/ProtectedRoute";
import UniversityDetailPage from "./pages/UniversityDetailPage.jsx";
import CampusDetailPage from "./pages/CampusDetailPage.jsx";
import CompareCampusesPage from "./pages/CompareCampusesPage.jsx";
import HostelOwnerDashboard from "./pages/hostel/HostelOwnerDashboard";
import HostelRegistrationPage from "./pages/hostel/HostelRegistrationPage.jsx";
import HostelRegistrationStatusPage from "./pages/hostel/HostelRegistrationStatusPage.jsx";
import PublicHostelDetailPage from "./pages/hostel/PublicHostelDetailPage.jsx";

// Campus Registration pre-dashboard flow
import CampusRegisterPage from "./pages/CampusRegisterPage.jsx";
import CampusRegistrationStatusPage from "./pages/CampusRegistrationStatusPage.jsx";
import { CampusRegistrationProvider } from "./context/CampusRegistrationContext.jsx";

import AdminDashboard from "./pages/superAdmin/AdminDashboard.jsx";
import UniversityDashboard from "./pages/UniversityDashboard.jsx";
import CampusDashboard from "./pages/campusAdmin/CampusDashboard.jsx";

// import CompareUniversitiesPage from "./pages/compareUniversities.jsx";

/**
 * Dono campus registration pages ko ek hi provider ke andar rakhta hai,
 * taake form aur status ki state share ho.
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
        <ToastContainer position="top-right" autoClose={2500} />
        <FlashToaster />
        <Routes>
          <Route path="/login" element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          } />
          <Route path="/signup" element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          } />
          <Route path="/signup/:role" element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          } />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/search" element={
            <ProtectedRoute role="student">
              <ProgramSearchResults />
            </ProtectedRoute>
          } />
          <Route
            path="/university/dashboard"
            element={
              <ProtectedRoute role="university">
                <UniversityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hostel/registration-status"
            element={
              <ProtectedRoute role={["hostel", "campus_hostel"]}>
                <HostelRegistrationStatusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campus/dashboard"
            element={
              <ProtectedRoute role="campus">
                <CampusDashboard />
              </ProtectedRoute>
            }
          />

          {/* â”€â”€ Campus Registration flow (dashboard se pehle) â”€â”€ */}
          <Route element={<CampusRegLayout />}>
            <Route path="/campus/register" element={<CampusRegisterPage />} />
            <Route
              path="/campus/registration-status"
              element={<CampusRegistrationStatusPage />}
            />
          </Route>

          <Route
            path="/hostel/register/:role"
            element={
              <ProtectedRoute role={["hostel", "campus_hostel"]}>
                <HostelRegistrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route element={<Layout />}>
            <Route path="/hostels/:id" element={<PublicHostelDetailPage />} />
            <Route path="/" element={
              <PublicOnlyRoute>
                <LandingPage />
              </PublicOnlyRoute>
            } />

            <Route
              path="/profile"
              element={
                <ProtectedRoute role="student">
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* <Route
              path="/compareUniversitiesPage"
              element={<CompareUniversitiesPage />}
            /> */}

            <Route
              path="/university"
              element={
                <ProtectedRoute role="student">
                  <UniversityDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/universities/:id"
              element={
                <ProtectedRoute role="student">
                  <UniversityDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Campus Detail Page (data-driven, accepts ?id=) */}
            <Route
              path="/campus-detail"
              element={
                <ProtectedRoute role="student">
                  <CampusDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Compare Campuses Page */}
            <Route
              path="/compare-campuses"
              element={
                <ProtectedRoute role="student">
                  <CompareCampusesPage />
                </ProtectedRoute>
              }
            />

            {/* University Documents */}
            <Route
              path="/university/documents"
              element={
                <ProtectedRoute role="student">
                  <UniversityDocuments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/homepage"
              element={
                <ProtectedRoute role="student">
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hostel/dashboard"
              element={
                <ProtectedRoute role={["hostel", "campus_hostel"]}>
                  <HostelOwnerDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
