import React, { useEffect, useState } from "react";

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

export default function AddEmployee() {
  const [showPassword, setShowPassword] = useState(false);

  // Profile image preview
  const [profileImage, setProfileImage] = useState(null);

  const [formData, setFormData] = useState({
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
    manager: "",
    username: "",
    password: "",
    sendCredentials: true,
  });

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    const imageUrl = URL.createObjectURL(file);

    setProfileImage(imageUrl);
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

  const handleSave = (e) => {
    e.preventDefault();

    console.log("Employee details:", formData);

    console.log("Profile image:", profileImage);

    alert("Employee saved successfully");
  };

  /* =========================================================
     BACK
  ========================================================= */

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="add-employee-page">
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

      <form onSubmit={handleSave}>
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
                />

                <FormField
                  label="Last Name"
                  required
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />

                <FormField
                  label="Email Address"
                  required
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
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

                {/* DATE OF BIRTH */}

                <div className="employee-field">
                  <label>Date of Birth</label>

                  <div className="input-with-icon">
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                    />

                    <CalendarDays size={17} />
                  </div>
                </div>

                {/* GENDER */}

                <SelectField
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
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
                />

                <FormField
                  label="Address Line 2"
                  name="address2"
                  placeholder="Enter address line 2 (optional)"
                  value={formData.address2}
                  onChange={handleChange}
                />
              </div>

              <div className="employee-form-grid three-columns">
                <FormField
                  label="City"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                />

                <SelectField
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
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
                />
              </div>

              <div className="country-field">
                <SelectField
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
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

            <section className="employee-card">
              <CardHeader
                icon={<BriefcaseBusiness size={21} />}
                title="Work Information"
                description="Assign role, merchant and store for the employee."
              />

              <div className="employee-form-grid two-columns">
                <SelectField
                  label="Role"
                  required
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="Select role"
                  options={[
                    "Admin",
                    "Store Manager",
                    "Cashier",
                    "Sales Associate",
                  ]}
                />

                <SelectField
                  label="Merchant"
                  required
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
                />

                <SelectField
                  label="Store"
                  required
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
                />

                <SelectField
                  label="Reporting Manager"
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                  placeholder="Select manager (optional)"
                  options={["Santhosh Kumar", "Priya Desai", "Arjun Reddy"]}
                />
              </div>
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
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* =====================================================
            BOTTOM ACTION BAR
        ===================================================== */}

        <div className="employee-form-actions">
          <button
            type="button"
            className="cancel-employee-btn"
            onClick={handleBack}
          >
            Cancel
          </button>

          <button type="submit" className="save-employee-btn">
            Save Employee
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   CARD HEADER
========================================================= */

function CardHeader({ icon, title, description }) {
  return (
    <div className="employee-card-header">
      <div className="employee-card-icon">{icon}</div>

      <div>
        <h2>{title}</h2>

        <p>{description}</p>
      </div>
    </div>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function FormField({
  label,
  required,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="employee-field">
      <label>
        {label}

        {required && <span> *</span>}
      </label>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
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
  placeholder,
  options = [],
}) {
  return (
    <div className="employee-field">
      <label>
        {label}

        {required && <span> *</span>}
      </label>

      <div className="employee-select">
        <select name={name} value={value} onChange={onChange}>
          {!value && <option value="">{placeholder}</option>}

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown size={17} className="employee-select-arrow" />
      </div>
    </div>
  );
}
