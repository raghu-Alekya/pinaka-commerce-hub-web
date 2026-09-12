import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import GuestRoute from "./auth/GuestRoute";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Merchants from "./pages/Merchants";
import MerchantStores from "./pages/MerchantStores";
import Stores from "./pages/Stores";
import Users from "./pages/Users";
import PosConfiguration from "./pages/PosConfiguration";
import AddMerchant from "./pages/AddMerchant";
import AddStore from "./pages/AddStore";
import StoreConfiguration from "./pages/StoreConfiguration";
import Placeholder from "./pages/Placeholder";
import Legal from "./pages/Legal";
import CreateStoreType from "./pages/CreateStoreType";
import CreatePlan from "./pages/CreatePlan";
import StoreTypeDetails from "./pages/StoreTypeDetails";
import StoreTypeFeatures from "./pages/StoreTypeFeatures";
import StoreTypeRoleTemplates from "./pages/StoreTypeRoleTemplates";
import Features from "./pages/Features";
import FeaturePermissions from "./pages/FeaturePermissions";

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

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route path="/privacy" element={<Legal privacy />} />
      <Route path="/terms" element={<Legal />} />

      <Route element={<ProtectedRoute>  <AppLayout /> </ProtectedRoute>} >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/merchants" element={<Merchants />} />
        <Route path="/merchants/new" element={<AddMerchant />} />
        <Route path="/merchants/:merchantId/edit" element={<AddMerchant />} />
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
        <Route path="/merchants/:merchantId/users" element={<Users />} />
        <Route
          path="/merchants/:merchantId/stores/:storeId/configuration"
          element={<StoreConfiguration />}
        />
        <Route
          path="/merchants/:merchantId/stores/:storeId/configuration/:section"
          element={<StoreConfiguration />}
        />
        <Route path="/stores" element={<Stores />} />
        <Route path="/stores/new" element={<AddStore />} />
        <Route path="/stores/:storeId/edit" element={<AddStore />} />
        <Route
          path="/stores/:storeId/configuration"
          element={<StoreConfiguration />}
        />
        <Route
          path="/stores/:storeId/configuration/:section"
          element={<StoreConfiguration />}
        />
        <Route path="/users" element={<Users />} />
        <Route path="/pos-configuration" element={<PosConfiguration />} />

        <Route path="/features" element={<Features />} />
        <Route path="/permissions" element={<FeaturePermissions />} />

        <Route path="/plans/new" element={<CreatePlan />} />

        <Route path="/store-types/new" element={<CreateStoreType />} />

        <Route path="/store-types/:storeTypeId" element={<StoreTypeDetails />} />

        <Route path="/store-types/:storeTypeId/features" element={<StoreTypeFeatures />} /> 

        <Route path="/store-types/:storeTypeId/role-templates" element={<StoreTypeRoleTemplates />} />     

        {placeholders.map((title) => {
          const path = `/${title.toLowerCase().replaceAll(" ", "-")}`;
          return (
            <Route
              key={title}
              path={path}
              element={<Placeholder title={title} />}
            />
          );
        })}
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
