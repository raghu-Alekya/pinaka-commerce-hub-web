import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";

function unwrap(response) {
  let value = response;
  for (let depth = 0; depth < 5 && value && typeof value === "object"; depth += 1) {
    const nested = value.data || value.result || value.settings || value.general_settings ||
      value.printer_settings || value.printerSettings || value.configurationValue || value.configuration_value;
    if (!nested || typeof nested !== "object") break;
    value = nested;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // Keep non-JSON response strings unchanged for normal error handling.
    }
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
  const response = await api.get(endpoints.generalSettings, {
    headers: scopeHeaders(merchantId, storeId),
  });
  return unwrap(response);
}

export async function savePrinterSettings(merchantId, storeId, settings) {
  const response = await api.post(endpoints.generalSettings, settings, {
    headers: scopeHeaders(merchantId, storeId),
  });
  return unwrap(response);
}
