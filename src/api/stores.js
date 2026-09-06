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
  };
}

export function listStores() {
  return api.get(endpoints.stores);
}

export function createStore(store, merchantId) {
  const path = merchantId
    ? endpoints.merchantStores(merchantId)
    : endpoints.stores;
  return api.post(path, toStorePayload(store, merchantId));
}

export function createStores(stores, merchantId) {
  return Promise.all(stores.map((store) => createStore(store, merchantId)));
}
