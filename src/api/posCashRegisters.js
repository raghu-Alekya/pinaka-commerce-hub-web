import { api } from "./http";
import { endpoints } from "./endpoints";

const path = (storeId) => endpoints.storeCashRegisters(storeId);

const record = (response) => response?.cashRegister || response?.data || response;

export function getPosCashRegisters(storeId) {
  return api.get(path(storeId)).then(record);
}

export function createPosCashRegisters(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosCashRegisters(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
