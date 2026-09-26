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
  merchantStores: (merchantId) => `/merchants/${merchantId}/stores`,

  // Merchant Employees (Connector API)
  employees: "/merchants/employees",
  employee: (id) => `/merchants/employees/${encodeURIComponent(id)}`,
  merchantEmployees: (merchantId, status = "ACTIVE") =>
    `/connector/api/v1/merchants/${encodeURIComponent(merchantId)}/employees${
      status ? `?status=${encodeURIComponent(status)}` : ""
    }`,
  merchantEmployee: (merchantId, employeeId) =>
    `/merchants/${encodeURIComponent(merchantId)}/employees/${encodeURIComponent(employeeId)}`,
  employeeProfileImage: (employeeId) =>
    `/merchants/employees/${encodeURIComponent(employeeId)}/profile-image`,

  // Subscriptions (Connector API)
  merchantActiveSubscriptions: (merchantId) =>
    `/connector/api/v1/merchants/subscriptions/active?merchantId=${encodeURIComponent(merchantId)}`,

  // Store Types & Features
  storeTypes: "/store-types",
  storeType: (id) => `/store-types/${encodeURIComponent(id)}`,
  storeTypeFeatures: (id) => `/store-types/${encodeURIComponent(id)}/features`,
  features: "/features",
  feature: (id) => `/features/${id}`,
  permissions: "/permissions",
  plans: "/plans",
  plan: (id) => `/plans/${encodeURIComponent(id)}`,
  devices: "/devices",
  device: (id) => `/devices/${encodeURIComponent(id)}`,
  deviceTypes: "/device-types",
};
