import { getAccessToken } from "../auth/tokenStore";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/connector/api/v1";

async function request(path, { token, ...options } = {}) {
  const accessToken = token ?? getAccessToken();

  const response = await fetch(`${BASE_URL}${path}`, {
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
  return `/store-types/${encodeURIComponent(id)}`;
}

export const storeTypesApi = {
  // GET /store-types
  getAll(token) {
    return request("/store-types", {
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

  // DELETE /store-types/:id
  remove(id, token) {
    return request(storeTypePath(id), {
      method: "DELETE",
      token,
    });
  },
};