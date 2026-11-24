const ROUTE_MODULES = [
  ["/access", "access-permissions"],
  ["/feature-permissions", "feature-permissions"],
  ["/role-templates", "role-templates"],
  ["/store-types", "store-types"],
  ["/pos-configuration", "pos-configuration"],
  ["/merchant-subscriptions", "subscriptions"],
  ["/subscriptions", "subscriptions"],
  ["/merchants", "merchants"],
  ["/products", "products"],
  ["/coupons", "coupons"],
  ["/employees", "employees"],
  ["/devices", "devices"],
  ["/vendors", "vendors"],
  ["/orders", "orders"],
  ["/stores", "stores"],
  ["/features", "features"],
  ["/plans", "plans"],
  ["/tenders", "tenders"],
  ["/integrations", "integrations"],
  ["/synchronization", "synchronization"],
  ["/reconciliation", "reconciliation"],
  ["/notifications", "notifications"],
  ["/cash-management", "cash-management"],
];

export const MENU_MODULES = {
  "/dashboard": "dashboard",
  "/merchants": "merchants",
  "/stores": "stores",
  "/subscriptions": "subscriptions",
  "/vendors": "vendors",
  "/orders": "orders",
  "/employees": "employees",
  "/devices": "devices",
  "/products": "products",
  "/coupons": "coupons",
  "/pos-configuration": "pos-configuration",
  "/access": "access-permissions",
  "/store-types/new": "store-types",
  "/features": "features",
  "/feature-permissions": "feature-permissions",
  "/role-templates": "role-templates",
  "/plans/new": "plans",
  "/tenders": "tenders",
  "/integrations": "integrations",
  "/synchronization": "synchronization",
  "/reconciliation": "reconciliation",
  "/notifications": "notifications",
};

export function isUnrestricted(user) {
  const accountType = String(user?.accountType || "").toLowerCase();
  const role = String(user?.role || "").toLowerCase();
  return accountType === "admin" || accountType === "super_admin" || (!accountType && ["owner", "admin", "super_admin"].includes(role));
}

export function can(user, moduleName, action = "view") {
  if (!moduleName || isUnrestricted(user)) return true;
  const grants = user?.permissions || user?.grants || [];
  const grant = grants.find((item) => item.menuKey === moduleName);
  return Boolean(grant?.actions?.includes(action));
}

export function moduleForRoute(pathname) {
  const match = ROUTE_MODULES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? match[1] : null;
}
