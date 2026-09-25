import { api } from "./http";
import { endpoints } from "./endpoints";

const path = (storeId) => endpoints.storeSafeDrop(storeId);

const record = (response) => response?.safeDrop || response?.data || response;

export function getPosSafeDrop(storeId) {
  return api.get(path(storeId)).then(record);
}

export function createPosSafeDrop(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosSafeDrop(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
