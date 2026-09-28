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

import { listPlans } from "../api/plans";
import {
  changeSubscriptionPlan,
  listSubscriptions,
  mapSubscriptionToRow,
} from "../api/subscriptions";
import "../styles/Merchant-subscriptions.css";

const planKey = (plan) => String(plan?.id || plan?.planCode || plan?.code || plan?.name || "");
const planName = (plan) => plan?.name || plan?.planName || plan?.planCode || "Plan";
const planFeatures = (plan) => {
  const features = plan?.includedFeatures || plan?.included_features || plan?.features || [];
  return features.map((feature) =>
    typeof feature === "string" ? feature : feature?.name || feature?.featureKey || feature?.code
  ).filter(Boolean);
};
const normalizeStoreTypeValue = (value) =>
  String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const storeTypeValues = (value) => {
  if (!value) return [];
  if (typeof value !== "object") return [value];
  return [
    value.id,
    value._id,
    value.storeTypeId,
    value.store_type_id,
    value.storeTypeCode,
    value.store_type_code,
    value.code,
    value.name,
    value.storeTypeName,
  ].filter(Boolean);
};
const planStoreTypeValues = (plan) => {
  const storeType =
    plan?.storeType || plan?.store_type || plan?.applicableStoreType || {};
  return [
    ...storeTypeValues(storeType),
    plan?.storeTypeId,
    plan?.store_type_id,
    plan?.applicableStoreTypeId,
    plan?.applicable_store_type_id,
  ].filter(Boolean).map(normalizeStoreTypeValue);
};
const planMatchesStoreType = (plan, merchant) => {
  const selectedValues = [
    merchant?.storeTypeId,
    merchant?.storeTypeCode,
    merchant?.storeTypeName,
  ].map(normalizeStoreTypeValue).filter(Boolean);
  const planValues = planStoreTypeValues(plan);
  return planValues.some((value) => selectedValues.includes(value));
};
const planPrice = (plan, cycle = "MONTHLY") => {
  const basePrice = Number(plan?.basePrice ?? plan?.base_price ?? plan?.price ?? 0);
  const normalizedCycle = String(plan?.billingCycle || plan?.billing_cycle || "").toUpperCase();
  if (cycle === "ANNUAL") {
    return Number(plan?.annualPrice ?? plan?.yearlyPrice ?? plan?.yearly ??
      (normalizedCycle === "YEARLY" || normalizedCycle === "ANNUAL" ? basePrice : basePrice * 12));
  }
  return Number(plan?.monthlyPrice ??
    (normalizedCycle === "YEARLY" || normalizedCycle === "ANNUAL" ? basePrice / 12 : basePrice));
};
const formatPrice = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency || "INR").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency || "INR"} ${Number(amount || 0).toLocaleString("en-IN")}`;
  }
};
const findCurrentPlan = (merchant, plans) =>
  plans.find((plan) =>
    (merchant?.planId && String(plan.id) === String(merchant.planId)) ||
    planName(plan).toLowerCase() === String(merchant?.plan || "").toLowerCase()
  ) || {
    id: merchant?.planId,
    name: merchant?.plan || "Current plan",
    basePrice: merchant?.price || 0,
    currency: merchant?.currency || "INR",
    includedStores: merchant?.stores || 0,
    includedTerminals: merchant?.devices || 0,
    includedFeatures: merchant?.entitlements || [],
  };
const addCycleToDate = (date, cycle) => {
  const nextDate = new Date(`${date}T00:00:00Z`);
  if (cycle === "ANNUAL") nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
  else nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  return nextDate.toISOString().slice(0, 10);
};

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

  const entitlements =
    Array.isArray(merchant.entitlements) && merchant.entitlements.length > 0
      ? merchant.entitlements
      : planFeatures(merchant.planDetails || {});

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
  plans,
  plansLoading,
  plansError,
  selectedPlan,
  setSelectedPlan,
  onBack,
  onNext,
}) {
  const currentPlan = findCurrentPlan(merchant, plans);
  const currentKey = merchant?.planId || planKey(currentPlan);

  return (
    <section className="subscription-flow-page">
      <PageBack label="Back to Subscription Details" onClick={onBack} />

      <h1>Choose Subscription Plan</h1>
      <p className="flow-subtitle">
        Plans for {merchant?.storeTypeName || "this store type"} ({merchant?.merchant}).
      </p>

      {plansError && <div className="payment-error">{plansError}</div>}

      <div className="plans-grid">
        {plansLoading ? (
          <p>Loading plans…</p>
        ) : plans.map((plan) => {
          const key = planKey(plan);
          const isSelected = selectedPlan === key;
          const isCurrent =
            (merchant?.planId && String(plan.id) === String(merchant.planId)) ||
            planName(plan).toLowerCase() === String(merchant?.plan || "").toLowerCase();
          const price = planPrice(plan);
          const annualPrice = planPrice(plan, "ANNUAL");
          const features = planFeatures(plan);

          return (
            <div
              className={`plan-card ${isSelected ? "selected" : ""}`}
              key={key}
              onClick={() => {
                if (!isCurrent) {
                  setSelectedPlan(key);
                }
              }}
            >
              {isCurrent && <span className="current-plan-badge">Current Plan</span>}

              <div className="plan-card-header">
                <div>
                  <h3>{planName(plan)}</h3>
                  <p>{plan.description || "Subscription plan"}</p>
                </div>

                <span className="plan-radio">
                  {isSelected ? <Check size={14} /> : ""}
                </span>
              </div>

              <div className="plan-price">
                {formatPrice(price, plan.currency)}
                <span> / month</span>
              </div>

              <div className="plan-yearly">
                {formatPrice(annualPrice, plan.currency)} / annual
              </div>

              <div className="plan-divider" />

              <p>
                Up to <b>{plan.includedStores ?? plan.included_stores ?? 0} Stores</b>
              </p>

              <p>
                Up to <b>{plan.includedTerminals ?? plan.included_terminals ?? 0} Devices</b>
              </p>

              <ul className="feature-list">
                {features.map((feature) => (
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
                    setSelectedPlan(key);
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
          disabled={!selectedPlan || selectedPlan === currentKey || plansLoading || !plans.length}
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

function ConfirmPlanChange({ merchant, plans, selectedPlan, onBack, onNext }) {
  const current = findCurrentPlan(merchant, plans);
  const next = plans.find((plan) => planKey(plan) === selectedPlan) || current;
  const difference = planPrice(next) - planPrice(current);
  const currentFeatures = planFeatures(current);
  const nextFeatures = planFeatures(next);
  const comparedFeatures = [...new Set([...currentFeatures, ...nextFeatures])];
  const currency = next.currency || current.currency || "INR";

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
            <h3>{planName(current)}</h3>
            <strong>{formatPrice(planPrice(current), currency)} / month</strong>
            <p>Up to {current.includedStores ?? current.included_stores ?? merchant?.stores ?? 0} Stores</p>
            <p>Up to {current.includedTerminals ?? current.included_terminals ?? merchant?.devices ?? 0} Devices</p>
          </div>

          <div className="change-arrow">
            <ArrowRight size={24} />
          </div>

          <div className="change-plan">
            <span>New Plan</span>
            <h3>{planName(next)}</h3>
            <strong>{formatPrice(planPrice(next), currency)} / month</strong>
            <p>Up to {next.includedStores ?? next.included_stores ?? 0} Stores</p>
            <p>Up to {next.includedTerminals ?? next.included_terminals ?? 0} Devices</p>
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
                <td>{formatPrice(planPrice(current), currency)} / month</td>
                <td>{formatPrice(planPrice(next), currency)} / month</td>
              </tr>
              <tr>
                <td>Stores Allowed</td>
                <td>{current.includedStores ?? current.included_stores ?? merchant?.stores ?? 0}</td>
                <td>{next.includedStores ?? next.included_stores ?? 0}</td>
              </tr>
              <tr>
                <td>Devices Allowed</td>
                <td>{current.includedTerminals ?? current.included_terminals ?? merchant?.devices ?? 0}</td>
                <td>{next.includedTerminals ?? next.included_terminals ?? 0}</td>
              </tr>
              {comparedFeatures.map((feature) => (
                <tr key={feature}>
                  <td>{feature}</td>
                  <td>{currentFeatures.includes(feature) ? "Included" : "Not included"}</td>
                  <td>{nextFeatures.includes(feature) ? "Included" : "Not included"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="warning-banner">
          <Info size={19} />
          <div>
            <strong>
              This change will {difference >= 0 ? "increase" : "decrease"} monthly billing by {formatPrice(Math.abs(difference), currency)}.
            </strong>
            <p>
              The new plan supports {next.includedStores ?? next.included_stores ?? 0} stores and {next.includedTerminals ?? next.included_terminals ?? 0} devices.
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
  plans,
  selectedPlan,
  billingCycle,
  setBillingCycle,
  paymentMethod,
  setPaymentMethod,
  paymentDetails,
  updatePaymentField,
  paymentError,
  paymentSubmitting,
  onBack,
  onSubmit,
}) {
  const current = findCurrentPlan(merchant, plans);
  const next = plans.find((plan) => planKey(plan) === selectedPlan) || current;
  const amount = planPrice(next, billingCycle);
  const taxRate = Number(next.taxRate ?? next.tax_rate ?? 0);
  const tax = Number((amount * taxRate / 100).toFixed(2));
  const totalDueToday = Number((amount + tax).toFixed(2));
  const currency = next.currency || "INR";

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
          value={`${planName(current)} (${formatPrice(planPrice(current, billingCycle), currency)} / ${billingCycle === "ANNUAL" ? "annual" : "month"})`}
        />
        <DetailRow
          label="New Plan"
          value={`${planName(next)} (${formatPrice(amount, currency)} / ${billingCycle === "ANNUAL" ? "annual" : "month"})`}
        />

        <div className="detail-row">
          <span>Billing Cycle</span>
          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="ANNUAL">Annual</option>
          </select>
        </div>

        <DetailRow label="Tax" value={formatPrice(tax, currency)} />

        <div className="payment-total">
          <span>Amount to Pay</span>
          <strong>{formatPrice(totalDueToday, currency)}</strong>
        </div>

        <small className="payment-note">Plan price plus applicable tax</small>
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
            disabled={paymentSubmitting}
            onClick={() => onSubmit({ agreementPrice: amount, tax, totalDueToday })}
          >
            <Lock size={16} />
            {paymentSubmitting ? "Processing…" : `Pay ${formatPrice(totalDueToday, currency)}`}
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
  plans,
  selectedPlan,
  amountPaid,
  billingCycle,
  onBack,
}) {
  const next = plans.find((plan) => planKey(plan) === selectedPlan) || {};

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
        <DetailRow label="New Plan" value={planName(next)} />
        <DetailRow label="Amount Paid" value={formatPrice(amountPaid, next.currency)} />
        <DetailRow label="Billing Cycle" value={billingCycle === "ANNUAL" ? "Annual" : "Monthly"} />
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
        The merchant can now use the features of the {planName(next)}.
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
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [screen, setScreen] = useState("list");
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

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

  useEffect(() => {
    if (screen !== "choose") return undefined;
    let active = true;
    setPlansLoading(true);
    setPlansError("");
    const storeTypeId = String(selectedMerchant?.storeTypeId || "").trim();

    if (!storeTypeId) {
      setPlans([]);
      setSelectedPlan("");
      setPlansError("This subscription has no store type ID, so plans cannot be filtered.");
      setPlansLoading(false);
      return () => {
        active = false;
      };
    }

    listPlans()
      .then((allPlans) => {
        if (!active) return;
        const matchingPlans = allPlans.filter(
          (plan) => planMatchesStoreType(plan, selectedMerchant)
        );
        setPlans(matchingPlans);
        const current = findCurrentPlan(selectedMerchant, matchingPlans);
        setSelectedPlan(planKey(current) || selectedMerchant?.planId || "");
        if (matchingPlans.length === 0) {
          setPlansError("No subscription plans are configured for this store type.");
        }
      })
      .catch((err) => {
        if (!active) return;
        setPlans([]);
        setPlansError(err.message || "Failed to load subscription plans.");
      })
      .finally(() => {
        if (active) setPlansLoading(false);
      });
    return () => {
      active = false;
    };
  }, [screen, selectedMerchant]);

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
    setPlans([]);
    setSelectedPlan(selectedMerchant?.planId || "");
    setScreen("choose");
  };

  const openConfirm = () => {
    setScreen("confirm");
  };

  const openPayment = () => {
    setPaymentError("");
    setScreen("payment");
  };

  const submitPayment = async ({ agreementPrice, tax, totalDueToday }) => {
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

    const plan = plans.find((item) => planKey(item) === selectedPlan);
    const merchantId = selectedMerchant?.merchantApiId;
    if (!merchantId || !plan?.id) {
      setPaymentError("The merchant or selected plan ID is missing. Refresh the subscription list and try again.");
      return;
    }

    const startDate = new Date().toISOString().slice(0, 10);
    const apiBillingCycle = billingCycle === "ANNUAL" ? "YEARLY" : "MONTHLY";
    const payload = {
      merchantId,
      planId: plan.id,
      billingCycle: apiBillingCycle,
      startDate,
      renewalDate: addCycleToDate(startDate, billingCycle),
      agreementPrice: Number(agreementPrice),
      tax: Number(tax),
      totalDueToday: Number(totalDueToday),
      paymentMethod:
        paymentMethod === "Card"
          ? "CARD"
          : paymentMethod === "Net Banking"
            ? "NET_BANKING"
            : "UPI",
    };

    setPaymentSubmitting(true);
    setPaymentError("");
    try {
      await changeSubscriptionPlan(payload);
      const updatedPlan = {
        plan: planName(plan),
        planId: plan.id,
        planDetails: plan,
        price: Number(agreementPrice),
        currency: plan.currency || "INR",
        billingCycle: apiBillingCycle,
        stores: Number(plan.includedStores ?? plan.included_stores ?? selectedMerchant.stores),
        devices: Number(plan.includedTerminals ?? plan.included_terminals ?? selectedMerchant.devices),
        entitlements: planFeatures(plan),
      };
      setAmountPaid(totalDueToday);
      setSubscriptions((previous) =>
        previous.map((item) =>
          item.id === selectedMerchant?.id ? { ...item, ...updatedPlan } : item
        )
      );
      setSelectedMerchant((previous) => ({ ...previous, ...updatedPlan }));
      setScreen("success");
    } catch (err) {
      setPaymentError(err.message || "Unable to change the subscription plan.");
    } finally {
      setPaymentSubmitting(false);
    }
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
        plans={plans}
        plansLoading={plansLoading}
        plansError={plansError}
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
        plans={plans}
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
        plans={plans}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentDetails={paymentDetails}
        updatePaymentField={updatePaymentField}
        paymentError={paymentError}
        paymentSubmitting={paymentSubmitting}
        onBack={() => setScreen("confirm")}
        onSubmit={submitPayment}
      />
    );
  }

  if (screen === "success") {
    return (
      <PaymentSuccess
        merchant={selectedMerchant}
        plans={plans}
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