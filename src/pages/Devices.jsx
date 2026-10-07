import React, { useEffect, useMemo, useState } from "react";

import { Monitor, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";
import FiltersBar from "../components/FiltersBar";
import ListActions from "../components/ListActions";

import "../styles/devices.css";

import { devicesApi } from "../api/devices";

const ALL_MERCHANTS = "All Merchants";
const ALL_DEVICE_TYPES = "All Device Types";
const ALL_STATUSES = "All Statuses";

function getMerchantName(merchantValue) {
  if (!merchantValue) {
    return "-";
  }

  if (typeof merchantValue === "string") {
    return merchantValue.trim() || "-";
  }

  if (typeof merchantValue === "object") {
    return (
      merchantValue.businessDisplayName ||
      merchantValue.business_name ||
      merchantValue.businessName ||
      merchantValue.merchant_name ||
      merchantValue.merchantName ||
      merchantValue.name ||
      merchantValue.displayName ||
      `${merchantValue.first_name || ""} ${merchantValue.last_name || ""}`.trim() ||
      merchantValue.merchant_code ||
      merchantValue.code ||
      "-"
    );
  }

  return "-";
}

function normalizeStatus(value) {
  const raw = String(value ?? "").trim().toLowerCase();

  if (!raw) {
    return "Unknown";
  }

  if (["online", "active", "enabled", "connected", "running"].includes(raw)) {
    return "Online";
  }

  if (["offline", "disconnected", "disabled"].includes(raw)) {
    return "Offline";
  }

  if (["inactive", "not_active", "not active"].includes(raw)) {
    return "Inactive";
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function devicePercentage(part, total) {
  if (!total) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function StatCard({ icon, title, value, variant, description }) {
  return (
    <div className="device-stat-card">
      <div className={`device-stat-icon ${variant}`}>{icon}</div>

      <div className="device-stat-content">
        <div className="device-stat-title">{title}</div>
        <div className="device-stat-value">{value}</div>
        <div className={`device-stat-description ${variant}`}>
          <i className="bi bi-circle-fill" aria-hidden="true" />
          {description}
        </div>
      </div>
    </div>
  );
}

function DeleteDeviceModal({ device, deleting, onCancel, onConfirm }) {
  if (!device) {
    return null;
  }

  return (
    <div
      className="device-deactivate-overlay"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className="device-deactivate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-device-title"
        onMouseDown={(event) => event.stopPropagation()}
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

        <div className="device-deactivate-icon">
          <i className="bi bi-trash" aria-hidden="true" />
        </div>

        <h2 id="delete-device-title">Delete Device</h2>

        <p className="device-deactivate-message">
          <strong>{device.name || device.id || "This device"}</strong> will be permanently removed.
        </p>

        <p className="device-deactivate-warning">
          This action cannot be undone.
        </p>

        <div className="device-deactivate-actions">
          <button
            type="button"
            className="device-deactivate-cancel"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="device-deactivate-confirm"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Devices() {
  const [search, setSearch] = useState("");
  const [merchant, setMerchant] = useState(ALL_MERCHANTS);
  const [deviceType, setDeviceType] = useState(ALL_DEVICE_TYPES);
  const [status, setStatus] = useState(ALL_STATUSES);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [deleteDevice, setDeleteDevice] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const loadDevices = async () => {
    setLoading(true);
    setApiError("");

    try {
      const data = await devicesApi.list();
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load devices:", error);
      setDevices([]);
      setApiError(error?.message || "Failed to load devices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const merchantOptions = useMemo(() => {
    const values = devices
      .map((device) => getMerchantName(device.merchant))
      .filter((value) => value && value !== "-");

    return [ALL_MERCHANTS, ...new Set(values)];
  }, [devices]);

  const deviceTypeOptions = useMemo(() => {
    const values = devices
      .map((device) => device.type)
      .filter(Boolean);

    return [ALL_DEVICE_TYPES, ...new Set(values)];
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return devices.filter((device) => {
      const merchantName = getMerchantName(device.merchant);
      const deviceStatus = normalizeStatus(device.status);

      const matchesSearch =
        !query ||
        [
          device.name,
          device.id,
          device.type,
          device.serial,
          merchantName,
          deviceStatus,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesMerchant =
        merchant === ALL_MERCHANTS || merchantName === merchant;

      const matchesType =
        deviceType === ALL_DEVICE_TYPES || device.type === deviceType;

      const matchesStatus =
        status === ALL_STATUSES || deviceStatus === status;

      return matchesSearch && matchesMerchant && matchesType && matchesStatus;
    });
  }, [devices, search, merchant, deviceType, status]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const displayedDevices = filteredDevices.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const clearFilters = () => {
    setSearch("");
    setMerchant(ALL_MERCHANTS);
    setDeviceType(ALL_DEVICE_TYPES);
    setStatus(ALL_STATUSES);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size) => {
    setRowsPerPage(size);
    setCurrentPage(1);
  };

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(
    (device) => normalizeStatus(device.status) === "Online",
  ).length;
  const offlineDevices = devices.filter(
    (device) => normalizeStatus(device.status) === "Offline",
  ).length;
  const inactiveDevices = devices.filter(
    (device) => normalizeStatus(device.status) === "Inactive",
  ).length;

  const handleDeleteDevice = async () => {
    if (!deleteDevice?.id || deleting) {
      return;
    }

    setDeleting(true);
    setApiError("");

    try {
      await devicesApi.delete(deleteDevice.id);
      setDevices((current) =>
        current.filter((item) => String(item.id) !== String(deleteDevice.id)),
      );
      setDeleteDevice(null);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to delete device:", error);
      setApiError(
        error?.message || "Failed to delete device. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="devices-page">
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

          <button type="button" className="devices-export-btn">
            <span className="export-icon">↓</span> Export
          </button>
        </div>
      </div>

      {apiError && (
        <div className="devices-api-error">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          <span>{apiError}</span>
          <button type="button" onClick={loadDevices}>
            Retry
          </button>
        </div>
      )}

      <div className="devices-stats">
        <StatCard
          icon={<i className="bi bi-laptop-fill" aria-hidden="true" />}
          title="Total Devices"
          value={totalDevices}
          variant="purple"
          description="Live Records"
        />

        <StatCard
          icon={<i className="bi bi-check-circle-fill" aria-hidden="true" />}
          title="Online Devices"
          value={onlineDevices}
          variant="green"
          description={`${devicePercentage(onlineDevices, totalDevices)}% of total`}
        />

        <StatCard
          icon={<i className="bi bi-pause-circle-fill" aria-hidden="true" />}
          title="Offline Devices"
          value={offlineDevices}
          variant="orange"
          description={`${devicePercentage(offlineDevices, totalDevices)}% of total`}
        />

        <StatCard
          icon={<i className="bi bi-x-circle-fill" aria-hidden="true" />}
          title="Inactive Devices"
          value={inactiveDevices}
          variant="red"
          description={`${devicePercentage(inactiveDevices, totalDevices)}% of total`}
        />
      </div>

      <div className="devices-list-card">
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
                { label: ALL_STATUSES, value: ALL_STATUSES },
                { label: "Online", value: "Online" },
                { label: "Offline", value: "Offline" },
                { label: "Inactive", value: "Inactive" },
              ],
              onChange: (value) => {
                setStatus(value);
                setCurrentPage(1);
              },
            },
          ]}
          onClear={clearFilters}
        />

        <div className="devices-table-wrap">
          <table className="devices-table">
            <thead>
              <tr>
                <th className="device-check-col">
                  <input type="checkbox" aria-label="Select all devices" />
                </th>
                <th>Device Name</th>
                <th>Device Type</th>
                <th>Serial Number</th>
                <th>Merchant Name</th>
                <th>Connection Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="devices-empty">
                    Loading devices...
                  </td>
                </tr>
              ) : displayedDevices.length > 0 ? (
                displayedDevices.map((device) => {
                  const deviceStatus = normalizeStatus(device.status);
                  const merchantName = getMerchantName(device.merchant);

                  return (
                    <tr key={device.id || `${device.name || "device"}-${device.serial || "unknown"}`}>
                      <td className="device-check-col">
                        <input type="checkbox" aria-label={`Select ${device.name || "device"}`} />
                      </td>

                      <td>
                        <div className="device-name-cell">
                          <div className="device-type-icon">
                            <Monitor size={16} />
                          </div>
                          <div>
                            <div className="device-name">{device.name || "-"}</div>
                            <div className="device-id">{device.id || "-"}</div>
                          </div>
                        </div>
                      </td>

                      <td>{device.type || "-"}</td>
                      <td>{device.serial || "-"}</td>
                      <td>{merchantName}</td>

                      <td>
                        <span className={`device-status ${deviceStatus.toLowerCase()}`}>
                          {deviceStatus}
                        </span>
                      </td>

                      <td>
                        <ListActions
                          onEdit={() => navigate(`/devices/${device.id}/edit`)}
                          onDelete={() => setDeleteDevice(device)}
                          editLabel="Edit device"
                          deleteLabel="Delete device"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="devices-empty">
                    No devices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredDevices.length}
          pageSize={rowsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          itemLabel="devices"
        />
      </div>

      <DeleteDeviceModal
        device={deleteDevice}
        deleting={deleting}
        onCancel={() => (deleting ? null : setDeleteDevice(null))}
        onConfirm={handleDeleteDevice}
      />
    </div>
  );
}
