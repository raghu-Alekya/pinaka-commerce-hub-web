import { api } from "./http";

const base = (merchantId) => `/api/v1/merchants/${encodeURIComponent(merchantId)}/access`;

export function listAccessModules(merchantId) {
  return api.get(`${base(merchantId)}/modules`);
}

export function listAccessEmployees(merchantId) {
  return api.get(`${base(merchantId)}/employees`);
}

export function listMerchantRoles(merchantId) {
  return api.get(`/api/v1/merchants/${encodeURIComponent(merchantId)}/roles`);
}

export function createMerchantRole(merchantId, body) {
  return api.post(`/api/v1/merchants/${encodeURIComponent(merchantId)}/roles`, body);
}

export function updateMerchantRole(merchantId, roleId, body) {
  return api.put(`/api/v1/merchants/${encodeURIComponent(merchantId)}/roles/${encodeURIComponent(roleId)}`, body);
}

export function deleteMerchantRole(merchantId, roleId) {
  return api.delete(`/api/v1/merchants/${encodeURIComponent(merchantId)}/roles/${encodeURIComponent(roleId)}`);
}

export function getRoleGrants(merchantId, roleId) {
  return api.get(`${base(merchantId)}/roles/${encodeURIComponent(roleId)}/grants`);
}

export function saveRoleGrants(merchantId, roleId, grants) {
  return api.put(`${base(merchantId)}/roles/${encodeURIComponent(roleId)}/grants`, { grants });
}

export function assignEmployeeRole(merchantId, employeeId, roleId, storeId) {
  return api.put(`${base(merchantId)}/employees/${encodeURIComponent(employeeId)}/role`, {
    roleId,
    storeId: storeId || undefined,
  });
}
