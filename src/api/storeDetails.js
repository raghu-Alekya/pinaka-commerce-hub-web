export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export function toSnakeCaseApiPayload(value) {
  if (Array.isArray(value)) return value.map(toSnakeCaseApiPayload);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .toLowerCase(),
      toSnakeCaseApiPayload(nested),
    ]),
  );
}

// Store reads and writes use different shapes. Keep both editing entry points
// on the same write contract rather than sending a GET response back to PUT.
export function buildStoreSetupPayload(store, overrides = {}) {
  const address = store.address && typeof store.address === "object" ? store.address : {};
  const text = value => String(value ?? "").trim();
  const addressLine1 = store.addressLine1 || address.addressLine1 || address.street ||
    (typeof store.address === "string" ? store.address : "");
  const addressLine2 = store.addressLine2 || address.addressLine2 || "";
  const setup = store.onboardingSetup || {};
  const features = overrides.features ?? store.features ?? store.enabledFeatures ?? setup.features;
  const rolePermissions = overrides.rolePermissions ?? overrides.role_permissions ?? store.rolePermissions ?? store.role_permissions ?? setup.rolePermissions;
  const storeCode = overrides.storeCode || overrides.storeId || store.storeCode || store.code || store.storeID || store.storeId || store.id;
  const type = overrides.storeTypeId || overrides.type || store.storeTypeId || store.store_type_id ||
    store.storeType?.id || store.storeType?.storeTypeId || store.storeType?.store_type_id ||
    store.storeType?.storeTypeCode || store.storeType?.code || store.storeTypeCode ||
    store.type?.code || store.type?.name || store.type || store.storeType?.name || store.storeType || "Retail";
  const payload = {
    merchant_id: overrides.merchantId || store.merchantId || store.merchant?.id || store.merchant,
    store_code: text(storeCode).slice(0, 50),
    name: text(store.name || store.storeName),
    store_type_id: text(type).slice(0, 50),
    phone: text(store.phone),
    store_email: text(store.email || store.storeEmail || store.store_email),
    store_website_url: text(store.url || store.baseUrl || store.websiteUrl || store.store_website_url),
    currency: store.currency,
    status: text(store.status || "Active").toUpperCase(),
    address_line1: text(addressLine1).slice(0, 1000),
    address_line2: text(addressLine2).slice(0, 1000),
    city: text(store.city || address.city),
    state: text(store.state || address.state),
    postal_code: text(store.zip || store.postalCode || address.zipCode || address.postalCode || store.postal_code),
    country: store.country || address.country,
    timezone: store.timezone,
    default_language: store.defaultLanguage || store.default_language || "",
    tax_region: store.taxRegion || store.tax_region || store.state || address.state || "",
    hours: store.hours ?? setup.hours,
    logo: store.logo ?? store.logoUrl,
    ...(features !== undefined ? { features } : {}),
    ...(rolePermissions !== undefined ? { role_permissions: rolePermissions.map?.(role => ({
      role_template_id: role.roleTemplateId || role.role_template_id,
      name: role.name,
      permissions: role.permissions,
    })) ?? rolePermissions } : {}),
  };
  if (overrides.currency !== undefined) payload.currency = overrides.currency;
  if (overrides.status !== undefined) payload.status = text(overrides.status).toUpperCase();
  if (overrides.hours !== undefined) payload.hours = overrides.hours;
  if (overrides.logo !== undefined) payload.logo = overrides.logo;
  if (features !== undefined) payload.features = features;
  if (rolePermissions !== undefined) payload.role_permissions = Array.isArray(rolePermissions)
    ? rolePermissions.map(role => ({
        role_template_id: role.roleTemplateId || role.role_template_id,
        name: role.name,
        permissions: role.permissions,
      }))
    : rolePermissions;
  const request = toSnakeCaseApiPayload(payload);
  if (rolePermissions !== undefined) {
    request.role_permissions = Array.isArray(rolePermissions)
      ? rolePermissions.map((role) => ({
          role_template_id: role.roleTemplateId || role.role_template_id || role.id,
          name: role.name || role.roleName || role.role_name,
          // Permission action names are case-sensitive on the store API.
          // Keep View/Create/Edit/Delete untouched by recursive snake-casing.
          permissions: role.permissions ?? {},
        }))
      : rolePermissions;
  }
  return request;
}

export function storeListFromResponse(response) {
  if (Array.isArray(response)) return response;
  for (const key of ["stores", "items", "results", "data"]) {
    const value = response?.[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = storeListFromResponse(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

export function normalizeStoreForConfiguration(store) {
  const address = store.address && typeof store.address === "object" ? store.address : {};
  const storeCode = [store.storeCode, store.store_code, store.code, store.storeId, store.storeID]
    .find(value => value && !isUuid(value)) || "";
  const type = store.storeType?.name || store.storeType || store.type?.name || store.type || "";
  const location = [
    address.street || (typeof store.address === "string" ? store.address : ""),
    address.city || store.city,
    address.state || store.state,
  ].filter(Boolean).join(", ");

  return {
    ...store,
    id: store.id || store._id || store.storeUUID || store.storeId || store.storeID,
    storeCode,
    name: store.storeName || store.name || storeCode || "Store",
    type,
    location: location || store.location || "—",
    status: store.status || store.operationalStatus || "Unknown",
    url: store.baseUrl || store.websiteUrl || store.url || "",
  };
}




