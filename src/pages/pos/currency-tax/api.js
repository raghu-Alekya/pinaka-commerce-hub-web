import { api } from "../../../api/http";
import { loadStorePosConfiguration, saveStorePosConfiguration } from "../storePosConfiguration";

const NAME = "currency_taxes";

export function getPosCurrencyTax(storeId) {
  return loadStorePosConfiguration(storeId, NAME);
}

export async function getStoreTaxClasses(storeId) {
  const response = await api.get(`/stores/${encodeURIComponent(storeId)}/tax-classes`);
  const candidates = [response?.taxClasses, response?.tax_classes, response?.data?.taxClasses,
    response?.data?.tax_classes, response?.data?.data?.taxClasses, response?.data?.data?.tax_classes,
    response?.items, response?.data?.items, response?.result?.taxClasses, response?.result?.tax_classes,
    response?.result, response?.data?.data, response?.data, response];
  const rows = candidates.find(Array.isArray);
  if (!rows) throw new Error("Tax classes were not returned by the store.");
  return rows.map((row) => ({
    ...row,
    id: row.id || row.taxClassId || row.tax_class_id,
    slug: row.slug || row.taxClassSlug || row.tax_class_slug,
    name: row.name || row.taxClassName || row.tax_class_name || "",
    rate: row.rate ?? row.taxRate ?? row.tax_rate ?? "",
  }));
}

export function createPosCurrencyTax(storeId, payload) {
  return saveStorePosConfiguration(storeId, NAME, payload);
}

export function updatePosCurrencyTax(storeId, payload) {
  return saveStorePosConfiguration(storeId, NAME, payload);
}

const taxClassPath = (storeId, slug) => `/stores/${encodeURIComponent(storeId)}/tax-classes${slug === undefined ? "" : `/${encodeURIComponent(slug)}`}`;
export function createStoreTaxClass(storeId, payload) {
  return api.post(taxClassPath(storeId), payload);
}
export function updateStoreTaxClass(storeId, slug, payload) {
  return api.put(taxClassPath(storeId, slug), payload);
}
export function deleteStoreTaxClass(storeId, slug) {
  return api.delete(taxClassPath(storeId, slug));
}

export function updateStoreTaxSettings(storeId, taxEnabled) {
  return api.put(`/stores/${encodeURIComponent(storeId)}/tax-classes/settings`, { taxEnabled });
}
