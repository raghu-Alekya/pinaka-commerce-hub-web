import { api } from "./http";
import { listStoreEmployees } from "./employees";
import { getDevice, listAllDevicesByMerchantId } from "./devices";

import { getStoreDeviceMappings } from "./storeDeviceMappings";

export async function listStoreShifts(merchantId, storeId, { signal, onEmployees, onEmployeeError, onDevices, onDeviceError } = {}) {
  if (!storeId) throw new Error("Store is required to load shifts.");
  const base = (import.meta.env.VITE_POS_API_BASE_URL || "/connector/api/v1/pos").replace(/\/+$/, "");
  const url = new URL(`${base}/stores/${encodeURIComponent(storeId)}/shifts`, window.location.origin);
  const response = await api.get(url.toString(), { signal });
  if (response?.success === false) throw new Error(response.message || "Unable to load shifts.");
  const shifts = response?.shifts ?? response?.data?.shifts;
  if (!Array.isArray(shifts)) throw new Error("The shifts API returned an invalid response.");
  const ownerId = merchantId || response?.merchant_id || response?.merchantId || response?.data?.merchant_id || response?.data?.merchantId || shifts.find(shift => shift.merchantId || shift.merchant_id)?.merchantId || shifts.find(shift => shift.merchant_id)?.merchant_id;
  const [employeeResult, deviceResult, mappingResult] = await Promise.allSettled([
    ownerId ? listStoreEmployees(ownerId, storeId) : Promise.reject(new Error("Merchant information is unavailable for employee filters.")),
    ownerId ? listAllDevicesByMerchantId(ownerId) : Promise.resolve([]),
    getStoreDeviceMappings(storeId),
  ]);
  const employeeNames = new Map();
  const employeeCodes = new Map();
  const deviceNames = new Map();
  if (employeeResult.status === "fulfilled") {
    const options = normalizeShiftEmployees(employeeResult.value);
    if (!signal?.aborted) onEmployees?.(options);
    for (const employee of options) {
      for (const id of [employee.id, employee.employeeId]) {
        if (id && employee.name) employeeNames.set(String(id), employee.name);
        if (id && employee.code) employeeCodes.set(String(id), employee.code);
      }
    }
  }
  if (employeeResult.status === "rejected" && !signal?.aborted) onEmployeeError?.("Unable to load employee filters. Please retry.");
  if (deviceResult.status === "fulfilled") {
    for (const device of deviceResult.value) {
      for (const id of [device.id, device.deviceId, device.code, device.serial, device.terminalId, device.terminal_id]) {
        if (id && device.name) deviceNames.set(String(id), device.name);
      }
    }
  }
  if (mappingResult.status === "fulfilled") {
    const results = await Promise.allSettled(mappingResult.value.map(async mapping => {
      const id = String(mapping.device_id || mapping.deviceId || mapping.device?.id || "");
      if (!id || mapping.is_mapped === false || mapping.isMapped === false) return null;
      let device = (deviceResult.status === "fulfilled" ? deviceResult.value : []).find(device => String(device.id) === id || String(device.deviceId) === id);
      if (!device) device = mapping.device || await getDevice(id);
      const name = device.name || device.device_name || device.deviceName || mapping.device_name || mapping.deviceName;
      if (!name) throw new Error("Device name unavailable.");
      const ids = [...new Set([id, device.id, device.deviceId, device.device_id, device.code, device.serial, device.terminalId, device.terminal_id].filter(Boolean).map(String))];
      for (const alias of ids) deviceNames.set(alias, name);
      return { id, name, ids };
    }));
    if (!signal?.aborted) {
      onDevices?.(results.filter(result => result.status === "fulfilled" && result.value).map(result => result.value).sort((a, b) => a.name.localeCompare(b.name)));
      if (results.some(result => result.status === "rejected")) onDeviceError?.("Some device names could not be loaded. Please retry.");
    }
  } else if (!signal?.aborted) onDeviceError?.("Unable to load the device filter. Please retry.");
  return shifts.map((shift) => resolveShiftNames(shift, employeeNames, deviceNames, employeeCodes));
}

