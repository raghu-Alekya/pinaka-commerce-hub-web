import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";

const path = (storeId) => endpoints.storeCurrencyTax(storeId);

const record = (response) => response?.currencyTax || response?.data || response;

export function getPosCurrencyTax(storeId) {
  return api.get(path(storeId)).then(record);
}

export function createPosCurrencyTax(storeId, payload) {
  return api.post(path(storeId), payload).then(record);
}

export function updatePosCurrencyTax(storeId, payload) {
  return api.put(path(storeId), payload).then(record);
}
