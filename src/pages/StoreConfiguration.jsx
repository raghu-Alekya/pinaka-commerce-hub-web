import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { getMerchant } from "../api/merchants";
import Users from "./Users";
import PosConfiguration from "./PosConfiguration";
import Products from "./Products";
import Coupons from "./Coupons";
import Orders from "./Orders";
import { ApiError } from "../api/http";
import {
  getWordpressConnector,
  saveWordpressConnector,
  testWordpressConnection,
} from "../api/storeConnector";
import { stores as mockStores } from "../data/data";

const navItems = [
  ["website", "bi-globe2", "Website Connection"],
  ["overview", "bi-shop", "Store Overview"],
  ["details", "bi-pencil-square", "Store Details"],
  ["users", "bi-people", "Users"],
  ["pos", "bi-phone", "POS Settings"],
  ["products", "bi-box-seam", "Products"],
  ["coupons", "bi-ticket-perforated", "Coupons"],
  ["orders", "bi-receipt", "Orders"],


];

export default function StoreConfiguration() {
  const { merchantId, storeId, section = "website" } = useParams();
  const nav = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);

  const basePath = merchantId
    ? `/merchants/${merchantId}/stores/${storeId}/configuration`
    : `/stores/${storeId}/configuration`;

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      setLoading(true);
      setError("");
      try {
        if (merchantId) {
          const result = await getMerchant(merchantId);
          const found =
            result.stores.find((item) => item.id === storeId) || null;
          if (!cancelled) {
            setMerchant(result.merchant);
            setStore(found);
          }
        } else {
          const found = mockStores.find((item) => item.id === storeId) || {
            id: storeId,
            name: storeId,
            location: "",
            status: "Active",
          };
          if (!cancelled) {
            setMerchant({ name: found.merchant || "Merchant", id: "" });
            setStore({
              id: found.id,
              name: found.name,
              location: found.location,
              status: found.status,
              type: found.type,
              url: "",
            });
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
        if (!cancelled) setLoading(false);
      }
    }

    loadStore();
    return () => {
      cancelled = true;
    };
  }, [merchantId, storeId]);

  useEffect(() => {
    const saved = getWordpressConnector(storeId);
    if (saved) {
      setSiteUrl(saved.siteUrl || "");
      setJwtToken(saved.jwtToken || "");
      setConnected(Boolean(saved.connected));
      setMessage(saved.lastTestMessage || "");
    } else {
      setJwtToken("");
      setConnected(false);
      setMessage("");
    }
  }, [storeId]);

  useEffect(() => {
    if (!siteUrl && store?.url) setSiteUrl(store.url);
  }, [store, siteUrl]);

  const statusClass = useMemo(
    () => (store?.status || "active").toLowerCase().replace(/\s+/g, "-"),
    [store]
  );

  const handleSave = async (event) => {
    event.preventDefault();
    if (!siteUrl.trim() || !jwtToken.trim()) {
      setMessage("Enter the WordPress site URL and JWT token.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const saved = await saveWordpressConnector(storeId, merchantId, {
        siteUrl,
        jwtToken,
        connected,
      });
      setMessage(
        saved.syncedToApi
          ? "WordPress JWT saved for this store."
          : "WordPress JWT saved for this store on this browser."
      );
    } catch (err) {
      setMessage(err.message || "Unable to save the WordPress token.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!siteUrl.trim() || !jwtToken.trim()) {
      setMessage("Enter the WordPress site URL and JWT token first.");
      return;
    }

    setTesting(true);
    setMessage("");
    try {
      const result = await testWordpressConnection(siteUrl, jwtToken);
      setConnected(result.ok);
      setMessage(result.message);
      await saveWordpressConnector(storeId, merchantId, {
        siteUrl,
        jwtToken,
        connected: result.ok,
        lastTestedAt: new Date().toISOString(),
        lastTestMessage: result.message,
      });
    } catch (err) {
      setConnected(false);
      setMessage(err.message || "Connection test failed.");
    } finally {
      setTesting(false);
    }
  };

  const backToStores = () => {
    if (merchantId) nav(`/merchants/${merchantId}/stores`);
    else nav("/stores");
  };

  return (
    <div className="page-content store-workspace-page">
      <div className="breadcrumb-area">
        <button className="link-button" onClick={backToStores}>
          <i className="bi bi-arrow-left" /> Stores
        </button>
        <span>/</span>
        <span>Store Configuration</span>
      </div>

      {loading ? (
        <section className="store-workspace-card">Loading store...</section>
      ) : error ? (
        <section className="store-workspace-card">{error}</section>
      ) : (
        <>
          <div className="store-workspace-header">
            <div>
              <h1>{store?.name || "Store Configuration"}</h1>
              <p>
                {store?.id} {merchant?.name ? `• ${merchant.name}` : ""}
              </p>
            </div>
            <span className={`store-status ${statusClass}`}>
              {connected ? "Website Connected" : store?.status || "Active"}
            </span>
          </div>

          <div className="store-workspace">
            <aside className="store-subnav">
              {navItems.map(([id, icon, label]) => (
                <NavLink
                  key={id}
                  to={`${basePath}/${id}`}
                  end
                  className={`store-subnav-item ${section === id ? "active" : ""
                    }`}
                >
                  <i className={`bi ${icon}`} />
                  {label}
                </NavLink>
              ))}
            </aside>

            <section className="store-workspace-main">
              {section === "overview" ? (
                <div className="store-panel">
                  <h2>Store Overview</h2>
                  <p>Full store profile used by Pinaka Commerce Hub.</p>
                  <div className="store-overview-grid">
                    <div>
                      <span>Store Name</span>
                      <strong>{store.name}</strong>
                    </div>
                    <div>
                      <span>Store ID</span>
                      <strong>{store.id}</strong>
                    </div>
                    <div>
                      <span>Type</span>
                      <strong>{store.type || "—"}</strong>
                    </div>
                    <div>
                      <span>Location</span>
                      <strong>{store.location || "—"}</strong>
                    </div>
                    <div>
                      <span>Website</span>
                      <strong>{siteUrl || store.url || "Not connected"}</strong>
                    </div>
                    <div>
                      <span>JWT Status</span>
                      <strong>{connected ? "Connected" : "Not connected"}</strong>
                    </div>
                  </div>
                </div>
              ) : section === "details" ? (
                <div className="store-panel">
                  <h2>Store Details</h2>
                  <p>Edit the store record for this merchant.</p>
                  <button
                    className="store-config-btn"
                    onClick={() =>
                      nav(
                        merchantId
                          ? `/merchants/${merchantId}/stores/edit/${storeId}`
                          : `/stores/${storeId}/edit`
                      )
                    }
                  >
                    Open store editor
                  </button>
                </div>
              )
                : section === "pos" ? (
                  <PosConfiguration
                    merchantId={merchantId}
                    storeId={storeId}
                    store={store}
                    embedded
                  />) : section === "users" ? (
                    <Users
                      merchantId={merchantId}
                      storeId={storeId}
                      store={store}
                    />

                  ) : section === "products" ? (
                    <Products
                      merchantId={merchantId}
                      storeId={storeId}
                      store={store}
                      embedded
                    />

                  ) : section === "coupons" ? (
                    <Coupons
                      merchantId={merchantId}
                      storeId={storeId}
                      store={store}
                      embedded
                    />

                  ) : section === "orders" ? (
                    <Orders
                      merchantId={merchantId}
                      storeId={storeId}
                      store={store}
                      embedded
                    />

                  ) : (
                  <form className="store-panel" onSubmit={handleSave}>
                    <div className="store-panel-heading">
                      <div>
                        <h2>Website Connection</h2>
                        <p>
                          Paste the JWT token generated by the WordPress site to
                          connect this store.
                        </p>
                      </div>
                      <span
                        className={`connection-pill ${connected ? "connected" : "disconnected"
                          }`}
                      >
                        {connected ? "Connected" : "Not connected"}
                      </span>
                    </div>

                    <label className="store-field">
                      WordPress Site URL
                      <input
                        type="url"
                        placeholder="https://your-store.com"
                        value={siteUrl}
                        onChange={(event) => setSiteUrl(event.target.value)}
                        required
                      />
                    </label>

                    <label className="store-field">
                      WordPress JWT Token
                      <div className="token-input">
                        <textarea
                          rows={5}
                          placeholder="Paste the JWT generated by WordPress"
                          value={jwtToken}
                          onChange={(event) => setJwtToken(event.target.value)}
                          required
                          spellCheck={false}
                          style={{
                            WebkitTextSecurity: showToken ? "none" : "disc",
                          }}
                        />
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => setShowToken((current) => !current)}
                        >
                          {showToken ? "Hide token" : "Show token"}
                        </button>
                      </div>
                    </label>

                    {message ? (
                      <div
                        role="status"
                        className={`store-message ${connected ? "success" : "info"
                          }`}
                      >
                        {message}
                      </div>
                    ) : null}

                    <div className="store-form-actions">
                      <button
                        type="button"
                        className="store-edit-btn"
                        onClick={handleTest}
                        disabled={testing || saving}
                      >
                        {testing ? "Testing..." : "Test Connection"}
                      </button>
                      <button
                        type="submit"
                        className="store-config-btn"
                        disabled={saving || testing}
                      >
                        {saving ? "Saving..." : "Save JWT Token"}
                      </button>
                    </div>
                  </form>
                )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
