import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div className="auth-loading">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