export function normalizeShiftEmployees(response) {
  const rows = Array.isArray(response) ? response : response?.employees ?? response?.data?.employees ?? response?.data ?? [];
  if (!Array.isArray(rows) || response?.success === false) throw new Error("Invalid store employee response.");
  const options = rows.map(employee => ({
    id: String(employee.employeeId || employee.employee_id || employee.id || ""),
    employeeId: String(employee.id || employee.employeeId || employee.employee_id || ""),
    code: String(employee.employeeCode || employee.employee_code || ""),
    name: employee.name || employee.fullName || employee.full_name || [employee.firstName ?? employee.first_name, employee.lastName ?? employee.last_name].filter(Boolean).join(" "),
  })).filter(employee => employee.id && employee.name);
  return [...new Map(options.map(employee => [employee.id, employee])).values()].sort((a, b) => a.name.localeCompare(b.name));
}

const metaValue = (row, name) => {
  const items = Array.isArray(row?.meta) ? row.meta : Array.isArray(row?.shift_meta) ? row.shift_meta : [];
  const match = items.find((item) => (item?.meta_name || item?.metaName) === name && item?.status !== "INACTIVE");
  return match ? (match.meta_value ?? match.metaValue) : undefined;
};
const textMeta = (row, name) => {
  const value = metaValue(row, name);
  return value == null || value === "" ? "" : String(value);
};

export function resolveShiftNames(shift, employeeNames, deviceNames, employeeCodes = new Map()) {
  const deviceName = (...ids) => ids.map(id => id && deviceNames.get(String(id))).find(Boolean) || "";
  const openedByEmployeeId = shift.openedByEmployeeId || shift.created_by || "";
  const closedByEmployeeId = shift.closedByEmployeeId || shift.closed_by || "";
  const openingDeviceId = shift.openingDeviceId || shift.opening_device_id || shift.device_id || "";
  const closingDeviceId = shift.closingDeviceId || shift.closing_device_id || shift.closed_by_device_id || "";
  const registerId = shift.registerId || textMeta(shift, "register_id");
  const terminalId = shift.terminalId || shift.device_id || "";
  return {
    ...shift,
    openedByEmployeeId,
    closedByEmployeeId,
    openingDeviceId,
    closingDeviceId,
    closed_by_device_id: shift.closed_by_device_id || closingDeviceId,
    terminalId,
    registerId,
    cashierName: shift.cashierName || textMeta(shift, "cashier_name"),
    openedByName: employeeNames.get(String(openedByEmployeeId)) || shift.cashierName || textMeta(shift, "cashier_name") || "",
    closedByName: employeeNames.get(String(closedByEmployeeId)) || shift.closedByEmployeeName || "",
    openedByCode: employeeCodes.get(String(openedByEmployeeId)) || "",
    closedByCode: employeeCodes.get(String(closedByEmployeeId)) || "",
    openingDeviceName: deviceName(openingDeviceId, terminalId, registerId),
    closingDeviceName: deviceName(closingDeviceId, shift.closed_by_device_id),
  };
}

const amount = (value) => value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
const timestamp = (value) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
};
const pad = (value) => String(value).padStart(2, "0");
const transactionSum = (row, type) => {
  const items = Array.isArray(row?.transactions) ? row.transactions : [];
  const matches = items.filter((item) => String(item?.transaction_type || item?.transactionType || "").toUpperCase() === type && item?.status !== "INACTIVE");
  if (!matches.length) return null;
  return matches.reduce((total, item) => total + Number(item.total_sum ?? item.totalSum ?? 0), 0);
};
const firstAmount = (...values) => {
  for (const value of values) {
    const parsed = amount(value);
    if (parsed != null) return parsed;
  }
  return null;
};

