import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listStores } from "../api/stores";
import { listMerchants } from "../api/merchants";
import { useReferenceData } from "../api/referenceData";

const title = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const locationOf = (store) =>
  [store.address?.city, store.address?.state].filter(Boolean).join(", ");
const initials = (name) =>
  String(name || "Store")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const merchantNameOf = (store, merchants) => {
  const merchant = merchants.find(
    (m) => String(m.id) === String(store.merchantId),
  );
  return (
    store.merchantName ||
    merchant?.name ||
    merchant?.merchantName ||
    store.merchantId ||
    "—"
  );
};

// Static POS device counts for UI display.
// Update these values when the real POS-device API is connected.
const staticPosDeviceCounts = {
  "STR-50069": 3,
  "STR-50021": 2,
  "STR-50007": 4,
  store1: 1,
};
export default function Stores() {
  const nav = useNavigate();
  const { data: reference, error: referenceError } = useReferenceData();
  const [stores, setStores] = useState([]),
    [merchants, setMerchants] = useState([]);
  const [query, setQuery] = useState(""),
    [merchant, setMerchant] = useState(""),
    [status, setStatus] = useState(""),
    [location, setLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([listStores(), listMerchants()])
      .then(([data, rows]) => {
        if (active) {
          setStores(data.stores || []);
          setMerchants(rows);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);
  const rows = stores.filter(
    (s) =>
      (!query ||
        `${s.storeName} ${s.id}`.toLowerCase().includes(query.toLowerCase())) &&
      (!merchant || String(s.merchantId) === String(merchant)) &&
      (!status || s.status === status) &&
      (!location || locationOf(s) === location),
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedRows = rows.slice(startIndex, startIndex + rowsPerPage);
  const showingFrom = rows.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + rowsPerPage, rows.length);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  const activeCount = stores.filter((s) => s.status === "ACTIVE").length;
  const recent = stores.filter(
    (s) => new Date(s.createdAt).getTime() >= Date.now() - 7 * 86400000,
  ).length;
  const hasConnectivity =
    stores.length > 0 && stores.every((s) => s.connectionStatus != null);
  const hasSync =
    stores.length > 0 && stores.every((s) => s.syncStatus != null);
  const offline = hasConnectivity
    ? stores.filter((s) => s.connectionStatus === "OFFLINE").length
    : null;
  const syncIssues = hasSync
    ? stores.filter((s) => ["ERROR", "FAILED"].includes(s.syncStatus)).length
    : null;
  const stats = [
    [
      "purple",
      "bi-shop",
      "Total Stores",
      stores.length,
      `${recent} added this week`,
    ],
    [
      "green",
      "bi-check-circle",
      "Active Stores",
      activeCount,
      `${stores.length ? ((activeCount / stores.length) * 100).toFixed(1) : "0.0"}% of total`,
    ],
    [
      "red",
      "bi-wifi-off",
      "Offline Stores",
      offline ?? "—",
      offline === null
        ? "Not available"
        : offline
          ? "Needs attention"
          : "All connected",
    ],
    [
      "orange",
      "bi-arrow-repeat",
      "Sync Issues",
      syncIssues ?? "—",
      syncIssues === null
        ? "Not available"
        : `${stores.length ? ((syncIssues / stores.length) * 100).toFixed(1) : "0.0"}% of stores`,
    ],
  ];
  const statuses = [
    ...new Set([
      ...(reference.storeStatuses || []).map((s) => s.toUpperCase()),
      ...stores.map((s) => s.status),
    ]),
  ];
  return (
    <div className="page-content stores-page">
      <div className="page-header">
        <div>
          <h1>Stores</h1>
          <p>Manage and monitor all stores connected to Pinaka Commerce Hub</p>
        </div>
        <div className="page-actions">
          <button
            className="refresh-btn"
            disabled={loading}
            onClick={() => setVersion((v) => v + 1)}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`} />{" "}
            Refresh
          </button>
          <button className="add-store-btn" onClick={() => nav("/stores/new")}>
            <i className="bi bi-plus-lg" /> Add Store
          </button>
        </div>
      </div>
      <div className="row g-3 summary-row">
        {stats.map(([color, icon, label, value, detail]) => (
          <div className="col-xl-3 col-md-6" key={label}>
            <div className="summary-card">
              <div className={`summary-icon ${color}`}>
                <i className={`bi ${icon}`} />
              </div>
              <div>
                <span>{label}</span>
                <strong>{loading || error ? "—" : value}</strong>
                <small className={`${color}-text`}>
                  {loading ? "Loading…" : error ? "Unavailable" : detail}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="stores-card">
        <div className="store-toolbar">
          <div className="store-search">
            <i className="bi bi-search" />
            <input
              aria-label="Search stores"
              placeholder="Search stores..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            aria-label="Merchant"
            className="filter-select"
            value={merchant}
            onChange={(e) => {
              setMerchant(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Merchants</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Status"
            className="filter-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Status</option>
            {statuses.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {title(s)}
              </option>
            ))}
          </select>
          <select
            aria-label="Location"
            className="filter-select"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Locations</option>
            {[...new Set(stores.map(locationOf).filter(Boolean))]
              .sort()
              .map((l) => (
                <option key={l}>{l}</option>
              ))}
          </select>
          <button
            className="filter-button"
            onClick={() => {
              setQuery("");
              setMerchant("");
              setStatus("");
              setLocation("");
              setCurrentPage(1);
            }}
          >
            <i className="bi bi-funnel" /> Clear
          </button>
        </div>
        {referenceError && (
          <p className="stores-feedback" role="alert">
            Could not load status options: {referenceError}
          </p>
        )}
        <div className="table-responsive">
          <table className="table stores-table">
            <thead>
              <tr>
                {[
                  "STORE",
                  "MERCHANT",
                  "LOCATION",
                  "POS DEVICES",
                  "STATUS",
                  "ACTION",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} role="status">
                    Loading stores…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} role="alert">
                    {error}
                  </td>
                </tr>
              ) : paginatedRows.length ? (
                paginatedRows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <button
                        type="button"
                        className="store-cell stores-name-button"
                        onClick={() =>
                          nav(`/stores/${encodeURIComponent(s.id)}/edit`)
                        }
                      >
                        <div className="store-avatar purple-bg">
                          {initials(s.storeName)}
                        </div>
                        <div>
                          <strong>{s.storeName}</strong>
                          <small>Store ID: {s.id}</small>
                        </div>
                      </button>
                    </td>
                    <td>
                      <div className="store-cell merchant-name-cell">
                        <div>
                          <strong>{merchantNameOf(s, merchants)}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="location-cell">
                        <i className="bi bi-geo-alt" />
                        <span>{locationOf(s) || "—"}</span>
                      </div>
                    </td>
                    <td>
                      {staticPosDeviceCounts[s.id] ?? 0}
                    </td>
                    <td>
                      <span
                        className={`store-status ${String(s.status).toLowerCase()}`}
                      >
                        <i className="bi bi-circle-fill" /> {title(s.status)}
                      </span>
                    </td>
                    <td>
                      <div className="store-item-actions">
                       <button
                          type="button"
                          className="action-btn"
                          aria-label={`View ${s.storeName}`}
                          title="View store"
                          onClick={() =>
                            nav(`/stores/${encodeURIComponent(s.id)}/configuration`)
                          }
                        >
                          <i className="bi bi-eye" />
                        </button>

                        <button
                          type="button"
                          className="action-btn"
                          aria-label={`Edit ${s.storeName}`}
                          title="Edit store"
                          onClick={() =>
                            nav(`/stores/${encodeURIComponent(s.id)}/edit`)
                          }
                        >
                          <i className="bi bi-pencil" />
                        </button>

                        <button
                          type="button"
                          className="action-btn delete-action-btn"
                          aria-label={`Delete ${s.storeName}`}
                          title="Delete store"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No stores found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="stores-pagination">
          <div className="pagination-info">
            Showing <strong>{showingFrom}</strong> to{" "}
            <strong>{showingTo}</strong> of <strong>{rows.length}</strong>{" "}
            stores
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-arrow"
              aria-label="Previous page"
              disabled={safeCurrentPage === 1}
              onClick={() => goToPage(safeCurrentPage - 1)}
            >
              <i className="bi bi-chevron-left" />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  className={`pagination-page ${page === safeCurrentPage ? "active" : ""
                    }`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              className="pagination-arrow"
              aria-label="Next page"
              disabled={safeCurrentPage === totalPages}
              onClick={() => goToPage(safeCurrentPage + 1)}
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

     {deleteTarget && (
  <div
    className="pch-delete-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-store-title"
    onClick={(event) => {
      if (event.target === event.currentTarget) {
        setDeleteTarget(null);
      }
    }}
  >
    <div className="pch-delete-modal">
      <div className="pch-delete-icon" aria-hidden="true">
        <i className="bi bi-trash3" />
      </div>

      <h2 id="delete-store-title">Delete Store?</h2>

      <p className="pch-delete-message">
        Are you sure you want to delete{" "}
        <strong>
          {deleteTarget.storeName || deleteTarget.name || "this store"}
        </strong>
        ?
      </p>

      <p className="pch-delete-warning">
        This action cannot be undone.
      </p>

      <div className="pch-delete-actions">
        <button
          type="button"
          className="pch-delete-cancel"
          onClick={() => setDeleteTarget(null)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="pch-delete-confirm"
          onClick={() => {
            const deletedId = String(deleteTarget.id);

            setStores((currentStores) =>
              currentStores.filter(
                (store) => String(store.id) !== deletedId
              )
            );

            setDeleteTarget(null);
          }}
        >
          Delete Store
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
