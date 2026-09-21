import React, { useMemo, useState } from "react";
import { merchants } from "../data/data";
import "../styles/cash-management.css";

export default function CashManagement() {
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("All Dates");

  const cashPayments = [
    {
      id: 64303,
      title: "Cash Payment for Order 64303",
      orderId: "64303",
      merchant: "Westside Market LLC",
      store: "Westside Market",
      orderTotal: "$63.78",
      tenderAmount: "$63.78",
      balanceAmount: "$0.00",
      changeAmount: "$0.00",
      transactionId: "64304",
      acceptedBy: "Sathwika D",
      date: "Aug 10, 2026",
      time: "07:43 PM",
    },
    {
      id: 64287,
      title: "Cash Payment for Order 64287",
      orderId: "64287",
      merchant: "Westside Market LLC",
      store: "Main Street Store",
      orderTotal: "$0.00",
      tenderAmount: "$20.00",
      balanceAmount: "$0.00",
      changeAmount: "$20.00",
      transactionId: "64288",
      acceptedBy: "Kumar D",
      date: "Aug 10, 2026",
      time: "05:45 AM",
    },
    {
      id: 64285,
      title: "Cash Payment for Order 64285",
      orderId: "64285",
      merchant: "Westside Market LLC",
      store: "Westside Market",
      orderTotal: "$0.00",
      tenderAmount: "$20.00",
      balanceAmount: "$0.00",
      changeAmount: "$20.00",
      transactionId: "64286",
      acceptedBy: "Kumar D",
      date: "Aug 10, 2026",
      time: "03:46 AM",
    },
    {
      id: 64283,
      title: "Cash Payment for Order 64283",
      orderId: "64283",
      merchant: "Westside Market LLC",
      store: "Downtown Store",
      orderTotal: "$2.00",
      tenderAmount: "$20.00",
      balanceAmount: "$0.00",
      changeAmount: "$18.00",
      transactionId: "64284",
      acceptedBy: "Kumar D",
      date: "Aug 10, 2026",
      time: "03:45 AM",
    },
    {
      id: 64281,
      title: "Cash Payment for Order 64281",
      orderId: "64281",
      merchant: "Westside Market LLC",
      store: "Main Street Store",
      orderTotal: "$2.00",
      tenderAmount: "$20.00",
      balanceAmount: "$0.00",
      changeAmount: "$18.00",
      transactionId: "64282",
      acceptedBy: "Kumar D",
      date: "Aug 10, 2026",
      time: "03:18 AM",
    },
  ];

  /* =========================================================
     STORE OPTIONS
  ========================================================= */

  const stores = [
    "Westside Market",
    "Downtown Store",
    "Main Street Store",
  ];

  /* =========================================================
     FILTERED PAYMENTS
  ========================================================= */

  const filteredPayments = useMemo(() => {
    return cashPayments.filter((payment) => {
      const merchantName = merchants.find(
        (merchant) => merchant.id === selectedMerchant
      )?.name;

      const merchantMatch =
        !selectedMerchant || payment.merchant === merchantName;

      const storeMatch =
        !selectedStore || payment.store === selectedStore;

      const search = searchTerm.toLowerCase().trim();

      const searchMatch =
        !search ||
        payment.title.toLowerCase().includes(search) ||
        payment.orderId.toLowerCase().includes(search) ||
        payment.transactionId.toLowerCase().includes(search) ||
        payment.acceptedBy.toLowerCase().includes(search);

      return merchantMatch && storeMatch && searchMatch;
    });
  }, [selectedMerchant, selectedStore, searchTerm]);

  /* =========================================================
     DASHBOARD VALUES
  ========================================================= */

  const totalPayments = filteredPayments.length;

  const completedPayments = filteredPayments.length;

  const pendingPayments = 0;

  const totalValue = filteredPayments.reduce((total, payment) => {
    return (
      total +
      Number(payment.tenderAmount.replace("$", "").replace(",", ""))
    );
  }, 0);

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSelectedMerchant("");
    setSelectedStore("");
    setSearchTerm("");
    setDateFilter("All Dates");
  };

  return (
    <div className="page-content cash-management-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="cash-page-header">

        <div className="cash-page-icon">
          <i className="bi bi-wallet2" />
        </div>

        <div>
          <h1>Cash Management</h1>

          <p>
            View and manage cash payments and transactions for your stores.
          </p>
        </div>

      </div>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <div className="cash-kpi-grid">

        {/* TOTAL PAYMENTS */}
        <div className="cash-kpi-card purple">

          <div className="cash-kpi-icon">
            <i className="bi bi-wallet2" />
          </div>

          <div className="cash-kpi-content">

            <span>Total Cash Payments</span>

            <strong>{totalPayments}</strong>

            <small className="cash-kpi-positive">
           
            
            </small>

          </div>

          <div className="cash-kpi-line" />

        </div>

        {/* COMPLETED */}
        <div className="cash-kpi-card green">

          <div className="cash-kpi-icon">
            <i className="bi bi-check-circle" />
          </div>

          <div className="cash-kpi-content">

            <span>Completed</span>

            <strong>{completedPayments}</strong>

            <small className="cash-kpi-positive">
           
              {/* <span>vs last 30 days</span> */}
            </small>

          </div>

          <div className="cash-kpi-line" />

        </div>

        {/* PENDING */}
        <div className="cash-kpi-card orange">

          <div className="cash-kpi-icon">
            <i className="bi bi-clock" />
          </div>

          <div className="cash-kpi-content">

            <span>Pending Payment</span>

            <strong>{pendingPayments}</strong>

            <small className="cash-kpi-negative">
           
              {/* <span>vs last 30 days</span> */}
            </small>

          </div>

          <div className="cash-kpi-line" />

        </div>

        {/* TOTAL VALUE */}
        <div className="cash-kpi-card blue">

          <div className="cash-kpi-icon">
            <i className="bi bi-currency-dollar" />
          </div>

          <div className="cash-kpi-content">

            <span>Total Value</span>

            <strong>
              $
              {totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </strong>

            <small className="cash-kpi-positive">
          
             
              {/* <span>vs last 30 days</span> */}
            </small>

          </div>

          <div className="cash-kpi-line" />

        </div>

      </div>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div className="cash-filter-bar">

        {/* SEARCH */}
        <div className="cash-search-box">

          <i className="bi bi-search" />

          <input
            type="text"
            placeholder="Search payment title, order ID, transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        </div>

        {/* DATE */}
        <div className="cash-select-wrapper">

          <i className="bi bi-calendar3" />

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option>All Dates</option>
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>

          <i className="bi bi-chevron-down cash-select-arrow" />

        </div>

        {/* MERCHANT */}
        <div className="cash-select-wrapper">

          <i className="bi bi-shop" />

          <select
            value={selectedMerchant}
            onChange={(e) => {
              setSelectedMerchant(e.target.value);
              setSelectedStore("");
            }}
          >
            <option value="">All Merchants</option>

            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}

          </select>

          <i className="bi bi-chevron-down cash-select-arrow" />

        </div>

        {/* STORE */}
        <div className="cash-select-wrapper">

          <i className="bi bi-building" />

          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="">All Stores</option>

            {stores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}

          </select>

          <i className="bi bi-chevron-down cash-select-arrow" />

        </div>

        {/* CLEAR */}
        <button
          type="button"
          className="cash-clear-button"
          onClick={clearFilters}
        >
          <i className="bi bi-arrow-counterclockwise" />
          Clear
        </button>

      </div>

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <div className="cash-table-card">

        {/* TABLE HEADER */}
        <div className="cash-table-header">

          <div className="cash-table-title">

            <h2>Cash Payments</h2>

            <span>{filteredPayments.length}</span>

          </div>

          <div className="cash-read-only">

            <i className="bi bi-lock" />

            Read Only

          </div>

        </div>

        {/* TABLE */}
        <div className="cash-table-wrapper">

          <table className="cash-table">

            <thead>

              <tr>

                <th>
                  Title
                  <span className="cash-sort-icon">↕</span>
                </th>

                <th>
                  Order ID
                </th>

                <th>
                  Order Total
                </th>

                <th>
                  Tender
                  <br />
                  Amount
                </th>

                <th>
                  Balance
                  <br />
                  Amount
                </th>

                <th>
                  Change
                  <br />
                  Amount
                </th>

                <th>
                  Transaction ID
                </th>

                <th>
                  Payment
                  <br />
                  Accepted By
                </th>

                <th>
                  Date
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredPayments.map((payment) => (

                <tr key={payment.id}>

                  {/* TITLE */}
                  <td>

                    <a
                      href="#cash-payment"
                      className="cash-title"
                    >
                      {payment.title}
                    </a>

                  </td>

                  {/* ORDER ID */}
                  <td>
                    {payment.orderId}
                  </td>

                  {/* ORDER TOTAL */}
                  <td>
                    {payment.orderTotal}
                  </td>

                  {/* TENDER */}
                  <td>
                    {payment.tenderAmount}
                  </td>

                  {/* BALANCE */}
                  <td>
                    {payment.balanceAmount}
                  </td>

                  {/* CHANGE */}
                  <td className="cash-change-positive">
                    {payment.changeAmount}
                  </td>

                  {/* TRANSACTION ID */}
                  <td>
                    {payment.transactionId}
                  </td>

                  {/* ACCEPTED BY */}
                  <td>
                    {payment.acceptedBy}
                  </td>

                  {/* DATE */}
                  <td className="cash-date">

                    <strong>
                      {payment.date}
                    </strong>

                    <span>
                      {payment.time}
                    </span>

                  </td>

                  {/* ACTION */}
                  <td>

                    <button
                      type="button"
                      className="cash-action-button"
                      title="More actions"
                    >
                      <i className="bi bi-three-dots-vertical" />
                    </button>

                  </td>

                </tr>

              ))}

              {filteredPayments.length === 0 && (

                <tr>

                  <td
                    colSpan="10"
                    className="cash-empty-row"
                  >
                    No cash payments found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* TABLE FOOTER */}
        <div className="cash-table-footer">

          <span>
            Showing 1 to {filteredPayments.length} of{" "}
            {filteredPayments.length} entries
          </span>

          <div className="cash-pagination">

            <button type="button">
              <i className="bi bi-chevron-left" />
            </button>

            <button
              type="button"
              className="active"
            >
              1
            </button>

            <button type="button">
              2
            </button>

            <button type="button">
              <i className="bi bi-chevron-right" />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}