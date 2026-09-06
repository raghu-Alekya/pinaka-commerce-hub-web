import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function GuestRoute({ children }) {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return <div className="auth-loading">Loading session...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
