import { pendingStoreRead } from "../api/http";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Pagination from "../components/Pagination";
import FiltersBar from "../components/FiltersBar";
import ListActions from "../components/ListActions";
import { listMerchants } from "../api/merchants";
import { listMerchantStores, listStores } from "../api/stores";
import { listScopedOrders } from "../api/orders";
import { loadStorePosConfiguration } from "./pos/storePosConfiguration";
import { formatCurrency, getCurrencySymbol } from "../utils/currency";
import OrderDetail from "./OrderDetail";
import "../styles/orders.css";

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("create")) return "created";
  if (value.includes("complete")) return "completed";
  if (value.includes("pending")) return "pending";
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("partial")) return "partial";
  if (value.includes("refund")) return "refunded";
  if (value.includes("inactive")) return "inactive";
  if (value.includes("active")) return "active";
  return "processing";
}

function matchesDate(createdAt, dateFilter) {
  if (!dateFilter) return true;
  const orderDate = new Date(createdAt);
  if (Number.isNaN(orderDate.getTime())) return false;
  const today = new Date();
  if (dateFilter === "today") return orderDate.toDateString() === today.toDateString();
  const from = new Date(today);
  from.setDate(today.getDate() - (dateFilter === "7days" ? 7 : 30));
  return orderDate >= from;
}

async function applyStorePosCurrencies(orders) {
  if (!orders.length) return orders;
  const { stores = [] } = await listStores();
  const aliases = new Map();
  stores.forEach((store) => {
    [store.uuid, store.storeUUID, store.storeUuid, store.store_uuid, store.storeId, store.storeID, store.store_id, store.id, store.storeCode, store.store_code]
      .filter(Boolean)
      .forEach((id) => aliases.set(String(id), store));
  });

  const relevantStores = new Map();
  orders.forEach((order) => {
    const store = aliases.get(String(order.storeId || ""));
    const configStoreId = store?.uuid || store?.storeUUID || store?.storeUuid || store?.store_uuid || store?.id || store?.storeId;
    if (configStoreId) relevantStores.set(String(configStoreId), configStoreId);
  });

  const currencyByStore = new Map();
  await Promise.all([...relevantStores].map(async ([key, id]) => {
    try {
      const config = await pendingStoreRead(`pos-currency:${id}`, () => loadStorePosConfiguration(id, "currency_taxes"));
      const currency = config?.currency || config?.currencyCode || config?.currency_code;
      if (currency) currencyByStore.set(key, {
        currency,
        currencySymbol: config.currencySymbol || config.currency_symbol || getCurrencySymbol(currency),
      });
    } catch {
      // Keep the order's API currency when the store's POS setting is unavailable.
    }
  }));

  return orders.map((order) => {
    const store = aliases.get(String(order.storeId || ""));
    const configStoreId = store?.uuid || store?.storeUUID || store?.storeUuid || store?.store_uuid || store?.id || store?.storeId;
    const configured = configStoreId && currencyByStore.get(String(configStoreId));
    return configured ? { ...order, ...configured } : order;
  });
}

