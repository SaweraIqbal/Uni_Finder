import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ROLE_HOME = {
  admin:         "/admin/dashboard",
  university:    "/university/dashboard",
  campus:        "/campus/dashboard",
  hostel:        "/hostel/dashboard",
  campus_hostel: "/hostel/dashboard",
  student:       "/homepage",
};

/** Prevents logged-in non-student roles from accessing landing, login, signup */
export const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Logged in → send to their dashboard (students go to /homepage)
  if (user) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/homepage"} replace />;
  }

  return children;
};

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  // Wait for auth state to be restored from sessionStorage before deciding
  if (loading) return null;

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // role prop provided → check if user's role is allowed
  if (role !== undefined) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      // Send them to their own dashboard, not /login
      return <Navigate to={ROLE_HOME[user.role] ?? "/login"} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
