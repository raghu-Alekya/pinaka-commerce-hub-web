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
import { useMemo, useState } from "react";
import {
  Eye,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Store,
  CheckCircle2,
  XCircle,
  Clock3,
  ArrowLeft,
  ArrowRight,
  Check,
  ArrowLeftRight,
  Info,
  CreditCard,
  Lock,
  Smartphone,
  Landmark,
  CircleCheck,
} from "lucide-react";

import "../styles/Merchant-subscriptions.css";

/* ========================================
   MERCHANT DATA
======================================== */
>>>>>>> 4cefd039ab78ef6438d7c897b58c01866655dd51

const initialSubscriptions = [
  {
    id: "MID001",
    merchant: "Pinaka Mart LLC",
    plan: "Pro Plan",
    stores: 2,
    devices: 5,
    start: "12 Apr 2025",
    end: "12 Apr 2026",
    status: "Active",
  },
  {
    id: "MID002",
    merchant: "Sunshine Market",
    plan: "Pro Plan",
    stores: 4,
    devices: 10,
    start: "18 Apr 2025",
    end: "18 Apr 2026",
    status: "Active",
  },
  {
    id: "MID003",
    merchant: "GreenLeaf Store",
    plan: "Basic Plan",
    stores: 1,
    devices: 3,
    start: "01 May 2025",
    end: "01 May 2026",
    status: "Active",
  },
  {
    id: "MID004",
    merchant: "Urban Eats",
    plan: "Enterprise Plan",
    stores: 5,
    devices: 12,
    start: "20 Apr 2025",
    end: "20 Apr 2026",
    status: "Expiring Soon",
  },
  {
    id: "MID005",
    merchant: "Tasty Bites",
    plan: "Basic Plan",
    stores: 3,
    devices: 6,
    start: "15 Mar 2024",
    end: "15 Mar 2025",
    status: "Inactive",
  },
];

