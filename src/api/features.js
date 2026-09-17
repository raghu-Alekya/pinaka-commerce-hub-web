import { api } from "./http";
import { endpoints } from "./endpoints";

// Map React form fields to API payload
const toFeaturePayload = (form) => ({
  featureKey: form.name?.trim() || "",         // Form "Name" maps to API "featureKey"
  name: form.description?.trim() || form.name?.trim() || "", // Display Name
  category: form.category || "",
  featureType: form.type?.trim() || "BOOLEAN", // API expects featureType
  description: form.description?.trim() || "",
  status: (form.status || "ACTIVE").toUpperCase(),
});

// Normalize API response item into React state format
const normalizeFeature = (item) => {
  if (!item) return null;
  return {
    ...item,
    id: item.id || item._id || "",
    name: item.featureKey || item.name || "",
    description: item.description || item.name || "",
    category: item.category || "Uncategorized",
    type: item.featureType || item.type || "BOOLEAN",
    status:
      String(item.status || "").toUpperCase() === "ACTIVE"
        ? "Active"
        : "Inactive",
    createdAt: item.createdAt
      ? new Date(item.createdAt).toLocaleString()
      : "—",
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toLocaleString()
      : "—",
    icon: item.icon || "bi-diamond",
    tone: item.tone || "purple",
  };
};

export async function listFeatures() {
  try {
    const response = await api.get(endpoints.features);
    
    let rawList = [];
    if (Array.isArray(response)) {
      rawList = response;
    } else if (response && Array.isArray(response.features)) {
      rawList = response.features;
    } else if (response && Array.isArray(response.data)) {
      rawList = response.data;
    } else if (response && response.data && Array.isArray(response.data.features)) {
      rawList = response.data.features;
    }

    return rawList
      .map(normalizeFeature)
      .filter((feature) => feature && feature.id);
  } catch (err) {
    console.error("listFeatures API Error:", err);
    throw err;
  }
}

export async function getFeature(id) {
  const response = await api.get(endpoints.feature(encodeURIComponent(id)));
  return normalizeFeature(response?.feature || response?.data || response);
}

export async function createFeature(form) {
  const response = await api.post(endpoints.features, toFeaturePayload(form));
  return normalizeFeature(response?.feature || response?.data || response);
}

export async function updateFeature(id, form) {
  const response = await api.put(
    endpoints.feature(encodeURIComponent(id)),
    toFeaturePayload(form)
  );
  return normalizeFeature(response?.feature || response?.data || response);
}

export async function deleteFeature(id) {
  return api.delete(endpoints.feature(encodeURIComponent(id)));
}