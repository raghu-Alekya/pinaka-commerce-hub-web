import { api, pendingStoreRead } from "./http";

const path = (id) => `/subscriptions/${encodeURIComponent(id)}`;

function normalizeBillingCycle(value) {
  const cycle = String(value || "").trim().toUpperCase();
  if (cycle === "YEARLY" || cycle === "ANNUAL" || cycle === "ANNUALLY") return "YEARLY";
  if (cycle === "QUARTERLY") return "QUARTERLY";
  if (cycle === "MONTHLY") return "MONTHLY";
  return cycle || "MONTHLY";
}

export const listSubscriptions = (params) => pendingStoreRead(`subscription-list:${JSON.stringify(params || {})}`, () => api.get("/subscriptions", { params }));
export const listSubscriptionPlans = () => pendingStoreRead("subscription-plans", () => api.get("/subscription-plans"));
export const changeSubscriptionPlan = (data) =>
  api.post("/subscriptions/subscription-plan-changes", data);
export const getSubscription = (id) => pendingStoreRead(`subscription:${id}`, () => api.get(path(id)));
function toSubscriptionApiPayload(data = {}) {
  return {
    merchant_id: data.merchant_id ?? data.merchantId,
    plan_id: data.plan_id ?? data.planId,
    billing_cycle: normalizeBillingCycle(data.billing_cycle ?? data.billingCycle),
    start_date: data.start_date ?? data.startDate,
    renewal_date: data.renewal_date ?? data.renewalDate,
    price: data.price ?? data.agreement_price ?? data.agreementPrice,
    autoRenew: data.autoRenew,
    status: data.status,
  };
}

export const createSubscription = (data) => api.post("/subscriptions", toSubscriptionApiPayload(data));
export const updateSubscription = (id, data) => api.put(path(id), toSubscriptionApiPayload(data));
export const deleteSubscription = (id) => api.delete(path(id));

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr).slice(0, 10);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

export function titleCaseStatus(status) {
  if (!status) return "Inactive";
  const str = String(status).trim().toUpperCase();
  if (str === "ACTIVE") return "Active";
  if (str === "INACTIVE") return "Inactive";
  if (str === "CANCELLED" || str === "CANCELED") return "Cancelled";
  if (str === "EXPIRED") return "Expired";
  if (str === "EXPIRING_SOON" || str === "EXPIRING SOON") return "Expiring Soon";
  return String(status).charAt(0).toUpperCase() + String(status).slice(1).toLowerCase();
}

