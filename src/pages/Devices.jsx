import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  CheckCircle,
  Clock3,
  AlertCircle,
  Search,
  CalendarDays,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import "../styles/devices.css";
import { devicesApi } from "../api/devices";
export default function Devices() {
  /* ========================================================= STATE ========================================================= */ const [
    search,
    setSearch,
  ] = useState("");
  const [merchant, setMerchant] = useState("All Merchants");
  const [deviceType, setDeviceType] = useState("All Device Types");
  const [status, setStatus] = useState("All Statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [deleteDevice, setDeleteDevice] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const rowsPerPage = 5;
  /* ========================================================= LOAD DEVICES ========================================================= */ useEffect(() => {
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
        error?.message || "Failed to load devices. Please try again.",
      );
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };
  /* ========================================================= DYNAMIC FILTER OPTIONS ========================================================= */ const merchantOptions =
    useMemo(() => {
      const values = devices.map((device) => device.merchant).filter(Boolean);
      return ["All Merchants", ...new Set(values)];
    }, [devices]);
  
  const deviceTypeOptions = useMemo(() => {
    const values = devices.map((device) => device.type).filter(Boolean);
    return ["All Device Types", ...new Set(values)];
  }, [devices]);
  /* ========================================================= FILTER DEVICES ========================================================= */ const filteredDevices =
    useMemo(() => {
      const query = search.trim().toLowerCase();
      return devices.filter((device) => {
        const matchesSearch =
          !query ||
          device.name?.toLowerCase().includes(query) ||
          device.id?.toLowerCase().includes(query) ||
          device.type?.toLowerCase().includes(query) ||
          device.serial?.toLowerCase().includes(query) ||
          device.merchant?.toLowerCase().includes(query) ;
        const matchesMerchant =
          merchant === "All Merchants" || device.merchant === merchant;
       
        const matchesType =
          deviceType === "All Device Types" || device.type === deviceType;
        const matchesStatus =
          status === "All Statuses" || device.status === status;
        return (
          matchesSearch &&
          matchesMerchant &&
          matchesType &&
          matchesStatus
        );
      });
    }, [devices, search, merchant, deviceType, status]);
  /* ========================================================= PAGINATION ========================================================= */ const totalPages =
    Math.max(1, Math.ceil(filteredDevices.length / rowsPerPage));
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
  /* ========================================================= STATS ========================================================= */ const totalDevices =
    devices.length;
  const onlineDevices = devices.filter(
    (device) => device.status === "Online",
  ).length;
  const offlineDevices = devices.filter(
    (device) => device.status === "Offline",
  ).length;
  const inactiveDevices = devices.filter(
    (device) => device.status === "Inactive",
  ).length;
  const onlinePercentage =
    totalDevices > 0
      ? ((onlineDevices / totalDevices) * 100).toFixed(1)
      : "0.0";
  const offlinePercentage =
    totalDevices > 0
      ? ((offlineDevices / totalDevices) * 100).toFixed(1)
      : "0.0";
  const inactivePercentage =
    totalDevices > 0
      ? ((inactiveDevices / totalDevices) * 100).toFixed(1)
      : "0.0";
  /* ========================================================= DELETE DEVICE ========================================================= */ const handleDeleteDevice =
    async () => {
      if (!deleteDevice?.id || deleting) {
        return;
      }
      setDeleting(true);
      setApiError("");
      try {
        await devicesApi.delete(deleteDevice.id);
        setDevices((current) =>
          current.filter((item) => item.id !== deleteDevice.id),
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
  /* ========================================================= RENDER ========================================================= */ return (
    <div className="devices-page">
      {" "}
      {/* ===================================================== PAGE HEADER ===================================================== */}{" "}
      <div className="devices-page-header">
        {" "}
        <div>
          {" "}
          <h1>Devices</h1>{" "}
          <div className="devices-breadcrumb">
            {" "}
            <span>Home</span> <span>›</span> <strong>Devices</strong>{" "}
          </div>{" "}
        </div>{" "}
        <div className="devices-header-actions">
          {" "}
          <button
            type="button"
            className="devices-add-btn"
            onClick={() => navigate("/devices/add")}
          >
            {" "}
            <span>+</span> Add Device{" "}
          </button>{" "}
          <button type="button" className="devices-export-btn">
            {" "}
            <span className="export-icon">↓</span> Export{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* ===================================================== API ERROR ===================================================== */}{" "}
      {apiError && (
        <div className="devices-api-error">
          {" "}
          <AlertCircle size={17} /> <span>{apiError}</span>{" "}
          <button type="button" onClick={loadDevices}>
            {" "}
            Retry{" "}
          </button>{" "}
        </div>
      )}{" "}
      {/* ===================================================== STAT CARDS ===================================================== */}{" "}
      <div className="devices-stats">
        {" "}
        <StatCard
          icon={<Monitor size={22} />}
          title="Total Devices"
          value={totalDevices}
          change="Current devices"
          variant="purple"
        />{" "}
        <StatCard
          icon={<CheckCircle size={22} />}
          title="Online Devices"
          value={onlineDevices}
          change={`↑ ${onlinePercentage}% of total`}
          variant="green"
          progress={Number(onlinePercentage)}
        />{" "}
        <StatCard
          icon={<Clock3 size={22} />}
          title="Offline Devices"
          value={offlineDevices}
          change={`↓ ${offlinePercentage}% of total`}
          variant="orange"
          progress={Number(offlinePercentage)}
        />{" "}
        <StatCard
          icon={<AlertCircle size={22} />}
          title="Inactive Devices"
          value={inactiveDevices}
          change={`↓ ${inactivePercentage}% of total`}
          variant="red"
          progress={Number(inactivePercentage)}
        />{" "}
      </div>{" "}
      {/* ===================================================== FILTER CARD ===================================================== */}{" "}
      <div className="devices-list-card">
        {" "}
        <div className="devices-filter-bar">
          {" "}
          {/* SEARCH */}{" "}
          <div className="devices-search">
            {" "}
            <Search size={17} />{" "}
            <input
              type="text"
              placeholder="Search by device name, serial number,..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            />{" "}
          </div>{" "}
          {/* MERCHANT */}{" "}
          <FilterSelect
            value={merchant}
            onChange={(value) => handleFilterChange(setMerchant, value)}
            options={merchantOptions}
          />{" "}
         
          {/* DEVICE TYPE */}{" "}
          <FilterSelect
            value={deviceType}
            onChange={(value) => handleFilterChange(setDeviceType, value)}
            options={deviceTypeOptions}
          />{" "}
          {/* STATUS */}{" "}
          <FilterSelect
            value={status}
            onChange={(value) => handleFilterChange(setStatus, value)}
            options={["All Statuses", "Online", "Offline", "Inactive"]}
          />{" "}
          {/* DATE */}{" "}
          <button type="button" className="devices-date-btn">
            {" "}
            <CalendarDays size={16} /> <span>Select date range</span>{" "}
          </button>{" "}
          {/* FILTER */}{" "}
          <button type="button" className="devices-filter-btn">
            {" "}
            <SlidersHorizontal size={16} /> Filters{" "}
          </button>{" "}
        </div>{" "}
        {/* =================================================== TABLE =================================================== */}{" "}
        <div className="devices-table-wrap">
          {" "}
          <table className="devices-table">
            {" "}
            <thead>
              {" "}
              <tr>
                {" "}
                <th className="device-check-col">
                  {" "}
                  <input type="checkbox" aria-label="Select all devices" />{" "}
                </th>{" "}
                <th>DEVICE NAME</th> <th>DEVICE TYPE</th> <th>SERIAL NUMBER</th>{" "}
                <th>MERCHANT</th> <th>STATUS</th>{" "}
                 <th>ACTIONS</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody>
              {" "}
              {loading ? (
                <tr>
                  {" "}
                  <td colSpan="9" className="devices-empty">
                    {" "}
                    Loading devices...{" "}
                  </td>{" "}
                </tr>
              ) : displayedDevices.length > 0 ? (
                displayedDevices.map((device) => (
                  <DeviceRow
                    key={device.id}
                    device={device}
                    onDelete={() => setDeleteDevice(device)}
                    onEdit={() => navigate(`/devices/${device.id}/edit`)}
                  />
                ))
              ) : (
                <tr>
                  {" "}
                  <td colSpan="9" className="devices-empty">
                    {" "}
                    No devices found{" "}
                  </td>{" "}
                </tr>
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
        {/* =================================================== PAGINATION =================================================== */}{" "}
        <div className="devices-pagination">
          {" "}
          <div className="devices-showing">
            {" "}
            Showing {filteredDevices.length === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + rowsPerPage, filteredDevices.length)} of{" "}
            {filteredDevices.length} devices{" "}
          </div>{" "}
          <div className="devices-pagination-controls">
            {" "}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              aria-label="First page"
            >
              {" "}
              <ChevronsLeft size={15} />{" "}
            </button>{" "}
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
            >
              {" "}
              <ChevronLeft size={15} />{" "}
            </button>{" "}
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
                {" "}
                {page}{" "}
              </button>
            ))}{" "}
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
            >
              {" "}
              <ChevronRight size={15} />{" "}
            </button>{" "}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              aria-label="Last page"
            >
              {" "}
              <ChevronsRight size={15} />{" "}
            </button>{" "}
          </div>{" "}
          <div className="devices-rows">
            {" "}
            <span>Rows per page</span>{" "}
            <select
              value={rowsPerPage}
              onChange={() => {}}
              aria-label="Rows per page"
            >
              {" "}
              <option value="5">5</option>{" "}
            </select>{" "}
            <ChevronDown size={14} />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* ===================================================== DELETE MODAL ===================================================== */}{" "}
      <DeleteDeviceModal
        device={deleteDevice}
        deleting={deleting}
        onCancel={() => (deleting ? null : setDeleteDevice(null))}
        onConfirm={handleDeleteDevice}
      />{" "}
    </div>
  );
}
/* ========================================================= DELETE CONFIRMATION MODAL ========================================================= */ function DeleteDeviceModal({
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
      {" "}
      <div
        className="device-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-device-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {" "}
        <button
          type="button"
          className="device-delete-close"
          aria-label="Close"
          onClick={onCancel}
          disabled={deleting}
        >
          {" "}
          ×{" "}
        </button>{" "}
        <div className="device-delete-heading">
          {" "}
          <div className="device-delete-icon">
            {" "}
            <i className="bi bi-trash" aria-hidden="true" />{" "}
          </div>{" "}
          <h2 id="delete-device-title"> Delete Device </h2>{" "}
        </div>{" "}
        <p className="device-delete-message">
          {" "}
          Are you sure you want to delete this device?{" "}
        </p>{" "}
        <p className="device-delete-warning">
          {" "}
          This action cannot be undone.{" "}
        </p>{" "}
        <div className="device-delete-actions">
          {" "}
          <button
            type="button"
            className="device-delete-cancel"
            onClick={onCancel}
            disabled={deleting}
          >
            {" "}
            Cancel{" "}
          </button>{" "}
          <button
            type="button"
            className="device-delete-confirm"
            onClick={onConfirm}
            disabled={deleting}
          >
            {" "}
            {deleting ? "Deleting..." : "Delete"}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
/* ========================================================= STAT CARD ========================================================= */ function StatCard({
  icon,
  title,
  value,
  change,
  variant,
  progress,
}) {
  return (
    <div className="device-stat-card">
      {" "}
      <div className={`device-stat-icon ${variant}`}> {icon} </div>{" "}
      <div className="device-stat-content">
        {" "}
        <div className="device-stat-title"> {title} </div>{" "}
        <div className="device-stat-value"> {value} </div>{" "}
        <div className={`device-stat-change ${variant}`}> {change} </div>{" "}
        {progress !== undefined && (
          <div className="device-stat-progress">
            {" "}
            <div
              className={`device-progress-bar ${variant}`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
/* ========================================================= FILTER SELECT ========================================================= */ function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <div className="device-filter-select">
      {" "}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {" "}
        {options.map((option) => (
          <option key={option} value={option}>
            {" "}
            {option}{" "}
          </option>
        ))}{" "}
      </select>{" "}
      <ChevronDown size={15} className="device-filter-arrow" />{" "}
    </div>
  );
}
/* ========================================================= TABLE ROW ========================================================= */ function DeviceRow({
  device,
  onDelete,
  onEdit,
}) {
  const normalizedStatus =
    device.status?.toLowerCase().replace(/\s+/g, "-") || "unknown";
  return (
    <tr>
      {" "}
      <td className="device-check-col">
        {" "}
        <input
          type="checkbox"
          aria-label={`Select ${device.name || "device"}`}
        />{" "}
      </td>{" "}
      <td>
        {" "}
        <div className="device-name-cell">
          {" "}
          <div className="device-type-icon">
            {" "}
            <Monitor size={16} />{" "}
          </div>{" "}
          <div>
            {" "}
            <div className="device-name"> {device.name || "-"} </div>{" "}
            <div className="device-id"> {device.id || "-"} </div>{" "}
          </div>{" "}
        </div>{" "}
      </td>{" "}
<td>{device.type || "-"}</td>

<td>{device.serial || "-"}</td>

<td>{device.merchant || "-"}</td>

<td>
  <span className={`device-status ${normalizedStatus}`}>
    {device.status || "-"}
  </span>
</td>

<td>
  <div className="row-actions device-actions">
    <button
      type="button"
      className="action-btn edit-btn"
      title="Edit"
      aria-label={`Edit ${device.name || "device"}`}
      onClick={onEdit}
    >
      <i className="bi bi-pencil" aria-hidden="true" />
    </button>

    <button
      type="button"
      className="action-btn text-danger"
      title="Delete"
      aria-label={`Delete ${device.name || "device"}`}
      onClick={onDelete}
    >
      <i className="bi bi-trash" aria-hidden="true" />
    </button>
  </div>
</td>
    </tr>
  );
}
