import { api } from "./http";
import { endpoints } from "./endpoints";

const path = (storeId) => endpoints.storeServiceCharges(storeId);

const record = (response) => response?.serviceCharge || response?.data || response;

export function getPosServiceCharges(storeId) {
  return api.get(path(storeId)).then(record);
}

export function createPosServiceCharges(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosServiceCharges(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
