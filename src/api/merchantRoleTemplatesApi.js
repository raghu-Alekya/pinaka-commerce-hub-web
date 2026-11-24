import { api, pendingStoreRead } from "./http";

const readMerchantRoles = path => pendingStoreRead(`merchant-role-read:${path}`, () => api.get(path));

const unwrapList = (response, keys = ["roleTemplates", "role_templates", "items", "results"]) => {
  const candidates = [response, response?.data, response?.result, response?.data?.data];
  for (const data of candidates) {
    if (!data) continue;
    if (Array.isArray(data)) return data;
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
};

export const merchantRoleTemplatesApi = {
  /** Templates from subscription store type + selected flags. */
  getAvailable: (merchantId) =>
    readMerchantRoles(`/merchants/${encodeURIComponent(merchantId)}/role-templates/available`),

  list: (merchantId, status = "ACTIVE") =>
    readMerchantRoles(
      `/merchants/${encodeURIComponent(merchantId)}/role-templates${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),

  /** Replace checkbox selections. Body: { roleTemplateIds: string[] } */
  save: (merchantId, roleTemplateIds) =>
    api.put(`/merchants/${encodeURIComponent(merchantId)}/role-templates`, {
      roleTemplateIds: Array.isArray(roleTemplateIds) ? roleTemplateIds : [],
    }),

  getStoreTypes: (merchantId) =>
    readMerchantRoles(`/merchants/${encodeURIComponent(merchantId)}/store-types`),
};

export function readAvailableRoleTemplates(response) {
  const root = response?.data ?? response ?? {};
  const roleTemplates = unwrapList(root).map((item, index) => {
    const template = item.roleTemplate || item.role_template || item.template || item;
    const id = String(
      item.roleTemplateId || item.role_template_id ||
      item.sourceRoleTemplateId || item.source_role_template_id ||
      template.id || template._id || item.id || `role-template-${index}`,
    );
    return {
      id,
      roleCode: String(template.roleCode || template.role_code || template.code || item.roleCode || item.role_code || "").trim(),
      name: String(template.name || template.roleName || template.role_name || template.templateName || template.template_name || "Unnamed role").trim(),
      description: String(template.description || item.description || "").trim(),
      scopeType: String(template.scopeType || template.scope_type || item.scopeType || item.scope_type || "STORE"),
      status: String(template.status || item.status || "ACTIVE"),
      required: Boolean(item.required ?? template.required),
      defaultEnabled: Boolean(item.defaultEnabled ?? item.default_enabled ?? template.defaultEnabled ?? template.default_enabled),
      selected: Boolean(item.selected ?? item.isSelected ?? item.is_selected ?? item.is_selected_on_merchant),
      storeTypeId: item.storeTypeId || item.store_type_id || null,
      storeTypeName: item.storeTypeName || item.store_type_name || null,
    };
  });

  const storeTypes = Array.isArray(root.storeTypes)
    ? root.storeTypes
    : Array.isArray(root.store_types)
      ? root.store_types
      : Array.isArray(root.data?.storeTypes)
      ? root.data.storeTypes
      : Array.isArray(root.data?.store_types)
        ? root.data.store_types
        : [];

  return {
    storeTypes,
    roleTemplates,
    count: Number(root.count ?? roleTemplates.length) || roleTemplates.length,
  };
}
