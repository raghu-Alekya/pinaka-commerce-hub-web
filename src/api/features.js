import { api } from "./http";

const path = (id) => `/features/${encodeURIComponent(id)}`;

const normalize = (item) => ({
  ...item,

  // Backend featureKey -> UI code
  code: item.featureKey || item.code || "",

  description: item.description || "",
  category: item.category || "",
  type: item.featureType || "TEXT",

  status: item.status === "ACTIVE" ? "Active" : "Inactive",

  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,

  icon: "bi-diamond",
  tone: "purple",
});

const payload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim(),
  category: form.category.trim(),

  // Existing Features form doesn't always provide type.
  featureType: (form.type || "TEXT").trim(),

  status: form.status.toUpperCase(),
});

export const getFeature = async (id) => {
  const response = await api.get(path(id));
  return normalize(response.feature);
};

export const listFeatures = async () => {
  const response = await api.get("/features");
  return response.features.map(normalize);
};

export const createFeature = async (form) => {
  const response = await api.post("/features", {
    ...payload(form),

    // UI Feature Code -> Backend featureKey
    featureKey: form.code.trim().toUpperCase(),
  });

  return normalize(response.feature);
};

export const updateFeature = async (id, form) => {
  const response = await api.put(path(id), {
    ...payload(form),

    // Keep Feature Code mapped correctly during update too
    featureKey: form.code.trim().toUpperCase(),
  });

  return normalize(response.feature);
};

export const setFeatureStatus = async (id, status) => {
  const response = await api.put(path(id), { status });
  return normalize(response.feature);
};

export const deleteFeature = (id) => {
  return api.delete(path(id));
};

export async function getAllCategories() {
  const response = await api.get("/features/categories");

  if (
    !response?.success ||
    !Array.isArray(response.categories) ||
    response.categories.some(
      (category) => typeof category !== "string"
    )
  ) {
    throw new Error("Invalid categories response");
  }

  return response.categories;
}