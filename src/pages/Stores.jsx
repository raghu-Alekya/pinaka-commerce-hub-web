import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteStore, listStores } from "../api/stores";
import { listMerchants } from "../api/merchants";
import { useReferenceData } from "../api/referenceData";
import Pagination from "../components/Pagination";
import ListActions from "../components/ListActions";

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
const displayStoreId = (store) =>
  [
    store.storeCode,
    store.store_code,
    store.code,
    store.storeId,
    store.storeID,
  ].find(
    (value) =>
      value &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(value),
      ),
  ) || store.id;

function exportStores(rows, merchants) {
  if (!rows.length) {
    alert("There are no stores to export.");
    return;
  }
  const header = ["Store", "Store ID", "Merchant", "Location", "POS Devices", "Status"];
  const data = rows.map((store) => [
    store.storeName,
    displayStoreId(store),
    merchantNameOf(store, merchants),
    locationOf(store),
    staticPosDeviceCounts[store.id] ?? 0,
    store.status,
  ]);
  const csv = [header, ...data]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pch-stores.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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
const [pageSize, setPageSize] = useState(10);

const handlePageSizeChange = (size) => {
  setPageSize(size);
  setCurrentPage(1);
};
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
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
  }, []);
  const rows = stores.filter(
    (s) =>
      (!query ||
        `${s.storeName} ${displayStoreId(s)}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!merchant || String(s.merchantId) === String(merchant)) &&
      (!status || s.status === status) &&
      (!location || locationOf(s) === location),
  );

 const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

const safeCurrentPage = Math.min(currentPage, totalPages);

const startIndex = (safeCurrentPage - 1) * pageSize;

const paginatedRows = rows.slice(
  startIndex,
  startIndex + pageSize
);

useEffect(() => {
  setCurrentPage(1);
}, [query, merchant, status, location]);

useEffect(() => {
  setCurrentPage((previous) =>
    Math.min(previous, totalPages)
  );
}, [totalPages]);
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
      "bi-building-fill",
      "Total Stores",
      stores.length,
      `${recent} added this week`,
    ],
    [
      "green",
      "bi-check-circle-fill",
      "Active Stores",
      activeCount,
      `${stores.length ? ((activeCount / stores.length) * 100).toFixed(1) : "0.0"}% of total`,
    ],
    [
      "red",
      "bi-x-circle-fill",
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
      "bi-exclamation-triangle-fill",
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
          <button className="add-store-btn btn-primary" onClick={() => nav("/stores/new")}>
            <i className="bi bi-plus-lg" /> Add Store
          </button>
          <button
            className="add-store-btn btn-secondary"
            type="button"
            onClick={() => exportStores(rows, merchants)}
          >
            <i className="bi bi-download" /> Export
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
          <div className="filter-select-wrapper">
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
    <i className="bi bi-chevron-down filter-select-arrow" />
</div> 

<div className="filter-select-wrapper">
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
    <i className="bi bi-chevron-down filter-select-arrow" />
</div>
        
         <div className="filter-select-wrapper">
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
    <i className="bi bi-chevron-down filter-select-arrow" />
</div> 
    
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
            <i className="bi bi-arrow-counterclockwise" /> Reset
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
                  "Store",
                  "Merchant",
                  "Location",
                  "POS Devices",
                  "Status",
                  "Action",
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
                        aria-label={`View ${s.storeName}`}
                        title="View store"
                        onClick={() =>
                          nav(
                            `/stores/${encodeURIComponent(s.id)}`,
                          )
                        }
                      >
                        <div className="store-avatar purple-bg">
                          {initials(s.storeName)}
                        </div>
                        <div>
                          <strong>{s.storeName}</strong>
                          <small>Store ID: {displayStoreId(s)}</small>
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
                    <td>{staticPosDeviceCounts[s.id] ?? 0}</td>
                    <td>
                      <span
                        className={`store-status ${String(s.status).toLowerCase()}`}
                      >
                        <i className="bi bi-circle-fill" /> {title(s.status)}
                      </span>
                    </td>
                    <td>
                      <ListActions
                         onView={() =>
                             nav(`/stores/${encodeURIComponent(s.id)}`)}
                         onEdit={() =>
                             nav(`/stores/${encodeURIComponent(s.id)}/edit`)}
                         onDelete={() => {
                             setDeleteError("");
                             setDeleteTarget(s); }}
                         viewLabel={`View ${s.storeName}`}
                         editLabel={`Edit ${s.storeName}`}
                         deleteLabel={`Delete ${s.storeName}`}
                           />
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

    <Pagination
  currentPage={safeCurrentPage}
  totalPages={totalPages}
  totalItems={rows.length}
  pageSize={pageSize}
  onPageChange={setCurrentPage}
  onPageSizeChange={handlePageSizeChange}
  itemLabel="stores"
/>

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

            <p className="pch-delete-warning">This action cannot be undone.</p>

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
                      (store) => String(store.id) !== deletedId,
                    ),
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
