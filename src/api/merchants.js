import { api } from "./http";
import { endpoints } from "./endpoints";

export function toMerchantPayload(data) {
  const primaryStore = data.stores?.[0] || {};

  return {
    merchantId: data.merchantId,
    businessName: data.businessName,
    legalBusinessName: data.legalBusinessName,
    businessType: data.businessType,
    country: data.country,
    state: data.state || primaryStore.state || "",
    city: data.city || primaryStore.city || "",
    postalCode: data.postalCode || primaryStore.zip || "",
    businessAddress: data.businessAddress || primaryStore.address || "",
    taxId: data.taxId || "",
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    jobTitle: data.jobTitle || "",
    alternatePhone: data.alternatePhone || "",
    billingContact: Boolean(data.billingContact),
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
    plan: data.plan,
    billingCycle: data.billingCycle,
    trialPeriod: String(data.trialPeriod ?? ""),
    onboardingStatus: data.onboardingStatus || "Completed",
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

  return items.map(mapMerchantToRow);
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

export function mapMerchantToRow(merchant) {
  const name =
    merchant.businessName ||
    merchant.legalBusinessName ||
    merchant.ownerName ||
    merchant.name ||
    "Merchant";

  const stores = Array.isArray(merchant.stores)
    ? merchant.stores.length
    : merchant.storeCount ?? merchant.storesCount ?? 0;

  return {
    id: merchant.id || merchant.merchantId,
    name,
    email: merchant.email || "",
    phone: merchant.phone || "",
    stores,
    plan: merchant.plan || merchant.subscriptionPlan || "—",
    renewal: merchant.renewal || merchant.renewsOn || "",
    status: titleCase(merchant.status || merchant.onboardingStatus),
    joined: formatDate(merchant.createdAt || merchant.joined),
    active: formatRelative(merchant.updatedAt || merchant.createdAt),
    initials: toInitials(name),
    createdAt: merchant.createdAt,
  };
}

export async function getMerchant(id) {
  const data = await api.get(endpoints.merchant(id));
  const merchant = data?.merchant || data?.data || data;
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
      phone: merchant?.phone || "",
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
  };
}

export async function createMerchant(data) {
  const result = await api.post(
    endpoints.createMerchant,
    toMerchantPayload(data)
  );

  if (result && result.success === false) {
    throw new Error(result.message || "Unable to create merchant.");
  }

  return result;
}

export function updateMerchant(id, data) {
  return api.put(endpoints.merchant(id), toMerchantPayload(data));
}
