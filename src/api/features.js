import { api } from "./http";

const path = (id) => `/features/${encodeURIComponent(id)}`;

const normalize = (item = {}) => ({
  ...item,

  // Backend feature_code / featureKey -> UI code
  code: item.feature_code || item.featureKey || item.code || item.name?.toUpperCase().replace(/\s+/g, '_') || '',
  feature_code: item.feature_code || item.featureKey || item.code || item.name?.toUpperCase().replace(/\s+/g, '_') || '',

  name: item.name || item.title || '',
  description: item.description || '',
  category: item.feature_category || item.category || item.featureCategory || '',
  feature_category: item.feature_category || item.category || item.featureCategory || '',
  type: item.feature_type || item.featureType || item.type || 'BOOLEAN',
  featureType: item.feature_type || item.featureType || item.type || 'BOOLEAN',
  feature_type: item.feature_type || item.featureType || item.type || 'BOOLEAN',

  status: String(item.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive',

  createdAt: item.createdAt || item.created_at || item.createdDate || null,
  updatedAt: item.updatedAt || item.updated_at || item.updatedDate || null,
  created_at: item.createdAt || item.created_at || null,
  updated_at: item.updatedAt || item.updated_at || null,

  icon: 'bi-diamond',
  tone: 'purple',
});

const payload = (form) => ({
  name: (form.name || "").trim(),
  description: (form.description || "").trim(),
  category: (form.category || form.feature_category || "").trim(),
  feature_category: (form.category || form.feature_category || "").trim(),

  // Existing Features form doesn't always provide type.
  featureType: ["BOOLEAN", "LIMIT", "CONFIG"].includes(String(form.type || form.featureType || "").toUpperCase()) ? String(form.type || form.featureType).toUpperCase() : "BOOLEAN",

  status: String(form.status || "ACTIVE").toUpperCase(),
});

export const getFeature = async (id) => {
  const response = await api.get(path(id));
  const feat = response?.feature || response?.data || response;
  return normalize(feat);
};

export const listFeatures = async () => {
  const response = await api.get("/features");
  const rawList = Array.isArray(response)
    ? response
    : Array.isArray(response?.features)
    ? response.features
    : Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.items)
    ? response.items
    : [];
  return rawList.map(normalize);
};

export const createFeature = async (form) => {
  const body = {
    ...payload(form),
    feature_code: (form.code || form.feature_code || form.name || "").trim().toUpperCase().replace(/\s+/g, '_'),
    featureKey: (form.code || form.feature_code || form.name || "").trim().toUpperCase().replace(/\s+/g, '_'),
  };
  const response = await api.post("/features", body);
  const feat = response?.feature || response?.data || response;
  return normalize(feat);
};

export const updateFeature = async (id, form) => {
  const body = {
    ...payload(form),
    feature_code: (form.code || form.feature_code || form.name || "").trim().toUpperCase().replace(/\s+/g, '_'),
    featureKey: (form.code || form.feature_code || form.name || "").trim().toUpperCase().replace(/\s+/g, '_'),
  };
  const response = await api.put(path(id), body);
  const feat = response?.feature || response?.data || response;
  return normalize(feat);
};

export const setFeatureStatus = async (id, status) => {
  const response = await api.put(path(id) + "/status", { status: String(status).toUpperCase() });
  const feat = response?.feature || response?.data || response;
  return normalize(feat);
};

export const deleteFeature = (id) => {
  return api.delete(path(id));
};

export async function getAllCategories() {
  try {
    const response = await api.get("/features/categories");
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.categories)) return response.categories;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  } catch {
    return [];
  }
}
