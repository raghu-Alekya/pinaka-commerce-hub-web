import { api, pendingStoreRead } from "../../../api/http";

const notificationEndpoints = {
  sms: "/api/v1/settings/text-notification-settings",
  whatsapp: "/api/v1/settings/whatsapp-notification-settings",
};

const TEMPLATE_ID = "order-received";

function scopeHeaders(merchantId, storeId) {
  return {
    ...(merchantId ? { "x-merchant-id": String(merchantId) } : {}),
    ...(storeId ? { "x-store-id": String(storeId) } : {}),
  };
}

function unwrap(response) {
  let value = response;
  for (let depth = 0; depth < 5 && value && typeof value === "object"; depth += 1) {
    const nested = value.data || value.result || value.settings || value.notification_settings || value.notificationSettings;
    if (!nested || typeof nested !== "object") break;
    value = nested;
  }
  return value;
}

export async function getNotificationSettings(channel, merchantId, storeId) {
  const endpoint = notificationEndpoints[channel];
  const query = `?template_id=${encodeURIComponent(TEMPLATE_ID)}`;
  const key = `notification-settings:${channel}:${merchantId || ""}:${storeId || ""}`;
  const response = await pendingStoreRead(key, () => api.get(`${endpoint}${query}`, {
    headers: scopeHeaders(merchantId, storeId),
  }));
  return unwrap(response);
}

export async function saveNotificationSettings(channel, merchantId, storeId, settings) {
  const response = await api.post(notificationEndpoints[channel], {
    template_id: TEMPLATE_ID,
    enabled: Boolean(settings.enabled),
    store_name: settings.storeName,
    message_text: settings.message,
  }, {
    headers: scopeHeaders(merchantId, storeId),
  });
  return unwrap(response);
}

export function notificationSettingsFromApi(record, fallback) {
  return {
    ...fallback,
    enabled: record?.enabled == null ? fallback.enabled : Boolean(record.enabled),
    message: record?.message_text ?? record?.messageText ?? record?.message ?? fallback.message,
    storeName: record?.store_name ?? record?.storeName ?? fallback.storeName,
  };
}
