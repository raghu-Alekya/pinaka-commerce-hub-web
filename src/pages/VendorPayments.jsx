import { useMemo, useState } from "react";
import FilterDropdown from "../components/FilterDropdown";
import Pagination from "../components/Pagination";
import "../styles/vendor-payments.css";

const initialVendors = [
  {
    id: 1,
    name: "Jacob",
    status: "Published",
    date: "2026/04/02 at 3:00 am",
  },
  {
    id: 2,
    name: "Bubba",
    status: "Published",
    date: "2026/03/23 at 2:45 pm",
  },
  {
    id: 3,
    name: "Vendor",
    status: "Published",
    date: "2026/03/20 at 3:12 pm",
  },
];

const initialPayments = [
  {
    id: 1,
    title: "Payment – Raghu Store – 2026-07-01 13:14:22",
    vendor: "Payment - Raghu Store - 2026-07-01 13:14:22",
    purpose: "",
    method: "",
    amount: "0.00",
    date: "2026/07/01 at 1:14 pm",
  },
  {
    id: 2,
    title: "Payment – Raghu Store – 2026-07-01 13:10:08",
    vendor: "Payment - Raghu Store - 2026-07-01 13:10:08",
    purpose: "",
    method: "",
    amount: "0.00",
    date: "2026/07/01 at 1:10 pm",
  },
  {
    id: 3,
    title: "Payment – Raghu Store – 2026-07-01 13:09:46",
    vendor: "Payment - Raghu Store - 2026-07-01 13:09:46",
    purpose: "",
    method: "",
    amount: "0.00",
    date: "2026/07/01 at 1:09 pm",
  },
  {
    id: 4,
    title: "Payment for vendor id #56009",
    vendor: "Bubba",
    purpose: "Purchase",
    method: "Cash",
    amount: "100.00",
    date: "2026/06/05 at 2:31 am",
  },
  {
    id: 5,
    title: "Payment for vendor id #62985",
    vendor: "N/A",
    purpose: "Purchase",
    method: "Cash",
    amount: "10.00",
    date: "2026/06/05 at 12:02 am",
  },
  {
    id: 6,
    title: "Payment for vendor id #56009",
    vendor: "Bubba",
    purpose: "Purchase",
    method: "Cash",
    amount: "100.00",
    date: "2026/06/04 at 3:15 am",
  },
  {
    id: 7,
    title: "Payment for vendor id #56009",
    vendor: "Bubba",
    purpose: "Purchase",
    method: "Cash",
    amount: "5.00",
    date: "2026/06/03 at 11:29 pm",
  },
  {
    id: 8,
    title: "Payment for vendor id #56549",
    vendor: "Jacob",
    purpose: "Purchase",
    method: "Cash",
    amount: "100.00",
    date: "2026/06/03 at 10:10 pm",
  },
];

