import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/pagination";
import { ordersSeed } from "../data/data";
import "../styles/orders.css";

export default function Orders({
    embedded = false,
    merchantId,
    storeId,
    store,
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [salesChannel, setSalesChannel] = useState("");
    const [authorFilter, setAuthorFilter] = useState("");

    // =========================================================
    // PAGINATION
    // =========================================================

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // =========================================================
    // ORDERS
    // =========================================================

    const orders = ordersSeed || [];

    // =========================================================
    // AUTHORS
    // =========================================================

    const authors = useMemo(() => {
        return [
            ...new Set(
                orders
                    .map((order) => order.author)
                    .filter(Boolean)
            ),
        ];
    }, [orders]);

    // =========================================================
    // FILTER ORDERS
    // =========================================================

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const searchText = `
                ${order.wooOrderId || ""}
                ${order.offlineOrderId || ""}
                ${order.author || ""}
                ${order.status || ""}
            `.toLowerCase();

            const matchesSearch =
                !search ||
                searchText.includes(
                    search.toLowerCase()
                );

            const matchesStatus =
                !statusFilter ||
                order.status === statusFilter;

            const matchesChannel =
                !salesChannel ||
                order.salesChannel === salesChannel;

            const matchesAuthor =
                !authorFilter ||
                order.author === authorFilter;

            let matchesDate = true;

            if (dateFilter) {
                const orderDate = new Date(
                    order.date
                );

                const today = new Date();

                if (dateFilter === "today") {
                    matchesDate =
                        orderDate.toDateString() ===
                        today.toDateString();
                }

                if (dateFilter === "7days") {
                    const sevenDaysAgo =
                        new Date();

                    sevenDaysAgo.setDate(
                        today.getDate() - 7
                    );

                    matchesDate =
                        orderDate >= sevenDaysAgo;
                }

                if (dateFilter === "30days") {
                    const thirtyDaysAgo =
                        new Date();

                    thirtyDaysAgo.setDate(
                        today.getDate() - 30
                    );

                    matchesDate =
                        orderDate >= thirtyDaysAgo;
                }
            }

            return (
                matchesSearch &&
                matchesStatus &&
                matchesChannel &&
                matchesAuthor &&
                matchesDate
            );
        });
    }, [
        orders,
        search,
        statusFilter,
        dateFilter,
        salesChannel,
        authorFilter,
    ]);

    // =========================================================
    // PAGINATION
    // =========================================================

    const totalItems = filteredOrders.length;

    const totalPages = Math.ceil(
        totalItems / pageSize
    );

    const paginatedOrders = useMemo(() => {
        const startIndex =
            (currentPage - 1) * pageSize;

        const endIndex =
            startIndex + pageSize;

        return filteredOrders.slice(
            startIndex,
            endIndex
        );
    }, [
        filteredOrders,
        currentPage,
        pageSize,
    ]);

    // =========================================================
    // RESET PAGE WHEN FILTERS CHANGE
    // =========================================================

    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        statusFilter,
        dateFilter,
        salesChannel,
        authorFilter,
    ]);

    // =========================================================
    // KEEP CURRENT PAGE VALID
    // =========================================================

    useEffect(() => {
        if (
            totalPages > 0 &&
            currentPage > totalPages
        ) {
            setCurrentPage(totalPages);
        }
    }, [
        currentPage,
        totalPages,
    ]);

    // =========================================================
    // CLEAR FILTERS
    // =========================================================

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setDateFilter("");
        setSalesChannel("");
        setAuthorFilter("");
        setCurrentPage(1);
    };

    // =========================================================
    // SUMMARY
    // =========================================================

    const completedCount = orders.filter(
        (order) =>
            order.status === "Completed"
    ).length;

    const pendingCount = orders.filter(
        (order) =>
            order.status === "Pending payment"
    ).length;

    const cancelledCount = orders.filter(
        (order) =>
            order.status === "Cancelled"
    ).length;

    const totalAmount = orders.reduce(
        (sum, order) =>
            sum +
            Number(order.totalValue || 0),
        0
    );

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="orders-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="orders-header">

                <div className="orders-title-area">

                    <div className="orders-title-icon">
                        <i className="bi bi-receipt" />
                    </div>

                    <div>
                        <h1>Orders</h1>

                        <p>
                            View orders and transaction
                            information for this store.
                        </p>
                    </div>

                </div>

                {/* STORE CONTEXT */}

                {store && (
                    <div className="orders-store-context">

                        <i className="bi bi-shop" />

                        <div>

                            <span>STORE</span>

                            <strong>
                                {store.name}
                            </strong>

                            <small>
                                {store.id}
                            </small>

                        </div>

                    </div>
                )}

            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="orders-summary">

                {/* TOTAL ORDERS */}

                <div className="order-summary-card">

                    <div className="order-summary-icon purple">
                        <i className="bi bi-receipt" />
                    </div>

                    <div>
                        <span>Total Orders</span>

                        <strong>
                            {orders.length}
                        </strong>
                    </div>

                </div>

                {/* COMPLETED */}

                <div className="order-summary-card">

                    <div className="order-summary-icon green">
                        <i className="bi bi-check-circle" />
                    </div>

                    <div>
                        <span>Completed</span>

                        <strong>
                            {completedCount}
                        </strong>
                    </div>

                </div>

                {/* PENDING */}

                <div className="order-summary-card">

                    <div className="order-summary-icon orange">
                        <i className="bi bi-clock" />
                    </div>

                    <div>
                        <span>Pending Payment</span>

                        <strong>
                            {pendingCount}
                        </strong>
                    </div>

                </div>

                {/* TOTAL VALUE */}

                <div className="order-summary-card">

                    <div className="order-summary-icon blue">
                        <i className="bi bi-currency-dollar" />
                    </div>

                    <div>
                        <span>Total Value</span>

                        <strong>
                            ${totalAmount.toFixed(2)}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                MAIN CARD
            ================================================= */}

            <div className="orders-card">

                {/* =================================================
                    TOOLBAR
                ================================================= */}

                <div className="orders-toolbar">

                    {/* SEARCH */}

                    <div className="orders-search">

                        <i className="bi bi-search" />

                        <input
                            type="text"
                            placeholder="Search order ID, offline ID, author..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                    {/* DATE */}

                    <select
                        value={dateFilter}
                        onChange={(e) =>
                            setDateFilter(e.target.value)
                        }
                    >

                        <option value="">
                            All Dates
                        </option>

                        <option value="today">
                            Today
                        </option>

                        <option value="7days">
                            Last 7 Days
                        </option>

                        <option value="30days">
                            Last 30 Days
                        </option>

                    </select>

                    {/* SALES CHANNEL */}

                    <select
                        value={salesChannel}
                        onChange={(e) =>
                            setSalesChannel(e.target.value)
                        }
                    >

                        <option value="">
                            All Sales Channels
                        </option>

                        <option value="POS">
                            POS
                        </option>

                        <option value="Online">
                            Online
                        </option>

                        <option value="WooCommerce">
                            WooCommerce
                        </option>

                    </select>

                    {/* AUTHOR */}

                    <select
                        value={authorFilter}
                        onChange={(e) =>
                            setAuthorFilter(e.target.value)
                        }
                    >

                        <option value="">
                            All Authors
                        </option>

                        {authors.map((author) => (
                            <option
                                key={author}
                                value={author}
                            >
                                {author}
                            </option>
                        ))}

                    </select>

                    {/* STATUS */}

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >

                        <option value="">
                            All Status
                        </option>

                        <option value="Completed">
                            Completed
                        </option>

                        <option value="Pending payment">
                            Pending Payment
                        </option>

                        <option value="Processing">
                            Processing
                        </option>

                        <option value="Cancelled">
                            Cancelled
                        </option>

                        <option value="Refunded">
                            Refunded
                        </option>

                        <option value="Partially Refunded">
                            Partially Refunded
                        </option>

                    </select>

                    {/* CLEAR */}

                    <button
                        type="button"
                        className="orders-clear-btn"
                        onClick={clearFilters}
                    >
                        <i className="bi bi-arrow-counterclockwise" />
                        Clear
                    </button>

                </div>

                {/* =================================================
                    TABLE HEADING
                ================================================= */}

                <div className="orders-table-heading">

                    <div>

                        Orders

                        <span>
                            {filteredOrders.length}
                        </span>

                    </div>

                    <div className="orders-read-only">

                        <i className="bi bi-lock" />

                        Read Only

                    </div>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="orders-table-wrapper">

                    <table className="orders-table">

                        <thead>

                            <tr>

                                <th>WOO ORDER ID</th>
                                <th>OFFLINE ORDER ID</th>
                                <th>DATE</th>
                                <th>STATUS</th>
                                <th>AUTHOR</th>
                                <th>TOTAL</th>

                            </tr>

                        </thead>

                        <tbody>

                            {paginatedOrders.map(
                                (order) => (
                                    <OrderRow
                                        key={order.id}
                                        order={order}
                                    />
                                )
                            )}

                        </tbody>

                    </table>

                </div>

                {/* =================================================
                    EMPTY
                ================================================= */}

                {filteredOrders.length === 0 && (
                    <div className="orders-empty">

                        <div className="orders-empty-icon">

                            <i className="bi bi-receipt" />

                        </div>

                        <h3>
                            No orders found
                        </h3>

                        <p>
                            Try changing your search
                            or filters.
                        </p>

                        <button
                            type="button"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>

                    </div>
                )}

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {filteredOrders.length > 0 && (
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
                    />
                )}

                {/* =================================================
                    FOOTER
                ================================================= */}

                {filteredOrders.length > 0 && (
                    <div className="orders-footer">

                        <span className="orders-source">

                            <i className="bi bi-arrow-repeat" />

                            Synced from WooCommerce

                        </span>

                    </div>
                )}

            </div>

        </div>
    );
}

