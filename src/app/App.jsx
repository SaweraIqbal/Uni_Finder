import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "../features/auth/AuthContext";
import { showFlashOnce } from "../shared/utils/flash";

function FlashToaster() {
  const location = useLocation();
  useEffect(() => {
    showFlashOnce();
  }, [location.pathname]);
  return null;
}

import Layout from "../shared/components/Layout";
import LandingPage from "../features/landing/pages/landing";
import Login from "../features/auth/pages/Login";
import Signup from "../features/auth/pages/Signup";
import ResetPassword from "../features/auth/pages/ResetPassword";
import VerifyEmail from "../features/auth/pages/VerifyEmail";
import ProgramSearchResults from "../features/search/pages/ProgramSearchResults";
import HomePage from "../features/home/pages/homepage.jsx";
import Profile from "../features/profile/pages/profile.jsx";
import UniversityDocuments from "../features/university/pages/UniversityDocuments.jsx";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import UniversityDetailPage from "../features/university/pages/UniversityDetailPage.jsx";
import CampusDetailPage from "../features/campus/pages/CampusDetailPage.jsx";
import CompareCampusesPage from "../features/campus/pages/CompareCampusesPage.jsx";
import HostelOwnerDashboard from "../features/hostel/pages/HostelOwnerDashboard";
import HostelRegistrationPage from "../features/hostel/pages/HostelRegistrationPage.jsx";
import HostelRegistrationStatusPage from "../features/hostel/pages/HostelRegistrationStatusPage.jsx";
import HostelDetailPage from "../features/hostel/pages/HostelDetailPage.jsx";

import CampusRegisterPage from "../features/campusRegistration/pages/CampusRegisterPage.jsx";
import CampusRegistrationStatusPage from "../features/campusRegistration/pages/CampusRegistrationStatusPage.jsx";
import { CampusRegistrationProvider } from "../features/campusRegistration/CampusRegistrationContext.jsx";

import AdminDashboard from "../features/admin/pages/AdminDashboard.jsx";
import UniversityDashboard from "../features/university/pages/UniversityDashboard.jsx";
import CampusDashboard from "../features/campusAdmin/pages/CampusDashboard.jsx";

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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/:role" element={<Signup />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/search" element={<ProgramSearchResults />} />
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
            <Route path="/" element={<LandingPage />} />

            <Route path="/profile" element={<Profile />} />

            <Route path="/university" element={<UniversityDetailPage />} />
            <Route
              path="/universities/:id"
              element={<UniversityDetailPage />}
            />

            <Route path="/campus-detail" element={<CampusDetailPage />} />

            <Route path="/compare-campuses" element={<CompareCampusesPage />} />

            <Route
              path="/university/documents"
              element={<UniversityDocuments />}
            />

            <Route path="/homepage" element={<HomePage />} />
            <Route path="/hostels/:id" element={<HostelDetailPage />} />
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
