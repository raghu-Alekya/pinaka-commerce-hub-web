import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  CheckCircle,
  Clock3,
  AlertCircle,
  Search,
  CalendarDays,
  SlidersHorizontal,
  Eye,
  Pencil,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import "../styles/devices.css";

const DEVICE_DATA = [
  {
    id: "DEV-0001",
    name: "POS Terminal 01",
    type: "POS Terminal",
    serial: "SN1234567890",
    merchant: "FreshMart",
    store: "Banjara Hills",
    status: "Online",
    lastSeen: "2 mins ago",
    color: "purple",
  },
  {
    id: "DEV-0002",
    name: "Kitchen Display 01",
    type: "Kitchen Display",
    serial: "SN1234567891",
    merchant: "FreshMart",
    store: "Jubilee Hills",
    status: "Online",
    lastSeen: "5 mins ago",
    color: "purple",
  },
  {
    id: "DEV-0003",
    name: "Barcode Scanner 01",
    type: "Barcode Scanner",
    serial: "SN1234567892",
    merchant: "TechWorld",
    store: "Madhapur",
    status: "Offline",
    lastSeen: "1 hour ago",
    color: "purple",
  },
  {
    id: "DEV-0004",
    name: "Receipt Printer 01",
    type: "Receipt Printer",
    serial: "SN1234567893",
    merchant: "FashionHub",
    store: "Hitech City",
    status: "Online",
    lastSeen: "10 mins ago",
    color: "purple",
  },
  {
    id: "DEV-0005",
    name: "Customer Display 01",
    type: "Customer Display",
    serial: "SN1234567894",
    merchant: "ElectroPlus",
    store: "Gachibowli",
    status: "Inactive",
    lastSeen: "3 days ago",
    color: "purple",
  },
  {
    id: "DEV-0006",
    name: "POS Terminal 02",
    type: "POS Terminal",
    serial: "SN1234567895",
    merchant: "FreshMart",
    store: "Banjara Hills",
    status: "Online",
    lastSeen: "4 mins ago",
    color: "purple",
  },
  {
    id: "DEV-0007",
    name: "Kitchen Display 02",
    type: "Kitchen Display",
    serial: "SN1234567896",
    merchant: "TechWorld",
    store: "Madhapur",
    status: "Offline",
    lastSeen: "2 hours ago",
    color: "purple",
  },
  {
    id: "DEV-0008",
    name: "Barcode Scanner 02",
    type: "Barcode Scanner",
    serial: "SN1234567897",
    merchant: "FashionHub",
    store: "Hitech City",
    status: "Online",
    lastSeen: "20 mins ago",
    color: "purple",
  },
  {
    id: "DEV-0009",
    name: "Receipt Printer 02",
    type: "Receipt Printer",
    serial: "SN1234567898",
    merchant: "ElectroPlus",
    store: "Gachibowli",
    status: "Inactive",
    lastSeen: "4 days ago",
    color: "purple",
  },
  {
    id: "DEV-0010",
    name: "Customer Display 02",
    type: "Customer Display",
    serial: "SN1234567899",
    merchant: "FreshMart",
    store: "Jubilee Hills",
    status: "Online",
    lastSeen: "8 mins ago",
    color: "purple",
  },
];

