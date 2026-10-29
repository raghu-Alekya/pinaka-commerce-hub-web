import { api } from "../../../api/http";

const ENDPOINT = "/api/v1/settings/promotional-images";

function normalizePromotionalImages(response) {
  let record = response;
  for (let depth = 0; depth < 5 && record && typeof record === "object" && !Array.isArray(record); depth += 1) {
    const nested = record.data || record.result || record.settings || record.configuration;
    if (nested && typeof nested === "object") record = nested;
    else break;
  }
  const images = Array.isArray(record?.images) ? record.images
    .map((image) => typeof image === "string" ? { url: image } : image)
    .filter((image) => typeof image?.url === "string" && image.url)
    .map((image) => ({ id: image.id, url: image.url })) : [];
  return { enabled: record?.enabled === true || /^(true|1|yes)$/i.test(String(record?.enabled ?? "")), images };
}

function scopeHeaders(merchantId, storeId) {
  return {
    ...(merchantId ? { "x-merchant-id": merchantId } : {}),
    ...(storeId ? { "x-store-id": storeId } : {}),
  };
}

export function getPromotionalImages(merchantId, storeId) {
  return api.get(ENDPOINT, { headers: scopeHeaders(merchantId, storeId) }).then(normalizePromotionalImages);
}

export function savePromotionalImages(merchantId, storeId, configuration) {
  const body = new FormData();
  body.append("enabled", String(configuration.enabled));
  body.append("images", JSON.stringify(configuration.images
    .filter((image) => !image.file)
    .map((image) => ({ ...(image.id ? { id: image.id } : {}), url: image.url }))));
  body.append("removeIds", JSON.stringify(configuration.removeIds || []));
  configuration.images.forEach((image) => {
    if (image.file) body.append("files", image.file, image.file.name);
  });
  return api.put(ENDPOINT, body, { headers: scopeHeaders(merchantId, storeId) }).then(normalizePromotionalImages);
}
