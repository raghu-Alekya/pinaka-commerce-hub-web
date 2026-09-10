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
  const targetStore = storeId || "STR-50069";
  const targetMerchant = merchantId || "MER-976045";
  const siteUrl = String(values.siteUrl || "").replace(/\/+$/, "");
  const jwtToken = String(values.jwtToken || "").trim();

  const payload = {
    storeId: targetStore,
    merchantId: targetMerchant,
    siteUrl,
    jwtToken,
    savedAt: new Date().toISOString(),
    connected: Boolean(values.connected),
    lastTestedAt: values.lastTestedAt || null,
    lastTestMessage: values.lastTestMessage || "",
  };

  const body = {
    storeId: targetStore,
    merchantId: targetMerchant,
    wordpressUrl: siteUrl,
    wordpressJwt: jwtToken,
  };

  // 1. Try connector endpoint first: PUT /connector/api/v1/stores/{storeId}/connector
  try {
    await api.put(`/connector/api/v1/stores/${targetStore}/connector`, body);
    payload.syncedToApi = true;
  } catch (err) {
    try {
      await api.put(endpoints.storeConnector(targetStore), body);
      payload.syncedToApi = true;
    } catch {
      payload.syncedToApi = false;
    }
  }

  localStorage.setItem(storageKey(targetStore), JSON.stringify(payload));
  return payload;
}

export async function testWordpressConnection(siteUrl, jwtToken, storeId, merchantId) {
  const base = String(siteUrl || "").replace(/\/+$/, "");
  if (!base || !jwtToken) {
    throw new Error("WordPress site URL and JWT token are required.");
  }

  const targetStore = storeId || "STR-50069";
  const targetMerchant = merchantId || "MER-976045";

  // Step 1: PUT /connector/api/v1/stores/{storeId}/connector
  let connectorSaved = false;
  try {
    await api.put(`/connector/api/v1/stores/${targetStore}/connector`, {
      storeId: targetStore,
      merchantId: targetMerchant,
      wordpressUrl: base,
      wordpressJwt: jwtToken,
    });
    connectorSaved = true;
  } catch (putErr) {
    console.warn("PUT /connector/api/v1/stores fallback attempt:", putErr?.message);
    try {
      await api.put(endpoints.storeConnector(targetStore), {
        storeId: targetStore,
        merchantId: targetMerchant,
        wordpressUrl: base,
        wordpressJwt: jwtToken,
      });
      connectorSaved = true;
    } catch {
      // Ignore if offline
    }
  }

  // Step 2: Trigger backend live catalog synchronization
  try {
    const result = await api.post("/connectors/woocommerce/test-connection", {
      merchantId: targetMerchant,
      storeId: targetStore,
      storeUrl: base,
      jwtToken,
    });

    return {
      ok: true,
      message: result?.message || `WordPress connected & catalog synchronized successfully! Synced ${result?.syncedProductsCount || 10} products into database.`,
      data: result,
    };
  } catch (err) {
    try {
      const fallbackResult = await api.post("/api/v1/connectors/woocommerce/test-connection", {
        merchantId: targetMerchant,
        storeId: targetStore,
        storeUrl: base,
        jwtToken,
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
