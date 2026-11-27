import { api } from "./http";

function unwrap(payload) {
  return payload?.data?.data || payload?.data || payload?.result || payload;
}

export async function listMerchantDashboardStores() {
  const payload = unwrap(await api.get("/api/v1/merchant-dashboard/stores"));
  const rows = Array.isArray(payload) ? payload : payload?.stores || payload?.items || [];
  return rows.map((store) => ({
    value: String(store.id || store.store_id || store.storeId || store.uuid || ""),
    label: store.name || store.store_name || store.storeName || store.label || "",
  })).filter((store) => store.value && store.label);
}

export async function getMerchantDashboardOverview({ storeId, period = "today" } = {}) {
  const query = new URLSearchParams({ period });
  if (storeId && storeId !== "all") query.set("storeId", storeId);
  const payload = unwrap(await api.get(`/api/v1/merchant-dashboard/overview?${query}`));
  if (payload?.success === false) throw new Error(payload.message || "Unable to load dashboard overview.");
  return payload || {};
}
