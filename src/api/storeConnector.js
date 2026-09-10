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

  // 1. Send dynamic values to PUT /connector/api/v1/stores/{storeId}/connector
  try {
    await api.put(`/connector/api/v1/stores/${storeId}/connector`, body);
    payload.syncedToApi = true;
  } catch (err) {
    try {
      await api.put(endpoints.storeConnector(storeId), body);
      payload.syncedToApi = true;
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

  // Step 1: PUT /connector/api/v1/stores/{storeId}/connector with dynamic fields
  try {
    await api.put(`/connector/api/v1/stores/${storeId}/connector`, payload);
  } catch (putErr) {
    console.warn("PUT /connector/api/v1/stores fallback attempt:", putErr?.message);
    try {
      await api.put(endpoints.storeConnector(storeId), payload);
    } catch {
      // Continue to test-connection
    }
  }

  // Step 2: Trigger WooCommerce test-connection & live sync into product table
  try {
    const result = await api.post("/connectors/woocommerce/test-connection", {
      merchantId,
      storeId,
      storeUrl: base,
      jwtToken: token,
    });

    return {
      ok: true,
      message: result?.message || `WordPress connected & catalog synchronized successfully! Synced ${result?.syncedProductsCount || 0} products into database.`,
      data: result,
    };
  } catch (err) {
    try {
      const fallbackResult = await api.post("/api/v1/connectors/woocommerce/test-connection", {
        merchantId,
        storeId,
        storeUrl: base,
        jwtToken: token,
      });
      return {
        ok: true,
        message: fallbackResult?.message || `WordPress connected & catalog synchronized successfully!`,
        data: fallbackResult,
      };
    } catch (fallbackErr) {
      return {
        ok: false,
        message: err.message || fallbackErr.message || "Failed to connect to WooCommerce backend.",
      };
    }
  }
}