export function mapSubscriptionToRow(item, index = 0) {
  if (!item) return null;
  const m = item.merchant || {};
  const plan = item.plan || {};
  const storeType = item.storeType || item.store_type || m.storeType || {};

  const merchantName =
    (typeof item.merchant === "string" ? item.merchant : null) ||
    item.merchantName ||
    item.merchant_name ||
    item.businessName ||
    item.businessDisplayName ||
    item.business_name ||
    m.merchantName ||
    m.merchant_name ||
    m.businessDisplayName ||
    m.businessName ||
    m.legalBusinessName ||
    m.ownerName ||
    m.name ||
    item.merchantCode ||
    item.merchant_code ||
    item.merchantId ||
    `Merchant ${index + 1}`;

  const merchantId =
    m.merchantId ||
    m.merchantCode ||
    m.id ||
    item.merchantId ||
    item.merchant_code ||
    item.merchant_id ||
    `MID${String(index + 1).padStart(3, "0")}`;

  const merchantApiId =
    item.merchantUuid ||
    item.merchant_uuid ||
    m.id ||
    item.merchantId ||
    item.merchant_id ||
    m._id ||
    "";

  const planName =
    item.planName ||
    item.plan_name ||
    plan.name ||
    item.planCode ||
    item.plan_code ||
    "Pro Plan";

  const planId =
    item.planId ||
    item.plan_id ||
    plan.id ||
    plan._id ||
    "";

  const storeTypeId =
    (typeof storeType === "object" && storeType
      ? storeType.id || storeType._id || storeType.storeTypeId
      : storeType) ||
    item.storeTypeId ||
    item.store_type_id ||
    m.storeTypeId ||
    "";
  const storeTypeCode =
    (typeof storeType === "object" && storeType
      ? storeType.storeTypeCode || storeType.store_type_code || storeType.code
      : "") ||
    item.storeTypeCode ||
    item.store_type_code ||
    "";

  const storesCount =
    (item.includedStores || item.included_stores || item.stores_limit || item.maxStoresAllowed || item.max_stores_allowed || item.licensedStoreCount) ||
    (plan.stores_limit || plan.storesLimit || plan.includedStores || plan.included_stores) ||
    1;

  const devicesCount =
    (item.includedTerminals || item.included_terminals || item.terminal_limit || item.licensedDeviceCount) ||
    (plan.terminal_limit || plan.terminalLimit || plan.includedTerminals || plan.included_terminals) ||
    1;

  const employeesCount =
    (item.includedEmployees || item.included_employees || item.employees_limit) ||
    (plan.employees_limit || plan.employeesLimit || plan.includedEmployees || plan.included_employees || plan.includedUsers) ||
    0;

  const rawStart =
    item.startDate ||
    item.start_date ||
    item.createdAt ||
    item.created_at;

  const rawEnd =
    item.renewalDate ||
    item.renewal_date ||
    item.currentPeriodEnd ||
    item.current_period_end;
  const baseStatus = titleCaseStatus(item.status);
  const renewalDay = rawEnd ? String(rawEnd).trim().slice(0, 10) : "";
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const effectiveStatus = baseStatus === "Active" && /^\d{4}-\d{2}-\d{2}$/.test(renewalDay) && renewalDay < today
    ? "Inactive"
    : baseStatus;

  const entitlements =
    Array.isArray(item.entitlements) && item.entitlements.length > 0
      ? item.entitlements
      : Array.isArray(plan.included_features)
      ? plan.included_features
      : Array.isArray(plan.includedFeatures)
      ? plan.includedFeatures
      : [];

  return {
    id:
      item.subscriptionId ||
      item.subscriptionCode ||
      item.id ||
      `SUB-${index + 1}`,
    merchant: merchantName,
    merchantId: merchantId,
    merchantApiId,
    plan: planName,
    planId,
    planDetails: plan,
    storeTypeId: String(storeTypeId),
    storeTypeCode: String(storeTypeCode),
    storeTypeName:
      (typeof storeType === "object" && storeType
        ? storeType.name || storeType.storeTypeName
        : "") || item.storeTypeName || "",
    stores: Number(storesCount) ?? 1,
    devices: Number(devicesCount) ?? 1,
    employees: Number(employeesCount) ?? 0,
    includedStores: storesCount,
    includedTerminals: devicesCount,
    includedEmployees: employeesCount,
    start: formatDate(rawStart),
    end: formatDate(rawEnd),
    rawStart: rawStart || "",
    rawEnd: rawEnd || "",
    status: effectiveStatus,
    price: Number(
      item.price ||
        item.agreementPrice ||
        item.agreement_price ||
        plan.basePrice ||
        0
    ),
    currency: item.currency || plan.currency || "USD",
    billingCycle: item.billingCycle || item.billing_cycle || "MONTHLY",
    entitlements,
    merchantDetails: m,
    raw: item,
  };
}

export function subscriptionPayload(form, planId) {
  return {
    planId,
    billingCycle: normalizeBillingCycle(form.billingCycle),
    startDate: form.currentPeriodStart ? String(form.currentPeriodStart).slice(0, 10) : undefined,
    renewalDate: form.currentPeriodEnd ? String(form.currentPeriodEnd).slice(0, 10) : undefined,
    price: Number(form.price),
    status: form.status,
  };
}
