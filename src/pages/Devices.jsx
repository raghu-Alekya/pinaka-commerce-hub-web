import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, AlertCircle } from "lucide-react";

import "../styles/devices.css";

import { devicesApi } from "../api/devices";

import Pagination from "../components/Pagination";
import FiltersBar from "../components/FiltersBar";
import ListActions from "../components/ListActions";

export default function Devices() {
  /* =========================================================
     STATE
  ========================================================= */

  const [search, setSearch] = useState("");
  const [merchant, setMerchant] = useState("All Merchants");
  const [deviceType, setDeviceType] = useState("All Device Types");
  const [status, setStatus] = useState("All Statuses");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [deleteDevice, setDeleteDevice] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  /* =========================================================
     LOAD DEVICES
  ========================================================= */

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    setApiError("");

    try {
      const data = await devicesApi.list();
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load devices:", error);

      setApiError(
        error?.message || "Failed to load devices. Please try again."
      );

      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     MERCHANT DISPLAY HELPER
  ========================================================= */

  function getMerchantName(merchantValue) {
    if (!merchantValue) {
      return "-";
    }

    if (typeof merchantValue === "string") {
      return merchantValue;
    }

    return (
      merchantValue.businessDisplayName ||
      merchantValue.business_name ||
      merchantValue.businessName ||
      `${merchantValue.first_name || ""} ${
        merchantValue.last_name || ""
      }`.trim() ||
      merchantValue.merchant_code ||
      "-"
    );
  }

  /* =========================================================
     DYNAMIC FILTER OPTIONS
  ========================================================= */

  const merchantOptions = useMemo(() => {
    const values = devices
      .map((device) => getMerchantName(device.merchant))
      .filter((value) => value && value !== "-");

    return ["All Merchants", ...new Set(values)];
  }, [devices]);

  const deviceTypeOptions = useMemo(() => {
    const values = devices
      .map((device) => device.type)
      .filter(Boolean);

    return ["All Device Types", ...new Set(values)];
  }, [devices]);

  /* =========================================================
     FILTER DEVICES
  ========================================================= */

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return devices.filter((device) => {
      const merchantName = getMerchantName(device.merchant);

      const matchesSearch =
        !query ||
        device.name?.toLowerCase().includes(query) ||
        device.id?.toLowerCase().includes(query) ||
        device.type?.toLowerCase().includes(query) ||
        device.serial?.toLowerCase().includes(query) ||
        merchantName.toLowerCase().includes(query);

      const matchesMerchant =
        merchant === "All Merchants" ||
        merchantName === merchant;

      const matchesType =
        deviceType === "All Device Types" ||
        device.type === deviceType;

      const matchesStatus =
        status === "All Statuses" ||
        device.status === status;

      return (
        matchesSearch &&
        matchesMerchant &&
        matchesType &&
        matchesStatus
      );
    });
  }, [devices, search, merchant, deviceType, status]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDevices.length / rowsPerPage)
  );

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * rowsPerPage;

  const displayedDevices = filteredDevices.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  /* =========================================================
     FILTER HANDLERS
  ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setMerchant("All Merchants");
    setDeviceType("All Device Types");
    setStatus("All Statuses");
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size) => {
    setRowsPerPage(size);
    setCurrentPage(1);
  };

  /* =========================================================
     STATS
  ========================================================= */

  const totalDevices = devices.length;

  const onlineDevices = devices.filter((device) =>
    ["Active", "Online"].includes(device.status)
  ).length;

  const offlineDevices = devices.filter(
    (device) => device.status === "Offline"
  ).length;

  const inactiveDevices = devices.filter(
    (device) => device.status === "Inactive"
  ).length;

  /* =========================================================
     DEACTIVATE DEVICE
  ========================================================= */

  const handleDeactivateDevice = async () => {
    if (!deleteDevice?.id || deleting) {
      return;
    }

    setDeleting(true);
    setApiError("");

    try {
      await devicesApi.update(deleteDevice.id, {
        status: "Inactive",
      });

      setDevices((current) =>
        current.map((item) =>
          item.id === deleteDevice.id
            ? { ...item, status: "Inactive" }
            : item
        )
      );

      setDeleteDevice(null);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to deactivate device:", error);

      setApiError(
        error?.message ||
          "Failed to deactivate device. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="devices-page">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="devices-page-header">
        <div>
          <h1>Devices</h1>

          <p className="devices-subtitle">
            View and manage devices connected to your stores.
          </p>
        </div>

        <div className="devices-header-actions">
          <button
            type="button"
            className="devices-add-btn"
            onClick={() => navigate("/devices/add")}
          >
            <span>+</span> Add Device
          </button>

          <button
            type="button"
            className="devices-export-btn"
          >
            <span className="export-icon">↓</span> Export
          </button>
        </div>
      </div>

      {/* =====================================================
          API ERROR
      ===================================================== */}

      {apiError && (
        <div className="devices-api-error">
          <AlertCircle size={17} />

          <span>{apiError}</span>

          <button type="button" onClick={loadDevices}>
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="devices-stats">
        <StatCard
          icon={
            <i
              className="bi bi-laptop-fill"
              aria-hidden="true"
            />
          }
          title="Total Devices"
          value={totalDevices}
          variant="purple"
        />

        <StatCard
          icon={
            <i
              className="bi bi-check-circle-fill"
              aria-hidden="true"
            />
          }
          title="Online Devices"
          value={onlineDevices}
          variant="green"
        />

        <StatCard
          icon={
            <i
              className="bi bi-pause-circle-fill"
              aria-hidden="true"
            />
          }
          title="Offline Devices"
          value={offlineDevices}
          variant="orange"
        />

        <StatCard
          icon={
            <i
              className="bi bi-x-circle-fill"
              aria-hidden="true"
            />
          }
          title="Inactive Devices"
          value={inactiveDevices}
          variant="red"
        />
      </div>

      {/* =====================================================
          DEVICE LIST
      ===================================================== */}

      <div className="devices-list-card">
        {/* ===================================================
            REUSABLE FILTERS BAR
        =================================================== */}

        <FiltersBar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by device name or serial number..."
          filters={[
            {
              key: "merchant",
              value: merchant,
              options: merchantOptions.map((option) => ({
                label: option,
                value: option,
              })),
              onChange: (value) => {
                setMerchant(value);
                setCurrentPage(1);
              },
            },
            {
              key: "deviceType",
              value: deviceType,
              options: deviceTypeOptions.map((option) => ({
                label: option,
                value: option,
              })),
              onChange: (value) => {
                setDeviceType(value);
                setCurrentPage(1);
              },
            },
            {
              key: "status",
              value: status,
              options: [
                {
                  label: "All Statuses",
                  value: "All Statuses",
                },
                {
                  label: "Online",
                  value: "Online",
                },
                {
                  label: "Offline",
                  value: "Offline",
                },
                {
                  label: "Inactive",
                  value: "Inactive",
                },
              ],
              onChange: (value) => {
                setStatus(value);
                setCurrentPage(1);
              },
            },
          ]}
          onClear={clearFilters}
        />

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="devices-table-wrap">
          <table className="devices-table">
            <thead>
              <tr>
                <th>DEVICE NAME</th>
                <th>DEVICE TYPE</th>
                <th>SERIAL NUMBER</th>
                <th>MERCHANT NAME</th>
                <th>CONNECTION STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="devices-empty"
                  >
                    Loading devices...
                  </td>
                </tr>
              ) : displayedDevices.length > 0 ? (
                displayedDevices.map((device) => (
                  <DeviceRow
                    key={device.id}
                    device={device}
                    onView={() =>
                      navigate(`/devices/${device.id}`)
                    }
                    onDeactivate={() =>
                      setDeleteDevice(device)
                    }
                    onEdit={() =>
                      navigate(`/devices/${device.id}/edit`)
                    }
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="devices-empty"
                  >
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

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredDevices.length}
          pageSize={rowsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          itemLabel="devices"
          showWhenEmpty
        />
      </div>

      {/* =====================================================
          DEACTIVATE MODAL
      ===================================================== */}

      <DeactivateDeviceModal
        device={deleteDevice}
        deleting={deleting}
        onCancel={() =>
          deleting ? null : setDeleteDevice(null)
        }
        onConfirm={handleDeactivateDevice}
      />
    </div>
  );
}

/* =========================================================
   DEACTIVATION CONFIRMATION MODAL
========================================================= */

function DeactivateDeviceModal({
  device,
  deleting,
  onCancel,
  onConfirm,
}) {
  if (!device) {
    return null;
  }

  return (
    <div
      className="device-delete-overlay"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className="device-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-device-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="device-delete-close"
          aria-label="Close"
          onClick={onCancel}
          disabled={deleting}
        >
          ×
        </button>

        <div className="device-delete-heading">
          <div className="device-delete-icon">
            <i
              className="bi bi-pause-circle"
              aria-hidden="true"
            />
          </div>

          <h2 id="deactivate-device-title">
            Deactivate Device
          </h2>
        </div>

        <p className="device-delete-message">
          Are you sure you want to mark this device inactive?
        </p>

        <p className="device-delete-warning">
          The device record will remain in the system and can
          be reactivated later.
        </p>

        <div className="device-delete-actions">
          <button
            type="button"
            className="device-delete-cancel"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="device-delete-confirm"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Updating..." : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  variant,
}) {
  return (
    <div className="device-stat-card">
      <div
        className={`device-stat-icon ${variant}`}
      >
        {icon}
      </div>

      <div className="device-stat-content">
        <div className="device-stat-title">
          {title}
        </div>

        <div className="device-stat-value">
          {value}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TABLE ROW
========================================================= */

function DeviceRow({
  device,
  onView,
  onDeactivate,
  onEdit,
}) {
  const normalizedStatus =
    device.status
      ?.toLowerCase()
      .replace(/\s+/g, "-") || "unknown";

  return (
    <tr>
      <td>
        <div className="device-name-cell">
          <div className="device-type-icon">
            <Monitor size={16} />
          </div>

          <div>
            <div className="device-name">
              {device.name || "-"}
            </div>

            <div className="device-id">
              {device.id || "-"}
            </div>
          </div>
        </div>
      </td>

      <td>{device.type || "-"}</td>

      <td>{device.serial || "-"}</td>

      <td>{getMerchantName(device.merchant)}</td>

      <td>
        <span
          className={`device-status ${normalizedStatus}`}
        >
          {device.status || "-"}
        </span>
      </td>

      <td>
        <ListActions
          onView={onView}
          onEdit={onEdit}
          onDelete={onDeactivate}
          viewLabel={`View ${device.name || "device"}`}
          editLabel={`Edit ${device.name || "device"}`}
          deleteLabel={`Deactivate ${device.name || "device"}`}
        />
      </td>
    </tr>
  );
}

/* =========================================================
   NOTE:
   getMerchantName is declared outside the component as well
   so DeviceRow can use the same API normalization.
========================================================= */

function getMerchantName(merchantValue) {
  if (!merchantValue) {
    return "-";
  }

  if (typeof merchantValue === "string") {
    return merchantValue;
  }

  return (
    merchantValue.businessDisplayName ||
    merchantValue.business_name ||
    merchantValue.businessName ||
    `${merchantValue.first_name || ""} ${
      merchantValue.last_name || ""
    }`.trim() ||
    merchantValue.merchant_code ||
    "-"
  );
}
