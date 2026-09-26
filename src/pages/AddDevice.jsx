import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, ChevronDown } from "lucide-react";

import "../styles/add-device.css";
import { devicesApi } from "../api/devices";

export default function AddDevice() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (saving) return;

    setApiError("");

    // Basic frontend validation
    if (!formData.deviceName.trim()) {
      setApiError("Device name is required.");
      return;
    }

    if (!formData.deviceType) {
      setApiError("Device type is required.");
      return;
    }

    if (!formData.serialNumber.trim()) {
      setApiError("Device serial number is required.");
      return;
    }

    if (!formData.merchantId) {
      setApiError("Merchant is required.");
      return;
    }

    if (!formData.storeId) {
      setApiError("Store is required.");
      return;
    }

    setSaving(true);

    try {
      console.log("Creating device with form data:", formData);

      const response = await devicesApi.create(formData);

      console.log("Create device response:", response);

      alert("Device saved successfully!");

      navigate("/devices");
    } catch (error) {
      console.error("Create device failed:", error);

      setApiError(
        error?.message ||
          error?.response?.message ||
          "Failed to create device. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-device-page">
      {/* HEADER */}
      <div className="add-device-header">
        <div>
          <h1>Add Device</h1>

          <div className="add-device-breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>Devices</span>
            <span>›</span>
            <strong>Add Device</strong>
          </div>
        </div>

        <button
          type="button"
          className="back-devices-btn"
          onClick={() => navigate("/devices")}
        >
          <ArrowLeft size={15} />
          Back to Devices
        </button>
      </div>

      {/* ERROR */}
      {apiError && <div className="device-api-error">{apiError}</div>}

      {/* FORM */}
      <form
        id="add-device-form"
        className="add-device-form"
        onSubmit={handleSave}
      >
        <section className="device-card">
          <CardHeader
            icon={<Settings size={19} />}
            title="Device Details"
            subtitle="Enter the device information, assignment details and settings."
          />

          <div className="device-form-grid">
            {/* DEVICE NAME */}
            <FormField label="Device Name" required>
              <input
                name="deviceName"
                value={formData.deviceName}
                onChange={handleChange}
                placeholder="Enter device name (e.g. POS Terminal 01)"
                required
              />
            </FormField>

            {/* DEVICE CODE */}
            <FormField label="Device Code" required>
              <input
                name="deviceCode"
                value={formData.deviceCode}
                onChange={handleChange}
                placeholder="Enter device code"
                required
              />
            </FormField>

            {/* SERIAL NUMBER */}
            <FormField label="Device Serial Number" required>
              <input
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="Enter device serial number"
                required
              />
            </FormField>

            {/* DEVICE TYPE */}
            <FormField label="Device Type" required>
              <SelectField
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
                placeholder="Select device type"
                options={[
                  "POS Terminal",
                  "Kitchen Display",
                  "Barcode Scanner",
                  "Receipt Printer",
                  "Customer Display",
                ]}
                required
              />
            </FormField>

            {/* MERCHANT */}
            <FormField label="Merchant" required>
              <SelectField
                name="merchantId"
                value={formData.merchantId}
                onChange={handleChange}
                placeholder="Select merchant"
                options={[
                  "FreshMart",
                  "TechWorld",
                  "FashionHub",
                  "ElectroPlus",
                ]}
                required
              />
            </FormField>

            {/* STORE */}
            <FormField label="Store" required>
              <SelectField
                name="storeId"
                value={formData.storeId}
                onChange={handleChange}
                placeholder="Select store"
                options={[
                  "Banjara Hills",
                  "Jubilee Hills",
                  "Madhapur",
                  "Hitech City",
                  "Gachibowli",
                ]}
                required
              />
            </FormField>

            {/* STATUS */}
            <FormField label="Status" required>
              <SelectField
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={["Active", "Inactive"]}
                required
              />
            </FormField>
          </div>

          {/* ENABLE */}
          <label className="device-checkbox">
            <input
              type="checkbox"
              name="enableImmediately"
              checked={formData.enableImmediately}
              onChange={handleChange}
            />

            <span>Enable device for usage immediately</span>
          </label>

          {/* NOTES */}
          <div className="device-additional-information">
            <FormField label="Notes">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter notes (optional)"
                maxLength={500}
                rows={4}
              />

              <div className="notes-counter">{formData.notes.length}/500</div>
            </FormField>
          </div>
        </section>
      </form>

      {/* ACTIONS */}
      <div className="add-device-actions">
        <button
          type="button"
          className="device-cancel-btn"
          onClick={() => navigate("/devices")}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          form="add-device-form"
          className="device-save-btn"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Device"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   CARD HEADER
========================================================= */

function CardHeader({ icon, title, subtitle }) {
  return (
    <div className="device-card-header">
      <div className="device-card-icon">{icon}</div>

      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({ label, required, children }) {
  return (
    <div className="device-field">
      <label>
        {label}

        {required && <span className="required-star">*</span>}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function SelectField({
  name,
  value,
  onChange,
  placeholder,
  options,
  required,
}) {
  return (
    <div className="device-select-wrapper">
      <select name={name} value={value} onChange={onChange} required={required}>
        {placeholder && <option value="">{placeholder}</option>}

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <ChevronDown size={16} className="device-select-arrow" />
    </div>
  );
}
