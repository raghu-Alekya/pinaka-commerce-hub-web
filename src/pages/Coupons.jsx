import { useMemo, useState } from "react";
import { couponsSeed } from "../data/data";

export default function Coupons({
    embedded = false,
    merchantId,
    storeId,
    store,
}) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const coupons = couponsSeed || [];

    const couponTypes = [
        ...new Set(
            coupons
                .map((coupon) => coupon.type)
                .filter(Boolean)
        ),
    ];

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

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("");
        setStatusFilter("");
    };

    const activeCount = coupons.filter(
        (coupon) => coupon.status === "Active"
    ).length;

    const expiredCount = coupons.filter(
        (coupon) => coupon.status === "Expired"
    ).length;

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

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="coupons-summary">

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

                <div className="coupon-summary-card">
                    <div className="coupon-summary-icon orange">
                        <i className="bi bi-clock-history" />
                    </div>

                    <div>
                        <span>Used</span>
                        <strong>
                            {coupons.filter(
                                (coupon) =>
                                    Number(
                                        coupon.usedCount || 0
                                    ) > 0
                            ).length}
                        </strong>
                    </div>
                </div>

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
                            {filteredCoupons.map(
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
                    FOOTER
                ================================================= */}

                {filteredCoupons.length > 0 && (
                    <div className="coupons-footer">

                        <span>
                            Showing{" "}
                            <strong>
                                {filteredCoupons.length}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {coupons.length}
                            </strong>{" "}
                            coupons
                        </span>

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

/* =========================================================
   COUPON ROW
========================================================= */

function CouponRow({ coupon }) {
    const statusClass =
        coupon.status === "Active"
            ? "active"
            : coupon.status === "Expired"
            ? "expired"
            : "used";

    return (
        <tr>

            {/* CODE */}

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

            {/* ISSUED ORDER ID */}

            <td>
                <OrderList
                    values={coupon.issuedOrderIds}
                />
            </td>

            {/* USED ORDER ID */}

            <td>
                <OrderList
                    values={coupon.usedOrderIds}
                />
            </td>

            {/* COUPON TYPE */}

            <td>
                <span className="coupon-type">
                    {coupon.type}
                </span>
            </td>

            {/* COUPON AMOUNT */}

            <td>
                <strong className="coupon-amount">
                    {coupon.amount}
                </strong>
            </td>

            {/* DESCRIPTION */}

            <td>
                <span className="coupon-description">
                    {coupon.description || "—"}
                </span>
            </td>

            {/* PRODUCT IDS */}

            <td>
                <ProductIds
                    values={coupon.productIds}
                />
            </td>

            {/* USAGE / LIMIT */}

            <td>
                <div className="coupon-usage">

                    <strong>
                        {coupon.usedCount || 0}
                    </strong>

                    <span>
                        /
                    </span>

                    <span>
                        {coupon.usageLimit || "∞"}
                    </span>

                </div>
            </td>

            {/* EXPIRY DATE */}

            <td>
                <span className="coupon-expiry">
                    {coupon.expiryDate || "—"}
                </span>
            </td>

            {/* BARCODE */}

            <td>
                <Barcode
                    value={coupon.code}
                />
            </td>

        </tr>
    );
}

/* =========================================================
   ORDER LIST
========================================================= */

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

/* =========================================================
   PRODUCT IDS
========================================================= */

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

/* =========================================================
   BARCODE
========================================================= */

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