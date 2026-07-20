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
import CampusPage from "./pages/CampusPage.jsx";

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


          <Route element={<Layout />}>

            <Route path="/" element={<LandingPage />} />


            <Route path="/profile" element={<Profile />} />


            <Route path="/university" element={<UniversityDetailPage />} />

            {/* Campus Page */}
            <Route path="/campus" element={<CampusPage />} />

            {/* University Documents */}
            <Route
              path="/university/documents"
              element={<UniversityDocuments />}
            />


            <Route path="/homepage" element={<HomePage />} />


            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
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
