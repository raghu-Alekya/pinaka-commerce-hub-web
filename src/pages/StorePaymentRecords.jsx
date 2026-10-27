import FilterDropdown from "../components/FilterDropdown";
import Pagination from "../components/Pagination";
import { useEffect, useMemo, useState } from "react";
import BentoDetailModal from "../components/BentoDetailModal";
import { listStorePosPayments } from "../api/storePosPayments";
import { listStoreEmployees } from "../api/employees";
import { isUuid } from "../api/storeDetails";
import "../styles/store-payment-records.css";
 
export default function StorePaymentRecords({ store, storeId: storeIdProp, merchantId }) {
  const storeId = [
    store?.uuid,
    store?.storeUUID,
    store?.storeUuid,
    store?.store_uuid,
    store?.id,
    storeIdProp,
    store?.storeId,
    store?.storeID,
  ].find(isUuid);
  const [payments, setPayments] = useState([]);
  const [employeeNames, setEmployeeNames] = useState({});
  const [loading, setLoading] = useState(Boolean(storeId));
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
 
  useEffect(() => {
    let cancelled = false;
    if (!merchantId || !storeId) {
      setEmployeeNames({});
      return undefined;
    }
 
    listStoreEmployees(merchantId, storeId)
      .then((response) => {
        if (cancelled) return;
        const names = {};
        const employees = findEmployeeRows(response);
        for (const employee of Array.isArray(employees) ? employees : []) {
          const person = employee.employee || employee.user || employee;
          const name = person.name || person.fullName || person.full_name || person.displayName || person.display_name ||
            [person.firstName ?? person.first_name, person.lastName ?? person.last_name].filter(Boolean).join(" ");
          if (!name) continue;
          for (const id of [person.id, person.employeeId, person.employeeCode, person.userId, person.user_id, person.uuid,
            employee.id, employee.employeeId, employee.employeeCode, employee.userId, employee.user_id, employee.uuid]) {
            for (const key of employeeIdKeys(id)) names[key] = name;
          }
        }
        setEmployeeNames(names);
      })
      .catch(() => {
        if (!cancelled) setEmployeeNames({});
      });
 
    return () => { cancelled = true; };
  }, [merchantId, storeId]);
 
  useEffect(() => {
    if (!storeId) {
      setPayments([]);
      setLoading(false);
      setError("This store’s database ID is unavailable, so payment records cannot be loaded.");
      return undefined;
    }
 
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listStorePosPayments(storeId, { signal: controller.signal })
      .then((response) => {
        const rows = Array.isArray(response?.payments) ? response.payments : [];
        setPayments(rows.map((row) => mapPaymentRecord(row, employeeNames)));
      })
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") {
          setError(requestError?.message || "Could not load payment records.");
          setPayments([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
 
    return () => controller.abort();
  }, [storeId, employeeNames]);
 
  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
 
    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        [
          payment.title,
          payment.orderId,
          payment.transactionId,
          payment.paymentAcceptedBy,
          payment.paymentMethod,
          payment.paymentType,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
 
      const matchesDate =
        !dateFilter ||
        payment.date.startsWith(
          dateFilter.replaceAll("-", "/")
        );
 
      return matchesSearch && matchesDate;
    });
  }, [payments, search, dateFilter]);
  const availableDates = useMemo(
    () => Array.from(new Set(payments.map((payment) => payment.date.slice(0, 10).replaceAll("/", "-"))))
      .filter((date) => date.length === 10),
    [payments],
  );
  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage));
  const pageStart = (currentPage - 1) * rowsPerPage;
  const paginatedPayments = filteredPayments.slice(pageStart, pageStart + rowsPerPage);

  useEffect(() => setCurrentPage(1), [search, dateFilter, rowsPerPage]);
 
  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
  };
 
  return (
    <div className="store-payment-records-page">
      <div className="store-payment-records-header">
        <div className="store-payment-records-title-area">
          <div className="store-payment-records-title-icon">
           
          </div>
 
          <div>
            <h1>Payment Records</h1>
            <p>View payment transactions associated with this store.</p>
          </div>
        </div>
 
      </div>
 
      <div className="store-payment-records-card">
        <div className="store-payment-records-toolbar">
          <label className="store-payment-records-search">
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="text"
              value={search}
              placeholder="Search payments..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <FilterDropdown
            aria-label="Filter payments by date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          >
            <option value="">All dates</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "long",
                  timeZone: "UTC",
                }).format(new Date(`${date}T00:00:00Z`))}
              </option>
            ))}
          </FilterDropdown>
 
          <button type="button" className="store-payment-reset-btn" onClick={clearFilters}>
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
            Reset
          </button>
 
          <span className="store-payment-records-count">
            {filteredPayments.length} items
          </span>
        </div>
 
        <div className="store-payment-records-table-wrapper">
          <table className="store-payment-records-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Order ID</th>
                <th>Client Order ID</th>
                <th>Order Total</th>
                <th>Tender Amount</th>
                <th>Balance Amount</th>
                <th>Change Amount</th>
                <th>Payment Accepted By</th>
                <th>Date</th>
              </tr>
            </thead>
 
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="store-payment-records-empty">Loading payment records…</td></tr>
              ) : error ? (
                <tr><td colSpan="10" className="store-payment-records-empty">{error}</td></tr>
              ) : filteredPayments.length ? (
                paginatedPayments.map((payment) => (
                  <PaymentRecordRow
                    key={payment.id}
                    payment={payment}
                    onView={() => setSelectedPayment(payment)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="store-payment-records-empty">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
 
        {!loading && !error && <Pagination
          currentPage={currentPage}
          totalPages={pageCount}
          totalItems={filteredPayments.length}
          pageSize={rowsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setRowsPerPage}
          itemLabel="payments"
          showWhenEmpty
          pageSizeOptions={[5, 10, 25, 50, 100]}
        />}
      </div>
 
      <BentoDetailModal
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        headerIcon="bi-receipt"
        title="Payment Details"
        code={
          selectedPayment?.transactionId && selectedPayment.transactionId !== "—"
            ? `Ref: ${selectedPayment.transactionId}`
            : (selectedPayment?.id ? `ID: ${selectedPayment.id}` : "")
        }
        hero={
          selectedPayment
            ? {
                icon: "bi-credit-card",
                title: selectedPayment.paymentMethod ? `${selectedPayment.paymentMethod} Payment` : "Payment Record",
                subtitle: `Order #${selectedPayment.orderId || "—"}`,
                status: selectedPayment.status || "Completed",
                metricLabel: "AMOUNT PAID",
                metricValue: money(selectedPayment.tenderAmount || selectedPayment.orderTotal || 0),
              }
            : null
        }
        layout="bento-3"
        sections={
          selectedPayment
            ? [
                {
                  title: "TRANSACTION TOTALS",
                  fields: [
                    {
                      label: "ORDER TOTAL",
                      value: money(selectedPayment.orderTotal),
                    },
                    {
                      label: "TENDER AMOUNT",
                      value: money(selectedPayment.tenderAmount),
                    },
                    {
                      label: "CHANGE / BALANCE",
                      value:
                        selectedPayment.changeAmount > 0
                          ? `Change: ${money(selectedPayment.changeAmount)}`
                          : `Balance: ${money(selectedPayment.balanceAmount)}`,
                    },
                  ],
                },
                {
                  title: "METHOD & ORDER",
                  fields: [
                    {
                      label: "PAYMENT METHOD",
                      value: selectedPayment.paymentMethod,
                    },
                    {
                      label: "ORDER NUMBER",
                      value: selectedPayment.orderId,
                      mono: true,
                    },
                    {
                      label: "TRANSACTION ID",
                      value: selectedPayment.transactionId,
                      mono: true,
                    },
                  ],
                },
                {
                  title: "OPERATIONAL AUDIT",
                  fields: [
                    {
                      label: "ACCEPTED BY",
                      value: selectedPayment.paymentAcceptedBy,
                    },
                    {
                      label: "SHIFT REFERENCE",
                      value: selectedPayment.shiftId,
                      mono: true,
                    },
                    {
                      label: "PAYMENT DATE",
                      value: selectedPayment.date,
                    },
                  ],
                },
              ]
            : []
        }
      />
    </div>
  );
}
 
function mapPaymentRecord(payment, employeeNames = {}) {
  const orderId = payment.order_number || "—";
  const clientOrderId = payment.client_order_id || "—";
  const method = payment.payment_method_title || payment.payment_method || "Payment";
 
  return {
    id: payment.id,
    title: `${method} Payment for Order ${orderId}`,
    orderId,
    clientOrderId,
    orderTotal: Number(payment.order_total || 0),
    tenderAmount: Number(payment.amount || 0),
    balanceAmount: Number(payment.remaining || 0),
    changeAmount: Number(payment.change_amount || 0),
    transactionId: payment.providerTransactionId || payment.provider_transaction_id || payment.transactionId || payment.transaction_id ||
      payment.transactionNumber || payment.transaction_number || payment.txnId || payment.txn_id ||
      payment.transactionReference || payment.transaction_reference || payment.paymentReference || payment.payment_reference ||
      payment.reference || payment.transaction?.id || payment.provider_transaction?.id || payment.localId || payment.local_id || "—",
    paymentAcceptedBy: acceptedByName(payment, employeeNames),
    status: payment.status || "—",
    date: formatPaymentDate(payment.payment_at),
    paymentMethod: method,
    paymentType: payment.payment_type || "—",
    shiftId: payment.shift_id || "—",
    notes: payment.notes || "",
  };
}

function acceptedByName(payment, employeeNames) {
  const acceptedBy = payment.accepted_by ?? payment.acceptedBy;
  const candidates = [
    payment.user?.name, payment.user?.full_name, payment.user?.fullName,
    payment.employee?.name, payment.employee?.full_name,
    payment.user_name, payment.user_full_name, payment.accepted_by_name, payment.acceptedByName,
    typeof acceptedBy === "object" ? acceptedBy.name || acceptedBy.full_name || acceptedBy.fullName : null,
  ];
  const directName = candidates.find((value) => typeof value === "string" && value.trim());
  if (directName) return directName.trim();
  const ids = [payment.user_id, payment.userId, payment.employee_id, payment.employeeId,
    payment.accepted_by_id, payment.acceptedById, typeof acceptedBy === "object" ? acceptedBy.id || acceptedBy.employee_id || acceptedBy.employeeId : acceptedBy,
    payment.user?.id, payment.employee?.id];
  const resolvedName = ids.map((id) => findEmployeeName(employeeNames, id)).find(Boolean);
  if (resolvedName) return resolvedName;
  // Some API versions return the accepted employee's display name directly in
  // `accepted_by`; only show it as a name when it is not an ID-like value.
  if (typeof acceptedBy === "string" && acceptedBy.trim() && !/^[\d-]+$/.test(acceptedBy.trim()) && !/^[\da-f]{8}-[\da-f-]{27,}$/i.test(acceptedBy.trim())) {
    return acceptedBy.trim();
  }
  return "—";
}

function findEmployeeRows(value, depth = 0) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || depth > 5) return [];
  for (const key of ["employees", "items", "results", "records", "data"]) {
    const rows = findEmployeeRows(value[key], depth + 1);
    if (rows.length) return rows;
  }
  return [];
}
 
