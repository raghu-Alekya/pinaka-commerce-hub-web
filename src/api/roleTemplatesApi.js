import { api } from "./http";

const unwrap = (response) => response?.data ?? response;

export const roleTemplatesApi = {
  getAll: () => api.get("/role-templates"),

  assignToStoreType: (storeTypeId, values) =>
    api.post(
      `//store-types/${encodeURIComponent(storeTypeId)}/role-templates`,
      values
    ),

  getForStoreType: (storeTypeId) =>
    api.get(`//store-types/${encodeURIComponent(storeTypeId)}/role-templates`),

  removeFromStoreType: (storeTypeId, roleTemplateId) =>
    api.delete(
      `//store-types/${encodeURIComponent(storeTypeId)}/role-templates/${encodeURIComponent(roleTemplateId)}`
    ),

  getById: (id) =>
    api.get(`/role-templates/${encodeURIComponent(id)}`),

  create: (values) =>
    api.post("/role-templates", values),

  update: (id, values) =>
    api.put(`/role-templates/${encodeURIComponent(id)}`, values),

  patch: (id, values) =>
    api.patch(`/role-templates/${encodeURIComponent(id)}`, values),

  remove: (id) =>
    api.delete(`/role-templates/${encodeURIComponent(id)}`),
};

export function readRoleTemplatesList(response) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.data?.data,
    response?.data?.result,
  ];

  for (const data of candidates) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.roleTemplates)) return data.roleTemplates;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
  }

  throw new Error(
    "Unexpected role templates response. Expected an array or roleTemplates array."
  );
}
