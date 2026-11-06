import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination";
import BentoDetailModal from "../components/BentoDetailModal";
import { apiRequest } from "../api/http";
import { isUuid } from "../api/storeDetails";
import "../styles/store-customers.css";

export default function StoreCustomers({
  embedded = false,
  merchantId,
  storeId,
  store,
}) {
  // ===================s======================================
  // FILTERSs
  // =========================================================

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // =========================================================
  // PAGINATION
  // =========================================================

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // =========================================================
  // CUSTOMER DATA
  // =========================================================

  const loyaltyMerchantId = merchantId || store?.merchantId || store?.merchant_id || store?.merchant?.id || store?.merchant?.merchantId || store?.merchant?.merchant_id || "";
  const loyaltyStoreId = [store?.uuid, store?.storeUUID, store?.storeUuid, store?.store_uuid, store?.id, storeId].find(isUuid) || "";

  useEffect(() => {
    if (!loyaltyMerchantId || !loyaltyStoreId) {
      setCustomers([]);
      setLoading(false);
      setLoadError("Merchant or store information is unavailable.");
      return undefined;
    }
    let active = true;
    setLoading(true);
    setLoadError("");
    apiRequest("/connector/api/v1/loyalty/get-all-customers", {
      headers: {
        "x-merchant-id": loyaltyMerchantId,
        "x-store-id": loyaltyStoreId,
      },
    }).then((response) => {
      if (!active) return;
      const rows = Array.isArray(response) ? response
        : Array.isArray(response?.data) ? response.data
          : Array.isArray(response?.customers) ? response.customers
            : Array.isArray(response?.data?.customers) ? response.data.customers : [];
      setCustomers(rows.map((customer, index) => ({
        ...customer,
        id: customer.id ?? customer.user_id ?? customer.contact ?? index,
        name: customer.name || customer.customer_name || "Unnamed Customer",
        contact: customer.contact ?? customer.phone ?? customer.phone_number ?? "",
        credited: Number(customer.credited) || 0,
        redeemed: Number(customer.redeemed) || 0,
        expired: Number(customer.expired) || 0,
        available: Number(customer.available) || 0,
        last_updated: customer.last_updated || customer.updated_at || "—",
      })));
    }).catch((error) => {
      if (active) {
        setCustomers([]);
        setLoadError(error?.message || "Unable to load loyalty customers.");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loyaltyMerchantId, loyaltyStoreId]);

  // =========================================================
  // =========================================================
  // FILTER CUSTOMERS
  // =========================================================

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchText = `
        ${customer.name || ""}
        ${customer.contact || ""}
        ${customer.id || ""}
      `.toLowerCase();

      const matchesSearch =
        !search ||
        searchText.includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [customers, search]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalItems = filteredCustomers.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedCustomers = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    const endIndex =
      startIndex + pageSize;

    return filteredCustomers.slice(
      startIndex,
      endIndex
    );
  }, [
    filteredCustomers,
    currentPage,
    pageSize,
  ]);

  // =========================================================
  // RESET PAGE WHEN FILTERS CHANGE
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // =========================================================
  // KEEP PAGE VALID
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
  // SUMMARY
  // =========================================================

  const activeCustomers = customers.filter(
    (customer) =>
      customer.status === "Active"
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) =>
      customer.status === "Inactive"
  ).length;

  const totalOrders = customers.reduce(
    (total, customer) =>
      total +
      Number(customer.ordersCount || 0),
    0
  );

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setCurrentPage(1);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="store-customers-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="store-customers-header">

        <div className="store-customers-title-area">
          <div>
            <h1>Customers</h1>

            <p>
              View customers associated with this store.
            </p>
          </div>

        </div>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="store-customers-summary">

        {/* TOTAL CUSTOMERS */}

        <div className="store-customer-summary-card">

          <div className="store-customer-summary-icon purple">
            <i className="bi bi-people" />
          </div>

          <div>
            <span>Total Customers</span>

            <strong>
              {customers.length}
            </strong>
          </div>

        </div>

        {/* ACTIVE */}

        <div className="store-customer-summary-card">

          <div className="store-customer-summary-icon green">
            <i className="bi bi-person-check" />
          </div>

          <div>
            <span>Active Customers</span>

            <strong>
              {activeCustomers}
            </strong>
          </div>

        </div>

        {/* INACTIVE */}

        <div className="store-customer-summary-card">

          <div className="store-customer-summary-icon orange">
            <i className="bi bi-person-dash" />
          </div>

          <div>
            <span>Inactive Customers</span>

            <strong>
              {inactiveCustomers}
            </strong>
          </div>

        </div>

        {/* ORDERS */}

        <div className="store-customer-summary-card">

          <div className="store-customer-summary-icon blue">
            <i className="bi bi-cart-check" />
          </div>

          <div>
            <span>Total Orders</span>

            <strong>
              {totalOrders}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      {/* ===================================================
          TOOLBAR
      =================================================== */}

      <div className="store-customers-toolbar">
          <div className="store-customers-search">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="store-customers-clear-btn"
            onClick={clearFilters}
          >
            <i className="bi bi-arrow-counterclockwise" />
            Reset
          </button>
      </div>

      <div className="store-customers-card">

        {/* ===================================================
            TABLE
        =================================================== */}

        {loading || loadError || filteredCustomers.length > 0 ? (
          <div className="store-customers-table-wrapper">

            <table className="store-customers-table">

              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Credited</th>
                  <th>Redeemed</th>
                  <th>Expired</th>
                  <th>Available</th>
                  <th>Last Updated</th>
                </tr>
              </thead>

              <tbody>
                {paginatedCustomers.map(
                  (customer) => (
                    <CustomerRow
                      key={
                        customer.id ||
                        customer.customerId
                      }
                      customer={customer}
                      onView={() => setSelectedCustomer(customer)}
                    />
                  )
                )}
                {loading && <tr><td colSpan={7}>Loading customers...</td></tr>}
                {!loading && loadError && <tr><td colSpan={7} role="alert">{loadError}</td></tr>}
                {!loading && !loadError && filteredCustomers.length === 0 && <tr><td colSpan={7}>No customers found.</td></tr>}
              </tbody>

            </table>

          </div>
        ) : (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="store-customers-empty">

            <div className="store-customers-empty-icon">
              <i className="bi bi-people" />
            </div>

            <h3>
              No customers found
            </h3>

            <p>{loadError || "Try changing your search."}</p>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>
        )}

        {/* ===================================================
            PAGINATION
        =================================================== */}

        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="customers"
            showWhenEmpty
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />

      </div>

      <BentoDetailModal
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        headerIcon="bi-person"
        title="Customer Details"
        compactSpacing
        hero={
          selectedCustomer
            ? {
                icon: "bi-person-circle",
                title:
                  selectedCustomer.name ||
                  `${selectedCustomer.firstName || ""} ${selectedCustomer.lastName || ""}`.trim() ||
                  "Customer",
                subtitle: selectedCustomer.contact || "Phone number unavailable",
                metricLabel: "AVAILABLE POINTS",
                metricValue: selectedCustomer.available,
              }
            : null
        }
        layout="bento-2"
        maxWidth="max-w-4xl"
        sections={
          selectedCustomer
            ? [
                {
                  title: "LOYALTY POINTS",
                  fields: [
                    { label: "CREDITED", value: selectedCustomer.credited },
                    { label: "REDEEMED", value: selectedCustomer.redeemed },
                    { label: "EXPIRED", value: selectedCustomer.expired },
                    { label: "AVAILABLE", value: selectedCustomer.available },
                  ],
                },
                {
                  title: "CUSTOMER DETAILS",
                  fields: [
                    { label: "CUSTOMER NAME", value: selectedCustomer.name },
                    { label: "PHONE NUMBER", value: selectedCustomer.contact },
                    { label: "LAST UPDATED", value: selectedCustomer.last_updated },
                  ],
                },
              ]
            : []
        }
      />
    </div>
  );
}


// =========================================================
// CUSTOMER ROW
// =========================================================

function CustomerRow({ customer, onView }) {
  const displayName = customer.name || "Unnamed Customer";

  return (
    <tr
      className="store-customer-row-clickable"
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView?.();
        }
      }}
    >

      <td>
        <div className="store-customer-info">
          <div>
            <strong>{displayName}</strong>
          </div>
        </div>
      </td>
      <td>
        <span className="store-customer-phone">{customer.contact || "—"}</span>
      </td>
      <td>{customer.credited}</td>
      <td>{customer.redeemed}</td>
      <td>{customer.expired}</td>
      <td><strong className="store-customer-spent">{customer.available}</strong></td>
      <td><span className="store-customer-date">{customer.last_updated || "—"}</span></td>
    </tr>
  );
}
