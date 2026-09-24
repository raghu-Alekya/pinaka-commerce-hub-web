import { useEffect, useRef, useState } from "react";
import "../styles/merchant-vendors.css";
import { getVendors } from "../api/vendors";

const idOf = (value) =>
    String(
        typeof value === "object"
            ? value.vendorId ??
              value.id ??
              value._id ??
              ""
            : value ?? ""
    );

const normalize = (value) => ({
    ...value,

    id: idOf(value),

    name:
        value.name ||
        value.vendorName ||
        "Unnamed vendor",

    type:
        value.type ||
        value.vendorType ||
        "—",

    phone:
        value.phone ||
        value.mobile ||
        value.mobileNumber ||
        value.phoneNumber ||
        value.contactPhone ||
        "",

    contact:
        value.contactName ||
        value.contactPerson?.name ||
        (typeof value.contactPerson === "string"
            ? value.contactPerson
            : "") ||
        "—",

    status: String(
        value.status || "Active"
    ),

    // Assigned stores count only
    assignedStoreCount:
        Array.isArray(value.stores)
            ? value.stores.length
            : Number(
                  value.assignedStoreCount ??
                      value.assignedStoresCount ??
                      value.storeCount ??
                      0
              ),
});

const active = (vendor) =>
    vendor.status.toLowerCase() ===
    "active";

const matches = (
    vendor,
    query
) =>
    [
        vendor.name,
        vendor.type,
        vendor.contact,
        vendor.email,
        vendor.phone,
    ]
        .join(" ")
        .toLowerCase()
        .includes(
            query.trim().toLowerCase()
        );

// onSaveAssignments({ merchantId, vendorIds })
// must resolve only after saving succeeds.

