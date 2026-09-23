import { api } from "./http";

export function normalizeStoreType(item) {
  if (!item) return item;
  return {
    ...item,
    id: item.id,
    code: item.storeTypeCode || item.code || "",
    storeTypeCode: item.storeTypeCode || item.code || "",
    name: item.name || "",
    description: item.description || "",
    status: (item.status || "ACTIVE").toUpperCase() === "ACTIVE" ? "Active" : "Inactive",
    createdOn: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
    createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
    createdTime: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
    updatedDate: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "—",
    updatedTime: item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
    icon: "bi-shop",
    tone: "blue",
  };
}

const path = (id) => `/store-types/${encodeURIComponent(id)}`;

const payload = (form) => ({
  storeTypeCode: (form.storeTypeCode || form.code || "").trim().toUpperCase(),
  name: (form.name || "").trim(),
  description: (form.description || "").trim(),
  status: (form.status || "Active").toUpperCase(),
});

export const listStoreTypes = async () => {
  const res = await api.get("/store-types");
  const items = res?.storeTypes || res?.data?.storeTypes || (Array.isArray(res) ? res : []);
  return items.map(normalizeStoreType);
};

export const getStoreType = async (id) => {
  const res = await api.get(path(id));
  return normalizeStoreType(res?.storeType || res?.data?.storeType || res);
};

export const createStoreType = async (form) => {
  const res = await api.post("/store-types", payload(form));
  return normalizeStoreType(res?.storeType || res?.data?.storeType || res);
};

export const updateStoreType = async (id, form) => {
  const res = await api.put(path(id), payload(form));
  return normalizeStoreType(res?.storeType || res?.data?.storeType || res);
};

export const deleteStoreType = (id) => api.delete(path(id));

export const storeTypesApi = {
  getAll: async () => {
    const res = await api.get("/store-types");
    const storeTypes = (res?.storeTypes || res?.data?.storeTypes || (Array.isArray(res) ? res : [])).map(normalizeStoreType);
    return { success: true, storeTypes, data: storeTypes };
  },
  getById: async (id) => {
    const res = await api.get(path(id));
    const storeType = normalizeStoreType(res?.storeType || res?.data?.storeType || res);
    return { success: true, storeType, data: storeType };
  },
  create: async (form) => {
    const res = await api.post("/store-types", payload(form));
    const storeType = normalizeStoreType(res?.storeType || res?.data?.storeType || res);
    return { success: true, storeType, data: storeType };
  },
  update: async (id, form) => {
    const res = await api.put(path(id), payload(form));
    const storeType = normalizeStoreType(res?.storeType || res?.data?.storeType || res);
    return { success: true, storeType, data: storeType };
  },
  delete: async (id) => {
    return api.delete(path(id));
  },
  getFeatures: async (storeTypeId) => {
    return api.get(`/store-types/${encodeURIComponent(storeTypeId)}/features`);
  },
  addFeature: async (storeTypeId, featureId) => {
    return api.post(`/store-types/${encodeURIComponent(storeTypeId)}/features`, { featureId });
  },
  removeFeature: async (storeTypeId, featureId) => {
    return api.delete(`/store-types/${encodeURIComponent(storeTypeId)}/features/${encodeURIComponent(featureId)}`);
  },
  getRoleTemplates: async (storeTypeId) => {
    return api.get(`/store-types/${encodeURIComponent(storeTypeId)}/role-templates`);
  },
  addRoleTemplate: async (storeTypeId, roleTemplateId) => {
    return api.post(`/store-types/${encodeURIComponent(storeTypeId)}/role-templates`, { roleTemplateId });
  },
  removeRoleTemplate: async (storeTypeId, roleTemplateId) => {
    return api.delete(`/store-types/${encodeURIComponent(storeTypeId)}/role-templates/${encodeURIComponent(roleTemplateId)}`);
  },
};
