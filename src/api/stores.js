import { api } from "./http";
import { endpoints } from "./endpoints";

export function toStorePayload(store, merchantId) {
  return {
    merchantId: merchantId || store.merchantId || store.merchant,
    name: store.name || store.storeName,
    storeId: store.id || store.storeID,
    type: store.type || store.storeType,
    phone: store.phone,
    url: store.url,
    currency: store.currency,
    status: store.status,
    address: store.address,
    timezone: store.timezone,
    city: store.city,
    state: store.state,
    zip: store.zip,
    devices: store.devices || [],
    features: store.features || [],
    roles: store.roles || [],
  };
}

export function listStores() {
  return api.get(endpoints.stores);
}

export async function listMerchantStores(merchantId) {
  if (!merchantId) return [];
  const response = await api.get(endpoints.merchantStores(encodeURIComponent(merchantId)));
  const findList = (value) => {
    if (Array.isArray(value)) return value;
    for (const key of ["stores", "items", "results", "data"]) {
      const nested = value?.[key];
      if (Array.isArray(nested)) return nested;
      if (nested && typeof nested === "object") {
        const found = findList(nested);
        if (found.length) return found;
      }
    }
    return [];
  };
  return findList(response).map((store) => ({
    value: String(store.storeId || store.id || store._id || ""),
    label: store.name || store.storeName || store.storeId || store.id || "",
  })).filter((store) => store.value && store.label);
}

export function createStore(store, merchantId) {
  const path = merchantId
    ? endpoints.merchantStores(merchantId)
    : endpoints.stores;
  return api.post(path, toStorePayload(store, merchantId));
}

export function createStores(stores, merchantId) {
  const owner = merchantId || stores[0]?.merchant;
  if (
    !owner ||
    stores.some((store) => (merchantId || store.merchant) !== owner)
  ) {
    throw new Error("Choose the same merchant for all stores in a batch.");
  }
  return api.post(endpoints.merchantStores(owner) + "/bulk", {
    stores: stores.map((store) => toStorePayload(store, owner)),
  });
}

export async function getStore(id) {
  const { store } = await api.get(endpoints.store(encodeURIComponent(id)));
  return {
    merchant: store.merchantId,
    storeID: store.id,
    storeName: store.storeName,
    storeType: store.storeType,
    phone: store.phone || "",
    url: store.baseUrl || "",
    currency: store.currency,
    status: store.status,
    timezone: store.timezone,
    address: store.address?.street || "",
    city: store.address?.city || "",
    state: store.address?.state || "",
    zip: store.address?.zipCode || "",
    devices: store.devices || store.registeredDevices || [],
    features: store.features || store.enabledFeatures || [],
    roles: store.roles || store.merchantRoles || [],
  };
}
export function updateStore(id, store) {
  return api.put(
    endpoints.store(encodeURIComponent(id)),
    toStorePayload(store),
  );
}
