import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import AppLayout from "./layouts/AppLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Merchants from "./pages/Merchants";
import MerchantStores from "./pages/MerchantStores";
import Stores from "./pages/Stores";
import Users from "./pages/Users";
import PosConfiguration from "./pages/PosConfiguration";

// Merchant / Store Forms
import AddMerchant from "./pages/AddMerchant";
import AddStore from "./pages/AddStore";

// Other Pages
import Placeholder from "./pages/Placeholder";
import Legal from "./pages/Legal";

/* --------------------------------
   Placeholder Pages
--------------------------------- */

const placeholders = [
  "Subscriptions",
  "Orders",
  "Cash Management",
  "Employees",
  "Devices",
  "Shifts",
  "Attendance",
  "Integrations",
  "Synchronization",
  "Reconciliation",
  "Notifications",
  "Reports",
  "Audit Logs",
  "Settings",
];

/* --------------------------------
   Application Routes
--------------------------------- */

export default function App() {
  return (
    <Routes>
      {/* ============================
          Public Routes
      ============================= */}

      <Route path="/login" element={<Login />} />

      <Route
        path="/privacy"
        element={<Legal privacy />}
      />

      <Route
        path="/terms"
        element={<Legal />}
      />

      {/* ============================
          Protected / Application Layout
      ============================= */}

      <Route element={<AppLayout />}>
        {/* Default Route */}
        <Route
          index
          element={<Navigate to="/dashboard" replace />}
        />

        {/* ============================
            Dashboard
        ============================= */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* ============================
            Merchants
        ============================= */}

        <Route
          path="/merchants"
          element={<Merchants />}
        />

        <Route
          path="/merchants/new"
          element={<AddMerchant />}
        />

        <Route
          path="/merchants/:merchantId/edit"
          element={<AddMerchant />}
        />

        {/* ============================
            Merchant Stores
        ============================= */}

        <Route
          path="/merchants/:merchantId/stores"
          element={<MerchantStores />}
        />

        <Route
          path="/merchants/:merchantId/stores/new"
          element={<AddStore />}
        />

        <Route
          path="/merchants/:merchantId/stores/edit/:storeId"
          element={<AddStore />}
        />

        {/* ============================
            Merchant Users
        ============================= */}

        <Route
          path="/merchants/:merchantId/users"
          element={<Users />}
        />

        {/* ============================
            Stores
        ============================= */}

        <Route
          path="/stores"
          element={<Stores />}
        />

        <Route
          path="/stores/new"
          element={<AddStore />}
        />

        <Route
          path="/stores/:storeId/edit"
          element={<AddStore />}
        />

        {/* ============================
            Users
        ============================= */}

        <Route
          path="/users"
          element={<Users />}
        />

        {/* ============================
            POS Configuration
        ============================= */}

        <Route
          path="/pos-configuration"
          element={<PosConfiguration />}
        />

        {/* ============================
            Placeholder Pages
        ============================= */}

        {placeholders.map((title) => {
          const path = `/${title
            .toLowerCase()
            .replaceAll(" ", "-")}`;

          return (
            <Route
              key={title}
              path={path}
              element={<Placeholder title={title} />}
            />
          );
        })}
      </Route>

      {/* ============================
          Unknown Routes
      ============================= */}

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}