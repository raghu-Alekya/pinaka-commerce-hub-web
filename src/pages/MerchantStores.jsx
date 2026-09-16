import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMerchant } from "../api/merchants";
import { ApiError } from "../api/http";

export default function MerchantStores() {
  const { merchantId } = useParams();
  const nav = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMerchant() {
      setLoading(true);
      setError("");
      try {
        const result = await getMerchant(merchantId);
        if (!cancelled) {
          setMerchant(result.merchant);
          setStores(result.stores);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load this merchant."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMerchant();
    return () => {
      cancelled = true;
    };
  }, [merchantId]);

  const statusClass = (merchant?.status || "active").toLowerCase().replace(/\s+/g, "-");
  // Merchant dashboard card statistics
const totalStores = stores.length;

const activeStores = stores.filter(
  (store) => (store.status || "").toLowerCase() === "active"
).length;

const inactiveStores = totalStores - activeStores;

const totalPosDevices = stores.reduce(
  (total, store) =>
    total + Number(store.posDevices || store.pos_devices || 0),
  0
);

const totalEmployees = stores.reduce(
  (total, store) =>
    total + Number(store.employees || store.employeeCount || 0),
  0
);

const subscriptionPlan = merchant?.plan || "—";
  return (
    <div className="page-content merchant-store-page">
      <div className="breadcrumb-area">
        <button className="link-button" onClick={() => nav("/merchants")}>
          <i className="bi bi-arrow-left" /> Merchants
        </button>
        <span>/</span>
        <span>Merchant Stores</span>
      </div>


      {loading ? (
        <section className="merchant-summary-card">Loading merchant details...</section>
      ) : error ? (
        <section className="merchant-summary-card">{error}</section>
      ) : (
        <>
          <section className="merchant-summary-card">
            <div className="merchant-summary-left">
              <div className="merchant-avatar">{merchant.initials}</div>
              <div>
                <h2>{merchant.name}</h2>
                <p>{merchant.id}</p>
              </div>
            </div>
            <div className="merchant-summary-details">
              <div className="summary-item">
                <span>Contact</span>
                <strong>{merchant.email || "—"}</strong>
              </div>
              <div className="summary-item">
                <span>Status</span>
                <strong className={`status-badge ${statusClass}`}>
                  {merchant.status}
                </strong>
              </div>
              <div className="summary-item">
                <span>Subscription</span>
                <strong>{merchant.plan || "—"}</strong>
              </div>
            </div>
          </section>

          {/* Merchant Dashboard Cards */}
        <section className="merchant-dashboard-cards">

          {/* Total Stores */}
          <div className="merchant-dashboard-card">
            <div className="dashboard-card-icon purple">
              <i className="bi bi-shop" />
            </div>
            <div className="dashboard-card-content">
              <span>Total Stores</span>
              <h3>{totalStores}</h3>
            </div>
          </div>

          {/* Active Stores */}
          <div className="merchant-dashboard-card">
            <div className="dashboard-card-icon green">
              <i className="bi bi-check-circle" />
            </div>
            <div className="dashboard-card-content">
              <span>Active Stores</span>
              <h3>{activeStores}</h3>
            </div>
          </div>

          {/* Inactive Stores */}
          <div className="merchant-dashboard-card">
            <div className="dashboard-card-icon red">
              <i className="bi bi-wifi-off" />
            </div>
            <div className="dashboard-card-content">
              <span>Inactive Stores</span>
              <h3>{inactiveStores}</h3>
            </div>
          </div>

          {/* Total POS Devices */}
          <div className="merchant-dashboard-card">
            <div className="dashboard-card-icon blue">
              <i className="bi bi-display" />
            </div>
            <div className="dashboard-card-content">
              <span>Total POS Devices</span>
              <h3>{totalPosDevices}</h3>
            </div>
          </div>

          {/* Total Employees */}
          <div className="merchant-dashboard-card">
            <div className="dashboard-card-icon green">
              <i className="bi bi-people" />
            </div>
            <div className="dashboard-card-content">
              <span>Total Employees</span>
              <h3>{totalEmployees}</h3>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="merchant-dashboard-card">
            <div className="dashboard-card-icon orange">
              <i className="bi bi-award" />
            </div>
            <div className="dashboard-card-content">
              <span>Subscription Plan</span>
              <h3 className="subscription-plan-text">
                {subscriptionPlan}
              </h3>
              <small className="subscription-active">
                ● Active
              </small>
            </div>
          </div>

        </section>
          <section className="stores-card">
            <div className="stores-card-header">
              <div>
                <h2>Stores</h2>
                <p>Manage the store locations for this merchant.</p>
              </div>
              <button
                className="btn-new-store"
                onClick={() => nav(`/merchants/${merchant.id}/stores/new`)}
              >
                <i className="bi bi-plus-lg" /> New Store
              </button>
            </div>
            <div className="stores-list">
              {stores.length === 0 ? (
                <div className="store-item">
                  <div className="store-item-info">
                    <h3>No stores found</h3>
                    <div className="store-meta">
                      <span>This merchant does not have any stores yet.</span>
                    </div>
                  </div>
                </div>
              ) : (
                stores.map((store) => (
                  <div className="store-item" key={store.id}>
                    <div className="store-item-icon">
                      <i className="bi bi-shop" />
                    </div>
                    <div className="store-item-info">
                      <h3>{store.name}</h3>
                      <div className="store-meta">
                        <span>Store ID: {store.id}</span>
                        <span>{store.type}</span>
                        <span>{store.location}</span>
                      </div>
                    </div>
                    <div className="store-item-status">
                      <span className={`store-status ${store.status.toLowerCase()}`}>
                        {store.status}
                      </span>
                    </div>
                    <div className="store-item-actions">
                      <button
                        className="store-config-btn"
                        onClick={() =>
                          nav(
                            `/merchants/${merchant.id}/stores/${store.id}/configuration/website`
                          )
                        }
                      >
                        <i className="bi bi-sliders" /> Store Configuration
                      </button>
                      <button
                        className="store-edit-btn"
                        onClick={() =>
                          nav(`/merchants/${merchant.id}/stores/edit/${store.id}`)
                        }
                      >
                        <i className="bi bi-pencil" /> Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* <section className="employees-action-card">
            <div>
              <h2>Employees</h2>
              <p>Manage employees associated with this merchant.</p>
            </div>
            <button
              className="btn-create-employees"
              onClick={() => {
                localStorage.setItem(
                  "pchCurrentStore",
                  JSON.stringify(stores[0] || {})
                );
                nav(`/merchants/${merchant.id}/users`);
              }}
            >
              <i className="bi bi-people" /> Create Employees
            </button>
          </section> */}
        </>
      )}
    </div>
  );
}
