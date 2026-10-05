import { api } from "./http";

const featurePermissionsPath = (featureId) => {
  if (!featureId) throw new Error("Feature ID is required");
  return `/features/${encodeURIComponent(featureId)}/permissions`;
};

const unwrapList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.permissions)) return response.permissions;
  if (Array.isArray(response?.data?.permissions)) return response.data.permissions;
  return [];
};

const unwrapPermission = (response) =>
  response?.permission ?? response?.data?.permission ?? response?.data ?? response;

export const listFeaturePermissions = async (featureId, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const suffix = query.toString();
  const response = await api.get(`${featurePermissionsPath(featureId)}${suffix ? `?${suffix}` : ""}`);
  return unwrapList(response);
};

export const getFeaturePermissionById = async (featureId, permissionIdOrCode) =>
  unwrapPermission(await api.get(`${featurePermissionsPath(featureId)}/${encodeURIComponent(permissionIdOrCode)}`));

export const createFeaturePermission = async (featureId, payload) =>
  unwrapPermission(await api.post(featurePermissionsPath(featureId), payload));

export const updateFeaturePermission = async (featureId, permissionIdOrCode, payload) =>
  unwrapPermission(await api.put(`${featurePermissionsPath(featureId)}/${encodeURIComponent(permissionIdOrCode)}`, payload));

export const deleteFeaturePermission = (featureId, permissionIdOrCode) =>
  api.delete(`${featurePermissionsPath(featureId)}/${encodeURIComponent(permissionIdOrCode)}`);

export const toggleFeaturePermissionStatus = async (featureId, permissionIdOrCode, status) =>
  unwrapPermission(await api.put(
    `${featurePermissionsPath(featureId)}/${encodeURIComponent(permissionIdOrCode)}/status`,
    { status: String(status).toUpperCase() },
  ));
