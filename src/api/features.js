import { api } from "./http";

const path = (id) => `/features/${encodeURIComponent(id)}`;
const normalize = (item) => ({ ...item, description: item.description || "", category: item.category || "",
  type: item.featureType || "TEXT", status: item.status === "ACTIVE" ? "Active" : "Inactive",
  createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "—", icon: "bi-diamond", tone: "purple" });
const payload = (form) => ({ name: form.name.trim(), description: form.description.trim(), category: form.category.trim(), featureType: form.type.trim(), status: form.status.toUpperCase() });
export const listFeatures = async () => (await api.get("/features")).features.map(normalize);
export const createFeature = async (form) => normalize((await api.post("/features", { ...payload(form), featureKey: form.featureKey.trim() })).feature);
export const updateFeature = async (id, form) => normalize((await api.put(path(id), payload(form))).feature);
export const setFeatureStatus = async (id, status) => normalize((await api.put(path(id), { status })).feature);
export const deleteFeature = (id) => api.delete(path(id));

export async function getAllCategories() {
  const response = await api.get("/features/categories");
  if (!response?.success || !Array.isArray(response.categories) ||
      response.categories.some((category) => typeof category !== "string")) {
    throw new Error("Invalid categories response");
  }
  return response.categories;
}
