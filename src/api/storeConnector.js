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

  const endpointsToTry = [
    `${base}/wp-json/wp/v2/users/me`,
    `${base}/wp-json/pinaka-pos/v1/token`,
  ];

  let lastError = "Unable to connect to the WordPress site.";

  for (const url of endpointsToTry) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          ok: true,
          message: "WordPress site connected successfully.",
          data,
        };
      }

      lastError = `WordPress responded with status ${response.status}.`;
    } catch {
      lastError =
        "The browser could not reach the WordPress site. The token is still saved for this store.";
    }
  }

  return { ok: false, message: lastError };
}
