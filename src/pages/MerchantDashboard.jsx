import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMerchant, listMerchants } from "../api/merchants";
import { listMerchantDashboardStores, getMerchantDashboardOverview } from "../api/merchantDashboard";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../auth/AuthContext";
import "../styles/merchant-dashboard.css";

const rangeOptions = [
  { value: "today", label: "Today", days: 0 },
  { value: "7days", label: "7 days", days: 6 },
  { value: "30days", label: "30 days", days: 29 },
];

const DEMO_ORDERS = [
  { id: "demo-1048", wooOrderId: "1048", author: "Walk-in customer", total: "₹1,245.00", status: "Completed", createdAt: "2026-11-23T12:42:00" },
  { id: "demo-1047", wooOrderId: "1047", author: "Anita Sharma", total: "₹860.50", status: "Completed", createdAt: "2026-11-23T12:28:00" },
  { id: "demo-1046", wooOrderId: "1046", author: "Walk-in customer", total: "₹2,110.00", status: "Pending Payment", createdAt: "2026-11-23T12:11:00" },
  { id: "demo-1045", wooOrderId: "1045", author: "Rahul Mehta", total: "₹432.00", status: "Completed", createdAt: "2026-11-23T11:56:00" },
  { id: "demo-1044", wooOrderId: "1044", author: "Walk-in customer", total: "₹1,675.00", status: "Completed", createdAt: "2026-11-23T11:33:00" },
  { id: "demo-1043", wooOrderId: "1043", author: "Priya Nair", total: "₹318.00", status: "Refunded", createdAt: "2026-11-23T11:05:00" },
];

const DEMO_TOP_PRODUCTS = [
  { name: "Ariel Original Detergent", units: 42, sales: 837.58 },
  { name: "Camel Crush Menthol", units: 36, sales: 248.04 },
  { name: "Beverage Malt Mix", units: 29, sales: 173.71 },
  { name: "Big Seed", units: 21, sales: 92.19 },
  { name: "Fresh Orange Juice", units: 18, sales: 76.50 },
];

const DEMO_TOP_CATEGORIES = [
  { name: "Household", units: 108, share: 36 },
  { name: "Beverages", units: 76, share: 25 },
  { name: "Snacks", units: 69, share: 23 },
  { name: "Personal Care", units: 48, share: 16 },
  { name: "Tobacco", units: 32, share: 11 },
];

const DEMO_STORES = [
  { value: "sample-store-1", label: "Main Store" },
  { value: "sample-store-2", label: "City Center" },
  { value: "sample-store-3", label: "North Market" },
];

function merchantIdFromUser(user) {
  const merchant = user?.merchant || user?.merchantDetails || user?.merchant_details || {};
  return String(user?.merchantId || user?.merchant_id || user?.merchantUuid || user?.merchant_uuid
    || merchant?.merchantId || merchant?.merchant_id || merchant?.id || merchant?._id || "");
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("complete") || value === "paid") return "completed";
  if (value.includes("cancel") || value.includes("refund")) return "attention";
  if (value.includes("pending") || value.includes("created")) return "pending";
  return "processing";
}

function money(value, currency) {
  return value == null ? "—" : formatCurrency(value, currency || "INR");
}

function normalizeDashboardOrder(order = {}, storeName = "") {
  const totalValue = Number(order.total ?? order.total_amount ?? order.totalAmount ?? 0);
  const currency = order.currency || "INR";
  return {
    ...order,
    id: order.id || order.order_id || order.orderId,
    wooOrderId: order.order_number || order.orderNumber || order.woo_order_id || order.id,
    author: order.customer_name || order.customerName || order.customer || "Walk-in customer",
    totalValue,
    total: money(totalValue, currency),
    currency,
    status: order.status || order.order_status || order.orderStatus || "—",
    createdAt: order.created_at || order.createdAt || order.date_created,
    lineItems: order.line_items || order.lineItems || order.items || [],
    dashboardStoreName: order.store_name || order.storeName || storeName,
  };
}

function normalizeDashboardShift(shift = {}) {
  return {
    ...shift,
    id: shift.shift_id || shift.shiftId || shift.id,
    storeId: shift.store_id || shift.storeId,
    dashboardStoreName: shift.store_name || shift.storeName,
    status: shift.status || "open",
    openedBy: shift.opened_by || shift.openedBy,
    openTime: shift.started_at || shift.startedAt || shift.opened_at,
    openingBalance: shift.opening_cash ?? shift.openingCash ?? shift.opening_balance,
    sales: shift.sales,
    orders: shift.orders,
  };
}

function localDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function shiftPath(merchantId, storeId) {
  return merchantId && storeId
    ? `/merchants/${encodeURIComponent(merchantId)}/stores/${encodeURIComponent(storeId)}/configuration/shifts`
    : "/stores";
}

export default function MerchantDashboard() {
  const { user } = useAuth();
  const userMerchantId = merchantIdFromUser(user);
  const [merchantId, setMerchantId] = useState(userMerchantId);
  const [stores, setStores] = useState([]);
  const [merchantDetails, setMerchantDetails] = useState({ merchant: user?.merchant || user || null, subscription: null, raw: null });
  const [storeId, setStoreId] = useState("all");
  const [range, setRange] = useState("today");
  const [orders, setOrders] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftStoreId, setShiftStoreId] = useState("");
  const [storeRoles, setStoreRoles] = useState([]);
  const [merchantRoles, setMerchantRoles] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (userMerchantId) {
      setMerchantId(userMerchantId);
      return () => { active = false; };
    }
    listMerchants().then((rows) => {
      if (!active) return;
      const userEmail = String(user?.email || user?.merchantEmail || user?.merchant_email || "").trim().toLowerCase();
      const matchedMerchant = rows.find((merchant) => String(merchant.email || merchant.merchantEmail || "").trim().toLowerCase() === userEmail);
      const fallbackMerchant = rows.length === 1 ? rows[0] : null;
      const resolvedId = (matchedMerchant || fallbackMerchant)?.merchantId || (matchedMerchant || fallbackMerchant)?.id || "";
      if (resolvedId) setMerchantId(String(resolvedId));
      else setLoadingSetup(false);
    }).catch(() => {
      if (active) setLoadingSetup(false);
    });
    return () => { active = false; };
  }, [userMerchantId, user?.email]);

  useEffect(() => {
    let active = true;
    if (!merchantId) {
      setLoadingSetup(false);
      return () => { active = false; };
    }
    setLoadingSetup(true);
    getMerchant(merchantId).then((result) => {
      if (active) setMerchantDetails(result);
    }).catch(() => {
      // Keep merchant details from the authenticated user payload as a fallback.
    }).finally(() => {
      if (active) setLoadingSetup(false);
    });
    return () => { active = false; };
  }, [merchantId]);

  useEffect(() => {
    let active = true;
    setStores([]);
    setStoreId("");
    if (!merchantId) return () => { active = false; };
    listMerchantDashboardStores().then((rows) => {
      if (!active) return;
      setStores(rows);
      if (rows.length) { setStoreId("all"); setShiftStoreId(rows[0].value); }
    }).catch((loadError) => {
      if (active) setError(loadError?.message || "Unable to load stores.");
    });
    return () => { active = false; };
  }, [merchantId]);

  useEffect(() => {
    let active = true;
    if (!merchantId || !storeId || storeId === "") {
      setOrders([]);
      setOrderTotal(0);
      setShifts([]);
      setEmployeeCount(null);
      setOverview(null);
      setLoadingData(false);
      return () => { active = false; };
    }
    setLoadingData(true);
    setError("");
    setOverview(null);
    setOrders([]);
    setOrderTotal(0);
    setEmployeeCount(null);
    setShifts([]);
    getMerchantDashboardOverview({ storeId, period: range }).then((data) => {
      if (!active) return;
      setOverview(data);
      const metric = data.metrics || {};
      const storeName = stores.find((store) => store.value === storeId)?.label || "";
      const loadedOrders = (data.recent_orders || data.orders || []).map((order) => normalizeDashboardOrder(order, storeName));
      setOrders(loadedOrders);
      setOrderTotal(Number(metric.orders ?? data.orders_count ?? loadedOrders.length));
      setEmployeeCount(Number(metric.employees ?? 0));
      if (storeId !== "all") setShifts(data.current_shift ? [normalizeDashboardShift(data.current_shift)] : []);
      const roleRows = Array.isArray(data.roles) ? data.roles : [];
      const names = roleRows.map((role) => typeof role === "string" ? role : role.name || role.role_name).filter(Boolean);
      setStoreRoles(storeId === "all" ? [] : names);
      setMerchantRoles(storeId === "all" ? names : []);
    }).catch((loadError) => {
      if (active) {
        setOverview(null);
        setOrders([]);
        setOrderTotal(0);
        setEmployeeCount(null);
        setShifts([]);
        setError(loadError?.message || "Unable to load merchant dashboard data.");
      }
    }).finally(() => {
      if (active) setLoadingData(false);
    });
    return () => { active = false; };
  }, [merchantId, storeId, range, stores]);

  useEffect(() => {
    if (storeId !== "all" || !shiftStoreId) return undefined;
    let active = true;
    getMerchantDashboardOverview({ storeId: shiftStoreId, period: range }).then((data) => {
      if (active) setShifts(data.current_shift ? [normalizeDashboardShift(data.current_shift)] : []);
    }).catch(() => {
      if (active) setShifts([]);
    });
    return () => { active = false; };
  }, [storeId, shiftStoreId, range]);

  const merchantRecord = merchantDetails?.merchant || user?.merchant || user || {};
  const rawMerchant = merchantDetails?.raw?.merchant || merchantDetails?.raw || {};
  const subscription = overview?.subscription_plan || merchantDetails?.subscription || merchantRecord?.subscription || rawMerchant?.subscription || {};
  const subscriptionPlan = subscription.plan && typeof subscription.plan === "object"
    ? subscription.plan
    : subscription.planDetails || subscription.plan_details || merchantDetails?.raw?.plan || {};
  const planName = subscription.planName || subscription.plan_name || subscriptionPlan.name || subscriptionPlan.planName
    || (typeof subscription.plan === "string" ? subscription.plan : "");
  const storeAllowance = subscription.total_stores_allowed ?? subscription.store_limit ?? subscription.includedStores ?? subscription.included_stores ?? subscription.stores_limit
    ?? subscription.maxStoresAllowed ?? subscription.storeLimit ?? subscriptionPlan.includedStores
    ?? subscriptionPlan.included_stores ?? subscriptionPlan.storesLimit ?? subscriptionPlan.stores_limit;
  const enrolledStoreCount = Number(subscription.enrolled_stores ?? stores.length ?? rawMerchant.storeCount ?? rawMerchant.store_count ?? 0);
  const selectedRoleRows = [merchantRecord.selectedRoles, merchantRecord.selected_roles, merchantRecord.roles,
    merchantRecord.roleTemplates, merchantRecord.role_templates, merchantRecord.roleAssignments, merchantRecord.role_assignments,
    rawMerchant.selectedRoles, rawMerchant.selected_roles, rawMerchant.roles, rawMerchant.roleTemplates,
    rawMerchant.role_templates, rawMerchant.roleAssignments, rawMerchant.role_assignments, subscription.roles]
    .find((value) => Array.isArray(value) && value.length) || [];
  const selectedRoles = selectedRoleRows.map((role) => typeof role === "string"
    ? role
    : role?.name || role?.roleName || role?.role_name || role?.title).filter(Boolean);
  const shiftStore = storeId === "all" ? (stores.find((store) => store.value === shiftStoreId) || stores[0]) : null;
  const activeShift = shifts.find((shift) => String(shift.status).toLowerCase() === "open"
    && (storeId !== "all" || !shiftStore || shift.storeId === shiftStore.value));
  const isDemo = !merchantId && !loadingSetup;
  const storeOptions = stores.length ? stores : isDemo ? DEMO_STORES : [];
  const displayedPlanName = planName || (isDemo ? "Growth Plan" : "Plan details unavailable");
  const displayedStoreAllowance = storeAllowance ?? (isDemo ? 5 : null);
  const displayedEnrolledStores = enrolledStoreCount || (isDemo ? 3 : 0);
  const displayedRoles = storeId === "all"
    ? merchantRoles.length ? merchantRoles : selectedRoles.length ? selectedRoles : isDemo ? ["Store Manager", "Cashier", "Inventory Clerk"] : []
    : storeRoles.length ? storeRoles : isDemo ? ["Store Manager", "Cashier", "Inventory Clerk"] : [];
  const subscriptionStatus = subscription.status || merchantRecord.subscriptionStatus || (isDemo ? "Active" : "—");
  const merchantDisplayName = merchantRecord.businessDisplayName || merchantRecord.business_display_name || merchantRecord.businessName
    || merchantRecord.business_name || merchantRecord.merchantName || merchantRecord.name || user?.merchantName || user?.email || "Your merchant";
  const renewalDate = subscription.renewalDate || subscription.renewal_date || subscription.nextBillingDate || subscription.next_billing_date;
  const storeUsagePercent = displayedStoreAllowance && Number(displayedStoreAllowance) > 0
    ? Math.min(100, Math.round((Number(displayedEnrolledStores) / Number(displayedStoreAllowance)) * 100))
    : 0;
  const completedOrders = orders.filter((order) => /complete|paid/i.test(order.status));
  const pendingOrderCount = orders.filter((order) => /pending/i.test(order.status)).length;
  const dashboardMetrics = overview?.metrics || {};
  const salesInLoadedOrders = dashboardMetrics.sales ?? completedOrders.reduce((total, order) => total + (Number(order.totalValue) || 0), 0);
  const topProducts = useMemo(() => {
    if (Array.isArray(overview?.top_products)) return overview.top_products.map((item) => ({
      name: item.name || item.product_name || item.productName || "Product",
      units: Number(item.units ?? item.quantity ?? item.quantity_sold ?? 0),
      sales: Number(item.sales ?? item.revenue ?? item.total ?? 0),
    }));
    const totals = new Map();
    for (const order of orders) for (const line of (Array.isArray(order.lineItems) ? order.lineItems : [])) {
      const name = line.name || line.productName || line.product_name || line.product?.name;
      if (!name) continue;
      const units = Number(line.quantity ?? line.qty ?? 0) || 0;
      const sales = Number(line.total ?? line.subtotal ?? line.totalAmount ?? 0) || 0;
      const previous = totals.get(name) || { name, units: 0, sales: 0 };
      totals.set(name, { ...previous, units: previous.units + units, sales: previous.sales + sales });
    }
    return [...totals.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  }, [orders, overview]);
  const topCategories = useMemo(() => {
    if (Array.isArray(overview?.top_categories)) {
      const rows = overview.top_categories.map((item) => ({
        name: item.name || item.category_name || item.categoryName || "Category",
        units: Number(item.units ?? item.quantity ?? item.quantity_sold ?? 0),
        share: Number(item.share ?? item.percentage ?? 0),
      }));
      const totalUnits = rows.reduce((sum, row) => sum + (Number.isFinite(row.units) ? row.units : 0), 0);
      return rows.map((row) => ({
        ...row,
        share: row.share > 0 || row.units <= 0 || totalUnits <= 0
          ? row.share
          : Math.round(row.units / totalUnits * 100),
      }));
    }
    const totals = new Map();
    for (const order of orders) for (const line of (Array.isArray(order.lineItems) ? order.lineItems : [])) {
      const category = line.categoryName || line.category_name || line.category?.name || line.categories?.[0]?.name;
      if (!category) continue;
      const units = Number(line.quantity ?? line.qty ?? 0) || 0;
      totals.set(category, (totals.get(category) || 0) + units);
    }
    const rows = [...totals].map(([name, units]) => ({ name, units } )).sort((a, b) => b.units - a.units).slice(0, 5);
    const total = rows.reduce((sum, row) => sum + row.units, 0) || 1;
    return rows.map((row) => ({ ...row, share: Math.round(row.units / total * 100) }));
  }, [orders, overview]);
  const latestOrders = [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6);
  const visibleOrders = (isDemo
    ? DEMO_ORDERS.map((order, index) => ({ ...order, dashboardStoreName: stores[index % Math.max(stores.length, 1)]?.label || "Main Store" }))
    : latestOrders).slice(0, 5);
  const actionStoreId = storeId === "all" ? "" : storeId;
  const ordersHref = merchantId
    ? `/orders?merchant=${encodeURIComponent(merchantId)}${actionStoreId ? `&store=${encodeURIComponent(actionStoreId)}` : ""}`
    : "/orders";
  const shiftsHref = shiftPath(merchantId, actionStoreId);
  const productsHref = actionStoreId ? `/stores/${encodeURIComponent(actionStoreId)}/configuration/products` : "/products";
  const storeConfigurationPath = actionStoreId
    ? `/merchants/${encodeURIComponent(merchantId)}/stores/${encodeURIComponent(actionStoreId)}/configuration`
    : "";
  const customersHref = storeConfigurationPath ? `${storeConfigurationPath}/customers` : "/stores";
  const employeesHref = storeConfigurationPath ? `${storeConfigurationPath}/users` : "/employees";
  const couponsHref = storeConfigurationPath ? `${storeConfigurationPath}/coupons` : "/coupons";
  const discountsHref = storeConfigurationPath ? `${storeConfigurationPath}/discounts` : "/discounts";
  const displayedEmployees = employeeCount == null ? (isDemo ? 12 : "—") : employeeCount;
  const metrics = [
    { label: "Stores", value: loadingSetup ? "…" : Number(dashboardMetrics.stores ?? stores.length ?? (isDemo ? 3 : 0)).toLocaleString(), note: "Stores on this account", icon: "bi-shop", tone: "blue", leftValue: isDemo ? "3" : String(stores.length), leftLabel: "enrolled", rightValue: displayedStoreAllowance == null ? "—" : String(displayedStoreAllowance), rightLabel: "allowed" },
    { label: "Employees", value: loadingData ? "…" : Number(displayedEmployees).toLocaleString() === "NaN" ? displayedEmployees : Number(displayedEmployees).toLocaleString(), note: "Selected store", icon: "bi-people", tone: "green", leftValue: isDemo ? "12" : String(displayedEmployees), leftLabel: "assigned", rightValue: "Store", rightLabel: "staff" },
    { label: "Sales", value: loadingData ? "…" : isDemo ? "₹24,850.50" : money(salesInLoadedOrders, orders[0]?.currency), note: isDemo ? "Today" : rangeOptions.find((item) => item.value === range)?.label, icon: "bi-currency-dollar", tone: "orange", leftValue: isDemo ? "4" : String(completedOrders.length), leftLabel: "completed", rightValue: isDemo ? "86" : String(orderTotal), rightLabel: "orders" },
    { label: "Orders", value: loadingData ? "…" : isDemo ? "86" : Number(dashboardMetrics.orders ?? orderTotal).toLocaleString(), note: isDemo ? "Today" : "Selected period", icon: "bi-receipt", tone: "violet", leftValue: isDemo ? "4" : String(completedOrders.length), leftLabel: "completed", rightValue: isDemo ? "1" : String(pendingOrderCount), rightLabel: "pending" },
  ];

  return <div className="merchant-dashboard page-content">
    <header className="merchant-dashboard-header">
      <div>
        <p className="merchant-dashboard-merchant"><strong>{merchantDisplayName}</strong></p>
        <h1>Merchant Dashboard</h1>
        <p>Track store performance, orders, and the shift currently in progress.</p>
      </div>
      {((merchantId && storeId) || isDemo) && <div className="merchant-dashboard-controls">
        {storeOptions.length > 0 && <label className="merchant-dashboard-store-picker"><span>Store</span><select value={storeId} onChange={(event) => setStoreId(event.target.value)}>
          <option value="all">All stores</option>
          {storeOptions.map((store) => <option key={store.value} value={store.value}>{store.label}</option>)}
        </select></label>}
        <div className="merchant-dashboard-range" role="group" aria-label="Sales date range">
          {rangeOptions.map((option) => <button type="button" key={option.value} className={range === option.value ? "active" : ""} onClick={() => setRange(option.value)}>{option.label}</button>)}
        </div>
      </div>}
    </header>

    {error && <div className="merchant-dashboard-message is-error" role="alert">{error}</div>}
    {merchantId && !stores.length && !loadingSetup && !isDemo && <div className="merchant-dashboard-message">No stores are linked to this merchant account.</div>}
    {((merchantId && storeId) || isDemo) && <>
      <section className="merchant-dashboard-metrics" aria-label="Store sales metrics">
        {metrics.map((item) => <article className={`merchant-metric-card ${item.tone}`} key={item.label}>
          <div className="merchant-metric-top"><span className="merchant-metric-icon"><i className={`bi ${item.icon}`} /></span><div className="merchant-metric-copy"><span>{item.label}</span><strong>{item.value}</strong></div></div>
          <small>{item.label === "Employees" && storeId === "all" ? "Across all stores" : item.note}</small>
        </article>)}
      </section>

      <section className="merchant-information-grid">
        <article className="merchant-dashboard-card merchant-information-card">
          <div className="merchant-dashboard-card-heading">
            <div className="merchant-information-title"><span><i className="bi bi-credit-card-2-front" /></span><div><h2>Subscription plan</h2><p>Plan allowance and current store usage</p></div></div>
            <div className="merchant-subscription-actions"><span className={`merchant-subscription-status ${String(subscriptionStatus).toLowerCase()}`}>{subscriptionStatus}</span><Link to="/subscriptions">Manage Plans</Link></div>
          </div>
          <div className="merchant-plan-name">{displayedPlanName}</div>
          <div className="merchant-store-usage-heading"><strong>Stores</strong><span>{displayedEnrolledStores} enrolled {displayedStoreAllowance != null ? `of ${displayedStoreAllowance} allowed` : ""}</span></div>
          <div className="merchant-store-usage-track"><span style={{ width: `${storeUsagePercent}%` }} /></div>
          <div className="merchant-plan-details"><div><span>Plan limit</span><strong>{displayedStoreAllowance == null ? "—" : `${displayedStoreAllowance} stores`}</strong></div><div><span>Enrolled</span><strong>{displayedEnrolledStores} {displayedEnrolledStores === 1 ? "store" : "stores"}</strong></div><div><span>Renewal</span><strong>{renewalDate ? localDate(renewalDate) : isDemo ? "Dec 23, 2026" : "—"}</strong></div></div>
        </article>
        <article className="merchant-dashboard-card merchant-information-card">
          <div className="merchant-dashboard-card-heading">
            <div className="merchant-information-title"><span><i className="bi bi-shield-check" /></span><div><h2>Roles &amp; Permissions</h2><p>{storeId === "all" ? "Roles enabled for this merchant" : `Roles enabled for ${stores.find((store) => store.value === storeId)?.label || "this store"}`}</p></div></div>
            {merchantId && storeId !== "all" && <Link className="merchant-view-roles-link" to={`${storeConfigurationPath}/roles`}>View roles & permissions <i className="bi bi-arrow-up-right" /></Link>}
          </div>
          {displayedRoles.length
            ? <div className="merchant-selected-roles">{displayedRoles.map((role) => <span key={role}><i className="bi bi-check-circle-fill" />{role}</span>)}</div>
            : <p className="merchant-no-roles">No selected roles were returned for this merchant.</p>}
        </article>
      </section>

      <section className="merchant-dashboard-grid">
        <article className="merchant-dashboard-card merchant-recent-orders">
          <div className="merchant-dashboard-card-heading"><div className="merchant-information-title"><span><i className="bi bi-receipt" /></span><div><h2>Recent orders</h2><p>{storeId === "all" ? "Latest orders across all stores" : "Latest activity for this store"}</p></div></div><Link to={ordersHref}>View all orders <i className="bi bi-arrow-up-right" /></Link></div>
          <div className="merchant-recent-table-wrap"><table><thead><tr><th>Order</th>{storeId === "all" && <th>Store</th>}<th>Customer</th><th>Total</th><th>Status</th><th>Time</th></tr></thead><tbody>
            {visibleOrders.map((order) => <tr key={order.id || order.wooOrderId}>
              <td><strong>#{order.wooOrderId || order.id}</strong></td>{storeId === "all" && <td>{order.dashboardStoreName || "—"}</td>}
              <td>{order.author || "Walk-in customer"}</td><td>{order.total}</td>
              <td><span className={`merchant-order-status ${statusTone(order.status)}`}>{order.status}</span></td><td>{localDate(order.createdAt)}</td>
            </tr>)}
            {!visibleOrders.length && <tr><td colSpan={storeId === "all" ? 6 : 5} className="merchant-dashboard-empty">{loadingData ? "Loading recent orders…" : "No orders found for this period."}</td></tr>}
          </tbody></table></div>
        </article>

        <article className="merchant-dashboard-card merchant-running-shift">
          <div className="merchant-dashboard-card-heading"><div className="merchant-information-title"><span><i className="bi bi-clock-history" /></span><div><h2>{storeId === "all" ? "Store running shift" : "Running shift"}</h2><p>{storeId === "all" ? "Current shift for the selected store" : "Current cash drawer and staff"}</p></div></div>{storeId !== "all" && <Link to={shiftsHref}>Manage shifts <i className="bi bi-arrow-up-right" /></Link>}</div>
          {storeId === "all" && stores.length > 0 && <label className="merchant-mini-store-picker"><span>View shifts for</span><select value={shiftStore?.value || ""} onChange={(event) => setShiftStoreId(event.target.value)}>{stores.map((store) => <option key={store.value} value={store.value}>{store.label}</option>)}</select></label>}
          {activeShift || isDemo ? <>
            <div className="merchant-shift-status"><span className="merchant-live-dot" /> Shift open <span>{isDemo ? "SHIFT-104" : activeShift.id}</span></div>
            <dl>
              {storeId === "all" && <div><dt>Store</dt><dd>{activeShift?.dashboardStoreName || shiftStore?.label || "Main Store"}</dd></div>}
              <div><dt>Opened by</dt><dd>{isDemo ? "Ravi Kumar" : activeShift.openedBy || "—"}</dd></div>
              <div><dt>Started</dt><dd>{isDemo ? "Today, 9:15 AM" : localDate(activeShift.openTime)}</dd></div>
              <div><dt>Opening cash</dt><dd>{isDemo ? "₹5,000.00" : money(activeShift.openingBalance, orders[0]?.currency)}</dd></div>
              <div><dt>Sales so far</dt><dd>{isDemo ? "₹6,420.00" : money(activeShift.sales, orders[0]?.currency)}</dd></div>
              <div><dt>Orders</dt><dd>{isDemo ? "21" : activeShift.orders ?? "—"}</dd></div>
            </dl>
            <div className="merchant-shift-static-note">Shift currently in progress</div>
          </> : <div className="merchant-no-shift"><i className="bi bi-clock" /><strong>No shift is open</strong><span>No active shift found for this store.</span></div>}
        </article>
      </section>

      <section className="merchant-dashboard-grid merchant-rankings-grid">
        <article className="merchant-dashboard-card merchant-ranking-card">
          <div className="merchant-dashboard-card-heading"><div><h2>Top products sold</h2><p>Units sold this period{storeId === "all" ? " across all stores" : " for this store"}</p></div></div>
          <div className="merchant-ranking-list">{(topProducts.length ? topProducts : isDemo ? DEMO_TOP_PRODUCTS : []).map((product, index, rows) => <div className="merchant-ranking-row" key={product.name}>
            <span className="merchant-ranking-index">{index + 1}</span><div className="merchant-ranking-main"><strong>{product.name}</strong><span><i style={{ width: `${Math.max(18, product.units / (rows[0]?.units || 1) * 100)}%` }} /></span></div><div className="merchant-ranking-values"><strong>{product.units} <small>units</small></strong><span>{money(product.sales, orders[0]?.currency)}</span></div>
          </div>)}</div>
          {!topProducts.length && !isDemo && <p className="merchant-no-roles">Product line item data is unavailable for these orders.</p>}
        </article>
        <article className="merchant-dashboard-card merchant-ranking-card">
          <div className="merchant-dashboard-card-heading"><div><h2>Top categories sold</h2><p>Share of units sold this period{storeId === "all" ? " across all stores" : " for this store"}</p></div></div>
          <div className="merchant-ranking-list">{(topCategories.length ? topCategories : isDemo ? DEMO_TOP_CATEGORIES : []).map((category, index) => <div className="merchant-ranking-row" key={category.name}>
            <span className="merchant-ranking-index">{index + 1}</span><div className="merchant-ranking-main"><strong>{category.name}</strong><span><i style={{ width: `${category.share}%` }} /></span></div><div className="merchant-ranking-values"><strong>{category.units} <small>units</small></strong><span>{category.share}% of units</span></div>
          </div>)}</div>
          {!topCategories.length && !isDemo && <p className="merchant-no-roles">Product category data is unavailable for these orders.</p>}
        </article>
      </section>

      {storeId !== "all" && <section className="merchant-dashboard-card merchant-quick-actions">
        <div className="merchant-dashboard-card-heading"><div className="merchant-information-title"><span><i className="bi bi-lightning-charge" /></span><div><h2>Quick links</h2><p>Common actions for this store</p></div></div></div>
        <div className="merchant-quick-links">
          <Link to={employeesHref}><i className="bi bi-person-badge" /><span><strong>Employees</strong><small>Manage store employees</small></span><i className="bi bi-arrow-up-right" /></Link>
          <Link to={customersHref}><i className="bi bi-people" /><span><strong>Customers</strong><small>View customer records</small></span><i className="bi bi-arrow-up-right" /></Link>
          <Link to={couponsHref}><i className="bi bi-ticket-perforated" /><span><strong>Coupons</strong><small>Manage coupons</small></span><i className="bi bi-arrow-up-right" /></Link>
          <Link to={discountsHref}><i className="bi bi-percent" /><span><strong>Discounts</strong><small>Manage store discounts</small></span><i className="bi bi-arrow-up-right" /></Link>
        </div>
      </section>}

    </>}
  </div>;
}
