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
export const PublicOnlyRoute = ({ children, allowStudent = false }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    // Students can pass through if the route explicitly allows it
    if (allowStudent && user.role === "student") return children;
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
