import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { isUnrestricted, moduleForRoute } from "./permissions";

export default function ProtectedRoute({ children }) {
  const { isReady, isAuthenticated, user, can } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div className="auth-loading">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (location.pathname === "/pch-users" && !isUnrestricted(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.accountType === "merchant" || user?.accountType === "employee") {
    if (/^\/merchants(?:\/new|\/[^/]+\/edit)?\/?$/.test(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
    const moduleName = moduleForRoute(location.pathname);
    if (moduleName && !can(moduleName, "view")) return <Navigate to="/dashboard" replace />;
  }

  return children;
}
