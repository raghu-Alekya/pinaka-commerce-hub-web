import { api } from './http';

const unwrap = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.permissions)) return response.permissions;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.result)) return response.result;
  return [];
};

export const listFeaturePermissions = (featureId, params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return api
    .get(`/features/${encodeURIComponent(featureId)}/permissions${suffix}`)
    .then(unwrap);
};

export const createFeaturePermission = (featureId, payload) =>
  api.post(`/features/${encodeURIComponent(featureId)}/permissions`, payload);

export const updateFeaturePermission = (featureId, permissionId, payload) =>
  api.put(`/features/${encodeURIComponent(featureId)}/permissions/${encodeURIComponent(permissionId)}`, payload);

export const deleteFeaturePermission = (featureId, permissionId) =>
  api.delete(`/features/${encodeURIComponent(featureId)}/permissions/${encodeURIComponent(permissionId)}`);

export const toggleFeaturePermissionStatus = (featureId, permissionId, status) =>
  api.patch(
    `/features/${encodeURIComponent(featureId)}/permissions/${encodeURIComponent(permissionId)}/status`,
    { status: String(status).toUpperCase() }
  );