export default function Orders({
  embedded = false,
  merchantId,
  storeId,
  store,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [merchants, setMerchants] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(
    merchantId || (!embedded && searchParams.get("merchant")) || "",
  );
  const [selectedStore, setSelectedStore] = useState(
    storeId || (!embedded && searchParams.get("store")) || "",
  );
  const [orders, setOrders] = useState([]);
  const [viewedOrder, setViewedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (merchantId) setSelectedMerchant(merchantId);
  }, [merchantId]);

  useEffect(() => {
    if (storeId) setSelectedStore(storeId);
  }, [storeId]);

  useEffect(() => {
    if (embedded) return undefined;
    let active = true;
    listMerchants()
      .then((rows) => {
        if (active) setMerchants(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (active) setMerchants([]);
      });
    return () => {
      active = false;
    };
  }, [embedded]);

  useEffect(() => {
    if (!selectedMerchant || embedded) {
      if (!embedded) setStores([]);
      return undefined;
    }
    let active = true;
    listMerchantStores(selectedMerchant)
      .then((rows) => {
        if (!active) return;
        setStores(rows);
        if (rows.length === 1) setSelectedStore(rows[0].value);
      })
      .catch(() => {
        if (active) setStores([]);
      });
    return () => {
      active = false;
    };
  }, [selectedMerchant, embedded]);

  useEffect(() => {
    if (embedded || selectedMerchant || selectedStore) return undefined;
    let active = true;
    setLoading(true);
    setError("");
    setOrders([]);
    pendingStoreRead("all-orders:database-rows", () =>
      listScopedOrders(),
    )
      .then(async ({ orders: rows }) => {
        let ordersWithCurrencies = rows;
        try {
          ordersWithCurrencies = await applyStorePosCurrencies(rows);
        } catch {
          // Store lookup failures should not prevent the all-orders list from loading.
        }
        if (!active) return;
        setOrders(ordersWithCurrencies);
      })
      .catch((loadError) => {
        if (!active) return;
        setOrders([]);
        setError(loadError?.message || "Failed to load orders.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [embedded, selectedMerchant, selectedStore]);

  useEffect(() => {
    if (!selectedStore) {
      if (embedded || selectedMerchant) {
        setOrders([]);
        setError("");
        setLoading(false);
      }
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError("");
    setOrders([]);
    pendingStoreRead(
      `scoped-orders:${selectedMerchant || "all"}:${selectedStore}`,
      () => listScopedOrders({ merchantId: selectedMerchant, storeId: selectedStore }),
    )
      .then(async ({ orders: rows }) => {
        let ordersWithCurrencies = rows;
        try {
          ordersWithCurrencies = await applyStorePosCurrencies(rows);
        } catch {
          // Store lookup failures should not prevent the orders list from loading.
        }
        if (!active) return;
        setOrders(ordersWithCurrencies);
      })
      .catch((loadError) => {
        if (!active) return;
        setOrders([]);
        setError(loadError?.message || "Failed to load orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedStore, selectedMerchant, embedded]);

  const authors = useMemo(
    () => [...new Set(orders.map((order) => order.author).filter(Boolean))],
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const searchText = `${order.wooOrderId} ${order.offlineOrderId} ${order.author} ${order.status}`.toLowerCase();
      return (
        (!query || searchText.includes(query)) &&
        (!statusFilter || order.status === statusFilter) &&
        (!authorFilter || order.author === authorFilter) &&
        matchesDate(order.createdAt, dateFilter)
      );
    });
  }, [orders, search, statusFilter, authorFilter, dateFilter]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, authorFilter, selectedMerchant, selectedStore]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const completedCount = orders.filter((order) => statusClass(order.status) === "completed").length;
  const pendingCount = orders.filter((order) => statusClass(order.status) === "pending").length;
  const refundedCount = orders.filter((order) => statusClass(order.status) === "refunded").length;
  const totalOrderCount = orders.length;
  const completedPercentage = totalOrderCount ? ((completedCount / totalOrderCount) * 100).toFixed(1) : "0.0";
  const pendingPercentage = totalOrderCount ? ((pendingCount / totalOrderCount) * 100).toFixed(1) : "0.0";
  function rememberFilters(nextMerchant, nextStore) {
    if (embedded) return;
    const next = new URLSearchParams(searchParams);
    if (nextMerchant) next.set("merchant", nextMerchant);
    else next.delete("merchant");
    if (nextStore) next.set("store", nextStore);
    else next.delete("store");
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setDateFilter("");
    setAuthorFilter("");
    if (!embedded) {
      setSelectedMerchant("");
      setSelectedStore("");
      setStores([]);
      setOrders([]);
      rememberFilters("", "");
    }
    setCurrentPage(1);
  }

  const ordersToolbar = (
    <FiltersBar
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search order ID, client order ID, customer..."
      filters={[
        ...(!embedded ? [
          {
            key: "merchant",
            label: "Merchant",
            value: selectedMerchant,
            options: [
              { label: "All Merchants", value: "" },
              ...merchants.map((merchant) => ({
                label: merchant.name || merchant.merchantId,
                value: merchant.id,
              })),
            ],
            onChange: (value) => {
              setSelectedMerchant(value);
              setSelectedStore("");
              setOrders([]);
              rememberFilters(value, "");
            },
          },
          {
            key: "store",
            label: "Store",
            value: selectedStore,
            options: [
              { label: "All Stores", value: "" },
              ...stores.map((item) => ({ label: item.label, value: item.value })),
            ],
            onChange: (value) => {
              setSelectedStore(value);
              rememberFilters(selectedMerchant, value);
            },
          },
        ] : []),
        {
          key: "date",
          label: "Date",
          value: dateFilter,
          options: [
            { label: "All Dates", value: "" },
            { label: "Today", value: "today" },
            { label: "Last 7 Days", value: "7days" },
            { label: "Last 30 Days", value: "30days" },
          ],
          onChange: setDateFilter,
        },
        {
          key: "author",
          label: "Customer",
          value: authorFilter,
          options: [
            { label: "All Customers", value: "" },
            ...authors.map((author) => ({ label: author, value: author })),
          ],
          onChange: setAuthorFilter,
        },
        {
          key: "status",
          label: "Status",
          value: statusFilter,
          options: [
            { label: "All Status", value: "" },
            ...[...new Set(orders.map((order) => order.status).filter(Boolean))].map((status) => ({
              label: status,
              value: status,
            })),
          ],
          onChange: setStatusFilter,
        },
      ]}
      onClear={clearFilters}
    />
  );

  const handleViewOrder = (order) => {
    if (embedded) {
      setViewedOrder(order);
      return;
    }

    navigate(`/orders/${encodeURIComponent(order.id)}?${new URLSearchParams({
      ...((selectedMerchant || order.merchantId) ? { merchant: selectedMerchant || order.merchantId } : {}),
      ...((selectedStore || order.storeId) ? { store: selectedStore || order.storeId } : {}),
      ...((order.currency || store?.currency) ? { currency: order.currency || store.currency } : {}),
      ...((order.currencySymbol || store?.currencySymbol) ? { currencySymbol: order.currencySymbol || store.currencySymbol } : {}),
      number: order.wooOrderId,
    }).toString()}`, { state: { from: `${location.pathname}${location.search}` } });
  };

  if (embedded && viewedOrder) {
    return <OrderDetail
      embedded
      orderId={viewedOrder.id}
      orderNumber={viewedOrder.wooOrderId}
      storeId={selectedStore}
      merchantId={selectedMerchant}
      currency={viewedOrder.currency || store?.currency}
      currencySymbol={viewedOrder.currencySymbol || store?.currencySymbol}
      onBack={() => setViewedOrder(null)}
    />;
  }

  return (
    <div className={`page-content orders-page ${!embedded ? "orders-standalone-page" : "orders-embedded-page"}`}>
      {!embedded && (
        <div className="orders-header">
          <div className="orders-title-area">
            <div>
              <h1>Orders</h1>
              <p>View orders and transaction information.</p>
            </div>
          </div>
        </div>
      )}

      <div className="orders-summary">
        <SummaryCard icon="bi-bag-fill" tone="purple" label="Total Orders" value={totalOrderCount} meta="Live Records" metaTone="positive" />
        <SummaryCard icon="bi-check-circle-fill" tone="green" label="Completed" value={completedCount} meta={`${completedPercentage}% of total`} metaTone="positive" />
        <SummaryCard icon="bi-clock-fill" tone="orange" label="Pending Payment" value={pendingCount} meta={`${pendingPercentage}% of total`} metaTone="warning" />
        <SummaryCard icon="bi-arrow-counterclockwise" tone="red" label="Refunded Orders" value={refundedCount} meta="Live Records" metaTone="info" />
      </div>

      <div className={`orders-card ${!embedded ? "orders-standalone-card" : ""} w-full max-w-full min-w-0 overflow-hidden`}>
        {ordersToolbar}

        {error && <div className="orders-banner error">{error}</div>}
        {loading && <div className="orders-banner">Loading orders...</div>}

        {!loading && (
          <>
            

            <div className={`orders-table-wrapper ${!embedded ? "orders-standalone-table-wrapper" : ""} w-full overflow-x-auto`}>
              <table className="orders-table w-full min-w-[880px] text-left">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Client Order ID</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length ? paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      style={{ cursor: "pointer" }}
                      onClick={(event) => {
                        if (event.target.closest('button, a, input, select, textarea, label, [role="button"], [contenteditable="true"]')) {
                          return;
                        }
                        handleViewOrder(order);
                      }}
                    >
                      <td>
                        <div className="order-id-cell">
                          <div>
                            <strong>{order.wooOrderId}</strong>
                            <small>{order.paymentMethod || "POS"}</small>
                          </div>
                        </div>
                      </td>
                      <td><span className="offline-order-id">{order.offlineOrderId || "—"}</span></td>
                      <td>
                        <div className="order-date">
                          <strong>{order.date}</strong>
                          {order.time && <small>{order.time}</small>}
                        </div>
                      </td>
                      <td>
                        <span className={`order-status ${statusClass(order.status)}`}>
                          <i className="bi bi-circle-fill" />
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="order-author">
                          <span>{embedded ? String(order.author || "").replace(/^\s*\.\s*/, "").trim() || "Walk-in Customer" : order.author}</span>
                        </div>
                      </td>
                      <td><strong className="order-total">{formatCurrency(order.totalValue, order.currency || store?.currency, order.currencySymbol || store?.currencySymbol)}</strong></td>
                      <td className="orders-actions-cell">
                        <ListActions
                          onView={() => handleViewOrder(order)}
                          viewLabel={`View order ${order.wooOrderId}`}
                        />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="orders-table-empty" colSpan="7">
                        <div className="products-table-empty-state">
                          <span>
                            {!selectedStore && (embedded || selectedMerchant)
                              ? "Choose a merchant and store to load that store's orders."
                              : error
                                ? error
                                : "No orders found"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemLabel="orders"
            showWhenEmpty={true}
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, tone, label, value, meta, metaTone }) {
  return (
    <div className="order-summary-card">
      <div className={`order-summary-icon ${tone}`}>
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={`order-summary-meta ${metaTone}`}>
          <i className="bi bi-circle-fill" aria-hidden="true" /> {meta}
        </small>
      </div>
    </div>
  );
}
