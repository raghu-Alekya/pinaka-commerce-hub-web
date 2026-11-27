import { api } from "./http";
import { endpoints } from "./endpoints";

const storageKey = (storeId) => `pch.wpConnector.${storeId}`;

export function getWordpressConnector(storeId) {
  if (!storeId) return null;
  try {
    return JSON.parse(localStorage.getItem(storageKey(storeId)) || "null");
  } catch {
    return null;
  }
}

export function getWordpressAuthHeader(storeId) {
  const connector = getWordpressConnector(storeId);
  if (!connector?.jwtToken) return {};
  return { Authorization: `Bearer ${connector.jwtToken}` };
}

export async function fetchWordpressConnector(storeId, merchantId) {
  if (!storeId) return null;
  const local = getWordpressConnector(storeId) || {};

  let remote = null;
  try {
    const res = await api.get(`/connector/api/v1/stores/${storeId}/connector`);
    remote = res?.connector || res?.connection || res?.data?.connector || res;
  } catch {
    try {
      const res = await api.get(endpoints.storeConnector(storeId));
      remote = res?.connector || res?.connection || res?.data?.connector || res;
    } catch {
      try {
        const res = await api.get(`/stores/${storeId}/configuration`);
        remote = res?.websiteConnection || res?.connector || null;
      } catch {
        remote = null;
      }
    }
  }

  const remoteSaved = Boolean(remote?.wordpressUrl || remote?.wordpressJwt || remote?.updatedAt);
  if (!remoteSaved) {
    if (!local.siteUrl && !local.jwtToken) return null;
    return {
      ...local,
      storeId,
      merchantId: merchantId || local.merchantId || "",
    };
  }

  const siteUrl = remote.wordpressUrl || remote.siteUrl || local.siteUrl || "";
  const connected = remote.status === "CONNECTED";
  const lastTestMessage = remote.lastTestMessage || local.lastTestMessage || "";
  const lastTestedAt = remote.lastTestedAt || local.lastTestedAt || null;
  const jwtToken = remote.wordpressJwt || local.jwtToken || "";

  const merged = {
    storeId,
    merchantId: merchantId || local.merchantId || "",
    siteUrl,
    jwtToken,
    connected,
    lastTestedAt,
    lastTestMessage,
    wordpressJwtConfigured: Boolean(remote?.wordpressJwtConfigured || jwtToken),
  };

  localStorage.setItem(storageKey(storeId), JSON.stringify(merged));
  return merged;
}

export async function saveWordpressConnector(storeId, merchantId, values) {
  if (!storeId) throw new Error("Store ID is required");
  const siteUrl = String(values.siteUrl || "").replace(/\/+$/, "");
  const jwtToken = String(values.jwtToken || "").trim();

  const payload = {
    storeId,
    merchantId: merchantId || "",
    siteUrl,
    jwtToken,
    savedAt: new Date().toISOString(),
    connected: Boolean(values.connected),
    lastTestedAt: values.lastTestedAt || null,
    lastTestMessage: values.lastTestMessage || "",
  };

  const body = {
    storeId,
    merchantId,
    wordpressUrl: siteUrl,
    ...(jwtToken ? { wordpressJwt: jwtToken } : {}),
  };

  const applyResult = (result) => {
    const status = result?.connector?.status;
    payload.syncedToApi = true;
    payload.lastTestMessage = result?.connector?.lastTestMessage || result?.message || payload.lastTestMessage;
    if (status === "CONNECTED" || status === "NOT_CONNECTED") {
      payload.connected = status === "CONNECTED";
    }
    payload.wordpressJwtConfigured = Boolean(
      result?.connector?.wordpressJwtConfigured || jwtToken
    );
    return payload;
  };

  // Save through the merchant API. Do not report a browser-only save when the
  // backend fails, because catalog sync uses the encrypted server-side token.
  applyResult(await api.put(endpoints.storeConnector(storeId), body));

  localStorage.setItem(storageKey(storeId), JSON.stringify(payload));
  return payload;
}

export async function syncWordpressCatalog(storeId) {
  if (!storeId) throw new Error("Store ID is required.");
  return api.post(`/stores/${encodeURIComponent(storeId)}/catalog/sync`);
}

export async function getStoreCatalogTaxonomies(storeId, { signal } = {}) {
  if (!storeId) return { categories: [], tags: [], attributes: [] };
  return api.get(
    `/stores/${encodeURIComponent(storeId)}/catalog/taxonomies`,
    { signal },
  );
}

export async function createStoreCategory(storeId, category) {
  if (!storeId) throw new Error("Store ID is required.");
  const payload = category instanceof FormData
    ? category
    : { ...category };
  if (payload instanceof FormData) payload.set("field", "categories");
  else payload.field = "categories";
  return api.post(
    `/stores/${encodeURIComponent(storeId)}/catalog/taxonomies`,
    payload,
  );
}

