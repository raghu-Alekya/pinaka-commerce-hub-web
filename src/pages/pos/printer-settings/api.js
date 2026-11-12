import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";

function unwrap(response) {
  let value = response;
  for (let depth = 0; depth < 5 && value && typeof value === "object"; depth += 1) {
    const nested = value.data || value.result || value.settings || value.general_settings;
    if (!nested || typeof nested !== "object") break;
    value = nested;
  }
  return value;
}

function scopeHeaders(merchantId, storeId) {
  return {
    ...(merchantId ? { "x-merchant-id": String(merchantId) } : {}),
    ...(storeId ? { "x-store-id": String(storeId) } : {}),
  };
}

export async function getPrinterSettings(merchantId, storeId) {
  const general = await api.get(endpoints.generalSettings, {
    headers: scopeHeaders(merchantId, storeId),
  });
  return unwrap(general);
}

export async function savePrinterSettings(merchantId, storeId, settings) {
  const general = await api.post(endpoints.generalSettings, settings, {
    headers: scopeHeaders(merchantId, storeId),
  });
  return unwrap(general);
}
