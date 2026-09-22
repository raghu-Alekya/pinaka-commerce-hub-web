import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getMerchant } from "../api/merchants";
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

import "../styles/add-merchant-employee.css";
import "../styles/merchant-form-shared.css";


export default function AddMerchantEmployee({ onSave }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const merchantId = String(params.merchantId || searchParams.get('merchantId') || location.state?.merchantId || '');
  return <MerchantEmployeeForm key={merchantId} merchantId={merchantId} initialMerchant={location.state?.merchant} onSave={onSave} onBack={() => navigate('/merchants' + (merchantId ? '?view=' + encodeURIComponent(merchantId) : ''))} />;
}

export function MerchantEmployeeForm({ merchantId, initialMerchant, onSave, onBack, embedded = false }) {
  const [merchantDetails, setMerchantDetails] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    if (!merchantId) { setContextError('Open Add Employee from a merchant details page.'); setContextLoading(false); return; }
    let active = true;
    setContextLoading(true); setContextError('');
    const draft = initialMerchant?._onboarding;
    const request = draft && String(initialMerchant.id) === merchantId ? Promise.resolve({ merchant: initialMerchant, stores: draft.stores, roles: draft.roles }) : Promise.resolve().then(() => getMerchant(merchantId));
    request.then(result => { if (active) setMerchantDetails(result); }).catch(error => { if (active) setContextError(error.message || 'Unable to load merchant stores.'); }).finally(() => { if (active) setContextLoading(false); });
    return () => { active = false; };
  }, [merchantId, initialMerchant, loadAttempt]);
  const response = merchantDetails?.raw || merchantDetails || {};
  const raw = response.merchant || response.data?.merchant || response.data || response;
  const draft = raw._onboarding;
  const merchantName = draft?.merchant?.business || raw.businessName || raw.legalBusinessName || raw.name || initialMerchant?.name || merchantId;
  const storesSource = draft?.stores ?? response.stores ?? response.data?.stores ?? raw.stores;
  const merchantRoles = draft?.roles ?? response.roles ?? response.data?.roles ?? raw.roles ?? [];
  const availableStores = (Array.isArray(storesSource) ? storesSource : []).filter(store => store.merchantId == null || String(store.merchantId) === merchantId).map(store => ({ ...store, id: String(store.id ?? store.storeId ?? store.code ?? store.storeCode ?? ''), name: store.name || store.storeName || store.code || store.storeCode })).filter(store => store.id);
  const rolesForStore = storeId => {
    const store = availableStores.find(item => item.id === storeId);
    if (!store) return [];
    const roles = Array.isArray(store.roles) ? store.roles : Array.isArray(store.roleIds) && Array.isArray(merchantRoles) ? merchantRoles.filter(role => store.roleIds.map(String).includes(String(role.id))) : [];
    return roles.filter(role => typeof role === 'string' || String(role.status || 'ACTIVE').toUpperCase() !== 'INACTIVE').map(role => typeof role === 'string' ? role : role.name || role.roleName).filter(Boolean);
  };
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
    merchant: merchantId,
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

  const validateField = (name, value) => {
    const trimmed = typeof value === "string" ? value.trim() : value;

    switch (name) {
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
      "firstName", "lastName", "email", "phone",
      "dob", "gender",
      "address1", "city", "state", "pinCode", "country",
      "merchant", "employeeLoginPin", "username", "password"
    ];

    requiredFields.forEach((name) => {
      const error = validateField(name, formData[name]);
      if (error) nextErrors[name] = error;
    });

    if (formData.address2) {
      const error = validateField("address2", formData.address2);
      if (error) nextErrors.address2 = error;
    }

    if (storeAssignments.length === 0) {
      nextErrors.storeAssignments = "Please assign at least one store.";
    } else {
      const stores = new Set();

      storeAssignments.forEach((assignment) => {
        const storeErrorKey = `store-${assignment.id}`;
        const roleErrorKey = `roles-${assignment.id}`;

        if (!assignment.store) {
          nextErrors[storeErrorKey] = "Please select a store.";
        }

        if (assignment.store) {
          if (stores.has(assignment.store)) {
            nextErrors[storeErrorKey] = "This store is already assigned.";
          }
          stores.add(assignment.store);
        }

        if (!assignment.roles || assignment.roles.length === 0) {
          nextErrors[roleErrorKey] =
            "Please select at least one role for this store.";
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

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
        store: "",
        roles: [],
      },
    ]);
  };

  const updateStore = (id, store) => {
    setStoreAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === id ? { ...assignment, store, roles: [] } : assignment
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving || contextLoading || contextError) return;
    setSaveError('');


    if (!validateForm()) {
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector(
          ".field-invalid, .employee-phone-invalid .form-control"
        );
        firstInvalid?.focus?.();
      });
      return;
    }

    if (storeAssignments.some(assignment => !availableStores.some(store => store.id === assignment.store) || assignment.roles.some(role => !rolesForStore(assignment.store).includes(role)))) { setSaveError('Select valid stores and their assigned roles.'); return; }
    if (typeof onSave !== 'function') { setSaveError('Employee saving is not connected. Pass your employee save handler to AddMerchantEmployee.'); return; }
    setSaving(true);
    try {
      await onSave({ ...formData, merchant: merchantId, merchantId, storeAssignments: storeAssignments.map(({ store, roles }) => ({ storeId: store, roles })), profileImage });
      onBack();
    } catch (error) { setSaveError(error.message || 'Unable to save employee.'); }
    finally { setSaving(false); }
  };

  /* =========================================================
     BACK
  ========================================================= */

  const handleBack = () => {
    onBack();
  };

  return (
    <div className={embedded ? 'add-employee-page merchant-employee-embedded pch-context-form' : 'add-employee-page pch-context-form'}>



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

      <div className="pch-merchant-context" aria-label="Selected merchant"><span>Merchant</span><strong>{merchantName || merchantId}</strong><small>{merchantId}</small></div>
      {contextLoading && <p role="status">Loading merchant stores…</p>}
      {contextError && <div role="alert">{contextError} <button type="button" onClick={() => setLoadAttempt(value => value + 1)}>Retry</button></div>}
      {!contextLoading && !contextError && !availableStores.length && <p role="status">No stores available for this merchant. Add a store before creating an employee.</p>}
      {saveError && <p className="field-error" role="alert">{saveError}</p>}
      <form onSubmit={handleSave} autoComplete="off">
        <fieldset disabled={saving || contextLoading || Boolean(contextError) || !availableStores.length} className="merchant-employee-fieldset">
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
                  <div className={`employee-field employee-phone-field${errors.phone ? " employee-phone-invalid" : ""}`}>
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

                <div className="employee-form-grid two-columns">
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
                </div>
                <div className="employee-form-grid two-columns">
                  <FormField
                    label="PIN Code"
                    name="pinCode"
                    placeholder="Enter PIN code"
                    value={formData.pinCode}
                    onChange={handleChange}
                    error={errors.pinCode}
                  />
                  <SelectField
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    error={errors.country}
                    options={["India",
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
                  description="Select stores and roles under the merchant shown above."
                />

                {/* EMPLOYEE LOGIN PIN */}
                <div className="employee-login-pin-field">
                  <label>
                    Employee Login PIN <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="employeeLoginPin"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="Enter 6-digit PIN"
                    value={formData.employeeLoginPin}
                    onChange={handleChange}
                    className={errors.employeeLoginPin ? "field-invalid" : ""}
                  />

                  {errors.employeeLoginPin ? (
                    <span className="field-error">{errors.employeeLoginPin}</span>
                  ) : (
                    <span className="employee-login-pin-help">
                      Use this 6-digit PIN for employee login.
                    </span>
                  )}
                </div>

                {/* STORE + ROLE ASSIGNMENTS */}
                <div className="store-role-assignment-section">
                  <div className="store-role-heading">
                    <div>
                      <label className="store-role-label">
                        Store Role Assignments <span>*</span>
                      </label>
                      <p>Select stores and assign role(s) for each store.</p>
                    </div>
                  </div>

                  <div className="store-assignment-list">
                    {storeAssignments.map((assignment) => (
                      <StoreRoleAssignment
                        key={assignment.id}
                        assignment={assignment}
                        availableStores={availableStores}
                        availableRoles={rolesForStore(assignment.store)}
                        onStoreChange={updateStore}
                        onRolesChange={updateStoreRoles}
                        onRemove={removeStoreAssignment}
                        storeError={errors[`store-${assignment.id}`]}
                        roleError={errors[`roles-${assignment.id}`]}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="add-another-store-btn"
                    onClick={addStoreAssignment}
                    disabled={storeAssignments.length >= availableStores.length}
                  >
                    <span className="add-store-plus">+</span>
                    Add Another Store
                  </button>
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
        </fieldset>
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
            className={`role-multi-select ${open ? "open" : ""} ${roleError ? "field-invalid" : ""
              }`}
            onClick={() => setOpen(!open)}
          >
            <span>
              {assignment.roles.length === 0
                ? "Select role(s)"
                : assignment.roles.join(", ")}
            </span>

            <ChevronDown size={17} />
          </div>

          {open && (
            <div className="role-dropdown">
              {availableRoles.map((role) => {
                const checked = assignment.roles.includes(role);

                return (
                  <label key={role} className="role-checkbox-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role)}
                    />

                    <span>{role}</span>
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
    <div className="pch-form-card-header">
      <div className="pch-form-card-icon">{icon}</div>

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