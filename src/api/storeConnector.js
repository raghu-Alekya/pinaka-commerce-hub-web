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

  const siteUrl = remote?.wordpressUrl || remote?.siteUrl || local.siteUrl || "";
  const connected = remote?.status === "CONNECTED" || Boolean(local.connected);
  const lastTestMessage = remote?.lastTestMessage || local.lastTestMessage || "";
  const lastTestedAt = remote?.lastTestedAt || local.lastTestedAt || null;
  const jwtToken = local.jwtToken || "";

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
    wordpressJwt: jwtToken,
  };

  // Single dynamic PUT request to save & connect
  try {
    const result = await api.put(`/connector/api/v1/stores/${storeId}/connector`, body);
    payload.syncedToApi = true;
    payload.lastTestMessage = result?.message || payload.lastTestMessage;
  } catch (err) {
    try {
      const fallbackResult = await api.put(endpoints.storeConnector(storeId), body);
      payload.syncedToApi = true;
      payload.lastTestMessage = fallbackResult?.message || payload.lastTestMessage;
    } catch {
      payload.syncedToApi = false;
    }
  }

  localStorage.setItem(storageKey(storeId), JSON.stringify(payload));
  return payload;
}

export async function testWordpressConnection(siteUrl, jwtToken, storeId, merchantId) {
  const base = String(siteUrl || "").replace(/\/+$/, "");
  const token = String(jwtToken || "").trim();
  if (!base || !token) {
    throw new Error("WordPress site URL and JWT token are required.");
  }
  if (!storeId) {
    throw new Error("Store ID is required.");
  }

  const payload = {
    storeId,
    merchantId,
    wordpressUrl: base,
    wordpressJwt: token,
  };

  try {
    const result = await api.put(`/connector/api/v1/stores/${storeId}/connector`, payload);
    return {
      ok: true,
      message: result?.message || `WordPress connected & catalog synchronized successfully! Synced ${result?.syncedProductsCount || 0} products into database.`,
      data: result,
    };
  } catch (err) {
    try {
      const fallbackResult = await api.put(endpoints.storeConnector(storeId), payload);
      return {
        ok: true,
        message: fallbackResult?.message || `WordPress connected & catalog synchronized successfully!`,
        data: fallbackResult,
      };
    } catch (fallbackErr) {
      return {
        ok: false,
        message: err.message || fallbackErr.message || "Failed to connect to WordPress connector.",
      };
    }
  }
}
