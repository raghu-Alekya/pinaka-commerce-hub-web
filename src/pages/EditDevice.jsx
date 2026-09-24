import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Settings,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { devicesApi } from "../api/devices";
import "../styles/device-view.css";

export default function EditDevice() {
  const navigate = useNavigate();
  const { deviceId } = useParams();

  const [form, setForm] = useState({
    deviceName: "",
    deviceCode: "",
    deviceType: "",
    serialNumber: "",
    merchantId: "",
    storeId: "",
    status: "Active",
    notes: "",
    enableImmediately: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  /* =========================================================
     LOAD DEVICE
  ========================================================= */

  useEffect(() => {
    if (!deviceId) {
      setApiError("Device ID is missing.");
      setLoading(false);
      return;
    }

    loadDevice();
  }, [deviceId]);

  const loadDevice = async () => {
    setLoading(true);
    setApiError("");

    try {
      const data = await devicesApi.get(deviceId);

      if (!data) {
        throw new Error("Device not found.");
      }

      setForm({
        deviceName: data.name || "",
        deviceCode: data.deviceCode || data.id || "",
        deviceType: data.type || "",
        serialNumber: data.serial || "",
        merchantId: data.merchantId || "",
        storeId: data.storeId || "",
        status: data.status || "Active",
        notes: data.notes || "",
        enableImmediately: Boolean(data.enableImmediately),
      });
    } catch (error) {
      console.error("Failed to load device:", error);

      setApiError(error?.message || "Failed to load device. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const update = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const save = async (e) => {
    e.preventDefault();

    if (!deviceId) {
      setApiError("Device ID is missing.");
      return;
    }

    setSaving(true);
    setApiError("");

    try {
      await devicesApi.update(deviceId, form);

      alert("Device updated successfully!");

      navigate(`/devices/${deviceId}`);
    } catch (error) {
      console.error("Update device failed:", error);

      setApiError(
        error?.message || "Failed to update device. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     SELECT
  ========================================================= */

  const select = (name, value, options, placeholder) => (
    <div className="device-edit-select">
      <select name={name} value={value} onChange={update} required>
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <ChevronDown size={15} />
    </div>
  );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="device-view-page">
        <div className="device-view-loading">Loading device...</div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (apiError && !form.deviceName) {
    return (
      <div className="device-view-page">
        <div className="device-view-error">
          <AlertCircle size={20} />

          <span>{apiError}</span>

          <button type="button" onClick={loadDevice}>
            Retry
          </button>
        </div>

        <button
          type="button"
          className="device-view-back"
          onClick={() => navigate("/devices")}
        >
          <ArrowLeft size={15} />
          Back to Devices
        </button>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="device-view-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="device-view-header">
        <div>
          <h1>Edit Device</h1>

          <div className="device-view-breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Devices</span>
            <span>›</span>
            <strong>Edit Device</strong>
          </div>
        </div>

        <button
          type="button"
          className="device-view-back"
          onClick={() => navigate("/devices")}
        >
          <ArrowLeft size={15} />
          Back to Devices
        </button>
      </div>

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {apiError && (
        <div className="device-edit-api-error">
          <AlertCircle size={18} />
          <span>{apiError}</span>
        </div>
      )}

      {/* =====================================================
          FORM
      ===================================================== */}

      <form onSubmit={save} className="device-view-card">
        {/* CARD HEADER */}

        <div className="device-card-header">
          <div className="device-card-icon">
            <Settings size={19} />
          </div>

          <div>
            <h2>Device Details</h2>

            <p>
              Update the device information, assignment details and settings.
            </p>
          </div>
        </div>

        {/* =================================================
            FIELDS
        ================================================= */}

        <div className="device-view-grid">
          {/* DEVICE NAME */}

          <EditField label="Device Name" required>
            <input
              name="deviceName"
              value={form.deviceName}
              onChange={update}
              placeholder="Enter device name"
              required
            />
          </EditField>

          {/* DEVICE CODE */}

          <EditField label="Device Code" required>
            <input
              name="deviceCode"
              value={form.deviceCode}
              onChange={update}
              placeholder="Enter device code"
              required
            />
          </EditField>

          {/* DEVICE TYPE */}

          <EditField label="Device Type" required>
            {select(
              "deviceType",
              form.deviceType,
              [
                "POS Terminal",
                "Kitchen Display",
                "Barcode Scanner",
                "Receipt Printer",
                "Customer Display",
              ],
              "Select device type",
            )}
          </EditField>

          {/* SERIAL NUMBER */}

          <EditField label="Serial Number" required>
            <input
              name="serialNumber"
              value={form.serialNumber}
              onChange={update}
              placeholder="Enter serial number"
              required
            />
          </EditField>

          {/* MERCHANT */}

          <EditField label="Merchant" required>
            {select(
              "merchantId",
              form.merchantId,
              ["FreshMart", "TechWorld", "FashionHub", "ElectroPlus"],
              "Select merchant",
            )}
          </EditField>

          {/* STORE */}

          <EditField label="Store" required>
            {select(
              "storeId",
              form.storeId,
              [
                "Banjara Hills",
                "Jubilee Hills",
                "Madhapur",
                "Hitech City",
                "Gachibowli",
              ],
              "Select store",
            )}
          </EditField>

          {/* STATUS */}

          <EditField label="Status" required>
            {select(
              "status",
              form.status,
              ["Active", "Inactive"],
              "Select status",
            )}
          </EditField>
        </div>

        {/* =================================================
            ENABLE DEVICE
        ================================================= */}

        <label className="device-checkbox">
          <input
            type="checkbox"
            name="enableImmediately"
            checked={form.enableImmediately}
            onChange={update}
          />

          <span>Enable device for usage immediately</span>
        </label>

        {/* =================================================
            NOTES
        ================================================= */}

        <div className="device-view-section edit-notes">
          <div className="device-view-section-title">
            Additional Information
          </div>

          <div className="device-edit-notes-wrap">
            <textarea
              name="notes"
              value={form.notes}
              onChange={update}
              maxLength={500}
              placeholder="Enter notes (optional)"
              rows={4}
            />

            <span>{form.notes.length}/500</span>
          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="device-view-actions">
          <button
            type="button"
            className="device-view-cancel"
            onClick={() => navigate("/devices")}
            disabled={saving}
          >
            Cancel
          </button>

          <button type="submit" className="device-view-save" disabled={saving}>
            <Save size={15} />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   EDIT FIELD
========================================================= */

function EditField({ label, required, children }) {
  return (
    <div className="device-view-field edit-field">
      <label>
        {label}

        {required && <span className="required-star">*</span>}
      </label>

      {children}
    </div>
  );
}
