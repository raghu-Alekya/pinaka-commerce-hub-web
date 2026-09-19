import { getAccessToken } from "../auth/tokenStore";
import { endpoints } from "./endpoints";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/connector/api/v1";

async function request(path, { token, ...options } = {}) {
  const accessToken = token ?? getAccessToken();
  const requestUrl = path.startsWith("/connector/")
    ? path
    : `${BASE_URL}${path}`;

  const response = await fetch(requestUrl, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
      ...options.headers,
    },
  });

  const raw = await response.text();

  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `API returned a non-JSON response (${response.status}).`
      );
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message ??
        data?.error ??
        `Request failed (${response.status}).`
    );
  }

  return data;
}

function storeTypePath(id) {
  return endpoints.storeType(id);
}

export const storeTypesApi = {
  // GET /store-types
 getAll(token) {
    return request(endpoints.storeTypes, {
      token,
    });
  },

  // GET /store-types/:id
  getOne(id, token) {
    return request(storeTypePath(id), {
      token,
    });
  },

  // POST /store-types
  create(values, token) {
    return request("/store-types", {
      method: "POST",
      body: JSON.stringify(values),
      token,
    });
  },

  // PUT /store-types/:id
  update(id, values, token) {
    return request(storeTypePath(id), {
      method: "PUT",
      body: JSON.stringify(values),
      token,
    });
  },

  // POST /store-types/:id/features
  createFeature(id, values, token) {
    return request(endpoints.storeTypeFeatures(id), {
      method: "POST",
      body: JSON.stringify(values),
      token,
    });
  },

  // GET /store-types/:id/features
  getFeatures(id, token) {
    return request(endpoints.storeTypeFeatures(id), {
      token,
    });
  },

  // DELETE /store-types/:id/features/:featureId
  removeFeature(storeTypeId, featureId, token) {
    return request(endpoints.storeTypeFeature(storeTypeId, featureId), {
      method: "DELETE",
      token,
    });
  },

  // DELETE /store-types/:id
  remove(id, token) {
    return request(storeTypePath(id), {
      method: "DELETE",
      token,
    });
  },
};