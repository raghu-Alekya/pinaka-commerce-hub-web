import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";

const path = (storeId) => endpoints.storeCardPayments(storeId);

const record = (response) => response?.cardPayment || response?.data || response;
const list = (response) => response?.cardPayments || response?.data || [];

export function getPosCardPayments(storeId) {
  return api.get(path(storeId)).then(list);
}

export function createPosCardPayments(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosCardPayments(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
