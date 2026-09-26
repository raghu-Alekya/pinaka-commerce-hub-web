import { api } from "./http";

/*
 * Normalize API responses.
 *
 * Supports:
 * [
 *   {...}
 * ]
 *
 * {
 *   permissions: [...]
 * }
 *
 * {
 *   data: [...]
 * }
 *
 * {
 *   result: [...]
 * }
 */
const unwrapList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.permissions)) {
    return response.permissions;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.result)) {
    return response.result;
  }

  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data?.permissions))
    return response.data.permissions;
  if (Array.isArray(response?.data?.items)) return response.data.items;

  return [];
};

/*
 * GET ALL PERMISSIONS FOR A FEATURE
 *
 * Correct API:
 * GET /features/{featureId}/permissions
 */
export const listFeaturePermissions = (featureId, params = {}) => {
  const query = new URLSearchParams();

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.search) {
    query.set("search", params.search);
  }

  const queryString = query.toString();

  const url =
    `/features/${encodeURIComponent(featureId)}/permissions` +
    (queryString ? `?${queryString}` : "");

  console.log("GET FEATURE PERMISSIONS:", url);

  return api.get(url).then(unwrapList);
};

/* GET /features/{featureId}/permissions/{permissionId} */
export const getFeaturePermissionById = async (featureId, permissionId) => {
  const url = `/features/${encodeURIComponent(featureId)}/permissions/${encodeURIComponent(permissionId)}`;
  const response = await api.get(url);
  return (
    response?.permission ||
    response?.data?.permission ||
    response?.data ||
    response?.result ||
    response
  );
};

/*
 * CREATE
 *
 * POST /features/{featureId}/permissions
 */
export const createFeaturePermission = (featureId, payload) => {
  const url = `/features/${encodeURIComponent(featureId)}/permissions`;

  console.log("CREATE FEATURE PERMISSION:", url, payload);

  return api
    .post(url, payload)
    .then(
      (response) =>
        response?.permission ||
        response?.data?.permission ||
        response?.data ||
        response?.result ||
        response,
    );
};

/*
 * UPDATE
 *
 * PUT /features/{featureId}/permissions/{permissionId}
 *
 * IMPORTANT:
 * permissionKey is NOT sent here because
 * the Postman API update body only contains:
 *
 * name
 * description
 * status
 */
export const updateFeaturePermission = (featureId, permissionId, payload) => {
  const url = `/features/${encodeURIComponent(featureId)}/permissions/${encodeURIComponent(permissionId)}`;

  console.log("UPDATE FEATURE PERMISSION:", url, payload);

  return api
    .put(url, payload)
    .then(
      (response) =>
        response?.permission ||
        response?.data?.permission ||
        response?.data ||
        response?.result ||
        response,
    );
};

/*
 * DELETE / DEACTIVATE
 *
 * DELETE /features/{featureId}/permissions/{permissionId}
 *
 * According to your Postman collection, DELETE sets
 * the permission status to INACTIVE.
 */
export const deleteFeaturePermission = (featureId, permissionId) => {
  const url = `/features/${encodeURIComponent(featureId)}/permissions/${encodeURIComponent(permissionId)}`;

  console.log("DELETE FEATURE PERMISSION:", url);

  return api.delete(url);
};

/*
 * TOGGLE STATUS
 *
 * PATCH /features/{featureId}/permissions/{permissionId}/status
 */
export const toggleFeaturePermissionStatus = (
  featureId,
  permissionId,
  status,
) => {
  const url = `/features/${encodeURIComponent(featureId)}/permissions/${encodeURIComponent(permissionId)}/status`;

  const payload = {
    status: String(status).toUpperCase(),
  };

  console.log("TOGGLE FEATURE PERMISSION STATUS:", url, payload);

  return api.patch(url, payload);
};
