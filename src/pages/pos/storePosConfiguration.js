import { api } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import { getStoredUser } from "../../auth/tokenStore";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function currentUserId() {
  const user = getStoredUser();
  const id = user?.id || user?.userId || user?.sub || "";
  return UUID.test(id) ? id : undefined;
}

function parseConfigurationValue(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function asRecord(response, storeId, configurationName) {
  let row = response;
  for (let depth = 0; depth < 5 && row && typeof row === "object" && !Array.isArray(row); depth += 1) {
    const nested = row.storePosConfiguration || row.store_pos_configuration || row.configuration || row.data || row.result;
    if (nested && typeof nested === "object") row = nested;
    else break;
  }

  const value = parseConfigurationValue(row?.configurationValue ?? row?.configuration_value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      ...value,
      id: value.id || row.id || row.configurationId || row.configuration_id || `${storeId}:${configurationName}`,
    };
  }

  if (row && typeof row === "object" && !Array.isArray(row)) {
    const {
      success, message, error, data, result, configuration,
      storePosConfiguration, store_pos_configuration,
      configurationValue, configuration_value,
      ...record
    } = row;
    if (Object.keys(record).length) {
      return {
        ...record,
        id: record.id || record.configurationId || record.configuration_id || `${storeId}:${configurationName}`,
      };
    }
  }
  return value ?? row;
}

export function loadStorePosConfiguration(storeId, configurationName) {
  return api
    .get(endpoints.storePosConfigurationItem(storeId, configurationName))
    .then((response) => asRecord(response, storeId, configurationName));
}

export function isStoredPosImage(value) {
  return typeof value === "string" && (value.startsWith("/uploads/") || /^https?:\/\//i.test(value));
}

// Store configuration APIs persist paths relative to the uploads root. Older
// records may contain an absolute URL, which the UI can render but the API's
// store-image validator does not accept when the configuration is saved.
export function storedPosImagePath(value) {
  if (typeof value !== "string") return value;
  if (value.startsWith("/uploads/")) return value;
  if (value.startsWith("uploads/")) return `/${value}`;
  if (!/^https?:\/\//i.test(value)) {
    return !value.includes("/") && /\.(png|jpe?g|webp)$/i.test(value) ? `/uploads/${value}` : value;
  }
  try {
    const pathname = new URL(value).pathname;
    return pathname.startsWith("/uploads/") ? pathname : value;
  } catch {
    return value;
  }
}

export function posImageUrl(value, { sameOrigin = false } = {}) {
  if (typeof value !== "string" || !value) return "";
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  let origin = "";
  let pathname = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      origin = url.origin;
      pathname = url.pathname;
    } catch {
      return value;
    }
  }
  // Some general-settings responses return only the stored filename. Treat
  // those as files in the same uploads directory used by the upload API.
  if (pathname.startsWith("uploads/")) pathname = `/${pathname}`;
  else if (!pathname.startsWith("/") && !pathname.includes("/") && /\.(png|jpe?g|webp)$/i.test(pathname)) {
    pathname = `/uploads/${pathname}`;
  }
  if (!pathname.startsWith("/uploads/")) return value;
  const encoded = pathname.split("/").map((part) => {
    if (!part) return part;
    let decoded = part;
    try { decoded = decodeURIComponent(part); } catch { decoded = part; }
    return encodeURIComponent(decoded).replace(/[!'()*]/g, (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  }).join("/");
  if (sameOrigin && typeof window !== "undefined") origin = window.location.origin;
  if (!origin) {
    const apiOrigin = import.meta.env.VITE_API_ORIGIN || "";
    if (/^https?:\/\//i.test(apiOrigin)) origin = apiOrigin.replace(/\/+$/, "");
  }
  if (!origin && typeof window !== "undefined") origin = window.location.origin;
  return `${origin}${encoded}`;
}

export function uploadStorePosImage(storeId, file, merchantId) {
  const body = new FormData();
  body.append("image", file);
  return api.post(endpoints.storePosConfigurationImage(storeId), body, {
    headers: {
      ...(merchantId ? { "x-merchant-id": String(merchantId) } : {}),
      ...(storeId ? { "x-store-id": String(storeId) } : {}),
    },
  }).then((response) => {
    let payload = response;
    for (let depth = 0; depth < 4 && payload && typeof payload === "object"; depth += 1) {
      const nested = payload.data || payload.result || payload.image || payload.file;
      if (!nested || typeof nested !== "object") break;
      payload = nested;
    }
    const responsePath = payload?.path || payload?.imagePath || payload?.image_path || payload?.filePath || payload?.file_path ||
      payload?.url || payload?.imageUrl || payload?.image_url;
    const path = storedPosImagePath(responsePath);
    if (!path) throw new Error("The icon was not stored in the store images folder.");
    return {
      path,
      url: payload?.url || payload?.imageUrl || payload?.image_url || path,
      imageName: payload?.imageName || payload?.image_name || file.name,
    };
  });
}

export function saveStorePosConfiguration(storeId, configurationName, configurationValue) {
  const createdBy = currentUserId();
  return api
    .put(endpoints.storePosConfiguration, {
      storeId,
      configurationName,
      configurationValue,
      ...(createdBy ? { createdBy } : {}),
    })
    .then((response) => asRecord(response, storeId, configurationName));
}
