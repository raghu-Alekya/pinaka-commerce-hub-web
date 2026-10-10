import React, { useEffect, useMemo, useState } from "react";
import { ordersSeed } from "../data/data";
import { useLocation, useNavigate } from "react-router-dom";
import ListActions from "../components/ListActions";
import Pagination from "../components/Pagination";
import FiltersBar from "../components/FiltersBar";
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
    const navigate = useNavigate();
    const location = useLocation();

    // =========================================================
    // PAGINATION
    // =========================================================

    const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
};

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

    const totalPages = Math.max(
    1,
    Math.ceil(totalItems / pageSize)
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
    const orderPercentage = (count) =>
        orders.length ? ((count / orders.length) * 100).toFixed(1) : "0.0";

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="page-content orders-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="orders-header">

                <div className="orders-title-area">
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
                        <i className="bi bi-bag-fill" aria-hidden="true" />
                    </div>

                    <div>
                        <span>Total Orders</span>

                        <strong>
                            {orders.length}
                        </strong>
                        <small className="order-summary-meta positive">
                            <i className="bi bi-circle-fill" aria-hidden="true" /> Live Records
                        </small>
                    </div>

                </div>

                {/* COMPLETED */}

                <div className="order-summary-card">

                    <div className="order-summary-icon green">
                        <i className="bi bi-check-circle-fill" aria-hidden="true" />
                    </div>

                    <div>
                        <span>Completed</span>

                        <strong>
                            {completedCount}
                        </strong>
                        <small className="order-summary-meta positive">
                            <i className="bi bi-circle-fill" aria-hidden="true" /> {orderPercentage(completedCount)}% of total
                        </small>
                    </div>

                </div>

                {/* PENDING */}

                <div className="order-summary-card">

                    <div className="order-summary-icon orange">
                        <i className="bi bi-clock-fill" aria-hidden="true" />
                    </div>

                    <div>
                        <span>Pending Payment</span>

                        <strong>
                            {pendingCount}
                        </strong>
                        <small className="order-summary-meta warning">
                            <i className="bi bi-circle-fill" aria-hidden="true" /> {orderPercentage(pendingCount)}% of total
                        </small>
                    </div>

                </div>

                {/* TOTAL VALUE */}

                <div className="order-summary-card">

                    <div className="order-summary-icon blue">
                        <i className="bi bi-cash-stack" aria-hidden="true" />
                    </div>

                    <div>
                        <span>Total Value</span>

                        <strong>
                            ${totalAmount.toFixed(2)}
                        </strong>
                        <small className="order-summary-meta info">
                            <i className="bi bi-circle-fill" aria-hidden="true" /> Across all orders
                        </small>
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

                <FiltersBar
    searchValue={search}
    onSearchChange={(value) => {
        setSearch(value);
        setCurrentPage(1);
    }}
    searchPlaceholder="Search order ID, offline ID, author..."
    filters={[
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
            onChange: (value) => {
                setDateFilter(value);
                setCurrentPage(1);
            },
        },
        {
            key: "salesChannel",
            label: "Sales Channel",
            value: salesChannel,
            options: [
                { label: "All Sales Channels", value: "" },
                { label: "POS", value: "POS" },
                { label: "Online", value: "Online" },
                { label: "WooCommerce", value: "WooCommerce" },
            ],
            onChange: (value) => {
                setSalesChannel(value);
                setCurrentPage(1);
            },
        },
        {
            key: "author",
            label: "Author",
            value: authorFilter,
            options: [
                { label: "All Authors", value: "" },
                ...authors.map((author) => ({
                    label: author,
                    value: author,
                })),
            ],
            onChange: (value) => {
                setAuthorFilter(value);
                setCurrentPage(1);
            },
        },
        {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: [
                { label: "All Status", value: "" },
                { label: "Completed", value: "Completed" },
                { label: "Pending Payment", value: "Pending payment" },
                { label: "Processing", value: "Processing" },
                { label: "Cancelled", value: "Cancelled" },
                { label: "Refunded", value: "Refunded" },
                {
                    label: "Partially Refunded",
                    value: "Partially Refunded",
                },
            ],
            onChange: (value) => {
                setStatusFilter(value);
                setCurrentPage(1);
            },
        },
    ]}
    onClear={clearFilters}
/>

    

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="orders-table-wrapper">

                    <table className="orders-table">

                        <thead>

                            <tr>

                                <th>Woo Order ID</th>
                                <th>Offline Order ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Author</th>
                                <th>Total</th>
                                <th>Actions</th>

                            </tr>

                        </thead>

                        <tbody>

                            {paginatedOrders.map(
                                (order) => (
                                    <OrderRow
                                        key={order.id}
                                        order={order}
                                        onView={() => navigate(`/orders/${encodeURIComponent(order.id)}`, { state: { backTo: location.pathname + location.search } })}
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
        onPageSizeChange={handlePageSizeChange}
        itemLabel="orders"
        showWhenEmpty={true}
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

function OrderRow({ order, onView }) {

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
        <tr
            className="orders-clickable-row"
            tabIndex={0}
            aria-label={`View order ${order.wooOrderId || order.id}`}
            onClick={(event) => {
                if (event.target.closest("button, a, input, select, textarea, [role='button']")) return;
                onView();
            }}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget || event.key !== "Enter") return;
                event.preventDefault();
                onView();
            }}
        >

            {/* =================================================
                WOO ORDER ID
            ================================================= */}

            <td>

                <div className="order-id-cell">
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

            <td><ListActions onView={onView} viewLabel={`View order ${order.wooOrderId || order.id}`} /></td>
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