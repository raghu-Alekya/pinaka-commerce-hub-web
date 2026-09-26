import { useEffect, useRef, useState } from "react";
import "../styles/merchant-vendors.css";
import Vendors from "./Vendors";

import {
    getMappedMerchantVendors,
    getAvailableMerchantVendors,
    addMerchantVendors,
    createVendor,
    unmapMerchantVendor,
} from "../api/vendors";

/* =========================================================
   HELPERS
========================================================= */

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

    status: String(value.status || "Active"),

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
    vendor.status.toLowerCase() === "active";

const searchableValues = value => {
    if (value == null) return [];
    if (typeof value === "object") return Object.values(value).flatMap(searchableValues);
    return [String(value)];
};
const matches = (vendor, query) => {
    const text = searchableValues(vendor).join(" ").toLowerCase();
    return query.trim().toLowerCase().split(/\s+/).filter(Boolean).every(term => text.includes(term));
};
const vendorCountry = vendor => String(vendor.country || vendor.address?.country || "").trim();
const vendorState = vendor => String(vendor.state || vendor.address?.state || "").trim();
const locationKey = value => value.toLowerCase();
const locationOptions = values => [...new Map(values.filter(Boolean).map(value => [locationKey(value), value])).values()].sort((a, b) => a.localeCompare(b));

