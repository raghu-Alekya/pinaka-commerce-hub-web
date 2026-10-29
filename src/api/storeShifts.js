import { api } from "./http";
import { listStoreEmployees } from "./employees";
import { getDevice, listAllDevicesByMerchantId } from "./devices";

import { getStoreDeviceMappings } from "./storeDeviceMappings";

export async function getShiftById(shiftId, employeeId, { signal } = {}) {
  if (!shiftId || shiftId === "—") {
    throw new Error("Shift ID is required.");
  }

  if (!employeeId) {
    throw new Error("Employee ID is required.");
  }

  const params = new URLSearchParams({
    shiftId: String(shiftId),
    employeeId: String(employeeId),
  });

  const response = await api.get(
    `/api/v1/pos/shifts/get-shift-by-id?${params.toString()}`,
    { signal }
  );

  if (response?.success === false) {
    throw new Error(response.message || "Unable to load shift details.");
  }

  return response?.data ?? response;
}

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
  const wanted = String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
  const sources = [row?.meta, row?.shift_meta, row?.metadata, row?.meta_data, row?.metaData, row?.shiftMeta, row?.shiftMetadata, row?.shift_meta_data, row?.summary, row?.totals, row?.statistics, row?.order_summary, row?.orderSummary, row?.summary_data];
  for (const source of sources) {
    if (Array.isArray(source)) {
      const match = source.find((item) =>
        [item?.meta_name, item?.metaName, item?.key, item?.name, item?.meta_key, item?.metaKey, item?.field, item?.property]
          .some(key => key != null && String(key).toLowerCase().replace(/[^a-z0-9]/g, "") === wanted)
        && String(item?.status || "").toUpperCase() !== "INACTIVE"
      );
      const value = match && (match.meta_value ?? match.metaValue ?? match.value ?? match.content ?? match.meta_data_value ?? match.metaDataValue);
      if (value !== undefined) return value;
    } else if (source && typeof source === "object") {
      const key = Object.keys(source).find(candidate => candidate.toLowerCase().replace(/[^a-z0-9]/g, "") === wanted);
      if (key !== undefined) return source[key];
    }
  }
  return undefined;
};
const textMeta = (row, name) => {
  const value = metaValue(row, name);
  return value == null || value === "" ? "" : String(value);
};
const firstValue = (...values) => values.find(value => value !== undefined && value !== null && value !== "");

export function resolveShiftNames(shift, employeeNames, deviceNames, employeeCodes = new Map()) {
  const deviceName = (...ids) => ids.map(id => id && deviceNames.get(String(id))).find(Boolean) || "";
  const openedByEmployeeId = firstValue(shift.openedByEmployeeId, shift.opened_by_employee_id, shift.started_by_employee_id, shift.employee_id, shift.created_by, shift.opened_by_id, "");
  const closedByEmployeeId = firstValue(shift.closedByEmployeeId, shift.closed_by_employee_id, shift.closed_by_user_id, shift.closedByUserId, shift.closed_by, "");
  const openingDeviceId = firstValue(shift.openingDeviceId, shift.opening_device_id, shift.opened_device_id, shift.device_id, shift.terminal_id, "");
  const closingDeviceId = firstValue(shift.closingDeviceId, shift.closing_device_id, shift.closedDeviceId, shift.closed_device_id, shift.closedByDeviceId, shift.closed_by_device_id, shift.closing_device_uuid, shift.closed_by_device_uuid, shift.device_id, shift.terminal_id, "");
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
    cashierName: firstValue(shift.cashierName, shift.cashier_name, shift.openedByName, shift.opened_by_name, textMeta(shift, "cashier_name"), ""),
    openedByName: employeeNames.get(String(openedByEmployeeId)) || firstValue(shift.openedByName, shift.opened_by_name, shift.started_by_name, shift.cashierName, shift.cashier_name, textMeta(shift, "cashier_name"), ""),
    closedByEmployeeName: firstValue(shift.closedByEmployeeName, shift.closed_by_employee_name, shift.closed_by_user_name, shift.closedByUserName, shift.closed_by_name, ""),
    closedByName: employeeNames.get(String(closedByEmployeeId)) || firstValue(shift.closedByEmployeeName, shift.closed_by_employee_name, shift.closed_by_user_name, shift.closedByUserName, shift.closed_by_name, ""),
    openedByCode: employeeCodes.get(String(openedByEmployeeId)) || "",
    closedByCode: employeeCodes.get(String(closedByEmployeeId)) || "",
    openingDeviceName: firstValue(shift.openingDeviceName, shift.opening_device_name, shift.opened_device_name, shift.device_name, deviceName(openingDeviceId, terminalId, registerId), ""),
    closingDeviceName: firstValue(shift.closingDeviceName, shift.closing_device_name, shift.closed_device_name, shift.closed_by_device_name, shift.closedByDeviceName, deviceName(closingDeviceId, shift.closed_by_device_id), ""),
  };
}

