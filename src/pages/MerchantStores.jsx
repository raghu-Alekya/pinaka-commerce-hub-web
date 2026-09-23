import "../styles/merchant-stores-embedded.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMerchant } from "../api/merchants";
import { ApiError } from "../api/http";

export default function MerchantStores({ merchantId: selectedMerchantId, embedded = false }) {
  const params = useParams();
  const merchantId = selectedMerchantId ?? params.merchantId;
  const nav = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMerchant() {
      setLoading(true);
      setError("");
      try {
        if (!merchantId) throw new Error("A merchant must be selected.");
        const result = await getMerchant(merchantId);
        if (!cancelled) {
          if (!result?.merchant) throw new Error("Merchant details were not returned.");
          setMerchant(result.merchant);
          setStores(Array.isArray(result.stores) ? result.stores : []);
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
  }, [merchantId, attempt]);

  return (
    <div className={embedded ? "merchant-store-page merchant-stores-embedded" : "page-content merchant-store-page"}>
      {!embedded && <div className="breadcrumb-area">
        <button className="link-button" onClick={() => nav("/merchants")}>
          <i className="bi bi-arrow-left" /> Merchants
        </button>
        <span>/</span>
        <span>Merchant Stores</span>
      </div>}


      {loading ? (
        <section className="merchant-summary-card">Loading merchant details...</section>
      ) : error ? (
        <section className="merchant-summary-card" role="alert">{error} <button type="button" onClick={()=>setAttempt(value=>value+1)}>Retry</button></section>
      ) : (
        <>
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
                      <span className={`store-status ${String(store.status || 'unknown').toLowerCase()}`}>
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
