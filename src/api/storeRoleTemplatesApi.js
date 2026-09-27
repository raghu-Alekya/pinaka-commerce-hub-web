import { api } from "./http";

export const storeRoleTemplatesApi = {
  list: (merchantId, storeId) =>
    api.get(
      `/merchants/${encodeURIComponent(merchantId)}/stores/${encodeURIComponent(storeId)}/role-templates`,
    ),

  save: (merchantId, storeId, roleTemplateIds) =>
    api.put(
      `/merchants/${encodeURIComponent(merchantId)}/stores/${encodeURIComponent(storeId)}/role-templates`,
      { roleTemplateIds: Array.isArray(roleTemplateIds) ? roleTemplateIds : [] },
    ),
};

export function readStoreRoleTemplates(response) {
  const root = response?.data ?? response ?? {};
  const rows = Array.isArray(root.roleTemplates)
    ? root.roleTemplates
    : Array.isArray(root.items)
      ? root.items
      : Array.isArray(root)
        ? root
        : [];
  return rows.map((row, index) => ({
    id: String(row.roleTemplateId || row.sourceRoleTemplateId || row.id || `store-role-${index}`),
    roleTemplateId: String(row.roleTemplateId || row.sourceRoleTemplateId || row.id || ""),
    name: String(row.name || row.roleName || "").trim(),
    roleCode: String(row.roleCode || "").trim(),
    description: String(row.description || "").trim(),
    scopeType: String(row.scopeType || "STORE"),
    enabled: row.enabled !== false,
    status: String(row.status || "ACTIVE"),
  }));
}
