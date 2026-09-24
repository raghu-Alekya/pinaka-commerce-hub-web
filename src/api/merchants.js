import { api } from "./http";
import { endpoints } from "./endpoints";

export function toMerchantPayload(data) {
  if (!data) return {};
  const m = data.merchant || data;
  const s = data.subscription || data;
  const primaryStore = (Array.isArray(data.stores) && data.stores[0]) || {};

  const businessName = m.business || m.businessName || m.legalBusinessName || data.businessName || "Business";
  const businessDisplayName = m.display || m.businessDisplayName || m.businessName || businessName;
  const merchantName = m.name || m.merchantName || m.ownerName || [m.firstName, m.lastName].filter(Boolean).join(" ") || businessDisplayName;
  const merchantEmail = m.email || m.merchantEmail || data.email || "";
  const merchantPhoneNumber = m.phone || m.merchantPhoneNumber || data.phone || "";
  const addressLine1 = m.addressLine1 || data.addressLine1 || data.businessAddress || primaryStore.address || "100 Main St";
  const addressLine2 = m.addressLine2 || data.addressLine2 || "";
  const city = m.city || data.city || primaryStore.city || "City";
  const state = m.state || data.state || primaryStore.state || "State";
  const pinCode = m.postal || m.pinCode || m.postalCode || data.postalCode || primaryStore.zip || "10001";
  const country = m.country || data.country || "USA";
  const initialStatus = m.initialStatus || m.status || data.status || "ACTIVE";
  const storeTypeId = m.storeTypeId || data.storeTypeId || "a1b2c3d4-e5f6-4a1b-8c2d-000000000001";
  const planId = s.planId || data.planId || "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const billingCycle = String(s.billingCycle || data.billingCycle || "MONTHLY").toUpperCase();
  const startDate = s.startDate || s.start || data.startDate || new Date().toISOString().slice(0, 10);
  const renewalDate = s.renewalDate || data.renewalDate || "";
  const agreementPrice = s.agreementPrice !== undefined ? Number(s.agreementPrice) : (data.agreementPrice !== undefined ? Number(data.agreementPrice) : 99);
  const tax = Number(data.tax || m.tax || 8.25);
  const totalDueToday = Number(data.totalDueToday || (agreementPrice + tax));
  const paymentMethod = data.paymentMethod || m.paymentMethod || "CARD";
  const roleIds = Array.isArray(data.roleIds) ? data.roleIds : (Array.isArray(m.roleIds) ? m.roleIds : []);

  return {
    merchant: {
      business: businessName,
      display: businessDisplayName,
      name: merchantName,
      email: merchantEmail,
      phone: merchantPhoneNumber,
      country,
      city,
      state,
      addressLine1,
      addressLine2,
      postal: pinCode,
      storeTypeId,
    },
    subscription: {
      planId,
      billingCycle,
      startDate,
      renewalDate: renewalDate || undefined,
      agreementPrice,
    },
    stores: (data.stores || []).map((store) => ({
      name: store.name,
      id: store.id,
      type: store.type,
      phone: store.phone || "",
      url: store.url,
      currency: store.currency,
      status: store.status,
      address: store.address,
      timezone: store.timezone,
      city: store.city,
      state: store.state,
      zip: store.zip,
    })),
    roleIds,
    merchantName,
    merchantEmail,
    merchantPhoneNumber,
    businessName,
    businessDisplayName,
    initialStatus,
    addressLine1,
    addressLine2,
    city,
    state,
    pinCode,
    country,
    storeTypeId,
    planId,
    billingCycle,
    startDate,
    renewalDate: renewalDate || undefined,
    agreementPrice,
    tax,
    totalDueToday,
    paymentMethod,
    onboardingStatus: initialStatus,
  };
}

export async function listMerchants() {
  const data = await api.get(endpoints.merchants);
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.merchants)
      ? data.merchants
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return items.map(mapMerchantToRow).filter(Boolean);
}

function titleCase(value) {
  if (!value) return "—";
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toInitials(name) {
  return String(name || "M")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "M";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

function merchantApiId(merchant) {
  const values = [merchant?.id, merchant?.merchantId].filter(Boolean);
  return values.find(value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value))) || values[0] || '';
}

