import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";

const path = (storeId) => endpoints.storeCashback(storeId);

const record = (response) => response?.cashback || response?.data || response;

export function getPosCashback(storeId) {
  return api.get(path(storeId)).then(record);
}

export function createPosCashback(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosCashback(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