export default function MerchantVendors({
    merchantId,
    masterVendors: initialMasterVendors = [],
    assignedVendorIds = [],
    onSaveAssignments,
    loading = false,
    error = "",
}) {
    const [ids, setIds] = useState(() =>
        assignedVendorIds.map(idOf)
    );

    const [query, setQuery] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [sort, setSort] = useState({
        key: "name",
        direction: 1,
    });

    const [modal, setModal] =
        useState(null);

    const [selection, setSelection] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [busy, setBusy] =
        useState(false);

    const [saveError, setSaveError] =
        useState("");

    const [masterVendors, setMasterVendors] =
        useState(initialMasterVendors);

    const [masterLoading, setMasterLoading] =
        useState(false);

    const [masterError, setMasterError] =
        useState("");

    const lock = useRef(false);
    const dialog = useRef(null);
    const addButton = useRef(null);

    const signature = JSON.stringify(
        assignedVendorIds.map(idOf)
    );

    useEffect(() => {
        setIds(JSON.parse(signature));
        setPage(1);
        setModal(null);
    }, [merchantId, signature]);

    useEffect(() => {
        if (modal) {
            dialog.current?.showModal();
        } else if (
            dialog.current?.open
        ) {
            dialog.current.close();
            addButton.current?.focus();
        }
    }, [modal]);

    // =========================================================
    // MASTER VENDORS
    // =========================================================

    const vendors = Array.from(
        new Map(
            masterVendors
                .map(normalize)
                .filter(
                    (vendor) => vendor.id
                )
                .map((vendor) => [
                    vendor.id,
                    vendor,
                ])
        ).values()
    );

    // =========================================================
    // ASSIGNED VENDORS
    // =========================================================

    const assigned = ids.map(
        (id) =>
            vendors.find(
                (vendor) =>
                    vendor.id === id
            ) || {
                id,
                name: `Vendor ${id}`,
                type: "—",
                contact: "—",
                status: "Unavailable",
                assignedStoreCount: 0,
            }
    );

    // =========================================================
    // FILTER + SORT
    // =========================================================

    const rows = assigned
        .filter((vendor) =>
            matches(vendor, query)
        )
        .sort(
            (a, b) =>
                String(
                    a[sort.key] ?? ""
                ).localeCompare(
                    String(
                        b[sort.key] ?? ""
                    )
                ) * sort.direction
        );

    const pages = Math.max(
        1,
        Math.ceil(rows.length / 10)
    );

    const current = Math.min(
        page,
        pages
    );

    // =========================================================
    // AVAILABLE VENDORS
    // =========================================================

    const available = vendors.filter(
        (vendor) =>
            !ids.includes(vendor.id) &&
            matches(vendor, search)
    );

    const selectable =
        available.filter(active);

    // =========================================================
    // LOAD MASTER VENDORS
    // =========================================================

    async function openAddVendorModal() {
        if (masterLoading) {
            return;
        }

        setMasterLoading(true);
        setMasterError("");
        setSelection([]);
        setSearch("");
        setSaveError("");

        try {
            const vendors = await getVendors();

            setMasterVendors(
                Array.isArray(vendors) ? vendors : []
            );

            setModal({
                type: "select",
            });
        } catch (e) {
            setMasterError(
                e?.message ||
                    "Unable to load master vendors."
            );

            setModal({
                type: "select",
            });
        } finally {
            setMasterLoading(false);
        }
    }

    // =========================================================
    // CLOSE
    // =========================================================

    const close = () => {
        if (!lock.current) {
            setModal(null);
            setSaveError("");
            setMasterError("");
        }
    };

    // =========================================================
    // SAVE
    // =========================================================

    async function save(next) {
        if (lock.current) {
            return;
        }

        if (
            typeof onSaveAssignments !==
            "function"
        ) {
            setSaveError(
                "Connect onSaveVendorAssignments to save merchant vendor assignments."
            );

            return;
        }

        lock.current = true;
        setBusy(true);
        setSaveError("");

        try {
            await onSaveAssignments({
                merchantId,
                vendorIds: next,
            });

            setIds(next);
            setModal(null);
        } catch (e) {
            setSaveError(
                e.message ||
                    "Unable to save assignments."
            );
        } finally {
            lock.current = false;
            setBusy(false);
        }
    }

    // =========================================================
    // STATUS BADGE
    // =========================================================

    const badge = (vendor) => (
        <span
            className={`mv-badge ${
                active(vendor)
                    ? "mv-active"
                    : "mv-inactive"
            }`}
        >
            ● {vendor.status}
        </span>
    );

    // =========================================================
    // VENDOR NAME
    // =========================================================

    const name = (vendor) => (
        <span className="mv-name">
            <strong>
                {vendor.name}
            </strong>
        </span>
    );

    // =========================================================
    // TABLE HEADINGS
    // =========================================================

    function headings(select = false) {
        return (
            <tr>
                {select && (
                    <th>
                        <input
                            type="checkbox"
                            aria-label="Select all available active vendors in search"
                            checked={
                                selectable.length >
                                    0 &&
                                selectable.every(
                                    (vendor) =>
                                        selection.includes(
                                            vendor.id
                                        )
                                )
                            }
                            disabled={
                                !selectable.length ||
                                busy
                            }
                            onChange={(e) =>
                                setSelection(
                                    (old) =>
                                        e
                                            .target
                                            .checked
                                            ? [
                                                  ...new Set(
                                                      [
                                                          ...old,
                                                          ...selectable.map(
                                                              (
                                                                  vendor
                                                              ) =>
                                                                  vendor.id
                                                          ),
                                                      ]
                                                  ),
                                              ]
                                            : old.filter(
                                                  (
                                                      id
                                                  ) =>
                                                      !selectable.some(
                                                          (
                                                              vendor
                                                          ) =>
                                                              vendor.id ===
                                                              id
                                                      )
                                              )
                                )
                            }
                        />
                    </th>
                )}

                {(select
                    ? [
                          "name",
                          "type",
                          "contact",
                          "status",
                      ]
                    : [
                          "name",
                          "type",
                          "contact",
                          "assignedStoreCount",
                          "status",
                      ]
                ).map((key) => (
                    <th key={key}>
                        {select ? (
                            {
                                name: "Vendor",
                                type: "Type",
                                contact:
                                    "Contact",
                                assignedStoreCount:
                                    "Assigned Stores",
                                status: "Status",
                            }[key]
                        ) : (
                            <button
                                className="mv-sort"
                                onClick={() =>
                                    setSort(
                                        (
                                            old
                                        ) => ({
                                            key,
                                            direction:
                                                old.key ===
                                                key
                                                    ? -old.direction
                                                    : 1,
                                        })
                                    )
                                }
                            >
                                {key ===
                                "name"
                                    ? "Vendor"
                                    : key ===
                                      "assignedStoreCount"
                                    ? "Assigned Stores"
                                    : key[0].toUpperCase() +
                                      key.slice(
                                          1
                                      )}

                                {" "}

                                {sort.key ===
                                key
                                    ? sort.direction ===
                                      1
                                        ? "↑"
                                        : "↓"
                                    : "↕"}
                            </button>
                        )}
                    </th>
                ))}

                {!select && (
                    <th>
                        Actions
                    </th>
                )}
            </tr>
        );
    }

    return (
        <div className="merchant-vendors">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="mv-card mv-header">

                <div>
                    <h2>Vendors</h2>

                    <p>
                        These are the vendors
                        connected to this
                        merchant.
                    </p>
                </div>

                <button
                    ref={addButton}
                    className="mv-primary"
                    disabled={
                        loading ||
                        !!error ||
                        masterLoading
                    }
                    onClick={openAddVendorModal}
                >
                    {masterLoading
                        ? "Loading Vendors…"
                        : "＋ Add Vendor"}
                </button>

            </header>

            {/* =================================================
                VENDOR LIST
            ================================================= */}

            <section className="mv-card">

                <h3>Vendor List</h3>

                <div className="mv-toolbar">

                    <input
                        aria-label="Search assigned vendors"
                        placeholder="Search vendors by name, type or phone…"
                        value={query}
                        onChange={(e) => {
                            setQuery(
                                e.target.value
                            );
                            setPage(1);
                        }}
                    />

                    <button
                        onClick={() => {
                            setQuery("");
                            setPage(1);
                            setSort({
                                key: "name",
                                direction: 1,
                            });
                        }}
                    >
                        ↺ Reset
                    </button>

                </div>

                {loading ? (
                    <p role="status">
                        Loading vendors…
                    </p>
                ) : error ? (
                    <p role="alert">
                        {error}
                    </p>
                ) : (
                    <>
                        <div className="mv-scroll">

                            <table>

                                <thead>
                                    {headings()}
                                </thead>

                                <tbody>

                                    {rows
                                        .slice(
                                            (current -
                                                1) *
                                                10,
                                            current *
                                                10
                                        )
                                        .map(
                                            (
                                                vendor
                                            ) => (
                                                <tr
                                                    key={
                                                        vendor.id
                                                    }
                                                >

                                                    {/* VENDOR */}

                                                    <td>
                                                        {name(
                                                            vendor
                                                        )}
                                                    </td>

                                                    {/* TYPE */}

                                                    <td>
                                                        {
                                                            vendor.type
                                                        }
                                                    </td>

                                                    {/* CONTACT */}

                                                    <td>
                                                        {
                                                            vendor.contact
                                                        }
                                                    </td>

                                                    {/* ASSIGNED STORE COUNT */}

                                                    <td>
                                                        {
                                                            vendor.assignedStoreCount
                                                        }
                                                    </td>

                                                    {/* STATUS */}

                                                    <td>
                                                        {badge(
                                                            vendor
                                                        )}
                                                    </td>

                                                    {/* ACTIONS */}

                                                    <td>
                                                        <div className="mv-actions">

                                                            <button
                                                                aria-label={`View ${vendor.name}`}
                                                                onClick={() =>
                                                                    setModal(
                                                                        {
                                                                            type: "view",
                                                                            vendor,
                                                                        }
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </button>

                                                            <button
                                                                aria-label={`Remove ${vendor.name} assignment`}
                                                                onClick={() => {
                                                                    setSaveError(
                                                                        ""
                                                                    );

                                                                    setModal(
                                                                        {
                                                                            type: "remove",
                                                                            vendor,
                                                                        }
                                                                    );
                                                                }}
                                                            >
                                                                Remove
                                                            </button>

                                                        </div>
                                                    </td>

                                                </tr>
                                            )
                                        )}

                                    {!rows.length && (
                                        <tr>
                                            <td
                                                colSpan={
                                                    6
                                                }
                                            >
                                                No assigned
                                                vendors
                                                match.
                                                Use Add
                                                Vendor to
                                                select
                                                from
                                                master
                                                data.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* =================================================
                            PAGINATION
                        ================================================= */}

                        <footer className="mv-footer">

                            <span>
                                Showing{" "}
                                {rows.length
                                    ? (current -
                                          1) *
                                          10 +
                                      1
                                    : 0}{" "}
                                to{" "}
                                {Math.min(
                                    current *
                                        10,
                                    rows.length
                                )}{" "}
                                of{" "}
                                {rows.length}{" "}
                                entries
                            </span>

                            <div>

                                <button
                                    disabled={
                                        current ===
                                        1
                                    }
                                    onClick={() =>
                                        setPage(
                                            current -
                                                1
                                        )
                                    }
                                    aria-label="Previous page"
                                >
                                    ‹
                                </button>

                                <span className="mv-page">
                                    {current} /{" "}
                                    {pages}
                                </span>

                                <button
                                    disabled={
                                        current ===
                                        pages
                                    }
                                    onClick={() =>
                                        setPage(
                                            current +
                                                1
                                        )
                                    }
                                    aria-label="Next page"
                                >
                                    ›
                                </button>

                            </div>

                        </footer>
                    </>
                )}

            </section>

            {/* =================================================
                DIALOG
            ================================================= */}

            <dialog
                className="mv-dialog"
                ref={dialog}
                aria-labelledby="mv-dialog-title"
                onCancel={(e) => {
                    e.preventDefault();
                    close();
                }}
            >

                <div className="merchant-vendors">

                    <header className="mv-header">

                        <div>

                            <h2 id="mv-dialog-title">
                                {modal?.type ===
                                "select"
                                    ? "Select Vendor"
                                    : modal?.type ===
                                      "remove"
                                    ? "Remove vendor assignment"
                                    : "Vendor Details"}
                            </h2>

                            <p>
                                {modal?.type ===
                                "select"
                                    ? "Choose one or more vendors to add to this merchant."
                                    : modal?.type ===
                                      "remove"
                                    ? "The vendor remains available in Master Data."
                                    : "Read-only master vendor details."}
                            </p>

                        </div>

                        <button
                            aria-label="Close"
                            disabled={busy}
                            onClick={close}
                        >
                            ×
                        </button>

                    </header>

                    {/* =================================================
                        SELECT VENDOR
                    ================================================= */}

                    {modal?.type ===
                    "select" ? (
                        <>
                            {masterLoading && (
                                <p role="status">
                                    Loading master vendors…
                                </p>
                            )}

                            {masterError && (
                                <p
                                    role="alert"
                                    className="mv-error"
                                >
                                    {masterError}
                                </p>
                            )}

                            <input
                                className="mv-search"
                                autoFocus
                                aria-label="Search master vendors"
                                placeholder="Search vendors by name, type or contact…"
                                value={search}
                                disabled={busy}
                                onChange={(e) =>
                                    setSearch(
                                        e.target
                                            .value
                                    )
                                }
                            />

                            <div className="mv-scroll mv-options">

                                <table>

                                    <thead>
                                        {headings(
                                            true
                                        )}
                                    </thead>

                                    <tbody>

                                        {available.map(
                                            (
                                                vendor
                                            ) => (
                                                <tr
                                                    key={
                                                        vendor.id
                                                    }
                                                >

                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`Select ${vendor.name}`}
                                                            disabled={
                                                                busy ||
                                                                !active(
                                                                    vendor
                                                                )
                                                            }
                                                            checked={selection.includes(
                                                                vendor.id
                                                            )}
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                setSelection(
                                                                    (
                                                                        old
                                                                    ) =>
                                                                        e
                                                                            .target
                                                                            .checked
                                                                            ? [
                                                                                  ...old,
                                                                                  vendor.id,
                                                                              ]
                                                                            : old.filter(
                                                                                  (
                                                                                      id
                                                                                  ) =>
                                                                                      id !==
                                                                                      vendor.id
                                                                              )
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        {name(
                                                            vendor
                                                        )}
                                                    </td>

                                                    <td>
                                                        {
                                                            vendor.type
                                                        }
                                                    </td>

                                                    <td>
                                                        {vendor.phone ||
                                                            vendor.contact ||
                                                            "—"}
                                                    </td>

                                                    <td>
                                                        {badge(
                                                            vendor
                                                        )}
                                                    </td>

                                                </tr>
                                            )
                                        )}

                                        {!available.length && (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        5
                                                    }
                                                >
                                                    No
                                                    unassigned
                                                    vendors
                                                    found
                                                    in
                                                    master
                                                    data.
                                                </td>
                                            </tr>
                                        )}

                                    </tbody>

                                </table>

                            </div>
                        </>
                    ) : (
                        modal?.vendor && (
                            <dl className="mv-details">

                                {Object.entries(
                                    {
                                        Vendor:
                                            modal
                                                .vendor
                                                .name,

                                        Type:
                                            modal
                                                .vendor
                                                .type,

                                        Contact:
                                            modal
                                                .vendor
                                                .contact,

                                        "Assigned Stores":
                                            modal
                                                .vendor
                                                .assignedStoreCount,

                                        Status:
                                            modal
                                                .vendor
                                                .status,

                                        Email:
                                            modal
                                                .vendor
                                                .email ||
                                            "—",

                                        Phone:
                                            modal
                                                .vendor
                                                .phone ||
                                            "—",
                                    }
                                ).map(
                                    ([
                                        label,
                                        value,
                                    ]) => (
                                        <div
                                            key={
                                                label
                                            }
                                        >
                                            <dt>
                                                {
                                                    label
                                                }
                                            </dt>

                                            <dd>
                                                {
                                                    value
                                                }
                                            </dd>
                                        </div>
                                    )
                                )}

                            </dl>
                        )
                    )}

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {saveError && (
                        <p
                            role="alert"
                            className="mv-error"
                        >
                            {saveError}
                        </p>
                    )}

                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <footer className="mv-footer">

                        <span>
                            {modal?.type ===
                            "select"
                                ? `${selection.length} vendors selected`
                                : ""}
                        </span>

                        <div>

                            <button
                                disabled={busy}
                                onClick={close}
                            >
                                {modal?.type ===
                                "view"
                                    ? "Close"
                                    : "Cancel"}
                            </button>

                            {modal?.type ===
                                "select" && (
                                <button
                                    className="mv-primary"
                                    disabled={
                                        busy ||
                                        !selection.length
                                    }
                                    onClick={() =>
                                        save([
                                            ...new Set(
                                                [
                                                    ...ids,
                                                    ...selection.filter(
                                                        (
                                                            id
                                                        ) =>
                                                            vendors.some(
                                                                (
                                                                    vendor
                                                                ) =>
                                                                    vendor.id ===
                                                                        id &&
                                                                    active(
                                                                        vendor
                                                                    )
                                                            )
                                                    ),
                                                ]
                                            ),
                                        ])
                                    }
                                >
                                    {busy
                                        ? "Saving…"
                                        : "Add Selected"}
                                </button>
                            )}

                            {modal?.type ===
                                "remove" && (
                                <button
                                    className="mv-primary"
                                    disabled={
                                        busy
                                    }
                                    onClick={() =>
                                        save(
                                            ids.filter(
                                                (
                                                    id
                                                ) =>
                                                    id !==
                                                    modal
                                                        .vendor
                                                        .id
                                            )
                                        )
                                    }
                                >
                                    {busy
                                        ? "Saving…"
                                        : "Remove Assignment"}
                                </button>
                            )}

                        </div>

                    </footer>

                </div>

            </dialog>
        </div>
    );
}