import { api } from "../../../api/http";
import { endpoints } from "../../../api/endpoints";
import { loadStorePosConfiguration, saveStorePosConfiguration } from "../storePosConfiguration";

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
  const [general, printer] = await Promise.all([
    api.get(endpoints.generalSettings, {
      headers: scopeHeaders(merchantId, storeId),
    }).then(unwrap),
    loadStorePosConfiguration(storeId, "printer_settings").catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    }),
  ]);
  return { general, printer };
}

export async function savePrinterSettings(merchantId, storeId, settings, printerSettings) {
  const [general] = await Promise.all([
    api.post(endpoints.generalSettings, settings, {
      headers: scopeHeaders(merchantId, storeId),
    }).then(unwrap),
    saveStorePosConfiguration(storeId, "printer_settings", printerSettings),
  ]);
  return general;
}
