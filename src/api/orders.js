import { api } from "./http";
import { endpoints } from "./endpoints";
import { formatCurrency, getCurrencySymbol } from "../utils/currency";

function metaValue(entries, key) {
  const match = (Array.isArray(entries) ? entries : []).find((entry) => entry?.key === key);
  return match?.value;
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeOrderStatus(value) {
  const status = titleCase(value || "Created");
  return status.toLowerCase() === "created" ? "Pending Payment" : status;
}

export function currencySymbol(currency = "USD") {
  return getCurrencySymbol(currency);
}

export function formatMoney(value, currency = "USD", savedSymbol) {
  return formatCurrency(value, currency, savedSymbol);
}

export function normalizeOrder(order = {}) {
  const createdAt = order.createdAt || order.created_at || order.date_created || order.date || "";
  const created = createdAt ? new Date(createdAt) : null;
  const validDate = created && !Number.isNaN(created.getTime());
  const currency = order.currency || "USD";
  const savedCurrencySymbol = order.currencySymbol || order.currency_symbol || getCurrencySymbol(currency);
  const totalValue = Number(order.totalAmount ?? order.total_amount ?? order.total ?? 0);
  const metadata = order.metadata || order.meta_data || [];
  const clientOrderId = order.clientOrderId || order.client_order_id || metaValue(metadata, "_pos_client_order_id") || "";
  return {
    id: order.id || order.orderUuid || order.order_uuid || order.orderId || order.order_id,
    wooOrderId: String(order.orderNumber || order.order_number || order.wooOrderId || order.woo_order_id || order.number || order.orderId || order.order_id || order.id || "").replace(/^#/, ""),
    offlineOrderId: clientOrderId,
    createdAt,
    date: validDate
      ? created.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      : "—",
    time: validDate
      ? created.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "",
    status: normalizeOrderStatus(order.orderStatus || order.order_status || order.status || "Created"),
    author: order.customerName || order.customer_name || order.customer || metaValue(metadata, "pos_placed_by") || "Walk-in Customer",
    paymentMethod: titleCase(order.paymentMethod || order.payment_method || ""),
    totalValue: Number.isFinite(totalValue) ? totalValue : 0,
    total: formatMoney(totalValue, currency, savedCurrencySymbol),
    currency,
    currencySymbol: savedCurrencySymbol,
    merchantId: order.merchantId || order.merchant_id || order.merchant?.id || order.merchant?.merchantId || "",
    storeId: order.storeId || order.store_id || order.storeUuid || order.storeUUID || order.store_uuid || order.store?.id || order.store?.storeId || order.storeCode || order.store_code || "",
  };
}

export async function listOrders(storeId) {
  const result = await listScopedOrders({ storeId });
  return result.orders;
}

// Load every matching database row so the UI can count the same records it
// displays, without relying on a separate summary/count value.
export async function listScopedOrders({ merchantId, storeId, perPage = 100 } = {}) {
  const headers = {
    ...(merchantId ? { "x-merchant-id": String(merchantId) } : {}),
    ...(storeId ? { "x-store-id": String(storeId) } : {}),
  };
  const orders = [];
  const seenOrderIds = new Set();
  let page = 1;
  do {
    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (storeId) query.set("storeId", String(storeId));
    const response = await api.get(`${endpoints.allMerchantOrders}?${query}`, { headers });
    const payload = response?.data?.data && typeof response.data.data === "object"
      ? response.data.data
      : response?.data && typeof response.data === "object" ? response.data : response;
    if (payload?.success === false) throw new Error(payload.message || "Unable to load orders.");
    const rows = Array.isArray(payload?.orders) ? payload.orders : [];
    if (!rows.length) break;
    const newRows = rows.filter((row, index) => {
      const id = String(row?.id ?? row?.order_id ?? `page-${page}-row-${index}`);
      if (seenOrderIds.has(id)) return false;
      seenOrderIds.add(id);
      return true;
    });
    if (!newRows.length) break;
    orders.push(...newRows.map(normalizeOrder));
    page += 1;
  } while (true);
  return { orders, total: orders.length };
}

export async function getOrder(orderId, storeId) {
  return api.get(endpoints.order(orderId), {
    headers: storeId ? { "x-store-id": storeId } : undefined,
  });
}
