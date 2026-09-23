import { api } from "./http";

export function normalizeStoreType(item) {
  return { ...item, code: item.storeTypeCode, description: item.description || "",
    status: item.status === "ACTIVE" ? "Active" : "Inactive",
    createdOn: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
    icon: "bi-shop", tone: "blue" };
}
const path = (id) => `/store-types/${encodeURIComponent(id)}`;
const payload = (form) => ({ storeTypeCode: form.code.trim().toUpperCase(), name: form.name.trim(), description: form.description.trim(), status: form.status.toUpperCase() });
export const listStoreTypes = async () => (await api.get("/store-types")).storeTypes.map(normalizeStoreType);
export const getStoreType = async (id) => normalizeStoreType((await api.get(path(id))).storeType);
export const createStoreType = async (form) => normalizeStoreType((await api.post("/store-types", payload(form))).storeType);
export const updateStoreType = async (id, form) => normalizeStoreType((await api.put(path(id), payload(form))).storeType);
export const deleteStoreType = (id) => api.delete(path(id));
