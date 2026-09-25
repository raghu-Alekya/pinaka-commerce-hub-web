import { useMemo, useState, useEffect } from "react";
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
  RefreshCw,
} from "lucide-react";

import { listSubscriptions, mapSubscriptionToRow } from "../api/subscriptions";
import "../styles/Merchant-subscriptions.css";

/* ========================================
   SUBSCRIPTION PLANS CATALOG
======================================== */

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

const planData = Object.fromEntries(
  plans.map((plan) => [plan.name, plan])
);

const formatPrice = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

/* ========================================
   COMMON COMPONENTS
======================================== */

function StatusBadge({ status }) {
  const normalized = String(status || "Inactive")
    .toLowerCase()
    .replaceAll(" ", "-");
  return (
    <span className={`status-badge ${normalized}`}>
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

function SubscriptionList({ subscriptions, loading, error, onReload, onView }) {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [stores, setStores] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;

  // Overview stats dynamically calculated from API data
  const stats = useMemo(() => {
    const total = subscriptions.length;
    const active = subscriptions.filter(
      (s) => String(s.status).toLowerCase() === "active"
    ).length;
    const inactive = subscriptions.filter(
      (s) =>
        String(s.status).toLowerCase() === "inactive" ||
        String(s.status).toLowerCase() === "cancelled"
    ).length;
    const expiring = subscriptions.filter(
      (s) =>
        String(s.status).toLowerCase() === "expiring soon" ||
        String(s.status).toLowerCase() === "expired"
    ).length;

    const activePercentage = total > 0 ? ((active / total) * 100).toFixed(1) : "0.0";
    const inactivePercentage = total > 0 ? ((inactive / total) * 100).toFixed(1) : "0.0";

    return { total, active, inactive, expiring, activePercentage, inactivePercentage };
  }, [subscriptions]);

  // Dynamic Subscription Plan Distribution
  const planDistribution = useMemo(() => {
    const counts = {};
    subscriptions.forEach((s) => {
      const pName = s.plan || "Unassigned";
      counts[pName] = (counts[pName] || 0) + 1;
    });
    const total = subscriptions.length || 1;
    const colors = ["purple", "blue", "orange", "green", "red"];
    return Object.entries(counts).map(([name, count], index) => ({
      name,
      count,
      percentage: ((count / total) * 100).toFixed(1),
      color: colors[index % colors.length],
    }));
  }, [subscriptions]);

  // Dynamic filter dropdown options
  const availablePlans = useMemo(() => {
    return [...new Set(subscriptions.map((s) => s.plan).filter(Boolean))];
  }, [subscriptions]);

  const availableStatuses = useMemo(() => {
    return [...new Set(subscriptions.map((s) => s.status).filter(Boolean))];
  }, [subscriptions]);

  const availableStoreCounts = useMemo(() => {
    return [...new Set(subscriptions.map((s) => s.stores).filter(Boolean))].sort(
      (a, b) => a - b
    );
  }, [subscriptions]);

  const filtered = useMemo(() => {
    return subscriptions.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        !search ||
        item.merchant.toLowerCase().includes(searchValue) ||
        item.id.toLowerCase().includes(searchValue) ||
        (item.merchantId && item.merchantId.toLowerCase().includes(searchValue));

      const matchesPlan = !plan || item.plan.toLowerCase() === plan.toLowerCase();
      const matchesStatus = !status || item.status.toLowerCase() === status.toLowerCase();
      const matchesStores = !stores || String(item.stores) === stores;

      const matchesStartDateFrom = !startDate || (item.rawStart && item.rawStart.slice(0, 10) >= startDate);
      const matchesStartDateTo = !endDate || (item.rawStart && item.rawStart.slice(0, 10) <= endDate);

      return (
        matchesSearch &&
        matchesPlan &&
        matchesStatus &&
        matchesStores &&
        matchesStartDateFrom &&
        matchesStartDateTo
      );
    });
  }, [subscriptions, search, plan, status, stores, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedData = useMemo(() => {
    const startIdx = (page - 1) * PAGE_SIZE;
    return filtered.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filtered, page]);

  const handleExport = () => {
    if (!filtered.length) return;
    const headers = [
      "Subscription ID",
      "Merchant",
      "Merchant ID",
      "Plan",
      "Stores",
      "Devices",
      "Start Date",
      "End Date",
      "Status",
      "Price",
      "Billing Cycle",
    ];
    const rows = filtered.map((item) => [
      `"${item.id}"`,
      `"${item.merchant.replace(/"/g, '""')}"`,
      `"${item.merchantId}"`,
      `"${item.plan}"`,
      item.stores,
      item.devices,
      `"${item.start}"`,
      `"${item.end}"`,
      `"${item.status}"`,
      `"${item.currency} ${item.price}"`,
      `"${item.billingCycle}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `subscriptions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="merchant-subscriptions-page">
      <div className="subscriptions-heading-row">
        <div>
          <h1>Merchant Subscriptions</h1>
          <p>View and manage subscription details for all merchants.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="export-button" onClick={onReload} title="Refresh Subscriptions">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="export-button" onClick={handleExport} disabled={!filtered.length}>
            <Download size={17} />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", marginBottom: "16px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button type="button" onClick={onReload} style={{ background: "none", border: "none", color: "#991b1b", textDecoration: "underline", cursor: "pointer", fontWeight: "600" }}>
            Retry
          </button>
        </div>
      )}

      {/* OVERVIEW CARDS */}
      <div className="subscription-overview">
        <div className="overview-cards">
          <div className="overview-card">
            <span className="overview-icon purple">
              <Store size={24} />
            </span>
            <div>
              <p>Total Subscriptions</p>
              <strong>{stats.total}</strong>
              <small className="positive">Live Records</small>
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
              <strong>{stats.active}</strong>
              <small className="positive">{stats.activePercentage}% of total</small>
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
              <strong>{stats.inactive}</strong>
              <small className="negative">{stats.inactivePercentage}% of total</small>
            </div>
          </div>

          <div className="overview-card">
            <span className="overview-icon orange">
              <Clock3 size={25} />
            </span>
            <div>
              <p>Expiring Soon</p>
              <strong>{stats.expiring}</strong>
              <small className="warning">Review required</small>
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
                <strong>{stats.total}</strong>
                <span>Records</span>
              </div>
            </div>

            <div className="plan-legend">
              {planDistribution.map((item) => (
                <div key={item.name} className="legend-row">
                  <span className="legend-name">
                    <i className={`legend-dot ${item.color}`} />
                    {item.name}
                  </span>
                  <b>{item.count}</b>
                  <span>{item.percentage}%</span>
                </div>
              ))}
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
            placeholder="Search merchant name, code or ID..."
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
          {availablePlans.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </SelectField>

        <SelectField
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {availableStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>

        <SelectField
          value={stores}
          onChange={(e) => {
            setStores(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Store Counts</option>
          {availableStoreCounts.map((n) => (
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
              {loading && (
                <tr>
                  <td colSpan="9" className="empty-row" style={{ padding: "32px", textAlign: "center" }}>
                    Loading live subscription data…
                  </td>
                </tr>
              )}

              {!loading && paginatedData.map((item, index) => (
                <tr key={item.id + index}>
                  <td>{(page - 1) * PAGE_SIZE + index + 1}</td>

                  <td>
                    <div className="merchant-cell">
                      <span className="merchant-icon">
                        <Store size={19} />
                      </span>
                      <div>
                        <strong>{item.merchant}</strong>
                        <small>{item.merchantId || item.id}</small>
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

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-row">
                    No subscriptions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
          </span>

          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              <ChevronLeft size={17} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={page === n ? "active" : ""}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================
   DETAILS SCREEN
======================================== */

function SubscriptionDetails({ merchant, onBack, onChangePlan }) {
  if (!merchant) return null;

  const currentPlan = planData[merchant.plan] || {};
  const entitlements =
    Array.isArray(merchant.entitlements) && merchant.entitlements.length > 0
      ? merchant.entitlements
      : currentPlan.features || [
          "Store Management",
          "Device Management",
          "Basic Reports",
          "Email Support",
        ];

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
          <span>{merchant.merchantId || merchant.id}</span>
        </div>

        <StatusBadge status={merchant.status} />
      </div>

      <div className="flow-card">
        <h3>Subscription Information</h3>

        <div className="details-grid">
          <DetailRow label="Merchant Name" value={merchant.merchant} />
          <DetailRow label="Subscription Reference" value={merchant.id} />
          <DetailRow label="Current Plan" value={merchant.plan} />
          <DetailRow label="Status" value={<StatusBadge status={merchant.status} />} />
          <DetailRow label="Start Date" value={merchant.start} />
          <DetailRow label="End Date" value={merchant.end} />
          <DetailRow
            label="Stores"
            value={`${merchant.stores} allowed`}
          />
          <DetailRow
            label="Devices"
            value={`${merchant.devices} allowed`}
          />
          <DetailRow
            label="Pricing"
            value={`${merchant.currency || "USD"} ${merchant.price} / ${merchant.billingCycle || "MONTHLY"}`}
          />
        </div>
      </div>

      <div className="flow-card">
        <h3>Plan Features & Entitlements</h3>

        <ul className="feature-list">
          {entitlements.map((feature, idx) => (
            <li key={feature + idx}>
              <Check size={16} />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button className="primary-flow-button" onClick={onChangePlan}>
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
      <p className="flow-subtitle">Select a new plan for {merchant?.merchant}.</p>

      <div className="plans-grid">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.name;
          const isCurrent = merchant?.plan === plan.name;

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
              {isCurrent && <span className="current-plan-badge">Current Plan</span>}

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
                {isCurrent ? "Current Plan" : isSelected ? "Selected" : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="info-banner">
        <Info size={21} />
        <div>
          <strong>You are changing the subscription plan for {merchant?.merchant}.</strong>
          <p>
            After selecting a plan, you will be able to review the changes before proceeding to payment.
          </p>
        </div>
      </div>

      <div className="flow-bottom-actions">
        <button
          className="primary-flow-button"
          disabled={!selectedPlan || selectedPlan === merchant?.plan}
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
  const current = planData[merchant?.plan] || plans[0];
  const next = planData[selectedPlan] || plans[1];
  const difference = (next.price || 0) - (current.price || 0);

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
                <td>Basic Reports</td>
                <td>Advanced Reports</td>
              </tr>
              <tr>
                <td>Support</td>
                <td>Email Support</td>
                <td>Priority Support</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="warning-banner">
          <Info size={19} />
          <div>
            <strong>
              This change will increase your monthly billing by {formatPrice(difference)}.
            </strong>
            <p>
              The new plan supports {next.stores} stores and {next.devices} devices.
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
  const current = planData[merchant?.plan] || plans[0];
  const next = planData[selectedPlan] || plans[1];

  const amount =
    billingCycle === "Monthly"
      ? (next.price || 0) - (current.price || 0)
      : (next.yearly || 0) - (current.yearly || 0);

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
          value={`${merchant?.merchant} (${merchant?.merchantId || merchant?.id})`}
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
                  onChange={(e) =>
                    updatePaymentField("expiry", e.target.value)
                  }
                  placeholder="MM/YY"
                />
              </label>

              <label>
                CVV
                <input
                  value={paymentDetails.cvv}
                  onChange={(e) =>
                    updatePaymentField("cvv", e.target.value)
                  }
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
  const next = planData[selectedPlan] || plans[0];

  return (
    <section className="subscription-flow-page success-page">
      <div className="success-icon">
        <Check size={45} />
      </div>

      <h1>Subscription Plan Updated</h1>
      <p className="flow-subtitle">
        The subscription plan for {merchant?.merchant} has been successfully updated.
      </p>

      <div className="flow-card success-details">
        <DetailRow
          label="Merchant"
          value={`${merchant?.merchant} (${merchant?.merchantId || merchant?.id})`}
        />
        <DetailRow label="New Plan" value={next.name} />
        <DetailRow label="Amount Paid" value={`${formatPrice(amountPaid)}.00`} />
        <DetailRow label="Billing Cycle" value={billingCycle} />
        <DetailRow label="Effective From" value={merchant?.start} />
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
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

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

  const loadData = () => setReloadToken((n) => n + 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    listSubscriptions()
      .then((response) => {
        if (!active) return;
        const rawList = Array.isArray(response)
          ? response
          : Array.isArray(response?.subscriptions)
          ? response.subscriptions
          : Array.isArray(response?.data?.subscriptions)
          ? response.data.subscriptions
          : Array.isArray(response?.data)
          ? response.data
          : [];

        const mapped = rawList
          .map((item, idx) => mapSubscriptionToRow(item, idx))
          .filter(Boolean);

        setSubscriptions(mapped);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Error fetching subscriptions:", err);
        setError(err.message || "Failed to load subscriptions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

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
        item.id === selectedMerchant?.id
          ? {
              ...item,
              plan: selectedPlan,
            }
          : item
      )
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
    <SubscriptionList
      subscriptions={subscriptions}
      loading={loading}
      error={error}
      onReload={loadData}
      onView={openDetails}
    />
  );
}