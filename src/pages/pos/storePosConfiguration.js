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

export function posImageUrl(value) {
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
  if (!pathname.startsWith("/uploads/")) return value;
  const encoded = pathname.split("/").map((part) => {
    if (!part) return part;
    let decoded = part;
    try { decoded = decodeURIComponent(part); } catch { decoded = part; }
    return encodeURIComponent(decoded).replace(/[!'()*]/g, (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  }).join("/");
  if (!origin && typeof window !== "undefined") origin = window.location.origin;
  return `${origin}${encoded}`;
}

export function uploadStorePosImage(storeId, file) {
  const body = new FormData();
  body.append("image", file);
  return api.post(endpoints.storePosConfigurationImage(storeId), body).then((response) => {
    const payload = response?.data && typeof response.data === "object" ? response.data : response;
    const path = payload?.path || payload?.url;
    if (!path) throw new Error("The icon was not stored in the store images folder.");
    return {
      path,
      url: payload?.url || path,
      imageName: payload?.imageName || file.name,
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
