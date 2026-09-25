export const endpoints = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
  //
  merchants: "/merchants",
  createMerchant: "/merchants/create-merchant",
  merchant: (id) => `/merchants/${id}`,

  stores: "/stores",
  // Employee Endpoints (Matching Postman Collection)
  employees: "/merchants/employees",
  employee: (id) => `/merchants/employees/${encodeURIComponent(id)}`,
  merchantEmployees: (merchantId) =>
    `/merchants/${encodeURIComponent(merchantId)}/employees`,
  merchantEmployee: (merchantId, employeeId) =>
    `/merchants/${encodeURIComponent(merchantId)}/employees/${encodeURIComponent(employeeId)}`,
  employeeProfileImage: (employeeId) =>
    `/merchants/employees/${encodeURIComponent(employeeId)}/profile-image`,
  store: (id) => `/stores/${id}`,
  storeCurrencyTax: (storeId) =>
    `/stores/${encodeURIComponent(storeId)}/pos/currency-tax`,
  storeServiceCharges: (storeId) =>
    `/stores/${encodeURIComponent(storeId)}/pos/service-charges`,
  storeCashback: (storeId) =>
    `/stores/${encodeURIComponent(storeId)}/pos/cashback`,
  storeOpeningBalance: (storeId) =>
    `/stores/${encodeURIComponent(storeId)}/pos/opening-balance`,
  storeCashDenominations: (storeId) =>
    `/stores/${encodeURIComponent(storeId)}/pos/cash-denominations`,
  storeTypes: "/store-types",
  storeType: (id) => `/store-types/${encodeURIComponent(id)}`,
  storeTypeFeatures: (id) => `/store-types/${encodeURIComponent(id)}/features`,
  storeTypeFeature: (storeTypeId, featureId) =>
    `/store-types/${encodeURIComponent(storeTypeId)}/features/${encodeURIComponent(featureId)}`,
  storeConnector: (id) => `/stores/${id}/connector`,
  merchantStores: (merchantId) => `/merchants/${merchantId}/stores`,

  features: "/features",
  feature: (id) => `/features/${id}`,
  featureStatus: (id) => `/features/${id}/status`,

  permissions: "/permissions",
  permission: (id) => `/permissions/${id}`,

  plans: "/plans",

  plan: (id) => `/plans/${encodeURIComponent(id)}`,

  planStatus: (id) => `/plans/${encodeURIComponent(id)}`,

  tendors: "/tendors",
  tendor: (id) => `/tendors/${id}`,

  tendors: "/tendors",
  tendor: (id) => `/tendors/${id}`,

  employees: "/employees",
  employeeList: "/merchants/employees",
  // Devices
  devices: "/devices",
  device: (id) => `/devices/${encodeURIComponent(id)}`,
};
