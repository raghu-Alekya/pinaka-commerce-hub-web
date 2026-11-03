import { api } from "./http";
import { listMerchantEmployees } from "./employees";

const formatPaymentDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
    : "—";
};

export function normalizeVendorPayment(row, employeeNames = new Map()) {
  const amount = row.amount == null || row.amount === "" ? NaN : Number(row.amount);
  return {
    id: row.id,
    title: row.payment_name || row.code || "—",
    vendor: row.vendor_name || "—",
    createdBy: employeeNames.get(String(row.created_by)) || row.created_by_name || "—",
    updatedBy: employeeNames.get(String(row.updated_by)) || row.updated_by_name || "—",
    purpose: row.description || "—",
    method: String(row.payment_mode || "").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()),
    amount: Number.isFinite(amount) ? amount.toFixed(2) : "—",
    createdAt: formatPaymentDate(row.created_at),
    updatedAt: formatPaymentDate(row.updated_at),
  };
}

export async function listStoreVendorPayments(merchantId, storeId, { signal } = {}) {
  if (!merchantId || !storeId) throw new Error("Merchant and store information is required to load vendor payments.");
  const base = (import.meta.env.VITE_VENDOR_PAYMENTS_API_BASE_URL || "/connector/api/v1").replace(/\/+$/, "");
  const url = new URL(`${base}/store-vendor-payments/by-store`, window.location.origin);
  url.searchParams.set("merchant_id", merchantId);
  url.searchParams.set("store_id", storeId);
  const response = await api.get(url.toString(), { signal });
  const payments = response?.payments ?? response?.data?.payments;
  if (response?.success === false || !Array.isArray(payments)) throw new Error(response?.message || "Unable to load vendor payments.");
  const employeeNames = new Map();
  const employees = await listMerchantEmployees(merchantId).catch(() => []);
  for (const employee of employees) {
    const name = employee.name || employee.fullName || [employee.firstName, employee.lastName].filter(Boolean).join(" ");
    if (!name) continue;
    for (const id of [employee.id, employee.employeeId, employee.employee_id, employee.userId, employee.user_id]) {
      if (id) employeeNames.set(String(id), name);
    }
  }
  return payments.filter(row => !row.is_deleted).map(row => normalizeVendorPayment(row, employeeNames));
}
