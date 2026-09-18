import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./auth/AuthContext";

import "./styles/global.css";
import "./styles/merchants.css";
import "./styles/stores.css";
import "./styles/merchant-store-details.css";
import "./styles/users.css";
import "./styles/pos-configuration.css";
import "./styles/merchant-form.css";
import "./styles/add-store.css";
import "./styles/store-configuration.css";
import "./styles/products.css";
import "./styles/coupons.css";
import "./styles/orders.css";
import "./styles/login.css";
import "./styles/legal.css";
import "./styles/Merchant-subscriptions.css";
import "./styles/CreateStoreType.css";
import "./styles/CreatePlan.css";
import "./styles/StoreTypeDetails.css";
import "./styles/StoreTypeFeatures.css";
import "./styles/StoreTypeRoleTemplates.css";
import "./styles/features.css";
import "./styles/featurepermissions.css";
import "./styles/configurepermissions.css";
import "./styles/Roletemplates.css";
import "./styles/vendors.css";
import "./styles/tenders.css";
import "./styles/devices.css";
import "./styles/add-device.css";
import "./styles/employees.css";
import "./styles/add-employee.css";
import "./styles/Merchant-subscriptions.css";
import "./styles/ViewPlan.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);