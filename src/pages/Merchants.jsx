import { useReferenceData } from "../api/referenceData";
import { listSubscriptionPlans } from "../api/subscriptions";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMerchants } from "../api/merchants";
import { ApiError } from "../api/http";

function exportMerchants(rows) {
  if (!rows.length) {
    alert("There are no merchants to export.");
    return;
  }
  const header = [
    "Merchant",
    "Merchant ID",
    "Contact",
    "Phone",
    "Stores",
    "Subscription Plan",
    "Status",
    "Joined On",
    "Last Active",
  ];
  const data = rows.map((m) => [
    m.name,
    m.id,
    m.email,
    m.phone,
    m.stores,
    m.plan,
    m.status,
    m.joined,
    m.active,
  ]);
  const csv = [header, ...data]
    .map((row) =>
      row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pch-merchants.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function avatarClass(index) {
  return ["purple-avatar", "blue-avatar", "green-avatar"][index % 3];
}

function monthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function Merchants() {
  const nav = useNavigate();
  const { data: reference } = useReferenceData();
  const [masterPlans, setMasterPlans] = useState([]);
  useEffect(() => {
    let active = true;
    listSubscriptionPlans()
      .then((d) => {
        if (active) setMasterPlans(d.plans);
      })
      .catch(e => { if(active) setError(e.message); });
    return () => {
      active = false;
    };
  }, []);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMerchants() {
      setLoading(true);
      setError("");
      try {
        const rows = await listMerchants();
        if (!cancelled) setMerchants(rows);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load merchants from the API.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMerchants();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () =>
      merchants.filter(
        (m) =>
          (!q ||
            `${m.name} ${m.id} ${m.email}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (!status || m.status === status) &&
          (!plan || m.plan === plan),
      ),
    [merchants, q, status, plan],
  );

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;
  const total = merchants.length;
  const activeCount = merchants.filter((m) => m.status === "Active").length;
  const suspendedCount = merchants.filter(
    (m) => m.status === "Suspended",
  ).length;
  const inactiveCount = merchants.filter((m) => m.status === "Inactive").length;
  const newThisMonth = merchants.filter(
    (m) => monthKey(m.createdAt) === thisMonth,
  ).length;
  const newLastMonth = merchants.filter(
    (m) => monthKey(m.createdAt) === lastMonth,
  ).length;
  const monthChange =
    newLastMonth === 0
      ? newThisMonth > 0
        ? "New this month"
        : "No new merchants"
      : `${Math.abs(Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100))}% vs last month`;
  const activePct = total
    ? `${((activeCount / total) * 100).toFixed(1)}% of total`
    : "0% of total";
  const inactivePct = total
    ? `${((inactiveCount / total) * 100).toFixed(1)}% of total`
    : "0% of total";

  const stat = [
    [
      "purple",
      "bi-people-fill",
      "Total Merchants",
      String(total),
      `${newThisMonth} this month`,
    ],
    [
      "green",
      "bi-check-circle-fill",
      "Active Merchants",
      String(activeCount),
      activePct,
    ],
    [
      "orange",
      "bi-pause-circle-fill",
      "Suspended Merchants",
      String(suspendedCount),
      `${suspendedCount} currently`,
    ],
    [
      "red",
      "bi-x-circle-fill",
      "Inactive Merchants",
      String(inactiveCount),
      inactivePct,
    ],
    [
      "blue",
      "bi-person-plus-fill",
      "New This Month",
      String(newThisMonth),
      monthChange,
    ],
  ];

  const plans = [...new Set(masterPlans.map((p) => p.planName))];
  const statuses = [
    ...new Set([
      ...(reference.merchantStatuses || []),
      ...merchants.map((m) => m.status),
    ]),
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Merchants</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>
              <i className="bi bi-chevron-right" />
            </span>
            <strong>Merchants</strong>
          </div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => nav("/merchants/new")}
          >
            <i className="bi bi-plus-lg" /> Add Merchant
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => exportMerchants(rows)}
          >
            <i className="bi bi-download" /> Export
          </button>
        </div>
      </div>
      <div className="row g-3 stats-grid">
        {stat.map((x, i) => (
          <div className="col-xl col-lg-4 col-md-6" key={x[2]}>
            <div className="stat-card">
              <div className={`stat-icon ${x[0]}`}>
                <i className={`bi ${x[1]}`} />
              </div>
              <div className="stat-content">
                <span>{x[2]}</span>
                <strong>{x[3]}</strong>
                <small
                  className={
                    i === 0 || i === 4 ? "positive" : i === 2 ? "negative" : ""
                  }
                >
                  <i
                    className={`bi ${i === 2 ? "bi-arrow-down" : "bi-arrow-up"}`}
                  />{" "}
                  {x[4]}
                </small>
                {(i === 1 || i === 3) && (
                  <div className={`progress ${i === 3 ? "red-progress" : ""}`}>
                    <div
                      style={{
                        width:
                          i === 1
                            ? `${total ? (activeCount / total) * 100 : 0}%`
                            : `${total ? (inactiveCount / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="merchant-table-card">
        <div className="filter-bar">
          <div className="merchant-search">
            <i className="bi bi-search" />
            <input
              id="merchantSearch"
              placeholder="Search merchants..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            id="statusFilter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            id="subscriptionFilter"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="">All Plans</option>
            {plans.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button className="date-filter">
            <i className="bi bi-calendar3" /> Select date range
          </button>
          <button
            className="filter-button"
            onClick={() => {
              setQ("");
              setStatus("");
              setPlan("");
            }}
          >
            <i className="bi bi-funnel" /> Filters
          </button>
        </div>
        <div className="table-wrapper">
          <table className="merchant-table">
            <thead>
              <tr>
                <th>MERCHANT</th>
                <th>CONTACT</th>
                <th>STORES</th>
                <th>SUBSCRIPTION PLAN</th>
                <th>STATUS</th>
                <th>JOINED ON</th>
                <th>LAST ACTIVE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Loading merchants...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8}>{error}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>No merchants found.</td>
                </tr>
              ) : (
                rows.map((m, index) => (
                  <tr key={m.id}>
                    <td>
                      <div
                        className="merchant-name clickable"
                        onClick={() => nav(`/merchants/${m.id}/stores`)}
                      >
                        <div
                          className={`merchant-avatar ${avatarClass(index)}`}
                        >
                          {m.initials}
                        </div>
                        <div>
                          <strong>{m.name}</strong>
                          <small>{m.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <strong>{m.email || "—"}</strong>
                        <span>{m.phone || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{m.stores}</strong>
                      <small> stores</small>
                    </td>
                    <td>
                      <div className="plan-info">
                        <strong>{m.plan}</strong>
                        {m.renewal ? <span>Renews on {m.renewal}</span> : null}
                      </div>
                    </td>
                    <td>
                      <span className={`status ${m.status.toLowerCase()}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>{m.joined}</td>
                    <td>
                      <span className="last-active active-dot">
                        <i className="bi bi-circle-fill" /> {m.active}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => nav(`/merchants/${m.id}/stores`)}
                          title="View"
                        >
                          <i className="bi bi-eye" />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => nav(`/merchants/${m.id}/edit`)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="action-btn more-btn" title="More">
                          <i className="bi bi-three-dots-vertical" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