<<<<<<< HEAD
 function MerchantSubscriptions() {
  const navigate = useNavigate();
=======
/* ========================================
   SUBSCRIPTION PLANS
======================================== */
>>>>>>> 4cefd039ab78ef6438d7c897b58c01866655dd51

const plans = [
  {
    name: "Basic Plan",
    description: "Starter plan for small businesses",
    price: 999,
    yearly: 9990,
    stores: 2,
    devices: 5,
    features: [
      "Store Management",
      "Device Management",
      "Basic Reports",
      "Email Support",
    ],
  },
  {
    name: "Pro Plan",
    description: "Most popular for growing businesses",
    price: 2499,
    yearly: 24990,
    stores: 5,
    devices: 10,
    features: [
      "Store Management",
      "Device Management",
      "Advanced Reports",
      "Priority Support",
      "Email & Chat Support",
    ],
  },
  {
    name: "Enterprise Plan",
    description: "For large businesses",
    price: 4999,
    yearly: 49990,
    stores: 10,
    devices: 25,
    features: [
      "All Pro Features",
      "Multi-location Support",
      "Custom Integrations",
      "Dedicated Support",
    ],
  },
];

const planData = Object.fromEntries(plans.map((plan) => [plan.name, plan]));

const formatPrice = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

/* ========================================
   COMMON COMPONENTS
======================================== */

function StatusBadge({ status }) {
  return (
    <span
      className={`status-badge ${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <i />
      {status}
    </span>
  );
}

function PageBack({ label, onClick }) {
  return (
    <button className="page-back" onClick={onClick}>
      <ArrowLeft size={17} />
      {label}
    </button>
  );
}

function SelectField({ value, onChange, children }) {
  return (
    <div className="select-field">
      <select value={value} onChange={onChange}>
        {children}
      </select>
      <ChevronDown size={16} />
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* ========================================
   LIST SCREEN
======================================== */

function SubscriptionList({ subscriptions, onView }) {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [stores, setStores] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return subscriptions.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        item.merchant.toLowerCase().includes(searchValue) ||
        item.id.toLowerCase().includes(searchValue);

      const matchesPlan = !plan || item.plan === plan;
      const matchesStatus = !status || item.status === status;
      const matchesStores = !stores || String(item.stores) === stores;

      return matchesSearch && matchesPlan && matchesStatus && matchesStores;
    });
  }, [subscriptions, search, plan, status, stores]);

  const resetFilters = () => {
    setSearch("");
    setPlan("");
    setStatus("");
    setStores("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <section className="merchant-subscriptions-page">
      <div className="subscriptions-heading-row">
        <div>
          <h1>Merchant Subscriptions</h1>
          <p>View and manage subscription details for all merchants.</p>
        </div>

        <button className="export-button">
          <Download size={17} />
          Export
        </button>
      </div>

      {/* OVERVIEW */}

      <div className="subscription-overview">
        <div className="overview-cards">
          <div className="overview-card">
            <span className="overview-icon purple">
              <Store size={24} />
            </span>
            <div>
              <p>Total Merchants</p>
              <strong>24</strong>
              <small className="positive">+3 this month</small>
            </div>
          </div>

          <div className="overview-card">
            <span className="overview-icon green">
              <CheckCircle2 size={25} />
            </span>
            <div>
              <p>
                Active
                <br />
                Subscriptions
              </p>
              <strong>20</strong>
              <small className="positive">83.3% of total</small>
            </div>
          </div>

          <div className="overview-card">
            <span className="overview-icon red">
              <XCircle size={25} />
            </span>
            <div>
              <p>
                Inactive
                <br />
                Subscriptions
              </p>
              <strong>2</strong>
              <small className="negative">8.3% of total</small>
            </div>
          </div>

          <div className="overview-card">
            <span className="overview-icon orange">
              <Clock3 size={25} />
            </span>
            <div>
              <p>Expiring Soon</p>
              <strong>2</strong>
              <small className="warning">Within 30 days</small>
            </div>
          </div>
        </div>

        {/* PLAN DISTRIBUTION */}

        <div className="distribution-card">
          <h2>Subscription Plan Distribution</h2>
          <p>Number of merchants by subscription plan</p>

          <div className="distribution-content">
            <div className="donut">
              <div>
                <strong>24</strong>
                <span>Merchants</span>
              </div>
            </div>

            <div className="plan-legend">
              <div className="legend-row">
                <span className="legend-name">
                  <i className="legend-dot purple" />
                  Basic Plan
                </span>
                <b>6</b>
                <span>25.0%</span>
              </div>

              <div className="legend-row">
                <span className="legend-name">
                  <i className="legend-dot blue" />
                  Pro Plan
                </span>
                <b>12</b>
                <span>50.0%</span>
              </div>

              <div className="legend-row">
                <span className="legend-name">
                  <i className="legend-dot orange" />
                  Enterprise Plan
                </span>
                <b>6</b>
                <span>25.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}

      <div className="subscription-filter-card">
        <div className="search-field">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search merchant name"
          />
        </div>

        <SelectField
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Plans</option>
          <option>Basic Plan</option>
          <option>Pro Plan</option>
          <option>Enterprise Plan</option>
        </SelectField>

        <SelectField
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Expiring Soon</option>
        </SelectField>

        <SelectField
          value={stores}
          onChange={(e) => {
            setStores(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Store Counts</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "Store" : "Stores"}
            </option>
          ))}
        </SelectField>

        <label className="date-field">
          <span>Start Date From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label className="date-field">
          <span>Start Date To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        {/* Reset removed from visible UI as requested */}
      </div>

      {/* TABLE */}

      <div className="subscription-table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Merchant</th>
                <th>Plan</th>
                <th>Stores</th>
                <th>Devices</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>

                  <td>
                    <div className="merchant-cell">
                      <span className="merchant-icon">
                        <Store size={19} />
                      </span>

                      <div>
                        <strong>{item.merchant}</strong>
                        <small>{item.id}</small>
                      </div>
                    </div>
                  </td>

                  <td>{item.plan}</td>
                  <td>{item.stores}</td>
                  <td>{item.devices}</td>
                  <td>{item.start}</td>
                  <td>{item.end}</td>

                  <td>
                    <StatusBadge status={item.status} />
                  </td>

                  <td>
                    <div className="row-actions">
                      {/* ONLY VIEW BUTTON */}
                      <button
                        className="view-action-button"
                        title="View Subscription"
                        aria-label={`View subscription for ${item.merchant}`}
                        onClick={() => onView(item)}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-row">
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing 1 to {filtered.length} of 24 results</span>

          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              <ChevronLeft size={17} />
            </button>

            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={page === n ? "active" : ""}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}

            <button
              disabled={page === 5}
              onClick={() => setPage(Math.min(5, page + 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
<<<<<<< HEAD
=======

/* ========================================
   DETAILS SCREEN
======================================== */

function SubscriptionDetails({ merchant, onBack, onChangePlan }) {
  const currentPlan = planData[merchant.plan];

  return (
    <section className="subscription-flow-page">
      <PageBack label="Back to Subscriptions" onClick={onBack} />

      <h1>Subscription Details</h1>
      <p className="flow-subtitle">
        View subscription information for this merchant.
      </p>

      <div className="merchant-summary-card">
        <div className="merchant-summary-icon">
          <Store size={25} />
        </div>

        <div>
          <h3>{merchant.merchant}</h3>
          <span>{merchant.id}</span>
        </div>

        <StatusBadge status={merchant.status} />
      </div>

      <div className="flow-card">
        <h3>Subscription Information</h3>

        <div className="details-grid">
          <DetailRow label="Merchant Name" value={merchant.merchant} />
          <DetailRow label="Current Plan" value={merchant.plan} />
          <DetailRow
            label="Status"
            value={<StatusBadge status={merchant.status} />}
          />
          <DetailRow label="Start Date" value={merchant.start} />
          <DetailRow label="End Date" value={merchant.end} />
          <DetailRow
            label="Stores"
            value={`${merchant.stores} (of ${currentPlan?.stores} allowed)`}
          />
          <DetailRow
            label="Devices"
            value={`${merchant.devices} (of ${currentPlan?.devices} allowed)`}
          />
        </div>
      </div>

      <div className="flow-card">
        <h3>Plan Features</h3>

        <ul className="feature-list">
          {currentPlan?.features.map((feature) => (
            <li key={feature}>
              <Check size={16} />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        className="primary-flow-button change-plan-action"
        onClick={onChangePlan}
      >
        <ArrowLeftRight size={17} />
        Change Subscription Plan
      </button>
    </section>
  );
}

/* ========================================
   CHOOSE PLAN SCREEN
======================================== */

function ChoosePlan({
  merchant,
  selectedPlan,
  setSelectedPlan,
  onBack,
  onNext,
}) {
  return (
    <section className="subscription-flow-page">
      <PageBack label="Back to Subscription Details" onClick={onBack} />

      <h1>Choose Subscription Plan</h1>
      <p className="flow-subtitle">
        Select a new plan for {merchant.merchant}.
      </p>

      <div className="plans-grid">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.name;
          const isCurrent = merchant.plan === plan.name;

          return (
            <div
              className={`plan-card ${isSelected ? "selected" : ""}`}
              key={plan.name}
              onClick={() => {
                if (!isCurrent) {
                  setSelectedPlan(plan.name);
                }
              }}
            >
              {isCurrent && (
                <span className="current-plan-badge">Current Plan</span>
              )}

              {plan.name === "Pro Plan" && (
                <span className="popular-badge">Most Popular</span>
              )}

              <div className="plan-card-header">
                <div>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                </div>

                <span className="plan-radio">
                  {isSelected ? <Check size={14} /> : ""}
                </span>
              </div>

              <div className="plan-price">
                {formatPrice(plan.price)}
                <span> / month</span>
              </div>

              <div className="plan-yearly">
                or {formatPrice(plan.yearly)} / year
                <span>Save 17%</span>
              </div>

              <div className="plan-divider" />

              <p>
                Up to <b>{plan.stores} Stores</b>
              </p>

              <p>
                Up to <b>{plan.devices} Devices</b>
              </p>

              <ul className="feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`select-plan-btn ${isSelected ? "chosen" : ""}`}
                disabled={isCurrent}
                onClick={(e) => {
                  e.stopPropagation();

                  if (!isCurrent) {
                    setSelectedPlan(plan.name);
                  }
                }}
              >
                {isCurrent
                  ? "Current Plan"
                  : isSelected
                    ? "Selected"
                    : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="info-banner">
        <Info size={21} />
        <div>
          <strong>
            You are changing the subscription plan for {merchant.merchant}.
          </strong>
          <p>
            After selecting a plan, you will be able to review the changes
            before proceeding to payment.
          </p>
        </div>
      </div>

      <div className="flow-bottom-actions">
        <button
          className="primary-flow-button"
          disabled={!selectedPlan || selectedPlan === merchant.plan}
          onClick={onNext}
        >
          Next
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

/* ========================================
   CONFIRM PLAN CHANGE
======================================== */

function ConfirmPlanChange({ merchant, selectedPlan, onBack, onNext }) {
  const current = planData[merchant.plan];
  const next = planData[selectedPlan];

  const difference = next.price - current.price;

  return (
    <section className="subscription-flow-page">
      <PageBack label="Back to Choose Plan" onClick={onBack} />

      <h1>Confirm Plan Change</h1>
      <p className="flow-subtitle">
        Please review the changes before proceeding to payment.
      </p>

      <div className="flow-card">
        <div className="change-summary">
          <div className="change-plan">
            <span>Current Plan</span>
            <h3>{current.name}</h3>

            <strong>{formatPrice(current.price)} / month</strong>

            <p>Up to {current.stores} Stores</p>
            <p>Up to {current.devices} Devices</p>
          </div>

          <div className="change-arrow">
            <ArrowRight size={24} />
          </div>

          <div className="change-plan">
            <span>New Plan</span>
            <h3>{next.name}</h3>

            <strong>{formatPrice(next.price)} / month</strong>

            <p>Up to {next.stores} Stores</p>
            <p>Up to {next.devices} Devices</p>
          </div>
        </div>

        <h3 className="change-title">What will change?</h3>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Current Plan</th>
                <th>New Plan</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Plan Price</td>
                <td>{formatPrice(current.price)} / month</td>
                <td>{formatPrice(next.price)} / month</td>
              </tr>

              <tr>
                <td>Stores Allowed</td>
                <td>{current.stores}</td>
                <td>{next.stores}</td>
              </tr>

              <tr>
                <td>Devices Allowed</td>
                <td>{current.devices}</td>
                <td>{next.devices}</td>
              </tr>

              <tr>
                <td>Reports</td>
                <td>Advanced Reports</td>
                <td>All Reports</td>
              </tr>

              <tr>
                <td>Support</td>
                <td>Priority Support</td>
                <td>Dedicated Support</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="warning-banner">
          <Info size={19} />
          <div>
            <strong>
              This change will increase your monthly billing by{" "}
              {formatPrice(difference)}.
            </strong>
            <p>
              The new plan supports {next.stores} stores and {next.devices}{" "}
              devices.
            </p>
          </div>
        </div>
      </div>

      <div className="flow-bottom-actions">
        <button className="secondary-flow-button" onClick={onBack}>
          Cancel
        </button>

        <button className="primary-flow-button" onClick={onNext}>
          Proceed to Payment
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

/* ========================================
   PAYMENT SCREEN
======================================== */

function PaymentScreen({
  merchant,
  selectedPlan,
  billingCycle,
  setBillingCycle,
  paymentMethod,
  setPaymentMethod,
  paymentDetails,
  updatePaymentField,
  paymentError,
  onBack,
  onSubmit,
}) {
  const current = planData[merchant.plan];
  const next = planData[selectedPlan];

  const amount =
    billingCycle === "Monthly"
      ? next.price - current.price
      : next.yearly - current.yearly;

  return (
    <section className="subscription-flow-page payment-page">
      <PageBack label="Back to Confirm Plan Change" onClick={onBack} />

      <h1>Payment</h1>
      <p className="flow-subtitle">
        Complete the payment to activate the new subscription plan.
      </p>

      <div className="payment-summary">
        <h3>Subscription Summary</h3>

        <DetailRow
          label="Merchant"
          value={`${merchant.merchant} (${merchant.id})`}
        />

        <DetailRow
          label="Current Plan"
          value={`${current.name} (${formatPrice(current.price)} / month)`}
        />

        <DetailRow
          label="New Plan"
          value={`${next.name} (${formatPrice(next.price)} / month)`}
        />

        <div className="detail-row">
          <span>Billing Cycle</span>

          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
          >
            <option>Monthly</option>
            <option>Yearly</option>
          </select>
        </div>

        <div className="payment-total">
          <span>Amount to Pay</span>
          <strong>{formatPrice(amount)}.00</strong>
        </div>

        <small className="payment-note">Prorated amount for plan upgrade</small>
      </div>

      <div className="payment-card">
        <h3>Select Payment Method</h3>

        <div className="payment-tabs">
          <button
            className={paymentMethod === "Card" ? "active" : ""}
            onClick={() => setPaymentMethod("Card")}
          >
            <CreditCard size={16} />
            Card
          </button>

          <button
            className={paymentMethod === "UPI" ? "active" : ""}
            onClick={() => setPaymentMethod("UPI")}
          >
            <Smartphone size={16} />
            UPI
          </button>

          <button
            className={paymentMethod === "Net Banking" ? "active" : ""}
            onClick={() => setPaymentMethod("Net Banking")}
          >
            <Landmark size={16} />
            Net Banking
          </button>
        </div>

        {paymentMethod === "Card" && (
          <div className="payment-form">
            <label>
              Card Number
              <input
                value={paymentDetails.cardNumber}
                onChange={(e) =>
                  updatePaymentField("cardNumber", e.target.value)
                }
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </label>

            <label>
              Cardholder Name
              <input
                value={paymentDetails.cardholderName}
                onChange={(e) =>
                  updatePaymentField("cardholderName", e.target.value)
                }
                placeholder="John Doe"
              />
            </label>

            <div className="form-grid">
              <label>
                Expiry Date
                <input
                  value={paymentDetails.expiry}
                  onChange={(e) => updatePaymentField("expiry", e.target.value)}
                  placeholder="MM/YY"
                />
              </label>

              <label>
                CVV
                <input
                  value={paymentDetails.cvv}
                  onChange={(e) => updatePaymentField("cvv", e.target.value)}
                  placeholder="123"
                  maxLength={4}
                />
              </label>
            </div>

            <label className="save-card">
              <input
                type="checkbox"
                checked={paymentDetails.saveCard}
                onChange={(e) =>
                  updatePaymentField("saveCard", e.target.checked)
                }
              />
              Save this card for future payments
            </label>
          </div>
        )}

        {paymentMethod === "UPI" && (
          <div className="payment-form">
            <label>
              UPI ID
              <input
                value={paymentDetails.upi}
                onChange={(e) => updatePaymentField("upi", e.target.value)}
                placeholder="example@upi"
              />
            </label>
          </div>
        )}

        {paymentMethod === "Net Banking" && (
          <div className="payment-form">
            <label>
              Select Bank
              <select
                value={paymentDetails.bank}
                onChange={(e) => updatePaymentField("bank", e.target.value)}
              >
                <option value="">Select your bank</option>
                <option>State Bank of India</option>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
              </select>
            </label>
          </div>
        )}

        {paymentError && <div className="payment-error">{paymentError}</div>}

        <div className="payment-actions">
          <button className="secondary-flow-button" onClick={onBack}>
            Cancel
          </button>

          <button
            className="primary-flow-button"
            onClick={() => onSubmit(amount)}
          >
            <Lock size={16} />
            Pay {formatPrice(amount)}.00
          </button>
        </div>
      </div>
    </section>
  );
}

/* ========================================
   PAYMENT SUCCESS
======================================== */

function PaymentSuccess({
  merchant,
  selectedPlan,
  amountPaid,
  billingCycle,
  onBack,
}) {
  const next = planData[selectedPlan];

  return (
    <section className="subscription-flow-page success-page">
      <div className="success-icon">
        <Check size={45} />
      </div>

      <h1>Subscription Plan Updated</h1>

      <p className="flow-subtitle">
        The subscription plan for {merchant.merchant} has been successfully
        updated.
      </p>

      <div className="flow-card success-details">
        <DetailRow
          label="Merchant"
          value={`${merchant.merchant} (${merchant.id})`}
        />

        <DetailRow label="New Plan" value={next.name} />

        <DetailRow
          label="Amount Paid"
          value={`${formatPrice(amountPaid)}.00`}
        />

        <DetailRow label="Billing Cycle" value={billingCycle} />

        <DetailRow label="Effective From" value={merchant.start} />

        <DetailRow
          label="Status"
          value={
            <span className="success-text">
              <i />
              Active
            </span>
          }
        />
      </div>

      <div className="success-banner">
        <CircleCheck size={18} />
        The merchant can now use the features of the {next.name}.
      </div>

      <button className="primary-flow-button" onClick={onBack}>
        Back to Subscription Details
      </button>
    </section>
  );
}

/* ========================================
   MAIN COMPONENT
======================================== */

export default function MerchantSubscriptions() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);

  const [screen, setScreen] = useState("list");
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState("Monthly");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentError, setPaymentError] = useState("");

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardholderName: "",
    expiry: "",
    cvv: "",
    saveCard: true,
    upi: "",
    bank: "",
  });

  const updatePaymentField = (field, value) => {
    setPaymentDetails((previous) => ({
      ...previous,
      [field]: value,
    }));
    setPaymentError("");
  };

  const openDetails = (merchant) => {
    setSelectedMerchant(merchant);
    setScreen("details");
  };

  const openChoosePlan = () => {
    setSelectedPlan("");
    setScreen("choose");
  };

  const openConfirm = () => {
    setScreen("confirm");
  };

  const openPayment = () => {
    setPaymentError("");
    setScreen("payment");
  };

  const submitPayment = (amount) => {
    if (paymentMethod === "Card") {
      if (
        !paymentDetails.cardNumber ||
        !paymentDetails.cardholderName ||
        !paymentDetails.expiry ||
        !paymentDetails.cvv
      ) {
        setPaymentError("Please fill all card details.");
        return;
      }
    }

    if (paymentMethod === "UPI" && !paymentDetails.upi) {
      setPaymentError("Please enter your UPI ID.");
      return;
    }

    if (paymentMethod === "Net Banking" && !paymentDetails.bank) {
      setPaymentError("Please select your bank.");
      return;
    }

    setAmountPaid(amount);

    setSubscriptions((previous) =>
      previous.map((item) =>
        item.id === selectedMerchant.id
          ? {
              ...item,
              plan: selectedPlan,
            }
          : item,
      ),
    );

    setSelectedMerchant((previous) => ({
      ...previous,
      plan: selectedPlan,
    }));

    setScreen("success");
  };

  if (screen === "details") {
    return (
      <SubscriptionDetails
        merchant={selectedMerchant}
        onBack={() => setScreen("list")}
        onChangePlan={openChoosePlan}
      />
    );
  }

  if (screen === "choose") {
    return (
      <ChoosePlan
        merchant={selectedMerchant}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        onBack={() => setScreen("details")}
        onNext={openConfirm}
      />
    );
  }

  if (screen === "confirm") {
    return (
      <ConfirmPlanChange
        merchant={selectedMerchant}
        selectedPlan={selectedPlan}
        onBack={() => setScreen("choose")}
        onNext={openPayment}
      />
    );
  }

  if (screen === "payment") {
    return (
      <PaymentScreen
        merchant={selectedMerchant}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentDetails={paymentDetails}
        updatePaymentField={updatePaymentField}
        paymentError={paymentError}
        onBack={() => setScreen("confirm")}
        onSubmit={submitPayment}
      />
    );
  }

  if (screen === "success") {
    return (
      <PaymentSuccess
        merchant={selectedMerchant}
        selectedPlan={selectedPlan}
        amountPaid={amountPaid}
        billingCycle={billingCycle}
        onBack={() => setScreen("details")}
      />
    );
  }

  return (
    <SubscriptionList subscriptions={subscriptions} onView={openDetails} />
  );
}
>>>>>>> 4cefd039ab78ef6438d7c897b58c01866655dd51