// =========================================================
// ORDER ROW
// =========================================================

function OrderRow({ order }) {

    const statusClass =
        order.status === "Completed"
            ? "completed"
            : order.status === "Pending payment"
                ? "pending"
                : order.status === "Processing"
                    ? "processing"
                    : order.status === "Cancelled"
                        ? "cancelled"
                        : order.status === "Refunded"
                            ? "refunded"
                            : "partial";

    return (
        <tr>

            {/* =================================================
                WOO ORDER ID
            ================================================= */}

            <td>

                <div className="order-id-cell">

                    <div className="order-icon">
                        <i className="bi bi-receipt" />
                    </div>

                    <div>

                        <strong>
                            {order.wooOrderId}
                        </strong>

                        <small>
                            WooCommerce
                        </small>

                    </div>

                </div>

            </td>

            {/* =================================================
                OFFLINE ORDER ID
            ================================================= */}

            <td>

                <span className="offline-order-id">
                    {order.offlineOrderId || "—"}
                </span>

            </td>

            {/* =================================================
                DATE
            ================================================= */}

            <td>

                <div className="order-date">

                    <strong>
                        {order.date}
                    </strong>

                    {order.time && (
                        <small>
                            {order.time}
                        </small>
                    )}

                </div>

            </td>

            {/* =================================================
                STATUS
            ================================================= */}

            <td>

                <span
                    className={`order-status ${statusClass}`}
                >

                    <i className="bi bi-circle-fill" />

                    {order.status}

                </span>

            </td>

            {/* =================================================
                AUTHOR
            ================================================= */}

            <td>

                <div className="order-author">

                    <div className="author-avatar">

                        {getInitials(
                            order.author
                        )}

                    </div>

                    <span>
                        {order.author}
                    </span>

                </div>

            </td>

            {/* =================================================
                TOTAL
            ================================================= */}

            <td>

                <strong className="order-total">
                    {order.total}
                </strong>

            </td>

        </tr>
    );
}

// =========================================================
// INITIALS
// =========================================================

function getInitials(name = "") {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}