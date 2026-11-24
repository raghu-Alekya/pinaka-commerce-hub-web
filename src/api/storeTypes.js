import { api, pendingStoreRead } from "./http";

const readStoreType = path => pendingStoreRead(`store-type-read:${path}`, () => api.get(path));

export function normalizeStoreType(item) {
  if (!item) return item;
  const createdAt = item.createdAt || item.created_at || null;
  const updatedAt = item.updatedAt || item.updated_at || null;
  const storeTypeCode = item.storeTypeCode || item.store_type_code || item.code || "";
  const storeTypeId = item.id || item.storeTypeId || item.store_type_id || item._id || "";
  return {
    ...item,
    id: storeTypeId,
    code: storeTypeCode,
    storeTypeCode,
    name: item.name || item.storeTypeName || item.store_type_name || "",
    description: item.description || item.storeTypeDescription || item.store_type_description || "",
    status:
      (item.status || "ACTIVE").toUpperCase() === "ACTIVE"
        ? "Active"
        : "Inactive",
    createdAt,
    updatedAt,
    createdOn: createdAt
      ? new Date(createdAt).toLocaleDateString()
      : "—",
    createdDate: createdAt
      ? new Date(createdAt).toLocaleDateString()
      : "—",
    createdTime: createdAt
      ? new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    updatedDate: updatedAt
      ? new Date(updatedAt).toLocaleDateString()
      : "—",
    updatedTime: updatedAt
      ? new Date(updatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    icon: "bi-shop",
    tone: "blue",
  };
}

const path = (id) => `/store-types/${encodeURIComponent(id)}`;

const payload = (form) => ({
  name: (form.name || "").trim(),
  description: (form.description || "").trim(),
  status: (form.status || "Active").toUpperCase(),
});

const unwrapStoreType = (response) =>
  response?.storeType ?? response?.store_type ??
  response?.data?.storeType ?? response?.data?.store_type ??
  response?.data ?? response;

const unwrapStoreTypes = (response) => {
  const candidates = [
    response?.storeTypes, response?.store_types, response?.items,
    response?.data?.storeTypes, response?.data?.store_types,
    response?.data?.items, response?.data?.data, response?.data,
  ];
  return candidates.find(Array.isArray) || (Array.isArray(response) ? response : []);
};

export const listStoreTypes = async () => {
  const res = await readStoreType("/store-types");
  const items = unwrapStoreTypes(res);
  return items.map(normalizeStoreType);
};

export const getStoreType = async (id) => {
  const res = await readStoreType(path(id));
  return normalizeStoreType(unwrapStoreType(res));
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
    const res = await readStoreType("/store-types");
    const storeTypes = unwrapStoreTypes(res).map(normalizeStoreType);
    return {
      success: true,
      storeTypes,
      nextStoreTypeCode: res?.nextStoreTypeCode || res?.next_store_type_code || res?.data?.nextStoreTypeCode || res?.data?.next_store_type_code || "",
      data: storeTypes,
    };
  },
  getForMerchant: async (merchantId) => {
    const res = await readStoreType(
      `/merchants/${encodeURIComponent(merchantId)}/store-types`,
    );
    const source =
      res?.storeTypes ??
      res?.data?.storeTypes ??
      res?.data?.items ??
      res?.items ??
      res?.data ??
      res;
    const storeTypes = (Array.isArray(source) ? source : [])
      .map(normalizeStoreType)
      .filter(Boolean);
    return { success: true, storeTypes, data: storeTypes };
  },
  getById: async (id) => {
    const res = await readStoreType(path(id));
    const storeType = normalizeStoreType(unwrapStoreType(res));
    return { success: true, storeType, data: storeType };
  },
  create: async (form) => {
    const res = await api.post("/store-types", payload(form));
    const storeType = normalizeStoreType(unwrapStoreType(res));
    return { success: true, storeType, data: storeType };
  },
  update: async (id, form) => {
    const res = await api.put(path(id), payload(form));
    const storeType = normalizeStoreType(unwrapStoreType(res));
    return { success: true, storeType, data: storeType };
  },
  delete: async (id) => {
    return api.delete(path(id));
  },
  getFeatures: async (storeTypeId) => {
    return readStoreType(`/store-types/${encodeURIComponent(storeTypeId)}/features`);
  },
  getAvailableFeatures: async (storeTypeId, unmappedOnly = false) => {
    const query = unmappedOnly ? "?unmappedOnly=true" : "";
    return readStoreType(
      `/store-types/${encodeURIComponent(storeTypeId)}/features/by-category${query}`,
    );
  },
  getMerchantFeatures: async (merchantId, storeTypeId) => {
    return readStoreType(
      `/merchants/${encodeURIComponent(merchantId)}/store-types/${encodeURIComponent(storeTypeId)}/features`,
    );
  },
  addFeature: async (storeTypeId, featureId) => {
    return api.post(
      `/store-types/${encodeURIComponent(storeTypeId)}/features`,
      { featureId },
    );
  },
  addFeaturesBulk: async (storeTypeId, featureIds) => {
    return api.post(
      `/store-types/${encodeURIComponent(storeTypeId)}/features/bulk`,
      { items: featureIds.map((featureId) => ({ feature_id: featureId })) },
    );
  },
  removeFeature: async (storeTypeId, featureId) => {
    return api.delete(
      `/store-types/${encodeURIComponent(storeTypeId)}/features/${encodeURIComponent(featureId)}`,
    );
  },
  getRoleTemplates: async (storeTypeId) => {
    return readStoreType(
      `/store-types/${encodeURIComponent(storeTypeId)}/role-templates`,
    );
  },
  getAvailableRoleTemplates: async (storeTypeId, unmappedOnly = false) => {
    const query = unmappedOnly ? "?unmappedOnly=true" : "";
    return readStoreType(
      `/store-types/${encodeURIComponent(storeTypeId)}/role-templates/available${query}`,
    );
  },
  addRoleTemplate: async (storeTypeId, roleTemplateId) => {
    return api.post(
      `/store-types/${encodeURIComponent(storeTypeId)}/role-templates`,
      { roleTemplateId },
    );
  },
  addRoleTemplatesBulk: async (storeTypeId, roleTemplateIds) => {
    return api.post(
      `/store-types/${encodeURIComponent(storeTypeId)}/role-templates/bulk`,
      { roleTemplateIds },
    );
  },
  removeRoleTemplate: async (storeTypeId, roleTemplateId) => {
    return api.delete(
      `/store-types/${encodeURIComponent(storeTypeId)}/role-templates/${encodeURIComponent(roleTemplateId)}`,
    );
  },
};
