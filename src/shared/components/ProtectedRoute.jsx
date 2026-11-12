import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    sessionStorage.removeItem("user");
  }
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (role === "university") return children;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
