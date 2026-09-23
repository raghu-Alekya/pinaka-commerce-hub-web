export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
}) {
    if (!totalItems) {
        return null;
    }

    const startItem =
        (currentPage - 1) * pageSize + 1;

    const endItem = Math.min(
        currentPage * pageSize,
        totalItems
    );

    const getPageNumbers = () => {
        const pages = [];

        if (totalPages <= 5) {
            for (
                let i = 1;
                i <= totalPages;
                i++
            ) {
                pages.push(i);
            }

            return pages;
        }

        pages.push(1);

        if (currentPage > 3) {
            pages.push("...");
        }

        const start = Math.max(
            2,
            currentPage - 1
        );

        const end = Math.min(
            totalPages - 1,
            currentPage + 1
        );

        for (
            let i = start;
            i <= end;
            i++
        ) {
            pages.push(i);
        }

        if (
            currentPage <
            totalPages - 2
        ) {
            pages.push("...");
        }

        pages.push(totalPages);

        return pages;
    };

    return (
        <div className="pagination-container">

            {/* LEFT - SHOWING COUNT */}

            <div className="pagination-info">
                Showing{" "}
                <strong>
                    {startItem}
                </strong>
                {" – "}
                <strong>
                    {endItem}
                </strong>
                {" of "}
                <strong>
                    {totalItems}
                </strong>
            </div>

            {/* RIGHT - CONTROLS */}

            <div className="pagination-controls">

                {/* ROWS PER PAGE */}

                <div className="pagination-page-size">

                    <span>
                        Rows per page:
                    </span>

                    <select
                        value={pageSize}
                        onChange={(e) =>
                            onPageSizeChange(
                                Number(
                                    e.target.value
                                )
                            )
                        }
                    >
                        <option value={10}>
                            10
                        </option>

                        <option value={25}>
                            25
                        </option>

                        <option value={50}>
                            50
                        </option>

                        <option value={100}>
                            100
                        </option>
                    </select>

                </div>

                {/* PREVIOUS */}

                <button
                    type="button"
                    className="pagination-arrow"
                    disabled={
                        currentPage === 1
                    }
                    onClick={() =>
                        onPageChange(
                            currentPage - 1
                        )
                    }
                    aria-label="Previous page"
                >
                    <i className="bi bi-chevron-left" />
                </button>

                {/* PAGE NUMBERS */}

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
                                        page ===
                                        currentPage
                                            ? "pagination-page active"
                                            : "pagination-page"
                                    }
                                    onClick={() =>
                                        onPageChange(
                                            page
                                        )
                                    }
                                >
                                    {page}
                                </button>
                            )
                    )}

                </div>

                {/* NEXT */}

                <button
                    type="button"
                    className="pagination-arrow"
                    disabled={
                        currentPage ===
                        totalPages
                    }
                    onClick={() =>
                        onPageChange(
                            currentPage + 1
                        )
                    }
                    aria-label="Next page"
                >
                    <i className="bi bi-chevron-right" />
                </button>

            </div>

        </div>
    );
}