export default function Devices() {
  const [search, setSearch] = useState("");
  const [merchant, setMerchant] = useState("All Merchants");
  const [store, setStore] = useState("All Stores");
  const [deviceType, setDeviceType] = useState("All Device Types");
  const [status, setStatus] = useState("All Statuses");

  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const rowsPerPage = 5;

  /* =========================================================
     FILTER DEVICES
  ========================================================= */

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return DEVICE_DATA.filter((device) => {
      const matchesSearch =
        !query ||
        device.name.toLowerCase().includes(query) ||
        device.id.toLowerCase().includes(query) ||
        device.type.toLowerCase().includes(query) ||
        device.serial.toLowerCase().includes(query) ||
        device.merchant.toLowerCase().includes(query) ||
        device.store.toLowerCase().includes(query);

      const matchesMerchant =
        merchant === "All Merchants" || device.merchant === merchant;

      const matchesStore = store === "All Stores" || device.store === store;

      const matchesType =
        deviceType === "All Device Types" || device.type === deviceType;

      const matchesStatus =
        status === "All Statuses" || device.status === status;

      return (
        matchesSearch &&
        matchesMerchant &&
        matchesStore &&
        matchesType &&
        matchesStatus
      );
    });
  }, [search, merchant, store, deviceType, status]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDevices.length / rowsPerPage),
  );

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * rowsPerPage;

  const displayedDevices = filteredDevices.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  /* =========================================================
     STATS
  ========================================================= */

  const totalDevices = 256;
  const onlineDevices = 198;
  const offlineDevices = 42;
  const inactiveDevices = 16;

  return (
    <div className="devices-page">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="devices-page-header">
        <div>
          <h1>Devices</h1>

          <div className="devices-breadcrumb">
            <span>Home</span>
            <span>›</span>
            <strong>Devices</strong>
          </div>
        </div>

        <div className="devices-header-actions">
          <button
            type="button"
            className="devices-add-btn"
            onClick={() => navigate("/devices/add")}
          >
            <span>+</span>
            Add Device
          </button>

          <button type="button" className="devices-export-btn">
            <span className="export-icon">↓</span>
            Export
          </button>
        </div>
      </div>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="devices-stats">
        <StatCard
          icon={<Monitor size={22} />}
          title="Total Devices"
          value={totalDevices}
          change="↑ 18 this month"
          variant="purple"
        />

        <StatCard
          icon={<CheckCircle size={22} />}
          title="Online Devices"
          value={onlineDevices}
          change="↑ 77.3% of total"
          variant="green"
          progress={77.3}
        />

        <StatCard
          icon={<Clock3 size={22} />}
          title="Offline Devices"
          value={offlineDevices}
          change="↓ 16.4% of total"
          variant="orange"
          progress={16.4}
        />

        <StatCard
          icon={<AlertCircle size={22} />}
          title="Inactive Devices"
          value={inactiveDevices}
          change="↓ 6.3% of total"
          variant="red"
          progress={6.3}
        />
      </div>

      {/* =====================================================
          FILTER CARD
      ===================================================== */}

      <div className="devices-list-card">
        <div className="devices-filter-bar">
          {/* SEARCH */}

          <div className="devices-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search by device name, serial number, store..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            />
          </div>

          {/* MERCHANT */}

          <FilterSelect
            value={merchant}
            onChange={(value) => handleFilterChange(setMerchant, value)}
            options={[
              "All Merchants",
              "FreshMart",
              "TechWorld",
              "FashionHub",
              "ElectroPlus",
            ]}
          />

          {/* STORE */}

          <FilterSelect
            value={store}
            onChange={(value) => handleFilterChange(setStore, value)}
            options={[
              "All Stores",
              "Banjara Hills",
              "Jubilee Hills",
              "Madhapur",
              "Hitech City",
              "Gachibowli",
            ]}
          />

          {/* DEVICE TYPE */}

          <FilterSelect
            value={deviceType}
            onChange={(value) => handleFilterChange(setDeviceType, value)}
            options={[
              "All Device Types",
              "POS Terminal",
              "Kitchen Display",
              "Barcode Scanner",
              "Receipt Printer",
              "Customer Display",
            ]}
          />

          {/* STATUS */}

          <FilterSelect
            value={status}
            onChange={(value) => handleFilterChange(setStatus, value)}
            options={["All Statuses", "Online", "Offline", "Inactive"]}
          />

          {/* DATE */}

          <button type="button" className="devices-date-btn">
            <CalendarDays size={16} />

            <span>Select date range</span>
          </button>

          {/* FILTER */}

          <button type="button" className="devices-filter-btn">
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="devices-table-wrap">
          <table className="devices-table">
            <thead>
              <tr>
                <th className="device-check-col">
                  <input type="checkbox" />
                </th>

                <th>DEVICE NAME</th>

                <th>DEVICE TYPE</th>

                <th>SERIAL NUMBER</th>

                <th>MERCHANT</th>

                <th>STORE</th>

                <th>STATUS</th>

                <th>LAST SEEN</th>

                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {displayedDevices.length > 0 ? (
                displayedDevices.map((device) => (
                  <DeviceRow key={device.id} device={device} />
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="devices-empty">
                    No devices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        <div className="devices-pagination">
          <div className="devices-showing">
            Showing {filteredDevices.length === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + rowsPerPage, filteredDevices.length)} of{" "}
            {filteredDevices.length} devices
          </div>

          <div className="devices-pagination-controls">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
            >
              <ChevronsLeft size={15} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from(
              { length: Math.min(totalPages, 5) },
              (_, index) => index + 1,
            ).map((page) => (
              <button
                type="button"
                key={page}
                className={safePage === page ? "active" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
            >
              <ChevronsRight size={15} />
            </button>
          </div>

          <div className="devices-rows">
            <span>Rows per page</span>

            <select value={rowsPerPage} onChange={() => {}}>
              <option value="5">5</option>
            </select>

            <ChevronDown size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon, title, value, change, variant, progress }) {
  return (
    <div className="device-stat-card">
      <div className={`device-stat-icon ${variant}`}>{icon}</div>

      <div className="device-stat-content">
        <div className="device-stat-title">{title}</div>

        <div className="device-stat-value">{value}</div>

        <div className={`device-stat-change ${variant}`}>{change}</div>

        {progress !== undefined && (
          <div className="device-stat-progress">
            <div
              className={`device-progress-bar ${variant}`}
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="device-filter-select">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <ChevronDown size={15} className="device-filter-arrow" />
    </div>
  );
}

/* =========================================================
   TABLE ROW
========================================================= */

function DeviceRow({ device }) {
  return (
    <tr>
      <td className="device-check-col">
        <input type="checkbox" />
      </td>

      <td>
        <div className="device-name-cell">
          <div className="device-type-icon">
            <Monitor size={16} />
          </div>

          <div>
            <div className="device-name">{device.name}</div>

            <div className="device-id">{device.id}</div>
          </div>
        </div>
      </td>

      <td>{device.type}</td>

      <td>{device.serial}</td>

      <td>{device.merchant}</td>

      <td>{device.store}</td>

      <td>
        <span className={`device-status ${device.status.toLowerCase()}`}>
          {device.status}
        </span>
      </td>

      <td>
        <div className={`device-last-seen ${device.status.toLowerCase()}`}>
          <span />

          {device.lastSeen}
        </div>
      </td>

      <td>
        <div className="device-actions">
          <button type="button" title="View">
            <Eye size={16} />
          </button>

          <button type="button" title="Edit">
            <Pencil size={16} />
          </button>

          <button type="button" title="More">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