function employeeIdKeys(value) {
  if (value === undefined || value === null || value === "") return [];
  const exact = String(value).trim();
  const keys = [exact, exact.toLowerCase()];
  const codeNumber = exact.match(/(?:^|\D)(\d+)$/)?.[1];
  if (codeNumber) keys.push(String(Number(codeNumber)));
  return [...new Set(keys)];
}
 
function findEmployeeName(names, value) {
  return employeeIdKeys(value).map((key) => names[key]).find(Boolean);
}
 
function formatPaymentDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const datePart = new Intl.DateTimeFormat("en-CA").format(date).replaceAll("-", "/");
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date).toLowerCase();
  return `${datePart} at ${timePart}`;
}
 
function PaymentRecordRow({ payment, onView }) {
  return (
    <tr
      className="store-payment-record-clickable"
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
        <button
          type="button"
          className="store-payment-title-link"
          onClick={(event) => {
            event.stopPropagation();
            onView?.();
          }}
        >
          {payment.title}
        </button>
      </td>
 
      <td>{payment.orderId}</td>
      <td>{payment.clientOrderId}</td>
      <td>{money(payment.orderTotal)}</td>
      <td>{money(payment.tenderAmount)}</td>
      <td>{money(payment.balanceAmount)}</td>
      <td className={payment.changeAmount > 0 ? "change-positive" : ""}>
        {money(payment.changeAmount)}
      </td>
      <td>{payment.paymentAcceptedBy}</td>
      <td>
        <span className="payment-status">{payment.status}</span>
        <span className="payment-date">{payment.date}</span>
      </td>
    </tr>
  );
}
 
function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}
 
 
