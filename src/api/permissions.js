import { api } from "./http";
import { endpoints } from "./endpoints";

export async function listPermissions(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.append(key, value);
    }
  });
  //

  const queryString = query.toString();

  return api.get(
    queryString
      ? `${endpoints.permissions}?${queryString}`
      : endpoints.permissions
  );
}

export async function createPermission(payload) {
  console.log("POST permission payload:", payload);

  return api.post(
    endpoints.permissions,
    payload
  );
}

export async function updatePermission(id, payload) {
  if (!id) {
    throw new Error("Permission ID is required");
  }

  console.log("PUT permission payload:", payload);

  return api.put(
    endpoints.permission(id),
    payload
  );
}

export async function deletePermission(id) {
  if (!id) {
    throw new Error("Permission ID is required");
  }

  return api.delete(
    endpoints.permission(id)
  );
}