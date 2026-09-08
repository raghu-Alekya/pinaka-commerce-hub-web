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
function lastSync(value) {
  if (!value) return "—";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "—";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
  return new Date(time).toLocaleDateString();
}
export default function Stores() {
  const nav = useNavigate();
  const { data: reference, error: referenceError } = useReferenceData();
  const [stores, setStores] = useState([]),
    [merchants, setMerchants] = useState([]);
  const [query, setQuery] = useState(""),
    [merchant, setMerchant] = useState(""),
    [status, setStatus] = useState(""),
    [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
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
      (!merchant || s.merchantId === merchant) &&
      (!status || s.status === status) &&
      (!location || locationOf(s) === location),
  );
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
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Merchant"
            className="filter-select"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
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
            onChange={(e) => setStatus(e.target.value)}
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
            onChange={(e) => setLocation(e.target.value)}
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
                  "LAST SYNC",
                  "ACTION",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} role="status">
                    Loading stores…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} role="alert">
                    {error}
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((s) => (
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
                      <button
                        className="link-button"
                        onClick={() =>
                          nav(
                            `/merchants/${encodeURIComponent(s.merchantId)}/stores`,
                          )
                        }
                      >
                        {s.merchantName ||
                          merchants.find((m) => m.id === s.merchantId)?.name ||
                          s.merchantId}
                      </button>
                    </td>
                    <td>
                      <div className="location-cell">
                        <i className="bi bi-geo-alt" />
                        <span>{locationOf(s) || "—"}</span>
                      </div>
                    </td>
                    <td>{s.deviceCount ?? "—"}</td>
                    <td>
                      <span
                        className={`store-status ${String(s.status).toLowerCase()}`}
                      >
                        <i className="bi bi-circle-fill" /> {title(s.status)}
                      </span>
                    </td>
                    <td>{lastSync(s.lastSyncAt)}</td>
                    <td>
                      <div className="store-item-actions">
                        <button
                          className="action-btn"
                          aria-label={`Edit ${s.storeName}`}
                          title="Edit store"
                          onClick={() =>
                            nav(`/stores/${encodeURIComponent(s.id)}/edit`)
                          }
                        >
                          <i className="bi bi-three-dots" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No stores found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
