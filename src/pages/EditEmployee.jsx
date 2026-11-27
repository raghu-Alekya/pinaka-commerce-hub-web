import { useLocationOptions } from "../data/useLocationOptions";

import { validatePhoneForCountry } from "../utils/phoneValidation";

import { EmployeeToast, EmployeeDeleteDialog } from "../components/EmployeeFeedback";

import React, { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";



import {

  User,

  Camera,

  BriefcaseBusiness,

  MapPin,

  Settings,

  Upload,
  Trash2,

  ChevronDown,

  ArrowLeft,

} from "lucide-react";



import PhoneInputModule from "react-phone-input-2";

const PhoneInput = PhoneInputModule.default || PhoneInputModule;

import "react-phone-input-2/lib/style.css";

import "../styles/add-employee.css";

import FilterDropdown from "../components/FilterDropdown";

import { CalendarField } from "./Merchants";

import "../styles/editemployee.css";



// import { updateEmployee } from "../api/employees";

import {

  updateEmployee,

  getEmployee,

  uploadEmployeeProfileImage,

  deleteEmployeeProfileImage,

} from "../api/employees";

function latestEligibleEmployeeDob() {
  const today = new Date();
  const date = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}



/* =========================================================

   STORE ROLE ASSIGNMENT STYLES

\========================================================= */



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



  .employee-login-pin-help {

    display: block;

    margin-top: 6px;

    color: #7b8da8;

    font-size: 12px;

  }



  .employee-api-error {

    margin-bottom: 15px;

    padding: 11px 14px;

    border: 1px solid #fecaca;

    border-radius: 8px;

    background: #fef2f2;

    color: #b91c1c;

    font-size: 13px;

  }



  .save-employee-btn:disabled {

    opacity: .6;

    cursor: not-allowed;

  }



  @media (max-width: 900px) {

    .store-assignment-card {

      grid-template-columns: minmax(0, 1fr) 36px;

    }

  }

`;



function StoreRoleAssignmentStyles() {

  return <style>{storeRoleStyles}</style>;

}



/* =========================================================

   HELPERS

\========================================================= */



function getEmployeeId(employee) {

  return (

    employee.employeeId || employee.employee_id || employee.id || employee._id

  );

}



function getEmployeeDate(value) {

  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);

}



function getEmployeePhone(...values) {

  return values

    .map((value) => String(value ?? "").trim())

    .find((phone) => phone && !["—", "-", "n/a", "null", "undefined"].includes(phone.toLowerCase())) || "";

}

function findPhoneCountry(phone, countries = [], allowBareInternational = false) {
  const raw = String(phone ?? "").trim();
  if (!allowBareInternational && !raw.startsWith("+") && !raw.startsWith("00")) return null;

  const digits = raw.replace(/\D/g, "");
  return [...countries]
    .filter((country) => country.phoneCode)
    .sort((a, b) => String(b.phoneCode).length - String(a.phoneCode).length)
    .find((country) => digits.startsWith(String(country.phoneCode).replace(/\D/g, ""))) || null;
}

function getNationalPhone(phone, dialCode, isInternational = false) {
  const raw = String(phone ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  const code = String(dialCode ?? "").replace(/\D/g, "");

  if (!digits) return "";
  if ((isInternational || raw.startsWith("+") || raw.startsWith("00")) && code && digits.startsWith(code)) {
    return digits.slice(code.length);
  }
  return digits;
}



function getPhoneInputNational(phone, dialCode) {

  const digits = String(phone ?? "").replace(/\D/g, "");

  return dialCode && digits.startsWith(dialCode) ? digits.slice(dialCode.length) : digits;

}



// Extract human-readable Business Name from Merchant Object or String

function getMerchantName(m) {

  if (!m) return "";

  if (typeof m === "string") return m;

  return (

    m.businessName ||

    m.business_name ||

    m.legalBusinessName ||

    m.legal_business_name ||

    m.name ||

    m.ownerName ||

    m.id ||

    ""

  );

}



/* =========================================================

   EDIT EMPLOYEE COMPONENT

\========================================================= */



export default function EditEmployee({ employee: employeeProp, onBack: onBackProp, onSave: onSaveProp } = {}) {

  const location = useLocation();

  const navigate = useNavigate();



  const employee =  employeeProp ||  location.state?.employee || {};

  const employeeId = useMemo(() => getEmployeeId(employee), [employee]);

  const [loadingDetails, setLoadingDetails] = useState(Boolean(employeeId));

  const [detailLoadError, setDetailLoadError] = useState(false);



  const [phoneDialCode, setPhoneDialCode] = useState("");

  const [phoneCountryIso2, setPhoneCountryIso2] = useState("");

  const [phoneCountryName, setPhoneCountryName] = useState(employee.country || "");

  const [saving, setSaving] = useState(false);

  const [apiError, setApiError] = useState("");

  const [notice, setNotice] = useState("");

  const [confirmPhotoDelete, setConfirmPhotoDelete] = useState(false);





  const [profileImage, setProfileImage] = useState(

    employee.profileImageUrl || employee.profileImage || null,

  );



  const [profileImageFile, setProfileImageFile] = useState(null);

  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  const [deletingProfileImage, setDeletingProfileImage] = useState(false);





  const [formData, setFormData] = useState({

    firstName: employee.firstName || employee.name?.split(" ")[0] || "",

    lastName:

      employee.lastName || employee.name?.split(" ").slice(1).join(" ") || "",

    email: employee.email || "",

    phone: getEmployeePhone(employee.contact_no, employee.contactNo, employee.phone, employee.phoneNumber, employee.phone_number, employee.contactNumber),

    dob: getEmployeeDate(employee.dateOfBirth || employee.dob),

    gender: employee.gender || "",

    address1: employee.addressLine1 || employee.address1 || "",

    address2: employee.addressLine2 || employee.address2 || "",

    city: employee.city || "",

    state: employee.state || "",

    pinCode: employee.postalCode || employee.pinCode || "",

    country: employee.country || "",



    // Set initial merchant to Business Name or merchant string

    merchantId:

      employee.merchantId ||

      employee.merchant_id ||

      employee.merchant?.id ||

      employee.merchant?.uuid ||

      "",



    merchant: getMerchantName(employee.merchant) || employee.merchantName || "",



    employeeLoginPin: employee.loginPin || employee.employeeLoginPin || employee.login_pin || employee.pin || "",

    manager: employee.manager || "",

    username: employee.username || employee.employeeCode || employee.id || "",

    password: "",

    status: String(employee.status || "INACTIVE").toUpperCase() === "ACTIVE" ? "Active" : "Inactive",

    sendCredentials: employee.sendCredentials ?? true,

  });

  const locationOptions = useLocationOptions(formData);



  const addressCountryRecord = locationOptions.locationRecords.find((country) => {
    const selectedCountry = String(formData.country || "").toLowerCase();
    return [country.name, country.iso2, country.iso3, country.id].some(
      (value) => String(value ?? "").toLowerCase() === selectedCountry,
    );
  });

  // Prefer the country encoded in an international phone number. Address country
  // is only a fallback and must not override a number such as +91XXXXXXXXXX.
  const manuallySelectedPhoneCountry = locationOptions.locationRecords.find(
    (country) => country.iso2?.toLowerCase() === phoneCountryIso2.toLowerCase(),
  );
  // formData.phone contains the national number after loading/editing. Never infer
  // its country from its first digits: an Indian number beginning with 974 is not Qatar.
  const selectedPhoneCountry = manuallySelectedPhoneCountry || addressCountryRecord;

  const selectedPhoneDialCode = String(selectedPhoneCountry?.phoneCode || "").replace(/\D/g, "");
  const phoneNationalNumber = getNationalPhone(formData.phone, selectedPhoneDialCode);
  const phoneInputValue = phoneNationalNumber ? `${selectedPhoneDialCode}${phoneNationalNumber}` : "";


  useEffect(() => {

    if (!employeeId || locationOptions.loading || !locationOptions.locationRecords.length) return;

    let active = true;

    getEmployee(employeeId)

      .then((response) => {

        if (!active) return;

        const savedEmployee = response?.employee || response?.data?.employee || response?.data || response || {};

        const address = savedEmployee.address || savedEmployee.businessAddress || {};

        const merchant = savedEmployee.merchant;

        const savedCountry = savedEmployee.country || address.country || employee.country || "";

        const savedCountryRecord = locationOptions.locationRecords.find(

          (country) => [country.name, country.iso2, country.iso3, country.id]

            .some((identifier) => String(identifier || "").toLowerCase() === String(savedCountry).toLowerCase()),

        );

        // contact_no is the API's international-format field (e.g. 919746473838),
        // while phone is the national number (e.g. 9746473838). Prefer contact_no.
        const internationalPhone = getEmployeePhone(
          savedEmployee.contact_no,
          savedEmployee.contactNo,
          employee.contact_no,
          employee.contactNo,
        );
        const savedPhone = internationalPhone || getEmployeePhone(
          savedEmployee.phone,
          savedEmployee.phoneNumber,
          savedEmployee.phone_number,
          savedEmployee.contactNumber,
          employee.phone,
          employee.phoneNumber,
          employee.phone_number,
          employee.contactNumber,
        );

        const savedPhoneCountryRecord = (internationalPhone
          ? findPhoneCountry(internationalPhone, locationOptions.locationRecords, true)
          : null) || savedCountryRecord;
        const savedDialCode = String(savedPhoneCountryRecord?.phoneCode || "").replace(/\D/g, "");

        setPhoneCountryIso2(savedPhoneCountryRecord?.iso2?.toLowerCase() || "");
        setProfileImage(savedEmployee.profileImageUrl || savedEmployee.profile_image_url || savedEmployee.profileImage || null);

        setFormData((current) => ({

          ...current,

          firstName: savedEmployee.firstName || savedEmployee.first_name || current.firstName,

          lastName: savedEmployee.lastName || savedEmployee.last_name || current.lastName,

          email: savedEmployee.email || current.email,

          phone: internationalPhone
            ? getNationalPhone(savedPhone, savedDialCode, true) || current.phone
            : savedPhone || current.phone,

          dob: getEmployeeDate(savedEmployee.dateOfBirth || savedEmployee.date_of_birth || savedEmployee.dob) || current.dob,

          gender: savedEmployee.gender || current.gender,

          address1: savedEmployee.addressLine1 || savedEmployee.address_line1 || savedEmployee.address_line_1 || (typeof address === "string" ? address : address.street || address.addressLine1 || "") || current.address1,

          address2: savedEmployee.addressLine2 || savedEmployee.address_line2 || savedEmployee.address_line_2 || address.addressLine2 || "",

          city: savedEmployee.city || address.city || current.city,

          state: savedEmployee.state || address.state || current.state,

          pinCode: savedEmployee.postalCode || savedEmployee.postal_code || savedEmployee.pinCode || savedEmployee.pin_code || address.zipCode || current.pinCode,

          country: savedPhoneCountryRecord?.name || savedCountryRecord?.name || savedCountry || current.country,

          merchantId: savedEmployee.merchantId || savedEmployee.merchant_id || merchant?.id || merchant?.uuid || current.merchantId,

          merchant: getMerchantName(merchant) || savedEmployee.merchantName || savedEmployee.merchant_name || current.merchant,

          employeeLoginPin: savedEmployee.loginPin || savedEmployee.employeeLoginPin || savedEmployee.login_pin || savedEmployee.pin || current.employeeLoginPin,

          username: savedEmployee.username || savedEmployee.employeeCode || savedEmployee.employee_code || current.username,

          status: String(savedEmployee.status || current.status).toUpperCase() === "ACTIVE" ? "Active" : "Inactive",

        }));

      })

      .catch((error) => {

        if (active) {

          setDetailLoadError(true);

          setNotice(error.message || "Unable to load employee details.");

        }

      })

      .finally(() => active && setLoadingDetails(false));

    return () => { active = false; };

  }, [employeeId, locationOptions.loading, locationOptions.locationRecords.length]);




  useEffect(() => {

    const country = selectedPhoneCountry;

    if (!country?.iso2 || !country?.phoneCode) return;

    const nextDialCode = String(country.phoneCode).replace(/\D/g, "");

    setPhoneDialCode(nextDialCode);

    setPhoneCountryName(country.name || "");
    setPhoneCountryIso2(country.iso2.toLowerCase());

  }, [selectedPhoneCountry?.iso2, selectedPhoneCountry?.phoneCode]);





  const [errors, setErrors] = useState({});



  /* =========================================================

     VALIDATION

  ========================================================= */



  const validateField = (name, value, country = formData.country) => {

    const trimmed = typeof value === "string" ? value.trim() : value;



    switch (name) {

      case "employeeLoginPin":

        if (!trimmed) return "";

        return /^\d{6}$/.test(trimmed) ? "" : "Employee Login PIN must be exactly 6 digits.";



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

        if (!trimmed) return "Contact Number is required.";

        return validatePhoneForCountry(trimmed, phoneCountryName || country, phoneDialCode);

      }



      case "dob":
        if (!trimmed) return "";

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

        if (trimmed && trimmed.length > 150) {

          return "Address Line 2 cannot exceed 150 characters.";

        }

        return "";



      case "city":

        if (!trimmed) return "City is required.";

        if (trimmed.length > 50) return "City cannot exceed 50 characters.";

        return "";



      case "state":

        if (!trimmed) return "State is required.";

        return "";



      case "pinCode":

        return trimmed ? "" : "Postal Code is required.";





      case "country":

        if (!trimmed) return "Country is required.";

        return "";



      case "merchant":

        if (!trimmed) return "Merchant is required.";

        return "";



      case "username":

        if (!trimmed) return "Username is required.";

        if (!/^[A-Za-z0-9_-]{4,30}$/.test(trimmed)) {

          return "Username must be 4-30 characters and use only letters, numbers, underscore, and hyphen.";

        }

        return "";



      case "status":

        return ["Active", "Inactive"].includes(value) ? "" : "Select Active or Inactive.";



      default:

        return "";

    }

  };



  const validateForm = () => {

    const nextErrors = {};



    const requiredFields = [

      "firstName",

      "lastName",

      "email",

      "phone",

      "dob",

      "gender",

      "address1",

      "city",

      "state",

      "pinCode",

      "country",

      "merchant",

      "username",

      "status",

    ];



    requiredFields.forEach((name) => {

      const error = validateField(name, formData[name]);

      if (error) nextErrors[name] = error;

    });



    if (formData.address2) {

      const error = validateField("address2", formData.address2);

      if (error) nextErrors.address2 = error;

    }



    if (formData.employeeLoginPin) {

      const error = validateField("employeeLoginPin", formData.employeeLoginPin);

      if (error) nextErrors.employeeLoginPin = error;

    }



    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;

  };



  /* =========================================================

     INPUT CHANGE HANDLERS

  ========================================================= */



  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;



    const nextValue =

      name === "employeeLoginPin"

        ? value.replace(/\D/g, "").slice(0, 6)

        : type === "checkbox"

          ? checked

          : value;



    if (name === "country") {

      const selectedCountry = locationOptions.locationRecords.find(

        (country) => country.name === nextValue,

      );

      const nextDialCode = String(selectedCountry?.phoneCode || "").replace(/\D/g, "");
      const dialCodeChanged = nextDialCode !== phoneDialCode;

      setPhoneDialCode(nextDialCode);

      setPhoneCountryName(selectedCountry?.name || nextValue);

      setPhoneCountryIso2(selectedCountry?.iso2?.toLowerCase() || "");

      setFormData((prev) => ({
        ...prev,
        country: nextValue,
        ...(dialCodeChanged ? { phone: "" } : {}),
        state: "",
        city: "",
      }));

      setErrors((prev) => ({

        ...prev,

        country: "",

        state: "",

        city: "",

        phone: validatePhoneForCountry(formData.phone, nextValue, nextDialCode),

      }));

      return;

    }



    setFormData((prev) => ({

      ...prev,

      [name]: nextValue,

      ...(name === "state" ? { city: "" } : {}),

    }));



    if (errors[name]) {

      setErrors((prev) => ({

        ...prev,

        [name]: validateField(name, nextValue),

      }));

    }

  };



  const handlePhoneChange = (value, country) => {
    const nextDialCode = String(country?.dialCode || "").replace(/\D/g, "");
    const dialCodeChanged = Boolean(phoneDialCode && nextDialCode !== phoneDialCode);
    const nationalNumber = dialCodeChanged ? "" : getPhoneInputNational(value, nextDialCode);
    const matchingCountry = locationOptions.locationRecords.find(
      (item) => item.iso2?.toLowerCase() === country?.countryCode?.toLowerCase()
    );

    setPhoneDialCode(nextDialCode);
    setPhoneCountryIso2(country?.countryCode?.toLowerCase() || matchingCountry?.iso2?.toLowerCase() || "");
    setPhoneCountryName(matchingCountry?.name || country?.name || phoneCountryName);
    setFormData((prev) => ({
      ...prev,
      phone: nationalNumber,
      ...(matchingCountry && matchingCountry.name !== prev.country
        ? { country: matchingCountry.name, state: "", city: "" }
        : {}),
    }));
    setErrors((prev) => ({
      ...prev,
      ...(matchingCountry && matchingCountry.name !== formData.country
        ? { country: "", state: "", city: "" }
        : {}),
      phone: validatePhoneForCountry(
        nationalNumber,
        matchingCountry?.name || country?.name || phoneCountryName,
        nextDialCode
      ),
    }));
  };



  /* =========================================================

     PROFILE IMAGE

  ========================================================= */



  const handleProfileUpload = async (e) => {

    const file = e.target.files?.[0];



    if (!file) return;



    if (!employeeId) {

      setNotice("Employee ID is missing.");

      e.target.value = "";

      return;

    }

    if (loadingDetails) return;



    if (!file.type.startsWith("image/")) {

      setNotice("Please select a JPG or PNG image.");

      e.target.value = "";

      return;

    }



    if (file.size > 2 * 1024 * 1024) {

      setNotice("Image size must be less than 2MB.");

      e.target.value = "";

      return;

    }



    try {

      setUploadingProfileImage(true);



      // Show selected image immediately

      const previewUrl = URL.createObjectURL(file);

      setProfileImage(previewUrl);

      setProfileImageFile(file);



      const response = await uploadEmployeeProfileImage(employeeId, file);



      console.log("Profile image upload response:", response);



      const uploadedImageUrl =

        response?.profileImageUrl ||

        response?.employee?.profileImageUrl ||

        null;



      if (!uploadedImageUrl || response?.success === false) {

        throw new Error(response?.message || "The server did not return a saved profile image.");

      }

      setProfileImage(uploadedImageUrl);



      setProfileImageFile(null);



      setNotice("Profile photo updated successfully.");

    } catch (error) {

      console.error("Profile image upload failed:", error);



      // Restore the previous image if upload failed

      setProfileImage(

        employee.profileImageUrl || employee.profileImage || null,

      );



      setProfileImageFile(null);



      const message =

        error?.response?.data?.message ||

        error?.response?.data?.error ||

        error?.message ||

        "Failed to upload profile photo.";



      setNotice(Array.isArray(message) ? message.join(", ") : String(message));

    } finally {

      setUploadingProfileImage(false);

      e.target.value = "";

    }

  };



  useEffect(() => {

    return () => {

      if (profileImage && profileImage.startsWith("blob:")) {

        URL.revokeObjectURL(profileImage);

      }

    };

  }, [profileImage]);

  const handleDeleteProfileImage = async () => {

    if (!employeeId || !profileImage) return;



    setConfirmPhotoDelete(false);



    try {

      setDeletingProfileImage(true);



      await deleteEmployeeProfileImage(employeeId);



      setProfileImage(null);

      setProfileImageFile(null);



      setNotice("Profile photo deleted successfully.");

    } catch (error) {

      console.error("Delete profile image failed:", error);



      const message =

        error?.response?.data?.message ||

        error?.response?.data?.error ||

        error?.message ||

        "Failed to delete profile photo.";



      setNotice(Array.isArray(message) ? message.join(", ") : String(message));

    } finally {

      setDeletingProfileImage(false);

    }

  };

  /* =========================================================

     UPDATE EMPLOYEE API CALL

  ========================================================= */



  const handleSave = async (e) => {

    e.preventDefault();

    setApiError("");



    if (!employeeId) {

      setApiError(

        "Employee ID is missing. Please return to the Employees list and try again.",

      );

      return;

    }

    if (loadingDetails) return;

    if (detailLoadError) {

      setApiError("Employee details could not be loaded. Refresh the page before saving changes.");

      return;

    }



    if (!validateForm()) {

      requestAnimationFrame(() => {

        const firstInvalid = document.querySelector(

          ".field-invalid, .employee-phone-invalid .form-control",

        );

        firstInvalid?.focus?.();

      });

      return;

    }



    setSaving(true);



    try {

       const response = await updateEmployee(employeeId, formData);

      console.log("Employee update response:", response);



      if (onSaveProp) {

        await onSaveProp(response);

      } else {

        navigate("/employees", { state: { employeeMessage: "Employee updated successfully." } });

      }

    } catch (error) {

      console.error("Update employee failed:", error);



      const message =

        error?.response?.data?.message ||

        error?.response?.data?.error ||

        error?.message ||

        "Failed to update employee. Please try again.";



      setApiError(

        Array.isArray(message) ? message.join(", ") : String(message),

      );

    } finally {

      setSaving(false);

    }

  };



  const handleBack = () => {

    if (onBackProp) onBackProp();

    else navigate("/employees");

  };





  return (

    <div className={`add-employee-page edit-employee-page${employeeProp ? " merchant-employee-edit" : ""}`}>

      <StoreRoleAssignmentStyles />



      {!employeeProp && <header className="sf-topbar add-employee-topbar">

        <button type="button" className="sf-back-link" onClick={handleBack}>

          <i className="bi bi-arrow-left" aria-hidden="true" /> Employees

        </button>

        <span>/</span>

        <strong>Edit Employee</strong>

        <span className="sf-topbar-spacer" />

      </header>}



      {/* PAGE HEADER */}

      <div className="add-employee-header">

        <div>

          <h1>Edit Employee</h1>

          {employeeProp ? (

            <div className="add-employee-breadcrumb">

              <span>Home</span>

              <span className="breadcrumb-arrow">›</span>

              <span>Employees</span>

              <span className="breadcrumb-arrow">›</span>

              <strong>Edit Employee</strong>

            </div>

          ) : (

            <p>Update employee information, access, and settings.</p>

          )}

        </div>

        {employeeProp && (

          <button

            type="button"

            className="back-employees-btn"

            onClick={handleBack}

          >

            <ArrowLeft size={17} />

            {onBackProp ? "Back to Merchant Employees" : "Back to Employees"}

          </button>

        )}

      </div>



      {/* API ERROR BANNER */}

      <EmployeeToast message={notice || apiError} onClose={() => { setNotice(""); setApiError(""); }} />

      {loadingDetails && <p className="employee-api-error" role="status">Loading employee details…</p>}

      {confirmPhotoDelete && <EmployeeDeleteDialog title="Delete Profile Photo?" description="Are you sure you want to remove this employee’s profile photo?" busy={deletingProfileImage} onCancel={() => setConfirmPhotoDelete(false)} onConfirm={handleDeleteProfileImage} />}



      {/* FORM */}

      <form id="edit-employee-form" onSubmit={handleSave} autoComplete="off" noValidate>

          <div className="add-employee-layout">

          {/* LEFT COLUMN */}

          <div className="add-employee-left">

            {/* PERSONAL INFORMATION */}

            <section className="employee-card employee-personal-card">

              <CardHeader

                icon={<User size={21} />}

                title="Personal Information"

                theme="blue"

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

                    Contact Number <span className="text-red-500">*</span>

                  </label>

                  <PhoneInput
                    key={`${employeeId || "new"}-${selectedPhoneCountry?.iso2?.toLowerCase() || "in"}`}
                    country={selectedPhoneCountry?.iso2?.toLowerCase() || "in"}
                    disableCountryGuess
                    enableSearch
                    countryCodeEditable={false}
                    autoFormat
                    placeholder="Enter phone number"
                    value={phoneInputValue}
                    onChange={handlePhoneChange}
                  />



                  {errors.phone && (

                    <span className="field-error">{errors.phone}</span>

                  )}

                </div>



                {/* DATE OF BIRTH */}

                <div className="employee-field">

                  <label>

                    Date of Birth

                  </label>



                  <CalendarField value={formData.dob} onChange={(dob) => {
                    setFormData((current) => ({ ...current, dob }));
                    setErrors((current) => ({ ...current, dob: "" }));
                  }} label="Date of Birth" max={latestEligibleEmployeeDob()} showLabel={false} invalid={Boolean(errors.dob)} allowManualEntry yearMonthSelect />



                  {errors.dob && (

                    <span className="field-error">{errors.dob}</span>

                  )}

                </div>



                {/* GENDER */}

                <SelectField

                  label="Gender"

                  required

                  name="gender"

                  value={formData.gender}

                  onChange={handleChange}

                  error={errors.gender}

                  placeholder="Select gender"

                  options={["Male", "Female", "Other"]}

                />

              </div>

            </section>



            {/* ADDRESS */}

            <section className="employee-card employee-address-card">

              <CardHeader

                icon={<MapPin size={21} />}

                title="Address"

                theme="amber"

                description="Enter the employee's address details."

              />



              {locationOptions.error && <p role="alert" className="field-error">{locationOptions.error}</p>}

              <div className="employee-form-grid two-columns" style={{ columnGap: "28px", rowGap: "18px", marginTop: "24px" }}>

                <FormField label="Country" required name="country"

                  value={selectedPhoneCountry?.name || formData.country} onChange={handleChange}
                  error={errors.country} disabled />

                <SelectField label="State" required name="state" value={formData.state}

                  onChange={handleChange} error={errors.state} options={locationOptions.states}

                  placeholder={formData.country ? "Select state" : "Select country first"} disabled={locationOptions.loading || !formData.country} searchable />

                <FormField label="City" required name="city" placeholder="Enter city"

                  value={formData.city} onChange={handleChange} error={errors.city} />

                <FormField

                  label="Address Line 1"

                  required

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

                <FormField label="Postal Code" required name="pinCode" placeholder="Enter postal code"

                  value={formData.pinCode} onChange={handleChange} error={errors.pinCode} />

              </div>

            </section>

          </div>



          {/* RIGHT COLUMN */}

          <div className="add-employee-right">

            {/* PROFILE PHOTO */}

            <section className="employee-card profile-photo-card">

              <CardHeader

                icon={<Camera size={21} />}

                title="Profile Photo"

                theme="purple"

                description="Upload a profile photo for the employee."

              />



              <div className="profile-upload-area">

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



                <div>

                  <button

                    type="button"

                    className="upload-photo-btn"

                    onClick={() =>

                      document.getElementById("employee-photo").click()

                    }

                  >

                    <Upload size={17} />

                    {uploadingProfileImage ? "Uploading…" : profileImage ? "Change Photo" : "Upload Photo"}

                  </button>

                  {profileImage && <button type="button" className="profile-photo-delete-btn" onClick={() => setConfirmPhotoDelete(true)} disabled={uploadingProfileImage || deletingProfileImage} aria-label="Delete profile photo" title="Delete profile photo"><Trash2 size={17} /></button>}



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



            {/* WORK INFORMATION */}

            <section className="employee-card work-information-card">

              <CardHeader

                icon={<BriefcaseBusiness size={21} />}

                title="Work Information"

                theme="teal"

                description="Assign roles to one or more stores under the selected merchant."

              />



              <div className="employee-field">

                <label htmlFor="employee-code">Employee Code</label>

                <input id="employee-code" name="employeeCode" value={employee.employeeCode || employee.employee_code || ""} readOnly />

              </div>



              <div style={{ marginTop: "12px" }}>

                <SelectField

                  label="Status"

                  required

                  name="status"

                  value={formData.status}

                  onChange={handleChange}

                  options={["Active", "Inactive"]}

                  error={errors.status}

                />

              </div>



              {/* DYNAMIC MERCHANT DROPDOWN */}

              {/* MERCHANT - DISPLAY ONLY */}

              <div className="employee-field work-merchant-field">

                <label>

                  Merchant <span>*</span>

                </label>



                <input

                  type="text"

                  name="merchant"

                  value={formData.merchant}

                  readOnly

                  className="merchant-readonly-field"

                />

              </div>

            </section>



            {/* ACCOUNT SETTINGS */}

            <section className="employee-card employee-account-settings-card">

              <CardHeader

                icon={<Settings size={21} />}

                title="Account Settings"

                theme="purple"

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



                <div className="employee-field">

                  <label htmlFor="employee-temporary-password">Temporary Password</label>

                  <div className="password-input">

                    <input

                      id="employee-temporary-password"

                      name="password"

                      type="text"

                      placeholder="Enter a new temporary password"

                      value={formData.password}

                      onChange={handleChange}

                      autoComplete="new-password"

                      spellCheck={false}

                      autoCapitalize="none"

                    />

                  </div>

                  <small className="employee-password-help">

                    Leave blank to keep the current password. New passwords must be at least 8 characters.

                  </small>

                </div>



                <div className="employee-login-pin-field">

                  <label htmlFor="edit-employee-login-pin">Employee Login PIN</label>

                  <input

                    id="edit-employee-login-pin"

                    name="employeeLoginPin"

                    type="text"

                    inputMode="numeric"

                    maxLength={6}

                    value={formData.employeeLoginPin}

                    onChange={handleChange}

                    placeholder="Enter 6-digit PIN"

                  />

                  <small className="employee-login-pin-help">PIN is shown openly. Enter 6 digits to update it.</small>

                  {errors.employeeLoginPin && <span className="field-error">{errors.employeeLoginPin}</span>}

                </div>

              </div>

            </section>

          </div>

        </div>

      </form>



      {/* BOTTOM ACTION BAR */}

      {!employeeProp && (

        <div className="employee-form-actions">

        <button

          type="button"

          className="cancel-employee-btn"

          onClick={handleBack}

          disabled={saving || loadingDetails || detailLoadError}

        >

          Cancel

        </button>



        <button

          type="submit"

          form="edit-employee-form"

          className="save-employee-btn"

          disabled={saving || loadingDetails || detailLoadError}

        >

          {saving ? "Updating..." : "Save Changes"}

        </button>

        </div>

      )}

      {employeeProp && (

        <div className="employee-form-actions">

          <button

            type="button"

            className="cancel-employee-btn"

            onClick={handleBack}

            disabled={saving || loadingDetails || detailLoadError}

          >

            Cancel

          </button>



          <button type="submit" form="edit-employee-form" className="save-employee-btn" disabled={saving || loadingDetails || detailLoadError}>

            {saving ? "Updating..." : "Update Employee"}

          </button>

        </div>

      )}

    </div>

  );

}



/* =========================================================

   CARD HEADER COMPONENT

\========================================================= */



function CardHeader({ icon, title, description, theme }) {

  return (

    <div className={`employee-card-header employee-card-header-${theme}`}>

      <div className="employee-card-icon">{icon}</div>



      <div>

        <h2>{title}</h2>

        <p>{description}</p>

      </div>

    </div>

  );

}



/* =========================================================

   INPUT FIELD COMPONENT

\========================================================= */



function FormField({

  label,

  required,

  name,

  type = "text",

  placeholder,

  value,

  onChange,

  error,

  disabled = false,

}) {

  return (

    <div className="employee-field">

      <label>

        {label}

        {required && <span className="text-red-500">*</span>}

      </label>



      <input

        type={type}

        name={name}

        placeholder={placeholder}

        value={value}

        onChange={onChange}

        disabled={disabled}

        autoComplete={name === "username" ? "off" : undefined}

        className={error ? "field-invalid" : ""}

      />



      {error && <span className="field-error">{error}</span>}

    </div>

  );

}



/* =========================================================

   SELECT FIELD COMPONENT

\========================================================= */



function SelectField({

  label,

  required,

  name,

  value,

  onChange,

  placeholder,

  options = [],

  error,

  disabled = false,

  searchable = false,

  className = "",

}) {

  const safeOptions = Array.isArray(options) ? options : [];

  return (

    <div className={`employee-field ${className}`.trim()}>

      <label>

        {label}

        {required && <span className="text-red-500">*</span>}

      </label>



      <div className="employee-select">

        <FilterDropdown

          name={name}

          disabled={disabled}

          searchable={searchable}

          value={value || ""}

          onChange={onChange}

          className={`${error ? "field-invalid" : ""}${!value ? " employee-select-placeholder" : ""}`}

        >

          <option value="">{placeholder}</option>



          {safeOptions.map((opt) => {

            const optVal =

              typeof opt === "object" && opt !== null

                ? (opt.value ?? opt.name ?? opt.id)

                : opt;

            const optLabel =

              typeof opt === "object" && opt !== null

                ? (opt.label ?? opt.name ?? opt.value)

                : opt;

            return (

              <option key={optVal} value={optVal}>

                {optLabel}

              </option>

            );

          })}

        </FilterDropdown>

      </div>



      {error && <span className="field-error">{error}</span>}

    </div>

  );

}