export default function VendorPayments({ viewMode } = {}) {
  const [selectedView, setView] = useState("vendors");
  const view = viewMode || selectedView;

  const [vendors, setVendors] = useState(initialVendors);
  const [payments, setPayments] = useState(initialPayments);

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [vendorName, setVendorName] = useState("");

  const [payment, setPayment] = useState({
    vendor: "",
    purpose: "Purchase",
    method: "Cash",
    amount: "",
  });

  // Search vendors
  const filteredVendors = useMemo(() => {
    const term = search.toLowerCase().trim();

    return vendors.filter((vendor) =>
      vendor.name.toLowerCase().includes(term)
    );
  }, [vendors, search]);

  // Search payments
  const filteredPayments = useMemo(() => {
    const term = search.toLowerCase().trim();

    return payments.filter((payment) => {
      const matchesSearch = `${payment.title} ${payment.vendor} ${payment.purpose} ${payment.method} ${payment.amount} ${payment.date}`
        .toLowerCase()
        .includes(term);
      const matchesMethod = !methodFilter || payment.method === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [payments, search, methodFilter]);
  const totalPaymentPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Add vendor
  const addVendor = (event) => {
    event.preventDefault();
    if (!vendorName.trim()) {
      setFieldErrors({ vendorName: "Vendor Name is required." });
      return;
    }

    setVendors((current) => [
      ...current,
      {
        id: Date.now(),
        name: vendorName.trim(),
        status: "Published",
        date: "Just now",
      },
    ]);

    setVendorName("");
    setFieldErrors({});
    setShowVendorForm(false);
  };

  // Add payment
  const addPayment = (event) => {
    event.preventDefault();
    const errors = {};
    if (!payment.vendor) errors.vendor = "Select a vendor.";
    if (!payment.amount || !Number.isFinite(Number(payment.amount)) || Number(payment.amount) <= 0) errors.amount = "Enter an amount greater than 0.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setPayments((current) => [
      {
        id: Date.now(),
        title: `Payment for vendor ${payment.vendor}`,
        ...payment,
        date: "Just now",
      },
      ...current,
    ]);
    setCurrentPage(1);

    setPayment({
      vendor: "",
      purpose: "Purchase",
      method: "Cash",
      amount: "",
    });

    setShowPaymentForm(false);
  };

  return (
    <div className={`vendor-screen ${viewMode ? "vendor-history-screen" : ""}`}>

      {/* Header */}
      <div className="vendor-title-row">

        <h2>
          {view === "vendors" ? "Vendors" : viewMode ? "Vendor History" : "Vendor Payments"}
        </h2>

        <div className="vendor-actions">

          {!viewMode && view === "payments" && (
            <button onClick={() => setView("vendors")}>
              View Vendors
            </button>
          )}

          {!viewMode && view === "vendors" && (
            <button onClick={() => setView("payments")}>
              View Vendor Payments
            </button>
          )}

          {view === "vendors" && (
            <button className="vendor-primary-action" onClick={() => { setFieldErrors({}); setShowVendorForm(true); }}>
              Add New Vendor
            </button>
          )}

          {view === "payments" && (
            <button className="vendor-primary-action" onClick={() => { setFieldErrors({}); setShowPaymentForm(true); }}>
              <i className="bi bi-plus-lg" aria-hidden="true" />
              Add New Vendor Payment
            </button>
          )}

        </div>
      </div>

      {/* Toolbar */}
      <div className="vendor-toolbar">

        {!viewMode && <div className="vendor-tabs">

          <button className="active">
            All (
            {view === "vendors"
              ? vendors.length
              : payments.length}
            )
          </button>

          <button>
            Published (
            {view === "vendors"
              ? vendors.length
              : payments.length}
            )
          </button>

        </div>}

        {/* Single Search Box */}
       <div className="vendor-search">
        <i className="bi bi-search" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
          placeholder={
            view === "vendors"
              ? "Search Vendors"
              : "Search Vendor Payments"
          }
        />
      </div>
        {view === "payments" && <FilterDropdown
          aria-label="Filter vendor payments by method"
          value={methodFilter}
          onChange={(event) => { setMethodFilter(event.target.value); setCurrentPage(1); }}
        >
          <option value="">All payment methods</option>
          {[...new Set(payments.map((item) => item.method).filter(Boolean))].map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </FilterDropdown>}
        {view === "payments" && (viewMode || search || methodFilter) && <button type="button" className="vendor-filter-reset" onClick={() => { setSearch(""); setMethodFilter(""); setCurrentPage(1); }}><i className="bi bi-arrow-counterclockwise" aria-hidden="true" />Reset</button>}

      </div>

      {/* Vendors Table */}
      {view === "vendors" && (
        <div className="vendor-history-table-scroll" style={{ width: "100%", overflowX: "auto" }}>
        <table className="vendor-table" style={{ width: "100%", minWidth: "900px", tableLayout: "auto" }}>

          <thead>
            <tr>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>□</th>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>Title ↕</th>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>Date ↕</th>
            </tr>
          </thead>

          <tbody>

            {filteredVendors.map((vendor) => (
              <tr key={vendor.id}>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>□</td>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>
                  <strong>{vendor.name}</strong>
                </td>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>
                  <div className="vendor-date-cell">
                    <span className="vendor-date-status">Published</span>
                    <span className="vendor-date-time">{vendor.date}</span>
                  </div>
                </td>

              </tr>
            ))}

          </tbody>

        </table>
        </div>
      )}

      {/* Vendor Payments Table */}
      {view === "payments" && (
        <div className="vendor-history-table-scroll" style={{ width: "100%", overflowX: "auto" }}>
        <table className="vendor-table" style={{ width: "100%", minWidth: "900px", tableLayout: "auto" }}>

          <thead>
            <tr>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>Title</th>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>Vendor Name</th>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>Payment Purpose</th>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>Payment Method</th>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>Payment Amount</th>
              <th style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>Date</th>
            </tr>
          </thead>

          <tbody>

            {paginatedPayments.length ? paginatedPayments.map((payment) => (
              <tr key={payment.id}>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>
                  <strong
                    className="vendor-title-cell"
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      if (el.scrollWidth > el.clientWidth) {
                        el.setAttribute("data-tooltip", payment.title);
                      } else {
                        el.removeAttribute("data-tooltip");
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.removeAttribute("data-tooltip");
                    }}
                  >
                    {payment.title}
                  </strong>
                </td>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>
                  <span
                    className="vendor-name-cell"
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      if (el.scrollWidth > el.clientWidth) {
                        el.setAttribute("data-tooltip", payment.vendor);
                      } else {
                        el.removeAttribute("data-tooltip");
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.removeAttribute("data-tooltip");
                    }}
                  >
                    {payment.vendor}
                  </span>
                </td>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>{payment.purpose}</td>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>{payment.method}</td>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>$ {payment.amount}</td>

                <td style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>
                  <div className="vendor-date-cell">
                    <span className="vendor-date-status">Published</span>
                    <span className="vendor-date-time">{payment.date}</span>
                  </div>
                </td>

              </tr>
            )) : <tr><td colSpan={6} className="vendor-empty-row" style={{ whiteSpace: "nowrap", padding: "12px 16px" }}>No vendor payments match these filters.</td></tr>}

          </tbody>

        </table>
        </div>
      )}

      {view === "payments" && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPaymentPages}
          totalItems={filteredPayments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          itemLabel="payments"
          showWhenEmpty
          pageSizeOptions={[5, 10, 25, 50, 100]}
        />
      )}

      {/* Add Vendor Modal */}
      {showVendorForm && (
        <div className="vendor-modal">

          <form onSubmit={addVendor} noValidate>

            <h3>Add New Vendor</h3>

            <label className={fieldErrors.vendorName ? "has-error" : ""}>
              Vendor Name

              <input
                type="text"
                value={vendorName}
                onChange={(event) =>
                  { setVendorName(event.target.value); setFieldErrors((current) => ({ ...current, vendorName: "" })); }
                }
                autoFocus
                aria-invalid={Boolean(fieldErrors.vendorName)}
              />
              {fieldErrors.vendorName && <small className="vendor-field-error" role="alert">{fieldErrors.vendorName}</small>}

            </label>

            <div>

              <button
                className="vendor-secondary-action"
                type="button"
                onClick={() => setShowVendorForm(false)}
              >
                Cancel
              </button>

              <button className="vendor-primary-action" type="submit">
                Add Vendor
              </button>

            </div>

          </form>

        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentForm && (
        <div className="vendor-modal">

          <form onSubmit={addPayment} noValidate>

            <h3>Add New Vendor Payment</h3>

            <label className={fieldErrors.vendor ? "has-error" : ""}>
              Vendor

              <FilterDropdown
                aria-label="Vendor"
                value={payment.vendor}
                onChange={(event) =>
                  { setPayment((current) => ({ ...current, vendor: event.target.value })); setFieldErrors((current) => ({ ...current, vendor: "" })); }
                }
                aria-invalid={Boolean(fieldErrors.vendor)}
                className={`${fieldErrors.vendor ? "has-error " : ""}${!payment.vendor ? "vendor-placeholder" : ""}`}
              >
                <option value="">Select vendor</option>

                {vendors.map((vendor) => (
                  <option
                    key={vendor.id}
                    value={vendor.name}
                  >
                    {vendor.name}
                  </option>
                ))}

              </FilterDropdown>
              {fieldErrors.vendor && <small className="vendor-field-error" role="alert">{fieldErrors.vendor}</small>}

            </label>

            <label>
              Payment Purpose

              <FilterDropdown
                aria-label="Payment Purpose"
                value={payment.purpose}
                onChange={(event) =>
                  setPayment((current) => ({
                    ...current,
                    purpose: event.target.value,
                  }))
                }
              >
                <option value="Purchase">Purchase</option>
                <option value="Refund">Refund</option>
                <option value="Other">Other</option>
              </FilterDropdown>

            </label>

            <label>
              Payment Method

              <FilterDropdown
                aria-label="Payment Method"
                value={payment.method}
                onChange={(event) =>
                  setPayment((current) => ({
                    ...current,
                    method: event.target.value,
                  }))
                }
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </FilterDropdown>

            </label>

            <label className={fieldErrors.amount ? "has-error" : ""}>
              Payment Amount

              <input
                type="number"
                min="0"
                step="0.01"
                value={payment.amount}
                onChange={(event) =>
                  { setPayment((current) => ({ ...current, amount: event.target.value })); setFieldErrors((current) => ({ ...current, amount: "" })); }
                }
                aria-invalid={Boolean(fieldErrors.amount)}
              />
              {fieldErrors.amount && <small className="vendor-field-error" role="alert">{fieldErrors.amount}</small>}

            </label>

            <div>

              <button
                className="vendor-secondary-action"
                type="button"
                onClick={() => setShowPaymentForm(false)}
              >
                Cancel
              </button>

              <button className="vendor-primary-action" type="submit">
                Save Payment
              </button>

            </div>

          </form>

        </div>
      )}

    </div>
  );
}
