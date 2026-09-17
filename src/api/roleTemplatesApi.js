import { api } from "./http";

const unwrap = (response) => response?.data ?? response;

export const roleTemplatesApi = {
  getAll: () => api.get("/role-templates"),

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
  const data = unwrap(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.roleTemplates)) return data.roleTemplates;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.roleTemplates)) return data.data.roleTemplates;
  if (Array.isArray(response?.roleTemplates)) return response.roleTemplates;

  throw new Error(
    "Unexpected role templates response. Expected an array or roleTemplates array."
  );
}