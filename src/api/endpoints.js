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
  store: (id) => `/stores/${id}`,
  storeTypes: "/store-types",
  storeType: (id) => `/store-types/${encodeURIComponent(id)}`,
  storeTypeFeatures: (id) => `/store-types/${encodeURIComponent(id)}/features`,
  storeTypeFeature: (storeTypeId, featureId) =>
    `/store-types/${encodeURIComponent(storeTypeId)}/features/${encodeURIComponent(featureId)}`,
  storeConnector: (id) => `/stores/${id}/connector`,
  merchantStores: (merchantId) =>
    `/merchants/${merchantId}/stores`,

  features: "/features",
  feature: (id) => `/features/${id}`,
  featureStatus: (id) => `/features/${id}/status`,
  
  permissions: "/permissions",
  permission: (id) => `/permissions/${id}`,

  plans: "/plans",

plan: (id) =>
  `/plans/${encodeURIComponent(id)}`,

planStatus: (id) =>
  `/plans/${encodeURIComponent(id)}`,

tendors: "/tendors",
  tendor: (id) => `/tendors/${id}`,

};