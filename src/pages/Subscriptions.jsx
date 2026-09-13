<<<<<<< HEAD
import { useReferenceData } from "../api/referenceData";
import { useEffect, useState } from "react";
import { listMerchants } from "../api/merchants";
import {
  listSubscriptions,
  listSubscriptionPlans,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  subscriptionPayload,
} from "../api/subscriptions";
const empty = {
  merchantId: "",
  planCode: "",
  planName: "",
  maxStoresAllowed: 1,
  entitlements: "",
  billingCycle: "MONTHLY",
  trialDays: 0,
  price: 0,
  status: "ACTIVE",
};
export default function Subscriptions() {
  const { data: reference, error: referenceError } = useReferenceData();
  const [rows, setRows] = useState([]),
    [merchants, setMerchants] = useState([]),
    [plans, setPlans] = useState([]);
  const [form, setForm] = useState(null),
    [editing, setEditing] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0),
    [filter, setFilter] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([listSubscriptions(), listMerchants(), listSubscriptionPlans()])
      .then(([s, m, p]) => {
        if (active) {
          setRows(s.subscriptions);
          setMerchants(m);
          setPlans(p.plans);
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
  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  async function edit(id) {
    setBusy(true);
    setError("");
    try {
      const { subscription: s } = await getSubscription(id);
      setForm({ ...s, entitlements: s.entitlements.join(", ") });
      setEditing(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (
        !plans.some(
          (p) => p.planCode === form.planCode && p.status === "ACTIVE",
        )
      )
        throw new Error("Select an active master plan.");
      const payload = subscriptionPayload(form);
      if (editing) await updateSubscription(editing, payload);
      else
        await createSubscription({ ...payload, merchantId: form.merchantId });
      setForm(null);
      setEditing(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(row) {
    if (!window.confirm(`Delete subscription ${row.id} for ${row.merchantId}?`))
      return;
    setBusy(true);
    setError("");
    try {
      await deleteSubscription(row.id);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function choosePlan(code) {
    const p = plans.find((p) => p.planCode === code);
    if (p)
      setForm((f) => ({
        ...f,
        planCode: p.planCode,
        planName: p.planName,
        maxStoresAllowed: p.maxStoresAllowed,
        entitlements: p.entitlements.join(", "),
        billingCycle: p.billingCycle,
        trialDays: p.trialDays,
        price: p.price,
      }));
    else field("planCode", code);
  }
  const names = new Map(merchants.map((m) => [m.id, m.name]));
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Subscriptions</h1>
          <p>Manage merchant plans and billing periods</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary"
            disabled={loading || busy}
            onClick={() => setVersion((v) => v + 1)}
          >
            Refresh
          </button>
          <button
            className="btn btn-primary"
            disabled={loading || busy}
            onClick={() => {
              setEditing(null);
              setForm({ ...empty });
              setError("");
            }}
          >
            Add Subscription
          </button>
        </div>
      </div>
      {(error || referenceError) && (
        <p role="alert">{error || referenceError}</p>
      )}
      {!loading && !plans.some((p) => p.status === "ACTIVE") && (
        <p>
          No active plans are available in the subscription master. Add or
          activate a master plan before creating a subscription.
        </p>
      )}
      {form && (
        <form className="form-card" onSubmit={save}>
          <h2>{editing ? "Edit" : "Add"} Subscription</h2>
          <fieldset disabled={busy}>
            <div className="form-grid">
              <label className="form-group">
                Merchant
                <select
                  required
                  disabled={Boolean(editing)}
                  value={form.merchantId}
                  onChange={(e) => field("merchantId", e.target.value)}
                >
                  <option value="">Select merchant</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                Plan
                <select
                  required
                  value={form.planCode}
                  onChange={(e) => choosePlan(e.target.value)}
                >
                  <option value="">Select plan</option>
                  {[
                    ...new Set(
                      [
                        ...plans
                          .filter((p) => p.status === "ACTIVE")
                          .map((p) => p.planCode),
                        form.planCode,
                      ].filter(Boolean),
                    ),
                  ].map((code) => (
                    <option key={code} value={code}>
                      {plans.find((p) => p.planCode === code)?.planName || code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                Plan name
                <input
                  required
                  readOnly
                  value={form.planName}
                  onChange={(e) => field("planName", e.target.value)}
                />
              </label>
              {["maxStoresAllowed", "trialDays", "price"].map((key) => (
                <label className="form-group" key={key}>
                  {
                    {
                      maxStoresAllowed: "Maximum stores",
                      trialDays: "Trial days",
                      price: "Price",
                    }[key]
                  }
                  <input
                    required
                    type="number"
                    min={key === "maxStoresAllowed" ? 1 : 0}
                    step={key === "price" ? "0.01" : "1"}
                    readOnly
                    value={form[key]}
                    onChange={(e) => field(key, e.target.value)}
                  />
                </label>
              ))}
              <label className="form-group">
                Billing cycle
                <select
                  disabled
                  value={form.billingCycle}
                  onChange={(e) => field("billingCycle", e.target.value)}
                >
                  {(reference.billingCycles || []).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                Status
                <select
                  value={form.status}
                  onChange={(e) => field("status", e.target.value)}
                >
                  {(reference.subscriptionStatuses || []).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              {["currentPeriodStart", "currentPeriodEnd"].map((key) => (
                <label className="form-group" key={key}>
                  {key === "currentPeriodStart"
                    ? "Period start (UTC)"
                    : "Period end (UTC)"}
                  <input
                    type="datetime-local"
                    value={form[key] ? form[key].slice(0, 16) : ""}
                    onChange={(e) =>
                      field(key, e.target.value ? e.target.value + "Z" : "")
                    }
                  />
                </label>
              ))}
              <label className="form-group">
                Entitlements (comma-separated)
                <input
                  readOnly
                  value={form.entitlements}
                  onChange={(e) => field("entitlements", e.target.value)}
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                {busy ? "Saving…" : "Save subscription"}
              </button>
            </div>
          </fieldset>
        </form>
      )}
      <div className="stores-card">
        <div className="store-toolbar">
          <input
            aria-label="Search subscriptions"
            placeholder="Search merchant or plan…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {loading ? (
          <p role="status">Loading subscriptions…</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {[
                    "Merchant",
                    "Plan",
                    "Billing cycle",
                    "Price",
                    "Status",
                    "Period end",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((s) =>
                    `${names.get(s.merchantId)} ${s.merchantId} ${s.planName}`
                      .toLowerCase()
                      .includes(filter.toLowerCase()),
                  )
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{names.get(s.merchantId) || s.merchantId}</td>
                      <td>{s.planName}</td>
                      <td>{s.billingCycle}</td>
                      <td>{Number(s.price).toFixed(2)}</td>
                      <td>{s.status}</td>
                      <td>
                        {s.currentPeriodEnd
                          ? new Date(s.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          disabled={busy}
                          className="btn btn-secondary"
                          onClick={() => edit(s.id)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          disabled={busy}
                          className="btn btn-secondary"
                          onClick={() => remove(s)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={7}>No subscriptions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
=======
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialSubscriptions = [
  {
    id: "M001",
    merchant: "Pinaka Mart LLC",
    plan: "Pro Plan",
    status: "Active",
    startDate: "12 Apr 2025",
    startDateValue: "2025-04-12",
    endDate: "12 Apr 2026",
    stores: 2,
    devices: 5,
  },
  
  {
    id: "M002",
    merchant: "Sunshine Market",
    plan: "Pro Plan",
    status: "Active",
    startDate: "18 Apr 2025",
    startDateValue: "2025-04-18",
    endDate: "18 Apr 2026",
    stores: 4,
    devices: 10,
  },
  {
    id: "M003",
    merchant: "GreenLeaf Store",
    plan: "Basic Plan",
    status: "Active",
    startDate: "01 May 2025",
    startDateValue: "2025-05-01",
    endDate: "01 May 2026",
    stores: 1,
    devices: 3,
  },
  {
    id: "M004",
    merchant: "Foodies Corner",
    plan: "Pro Plan",
    status: "Active",
    startDate: "05 Apr 2025",
    startDateValue: "2025-04-05",
    endDate: "05 Apr 2026",
    stores: 3,
    devices: 7,
  },
  {
    id: "M005",
    merchant: "WaveMart Stores",
    plan: "Enterprise Plan",
    status: "Expired",
    startDate: "10 Jan 2025",
    startDateValue: "2025-01-10",
    endDate: "10 Jan 2026",
    stores: 5,
    devices: 12,
  },
];

export default function MerchantSubscriptions() {
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [merchantFilter, setMerchantFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");

  const merchantNames = useMemo(() => {
    return [...new Set(subscriptions.map((item) => item.merchant))];
  }, [subscriptions]);

  const merchantScopedSubscriptions = useMemo(() => {
    return subscriptions.filter((item) =>
      item.merchant.toLowerCase().includes(merchantFilter.toLowerCase())
    );
  }, [subscriptions, merchantFilter]);

  const availablePlans = useMemo(() => {
    return [...new Set(merchantScopedSubscriptions.map((item) => item.plan))];
  }, [merchantScopedSubscriptions]);

  const availableStatuses = useMemo(() => {
    return [
      ...new Set(merchantScopedSubscriptions.map((item) => item.status)),
    ];
  }, [merchantScopedSubscriptions]);

  const availableStoreCounts = useMemo(() => {
    return [
      ...new Set(merchantScopedSubscriptions.map((item) => item.stores)),
    ].sort((a, b) => a - b);
  }, [merchantScopedSubscriptions]);

  const availableStartDates = useMemo(() => {
    return merchantScopedSubscriptions
      .map((item) => item.startDateValue)
      .sort();
  }, [merchantScopedSubscriptions]);

  const merchantMinDate = availableStartDates[0] || "";
  const merchantMaxDate = availableStartDates.at(-1) || "";

  useEffect(() => {
    if (planFilter && !availablePlans.includes(planFilter)) {
      setPlanFilter("");
    }

    if (statusFilter && !availableStatuses.includes(statusFilter)) {
      setStatusFilter("");
    }

    if (storeFilter && !availableStoreCounts.includes(Number(storeFilter))) {
      setStoreFilter("");
    }

    if (fromDate && merchantMinDate && fromDate < merchantMinDate) {
      setFromDate("");
    }

    if (toDate && merchantMaxDate && toDate > merchantMaxDate) {
      setToDate("");
    }
  }, [
    planFilter,
    statusFilter,
    storeFilter,
    fromDate,
    toDate,
    availablePlans,
    availableStatuses,
    availableStoreCounts,
    merchantMinDate,
    merchantMaxDate,
  ]);

  const filteredSubscriptions = useMemo(() => {
    return merchantScopedSubscriptions.filter((item) => {
      const planMatches = !planFilter || item.plan === planFilter;
      const statusMatches = !statusFilter || item.status === statusFilter;
      const storeMatches = !storeFilter || item.stores === Number(storeFilter);

      const fromDateMatches =
        !fromDate || item.startDateValue >= fromDate;

      const toDateMatches =
        !toDate || item.startDateValue <= toDate;

      return (
        planMatches &&
        statusMatches &&
        storeMatches &&
        fromDateMatches &&
        toDateMatches
      );
    });
  }, [
    merchantScopedSubscriptions,
    planFilter,
    statusFilter,
    storeFilter,
    fromDate,
    toDate,
  ]);

  function editSubscription(subscription) {
    navigate("/subscriptions", {
      state: { subscription },
    });
  }

  function confirmDelete() {
    setSubscriptions((current) =>
      current.filter((item) => item.id !== deleteTarget.id)
    );

    setMessage(`${deleteTarget.merchant} subscription deleted.`);
    setDeleteTarget(null);
  }

  return (
    <section className="merchant-subscriptions-page">
      <div className="merchant-subscriptions-heading">
        <div>
          <h1>Merchant Subscriptions</h1>
          <p>View and manage subscription details for all merchants.</p>
        </div>
      </div>

      <section className="merchant-subscription-filter-card">
 <div className="merchant-filter-grid">
  <label className="merchant-filter-field">
    <span>Merchant</span>
    <div className="merchant-filter-input">
      <i className="bi bi-search" />
      <input
        list="merchant-options"
        type="search"
        value={merchantFilter}
        onChange={(e) => setMerchantFilter(e.target.value)}
        placeholder="Search or select merchant"
      />
      <datalist id="merchant-options">
        {merchantNames.map((merchant) => (
          <option key={merchant} value={merchant} />
        ))}
      </datalist>
    </div>
  </label>

  <label className="merchant-filter-field">
    <span>Plan</span>
    <select
      value={planFilter}
      onChange={(e) => setPlanFilter(e.target.value)}
    >
      <option value="">All Plans</option>
      {availablePlans.map((plan) => (
        <option key={plan} value={plan}>
          {plan}
        </option>
      ))}
    </select>
  </label>

  <label className="merchant-filter-field">
    <span>Status</span>
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      <option value="">All Statuses</option>
      {availableStatuses.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  </label>

  <label className="merchant-filter-field">
    <span>Stores</span>
    <select
      value={storeFilter}
      onChange={(e) => setStoreFilter(e.target.value)}
    >
      <option value="">All Store Counts</option>
      {availableStoreCounts.map((count) => (
        <option key={count} value={count}>
          {count} {count === 1 ? "Store" : "Stores"}
        </option>
      ))}
    </select>
  </label>

  <label className="merchant-filter-field">
    <span>Start Date From</span>
    <input
      type="date"
      min={merchantMinDate}
      max={merchantMaxDate}
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
    />
  </label>

  <label className="merchant-filter-field">
    <span>Start Date To</span>
    <input
      type="date"
      min={merchantMinDate}
      max={merchantMaxDate}
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
    />
  </label>

  <button
    type="button"
    className="merchant-filter-reset-icon"
    title="Reset filters"
    aria-label="Reset filters"
    onClick={() => {
      setMerchantFilter("");
      setPlanFilter("");
      setStatusFilter("");
      setStoreFilter("");
      setFromDate("");
      setToDate("");
    }}
  >
    <i className="bi bi-arrow-counterclockwise" />
  </button>
</div>
</section>

      <div className="merchant-subscriptions-table-frame">
        <div className="merchant-subscriptions-table">
  {/* Header */}
  <div className="merchant-subscription-row merchant-subscription-row-head">
    <div>Merchant</div>
    <div>Store ID</div>
    <div>Plan</div>
    <div>Status</div>
    <div>Start Date</div>
    <div>End Date</div>
    <div>Stores</div>
    <div>Devices</div>
    <div className="merchant-subscription-actions-heading">Actions</div>
  </div>

  {/* Rows */}
  {filteredSubscriptions.map((item) => (
    <div className="merchant-subscription-row" key={item.id}>
      {/* Merchant */}
      <div className="merchant-subscription-merchant">
        <div className="merchant-subscription-icon">
          <i className="bi bi-shop-window" />
        </div>
        <strong>{item.merchant}</strong>
      </div>

      {/* Store ID */}
      <div className="merchant-store-id">{item.id}</div>

      {/* Plan */}
      <div>{item.plan}</div>

      {/* Status */}
      <div>
        <span
          className={`merchant-subscription-status ${
            item.status === "Expired"
              ? "merchant-subscription-status-expired"
              : ""
          }`}
        >
          <span className="merchant-subscription-status-dot" />
          {item.status}
        </span>
      </div>

      {/* Dates */}
      <div>{item.startDate}</div>
      <div>{item.endDate}</div>

      {/* Stores */}
      <div>{item.stores}</div>

      {/* Devices */}
      <div>{item.devices}</div>

      {/* Actions */}
      <div className="merchant-subscription-actions">
        <button
          type="button"
          className="merchant-subscription-icon-action merchant-subscription-edit-action"
          title="Edit subscription"
          onClick={() => editSubscription(item)}
        >
          <i className="bi bi-pencil" />
        </button>

        <button
          type="button"
          className="merchant-subscription-icon-action merchant-subscription-delete-action"
          title="Delete subscription"
          onClick={() => setDeleteTarget(item)}
        >
          <i className="bi bi-trash3" />
        </button>
      </div>
    </div>
  ))}
</div>

        {filteredSubscriptions.length === 0 && (
          <div className="merchant-subscription-empty">
            No subscriptions match the selected filters.
          </div>
        )}
      </div>

      {deleteTarget && (
        <div
          className="delete-subscription-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-subscription-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-subscription-icon">
              <i className="bi bi-trash3" />
            </div>

            <h2>Delete Subscription?</h2>

            <p>
              Are you sure you want to delete the subscription for{" "}
              <strong>{deleteTarget.merchant}</strong>? This action cannot be
              undone.
            </p>

            <div className="delete-subscription-actions">
              <button
                type="button"
                className="delete-keep-button"
                onClick={() => setDeleteTarget(null)}
              >
                No, Keep It
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="merchant-subscription-toast">
          <span>{message}</span>

          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </section>
  );
}
>>>>>>> dev
