import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";

import { getMerchant } from "../api/merchants";
import Users from "./Users";
import PosConfiguration from "./pos/PosConfiguration";
import Products from "./Products";
import Coupons from "./Coupons";
import Orders from "./Orders";
import StoreCustomers from "./StoreCustomers";
import FastKeys from "./FastKeys";
import StoreCategories from "./StoreCategories";
import StoreShifts from "./StoreShifts";
import StorePaymentRecords from "./StorePaymentRecords";
import VendorPayments from "./VendorPayments";

import { ApiError } from "../api/http";
import { listStores } from "../api/stores";

import {
  getWordpressConnector,
  saveWordpressConnector,
  testWordpressConnection,
} from "../api/storeConnector";


/* =========================================================
   SIDEBAR GROUPS
   ========================================================= */

const navGroups = [
  {
    id: "store-setup",
    label: "Store Overview",
    collapsible: false,
    items: [
      ["overview", "bi-shop", "Store Overview"],
    ],
  },

  {
    id: "configurations",
    label: "Configurations",
    collapsible: false,
    items: [
      ["pos", "bi-phone", "POS Configurations"],
    ],
  },

  {
    id: "people",
    label: "People",
    items: [
      ["users", "bi-people", "Employees"],
      ["customers", "bi-person-lines-fill", "Customers"],
    ],
  },

  {
    id: "catalog",
    label: "Catalog",
    items: [
      ["categories", "bi-tags", "Categories"],
      ["products", "bi-box-seam", "Products"],
      ["fastkeys", "bi-key-fill", "Fast Keys"],
      ["vendors", "bi-truck", "Vendors Directory"],
    ],
  },

  {
    id: "sales",
    label: "Sales & Payments",
    items: [
      ["orders", "bi-receipt", "Orders"],
      ["paymentrecords", "bi-credit-card", "Payment Records"],
    ],
  },

  {
    id: "promotions",
    label: "Promotions",
    items: [
      ["coupons", "bi-ticket-perforated", "Coupons"],
    ],
  },

  {
    id: "operations",
    label: "Store Operations",
    items: [
      ["shifts", "bi-clock-history", "Shift Management"],
    ],
  },
];

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function storeListFromResponse(response) {
  if (Array.isArray(response)) return response;
  for (const key of ["stores", "items", "results", "data"]) {
    const value = response?.[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = storeListFromResponse(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalizeStoreForConfiguration(store) {
  const address = store.address && typeof store.address === "object" ? store.address : {};
  const storeCode = [store.storeCode, store.store_code, store.code, store.storeId, store.storeID]
    .find(value => value && !isUuid(value)) || "";
  const type = store.storeType?.name || store.storeType || store.type?.name || store.type || "";
  const location = [
    address.street || (typeof store.address === "string" ? store.address : ""),
    address.city || store.city,
    address.state || store.state,
  ].filter(Boolean).join(", ");

  return {
    ...store,
    id: store.id || store._id || store.storeUUID || store.storeId || store.storeID,
    storeCode,
    name: store.storeName || store.name || storeCode || "Store",
    type,
    location: location || store.location || "—",
    status: store.status || store.operationalStatus || "Active",
    url: store.baseUrl || store.websiteUrl || store.url || "",
  };
}

/* =========================================================
   STORE CONFIGURATION
   ========================================================= */

export default function StoreConfiguration() {
  const {
    merchantId,
    storeId,
    section = "overview",
  } = useParams();

  const nav = useNavigate();

  /* =======================================================
     STORE STATE
     ======================================================= */

  const [merchant, setMerchant] = useState(null);
  const [store, setStore] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     WORDPRESS CONNECTION STATE
     ======================================================= */

  const [siteUrl, setSiteUrl] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);

  /* =======================================================
     SIDEBAR GROUP STATE
     ======================================================= */

  const [openGroup, setOpenGroup] = useState("store-setup");

  /*
   * Find the group that contains the current section.
   */
  const activeGroupId = useMemo(() => {
    return (
      navGroups.find((group) =>
        group.items.some(([id]) => id === section)
      )?.id || "store-setup"
    );
  }, [section]);

  /*
   * Automatically open the group containing
   * the currently selected screen.
   */
  useEffect(() => {
    setOpenGroup(activeGroupId);
  }, [activeGroupId]);

  /* =======================================================
     BASE PATH
     ======================================================= */

  const basePath = merchantId
    ? `/merchants/${merchantId}/stores/${storeId}/configuration`
    : `/stores/${storeId}/configuration`;

  /* =======================================================
     LOAD STORE
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      setLoading(true);
      setError("");

      try {
        if (merchantId) {
          const result = await getMerchant(merchantId);
          const apiStores = Array.isArray(result?.stores) ? result.stores : [];
          const rawStores = result?.raw?.stores || result?.raw?.merchant?.stores || result?.raw?.data?.stores || [];

          console.log("[STORE CONFIGURATION] Raw merchant API response:", result?.raw);
          console.log("[STORE CONFIGURATION] Stores from API response:", rawStores);
          console.log("[STORE CONFIGURATION] Normalized stores:", apiStores);

          const found =
            apiStores.find((item) =>
              [item.id, item.storeCode].some((value) => String(value || "") === String(storeId || ""))
            ) || null;

          if (!cancelled) {
            setMerchant(result?.merchant || null);
            setStore(found);
          }
        } else {
          const response = await listStores();
          const rawStores = storeListFromResponse(response);
          console.log("[STORE CONFIGURATION] GET /stores response:", response);
          console.log("[STORE CONFIGURATION] Stores from API response:", rawStores);

          const rawStore = rawStores.find((item) =>
            [item.id, item._id, item.storeUUID, item.storeId, item.storeID, item.storeCode, item.store_code, item.code]
              .some((value) => String(value || "") === String(storeId || ""))
          );
          const found = rawStore ? normalizeStoreForConfiguration(rawStore) : null;
          console.log("[STORE CONFIGURATION] Selected store:", found);

          if (!cancelled) {
            if (!found) {
              setStore(null);
              setError(`Store ${storeId} was not found in the stores API response.`);
              return;
            }
            setMerchant({
              name: found.merchantName || found.merchant?.name || "Merchant",
              id: found.merchantId || found.merchant?.id || "",
            });
            setStore(found);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load this store."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStore();

    return () => {
      cancelled = true;
    };
  }, [merchantId, storeId]);

  /* =======================================================
     LOAD WORDPRESS CONNECTOR
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadConnector() {
      /*
       * Load saved connector information.
       */
      try {
        const saved = getWordpressConnector(storeId);

        if (saved && !cancelled) {
          if (saved.siteUrl) {
            setSiteUrl(saved.siteUrl);
          }

          if (saved.jwtToken) {
            setJwtToken(saved.jwtToken);
          }

          setConnected(Boolean(saved.connected));

          if (saved.lastTestMessage) {
            setMessage(saved.lastTestMessage);
          }
        }
      } catch (err) {
        console.warn(
          "Could not load saved WordPress connector:",
          err
        );
      }
    }

    if (storeId) {
      loadConnector();
    }

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  /* =======================================================
     SET WEBSITE URL FROM STORE
     ======================================================= */

  useEffect(() => {
    if (!siteUrl && store?.url) {
      setSiteUrl(store.url);
    }
  }, [store, siteUrl]);

  /* =======================================================
     STORE STATUS
     ======================================================= */

  const statusClass = useMemo(
    () =>
      (store?.status || "active")
        .toLowerCase()
        .replace(/\s+/g, "-"),
    [store]
  );

  /* =======================================================
     SAVE WORDPRESS CONNECTION
     ======================================================= */

  const handleSave = async (event) => {
    event.preventDefault();

    if (!siteUrl.trim() || !jwtToken.trim()) {
      setMessage(
        "Enter the WordPress site URL and JWT token."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const saved = await saveWordpressConnector(
        storeId,
        merchantId,
        {
          siteUrl,
          jwtToken,
          connected,
        }
      );

      setMessage(
        saved?.syncedToApi
          ? "WordPress JWT saved for this store."
          : "WordPress JWT saved for this store on this browser."
      );
    } catch (err) {
      setMessage(
        err?.message ||
          "Unable to save the WordPress token."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     TEST WORDPRESS CONNECTION
     ======================================================= */

  const handleTest = async () => {
    if (!siteUrl.trim() || !jwtToken.trim()) {
      setMessage(
        "Enter the WordPress site URL and JWT token first."
      );
      return;
    }

    setTesting(true);
    setMessage("");

    try {
      const result =
        await testWordpressConnection(
          siteUrl,
          jwtToken,
          storeId,
          merchantId
        );

      setConnected(Boolean(result?.ok));
      setMessage(
        result?.message ||
          "Connection test completed."
      );

      await saveWordpressConnector(
        storeId,
        merchantId,
        {
          siteUrl,
          jwtToken,
          connected: Boolean(result?.ok),
          lastTestedAt:
            new Date().toISOString(),
          lastTestMessage:
            result?.message || "",
        }
      );
    } catch (err) {
      setConnected(false);

      setMessage(
        err?.message ||
          "Connection test failed."
      );
    } finally {
      setTesting(false);
    }
  };

  /* =======================================================
     BACK TO STORES
     ======================================================= */

  const backToStores = () => {
    if (merchantId) {
      nav(`/merchants?view=${encodeURIComponent(merchantId)}&tab=stores`);
    } else {
      nav("/stores");
    }
  };

  const displayStoreCode = store?.storeCode || (String(store?.id || "").startsWith("STR-") ? store.id : "");
  const displayStoreName = store?.name && !isUuid(store.name)
    ? store.name
    : displayStoreCode || "Store";

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="page-content store-workspace-page">

      {/* ===================================================
          BREADCRUMB
          =================================================== */}

      <div className="breadcrumb-area">

        <button
          className="link-button"
          onClick={backToStores}
        >
          <i className="bi bi-arrow-left" />
          Stores
        </button>

        <span>/</span>

        <span>Store Configuration</span>

      </div>

      {/* ===================================================
          LOADING
          =================================================== */}

      {loading ? (
        <section className="store-workspace-card">
          Loading store...
        </section>
      ) : error ? (
        <section className="store-workspace-card">
          {error}
        </section>
      ) : (
        <>
          {/* ===============================================
              STORE HEADER
              =============================================== */}

          <div className="store-workspace-header">

            <div>

              <h1>
                {displayStoreName}
              </h1>

              <p>
                {displayStoreCode || "Store ID unavailable"}

                {merchant?.name
                  ? ` • ${merchant.name}`
                  : ""}
              </p>

            </div>

            <span
              className={`store-status ${statusClass}`}
            >
              {connected
                ? "Website Connected"
                : store?.status || "Active"}
            </span>

          </div>

          {/* ===============================================
              WORKSPACE
              =============================================== */}

          <div className="store-workspace">

            {/* =============================================
                SIDEBAR
                ============================================= */}

            <aside className="store-subnav">

              {navGroups.map((group) => {

                const isCollapsible = group.collapsible !== false;
                const isOpen =
                  !isCollapsible || openGroup === group.id;

                return (
                  <div
                    className={`store-subnav-group ${
                      isOpen ? "open" : ""
                    } ${!isCollapsible ? "store-subnav-group-direct" : ""}`}
                    key={group.id}
                  >

                    {/* GROUP HEADER */}

                    {isCollapsible && <button
                      type="button"
                      className={`store-subnav-group-header ${
                        isOpen ? "open" : ""
                      }`}
                      onClick={() =>
                        setOpenGroup(
                          (current) =>
                            current === group.id
                              ? null
                              : group.id
                        )
                      }
                      aria-expanded={isOpen}
                    >

                      <span>
                        {group.label}
                      </span>

                      <i
                        className={`bi ${
                          isOpen
                            ? "bi-chevron-up"
                            : "bi-chevron-down"
                        }`}
                      />

                    </button>}

                    {/* GROUP ITEMS */}

                    {isOpen && (
                      <div className="store-subnav-group-items">

                        {group.items.map(
                          ([id, icon, label]) => (
                            <NavLink
                              key={id}
                              to={`${basePath}/${id}`}
                              end
                              className={`store-subnav-item ${
                                section === id
                                  ? "active"
                                  : ""
                              }`}
                            >

                              <i
                                className={`bi ${icon}`}
                              />

                              <span>
                                {label}
                              </span>

                            </NavLink>
                          )
                        )}

                      </div>
                    )}

                  </div>
                );
              })}

            </aside>

            {/* =============================================
                MAIN CONTENT
                ============================================= */}

            <section className="store-workspace-main">

              {/* ===========================================
                  STORE OVERVIEW & SETUP
                  =========================================== */}

              {section === "overview" ? (

                <div className="store-panel">

                  {/* PAGE HEADER */}

                  <div className="store-panel-heading">

                    <div>

                      <h2>
                        Store Overview & Setup
                      </h2>

                      <p>
                        Manage your store information
                        and website connection settings.
                      </p>

                    </div>

                    <span
                      className={`connection-pill ${
                        connected
                          ? "connected"
                          : "disconnected"
                      }`}
                    >
                      {connected
                        ? "Website Connected"
                        : "Website Not Connected"}
                    </span>

                  </div>

                  {/* =====================================
                      STORE OVERVIEW
                      ===================================== */}

                  <div className="store-section-block">

                    <div className="store-section-title">

                      <h3>
                        Store Overview
                      </h3>

                      <p>
                        Store information used by
                        Pinaka Commerce Hub.
                      </p>

                    </div>

                    <div className="store-overview-grid">

                      <div>
                        <span>
                          Store Name
                        </span>

                        <strong>
                          {displayStoreName}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Store ID
                        </span>

                        <strong>
                          {displayStoreCode || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Type
                        </span>

                        <strong>
                          {store?.type || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Location
                        </span>

                        <strong>
                          {store?.location || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Website
                        </span>

                        <strong>
                          {siteUrl ||
                            store?.url ||
                            "Not connected"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          JWT Status
                        </span>

                        <strong>
                          {connected
                            ? "Connected"
                            : "Not connected"}
                        </strong>
                      </div>

                    </div>

                  </div>

                  {/* =====================================
                      WEBSITE CONNECTION
                      ===================================== */}

                  <div className="store-section-block store-connection-section">

                    <div className="store-section-title">

                      <h3>
                        Website Connection
                      </h3>

                      <p>
                        Connect this store with
                        its WordPress website.
                      </p>

                    </div>

                    {/* WORDPRESS SITE URL */}

                    <label className="store-field">

                      WordPress Site URL

                      <input
                        type="url"
                        placeholder="https://your-store.com"
                        value={siteUrl}
                        onChange={(event) =>
                          setSiteUrl(
                            event.target.value
                          )
                        }
                        required
                      />

                    </label>

                    {/* JWT TOKEN */}

                    <label className="store-field">

                      WordPress JWT Token

                      <div className="token-input">

                        <textarea
                          rows={5}
                          placeholder="Paste the JWT generated by WordPress"
                          value={jwtToken}
                          onChange={(event) =>
                            setJwtToken(
                              event.target.value
                            )
                          }
                          required
                          spellCheck={false}
                          style={{
                            WebkitTextSecurity:
                              showToken
                                ? "none"
                                : "disc",
                          }}
                        />

                        <button
                          type="button"
                          className="token-toggle-btn"
                          onClick={() =>
                            setShowToken(
                              (current) =>
                                !current
                            )
                          }
                        >

                          <i
                            className={`bi ${
                              showToken
                                ? "bi-eye-slash"
                                : "bi-eye"
                            }`}
                          />

                          {showToken
                            ? "Hide Token"
                            : "Show Token"}

                        </button>

                      </div>

                    </label>

                    {/* MESSAGE */}

                    {message ? (
                      <div
                        role="status"
                        className={`store-message ${
                          connected
                            ? "success"
                            : "info"
                        }`}
                      >
                        {message}
                      </div>
                    ) : null}

                    {/* ACTIONS */}

                    <div className="store-form-actions">

                      <button
                        type="button"
                        className="store-edit-btn"
                        onClick={handleTest}
                        disabled={
                          testing || saving
                        }
                      >
                        {testing
                          ? "Syncing Categories & Products..."
                          : "Sync Categories & Products"}
                      </button>

                      <button
                        type="button"
                        className="store-config-btn"
                        onClick={handleSave}
                        disabled={
                          saving || testing
                        }
                      >
                        {saving
                          ? "Saving..."
                          : "Save JWT Token"}
                      </button>

                    </div>

                  </div>

                </div>

              /* ===========================================
                 POS CONFIGURATION
                 =========================================== */

              ) : section === "pos" ? (

                <PosConfiguration
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 EMPLOYEES
                 =========================================== */

              ) : section === "users" ? (

                <Users
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                />

              /* ===========================================
                 PRODUCTS
                 =========================================== */

              ) : section === "products" ? (

                <Products
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 CATEGORIES
                 =========================================== */

              ) : section === "categories" ? (

                <StoreCategories
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 VENDORS
                 =========================================== */

              ) : section === "vendors" ? (

                <VendorPayments
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 COUPONS
                 =========================================== */

              ) : section === "coupons" ? (

                <Coupons
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 ORDERS
                 =========================================== */

              ) : section === "orders" ? (

                <Orders
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 FAST KEYS
                 =========================================== */

              ) : section === "fastkeys" ? (

                <FastKeys />

              /* ===========================================
                 SHIFT MANAGEMENT
                 =========================================== */

              ) : section === "shifts" ? (

                <StoreShifts
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 PAYMENT RECORDS
                 =========================================== */

              ) : section === "paymentrecords" ? (

                <StorePaymentRecords
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 CUSTOMERS
                 =========================================== */

              ) : section === "customers" ? (

                <StoreCustomers
                  merchantId={merchantId}
                  storeId={storeId}
                  store={store}
                  embedded
                />

              /* ===========================================
                 FALLBACK
                 =========================================== */

              ) : (

                <div className="store-panel">

                  <h2>
                    Store Configuration
                  </h2>

                  <p>
                    Select a configuration
                    section from the sidebar.
                  </p>

                </div>

              )}

            </section>

          </div>
        </>
      )}
    </div>
  );
}
