import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute";
import GuestRoute from "./auth/GuestRoute";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Merchants from "./pages/Merchants";
import MerchantStores from "./pages/MerchantStores";
import Subscriptions from "./pages/Subscriptions";
import Stores from "./pages/Stores";
import Users from "./pages/Users";
import PosConfiguration from "./pages/PosConfiguration";
import AddMerchant from "./pages/AddMerchant";
import AddStore from "./pages/AddStore";
import StoreConfiguration from "./pages/StoreConfiguration";
import Placeholder from "./pages/Placeholder";
import Legal from "./pages/Legal";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import Devices from "./pages/Devices";
import AddDevice from "./pages/AddDevice";
import Products from "./pages/Products";
import Coupons from "./pages/Coupons";
import Orders from "./pages/Orders";
import CreateStoreType from "./pages/CreateStoreType";
import CreatePlan from "./pages/CreatePlan";
import StoreTypeDetails from "./pages/StoreTypeDetails";
import StoreTypeFeatures from "./pages/StoreTypeFeatures";
import StoreTypeRoleTemplates from "./pages/StoreTypeRoleTemplates";
import Features from "./pages/Features";
import FeaturePermissions from "./pages/FeaturePermissions";
import ConfigurePermissions from "./pages/ConfigurePermissions";
import RoleTemplates from "./pages/Roletemplates";
import Vendors from "./pages/Vendors";
import Tenders from "./pages/Tenders";

const placeholders = [
  "Cash Management",
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
  const [localMerchants, setLocalMerchants] = useState([]);

  function saveLocalMerchant(merchant) {
    if (!merchant?.id) {
      throw new Error("Merchant ID is required before saving.");
    }

    setLocalMerchants((previous) => {
      const exists = previous.some(
        (item) => String(item.id) === String(merchant.id)
      );

      if (exists) {
        return previous.map((item) =>
          String(item.id) === String(merchant.id)
            ? { ...item, ...merchant }
            : item
        );
      }

      return [merchant, ...previous];
    });
  }

  function removeLocalMerchant(merchantId) {
    setLocalMerchants((previous) =>
      previous.filter(
        (item) => String(item.id) !== String(merchantId)
      )
    );
  }

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

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/dashboard" replace />}
        />

        <Route path="/dashboard" element={<Dashboard />} />

        {/* Merchant list, creation, and editing */}
        <Route
          path="/merchants"
          element={
            <Merchants
              localMerchants={localMerchants}
              onLocalDelete={removeLocalMerchant}
            />
          }
        />

        <Route
          path="/merchants/new"
          element={
            <AddMerchant
              localMerchants={localMerchants}
              onSave={saveLocalMerchant}
            />
          }
        />

        <Route
          path="/merchants/:merchantId/edit"
          element={
            <AddMerchant
              localMerchants={localMerchants}
              onSave={saveLocalMerchant}
            />
          }
        />

        {/* Merchant stores */}
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

        <Route
          path="/merchants/:merchantId/users"
          element={<Users />}
        />

        <Route
          path="/merchants/:merchantId/stores/:storeId/configuration"
          element={<StoreConfiguration />}
        />

        <Route
          path="/merchants/:merchantId/stores/:storeId/configuration/:section"
          element={<StoreConfiguration />}
        />

        {/* Subscriptions */}
        <Route
          path="/subscriptions"
          element={<Subscriptions />}
        />

        <Route
          path="/merchant-subscriptions"
          element={<Subscriptions />}
        />

        {/* Stores */}
        <Route path="/stores" element={<Stores />} />
        <Route path="/stores/new" element={<AddStore />} />
        <Route
          path="/stores/:storeId/edit"
          element={<AddStore />}
        />

        <Route
          path="/stores/:storeId/configuration"
          element={<StoreConfiguration />}
        />

        <Route
          path="/stores/:storeId/configuration/:section"
          element={<StoreConfiguration />}
        />

        {/* Products and orders */}
        <Route path="/products" element={<Products />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/orders" element={<Orders />} />

        {/* Users and POS */}
        <Route path="/users" element={<Users />} />
        <Route
          path="/pos-configuration"
          element={<PosConfiguration />}
        />

        {/* Employees */}
        <Route path="/employees" element={<Employees />} />
        <Route
          path="/employees/add"
          element={<AddEmployee />}
        />
        <Route
          path="/employees/edit"
          element={<EditEmployee />}
        />
        <Route
          path="/editemployee"
          element={<EditEmployee />}
        />

        {/* Devices */}
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/add" element={<AddDevice />} />

        {/* Remaining sections */}
        {placeholders.map((title) => (
          <Route
            key={title}
            path={`/${title.toLowerCase().replaceAll(" ", "-")}`}
            element={<Placeholder title={title} />}
          />
        ))}

        {/* Features */}
        <Route path="/features" element={<Features />} />
        <Route
          path="/features/:featureId/permissions"
          element={<ConfigurePermissions />}
        />

        {/* Feature Permissions */}
        <Route path="/permissions" element={<FeaturePermissions />} />
        <Route
          path="/permissions/:featureId"
          element={<FeaturePermissions />}
        />

        {/* Master Setup */}
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/tenders" element={<Tenders />} />
        <Route path="/role-templates" element={<RoleTemplates />} />
        <Route path="/plans/new" element={<CreatePlan />} />
        <Route path="/store-types/new" element={<CreateStoreType />} />
        <Route
          path="/store-types/:storeTypeId"
          element={<StoreTypeDetails />}
        />
        <Route
          path="/store-types/:storeTypeId/features"
          element={<StoreTypeFeatures />}
        />
        <Route
          path="/store-types/:storeTypeId/role-templates"
          element={<StoreTypeRoleTemplates />}
        />

      </Route>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}