export function mapMerchantToRow(item) {
  if (!item) return null;
  const merchant = item.merchant || item.data?.merchant || item;
  const plan = item.plan || merchant.plan || item.subscription?.plan || {};
  const subscription = item.subscription || merchant.subscription || {};

  const name =
    merchant.businessDisplayName ||
    merchant.businessName ||
    merchant.legalBusinessName ||
    merchant.merchantName ||
    merchant.ownerName ||
    merchant.name ||
    "Merchant";

  const id = merchant.merchantId || merchant.id || merchant.code || "";
  const email = merchant.merchantEmail || merchant.email || "";
  const phone = merchant.merchantPhoneNumber || merchant.phone || "";
  const stores = Array.isArray(merchant.stores || item.stores)
    ? (merchant.stores || item.stores).length
    : merchant.storeCount ?? merchant.storesCount ?? 0;

  const planName =
    subscription.planName ||
    plan.name ||
    subscription.planCode ||
    plan.code ||
    merchant.plan ||
    merchant.subscriptionPlan ||
    "—";

  const renewal =
    subscription.renewalDate ||
    subscription.renewal_date ||
    merchant.renewal ||
    merchant.renewsOn ||
    "";

  const status =
    merchant.initialStatus ||
    merchant.status ||
    merchant.onboardingStatus ||
    "ACTIVE";

  const createdAt =
    merchant.createdDate ||
    merchant.createdAt ||
    merchant.joined ||
    "";

  const updatedAt =
    merchant.updatedDate ||
    merchant.updatedAt ||
    createdAt;

  return {
    id,
    merchantId: merchantApiId(merchant) || id,
    name,
    email,
    phone,
    stores,
    plan: planName,
    renewal: renewal ? formatDate(renewal) : "—",
    status: titleCase(status),
    joined: formatDate(createdAt),
    active: formatRelative(updatedAt),
    initials: toInitials(name),
    createdAt,
    country: merchant.country || "",
    state: merchant.state || "",
    city: merchant.city || "",
    _raw: item,
  };
}

export async function getMerchant(id) {
  const data = await api.get(endpoints.merchant(id));
  const merchant = data?.merchant || data?.data?.merchant || data?.data || data;
  const stores = Array.isArray(data?.stores)
    ? data.stores
    : Array.isArray(merchant?.stores)
      ? merchant.stores
      : [];
  const subscription = data?.subscription || merchant?.subscription || null;

  return {
    merchant: {
      ...mapMerchantToRow(merchant),
      plan:
        subscription?.planName ||
        subscription?.planCode ||
        mapMerchantToRow(merchant).plan,
      phone: merchant?.merchantPhoneNumber || merchant?.phone || "",
      city: merchant?.city || "",
      state: merchant?.state || "",
      country: merchant?.country || "",
    },
    stores: stores.map(mapStoreToRow),
    subscription,
    raw: data,
  };
}

function mapStoreToRow(store) {
  const address = store.address || {};
  const location = [
    address.street || store.address,
    address.city || store.city,
    address.state || store.state,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: store.id || store.storeCode || store.storeId,
    name: store.storeName || store.name || "Store",
    type: titleCase(store.storeType || store.type),
    location: location || "—",
    status: titleCase(store.status || store.operationalStatus),
    currency: store.currency || "",
    timezone: store.timezone || "",
    url: store.baseUrl || store.url || store.storeUrl || "",
    merchantId: store.merchantId || "",
  };
}

export async function createMerchant(data) {
  const payload = toMerchantPayload(data);
  const result = await api.post(endpoints.createMerchant, payload);

  if (result && result.success === false) {
    throw new Error(result.message || "Unable to create merchant.");
  }

  return result;
}

export async function updateMerchant(id, data) {
  const payload = toMerchantPayload(data);
  const result = await api.put(endpoints.merchant(id), payload);

  if (result && result.success === false) {
    throw new Error(result.message || "Unable to update merchant.");
  }

  return result;
}

export async function getMerchantForm(id) {
  const { raw } = await getMerchant(id);
  const merchant = raw.merchant || raw;
  const subscription = raw.subscription;
  return {
    ...merchant,
    merchantId: merchant.merchantId || merchant.id,
    businessType: titleCase(merchant.businessType || "Retail"),
    retailType: titleCase(merchant.retailSubCategory || "Grocery"),
    firstName: merchant.firstName || merchant.ownerName?.split(" ")[0] || merchant.merchantName?.split(" ")[0] || "",
    lastName: merchant.lastName || merchant.ownerName?.split(" ").slice(1).join(" ") || merchant.merchantName?.split(" ").slice(1).join(" ") || "",
    plan: subscription?.planCode || subscription?.plan_id || "",
    billingCycle: subscription?.billingCycle || subscription?.billing_cycle || "",
    trialPeriod: String(subscription?.trialDays ?? 0),
    stores: (raw.stores || []).map(store => ({
      persisted: true, id: store.id, name: store.storeName, type: titleCase(store.storeType),
      phone: store.phone || "", url: store.baseUrl || "", currency: store.currency,
      status: titleCase(store.status), timezone: store.timezone,
      address: store.address?.street || "", city: store.address?.city || "",
      state: store.address?.state || "", zip: store.address?.zipCode || "",
    })),
  };
}
