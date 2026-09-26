import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";

const path = (storeId) => endpoints.storeOpeningBalance(storeId);

const record = (response) => response?.openingBalance || response?.data || response;

export function getPosOpeningBalance(storeId) {
  return api.get(path(storeId)).then(record);
}

export function createPosOpeningBalance(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosOpeningBalance(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
