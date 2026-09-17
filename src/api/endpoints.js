export const endpoints = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",

  merchants: "/merchants",
  createMerchant: "/merchants/create-merchant",
  merchant: (id) => `/merchants/${id}`,

  stores: "/stores",
  store: (id) => `/stores/${id}`,
  storeConnector: (id) => `/stores/${id}/connector`,
  merchantStores: (merchantId) =>
    `/merchants/${merchantId}/stores`,

  features: "/features",
  feature: (id) => `/features/${id}`,
  featureStatus: (id) => `/features/${id}/status`,
  
  permissions: "/permissions",
  permission: (id) => `/permissions/${id}`,
};