export function normalizeShift(row) {
  const opened = timestamp(row.openedAt || row.opened_at);
  const closed = timestamp(row.closedAt || row.closed_at);
  const seconds = opened && closed ? Math.max(0, Math.floor((closed - opened) / 1000)) : null;
  const orderSales = row.order_sales || row.orderSales || {};
  const cashSales = firstAmount(transactionSum(row, "CASH_SALE"), row.totalCashSales, orderSales.cash);
  const cardSales = firstAmount(transactionSum(row, "CARD_SALE"), row.totalCardSales, orderSales.card);
  const ebtSales = firstAmount(transactionSum(row, "EBT_SALE"), row.total_ebt_sales);
  const payLater = firstAmount(transactionSum(row, "PAY_LATER"), row.total_pay_later);
  const payoutParts = ["PAYOUT", "PAID_OUT", "VENDOR_PAYMENT"].map((type) => transactionSum(row, type)).filter((value) => value != null);
  const saleParts = [cashSales, cardSales, ebtSales, payLater].filter((value) => value != null);
  return {
    id: row.id,
    date: opened ? `${opened.getFullYear()}-${pad(opened.getMonth() + 1)}-${pad(opened.getDate())}` : "",
    openedBy: row.openedByName || row.cashierName || textMeta(row, "cashier_name") || "",
    openedCode: row.openedByCode || "",
    openedByEmployeeId: String(row.openedByEmployeeId || row.created_by || ""),
    closedByEmployeeId: String(row.closedByEmployeeId || row.closed_by || ""),
    closedBy: row.closedByName || "",
    closedCode: row.closedByCode || "",
    deviceIds: [row.openingDeviceId, row.opening_device_id, row.device_id, row.terminalId, row.registerId, textMeta(row, "register_id"), row.closed_by_device_id, row.closingDeviceId, row.closing_device_id].filter(Boolean).map(String),
    openDevice: row.openingDeviceName || row.opening_device_id || row.device_id || "",
    closeDevice: row.closingDeviceName || row.closing_device_id || row.closed_by_device_id || "",
    openTime: row.openedAt || row.opened_at || "",
    closeTime: row.closedAt || row.closed_at || "",
    duration: seconds == null ? "—" : `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`,
    status: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase() : "Unknown",
    openingBalance: firstAmount(row.opening_balance, row.openingCash, row.openingBalance),
    closingBalance: firstAmount(row.closing_balance, row.closingCashActual, row.closingBalance),
    expectedClosing: firstAmount(row.expected_cash_in_drawer, row.expectedCashInDrawer),
    actualClosing: firstAmount(row.closing_balance, row.closingCashActual),
    cashDifference: firstAmount(row.over_short, row.cashDifference, row.discrepancy),
    safeDrop: firstAmount(transactionSum(row, "SAFE_DROP"), row.totalSafeDrops),
    payouts: payoutParts.length ? payoutParts.reduce((total, value) => total + value, 0) : firstAmount(row.total_payouts, row.totalPaidOuts),
    cashSales, cardSales, ebtSales, payLater,
    sales: firstAmount(metaValue(row, "total_order_sale_amount"), row.total_order_sale_amount) ?? (saleParts.length ? saleParts.reduce((total, value) => total + value, 0) : null),
    paymentTotal: saleParts.length ? saleParts.reduce((total, value) => total + value, 0) : null,
    orders: firstAmount(metaValue(row, "total_orders"), row.total_orders),
    cashback: firstAmount(transactionSum(row, "CASHBACK"), row.total_cashback),
    refund: firstAmount(transactionSum(row, "REFUND"), row.total_refunds),
    voidItems: firstAmount(metaValue(row, "total_void_items"), row.total_void_items),
    cancelledOrders: firstAmount(metaValue(row, "total_cancelled_orders"), row.total_cancelled_orders),
    paymentCounts: { Cash: null, Card: null, EBT: null, "Pay Later": null },
  };
}
