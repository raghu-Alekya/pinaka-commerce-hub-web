import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/pagination";
import { productsSeed } from "../data/data";
import "../styles/products.css";

export default function Products({
    embedded = false,
    merchantId,
    storeId,
    store,
}) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState("");
    const [stockStatus, setStockStatus] = useState("");

    // =========================================================
    // PAGINATION
    // =========================================================

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // =========================================================
    // PRODUCT SYNC STATES
    // =========================================================

    const [syncing, setSyncing] = useState("");
    const [syncMessage, setSyncMessage] = useState("");
    const [syncError, setSyncError] = useState("");

    // =========================================================
    // PRODUCTS
    // =========================================================

    const products = productsSeed || [];

    // =========================================================
    // CATEGORIES
    // =========================================================

    const categories = useMemo(() => {
        return [
            ...new Set(
                products
                    .map((product) => product.category)
                    .filter(Boolean)
            ),
        ];
    }, [products]);

    // =========================================================
    // TYPES
    // =========================================================

    const types = useMemo(() => {
        return [
            ...new Set(
                products
                    .map((product) => product.type)
                    .filter(Boolean)
            ),
        ];
    }, [products]);

    // =========================================================
    // FILTER PRODUCTS
    // =========================================================

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const text = `
                ${product.name || ""}
                ${product.sku || ""}
                ${product.category || ""}
                ${product.brand || ""}
            `.toLowerCase();

            const matchesSearch =
                !search ||
                text.includes(search.toLowerCase());

            const matchesCategory =
                !category ||
                product.category === category;

            const matchesType =
                !type ||
                product.type === type;

            const matchesStock =
                !stockStatus ||
                product.stockStatus === stockStatus;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesType &&
                matchesStock
            );
        });
    }, [
        products,
        search,
        category,
        type,
        stockStatus,
    ]);

    // =========================================================
    // PAGINATION CALCULATIONS
    // =========================================================

    const totalItems = filteredProducts.length;

    const totalPages = Math.ceil(
        totalItems / pageSize
    );

    const paginatedProducts = useMemo(() => {
        const startIndex =
            (currentPage - 1) * pageSize;

        const endIndex =
            startIndex + pageSize;

        return filteredProducts.slice(
            startIndex,
            endIndex
        );
    }, [
        filteredProducts,
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
        category,
        type,
        stockStatus,
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
        setCategory("");
        setType("");
        setStockStatus("");
        setCurrentPage(1);
    };

    // =========================================================
    // FAST PRODUCT IMPORT
    // =========================================================

    const handleFastProductImport = async () => {
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
             * await importProducts({
             *     merchantId,
             *     storeId,
             * });
             */

            // Temporary simulation until API is ready
            await new Promise((resolve) =>
                setTimeout(resolve, 1200)
            );

            setSyncMessage(
                "Products imported successfully."
            );
        } catch (error) {
            setSyncError(
                error?.message ||
                "Failed to import products."
            );
        } finally {
            setSyncing("");
        }
    };

    // =========================================================
    // LATEST PRODUCT UPDATES
    // =========================================================

    const handleLatestProductUpdates = async () => {
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
             * await updateLatestProducts({
             *     merchantId,
             *     storeId,
             * });
             */

            // Temporary simulation until API is ready
            await new Promise((resolve) =>
                setTimeout(resolve, 1000)
            );

            setSyncMessage(
                "Latest product updates completed successfully."
            );
        } catch (error) {
            setSyncError(
                error?.message ||
                "Failed to update latest products."
            );
        } finally {
            setSyncing("");
        }
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="products-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="products-header">

                <div>
                    <div className="products-title-row">

                        <div className="products-title-icon">
                            <i className="bi bi-box-seam" />
                        </div>

                        <div>
                            <h1>Products</h1>

                            <p>
                                View products available for this
                                store.
                            </p>
                        </div>

                    </div>
                </div>

                <div className="products-header-actions">

                    {/* FAST PRODUCT IMPORT */}

                    <button
                        type="button"
                        className="product-sync-btn product-sync-import"
                        onClick={handleFastProductImport}
                        disabled={Boolean(syncing)}
                    >
                        {syncing === "fast" ? (
                            <>
                                <span className="sync-spinner" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-lightning-charge-fill" />
                                Fast Product Import
                            </>
                        )}
                    </button>

                    {/* LATEST PRODUCT UPDATES */}

                    <button
                        type="button"
                        className="product-sync-btn product-sync-update"
                        onClick={handleLatestProductUpdates}
                        disabled={Boolean(syncing)}
                    >
                        {syncing === "latest" ? (
                            <>
                                <span className="sync-spinner" />
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
                        <div className="products-store-context">

                            <i className="bi bi-shop" />

                            <div>
                                <span>STORE</span>

                                <strong>
                                    {store.name}
                                </strong>
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
                            ? "products-sync-message error"
                            : "products-sync-message success"
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

            <div className="products-summary">

                {/* TOTAL PRODUCTS */}

                <div className="product-summary-card">

                    <div className="summary-card-icon purple">
                        <i className="bi bi-box-seam" />
                    </div>

                    <div>
                        <span>Total Products</span>

                        <strong>
                            {products.length}
                        </strong>
                    </div>

                </div>

                {/* IN STOCK */}

                <div className="product-summary-card">

                    <div className="summary-card-icon green">
                        <i className="bi bi-check-circle" />
                    </div>

                    <div>
                        <span>In Stock</span>

                        <strong>
                            {
                                products.filter(
                                    (product) =>
                                        product.stockStatus ===
                                        "In stock"
                                ).length
                            }
                        </strong>
                    </div>

                </div>

                {/* LOW STOCK */}

                <div className="product-summary-card">

                    <div className="summary-card-icon orange">
                        <i className="bi bi-exclamation-circle" />
                    </div>

                    <div>
                        <span>Low Stock</span>

                        <strong>
                            {
                                products.filter(
                                    (product) =>
                                        product.stockStatus ===
                                        "Low stock"
                                ).length
                            }
                        </strong>
                    </div>

                </div>

                {/* OUT OF STOCK */}

                <div className="product-summary-card">

                    <div className="summary-card-icon red">
                        <i className="bi bi-x-circle" />
                    </div>

                    <div>
                        <span>Out of Stock</span>

                        <strong>
                            {
                                products.filter(
                                    (product) =>
                                        product.stockStatus ===
                                        "Out of stock"
                                ).length
                            }
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                PRODUCTS CARD
            ================================================= */}

            <div className="products-card">

                {/* =================================================
                    TOOLBAR
                ================================================= */}

                <div className="products-toolbar">

                    {/* SEARCH */}

                    <div className="products-search">

                        <i className="bi bi-search" />

                        <input
                            type="text"
                            placeholder="Search products, SKU, category..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                    {/* CATEGORY */}

                    <select
                        value={category}
                        onChange={(e) =>
                            setCategory(e.target.value)
                        }
                    >
                        <option value="">
                            All Categories
                        </option>

                        {categories.map((item) => (
                            <option
                                key={item}
                                value={item}
                            >
                                {item}
                            </option>
                        ))}
                    </select>

                    {/* TYPE */}

                    <select
                        value={type}
                        onChange={(e) =>
                            setType(e.target.value)
                        }
                    >
                        <option value="">
                            All Types
                        </option>

                        {types.map((item) => (
                            <option
                                key={item}
                                value={item}
                            >
                                {item}
                            </option>
                        ))}
                    </select>

                    {/* STOCK */}

                    <select
                        value={stockStatus}
                        onChange={(e) =>
                            setStockStatus(e.target.value)
                        }
                    >
                        <option value="">
                            All Stock
                        </option>

                        <option value="In stock">
                            In Stock
                        </option>

                        <option value="Low stock">
                            Low Stock
                        </option>

                        <option value="Out of stock">
                            Out of Stock
                        </option>
                    </select>

                    {/* CLEAR */}

                    <button
                        type="button"
                        className="products-clear-btn"
                        onClick={clearFilters}
                    >
                        <i className="bi bi-arrow-counterclockwise" />
                        Clear
                    </button>

                </div>

                {/* =================================================
                    TABLE HEADER
                ================================================= */}

                <div className="products-table-header">

                    <div>
                        Products

                        <span>
                            {filteredProducts.length}
                        </span>
                    </div>

                    <div className="read-only-badge">

                        <i className="bi bi-lock" />

                        Read Only

                    </div>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="products-table-wrapper">

                    <table className="products-table">

                        <thead>

                            <tr>

                                <th>PRODUCT</th>
                                <th>SKU</th>
                                <th>STOCK</th>
                                <th>PRICE</th>
                                <th>CATEGORY</th>
                                <th>TAGS</th>
                                <th>BRAND</th>
                                <th>UPDATED</th>
                                <th>STATUS</th>

                            </tr>

                        </thead>

                        <tbody>

                            {paginatedProducts.map(
                                (product) => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                    />
                                )
                            )}

                        </tbody>

                    </table>

                </div>

                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {filteredProducts.length === 0 && (
                    <div className="products-empty">

                        <div>
                            <i className="bi bi-box-seam" />
                        </div>

                        <h3>
                            No products found
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

                {filteredProducts.length > 0 && (
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

                {filteredProducts.length > 0 && (
                    <div className="products-footer">

                        <span className="products-source">

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
// PRODUCT ROW
// =========================================================

function ProductRow({ product }) {

    const stockClass =
        product.stockStatus === "In stock"
            ? "in-stock"
            : product.stockStatus === "Low stock"
                ? "low-stock"
                : "out-stock";

    return (
        <tr>

            {/* =================================================
                PRODUCT
            ================================================= */}

            <td>

                <div className="product-info">

                    <div className="product-image">

                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                            />
                        ) : (
                            <i className="bi bi-image" />
                        )}

                    </div>

                    <div>

                        <strong>
                            {product.name}
                        </strong>

                        {product.type && (
                            <small>
                                {product.type}
                            </small>
                        )}

                    </div>

                </div>

            </td>

            {/* =================================================
                SKU
            ================================================= */}

            <td>

                <span className="product-sku">
                    {product.sku || "—"}
                </span>

            </td>

            {/* =================================================
                STOCK
            ================================================= */}

            <td>

                <div className="stock-info">

                    <span
                        className={`stock-dot ${stockClass}`}
                    />

                    <div>

                        <strong
                            className={stockClass}
                        >
                            {product.stockStatus}
                        </strong>

                        {product.quantity !==
                            undefined && (
                                <small>
                                    {product.quantity} units
                                </small>
                            )}

                    </div>

                </div>

            </td>

            {/* =================================================
                PRICE
            ================================================= */}

            <td>

                <strong className="product-price">
                    {product.price || "$0.00"}
                </strong>

            </td>

            {/* =================================================
                CATEGORY
            ================================================= */}

            <td>

                <span className="category-chip">
                    {product.category ||
                        "Uncategorized"}
                </span>

            </td>

            {/* =================================================
                TAGS
            ================================================= */}

            <td>

                <div className="product-tags">

                    {product.tags &&
                    product.tags.length > 0 ? (
                        product.tags.map((tag) => (
                            <span
                                className="product-tag"
                                key={tag}
                            >
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="no-tags">
                            —
                        </span>
                    )}

                </div>

            </td>

            {/* =================================================
                BRAND
            ================================================= */}

            <td>

                <span className="product-brand">
                    {product.brand || "—"}
                </span>

            </td>

            {/* =================================================
                UPDATED
            ================================================= */}

            <td>

                <span className="product-date">
                    {product.updatedAt ||
                        "Recently"}
                </span>

            </td>

            {/* =================================================
                STATUS
            ================================================= */}

            <td>

                <span className="product-status">

                    <i className="bi bi-check-circle-fill" />

                    Published

                </span>

            </td>

        </tr>
    );
}