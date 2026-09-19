import { getAccessToken } from "../auth/tokenStore";
import { endpoints } from "./endpoints";
 
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/connector/api/v1";
 
function extractStoreTypesList(payload) {
  const source =
    payload?.storeTypes ??
    payload?.items ??
    payload?.data ??
    payload;
 
  if (Array.isArray(source)) {
    return source;
  }
 
  if (source && Array.isArray(source.storeTypes)) {
    return source.storeTypes;
  }
 
  if (source && Array.isArray(source.items)) {
    return source.items;
  }
 
  if (source && Array.isArray(source.data)) {
    return source.data;
  }
 
  return [];
}
 
export function normalizeStoreTypeList(payload) {
  const list = extractStoreTypesList(payload);
 
  return list.map((item, index) => {
    const id =
      item?.id ??
      item?._id ??
      item?.storeTypeId ??
      item?.storeTypeID ??
      item?.code ??
      index;
 
    const name =
      item?.name ??
      item?.storeTypeName ??
      item?.type ??
      item?.code ??
      `Store Type ${index + 1}`;
 
    const code =
      item?.storeTypeCode ??
      item?.code ??
      item?.slug ??
      String(name).trim();
 
    const active =
      item?.active ??
      item?.isActive ??
      item?.status ??
      true;
 
    return {
      ...item,
      id: String(id),
      name: String(name).trim(),
      code: String(code).trim(),
      active:
        typeof active === "string"
          ? active.toUpperCase() !== "INACTIVE"
          : Boolean(active),
    };
  });
}
 
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
  async getAll(token) {
    const response = await request(endpoints.storeTypes, { token });
    const normalized = normalizeStoreTypeList(response);
 
    return {
      ...(response || {}),
      storeTypes: normalized,
      items: normalized,
      data: normalized,
    };
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