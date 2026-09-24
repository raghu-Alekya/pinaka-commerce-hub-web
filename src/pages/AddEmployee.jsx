import React, { useEffect, useState } from "react";
import PhoneInputModule from "react-phone-input-2";

const PhoneInput = PhoneInputModule.default || PhoneInputModule;
import "react-phone-input-2/lib/style.css";
import {
  User,
  Camera,
  BriefcaseBusiness,
  MapPin,
  Settings,
  Upload,
  CalendarDays,
  ChevronDown,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

import "../styles/add-employee.css";
import { createEmployee } from "../api/employees";
import { listMerchants } from "../api/merchants";

/*
 * Store Role Assignment UI styles.
 * Kept here so the new Work Information UI works without requiring
 * changes to the existing add-employee.css file.
 */
const storeRoleStyles = `
  .field-error {
    display: block;
    margin-top: 5px;
    color: #dc2626;
    font-size: 12px;
    line-height: 1.3;
  }

  .field-invalid {
    border-color: #dc2626 !important;
  }

  .employee-phone-invalid .form-control {
    border-color: #dc2626 !important;
  }

  .work-information-card {
    overflow: visible;
  }

  .work-merchant-field {
    margin-top: 24px;
  }

  .employee-login-pin-field {
    margin-top: 20px;
  }

  .employee-login-pin-field label {
    display: block;
    margin-bottom: 7px;
    color: #17233d;
    font-size: 15px;
    font-weight: 600;
  }

  .employee-login-pin-field label span {
    color: #e11d48;
  }

  .employee-login-pin-field input {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border: 1px solid #d4dfed;
    border-radius: 8px;
    background: #fff;
    color: #1c3154;
    font-size: 15px;
    outline: none;
    box-sizing: border-box;
    letter-spacing: 2px;
  }

  .employee-login-pin-field input::placeholder {
    color: #91a3bd;
    letter-spacing: 0;
  }

  .employee-login-pin-field input:focus {
    border-color: #8172ef;
    box-shadow: 0 0 0 3px rgba(129, 114, 239, .10);
  }

  .employee-login-pin-help {
    display: block;
    margin-top: 6px;
    color: #7b8da8;
    font-size: 12px;
  }

  .store-role-assignment-section {
    margin-top: 22px;
  }

  .store-role-heading {
    margin-bottom: 12px;
  }

  .store-role-label {
    display: block;
    margin-bottom: 5px;
    font-size: 15px;
    font-weight: 600;
  }

  .store-role-label span,
  .store-role-field label span {
    color: #e11d48;
  }

  .store-role-heading p {
    margin: 0;
    color: #7b8da8;
    font-size: 13px;
  }

  .store-assignment-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .store-assignment-card {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) 36px;
    align-items: center;
    gap: 14px;
    min-height: 76px;
    padding: 10px 12px;
    border: 1px solid #dce5f1;
    border-radius: 10px;
    background: #fff;
    box-sizing: border-box;
  }

  .store-assignment-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .store-assignment-icon {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f0ebff;
    color: #4b24df;
  }

  .store-assignment-name {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .store-assignment-name strong {
    color: #17233d;
    font-size: 15px;
    line-height: 1.2;
  }

  .store-assignment-name span {
    color: #7890b1;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .store-select-inline {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .store-select-inline select {
    width: 100%;
    min-width: 0;
    padding: 0 22px 0 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #7890b1;
    font-size: 12px;
    appearance: none;
    cursor: pointer;
  }

  .store-select-inline svg {
    position: absolute;
    right: 2px;
    pointer-events: none;
    color: #7890b1;
  }

  .store-role-field {
    min-width: 0;
  }

  .store-role-field > label {
    display: block;
    margin-bottom: 5px;
    color: #17233d;
    font-size: 12px;
    font-weight: 600;
  }

  .role-multi-select-wrapper {
    position: relative;
  }

  .role-multi-select {
    width: 100%;
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 10px;
    border: 1px solid #d4dfed;
    border-radius: 8px;
    background: #fff;
    color: #1c3154;
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
  }

  .role-multi-select:hover {
    border-color: #8c7bf2;
  }

  .selected-role-chips {
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .role-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 8px;
    border-radius: 6px;
    background: #edf3fb;
    color: #27466f;
    font-size: 12px;
    line-height: 1;
  }

  .remove-role-chip {
    border: 0;
    padding: 0;
    background: transparent;
    color: #68809f;
    font-size: 15px;
    line-height: 12px;
    cursor: pointer;
  }

  .role-placeholder {
    padding: 5px 2px;
    color: #91a3bd;
    font-size: 12px;
  }

  .role-select-chevron {
    flex: 0 0 auto;
    transition: transform .15s ease;
  }

  .role-select-chevron.open {
    transform: rotate(180deg);
  }

  .role-options-menu {
    position: absolute;
    z-index: 30;
    top: calc(100% + 5px);
    left: 0;
    right: 0;
    max-height: 190px;
    overflow-y: auto;
    padding: 5px;
    border: 1px solid #d8e2ef;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 12px 30px rgba(33, 55, 88, .14);
  }

  .role-option {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #263d60;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
  }

  .role-option:hover,
  .role-option.selected {
    background: #f2efff;
    color: #4323c8;
  }

  .delete-store-assignment-btn {
    width: 36px;
    height: 36px;
    align-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ffd1dc;
    border-radius: 8px;
    background: #fff6f8;
    color: #e11d48;
    cursor: pointer;
    font-size: 15px;
  }

  .delete-store-assignment-btn:hover {
    background: #ffe8ee;
  }

  .add-another-store-btn {
    width: 100%;
    min-height: 44px;
    margin-top: 12px;
    border: 1px dashed #8172ef;
    border-radius: 8px;
    background: #faf9ff;
    color: #4226c9;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .add-another-store-btn:hover:not(:disabled) {
    background: #f3f0ff;
  }

  .add-another-store-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .add-store-plus {
    margin-right: 7px;
    font-size: 21px;
    line-height: 0;
    vertical-align: -2px;
  }

  @media (max-width: 900px) {
    .store-assignment-card {
      grid-template-columns: minmax(0, 1fr) 36px;
    }

    .store-role-field {
      grid-column: 1 / -1;
    }

    .delete-store-assignment-btn {
      grid-column: 2;
      grid-row: 1;
    }
  }
`;

function StoreRoleAssignmentStyles() {
  return <style>{storeRoleStyles}</style>;
}

export default function AddEmployee() {
  const [showPassword, setShowPassword] = useState(false);

  // Profile image preview
  const [profileImage, setProfileImage] = useState(null);

  const [formData, setFormData] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    role: "",
    merchant: "",
    store: "",
    employeeLoginPin: "",
    manager: "",
    username: "",
    password: "",
    sendCredentials: true,
  });

  // Store + role assignments.
  // Nothing is pre-populated: the user adds a store and then selects
  // one or more roles for that store.
  const [storeAssignments, setStoreAssignments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [merchantOptions, setMerchantOptions] = useState([]);
  const [merchantLoadError, setMerchantLoadError] = useState("");

  useEffect(() => {
    let active = true;

    listMerchants()
      .then((merchants) => {
        if (active) setMerchantOptions(merchants);
      })
      .catch((error) => {
        if (active) setMerchantLoadError(error.message || "Unable to load merchants.");
      });

    return () => {
      active = false;
    };
  }, []);

  const validateField = (name, value) => {
    const trimmed = typeof value === "string" ? value.trim() : value;

    switch (name) {
      case "employeeCode":
        if (!trimmed) return "Employee Code is required.";
        if (!/^[A-Za-z0-9-]{2,30}$/.test(trimmed)) {
          return "Employee Code must be 2-30 characters and use only letters, numbers and hyphens.";
        }
        return "";

      case "firstName":
        if (!trimmed) return "First Name is required.";
        if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(trimmed)) {
          return "First Name can contain letters, spaces, apostrophes and hyphens only.";
        }
        if (trimmed.length < 2 || trimmed.length > 50) {
          return "First Name must be between 2 and 50 characters.";
        }
        return "";

      case "lastName":
        if (!trimmed) return "Last Name is required.";
        if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(trimmed)) {
          return "Last Name can contain letters, spaces, apostrophes and hyphens only.";
        }
        if (trimmed.length < 2 || trimmed.length > 50) {
          return "Last Name must be between 2 and 50 characters.";
        }
        return "";

      case "email":
        if (!trimmed) return "Email Address is required.";
        if (trimmed.length > 254) return "Email Address is too long.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return "Enter a valid email address.";
        }
        return "";

      case "phone": {
        if (!trimmed) return "Phone Number is required.";

        const phoneDigits = trimmed.replace(/\D/g, "");

        if (phoneDigits.length < 8 || phoneDigits.length > 15) {
          return "Enter a valid phone number.";
        }
            }
        return "";


      case "dob":
        if (!trimmed) return "Date of Birth is required.";
        if (Number.isNaN(new Date(trimmed).getTime())) {
          return "Enter a valid date of birth.";
        }
        if (new Date(trimmed) > new Date()) {
          return "Date of Birth cannot be in the future.";
        }
        return "";

      case "gender":
        if (!trimmed) return "Gender is required.";
        if (!["Male", "Female", "Other"].includes(trimmed)) {
          return "Select a valid gender.";
        }
        return "";

      case "address1":
        if (!trimmed) return "Address Line 1 is required.";
        if (trimmed.length < 5 || trimmed.length > 150) {
          return "Address Line 1 must be between 5 and 150 characters.";
        }
        return "";

      case "address2":
        if (trimmed && trimmed.length > 150) return "Address Line 2 cannot exceed 150 characters.";
        return "";

      case "city":
        if (!trimmed) return "City is required.";
        if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(trimmed)) {
          return "City can contain letters, spaces, apostrophes and hyphens only.";
        }
        if (trimmed.length < 2 || trimmed.length > 50) return "City must be between 2 and 50 characters.";
        return "";

      case "state":
        if (!trimmed) return "State is required.";
        return "";

      case "pinCode":
        if (!/^\d{6}$/.test(trimmed)) return "PIN Code must be exactly 6 digits.";
        if (trimmed.startsWith("0")) return "PIN Code cannot start with 0.";
        return "";

      case "country":
        if (!trimmed) return "Country is required.";
        return "";

      case "merchant":
        if (!trimmed) return "Merchant is required.";
        return "";

      case "employeeLoginPin":
        if (!/^\d{6}$/.test(trimmed)) return "Employee Login PIN must be exactly 6 digits.";
        return "";

      case "username":
        if (!trimmed) return "Username is required.";
        if (!/^[A-Za-z0-9_]{4,30}$/.test(trimmed)) {
          return "Username must be 4-30 characters and use only letters, numbers and underscore.";
        }
        return "";

      case "password":
        if (!trimmed) return "Temporary Password is required.";
        if (trimmed.length < 8) return "Password must be at least 8 characters.";
        if (trimmed.length > 64) return "Password cannot exceed 64 characters.";
        if (!/[A-Z]/.test(trimmed) || !/[a-z]/.test(trimmed) || !/\d/.test(trimmed) || !/[^A-Za-z0-9]/.test(trimmed)) {
          return "Password must contain uppercase, lowercase, number and special character.";
        }
        return "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    const requiredFields = [
      "employeeCode", "firstName", "lastName", "email", "phone",
      "dob", "gender",
      "address1", "city", "state", "pinCode", "country",
      "merchant", "username", "password"
    ];

    requiredFields.forEach((name) => {
      const error = validateField(name, formData[name]);
      if (error) nextErrors[name] = error;
    });

    if (formData.address2) {
      const error = validateField("address2", formData.address2);
      if (error) nextErrors.address2 = error;
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  // Keep these as the available master-data options used by the form.
  // The assignments themselves are never hard-coded.
  const availableStores = [
    { id: "66666666-6666-4666-8666-666666666661", name: "Banjara Hills" },
  ];

  const availableRoles = [
    { id: "543b1d7e-a021-481f-a842-4534124a8925", name: "Admin" },
  ];

  const addStoreAssignment = () => {
    const firstUnassignedStore = availableStores.find(
      (store) =>
        !storeAssignments.some((assignment) => assignment.store === store.id)
    );

    if (!firstUnassignedStore) {
      return;
    }

    setStoreAssignments((prev) => [
      ...prev,
      {
        id: Date.now(),
        store: firstUnassignedStore.id,
        roles: [],
      },
    ]);
  };

  const updateStore = (id, store) => {
    setStoreAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === id ? { ...assignment, store } : assignment
      )
    );

    if (errors[`store-${id}`]) {
      setErrors((prev) => ({
        ...prev,
        [`store-${id}`]: "",
      }));
    }
  };

  const updateStoreRoles = (id, roles) => {
    setStoreAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === id ? { ...assignment, roles } : assignment
      )
    );

    if (errors[`roles-${id}`]) {
      setErrors((prev) => ({
        ...prev,
        [`roles-${id}`]: "",
      }));
    }
  };

  const removeStoreAssignment = (id) => {
    setStoreAssignments((prev) =>
      prev.filter((assignment) => assignment.id !== id)
    );
  };

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    const nextValue =
      name === "employeeLoginPin"
        ? value.replace(/\D/g, "").slice(0, 6)
        : name === "pinCode"
          ? value.replace(/\D/g, "").slice(0, 6)
          : type === "checkbox"
            ? checked
            : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, nextValue),
      }));
    }
  };

  /* =========================================================
     PROFILE IMAGE UPLOAD
  ========================================================= */

  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Check image type
    if (!file.type.startsWith("image/")) {
      alert("Please select a JPG or PNG image.");
      e.target.value = "";
      return;
    }

    // Maximum 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB.");
      e.target.value = "";
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  /* =========================================================
     CLEANUP IMAGE URL
  ========================================================= */

  useEffect(() => {
    return () => {
      if (profileImage) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  /* =========================================================
     SAVE EMPLOYEE
  ========================================================= */

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      const invalidFields = [...new Set(
        Object.keys(validationErrors).map((field) => {
          if (field === "storeAssignments" || field.startsWith("store-") || field.startsWith("roles-")) {
            return "store and role assignments";
          }
          return field
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (character) => character.toUpperCase());
        })
      )];
      setSubmitError(`Please fix: ${invalidFields.join(", ")}.`);
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector(
          ".field-invalid, .employee-phone-invalid .form-control"
        );
        firstInvalid?.focus?.();
        firstInvalid?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      });
      return;
    }

    try {
      setIsSaving(true);
      await createEmployee(formData, storeAssignments);
      if (profileImage && formData.employeeCode) {
        window.localStorage.setItem(
          `employee-profile-photo:${formData.employeeCode}`,
          profileImage,
        );
      }
      setFormData({
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dob: "",
        gender: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India",
        role: "",
        merchant: "",
        store: "",
        employeeLoginPin: "",
        manager: "",
        username: "",
        password: "",
        sendCredentials: true,
      });
      setStoreAssignments([]);
      setErrors({});
      setProfileImage(null);
      setSuccessMessage("Employee created successfully.");
    } catch (error) {
      setSubmitError(error.message || "Unable to save employee.");
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     BACK
  ========================================================= */

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="add-employee-page">
      <StoreRoleAssignmentStyles />

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="add-employee-header">
        <div>
          <h1>Add Employee</h1>

          <div className="add-employee-breadcrumb">
            <span>Home</span>

            <span className="breadcrumb-arrow">›</span>

            <span>Employees</span>

            <span className="breadcrumb-arrow">›</span>

            <strong>Add Employee</strong>
          </div>
        </div>

        <button
          type="button"
          className="back-employees-btn"
          onClick={handleBack}
        >
          <ArrowLeft size={17} />
          Back to Employees
        </button>
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <form onSubmit={handleSave} autoComplete="off">
        <div className="add-employee-layout">
          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="add-employee-left">
            {/* =================================================
                PERSONAL INFORMATION
            ================================================= */}

            <section className="employee-card">
              <CardHeader
                icon={<User size={21} />}
                title="Personal Information"
                description="Enter the basic details of the employee."
              />

              <div className="employee-form-grid two-columns">
                <FormField
                  label="First Name"
                  required
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                />

                <FormField
                  label="Last Name"
                  required
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                />

                <FormField
                  label="Email Address"
                  required
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />

                {/* PHONE */}

                <div className="employee-field">
                  <label>
                    Phone Number <span>*</span>
                  </label>

                  <div className="phone-input">
                    <div className="country-code">
                      <span>+91</span>

                      <ChevronDown size={15} />
                    </div>

                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
              <div className="employee-field employee-phone-field">
                <label>
                  Phone Number <span>*</span>
                </label>

                <PhoneInput
                  country="in"
                  enableSearch
                  countryCodeEditable={false}
                  autoFormat
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: value,
                    }))
                  }
                  inputProps={{
                    name: "phone",
                    required: true,
                    autoComplete: "tel",
                  }}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

                {/* DATE OF BIRTH */}

                <div className="employee-field">

                  <label>Date of Birth</label>
                  <label>
                    Date of Birth <span>*</span>
                  </label>

                  <div className="input-with-icon">
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className={errors.dob ? "field-invalid" : ""}
                    />

                    <CalendarDays size={17} />
                  </div>
                  {errors.dob && <span className="field-error">{errors.dob}</span>}
                </div>

                {/* GENDER */}

                <SelectField
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  error={errors.gender}
                  placeholder="Select gender"
                  options={["Male", "Female", "Other"]}
                />
              </div>
            </section>

            {/* =================================================
                ADDRESS
            ================================================= */}

            <section className="employee-card">
              <CardHeader
                icon={<MapPin size={21} />}
                title="Address"
                description="Enter the employee's address details."
              />

              <div className="employee-form-grid two-columns">
                <FormField
                  label="Address Line 1"
                  name="address1"
                  placeholder="Enter address line 1"
                  value={formData.address1}
                  onChange={handleChange}
                  error={errors.address1}
                />

                <FormField
                  label="Address Line 2"
                  name="address2"
                  placeholder="Enter address line 2 (optional)"
                  value={formData.address2}
                  onChange={handleChange}
                  error={errors.address2}
                />
              </div>

              <div className="employee-form-grid three-columns">
                <FormField
                  label="City"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                  error={errors.city}
                />

                <SelectField
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  error={errors.state}
                  placeholder="Select state"
                  options={[
                    "Telangana",
                    "Andhra Pradesh",
                    "Karnataka",
                    "Tamil Nadu",
                    "Maharashtra",
                    "Kerala",
                  ]}
                />

                <FormField
                  label="PIN Code"
                  name="pinCode"
                  placeholder="Enter PIN code"
                  value={formData.pinCode}
                  onChange={handleChange}
                  error={errors.pinCode}
                />
              </div>

              <div className="country-field">
                <SelectField
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  error={errors.country}
                  options={[
                    "India",
                    "United States",
                    "United Kingdom",
                    "Australia",
                  ]}
                />
              </div>
            </section>
          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <div className="add-employee-right">
            {/* =================================================
                PROFILE PHOTO
            ================================================= */}

            <section className="employee-card profile-photo-card">
              <CardHeader
                icon={<Camera size={21} />}
                title="Profile Photo"
                description="Upload a profile photo for the employee."
              />

              <div className="profile-upload-area">
                {/* PROFILE IMAGE */}

                <div className="profile-avatar">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Employee profile"
                      className="profile-avatar-image"
                    />
                  ) : (
                    <User size={39} />
                  )}
                </div>

                {/* UPLOAD */}

                <div>
                  <button
                    type="button"
                    className="upload-photo-btn"
                    onClick={() =>
                      document.getElementById("employee-photo").click()
                    }
                  >
                    <Upload size={17} />

                    {profileImage ? "Change Photo" : "Upload Photo"}
                  </button>

                  <input
                    id="employee-photo"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    hidden
                    onChange={handleProfileUpload}
                  />

                  <div className="upload-help">JPG, PNG (Max 2MB)</div>
                </div>
              </div>
            </section>

            {/* =================================================
                WORK INFORMATION
            ================================================= */}

            <section className="employee-card work-information-card">
              <CardHeader
                icon={<BriefcaseBusiness size={21} />}
                title="Work Information"
                description="Assign roles to one or more stores under the selected merchant."
              />

              {/* MERCHANT */}
              <div className="employee-field work-merchant-field">
                <label>
                  Merchant <span>*</span>
                </label>

                <div className="employee-select">
                  <select
                    name="merchant"
                    value={formData.merchant}
                    onChange={handleChange}
                    className={errors.merchant ? "field-invalid" : ""}
                  >
                    <option value="">
                      {merchantLoadError ? "Unable to load merchants" : "Select merchant"}
                    </option>
                    {merchantOptions.map((merchant) => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={17} className="employee-select-arrow" />
                </div>
                {errors.merchant && (
                  <span className="field-error">{errors.merchant}</span>
                )}
              </div>

              <FormField
                label="Employee Code"
                required
                name="employeeCode"
                placeholder="e.g. EMP-1008"
                value={formData.employeeCode}
                onChange={handleChange}
                error={errors.employeeCode}
              />

              {/* EMPLOYEE LOGIN PIN */}
            </section>

            {/* =================================================
                ACCOUNT SETTINGS
            ================================================= */}

            <section className="employee-card">
              <CardHeader
                icon={<Settings size={21} />}
                title="Account Settings"
                description="Set login and access details."
              />

              <div className="employee-form-grid two-columns">
                <FormField
                  label="Username"
                  required
                  name="username"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  error={errors.username}
                />

                {/* PASSWORD */}

                <div className="employee-field">
                  <label>
                    Temporary Password <span>*</span>
                  </label>

                  <div className="password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter temporary password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className={errors.password ? "field-invalid" : ""}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="field-error">{errors.password}</span>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* =====================================================
            BOTTOM ACTION BAR
        ===================================================== */}

        <div className="employee-form-actions">
          {submitError && <span className="field-error">{submitError}</span>}
          {successMessage && (
            <span className="employee-success-message">{successMessage}</span>
          )}

          <button
            type="button"
            className="cancel-employee-btn"
            onClick={handleBack}
          >
            Cancel
          </button>

          <button type="submit" className="save-employee-btn" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   STORE + ROLE ASSIGNMENT
========================================================= */

function StoreRoleAssignment({
  assignment,
  availableStores,
  availableRoles,
  onStoreChange,
  onRolesChange,
  onRemove,
  storeError,
  roleError,
}) {
  const [open, setOpen] = useState(false);

  const toggleRole = (role) => {
    const roles = assignment.roles.includes(role)
      ? assignment.roles.filter((item) => item !== role)
      : [...assignment.roles, role];

    onRolesChange(assignment.id, roles);
  };

  return (
    <div className="store-assignment-card">
      <div className="store-assignment-info">
        <div className="store-assignment-icon">
          <BriefcaseBusiness size={20} />
        </div>

        <div className="store-assignment-name">
          <strong>Store</strong>

          <div className="store-select-inline">
            <select
              value={assignment.store}
              onChange={(event) =>
                onStoreChange(assignment.id, event.target.value)
              }
              aria-label="Select store"
              className={storeError ? "field-invalid" : ""}
            >
              <option value="">Select store</option>

              {availableStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>

            <ChevronDown size={15} />
          </div>
        </div>
      </div>

      <div className="store-role-field">
        <label>
          Role(s) <span>*</span>
        </label>

        <div className="role-multi-select-wrapper">
          <div
            className={`role-multi-select ${open ? "open" : ""} ${
              roleError ? "field-invalid" : ""
            }`}
            onClick={() => setOpen(!open)}
          >
            <span>
              {assignment.roles.length === 0
                ? "Select role(s)"
                : assignment.roles
                    .map((roleId) => availableRoles.find((role) => role.id === roleId)?.name || roleId)
                    .join(", ")}
            </span>

            <ChevronDown size={17} />
          </div>

          {open && (
            <div className="role-dropdown">
              {availableRoles.map((role) => {
                const checked = assignment.roles.includes(role.id);

                return (
                  <label key={role.id} className="role-checkbox-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role.id)}
                    />

                    <span>{role.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {roleError && <span className="field-error">{roleError}</span>}
      </div>

      <button
        type="button"
        className="remove-assignment-btn"
        onClick={() => onRemove(assignment.id)}
      >
        Remove
      </button>

      {storeError && <span className="field-error">{storeError}</span>}
    </div>
  );
}

/* =========================================================
   CARD HEADER
========================================================= */

function CardHeader({ icon, title, description }) {
  return (
    <div className="card-header">
      <div className="card-icon">{icon}</div>

      <div>
        <h2>{title}</h2>

        <p>{description}</p>
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  required,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
}) {
  return (
    <div className="employee-field">
      <label>
        {label} {required && <span>*</span>}
      </label>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={error ? "field-invalid" : ""}
      />

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  required,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
}) {
  return (
    <div className="employee-field">
      <label>
        {label} {required && <span>*</span>}
      </label>

      <div className="employee-select">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={error ? "field-invalid" : ""}
        >
          <option value="">{placeholder}</option>

          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <ChevronDown size={17} className="employee-select-arrow" />
      </div>

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}