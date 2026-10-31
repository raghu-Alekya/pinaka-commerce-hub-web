import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag, CreditCard, CircleDollarSign, Package, ReceiptText } from "lucide-react";
import { formatMoney, getOrder, normalizeOrderStatus } from "../api/orders";
import { listStorePosPayments } from "../api/storePosPayments";
import { listStoreEmployees } from "../api/employees";
import { extractProducts, normalizeProduct, productsApi } from "../api/products";
import "../styles/orders.css";
import "../styles/employee-view.css";

function metaValue(entries, key) {
  const match = asArray(entries).find((entry) => entry?.key === key)
  return match?.value;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function metaValueFrom(entries, keys) {
  for (const key of keys) {
    const value = metaValue(entries, key);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleCase(value) {
  const text = String(value || "").replace(/^#/, "").replace(/_/g, " ").trim();
  if (!text) return "—";
  return text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function paymentTransactionId(payment = {}) {
  const candidates = [
    payment.providerTransactionId, payment.provider_transaction_id,
    payment.transactionId, payment.transaction_id,
    payment.transactionNumber, payment.transaction_number,
    payment.txnId, payment.txn_id,
    payment.transactionReference, payment.transaction_reference,
    payment.paymentReference, payment.payment_reference,
    payment.reference,
    payment.transaction?.id, payment.provider_transaction?.id,
    payment.localId, payment.local_id,
  ];
  const value = candidates.find((candidate) => candidate !== undefined && candidate !== null && String(candidate).trim() !== "");
  return value === undefined ? "—" : String(value);
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("create")) return "created";
  if (value.includes("complete")) return "completed";
  if (value.includes("pending")) return "pending";
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("refund")) return "refunded";
  if (value.includes("partial")) return "partial";
  if (value.includes("inactive")) return "inactive";
  if (value.includes("active")) return "active";
  return "processing";
}

function lineItemSku(item) {
  const metadata = asArray(item.meta_data || item.metaData);
  const metadataSku = metadata.find((entry) =>
    ["sku", "product_sku", "productsku"].includes(String(entry?.key || "").toLowerCase()),
  )?.value;
  return item.sku
    || item.productSku
    || item.product_sku
    || item.product?.sku
    || item.productDetails?.sku
    || item.product_details?.sku
    || metadataSku
    || "";
}

function productCatalogMap(response) {
  const productByKey = new Map();
  extractProducts(response).forEach((raw) => {
    const product = normalizeProduct(raw);
    const catalogProduct = { ...product, raw, rawPayload: asObject(raw.payload) };
    [product.id, product.wordpressId, product.sku].filter(Boolean).forEach((key) => {
      productByKey.set(String(key).trim().toLowerCase(), catalogProduct);
    });
  });
  return productByKey;
}

function employeeNameMap(response) {
  const rows = findEmployeeRows(response);
  const names = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    const person = row?.employee || row?.user || row;
    const name = person?.name || person?.fullName || person?.full_name || person?.displayName || person?.display_name ||
      [person?.firstName ?? person?.first_name, person?.lastName ?? person?.last_name].filter(Boolean).join(" ");
    if (!name) continue;
    for (const id of [person.id, person.employeeId, person.employeeCode, person.userId, person.user_id, person.uuid,
      row.id, row.employeeId, row.employeeCode, row.userId, row.user_id, row.uuid]) {
      if (id !== undefined && id !== null && id !== "") {
        const value = String(id).trim().toLowerCase();
        names[value] = name;
        const numericSuffix = value.match(/(?:^|\D)(\d+)$/)?.[1];
        if (numericSuffix) names[String(Number(numericSuffix))] = name;
      }
    }
  }
  return names;
}

function findEmployeeRows(value, depth = 0) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || depth > 5) return [];
  for (const key of ["employees", "items", "results", "records", "content", "data"]) {
    const rows = findEmployeeRows(value[key], depth + 1);
    if (rows.length) return rows;
  }
  return [];
}

