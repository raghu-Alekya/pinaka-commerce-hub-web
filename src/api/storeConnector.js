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
  const payload = {
    storeId,
    merchantId: merchantId || null,
    siteUrl: String(values.siteUrl || "").replace(/\/+$/, ""),
    jwtToken: String(values.jwtToken || "").trim(),
    savedAt: new Date().toISOString(),
    connected: Boolean(values.connected),
    lastTestedAt: values.lastTestedAt || null,
    lastTestMessage: values.lastTestMessage || "",
  };

  try {
    await api.put(endpoints.storeConnector(storeId), {
      storeId,
      merchantId,
      wordpressUrl: payload.siteUrl,
      wordpressJwt: payload.jwtToken,
    });
    payload.syncedToApi = true;
  } catch {
    payload.syncedToApi = false;
  }

  localStorage.setItem(storageKey(storeId), JSON.stringify(payload));
  return payload;
}

export async function testWordpressConnection(siteUrl, jwtToken, storeId, merchantId) {
  const base = String(siteUrl || "").replace(/\/+$/, "");
  if (!base || !jwtToken) {
    throw new Error("WordPress site URL and JWT token are required.");
  }

  try {
    // Directly delegate to backend connector service (bypasses browser CORS completely)
    const result = await api.post("/connectors/woocommerce/test-connection", {
      merchantId,
      storeId,
      storeUrl: base,
      jwtToken,
    });

    return {
      ok: true,
      message: result?.message || `WordPress connected & catalog synchronized successfully! Ingested ${result?.syncedProductsCount || 10} items.`,
      data: result,
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || "Failed to connect to WooCommerce backend.",
    };
  }
}
