import "../styles/merchant-stores-embedded.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMerchant } from "../api/merchants";
import { ApiError } from "../api/http";

export default function MerchantStores({
  merchantId: selectedMerchantId,
  embedded = false,
}) {
  const params = useParams();
  const merchantId = selectedMerchantId ?? params.merchantId;
  const nav = useNavigate();

  const [merchant, setMerchant] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 5;

  useEffect(() => {
    let cancelled = false;

    async function loadMerchant() {
      setLoading(true);
      setError("");

      try {
        if (!merchantId) {
          throw new Error("A merchant must be selected.");
        }

        const result = await getMerchant(merchantId);

        if (!cancelled) {
          if (!result?.merchant) {
            throw new Error("Merchant details were not returned.");
          }

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
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMerchant();

    return () => {
      cancelled = true;
    };
  }, [merchantId, attempt]);

  /* =========================
     SEARCH
  ========================== */

  const filteredStores = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return stores;
    }

    return stores.filter((store) => {
      const searchableText = [
        store.name,
        store.id,
        store.storeId,
        store.type,
        store.storeType,
        store.location,
        store.address,
        store.city,
        store.state,
        store.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [stores, search]);

  /* =========================
     PAGINATION
  ========================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStores.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleStores = filteredStores.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleReset = () => {
    setSearch("");
    setPage(1);
  };

  /* =========================
     HELPERS
  ========================== */

  const getStoreId = (store) =>
    store.storeId ??
    store.id ??
    store.code ??
    store.storeCode ??
    "—";

  const getStoreName = (store) =>
    store.name ??
    store.storeName ??
    "Unnamed Store";

  const getStoreType = (store) =>
    store.type ??
    store.storeType ??
    store.store_type ??
    "Retail";

  const getStoreLocation = (store) => {
    if (store.location) {
      return store.location;
    }

    if (store.address) {
      return store.address;
    }

    return [
      store.addressLine1,
      store.addressLine2,
      store.city,
      store.state,
      store.country,
    ]
      .filter(Boolean)
      .join(", ") || "—";
  };

  const getStoreStatus = (store) =>
    store.status ??
    "Active";

  const getStatusClass = (status) =>
    String(status || "active")
      .toLowerCase()
      .replace(/\s+/g, "-");

  /* =========================
     NAVIGATION
  ========================== */

  const handleNewStore = () => {
    const targetId = merchantId || merchant?.merchantId || merchant?.merchantCode || merchant?.id;
    nav(`/merchants/${encodeURIComponent(targetId)}/stores/new`);
  };

  const handleStoreConfiguration = (store) => {
    const targetId = merchantId || merchant?.merchantId || merchant?.merchantCode || merchant?.id;
    nav(`/merchants/${encodeURIComponent(targetId)}/stores/${getStoreId(store)}/configuration/website`);
  };

  const handleEdit = (store) => {
    const targetId = merchantId || merchant?.merchantId || merchant?.merchantCode || merchant?.id;
    nav(`/merchants/${encodeURIComponent(targetId)}/stores/edit/${getStoreId(store)}`);
  };

  return (
    <div
      className={
        embedded
          ? "merchant-store-page merchant-stores-embedded"
          : "page-content merchant-store-page"
      }
    >
      {/* =====================================
          BREADCRUMB
      ====================================== */}

      {!embedded && (
        <div className="breadcrumb-area">
          <button
            className="link-button"
            onClick={() => nav(`/merchants?view=${encodeURIComponent(merchantId || '')}&tab=stores`)}
          >
            <i className="bi bi-arrow-left" /> Merchants
          </button>

          <span>/</span>

          <span>Merchant Stores</span>
        </div>
      )}

      {/* =====================================
          LOADING
      ====================================== */}

      {loading ? (
        <section className="merchant-summary-card">
          Loading merchant details...
        </section>
      ) : error ? (
        <section
          className="merchant-summary-card"
          role="alert"
        >
          {error}

          <button
            type="button"
            onClick={() =>
              setAttempt((value) => value + 1)
            }
          >
            Retry
          </button>
        </section>
      ) : (
        <div className="merchant-stores-layout">

          {/* =====================================
              TOP HEADER
          ====================================== */}

          <section className="stores-card stores-header-card">
            <div className="stores-card-header">
              <div>
                <h2>Stores</h2>

                <p>
                  Manage the store locations for this
                  merchant.
                </p>
              </div>

              <button
                className="btn-new-store"
                type="button"
                onClick={handleNewStore}
              >
                <i className="bi bi-plus-lg" />
                New Store
              </button>
            </div>
          </section>

          {/* =====================================
              STORE LIST
          ====================================== */}

          <section className="stores-card store-list-card">

            <div className="store-list-heading">
              <h2>Store List</h2>
            </div>

            {/* SEARCH + RESET */}

            <div className="store-list-toolbar">

              <div className="store-search-box">
                <input
                  type="text"
                  value={search}
                  placeholder="Search stores by name, type or location..."
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <button
                type="button"
                className="store-reset-btn"
                onClick={handleReset}
              >
                <i className="bi bi-arrow-counterclockwise" />
                Reset
              </button>

            </div>

            {/* =====================================
                TABLE
            ====================================== */}

            <div className="store-table-wrapper">

              <table className="store-table">

                <thead>
                  <tr>
                    <th>Store ↑</th>
                    <th>Type ↕</th>
                    <th>Location ↕</th>
                    <th>Status ↕</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {visibleStores.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="store-empty-row"
                      >
                        No stores found for this merchant.
                      </td>
                    </tr>
                  ) : (
                    visibleStores.map((store, index) => {

                      const storeId =
                        getStoreId(store);

                      const storeName =
                        getStoreName(store);

                      const storeType =
                        getStoreType(store);

                      const location =
                        getStoreLocation(store);

                      const status =
                        getStoreStatus(store);

                      return (
                        <tr
                          key={
                            store.id ??
                            store.storeId ??
                            `store-${index}`
                          }
                        >

                          {/* STORE */}

                          <td>
                            <div className="store-name-cell">

                              <div className="store-icon">
                                <i className="bi bi-shop" />
                              </div>

                              <div className="store-name-info">

                                <strong>
                                  {storeName}
                                </strong>

                                <span>
                                  Store ID: {storeId}
                                </span>

                              </div>

                            </div>
                          </td>

                          {/* TYPE */}

                          <td>
                            <span className="store-type">
                              {storeType}
                            </span>
                          </td>

                          {/* LOCATION */}

                          <td>
                            <span className="store-location">
                              {location}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={`store-status-badge ${getStatusClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td>
                            <div className="store-actions">

                              <button
                                type="button"
                                className="store-config-btn"
                                onClick={() =>
                                  handleStoreConfiguration(
                                    store
                                  )
                                }
                              >
                                <i className="bi bi-sliders" />
                                Store Configuration
                              </button>

                              <button
                                type="button"
                                className="store-edit-btn"
                                onClick={() =>
                                  handleEdit(store)
                                }
                              >
                                <i className="bi bi-pencil" />
                                Edit
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}

                </tbody>

              </table>

            </div>

            {/* =====================================
                PAGINATION
            ====================================== */}

            <div className="store-pagination">

              <span className="store-pagination-info">
                Showing{" "}
                {filteredStores.length === 0
                  ? 0
                  : (currentPage - 1) *
                      pageSize +
                    1}{" "}
                to{" "}
                {Math.min(
                  currentPage * pageSize,
                  filteredStores.length
                )}{" "}
                of {filteredStores.length} entries
              </span>

              <div className="store-pagination-controls">

                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                >
                  ‹
                </button>

                <span>
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    setPage((value) =>
                      Math.min(
                        totalPages,
                        value + 1
                      )
                    )
                  }
                >
                  ›
                </button>

              </div>

            </div>

          </section>
        </div>
      )}
    </div>
  );
}