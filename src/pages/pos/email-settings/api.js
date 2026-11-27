import { api, pendingStoreRead } from "../../../api/http";

const EMAIL_SETTINGS = "/api/v1/settings/email-settings";
const TEST_EMAIL = `${EMAIL_SETTINGS}/test-email`;

function scopeHeaders(merchantId, storeId) {
  return {
    ...(merchantId ? { "x-merchant-id": String(merchantId) } : {}),
    ...(storeId ? { "x-store-id": String(storeId) } : {}),
  };
}

function unwrap(response) {
  return response?.data && typeof response.data === "object"
    ? response.data
    : response;
}

export async function getEmailSettings(merchantId, storeId, templateId) {
  const query = templateId ? `?template_id=${encodeURIComponent(templateId)}` : "";
  const requestKey = `email-settings:${merchantId || ""}:${storeId || ""}:${templateId || "all"}`;
  const response = await pendingStoreRead(requestKey, () => api.get(`${EMAIL_SETTINGS}${query}`, {
    headers: scopeHeaders(merchantId, storeId),
  }));
  return unwrap(response);
}

export async function saveEmailSettings(merchantId, storeId, settings) {
  const response = await api.post(EMAIL_SETTINGS, settings, {
    headers: scopeHeaders(merchantId, storeId),
  });
  return unwrap(response);
}

export async function sendTestEmail(merchantId, storeId, settings, recipient) {
  const response = await api.post(TEST_EMAIL, {
    ...settings,
    ...(recipient ? { recipient } : {}),
  }, {
    headers: scopeHeaders(merchantId, storeId),
  });
  return unwrap(response);
}
