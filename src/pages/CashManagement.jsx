import React, { useState } from "react";
import { merchants } from "../data/data";
import "../styles/cash-management.css";

export default function CashManagement() {
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
      date: "Published 2026/08/10 at 7:43 pm",
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
      date: "Published 2026/08/03 at 5:45 am",
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
      date: "Published 2026/08/03 at 3:46 am",
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
      date: "Published 2026/08/03 at 3:45 am",
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
      date: "Published 2026/08/03 at 3:18 am",
    },
  ];

  const filteredPayments = cashPayments.filter((payment) => {
    const merchantMatch =
      !selectedMerchant ||
      payment.merchant ===
        merchants.find((merchant) => merchant.id === selectedMerchant)?.name;

    const storeMatch =
      !selectedStore || payment.store === selectedStore;

    return merchantMatch && storeMatch;
  });

  return (
    <div className="page-content cash-management-page">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Cash Management</h1>
          <p>
            View and manage cash payments and transactions for your stores.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="cash-filter-card">
        <div className="cash-filter-grid">

          {/* Merchant */}
          <div className="cash-filter-field">
            <label>Merchant Name</label>

            <select
              value={selectedMerchant}
              onChange={(e) => {
                setSelectedMerchant(e.target.value);
                setSelectedStore("");
              }}
            >
              <option value="">Select Merchant</option>

              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Store */}
          <div className="cash-filter-field">
            <label>Store Name</label>

            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={!selectedMerchant}
            >
              <option value="">Select Store</option>
              <option value="Westside Market">Westside Market</option>
              <option value="Downtown Store">Downtown Store</option>
              <option value="Main Street Store">Main Street Store</option>
            </select>
          </div>

          {/* From Date */}
          <div className="cash-filter-field">
            <label>From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div className="cash-filter-field">
            <label>To Date</label>

            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Cash Management Table */}
      <div className="cash-table-card">
        <div className="cash-table-wrapper">

          <table className="cash-table">

            <thead>
              <tr>
                <th>
                  Title
                  <span className="cash-sort-icon">↕</span>
                </th>

                <th>Order Id</th>

                <th>Order Total</th>

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

                <th>Transaction Id</th>

                <th>
                  Payment
                  <br />
                  Accepted By
                </th>

                <th>
                  Date
                  <span className="cash-sort-icon">↕</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>

                  {/* Title */}
                  <td>
                    <div className="cash-title-cell">
                      <a
                        href="#cash-payment"
                        className="cash-title"
                      >
                        {payment.title}
                      </a>

                      <div className="cash-actions">
                        <a
                          href="#edit"
                          className="cash-edit"
                        >
                          Edit
                        </a>

                        <span> | </span>

                        <a
                          href="#trash"
                          className="cash-trash"
                        >
                          Trash
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* Order ID */}
                  <td>{payment.orderId}</td>

                  {/* Order Total */}
                  <td className="cash-amount">
                    {payment.orderTotal}
                  </td>

                  {/* Tender Amount */}
                  <td className="cash-amount">
                    {payment.tenderAmount}
                  </td>

                  {/* Balance Amount */}
                  <td className="cash-amount">
                    {payment.balanceAmount}
                  </td>

                  {/* Change Amount */}
                  <td className="cash-change-positive">
                    {payment.changeAmount}
                  </td>

                  {/* Transaction ID */}
                  <td>{payment.transactionId}</td>

                  {/* Accepted By */}
                  <td>{payment.acceptedBy}</td>

                  {/* Date */}
                  <td className="cash-date">
                    {payment.date}
                  </td>

                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="cash-empty-row"
                  >
                    No cash payments found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}