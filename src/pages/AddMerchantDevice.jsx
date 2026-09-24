import React, { useEffect, useRef, useState } from "react";
import { getMerchant } from "../api/merchants";
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

import "../styles/add-merchant-device.css";
import "../styles/merchant-form-shared.css";

export default function AddMerchantDevice({
  merchantId,
  merchant,
  onBack,
  onSave,
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const formRef = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const request =
      merchant?._onboarding && String(merchant.id) === String(merchantId)
        ? Promise.resolve({ merchant, stores: merchant._onboarding.stores })
        : Promise.resolve().then(() => {
            if (!merchantId) throw Error("Select a merchant first.");
            return getMerchant(merchantId);
          });
    request
      .then((value) => {
        if (active) setDetails(value);
      })
      .catch((failure) => {
        if (active) setError(failure.message || "Unable to load stores.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [merchantId, merchant, attempt]);
  const response = details?.raw || details || {};
  const raw =
    response.merchant || response.data?.merchant || response.data || response;
  const source =
    raw._onboarding?.stores ??
    response.stores ??
    response.data?.stores ??
    raw.stores;
  const stores = (Array.isArray(source) ? source : [])
    .filter(
      (store) =>
        store.merchantId == null ||
        String(store.merchantId) === String(merchantId),
    )
    .map((store) => ({
      id: String(
        store.id ?? store.storeId ?? store.code ?? store.storeCode ?? "",
      ),
      name: store.name || store.storeName || store.code || store.storeCode,
    }))
    .filter((store) => store.id);
  const fileInputRef = useRef(null);

  const [deviceImage, setDeviceImage] = useState(null);

  const [formData, setFormData] = useState({
    deviceName: "",
    deviceType: "",
    serialNumber: "",
    macAddress: "",
    model: "",
    manufacturer: "",
    merchant: merchantId,
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

  useEffect(
    () => () => {
      if (deviceImage?.url) URL.revokeObjectURL(deviceImage.url);
    },
    [deviceImage],
  );
  const handleSave = async (e) => {
    e.preventDefault();
    if (savingRef.current || loading) return;
    if (!formRef.current?.reportValidity()) return;
    if (!stores.some((store) => store.id === formData.store)) {
      setError("Select a store belonging to this merchant.");
      return;
    }
    if (!formData.deviceName.trim() || !formData.serialNumber.trim()) {
      setError("Device name and serial number are required.");
      return;
    }
    if (typeof onSave !== "function") {
      setError(
        "Device saving is not connected. Pass your device API handler as onSaveDevice to Merchants.",
      );
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...formData,
        deviceName: formData.deviceName.trim(),
        serialNumber: formData.serialNumber.trim(),
        merchant: merchantId,
        merchantId,
        storeId: formData.store,
        image: deviceImage?.file || null,
      });
      onBack();
    } catch (failure) {
      setError(failure.message || "Unable to save device.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="add-device-page merchant-device-embedded pch-context-form">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      {loading && <p role="status">Loading merchant stores…</p>}
      {error && (
        <div className="merchant-device-error" role="alert">
          {error}{" "}
          {!details && (
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {!loading && details && !stores.length && (
        <p role="status">
          No stores available. Add a store for this merchant first.
        </p>
      )}
      <form
        id="add-merchant-device-form"
        ref={formRef}
        className="add-device-layout"
        onSubmit={handleSave}
      >
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
              subtitle="Select a store belonging to this merchant."
            />

            <div className="device-form-grid">
              <FormField label="Store" required>
                <div className="device-select-wrapper">
                  <select
                    aria-label="Store"
                    name="store"
                    value={formData.store}
                    onChange={handleChange}
                    required
                    disabled={loading || saving || !stores.length}
                  >
                    <option value="">Select store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="device-select-arrow" />
                </div>
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
        <button type="button" className="device-cancel-btn" onClick={onBack}>
          Cancel
        </button>

        <button
          type="submit"
          form="add-merchant-device-form"
          className="device-save-btn"
          disabled={saving || loading || !stores.length}
        >
          {saving ? "Saving…" : "Save Device"}
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
    <div className="pch-form-card-header">
      <div className="pch-form-card-icon">{icon}</div>

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