/* =========================================================
   COMPONENT
========================================================= */

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

    const [query, setQuery] = useState("");

    const [page, setPage] = useState(1);
    const [pickerPage, setPickerPage] = useState(1);
    const [pickerPageSize, setPickerPageSize] = useState(25);

    const [sort, setSort] = useState({
        key: "name",
        direction: 1,
    });

    const [modal, setModal] = useState(null);

    const [selection, setSelection] = useState([]);

    const [search, setSearch] = useState("");
    const [countryFilter, setCountryFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");

    const [busy, setBusy] = useState(false);

    const [saveError, setSaveError] = useState("");

    const [masterVendors, setMasterVendors] =
        useState(initialMasterVendors);

    const [masterLoading, setMasterLoading] =
        useState(false);

    const [masterError, setMasterError] =
        useState("");

    const [mappedLoading, setMappedLoading] =
        useState(false);

    const [mappedError, setMappedError] =
        useState("");

    const lock = useRef(false);
    const pendingNewVendor = useRef(null);

    const dialog = useRef(null);

    const addButton = useRef(null);

    /* =========================================================
       LOAD MAPPED VENDORS
    ========================================================= */

    async function loadMappedVendors(searchValue = "") {
        if (!merchantId) {
            setIds([]);
            return;
        }

        setMappedLoading(true);
        setMappedError("");

        try {
            const mapped = await getMappedMerchantVendors(
                merchantId,
                { search: searchValue }
            );

            const mappedIds = mapped.map(idOf);

            setMasterVendors((current) => {
                const byId = new Map(
                    current.map((vendor) => [
                        idOf(vendor),
                        vendor,
                    ])
                );

                mapped.forEach((vendor) => {
                    byId.set(idOf(vendor), vendor);
                });

                return Array.from(byId.values());
            });

            setIds(mappedIds);
            setPage(1);
        } catch (e) {
            console.error(
                "Failed to load mapped merchant vendors:",
                e
            );

            setMappedError(
                e?.message ||
                    "Unable to load mapped vendors."
            );
        } finally {
            setMappedLoading(false);
        }
    }

    /* =========================================================
       EFFECTS
    ========================================================= */

    useEffect(() => {
        setModal(null);
        setSelection([]);
        setPickerPage(1);
        setSearch("");
        setCountryFilter("");
        setStateFilter("");

        if (merchantId) {
            loadMappedVendors();
        } else {
            setIds(assignedVendorIds.map(idOf));
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [merchantId]);

    useEffect(() => {
        if (modal && modal.type !== "create") {
            dialog.current?.showModal();
        } else if (dialog.current?.open) {
            dialog.current.close();
            addButton.current?.focus();
        }
    }, [modal]);

    /* =========================================================
       MASTER VENDORS
    ========================================================= */

    const vendors = Array.from(
        new Map(
            masterVendors
                .map(normalize)
                .filter((vendor) => vendor.id)
                .map((vendor) => [
                    vendor.id,
                    vendor,
                ])
        ).values()
    );

    /* =========================================================
       ASSIGNED VENDORS
    ========================================================= */

    const assigned = ids.map(
        (id) =>
            vendors.find(
                (vendor) => vendor.id === id
            ) || {
                id,
                name: `Vendor ${id}`,
                type: "—",
                contact: "—",
                phone: "",
                status: "Unavailable",
                assignedStoreCount: 0,
            }
    );

    /* =========================================================
       FILTER + SORT
    ========================================================= */

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

    const current = Math.min(page, pages);

    /* =========================================================
       AVAILABLE VENDORS
    ========================================================= */

    const unassignedVendors = vendors.filter(vendor => !ids.includes(vendor.id));
    const countries = locationOptions(unassignedVendors.map(vendorCountry));
    const states = locationOptions(unassignedVendors.filter(vendor => !countryFilter || locationKey(vendorCountry(vendor)) === countryFilter).map(vendorState));
    const available = vendors.filter(
        (vendor) =>
            !ids.includes(vendor.id) &&
            matches(vendor, search) &&
            (!countryFilter || locationKey(vendorCountry(vendor)) === countryFilter) &&
            (!stateFilter || locationKey(vendorState(vendor)) === stateFilter)
    );

    const pickerPages = Math.max(1, Math.ceil(available.length / pickerPageSize));
    const currentPickerPage = Math.min(pickerPage, pickerPages);
    const pickerRows = available.slice((currentPickerPage - 1) * pickerPageSize, currentPickerPage * pickerPageSize);
    const selectable = pickerRows.filter(active);

    /* =========================================================
       OPEN ADD VENDOR MODAL
    ========================================================= */

    async function openAddVendorModal() {
        if (masterLoading || !merchantId) {
            return;
        }

        setMasterLoading(true);
        setMasterError("");
        setSelection([]);
        setSearch("");
        setCountryFilter("");
        setStateFilter("");
        setSaveError("");

        try {
            const vendors =
                await getAvailableMerchantVendors(
                    merchantId
                );

            setMasterVendors(
                Array.isArray(vendors)
                    ? vendors
                    : []
            );

            setModal({
                type: "select",
            });
        } catch (e) {
            console.error(
                "Failed to load available merchant vendors:",
                e
            );

            setMasterError(
                e?.message ||
                    "Unable to load available vendors."
            );

            setMasterVendors([]);

            setModal({
                type: "select",
            });
        } finally {
            setMasterLoading(false);
        }
    }

    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    const close = () => {
        if (!lock.current) {
            setModal(null);
            setSaveError("");
            setMasterError("");
        }
    };

    /* =========================================================
       SAVE
    ========================================================= */

    async function createAndAssignVendor(payload) {
        if (lock.current || !merchantId) throw new Error("Select a merchant before adding a vendor.");
        lock.current = true;
        setBusy(true);
        try {
            const vendor = pendingNewVendor.current || await createVendor(payload);
            pendingNewVendor.current = vendor;
            const vendorId = idOf(vendor);
            if (!vendorId) throw new Error("Vendor was created but its ID was not returned. Close this popup and use Add Existing Vendor to assign it.");
            try {
                await addMerchantVendors(merchantId, [vendorId]);
            } catch (error) {
                throw new Error("Vendor created, but assignment failed. Retry Create Vendor to assign the same vendor, or use Add Existing Vendor. " + (error?.message || ""));
            }
            pendingNewVendor.current = null;
            await loadMappedVendors();
            setModal(null);
            return vendor;
        } finally {
            lock.current = false;
            setBusy(false);
        }
    }

    async function save(next) {
        if (lock.current || !merchantId) {
            return;
        }

        lock.current = true;
        setBusy(true);
        setSaveError("");

        try {
            const addedIds = next.filter(
                (id) => !ids.includes(id)
            );

            if (modal?.type === "remove") {
                await unmapMerchantVendor(
                    merchantId,
                    modal.vendor.id
                );
            } else if (modal?.type === "select") {
                if (!addedIds.length) {
                    throw new Error(
                        "At least one vendor must be selected."
                    );
                }

                await addMerchantVendors(
                    merchantId,
                    addedIds
                );
            }

            await loadMappedVendors();

            setModal(null);
        } catch (e) {
            console.error(
                "Failed to save merchant vendor mapping:",
                e
            );

            setSaveError(
                e?.message ||
                    "Unable to save vendor assignment."
            );
        } finally {
            lock.current = false;
            setBusy(false);
        }
    }

    /* =========================================================
       STATUS BADGE
    ========================================================= */

    const badge = (vendor) => (
        <span
            className={`mv-badge ${
                active(vendor)
                    ? "mv-active"
                    : "mv-inactive"
            }`}
        >
             {vendor.status}
        </span>
    );

    /* =========================================================
       VENDOR NAME
    ========================================================= */

    const name = (vendor) => (
        <span className="mv-name">
            <strong>{vendor.name}</strong>
        </span>
    );

    /* =========================================================
       TABLE HEADINGS
    ========================================================= */

    function headings(select = false) {
        return (
            <tr>
                {select && (
                    <th>
                        <input
                            type="checkbox"
                            aria-label="Select all active vendors on this page"
                            checked={
                                selectable.length > 0 &&
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
                                setSelection((old) =>
                                    e.target.checked
                                        ? [
                                              ...new Set([
                                                  ...old,
                                                  ...selectable.map(
                                                      (vendor) =>
                                                          vendor.id
                                                  ),
                                              ]),
                                          ]
                                        : old.filter(
                                              (id) =>
                                                  !selectable.some(
                                                      (vendor) =>
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
                                contact: "Contact",
                                assignedStoreCount:
                                    "Assigned Stores",
                                status: "Status",
                            }[key]
                        ) : (
                            <button
                                type="button"
                                className="mv-sort"
                                onClick={() =>
                                    setSort((old) => ({
                                        key,
                                        direction:
                                            old.key === key
                                                ? -old.direction
                                                : 1,
                                    }))
                                }
                            >
                                {key === "name"
                                    ? "Vendor"
                                    : key ===
                                      "assignedStoreCount"
                                    ? "Assigned Stores"
                                    : key[0].toUpperCase() +
                                      key.slice(1)}

                                {" "}

                                {sort.key === key
                                    ? sort.direction === 1
                                        ? "↑"
                                        : "↓"
                                    : "↕"}
                            </button>
                        )}
                    </th>
                ))}

                {!select && <th>Actions</th>}
            </tr>
        );
    }

    /* =========================================================
       UI
    ========================================================= */

    if (modal?.type === "create") return (
        <section className="merchant-vendors mv-create-page">
            <header className="mv-card mv-header">
                <h2>Add New Vendor</h2>
                <button type="button" disabled={busy} onClick={close}>← Back to Vendors</button>
            </header>
            <div className="mv-create-content"><Vendors formOnly onCreate={createAndAssignVendor} onCancel={close} /></div>
        </section>
    );

    return (
        <div className="merchant-vendors">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="mv-card mv-header">
                <div>
                    <h2>Vendors</h2>

                    <p>
                        These are the vendors connected
                        to this merchant.
                    </p>
                </div>

                <div className="mv-popup-actions">
                <button type="button" className="mv-primary" disabled={!merchantId || busy} onClick={() => { pendingNewVendor.current = null; setSaveError(""); setModal({ type: "create" }); }}>＋ Add New Vendor</button>
                <button
                    ref={addButton}
                    type="button"
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
                        : "＋ Add Existing Vendor"}
                </button>
                </div>
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
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                    />

                    <button
                        type="button"
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

                {loading || mappedLoading ? (
                    <p role="status">
                        Loading vendors…
                    </p>
                ) : error || mappedError ? (
                    <p role="alert">
                        {error || mappedError}
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
                                            (current - 1) * 10,
                                            current * 10
                                        )
                                        .map((vendor) => (
                                            <tr
                                                key={vendor.id}
                                            >

                                                <td>
                                                    {name(vendor)}
                                                </td>

                                                <td>
                                                    {vendor.type}
                                                </td>

                                                <td>
                                                    {vendor.phone ||
                                                        vendor.contact ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {
                                                        vendor.assignedStoreCount
                                                    }
                                                </td>

                                                <td>
                                                    {badge(vendor)}
                                                </td>

                                                {/* =================================================
                                                    ACTIONS
                                                ================================================= */}

                                                <td>
                                                    <div className="mv-actions">

                                                        <button
                                                            type="button"
                                                            className="mv-view"
                                                            aria-label={`View ${vendor.name}`}
                                                            onClick={() =>
                                                                setModal({
                                                                    type: "view",
                                                                    vendor,
                                                                })
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="mv-remove"
                                                            aria-label={`Remove ${vendor.name} assignment`}
                                                            onClick={() => {
                                                                setSaveError("");

                                                                setModal({
                                                                    type: "remove",
                                                                    vendor,
                                                                });
                                                            }}
                                                        >
                                                            Remove
                                                        </button>

                                                    </div>
                                                </td>

                                            </tr>
                                        ))}

                                    {!rows.length && (
                                        <tr>
                                            <td colSpan={6}>
                                                No assigned vendors
                                                match. Use Add Existing Vendor
                                                to select from master
                                                data.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* =================================================
                            PAGINATION
                            ONLY SHOW WHEN MORE THAN ONE PAGE
                        ================================================= */}

                        <footer className="mv-footer">

                            <span>
                                Showing{" "}
                                {rows.length
                                    ? (current - 1) * 10 + 1
                                    : 0}{" "}
                                to{" "}
                                {Math.min(
                                    current * 10,
                                    rows.length
                                )}{" "}
                                of {rows.length} entries
                            </span>

                            {pages > 1 && (
                                <div className="mv-pagination">

                                    <button
                                        type="button"
                                        className="mv-page"
                                        disabled={
                                            current === 1
                                        }
                                        onClick={() =>
                                            setPage(
                                                current - 1
                                            )
                                        }
                                        aria-label="Previous page"
                                    >
                                        ‹
                                    </button>

                                    <span className="mv-page-number">
                                        {current} / {pages}
                                    </span>

                                    <button
                                        type="button"
                                        className="mv-page"
                                        disabled={
                                            current === pages
                                        }
                                        onClick={() =>
                                            setPage(
                                                current + 1
                                            )
                                        }
                                        aria-label="Next page"
                                    >
                                        ›
                                    </button>

                                </div>
                            )}

                        </footer>
                    </>
                )}

            </section>

            {/* =================================================
                DIALOG
                EXISTING POPUP STRUCTURE PRESERVED
            ================================================= */}

            <dialog
                className={`mv-dialog ${modal?.type === "create" ? "mv-dialog-create" : modal?.type === "select" ? "mv-dialog-select" : ""}`}
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
                                {modal?.type === "create" ? "Add New Vendor" : modal?.type === "select"
                                    ? "Add Existing Vendor"
                                    : modal?.type === "remove"
                                    ? "Remove vendor assignment"
                                    : "Vendor Details"}
                            </h2>

                            <p>
                                {modal?.type === "create" ? "Create a vendor and connect it to this merchant." : modal?.type === "select"
                                    ? "Choose one or more vendors to add to this merchant."
                                    : modal?.type === "remove"
                                    ? "The vendor remains available in Master Data."
                                    : "Read-only master vendor details."}
                            </p>

                        </div>

                        <button
                            type="button"
                            aria-label="Close"
                            disabled={busy}
                            onClick={close}
                        >
                            ×
                        </button>

                    </header>

                    {/* =================================================
                        SELECT VENDOR POPUP
                    ================================================= */}

                    {modal?.type === "create" ? (
                        <Vendors formOnly onCreate={createAndAssignVendor} onCancel={close} />
                    ) : modal?.type === "select" ? (
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
                                placeholder="Search any vendor field: name, code, contact, product, location…"
                                value={search}
                                disabled={
                                    busy ||
                                    masterLoading
                                }
                                onChange={(e) => { setSearch(e.target.value); setPickerPage(1); }}
                            />

                            <div className="mv-location-filters"><label>Country<select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setStateFilter(""); setPickerPage(1); }}><option value="">All countries</option>{countries.map(country => <option key={locationKey(country)} value={locationKey(country)}>{country}</option>)}</select></label><label>State<select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPickerPage(1); }}><option value="">All states</option>{states.map(state => <option key={locationKey(state)} value={locationKey(state)}>{state}</option>)}</select></label><button type="button" onClick={() => { setSearch(""); setCountryFilter(""); setStateFilter(""); setPickerPage(1); }}>Clear filters</button></div>
                            <div className="mv-picker-summary"><span>{available.length} matching vendors · {selection.length} selected</span><label>Rows per page <select value={pickerPageSize} onChange={e => { setPickerPageSize(Number(e.target.value)); setPickerPage(1); }}>{[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label></div>
                            <div className="mv-scroll mv-options">

                                <table>

                                    <thead>
                                        {headings(true)}
                                    </thead>

                                    <tbody>

                                        {pickerRows.map(
                                            (vendor) => (
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
                                                <td colSpan={5}>
                                                    No unassigned
                                                    vendors found
                                                    in master data.
                                                </td>
                                            </tr>
                                        )}

                                    </tbody>

                                </table>

                            </div>
                            <nav className="mv-picker-pagination" aria-label="Existing vendor pages"><span>Showing {available.length ? (currentPickerPage - 1) * pickerPageSize + 1 : 0}–{Math.min(currentPickerPage * pickerPageSize, available.length)} of {available.length}</span><div className="mv-popup-actions"><button type="button" disabled={currentPickerPage === 1} onClick={() => setPickerPage(currentPickerPage - 1)}>Previous</button><span>Page {currentPickerPage} of {pickerPages}</span><button type="button" disabled={currentPickerPage === pickerPages} onClick={() => setPickerPage(currentPickerPage + 1)}>Next</button></div></nav>

                        </>
                    ) : (
                        modal?.vendor && (
                            <dl className="mv-details">

                                {Object.entries({
                                    Vendor:
                                        modal.vendor.name,

                                    Type:
                                        modal.vendor.type,

                                    Contact:
                                        modal.vendor.contact,

                                    "Assigned Stores":
                                        modal.vendor
                                            .assignedStoreCount,

                                    Status:
                                        modal.vendor.status,

                                    Email:
                                        modal.vendor.email ||
                                        "—",

                                    Phone:
                                        modal.vendor.phone ||
                                        "—",
                                }).map(
                                    ([label, value]) => (
                                        <div key={label}>

                                            <dt>
                                                {label}
                                            </dt>

                                            <dd>
                                                {value}
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
                        POPUP FOOTER
                    ================================================= */}

                    {modal?.type !== "create" && <footer className="mv-footer">

                        <span>
                            {modal?.type === "select"
                                ? `${selection.length} vendors selected`
                                : ""}
                        </span>

                        <div className="mv-popup-actions">

                            <button
                                type="button"
                                disabled={busy}
                                onClick={close}
                            >
                                {modal?.type === "view"
                                    ? "Close"
                                    : "Cancel"}
                            </button>

                            {modal?.type === "select" && (
                                <button
                                    type="button"
                                    className="mv-primary"
                                    disabled={
                                        busy ||
                                        !selection.length
                                    }
                                    onClick={() =>
                                        save([
                                            ...new Set([
                                                ...ids,
                                                ...selection.filter(
                                                    (id) =>
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
                                            ]),
                                        ])
                                    }
                                >
                                    {busy
                                        ? "Saving…"
                                        : "Add Selected"}
                                </button>
                            )}

                            {modal?.type === "remove" && (
                                <button
                                    type="button"
                                    className="mv-primary"
                                    disabled={busy}
                                    onClick={() =>
                                        save(
                                            ids.filter(
                                                (id) =>
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

                    </footer>}

                </div>

            </dialog>

        </div>
    );
}