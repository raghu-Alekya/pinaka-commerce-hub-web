import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination";
import { couponsSeed } from "../data/data";
import "../styles/coupons.css";

export default function Coupons({
    embedded = false,
    merchantId,
    storeId,
    store,
}) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // =========================================================
    // PAGINATION
    // =========================================================

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // =========================================================
    // COUPON SYNC STATES
    // =========================================================

    const [syncing, setSyncing] = useState("");
    const [syncMessage, setSyncMessage] = useState("");
    const [syncError, setSyncError] = useState("");

    // =========================================================
    // COUPONS
    // =========================================================

    const coupons = couponsSeed || [];

    // =========================================================
    // COUPON TYPES
    // =========================================================

    const couponTypes = useMemo(() => {
        return [
            ...new Set(
                coupons
                    .map((coupon) => coupon.type)
                    .filter(Boolean)
            ),
        ];
    }, [coupons]);

    // =========================================================
    // FILTER COUPONS
    // =========================================================

    const filteredCoupons = useMemo(() => {
        return coupons.filter((coupon) => {
            const searchText = `
                ${coupon.code || ""}
                ${coupon.issuedOrderIds?.join(" ") || ""}
                ${coupon.usedOrderIds?.join(" ") || ""}
                ${coupon.type || ""}
                ${coupon.description || ""}
                ${coupon.productIds?.join(" ") || ""}
            `.toLowerCase();

            const matchesSearch =
                !search ||
                searchText.includes(
                    search.toLowerCase()
                );

            const matchesType =
                !typeFilter ||
                coupon.type === typeFilter;

            const matchesStatus =
                !statusFilter ||
                coupon.status === statusFilter;

            return (
                matchesSearch &&
                matchesType &&
                matchesStatus
            );
        });
    }, [
        coupons,
        search,
        typeFilter,
        statusFilter,
    ]);

    // =========================================================
    // PAGINATION
    // =========================================================

    const totalItems = filteredCoupons.length;

    const totalPages = Math.ceil(
        totalItems / pageSize
    );

    const paginatedCoupons = useMemo(() => {
        const startIndex =
            (currentPage - 1) * pageSize;

        const endIndex =
            startIndex + pageSize;

        return filteredCoupons.slice(
            startIndex,
            endIndex
        );
    }, [
        filteredCoupons,
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
        typeFilter,
        statusFilter,
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
        setTypeFilter("");
        setStatusFilter("");
        setCurrentPage(1);
    };

    // =========================================================
    // SUMMARY
    // =========================================================

    const activeCount = coupons.filter(
        (coupon) => coupon.status === "Active"
    ).length;

    const expiredCount = coupons.filter(
        (coupon) => coupon.status === "Expired"
    ).length;

    const usedCount = coupons.filter(
        (coupon) =>
            Number(coupon.usedCount || 0) > 0
    ).length;

    // =========================================================
    // FAST COUPON IMPORT
    // =========================================================

    const handleFastCouponImport = async () => {
        if (syncing) return;

        setSyncing("fast");
        setSyncMessage("");
        setSyncError("");

        try {
            /*
             * API WILL BE CONNECTED HERE
             *
             * Example later:
             *
             * await importCoupons({
             *     merchantId,
             *     storeId,
             * });
             */

            // Temporary simulation until API is ready
            await new Promise((resolve) =>
                setTimeout(resolve, 1200)
            );

            setSyncMessage(
                "Coupons imported successfully."
            );
        } catch (error) {
            setSyncError(
                error?.message ||
                "Failed to import coupons."
            );
        } finally {
            setSyncing("");
        }
    };

    // =========================================================
    // LATEST COUPON UPDATES
    // =========================================================

    const handleLatestCouponUpdates = async () => {
        if (syncing) return;

        setSyncing("latest");
        setSyncMessage("");
        setSyncError("");

        try {
            /*
             * API WILL BE CONNECTED HERE
             *
             * Example later:
             *
             * await updateLatestCoupons({
             *     merchantId,
             *     storeId,
             * });
             */

            // Temporary simulation until API is ready
            await new Promise((resolve) =>
                setTimeout(resolve, 1000)
            );

            setSyncMessage(
                "Latest coupon updates completed successfully."
            );
        } catch (error) {
            setSyncError(
                error?.message ||
                "Failed to update latest coupons."
            );
        } finally {
            setSyncing("");
        }
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="coupons-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="coupons-header">

                <div className="coupons-title-area">

                    <div className="coupons-title-icon">
                        <i className="bi bi-ticket-perforated" />
                    </div>

                    <div>
                        <h1>Coupons</h1>

                        <p>
                            View coupons available for this
                            store.
                        </p>
                    </div>

                </div>

                <div className="coupons-header-actions">

                    {/* FAST COUPON IMPORT */}

                    <button
                        type="button"
                        className="coupon-sync-btn coupon-sync-import"
                        onClick={handleFastCouponImport}
                        disabled={Boolean(syncing)}
                    >
                        {syncing === "fast" ? (
                            <>
                                <span className="coupon-sync-spinner" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-lightning-charge-fill" />
                                Fast Coupon Import
                            </>
                        )}
                    </button>

                    {/* LATEST UPDATES */}

                    <button
                        type="button"
                        className="coupon-sync-btn coupon-sync-update"
                        onClick={handleLatestCouponUpdates}
                        disabled={Boolean(syncing)}
                    >
                        {syncing === "latest" ? (
                            <>
                                <span className="coupon-sync-spinner" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-repeat" />
                                Latest Updates
                            </>
                        )}
                    </button>

                    {/* STORE CONTEXT */}

                    {store && (
                        <div className="coupons-store-context">

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

            </div>

            {/* =================================================
                SYNC MESSAGE
            ================================================= */}

            {(syncMessage || syncError) && (
                <div
                    className={
                        syncError
                            ? "coupons-sync-message error"
                            : "coupons-sync-message success"
                    }
                >

                    <i
                        className={
                            syncError
                                ? "bi bi-exclamation-circle"
                                : "bi bi-check-circle"
                        }
                    />

                    <span>
                        {syncError || syncMessage}
                    </span>

                    <button
                        type="button"
                        onClick={() => {
                            setSyncMessage("");
                            setSyncError("");
                        }}
                        aria-label="Close"
                    >
                        <i className="bi bi-x" />
                    </button>

                </div>
            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="coupons-summary">

                {/* TOTAL */}

                <div className="coupon-summary-card">

                    <div className="coupon-summary-icon purple">
                        <i className="bi bi-ticket-perforated" />
                    </div>

                    <div>
                        <span>Total Coupons</span>

                        <strong>
                            {coupons.length}
                        </strong>
                    </div>

                </div>

                {/* ACTIVE */}

                <div className="coupon-summary-card">

                    <div className="coupon-summary-icon green">
                        <i className="bi bi-check-circle" />
                    </div>

                    <div>
                        <span>Active</span>

                        <strong>
                            {activeCount}
                        </strong>
                    </div>

                </div>

                {/* USED */}

                <div className="coupon-summary-card">

                    <div className="coupon-summary-icon orange">
                        <i className="bi bi-clock-history" />
                    </div>

                    <div>
                        <span>Used</span>

                        <strong>
                            {usedCount}
                        </strong>
                    </div>

                </div>

                {/* EXPIRED */}

                <div className="coupon-summary-card">

                    <div className="coupon-summary-icon red">
                        <i className="bi bi-calendar-x" />
                    </div>

                    <div>
                        <span>Expired</span>

                        <strong>
                            {expiredCount}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                MAIN CARD
            ================================================= */}

            <div className="coupons-card">

                {/* =================================================
                    TOOLBAR
                ================================================= */}

                <div className="coupons-toolbar">

                    {/* SEARCH */}

                    <div className="coupons-search">

                        <i className="bi bi-search" />

                        <input
                            type="text"
                            placeholder="Search coupon code, order ID..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                    {/* TYPE */}

                    <select
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(e.target.value)
                        }
                    >
                        <option value="">
                            All Types
                        </option>

                        {couponTypes.map((type) => (
                            <option
                                key={type}
                                value={type}
                            >
                                {type}
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

                        <option value="Active">
                            Active
                        </option>

                        <option value="Expired">
                            Expired
                        </option>

                        <option value="Used">
                            Used
                        </option>

                    </select>

                    {/* CLEAR */}

                    <button
                        type="button"
                        className="coupons-clear-btn"
                        onClick={clearFilters}
                    >
                        <i className="bi bi-arrow-counterclockwise" />
                        Clear
                    </button>

                </div>

                {/* =================================================
                    TABLE HEADER
                ================================================= */}

                <div className="coupons-table-heading">

                    <div>
                        Coupons

                        <span>
                            {filteredCoupons.length}
                        </span>
                    </div>

                    <div className="coupon-read-only">

                        <i className="bi bi-lock" />

                        Read Only

                    </div>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="coupons-table-wrapper">

                    <table className="coupons-table">

                        <thead>

                            <tr>

                                <th>CODE</th>
                                <th>ISSUED ORDER ID</th>
                                <th>USED ORDER ID</th>
                                <th>COUPON TYPE</th>
                                <th>COUPON AMOUNT</th>
                                <th>DESCRIPTION</th>
                                <th>PRODUCT IDS</th>
                                <th>USAGE / LIMIT</th>
                                <th>EXPIRY DATE</th>
                                <th>BARCODE</th>

                            </tr>

                        </thead>

                        <tbody>

                            {paginatedCoupons.map(
                                (coupon) => (
                                    <CouponRow
                                        key={coupon.id}
                                        coupon={coupon}
                                    />
                                )
                            )}

                        </tbody>

                    </table>

                </div>

                {/* =================================================
                    EMPTY
                ================================================= */}

                {filteredCoupons.length === 0 && (
                    <div className="coupons-empty">

                        <div className="coupons-empty-icon">
                            <i className="bi bi-ticket-perforated" />
                        </div>

                        <h3>
                            No coupons found
                        </h3>

                        <p>
                            Try changing your search or
                            filters.
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

                {filteredCoupons.length > 0 && (
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

                {filteredCoupons.length > 0 && (
                    <div className="coupons-footer">

                        <span className="coupons-source">

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
// COUPON ROW
// =========================================================

function CouponRow({ coupon }) {

    const statusClass =
        coupon.status === "Active"
            ? "active"
            : coupon.status === "Expired"
                ? "expired"
                : "used";

    return (
        <tr>

            {/* =================================================
                CODE
            ================================================= */}

            <td>

                <div className="coupon-code-cell">

                    <div className="coupon-code-icon">
                        <i className="bi bi-ticket-perforated" />
                    </div>

                    <div>

                        <strong>
                            {coupon.code}
                        </strong>

                        <span
                            className={`coupon-status ${statusClass}`}
                        >
                            <i className="bi bi-circle-fill" />
                            {coupon.status}
                        </span>

                    </div>

                </div>

            </td>

            {/* =================================================
                ISSUED ORDER ID
            ================================================= */}

            <td>

                <OrderList
                    values={coupon.issuedOrderIds}
                />

            </td>

            {/* =================================================
                USED ORDER ID
            ================================================= */}

            <td>

                <OrderList
                    values={coupon.usedOrderIds}
                />

            </td>

            {/* =================================================
                COUPON TYPE
            ================================================= */}

            <td>

                <span className="coupon-type">
                    {coupon.type}
                </span>

            </td>

            {/* =================================================
                COUPON AMOUNT
            ================================================= */}

            <td>

                <strong className="coupon-amount">
                    {coupon.amount}
                </strong>

            </td>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <td>

                <span className="coupon-description">
                    {coupon.description || "—"}
                </span>

            </td>

            {/* =================================================
                PRODUCT IDS
            ================================================= */}

            <td>

                <ProductIds
                    values={coupon.productIds}
                />

            </td>

            {/* =================================================
                USAGE / LIMIT
            ================================================= */}

            <td>

                <div className="coupon-usage">

                    <strong>
                        {coupon.usedCount || 0}
                    </strong>

                    <span>/</span>

                    <span>
                        {coupon.usageLimit || "∞"}
                    </span>

                </div>

            </td>

            {/* =================================================
                EXPIRY DATE
            ================================================= */}

            <td>

                <span className="coupon-expiry">
                    {coupon.expiryDate || "—"}
                </span>

            </td>

            {/* =================================================
                BARCODE
            ================================================= */}

            <td>

                <Barcode
                    value={coupon.code}
                />

            </td>

        </tr>
    );
}

// =========================================================
// ORDER LIST
// =========================================================

function OrderList({ values }) {

    if (!values || values.length === 0) {
        return (
            <span className="empty-value">
                —
            </span>
        );
    }

    const visible = values.slice(0, 2);

    return (
        <div className="coupon-order-list">

            {visible.map((order) => (
                <span key={order}>
                    {order}
                </span>
            ))}

            {values.length > 2 && (
                <small>
                    +{values.length - 2} more
                </small>
            )}

        </div>
    );
}

// =========================================================
// PRODUCT IDS
// =========================================================

function ProductIds({ values }) {

    if (!values || values.length === 0) {
        return (
            <span className="empty-value">
                —
            </span>
        );
    }

    return (
        <div className="coupon-product-ids">

            {values.slice(0, 3).map((id) => (
                <span key={id}>
                    {id}
                </span>
            ))}

            {values.length > 3 && (
                <small>
                    +{values.length - 3} more
                </small>
            )}

        </div>
    );
}

// =========================================================
// BARCODE
// =========================================================

function Barcode({ value }) {

    return (
        <div className="coupon-barcode-cell">

            <div className="barcode">

                {Array.from(
                    { length: 24 },
                    (_, index) => (
                        <span
                            key={index}
                            style={{
                                width:
                                    index % 4 === 0
                                        ? "3px"
                                        : index % 2 === 0
                                            ? "2px"
                                            : "1px",
                            }}
                        />
                    )
                )}

            </div>

            <small>
                {value}
            </small>

            <button
                type="button"
                className="barcode-download"
                onClick={() => {
                    alert(
                        `Barcode download will be connected to the backend for ${value}.`
                    );
                }}
            >
                <i className="bi bi-download" />
                Download
            </button>

        </div>
    );
}