const amount = (value) => value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
const timestamp = (value) => {
  const normalized = typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value) ? value.replace(" ", "T") : value;
  const date = normalized ? new Date(normalized) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
};
const pad = (value) => String(value).padStart(2, "0");
const transactionSum = (row, type) => {
  const sources = [row?.transactions, row?.shiftTransactions, row?.shift_transactions, row?.transaction_details, row?.shift_transaction_details];
  // APIs may include an empty `transactions` array alongside populated
  // shift_transactions/transaction_details arrays. Read every source so the
  // empty first array does not hide payment records in a later one.
  const items = [...new Set(sources.flatMap(source => Array.isArray(source) ? source : []))];
  const matches = items.filter((item) => {
    const labels = [item?.transaction_type, item?.transactionType, item?.transaction_kind, item?.type, item?.payment_type, item?.paymentMethod, item?.payment_method, item?.category, item?.transaction_category, item?.transactionCategory, item?.method]
      .filter(Boolean).map(value => String(value).toUpperCase().replace(/[\s-]+/g, "_"));
    const wanted = type.split("_");
    const exact = labels.includes(type);
    const method = labels.some(label => label === wanted[0] || label.startsWith(`${wanted[0]}_`));
    const saleLike = labels.some(label => label.includes("SALE") || label.includes("ORDER") || label.includes("PAYMENT"));
    const matchesMethod = type === "CASH_SALE" ? method && saleLike
      : type === "CARD_SALE" ? (method && saleLike) || labels.includes("CARD")
      : type === "EBT_SALE" ? (method && saleLike) || labels.includes("EBT")
      : type === "PAY_LATER" ? labels.some(label => label.includes("PAY_LATER") || label.includes("PAYLATER"))
      : false;
    return (exact || matchesMethod) && String(item?.status || "").toUpperCase() !== "INACTIVE";
  });
  if (!matches.length) return null;
  return matches.reduce((total, item) => total + Number(item.total_sum ?? item.totalSum ?? item.total_amount ?? item.totalAmount ?? item.amount ?? item.transaction_amount ?? item.value ?? 0), 0);
};
const firstAmount = (...values) => {
  for (const value of values) {
    const parsed = amount(value);
    if (parsed != null) return parsed;
  }
  return null;
};

