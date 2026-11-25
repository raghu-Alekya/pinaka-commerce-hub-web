import { api, pendingStoreRead } from "./http";

const readRoleTemplate = path => pendingStoreRead(`role-template-read:${path}`, () => api.get(path));

const unwrap = (response) => response?.data ?? response;

export const roleTemplatesApi = {
  getAll: () => readRoleTemplate("/role-templates"),

  assignToStoreType: (storeTypeId, values) => {
    const { roleTemplateId, ...rest } = values || {};
    return api.post(
      `/store-types/${encodeURIComponent(storeTypeId)}/role-templates`,
      {
        ...rest,
        ...(roleTemplateId !== undefined
          ? { role_template_id: roleTemplateId }
          : {}),
      },
    );
  },

  getForStoreType: (storeTypeId) =>
    readRoleTemplate(`/store-types/${encodeURIComponent(storeTypeId)}/role-templates`),

  removeFromStoreType: (storeTypeId, roleTemplateId) =>
    api.delete(
      `/store-types/${encodeURIComponent(storeTypeId)}/role-templates/${encodeURIComponent(roleTemplateId)}`,
    ),

  getById: (id) => readRoleTemplate(`/role-templates/${encodeURIComponent(id)}`),

  getAvailableStoreTypes: (id) =>
    readRoleTemplate(`/role-templates/${encodeURIComponent(id)}/store-types/available`),

  getFeatures: (id, storeTypeIds = []) => {
    const ids = Array.isArray(storeTypeIds)
      ? storeTypeIds.filter(Boolean).join(",")
      : String(storeTypeIds ?? "");

    const query = ids ? `?store_type_ids=${encodeURIComponent(ids)}` : "";

    return readRoleTemplate(
      `/role-templates/${encodeURIComponent(id)}/features${query}`,
    );
  },

  bulkUpdateStoreTypes: (id, storeTypeIds) =>
    api.put(`/role-templates/${encodeURIComponent(id)}/store-types/bulk`, {
      storeTypeIds,
      replace: true,
    }),

  updateFeatureAccess: (id, featureAccess) =>
    api.put(
      `/role-templates/${encodeURIComponent(id)}/features`,
      featureAccess,
    ),

  removeFeaturePermissions: (id, featureIds) =>
    api.put(`/role-templates/${encodeURIComponent(id)}/permissions/bulk`, {
      removeFeatureIds: featureIds.filter(Boolean),
    }),

  addFeaturePermissions: (id, featureIds, permissionIds) =>
    api.put(`/role-templates/${encodeURIComponent(id)}/permissions/bulk`, {
      featureIds: featureIds.filter(Boolean),
      permissionIds: permissionIds.filter(Boolean),
    }),

  create: (values) => api.post("/role-templates", values),

  update: (id, values) =>
    api.put(`/role-templates/${encodeURIComponent(id)}`, values),

  patch: (id, values) =>
    api.patch(`/role-templates/${encodeURIComponent(id)}`, values),

  remove: (id) => api.delete(`/role-templates/${encodeURIComponent(id)}`),
};

export function readRoleTemplatesList(response) {
  const collectionKeys = [
    "roleTemplates",
    "role_templates",
    "items",
    "results",
    "records",
  ];
  const envelopeKeys = ["data", "result", "payload"];
  const queue = [response];
  const visited = new Set();

  while (queue.length) {
    const value = queue.shift();
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);

    for (const key of collectionKeys) {
      if (Array.isArray(value[key])) return value[key];
    }
    for (const key of [...collectionKeys, ...envelopeKeys]) {
      if (value[key] && typeof value[key] === "object") queue.push(value[key]);
    }
  }

  throw new Error(
    "Unexpected role templates response. Expected an array or role_templates array.",
  );
}
