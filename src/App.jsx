import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Layout from "./components/Layout";
import LandingPage from "./pages/landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HomePage from "./pages/Homepage.jsx";
import Profile from "./pages/profile.jsx";
import AdminDashboard from "./pages/AdminDashboard";
import UniversityDocuments from "./pages/UniversityDocuments.jsx";
import UniversityDashboard from "./pages/UniversityDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import UniversityDetailPage from "./pages/UniversityDetailPage.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages — no Navbar, no Footer */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/:role" element={<Signup />} />

          {/* University Admin dashboard — standalone (own sidebar, no Navbar/Footer) */}
          <Route
            path="/university/dashboard"
            element={
              <ProtectedRoute role="university">
                <UniversityDashboard />
              </ProtectedRoute>
            }
          />

          {/* All pages that need Navbar + Footer */}
          <Route element={<Layout />}>
            {/* Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />

            {/* University */}
            <Route path="/university" element={<UniversityDetailPage />} />
            {/* University Documents */}
            <Route
              path="/university/documents"
              element={<UniversityDocuments />}
            />

            {/* Public: anyone can browse/search universities without logging in */}
            <Route path="/homepage" element={<HomePage />} />

            {/* Protected: Admin */}
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