export function normalizeShift(row) {
  row = { ...(row?.shift || row?.shiftData || row?.shift_data || row?.shift_summary || row?.summary || row?.totals || row?.statistics || row?.order_summary || row?.orderSummary || row?.summary_data || row?.data || row?.payload || {}), ...row };
  const openedAt = firstValue(row.openedAt, row.opened_at, row.open_time, row.openTime, row.started_at, row.start_time, row.shift_start_time, row.created_at);
  const closedAt = firstValue(row.closedAt, row.closed_at, row.close_time, row.closeTime, row.ended_at, row.end_time, row.shift_end_time);
  const opened = timestamp(openedAt);
  const closed = timestamp(closedAt);
  const seconds = opened && closed ? Math.max(0, Math.floor((closed - opened) / 1000)) : null;
  const orderSales = row.order_sales || row.orderSales || row.sales_by_payment_method || row.payment_summary || row.paymentSummary || row.payment_totals || row.paymentTotals || {};
  const reportedCashSales = firstAmount(transactionSum(row, "CASH_SALE"), row.cash_total, row.cashTotal, row.cash_amount, row.cashAmount, row.totalCashSales, row.total_cash_sales, row.cash_sales, orderSales.cash, orderSales.Cash, orderSales.cash_sales);
  const cardSales = firstAmount(transactionSum(row, "CARD_SALE"), row.card_total, row.cardTotal, row.card_amount, row.cardAmount, row.totalCardSales, row.total_card_sales, row.card_sales, orderSales.card, orderSales.Card, orderSales.credit_card, orderSales.creditCard, orderSales.card_sales);
  const ebtSales = firstAmount(transactionSum(row, "EBT_SALE"), row.ebt_total, row.ebtTotal, row.ebt_amount, row.ebtAmount, row.total_ebt_sales, row.ebt_sales, orderSales.ebt, orderSales.EBT, orderSales.ebt_sales);
  const payLater = firstAmount(transactionSum(row, "PAY_LATER"), row.pay_later_total, row.payLaterTotal, row.pay_later_amount, row.payLaterAmount, row.total_pay_later, row.pay_later_sales, orderSales.pay_later, orderSales.payLater, orderSales.pay_later_sales);
  const payoutParts = ["PAYOUT", "PAID_OUT", "VENDOR_PAYMENT"].map((type) => transactionSum(row, type)).filter((value) => value != null);
  const reportedTotalSales = firstAmount(
    metaValue(row, "total_order_sale_amount"), metaValue(row, "total_sales_amount"), metaValue(row, "total_order_sales_amount"),
    row.total_sale_amount, row.totalSaleAmount, row.total_order_sale_amount, row.totalOrderSaleAmount, row.total_order_sales_amount, row.totalOrderSalesAmount,
    row.total_sales_amount, row.sales_total, row.order_sales_total, row.orderSalesTotal, row.salesAmount,
  );
  // The POS detail response reports aggregate sales plus card/EBT/pay-later
  // totals, but often omits cash. In that response shape cash is the remaining
  // tender amount after the reported non-cash methods.
  const cashSales = reportedCashSales ?? (reportedTotalSales == null ? null : reportedTotalSales - (cardSales ?? 0) - (ebtSales ?? 0) - (payLater ?? 0));
  const saleParts = [cashSales, cardSales, ebtSales, payLater].filter((value) => value != null);
  const totalSales = reportedTotalSales ?? (saleParts.length ? saleParts.reduce((total, value) => total + value, 0) : null);
  return {
    id: firstValue(row.shiftid, row.shiftId, row.shift_id, row.shift_uuid, row.shiftUuid, row.shift_identifier, row.shiftIdentifier, row.id, row.uuid, "—"),
    date: opened ? `${opened.getFullYear()}-${pad(opened.getMonth() + 1)}-${pad(opened.getDate())}` : firstValue(row.shift_date, row.shiftDate, row.date, ""),
    openedBy: firstValue(row.openedByName, row.opened_by_name, row.cashierName, row.cashier_name, row.user_name, row.userName, ""),
    openedCode: row.openedByCode || "",
    openedByEmployeeId: String(firstValue(row.openedByEmployeeId, row.opened_by_employee_id, row.started_by_employee_id, row.employee_id, row.user_id, row.created_by, "")),
    closedByEmployeeId: String(firstValue(row.closedByEmployeeId, row.closed_by_employee_id, row.closed_by_user_id, row.closedByUserId, row.closed_by, "")),
    closedBy: firstValue(row.closedByName, row.closed_by_name, row.closedByEmployeeName, row.closed_by_employee_name, row.closed_by_user_name, row.closedByUserName, ""),
    closedCode: row.closedByCode || "",
    deviceIds: [row.openingDeviceId, row.opening_device_id, row.opened_device_id, row.device_id, row.terminalId, row.terminal_id, row.registerId, textMeta(row, "register_id"), row.closed_by_device_id, row.closingDeviceId, row.closing_device_id, row.closed_device_id].filter(Boolean).map(String),
    openDevice: firstValue(row.openingDeviceName, row.opening_device_name, row.opened_device_name, row.device_name, row.opening_device_id, row.device_id, ""),
    closeDevice: firstValue(row.closingDeviceName, row.closing_device_name, row.closed_device_name, row.closed_by_device_name, row.closedByDeviceName, row.closingDeviceId, row.closing_device_id, row.closedDeviceId, row.closed_device_id, row.closedByDeviceId, row.closed_by_device_id, row.closing_device_uuid, row.closed_by_device_uuid, row.device_id, ""),
    openTime: openedAt || "",
    closeTime: closedAt || "",
    duration: seconds == null
      ? firstValue(row.duration, row.duration_label, row.shift_duration, "—")
      : `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`,
    status: (row.status || row.shift_status) ? String(row.status || row.shift_status).charAt(0).toUpperCase() + String(row.status || row.shift_status).slice(1).toLowerCase() : "Unknown",
    openingBalance: firstAmount(row.opening_balance, row.opening_cash, row.openingCash, row.openingBalance, row.starting_balance),
    closingBalance: firstAmount(row.closing_balance, row.closing_cash, row.closingCashActual, row.closingBalance, row.actual_closing_balance),
    expectedClosing: firstAmount(row.expected_cash_in_drawer, row.expectedCashInDrawer, row.expected_closing_balance, row.expectedClosingBalance),
    actualClosing: firstAmount(row.closing_balance, row.closing_cash, row.closingCashActual, row.closingBalance, row.actual_closing_balance),
    cashDifference: firstAmount(row.over_short, row.cashDifference, row.discrepancy, row.cash_difference),
    title: firstValue(row.title, ""),
    assignedStaff: firstAmount(row.assigned_staff, row.assignedStaff),
    tillAmount: firstAmount(row.till_amount, row.tillAmount),
    openingSafeCash: firstAmount(row.opening_safe_cash, row.openingSafeCash, metaValue(row, "opening_safe_cash"), metaValue(row, "opening_safe_cash_amount"), metaValue(row, "safe_cash_opening")),
    vendorPayments: firstAmount(row.total_vendor_payments, row.totalVendorPayments),
    safeDrops: Array.isArray(row.safe_drops) ? row.safe_drops : Array.isArray(row.safeDrops) ? row.safeDrops : [],
    vendorPayouts: Array.isArray(row.vendor_payouts) ? row.vendor_payouts : Array.isArray(row.vendorPayouts) ? row.vendorPayouts : [],
    notes: firstValue(row.notes, ""),
    shiftClosingNotes: firstValue(row.shift_closing_notes, row.shiftClosingNotes, ""),
    safeDrop: firstAmount(transactionSum(row, "SAFE_DROP"), row.safe_drop_total, row.safeDropTotal, row.totalSafeDrops, row.total_safe_drops, row.safe_drop,
      Array.isArray(row.safe_drops) ? row.safe_drops.reduce((sum, drop) => sum + Number(drop?.safe_data?.total_cash ?? drop?.total_cash ?? drop?.amount ?? drop?.total ?? 0), 0) : null),
    payouts: payoutParts.length ? payoutParts.reduce((total, value) => total + value, 0) : firstAmount(row.total_payouts, row.totalPaidOuts, row.total_paid_outs, row.payout_total, row.payoutTotal, row.total_payout_amount, row.totalPayoutAmount, row.payouts),
    cashSales, cardSales, ebtSales, payLater,
    sales: totalSales,
    paymentTotal: saleParts.length ? saleParts.reduce((total, value) => total + value, 0) : totalSales,
    orders: firstAmount(metaValue(row, "total_orders"), metaValue(row, "orders_count"), row.total_sales, row.totalSales, row.total_orders, row.totalOrders, row.order_count, row.orders_count, row.number_of_orders, row.numberOfOrders, row.total_order_count, row.totalOrderCount),
    cashback: firstAmount(transactionSum(row, "CASHBACK"), row.cashback_amount, row.cashbackAmount, row.total_cashback, row.totalCashback, row.total_cashback_amount, row.totalCashbackAmount, row.cashback),
    refund: firstAmount(transactionSum(row, "REFUND"), row.refund_total, row.refundTotal, row.total_refunds, row.total_refund, row.totalRefunds, row.total_refund_amount, row.totalRefundAmount, row.refund),
    voidItems: firstAmount(metaValue(row, "total_void_items"), row.void_items_count, row.voidItemsCount, row.total_void_items, row.totalVoidItems, row.void_items, row.voidItems),
    cancelledOrders: firstAmount(metaValue(row, "total_cancelled_orders"), row.total_cancelled_orders, row.totalCancelledOrders, row.cancelled_orders, row.cancelledOrders, row.cancelled_orders_count),
    paymentCounts: { Cash: null, Card: null, EBT: null, "Pay Later": null },
  };
}
