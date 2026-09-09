import React, { useState } from "react";
import { merchants } from "../data/data";
import "../styles/dash-orders.css";

export default function Orders() {
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");


  const orders = [
    {
      id: 64303,
      offlineId: "262233106",
      merchant: "Westside Market LLC",
      store: "Westside Market",
      date: "Aug 10, 2026",
      status: "Completed",
      author: "Sathwika D",
      total: "$63.78",
    },
    {
      id: 64302,
      offlineId: "261255867",
      merchant: "Westside Market LLC",
      store: "Downtown Store",
      date: "Aug 10, 2026",
      status: "Cancelled",
      author: "Sathwika D",
      total: "$0.00",
    },
    {
      id: 64287,
      offlineId: "2616438454",
      merchant: "Westside Market LLC",
      store: "Main Street Store",
      date: "Aug 3, 2026",
      status: "Completed",
      author: "Kumar D",
      total: "$0.00",
    },
    {
      id: 64285,
      offlineId: "261643843",
      merchant: "Westside Market LLC",
      store: "Westside Market",
      date: "Aug 3, 2026",
      status: "Completed",
      author: "Kumar D",
      total: "$0.00",
    },
    {
      id: 64283,
      offlineId: "261643842",
      merchant: "Westside Market LLC",
      store: "Downtown Store",
      date: "Aug 3, 2026",
      status: "Completed",
      author: "Kumar D",
      total: "$2.00",
    },
    {
      id: 64281,
      offlineId: "261643841",
      merchant: "Westside Market LLC",
      store: "Main Street Store",
      date: "Aug 3, 2026",
      status: "Completed",
      author: "Kumar D",
      total: "$2.00",
    },
    {
      id: 64280,
      offlineId: "261643840",
      merchant: "Westside Market LLC",
      store: "Westside Market",
      date: "Aug 3, 2026",
      status: "Pending payment",
      author: "Kumar D",
      total: "$2.00",
    },
  ];

  

  return (
    <div className="page-content orders-page">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>View and manage orders for your stores.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filter-card">
        <div className="orders-filter-grid">

          {/* Merchant */}
          <div className="orders-filter-field">
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
          <div className="orders-filter-field">
            <label>Store Name</label>

            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={!selectedMerchant}
            >
              <option value="">Select Store</option>
              <option value="store-1">Westside Market</option>
              <option value="store-2">Downtown Store</option>
              <option value="store-3">Main Street Store</option>
            </select>
          </div>

          {/* From Date */}
          <div className="orders-filter-field">
            <label>From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div className="orders-filter-field">
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

      {/* Orders Table */}
      <div className="orders-table-card">

        <div className="orders-table-wrapper">
          <table className="orders-table">

            <thead>
              <tr>
                

                <th>
                  Woo Order ID
                  <span className="sort-icon">↕</span>
                </th>

                <th>Offline Order ID</th>

                <th>Merchant Name</th>

                <th>Store Name</th>

                <th>
                  Date
                  <span className="sort-icon">↕</span>
                </th>

                <th>Status</th>

                <th>Author</th>

                <th className="total-column">
                  <span className="sort-icon">↕</span>
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>

                  

                  <td>
                    <div className="order-id-cell">
                      <a href="#order">
                        #{order.id}
                      </a>

                      <span className="view-icon" title="View order">
                        👁
                      </span>
                    </div>
                  </td>

                  <td>{order.offlineId}</td>

                  <td>{order.merchant}</td>

                  <td>{order.store}</td>

                  <td className="order-date">
                    {order.date}
                  </td>

                  <td>
                    <span
                      className={`order-status ${
                        order.status
                          .toLowerCase()
                          .replaceAll(" ", "-")
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>{order.author}</td>

                  <td className="order-total">
                    {order.total}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
}