function displayPlacedBy(value, names) {
  if (!value || value === "—") return "—";
  if (typeof value === "object") return value.name || value.fullName || value.full_name || "—";
  const text = String(value).trim();
  return names[text.toLowerCase()] || names[text.replace(/\D/g, "").replace(/^0+/, "").toLowerCase()] || text;
}

function catalogProductForLineItem(item, productByKey) {
  const product = item.product || item.productDetails || item.product_details || {};
  const ids = [
    item.productId,
    item.product_id,
    product.id,
    product.productId,
    product.product_id,
    item.variationId,
    item.variation_id,
  ];
  for (const id of ids) {
    if (id !== undefined && id !== null && productByKey.has(String(id).trim().toLowerCase())) {
      return productByKey.get(String(id).trim().toLowerCase());
    }
  }
  const sku = lineItemSku(item);
  return sku ? productByKey.get(String(sku).trim().toLowerCase()) : undefined;
}

function numericPrice(...values) {
  for (const value of values) {
    if (value === undefined || value === null || String(value).trim() === "") continue;
    const amount = Number(value);
    if (Number.isFinite(amount) && amount >= 0) return amount;
  }
  return undefined;
}

function buildView(payload) {
  // The API may return the order directly or wrap it in `data` / `order`.
  const payloadData = asObject(payload?.data);
  const response = Object.keys(payloadData).length ? payloadData : asObject(payload);
  const order = asObject(response?.order || response);
  const storeOrder = asObject(response?.storeOrder || response?.store_order || order?.storeOrder || order?.store_order);
  const request = asObject(order.requestPayload || order.request_payload || storeOrder.requestPayload || storeOrder.request_payload || response.requestPayload || response.request_payload);
  const billing = asObject(request.billing || request.billingAddress || request.billing_address || order.billing || storeOrder.billing || response.billing || order.billingAddress || order.billing_address);
  const customer = asObject(order.customer || storeOrder.customer || response.customer || request.customer || order.customerDetails || order.customer_details);
  const metadata = asArray(storeOrder.metaData).length
    ? asArray(storeOrder.metaData)
    : asArray(storeOrder.metadata || storeOrder.meta_data).length
      ? asArray(storeOrder.metadata || storeOrder.meta_data)
      : asArray(order.metadata || order.meta_data || request.meta_data);
  const currency = storeOrder.currency || order.currency || request.currency || "USD";
  const rawLineItems = [
    asArray(storeOrder.lineItems),
    asArray(storeOrder.line_items),
    asArray(order.lineItems),
    asArray(order.line_items),
    asArray(request.line_items),
    asArray(response?.items),
  ].find((items) => Array.isArray(items) && items.length) || [];
  const lineItems = rawLineItems.map((item) => ({
    ...item,
    name: item.name || item.productName || item.product_name || item.title || "Item",
    sku: lineItemSku(item),
    quantity: item.quantity ?? item.qty,
    subtotal: item.subtotal ?? item.subtotalAmount ?? item.subtotal_amount ?? item.originalPrice ?? item.original_price
      ?? item.priceBeforeDiscount ?? item.price_before_discount ?? item.regularPrice ?? item.regular_price
      ?? item.totalPrice ?? item.total_price ?? item.total,
    total: item.total ?? item.discountedPrice ?? item.discounted_price ?? item.totalPrice ?? item.total_price ?? item.subtotal,
    originalUnitPrice: item.regularPrice ?? item.regular_price ?? item.originalPrice ?? item.original_price
      ?? item.priceBeforeDiscount ?? item.price_before_discount ?? item.price,
  }));
  const taxLines = [storeOrder.taxLines, storeOrder.tax_lines, order.taxLines, order.tax_lines, request.tax_lines]
    .map(asArray).find((lines) => lines.length) || [];
  const paymentRecords = [
    storeOrder.payments, storeOrder.paymentRecords, storeOrder.payment_records,
    order.payments, order.paymentRecords, order.payment_records,
    response.payments, response.paymentRecords, response.payment_records,
    request.payments, request.paymentRecords, request.payment_records,
    metaValue(metadata, "_pos_payments"), metaValue(metadata, "pos_payments"),
    metaValue(metadata, "_pos_payment_records"), metaValue(metadata, "payment_records"),
  ].map(asArray).find((records) => records.length) || [];
  const payments = paymentRecords.flatMap((record) => {
    const nested = asArray(record?.payments || record?.records || record?.paymentRecords || record?.payment_records);
    return nested.length ? nested : [record];
  });
  const subtotal = storeOrder.subtotal ?? storeOrder.subtotalAmount ?? storeOrder.subtotal_amount ?? order.subtotal ?? order.subtotalAmount ?? order.subtotal_amount;
  const couponLines = [storeOrder.couponLines, storeOrder.coupon_lines, order.couponLines, order.coupon_lines, request.couponLines, request.coupon_lines]
    .map(asArray).find((lines) => lines.length) || [];
  const allFeeLines = [storeOrder.feeLines, storeOrder.fee_lines, order.feeLines, order.fee_lines, request.feeLines, request.fee_lines]
    .map(asArray).find((lines) => lines.length) || [];
  const merchantDiscountLine = allFeeLines.find((fee) => /merchant[\s_-]*discount/i.test(String(fee?.name || fee?.title || fee?.code || "")));
  const feeLines = allFeeLines.filter((fee) => !/merchant[\s_-]*discount/i.test(String(fee?.name || fee?.title || fee?.code || "")));
  const merchantDiscount = storeOrder.merchantDiscount ?? storeOrder.merchant_discount
    ?? order.merchantDiscount ?? order.merchant_discount
    ?? request.merchantDiscount ?? request.merchant_discount
    ?? metaValueFrom(metadata, ["_merchant_discount", "merchant_discount"])
    ?? merchantDiscountLine?.total ?? merchantDiscountLine?.amount;
  const discount = storeOrder.discountTotal ?? storeOrder.discount_total ?? storeOrder.discountAmount ?? storeOrder.discount_amount
    ?? order.discountTotal ?? order.discount_total ?? order.discountAmount ?? order.discount_amount;
  const discountLines = [
    ...lineItems.flatMap((item) => {
      const itemMeta = item.meta_data || item.metaData;
      const amount = item.discountAmount ?? item.discount_amount ?? item.discount
        ?? metaValueFrom(itemMeta, ["_pos_auto_discount", "pos_auto_discount", "discount_amount"]);
      const value = Number(amount);
      return Number.isFinite(value) && value > 0 ? [{
        name: item.name,
        type: titleCase(item.discountType || item.discount_type || metaValueFrom(itemMeta, ["_pos_discount_type", "pos_discount_type"])) || "Item discount",
        amount: value,
      }] : [];
    }),
    ...(Number(merchantDiscount) > 0 ? [{
      name: "Merchant discount",
      type: "Merchant discount",
      amount: Number(merchantDiscount),
    }] : []),
  ];
  if (!discountLines.length && Number(discount) > 0) {
    discountLines.push({ name: "Discount", type: "Order discount", amount: Number(discount) });
  }
  const hasDiscount = Number(discount) > 0 || Number(merchantDiscount) > 0
    || discountLines.length > 0 || couponLines.length > 0;
  const taxLineTotal = taxLines.reduce(
    (sum, line) => sum + (Number(line.tax_total ?? line.taxTotal ?? line.amount) || 0),
    0,
  );
  const itemTaxTotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.total_tax ?? item.totalTax ?? item.tax) || 0),
    0,
  );
  const tax = storeOrder.taxTotal ?? storeOrder.tax_total ?? storeOrder.taxAmount ?? storeOrder.tax_amount
    ?? storeOrder.totalTax ?? storeOrder.total_tax ?? storeOrder.tax
    ?? order.taxTotal ?? order.tax_total ?? order.taxAmount ?? order.tax_amount
    ?? order.totalTax ?? order.total_tax ?? order.tax
    ?? request.tax_total ?? request.total_tax ?? request.cart_tax
    ?? (taxLines.length ? taxLineTotal : undefined)
    ?? (itemTaxTotal || undefined)
    ?? metaValueFrom(metadata, ["_pos_order_tax", "pos_order_tax"]);
  const total = order.totalAmount ?? order.total_amount ?? storeOrder.total ?? storeOrder.totalAmount ?? storeOrder.total_amount ?? order.total ?? request.total;
  const shownSubtotal = subtotal ?? lineItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const feeTotal = storeOrder.feeTotal ?? storeOrder.fee_total ?? order.feeTotal ?? order.fee_total
    ?? feeLines.reduce((sum, fee) => sum + (Number(fee.total ?? fee.amount) || 0), 0);
  const inferredDiscount = discountLines.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const shownDiscount = Number(discount) > 0 ? discount : inferredDiscount > 0 ? inferredDiscount : discount;
  const shownTotal = total ?? (payments.length
    ? payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    : lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0));
  const currentStatus = response.status || order.status || storeOrder.status || order.orderStatus || order.order_status;
  const inferredPaymentStatus = String(currentStatus || "").toLowerCase().includes("complete")
    ? "Paid"
    : ["created", "pending", "pending payment", "processing"].some((status) => String(currentStatus || "").toLowerCase().includes(status))
      ? "Pending Payment"
      : undefined;

  return {
    id: order.id,
    number: String(order.orderNumber || order.order_number || order.number || request.number || order.id || "").replace(/^#/, ""),
    status: normalizeOrderStatus(storeOrder.status || storeOrder.orderStatus || storeOrder.order_status || order.orderStatus || order.order_status || order.status || request.status),
    currency: storeOrder.currency || order.currency || request.currency || "USD",
    timezone: storeOrder.timezone || storeOrder.time_zone || "UTC",
    createdAt: displayDate(storeOrder.createdAt || storeOrder.created_at || order.createdAt || order.created_at || order.dateCreated || order.date_created || order.created || request.date_created || request.created_at || response.createdAt || response.created_at),
    clientOrderId: storeOrder.clientOrderId || storeOrder.client_order_id || order.clientOrderId || order.client_order_id || metaValue(metadata, "_pos_client_order_id") || "—",
    customer: storeOrder.customerName || storeOrder.customer_name || order.customerName || order.customer_name || [billing.first_name, billing.last_name].filter(Boolean).join(" ") || customer.name || "Walk-in Customer",
    phone: storeOrder.customerPhone || storeOrder.customer_phone || storeOrder.phone || order.customerPhone || order.customer_phone || order.phone || order.phoneNumber || order.phone_number || request.customerPhone || request.customer_phone || request.phone || billing.phone || billing.phoneNumber || billing.phone_number || customer.phone || customer.phoneNumber || customer.phone_number || metaValueFrom(metadata, ["billing_phone", "_billing_phone", "customer_phone", "phone"]) || "—",
    email: storeOrder.customerEmail || storeOrder.customer_email || storeOrder.email || order.customerEmail || order.customer_email || order.email || request.customerEmail || request.customer_email || request.email || billing.email || customer.email || metaValueFrom(metadata, ["billing_email", "_billing_email", "customer_email", "email"]) || "—",
    paymentMethod: titleCase(storeOrder.paymentMethodTitle || storeOrder.payment_method_title || storeOrder.paymentMethod || storeOrder.payment_method || order.paymentMethod || order.payment_method || request.payment_method),
    paymentStatus: titleCase(
      order.paymentStatus || order.payment_status || storeOrder.paymentStatus || storeOrder.payment_status || response.paymentStatus || response.payment_status
        || payments.find((payment) => payment.status || payment.paymentStatus || payment.payment_status)?.status
        || payments.find((payment) => payment.paymentStatus || payment.payment_status)?.paymentStatus
        || payments.find((payment) => payment.payment_status)?.payment_status
        || inferredPaymentStatus,
    ),
    deviceId: storeOrder.deviceId || storeOrder.device_id || order.deviceId || order.device_id || metaValue(metadata, "pos_device_id") || "—",
    placedBy: storeOrder.placedBy || storeOrder.placed_by || storeOrder.placedByName || storeOrder.placed_by_name ||
      order.placedBy || order.placed_by || order.placedByName || order.placed_by_name ||
      metaValueFrom(metadata, ["pos_placed_by", "_pos_placed_by", "placed_by", "placed_by_name"]) || "—",
    shiftId: storeOrder.shiftId || order.shiftId || metaValue(metadata, "shift_id") || "—",
    payLater: storeOrder.payLater ? "Yes" : "No",
    subtotal: formatMoney(shownSubtotal, currency),
    discount: formatMoney(shownDiscount, currency),
    tax: formatMoney(tax, currency),
    fees: formatMoney(feeTotal, currency),
    total: formatMoney(shownTotal, currency),
    lineItems,
    hasDiscount,
    feeLines,
    taxLines,
    couponLines,
    discountLines,
    payments,
  };
}

