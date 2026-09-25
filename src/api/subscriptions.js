import { api } from "./http";

const path = (id) => `/subscriptions/${encodeURIComponent(id)}`;

export const listSubscriptions = (params) => api.get("/subscriptions", { params });
export const listSubscriptionPlans = () => api.get("/subscription-plans");
export const getSubscription = (id) => api.get(path(id));
export const createSubscription = (data) => api.post("/subscriptions", data);
export const updateSubscription = (id, data) => api.put(path(id), data);
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

  const merchantName =
    m.businessDisplayName ||
    m.businessName ||
    m.legalBusinessName ||
    m.merchantName ||
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

  const planName =
    item.planName ||
    item.plan_name ||
    plan.name ||
    item.planCode ||
    item.plan_code ||
    "Pro Plan";

  const storesCount =
    item.maxStoresAllowed ??
    item.max_stores_allowed ??
    plan.included_stores ??
    item.licensedStoreCount ??
    1;

  const devicesCount =
    item.licensedDeviceCount ??
    plan.included_terminals ??
    1;

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

  const entitlements =
    Array.isArray(item.entitlements) && item.entitlements.length > 0
      ? item.entitlements
      : Array.isArray(plan.included_features)
      ? plan.included_features
      : [];

  return {
    id:
      item.subscriptionId ||
      item.subscriptionCode ||
      item.id ||
      `SUB-${index + 1}`,
    merchant: merchantName,
    merchantId: merchantId,
    plan: planName,
    stores: Number(storesCount) || 1,
    devices: Number(devicesCount) || 1,
    start: formatDate(rawStart),
    end: formatDate(rawEnd),
    rawStart: rawStart || "",
    rawEnd: rawEnd || "",
    status: titleCaseStatus(item.status),
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

export function subscriptionPayload(form) {
  return {
    planCode: form.planCode,
    planName: form.planName,
    maxStoresAllowed: Number(form.maxStoresAllowed),
    entitlements: Array.isArray(form.entitlements)
      ? form.entitlements
      : [
          ...new Set(
            form.entitlements
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          ),
        ],
    billingCycle: form.billingCycle,
    trialDays: Number(form.trialDays),
    price: Number(form.price),
    status: form.status,
    ...(form.currentPeriodStart
      ? { currentPeriodStart: new Date(form.currentPeriodStart).toISOString() }
      : {}),
    ...(form.currentPeriodEnd
      ? { currentPeriodEnd: new Date(form.currentPeriodEnd).toISOString() }
      : {}),
  };
}