export async function updateStoreCategory(storeId, categoryId, category) {
  if (!storeId || !categoryId) throw new Error("Store and category are required.");
  const payload = category instanceof FormData ? category : { ...category };
  if (payload instanceof FormData) {
    payload.set("field", "categories");
    payload.set("id", String(categoryId));
  } else {
    payload.field = "categories";
    payload.id = categoryId;
  }
  return api.put(`/stores/${encodeURIComponent(storeId)}/catalog/taxonomies`, payload);
}

export async function deleteStoreCategory(storeId, categoryId) {
  if (!storeId || !categoryId) throw new Error("Store and category are required.");
  return api.delete(`/stores/${encodeURIComponent(storeId)}/catalog/taxonomies`, {
    body: { field: "categories", id: categoryId },
  });
}

export async function createStoreTag(storeId, tag) {
  if (!storeId) throw new Error("Store ID is required.");
  const payload = { ...tag, field: "tags" };
  return api.post(
    `/stores/${encodeURIComponent(storeId)}/catalog/taxonomies`,
    payload,
  );
}

export async function updateStoreTag(storeId, tagId, tag) {
  if (!storeId || !tagId) throw new Error("Store and tag are required.");
  return api.put(`/stores/${encodeURIComponent(storeId)}/catalog/taxonomies`, {
    ...tag,
    field: "tags",
    id: tagId,
  });
}

export async function deleteStoreTag(storeId, tagId) {
  if (!storeId || !tagId) throw new Error("Store and tag are required.");
  return api.delete(`/stores/${encodeURIComponent(storeId)}/catalog/taxonomies`, {
    body: { field: "tags", id: tagId },
  });
}

export async function createStoreAttribute(storeId, attribute) {
  if (!storeId) throw new Error("Store ID is required.");
  return api.post(
    `/stores/${encodeURIComponent(storeId)}/catalog/attributes`,
    attribute,
  );
}

export async function updateStoreAttribute(storeId, attributeId, attribute) {
  if (!storeId || !attributeId) throw new Error("Store and attribute are required.");
  return api.put(
    `/stores/${encodeURIComponent(storeId)}/catalog/attributes/${encodeURIComponent(attributeId)}`,
    attribute,
  );
}

export async function deleteStoreAttribute(storeId, attributeId) {
  if (!storeId || !attributeId) throw new Error("Store and attribute are required.");
  return api.delete(
    `/stores/${encodeURIComponent(storeId)}/catalog/attributes/${encodeURIComponent(attributeId)}`,
  );
}

export async function createStoreAttributeTerm(storeId, attributeId, term) {
  if (!storeId || !attributeId) throw new Error("Store and attribute are required.");
  return api.post(
    `/stores/${encodeURIComponent(storeId)}/catalog/attributes/${encodeURIComponent(attributeId)}/terms`,
    term,
  );
}

export function syncWordpressAttributes(storeId) {
  if (!storeId) throw new Error("Store ID is required.");
  return api.post(`/api/v1/stores/${encodeURIComponent(storeId)}/catalog/sync/attributes`);
}

async function postStoreSync(storeId, step) {
  if (!storeId) throw new Error("Store ID is required.");
  const path = `/stores/${encodeURIComponent(storeId)}/catalog/sync/${step}`;
  try {
    return await api.post(`/connector/api/v1${path}`);
  } catch (err) {
    try {
      return await api.post(path);
    } catch (fallbackErr) {
      throw new Error(err?.message || fallbackErr?.message || `Unable to sync ${step}.`);
    }
  }
}

export function syncWordpressProducts(storeId) {
  return postStoreSync(storeId, "products");
}

export function syncWordpressCategories(storeId) {
  return postStoreSync(storeId, "categories");
}

export function syncWordpressTags(storeId) {
  return postStoreSync(storeId, "tags");
}

export function syncWordpressDiscounts(storeId) {
  return postStoreSync(storeId, "discounts");
}

// export async function syncWordpressCatalog(storeId, { siteUrl, jwtToken, merchantId } = {}) {
//   const result = await testWordpressConnection(siteUrl, jwtToken, storeId, merchantId);
//   if (!result?.ok) {
//     throw new Error(result?.message || "Unable to sync WordPress categories and products.");
//   }

//   const data = result.data || {};
//   return {
//     ...result,
//     catalog: {
//       categoryCount: data.categoryCount ?? data.syncedCategoriesCount ?? data.catalog?.categoryCount ?? 0,
//       productCount: data.productCount ?? data.syncedProductsCount ?? data.catalog?.productCount ?? 0,
//     },
//   };
// }
