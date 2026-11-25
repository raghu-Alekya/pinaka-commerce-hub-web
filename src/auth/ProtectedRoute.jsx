import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { isPchAdmin, isPchAgent, moduleForRoute } from "./permissions";

export default function ProtectedRoute({ children }) {
  const { isReady, isAuthenticated, user, can } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div className="auth-loading">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (location.pathname === "/merchant-dashboard" && String(user?.accountType || "").toLowerCase() !== "merchant") {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname === "/pch-users" && !isPchAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isPchAgent(user) && location.pathname.startsWith("/pch-users")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isPchAgent(user) && (/^\/(master-setup|store-types|features|feature-permissions|role-templates|plans|tenders|integrations|synchronization|reconciliation|notifications)(\/|$)/.test(location.pathname))) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.accountType === "merchant" || user?.accountType === "employee") {
    const ownMerchantIds = [user?.merchantId, user?.merchantCode].filter(Boolean).map(value => String(value).toLowerCase());
    const viewedMerchantId = new URLSearchParams(location.search).get("view");
    const ownMerchantOverview = location.pathname === "/merchants" && viewedMerchantId
      && ownMerchantIds.includes(viewedMerchantId.toLowerCase())
      && (user?.accountType === "merchant" || can("merchants", "view"));
    if (/^\/merchants(?:\/new|\/[^/]+\/edit)?\/?$/.test(location.pathname) && !ownMerchantOverview) {
      return <Navigate to="/dashboard" replace />;
    }
    const moduleName = moduleForRoute(location.pathname);
    if (moduleName && !ownMerchantOverview && !can(moduleName, "view")) return <Navigate to="/dashboard" replace />;
  }

  return children;
}
