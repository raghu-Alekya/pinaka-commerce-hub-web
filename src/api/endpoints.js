export const endpoints = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
  merchants: "/merchants",
  merchant: (id) => `/merchants/${id}`,
  stores: "/stores",
  store: (id) => `/stores/${id}`,
  merchantStores: (merchantId) => `/merchants/${merchantId}/stores`,
};
