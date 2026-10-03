import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import HostelOwnerDashboard from "./pages/hostel/HostelOwnerDashboard";

// import CompareUniversitiesPage from "./pages/compareUniversities.jsx";

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
          <Route path="/hostel/dashboard" element={<HostelOwnerDashboard />} />
          <Route
            path="/university/dashboard"
            element={
              <ProtectedRoute role="university">
                <UniversityDashboard />
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

            {/* <Route
              path="/compareUniversitiesPage"
              element={<CompareUniversitiesPage />}
            /> */}

            <Route path="/university" element={<UniversityDetailPage />} />
            <Route
              path="/universities/:id"
              element={<UniversityDetailPage />}
            />

            {/* Campus Page (static demo) */}
            {/* <Route path="/campus" element={<CampusPage />} /> */}

            {/* Campus Detail Page (data-driven, accepts ?id=) */}
            <Route path="/campus-detail" element={<CampusDetailPage />} />

            {/* Compare Campuses Page */}
            <Route path="/compare-campuses" element={<CompareCampusesPage />} />

            {/* University Documents */}
            <Route
              path="/university/documents"
              element={<UniversityDocuments />}
            />

            <Route path="/homepage" element={<HomePage />} />
            <Route
              path="/hostel/dashboard"
              element={
                <ProtectedRoute role="hostel">
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
