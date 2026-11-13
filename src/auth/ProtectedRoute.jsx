import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

import { moduleForRoute } from "./permissions";

export default function ProtectedRoute({ children }) {
  const { isReady, isAuthenticated, can } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div className="auth-loading">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const moduleName = moduleForRoute(location.pathname);
  if (moduleName && !can(moduleName, "view")) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
