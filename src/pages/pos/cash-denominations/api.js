import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";

const path = (storeId) => endpoints.storeCashDenominations(storeId);

const record = (response) => response?.cashDenominations || response?.data || response;

export function getPosCashDenominations(storeId) {
  return api.get(path(storeId)).then(record);
}

export function createPosCashDenominations(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosCashDenominations(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
