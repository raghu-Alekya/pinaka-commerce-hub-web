export const roleTemplate = {
  id: "store-manager",
  name: "Store Manager",
  code: "STORE_MANAGER",
  description: "Full store operations access.",
  status: "Active",
};

export const storeTypes = [
  { id: "retail", name: "Retail", code: "RETAIL" },
  { id: "restaurant", name: "Restaurant", code: "RESTAURANT" },
  { id: "spa", name: "Spa", code: "SPA" },
  { id: "kiosk", name: "Kiosk", code: "KIOSK" },
];

export const featurePermissions = [
  {
    id: "pos",
    name: "Point of Sale",
    code: "POS",
    description: "Manage sales, checkout, payments and POS operations.",
    permissions: [
      ["view-pos", "View POS", "VIEW_POS"],
      ["create-order", "Create Order", "CREATE_ORDER"],
      ["edit-order", "Edit Order", "EDIT_ORDER"],
      ["void-order", "Void Order", "VOID_ORDER"],
      ["refund-order", "Refund Order", "REFUND_ORDER"],
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    code: "INVENTORY",
    description: "Manage stock, products and inventory operations.",
    permissions: [
      ["view-inventory", "View Inventory", "VIEW_INVENTORY"],
      ["adjust-stock", "Adjust Stock", "ADJUST_STOCK"],
      ["manage-products", "Manage Products", "MANAGE_PRODUCTS"],
    ],
  },
];