export default function OrderDetail({ embedded = false, orderId: providedOrderId, storeId: providedStoreId, merchantId, orderNumber: providedOrderNumber, onBack }) {
  const { orderId: routeOrderId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const orderId = providedOrderId || routeOrderId;
  const storeId = providedStoreId || searchParams.get("store") || "";
  const employeeMerchantId = merchantId || searchParams.get("merchant") || "";
  const orderNumber = providedOrderNumber || searchParams.get("number") || "";
  const [view, setView] = useState(null);
  const [employeeNames, setEmployeeNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const listQuery = new URLSearchParams();
  if (searchParams.get("merchant")) listQuery.set("merchant", searchParams.get("merchant"));
  if (searchParams.get("store")) listQuery.set("store", searchParams.get("store"));
  const backTo = location.state?.from || `/orders${listQuery.toString() ? `?${listQuery}` : ""}`;

  useEffect(() => {
    let active = true;
    if (!employeeMerchantId || !storeId) { setEmployeeNames({}); return undefined; }
    listStoreEmployees(employeeMerchantId, storeId)
      .then((response) => { if (active) setEmployeeNames(employeeNameMap(response)); })
      .catch(() => { if (active) setEmployeeNames({}); });
    return () => { active = false; };
  }, [employeeMerchantId, storeId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getOrder(orderId, storeId),
      storeId ? listStorePosPayments(storeId).catch(() => null) : Promise.resolve(null),
    ])
      .then(async ([payload, paymentPayload]) => {
        if (!active) return;
        let nextView = buildView(payload);
        if (!nextView.payments.length) {
          const paymentRows = Array.isArray(paymentPayload?.payments)
            ? paymentPayload.payments
            : Array.isArray(paymentPayload?.data?.payments) ? paymentPayload.data.payments : [];
          const orderKeys = new Set([orderId, nextView.number, nextView.clientOrderId]
            .filter(Boolean).map((value) => String(value).trim().toLowerCase()));
          const matchingPayments = paymentRows.filter((payment) => [
            payment.order_id, payment.orderId, payment.order_number, payment.orderNumber,
            payment.client_order_id, payment.clientOrderId,
          ].filter((value) => value !== undefined && value !== null && value !== "")
            .some((value) => orderKeys.has(String(value).trim().toLowerCase())));
          nextView = { ...nextView, payments: matchingPayments };
        }
        if (storeId && (nextView.hasDiscount || nextView.lineItems.some((item) => !item.sku))) {
          try {
            const catalog = await productsApi.getCatalog(storeId);
            const productByKey = productCatalogMap(catalog);
            nextView = {
              ...nextView,
              lineItems: nextView.lineItems.map((item) => ({
                item,
                catalogProduct: catalogProductForLineItem(item, productByKey),
              })).map(({ item, catalogProduct }) => {
                const quantity = Number(item.quantity);
                const divisor = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
                const rawProduct = catalogProduct?.raw || {};
                const productPayload = catalogProduct?.rawPayload || {};
                const itemProduct = asObject(item.product || item.productDetails || item.product_details);
                const itemMeta = asArray(item.meta_data || item.metaData);
                const subtotal = numericPrice(item.subtotal, item.total);
                const total = numericPrice(item.total, item.subtotal);
                const discountAmount = numericPrice(
                  item.discountAmount,
                  item.discount_amount,
                  item.discount,
                  metaValueFrom(itemMeta, ["_pos_auto_discount", "pos_auto_discount", "discount_amount"]),
                );
                let originalUnitPrice = numericPrice(
                  item.regularPrice,
                  item.regular_price,
                  item.originalPrice,
                  item.original_price,
                  itemProduct.regularPrice,
                  itemProduct.regular_price,
                  metaValueFrom(itemMeta, ["regular_price", "_regular_price", "original_price"]),
                  rawProduct.regularPrice,
                  rawProduct.regular_price,
                  productPayload.regularPrice,
                  productPayload.regular_price,
                  item.price,
                  itemProduct.price,
                );
                if (originalUnitPrice === undefined && subtotal !== undefined) {
                  originalUnitPrice = subtotal / divisor;
                }
                const discountedUnitPrice = total === undefined ? undefined : total / divisor;
                if (discountAmount !== undefined && discountedUnitPrice !== undefined
                  && (originalUnitPrice === undefined || originalUnitPrice <= discountedUnitPrice)) {
                  originalUnitPrice = discountedUnitPrice + discountAmount / divisor;
                }
                return {
                  ...item,
                  sku: item.sku || catalogProduct?.sku || "",
                  originalUnitPrice,
                  discountedUnitPrice,
                };
              }),
            };
          } catch {
            // Keep the order details available when the catalog cannot be read.
          }
        }
        if (active) {
          setView(orderNumber ? { ...nextView, number: orderNumber.replace(/^#/, "") } : nextView);
        }
      })
      .catch((loadError) => {
        if (!active) return;
        setView(null);
        setError(loadError?.message || "Failed to load this order.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, storeId, orderNumber]);

  return (
    <div className="employee-view-page order-detail-page">
      <header className="employee-view-topbar">
        {embedded
          ? <button type="button" onClick={onBack}><ArrowLeft size={16} /> Orders</button>
          : <Link to={backTo}><ArrowLeft size={16} /> Orders</Link>}
        <span>/</span><strong>View Order</strong>
      </header>
      <div className="employee-view-header order-detail-heading-row">
        <div>
          <h1>{view ? `Order ${view.number}` : "Order"}</h1>
          <p>Order, payment, line, and tender details for this sale.</p>
        </div>
        {view && (
          <span className={`order-status ${statusClass(view.status)}`}>
            <i className="bi bi-circle-fill" />
            {view.status}
          </span>
        )}
      </div>

      {loading && <p role="status">Loading order...</p>}
      {error && <div className="employee-view-error" role="alert">{error}</div>}

      {view && (
        <div className="employee-view-sections order-detail-layout">
          <DetailBlock title="Order">
            <Fields items={[["Order ID", view.number], ["Client order ID", view.clientOrderId], ["Created", view.createdAt], ["Currency", view.currency], ["Timezone", view.timezone], ["Customer", view.customer], ["Phone", view.phone], ["Email", view.email]]} />
          </DetailBlock>

          <DetailBlock title="Payment and device">
            <Fields items={[["Payment", view.paymentMethod], ["Pay later", view.payLater], ["Device ID", view.deviceId], ["Placed by", displayPlacedBy(view.placedBy, employeeNames)], ["Shift", view.shiftId]]} />
          </DetailBlock>

          <DetailBlock title="Totals">
            <Fields items={[["Subtotal", view.subtotal], ["Discount", view.discount], ["Tax", view.tax], ["Fees", view.fees], ["Total", view.total]]} />
          </DetailBlock>

          <DetailBlock title="Line items">
            <Lines
              columns={["Product", "SKU", "Qty", "Price"]}
              rows={view.lineItems.map((item) => {
                const quantity = Number(item.quantity);
                const divisor = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
                const originalUnitPrice = Number(item.originalUnitPrice ?? Number(item.subtotal ?? item.total) / divisor);
                const discountedUnitPrice = Number(item.discountedUnitPrice ?? Number(item.total ?? item.subtotal) / divisor);
                const hasDiscount = Number.isFinite(originalUnitPrice)
                  && Number.isFinite(discountedUnitPrice)
                  && originalUnitPrice > discountedUnitPrice;
                return [
                  item.name || item.productName || "Item",
                  item.sku || "—",
                  item.quantity ?? "—",
                  <span className="order-line-price">
                    {hasDiscount && (
                      <del className="order-line-price-original">
                        {formatMoney(originalUnitPrice, view.currency)}
                      </del>
                    )}
                    <strong className={hasDiscount ? "order-line-price-discounted" : undefined}>
                      {formatMoney(hasDiscount ? discountedUnitPrice : originalUnitPrice, view.currency)}
                    </strong>
                  </span>,
                ];
              })}
            />
          </DetailBlock>

          <DetailBlock title="Fees">
            <Lines
              columns={["Name", "Tax status", "Total"]}
              rows={view.feeLines.map((fee) => [fee.name || fee.title || "Fee", fee.taxStatus || fee.tax_status || "—", formatMoney(fee.total ?? fee.amount, view.currency)])}
            />
          </DetailBlock>

          <DetailBlock title="Discounts">
            <Lines
              columns={["Name", "Type", "Amount"]}
              rows={view.discountLines.map((discount) => [discount.name || "Discount", discount.type || "—", formatMoney(discount.amount, view.currency)])}
            />
          </DetailBlock>

          <DetailBlock title="Tax">
            <Lines
              columns={["Label", "Rate", "Tax"]}
              rows={view.taxLines.map((tax) => [tax.label || tax.rateCode || tax.rate_code || "Tax", `${tax.ratePercent ?? tax.rate_percent ?? 0}%`, formatMoney(tax.taxTotal ?? tax.tax_total ?? tax.amount, view.currency)])}
            />
          </DetailBlock>

          <DetailBlock title="Coupons">
            <Lines
              columns={["Code", "Discount"]}
              rows={view.couponLines.map((coupon) => [coupon.code || coupon.couponCode || coupon.coupon_code || coupon.name || "—", formatMoney(coupon.discount ?? coupon.discountAmount ?? coupon.discount_amount ?? coupon.amount, view.currency)])}
            />
          </DetailBlock>

          <DetailBlock title="Payments">
            <Lines
              columns={["Method", "Transaction ID", "Amount", "Status", "Created"]}
              rows={view.payments.map((payment) => [
                payment.method || payment.paymentMethod || payment.payment_method || payment.paymentMethodTitle || payment.payment_method_title || payment.payment_type || "—",
                paymentTransactionId(payment),
                formatMoney(payment.amount ?? payment.tenderAmount ?? payment.tender_amount, view.currency),
                titleCase(payment.status || payment.paymentStatus || payment.payment_status),
                displayDate(payment.created_at || payment.createdAt || payment.payment_at || payment.paymentAt),
              ])}
            />
          </DetailBlock>

        </div>
      )}
    </div>
  );
}

function DetailBlock({ title, children }) {
  const Icon = title === "Order" ? ShoppingBag
    : title === "Payment and device" || title === "Payments" ? CreditCard
      : title === "Totals" ? CircleDollarSign
          : title === "Line items" ? Package
          : ReceiptText;
  return (
    <section className="employee-view-card order-detail-block">
      <div className="employee-view-card-header"><span><Icon size={19} /></span><h2>{title}</h2></div>
      {children}
    </section>
  );
}

function Fields({ items }) {
  return (
    <dl className="employee-view-grid">
      {items.map(([label, value]) => <div className="employee-view-field" key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}
    </dl>
  );
}

function Lines({ columns, rows }) {
  if (!rows.length) return <p className="order-detail-empty">None</p>;
  return (
    <div className="order-detail-table-wrap">
      <table className="orders-table order-detail-table">
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => <td key={`${columns[cellIndex]}-${index}`}>{cell || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
