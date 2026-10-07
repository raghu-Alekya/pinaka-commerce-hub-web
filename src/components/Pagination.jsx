export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    itemLabel = "items",
}) {
    const isEmpty = totalItems === 0;

    const startItem = isEmpty
        ? 0
        : (currentPage - 1) * pageSize + 1;

    const endItem = isEmpty
        ? 0
        : Math.min(currentPage * pageSize, totalItems);

    const getPageNumbers = () => { const pages = []; if (totalPages <= 0) { return pages; } 
    if (totalPages === 1) { pages.push(1); return pages; } if (currentPage === 1)
         { pages.push(1, 2); } else if (currentPage === totalPages) { pages.push(totalPages - 1, totalPages); } 
    else { pages.push(currentPage, currentPage + 1); } return pages; };

    return (
        <div className="pagination-container">

            {/* LEFT - SHOWING COUNT */}

            <div className="pagination-info">
                Showing{" "}
                <strong>{startItem}</strong>
                {" to "}
                <strong>{endItem}</strong>
                {" of "}
                <strong>{totalItems}</strong>{" "}
                {itemLabel}
            </div>

            {/* RIGHT - CONTROLS */}

            <div className="pagination-controls">

                {/* ROWS PER PAGE */}

                <div className="pagination-page-size">
                    <span>Rows per page:</span>

                    <div className="pagination-select-wrapper">
                        <select
                            value={pageSize}
                            onChange={(e) =>
                                onPageSizeChange(
                                    Number(e.target.value)
                                )
                            }
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>

                        <i className="bi bi-chevron-down pagination-select-arrow" />
                    </div>
                </div>

                {/* PREVIOUS */}

                <button
                    type="button"
                    className="pagination-arrow"
                    disabled={isEmpty || currentPage === 1}
                    onClick={() =>
                        onPageChange(currentPage - 1)
                    }
                    aria-label="Previous page"
                >
                    <i className="bi bi-chevron-left" />
                </button>

                {/* PAGE NUMBERS */}

                {!isEmpty && totalPages > 0 && (
                    <div className="pagination-pages">
                        {getPageNumbers().map(
                            (page, index) =>
                                page === "..." ? (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="pagination-ellipsis"
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        type="button"
                                        className={
                                            page === currentPage
                                                ? "pagination-page active"
                                                : "pagination-page"
                                        }
                                        onClick={() =>
                                            onPageChange(page)
                                        }
                                    >
                                        {page}
                                    </button>
                                )
                        )}
                    </div>
                )}

                {/* NEXT */}

                <button
                    type="button"
                    className="pagination-arrow"
                    disabled={
                        isEmpty ||
                        currentPage === totalPages ||
                        totalPages === 0
                    }
                    onClick={() =>
                        onPageChange(currentPage + 1)
                    }
                    aria-label="Next page"
                >
                    <i className="bi bi-chevron-right" />
                </button>

            </div>
        </div>
    );
}

