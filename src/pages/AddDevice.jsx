import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Camera,
  Link2,
  MapPin,
  Settings,
  FileText,
  UploadCloud,
  ChevronDown,
} from "lucide-react";

import "../styles/add-device.css";

export default function AddDevice() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [deviceImage, setDeviceImage] = useState(null);

  const [formData, setFormData] = useState({
    deviceName: "",
    deviceType: "",
    serialNumber: "",
    macAddress: "",
    model: "",
    manufacturer: "",
    merchant: "",
    store: "",
    status: "Active",
    timeZone: "(UTC+05:30) Asia/Kolkata",
    location: "",
    floor: "",
    notes: "",
    enableImmediately: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Please upload a JPG or PNG image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setDeviceImage({
      file,
      url: imageUrl,
    });
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = (e) => {
    e.preventDefault();

    const savedDevice = {
      ...formData,
      image: deviceImage?.file?.name || null,
    };

    console.log("Device saved:", savedDevice);

    alert("Device saved successfully!");

    navigate("/devices");
  };

  return (
    <div className="add-device-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

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

      {/* =================================================
          FORM
      ================================================= */}

      <form className="add-device-layout" onSubmit={handleSave}>
        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="add-device-left">
          {/* DEVICE INFORMATION */}

          <section className="device-card">
            <CardHeader
              icon={<UserRound size={19} />}
              title="Device Information"
              subtitle="Enter the basic details of the device."
            />

            <div className="device-form-grid">
              <FormField label="Device Name" required>
                <input
                  name="deviceName"
                  value={formData.deviceName}
                  onChange={handleChange}
                  placeholder="Enter device name (e.g. POS Terminal 01)"
                  required
                />
              </FormField>

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

              <FormField label="Serial Number" required>
                <input
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="Enter serial number"
                  required
                />
              </FormField>

              <FormField label="MAC Address">
                <input
                  name="macAddress"
                  value={formData.macAddress}
                  onChange={handleChange}
                  placeholder="Enter MAC address (optional)"
                />
              </FormField>

              <FormField label="Model">
                <input
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Enter device model (optional)"
                />
              </FormField>

              <FormField label="Manufacturer">
                <input
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="Enter manufacturer (optional)"
                />
              </FormField>
            </div>
          </section>

          {/* ASSIGNMENT DETAILS */}

          <section className="device-card">
            <CardHeader
              icon={<Link2 size={19} />}
              title="Assignment Details"
              subtitle="Assign the device to a merchant and store."
            />

            <div className="device-form-grid">
              <FormField label="Merchant" required>
                <SelectField
                  name="merchant"
                  value={formData.merchant}
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

              <FormField label="Store" required>
                <SelectField
                  name="store"
                  value={formData.store}
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
            </div>
          </section>

          {/* DEVICE SETTINGS */}

          <section className="device-card">
            <CardHeader
              icon={<Settings size={19} />}
              title="Device Settings"
              subtitle="Configure additional settings for the device."
            />

            <div className="device-form-grid">
              <FormField label="Status" required>
                <SelectField
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={["Active", "Inactive"]}
                />
              </FormField>

              <FormField label="Time Zone">
                <SelectField
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleChange}
                  options={[
                    "(UTC+05:30) Asia/Kolkata",
                    "(UTC+00:00) UTC",
                    "(UTC-05:00) America/New_York",
                  ]}
                />
              </FormField>
            </div>

            <label className="device-checkbox">
              <input
                type="checkbox"
                name="enableImmediately"
                checked={formData.enableImmediately}
                onChange={handleChange}
              />

              <span>Enable device for usage immediately</span>
            </label>
          </section>
        </div>

        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div className="add-device-right">
          {/* DEVICE IMAGE */}

          <section className="device-card">
            <CardHeader
              icon={<Camera size={19} />}
              title="Device Image"
              subtitle="Upload a photo of the device (optional)."
            />

            <div
              className="device-upload-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleImageChange}
                hidden
              />

              {deviceImage ? (
                <div className="uploaded-device-image">
                  <img src={deviceImage.url} alt="Device preview" />

                  <button
                    type="button"
                    className="change-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud size={27} className="upload-cloud-icon" />

                  <div className="upload-main-text">
                    Drag and drop an image here, or
                  </div>

                  <button
                    type="button"
                    className="choose-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Choose File
                  </button>

                  <div className="upload-hint">JPG, PNG (Max 2MB)</div>
                </>
              )}
            </div>
          </section>

          {/* LOCATION DETAILS */}

          <section className="device-card">
            <CardHeader
              icon={<MapPin size={19} />}
              title="Location Details"
              subtitle="Specify where the device is being used."
            />

            <div className="device-single-column">
              <FormField label="Location / Area">
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter location or area (e.g., Billing Counter)"
                />
              </FormField>

              <FormField label="Floor / Section">
                <input
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="Enter floor or section (optional)"
                />
              </FormField>
            </div>
          </section>

          {/* ADDITIONAL INFORMATION */}

          <section className="device-card">
            <CardHeader
              icon={<FileText size={19} />}
              title="Additional Information"
              subtitle="Add any notes or remarks about this device."
            />

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
          </section>
        </div>
      </form>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="add-device-actions">
        <button
          type="button"
          className="device-cancel-btn"
          onClick={() => navigate("/devices")}
        >
          Cancel
        </button>

        <button
          type="submit"
          form="add-device-form"
          className="device-save-btn"
          onClick={handleSave}
        >
          Save Device
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
