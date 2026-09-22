import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor as deleteVendorApi,
} from "../api/vendors";

const emptyForm = {
  name: "",
  code: "",
  vendorType: "Supplier",
  contactPerson: "",
  phone: "",
  email: "",
  category: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  status: "Active",
};

/*
|--------------------------------------------------------------------------
| VENDOR TYPE HELPERS
|--------------------------------------------------------------------------
*/

function getVendorTypeLabel(vendorType) {
  const type = String(
    vendorType || ""
  ).toUpperCase();

  if (
    type === "ORGANIZER" ||
    type === "ORGANIZATION"
  ) {
    return "Organizer";
  }

  if (
    type === "SUPPLIER" ||
    type === "INDIVIDUAL"
  ) {
    return "Supplier";
  }

  return vendorType || "—";
}

function getVendorTypeApiValue(
  vendorType
) {
  return vendorType === "Organizer"
    ? "ORGANIZER"
    : "SUPPLIER";
}

function normalizeVendorType(
  vendorType
) {
  const type = String(
    vendorType || ""
  ).toUpperCase();

  if (
    type === "ORGANIZER" ||
    type === "ORGANIZATION"
  ) {
    return "Organizer";
  }

  return "Supplier";
}

/*
|--------------------------------------------------------------------------
| TABLE VALUE HELPER
|--------------------------------------------------------------------------
*/

function VendorCell({ value, strong = false }) {
  const displayValue =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return strong ? (
    <strong className="vendors-cell-value">
      {displayValue}
    </strong>
  ) : (
    <span className="vendors-cell-value">
      {displayValue}
    </span>
  );
}

function formatAuditDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: String(value),
      time: "",
    };
  }

  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function VendorAuditCell({ value }) {
  const formatted = formatAuditDate(value);

  if (!formatted) {
    return <span className="vendors-cell-value">—</span>;
  }

  return (
    <span className="vendors-audit-cell">
      <span className="vendors-audit-date">
        {formatted.date}
      </span>
      {formatted.time && (
        <span className="vendors-audit-time">
          {formatted.time}
        </span>
      )}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function Vendors({
  merchantId,
  storeId,
  store,
  embedded = false,
}) {
  const [vendors, setVendors] =
    useState([]);

  const [form, setForm] =
    useState(emptyForm);

  // Keeps the last saved values while editing so the Update button
  // remains disabled until the user actually changes a field.
  const [originalForm, setOriginalForm] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [
    vendorTypeFilter,
    setVendorTypeFilter,
  ] = useState("All Vendor Types");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [hoveredCell, setHoveredCell] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD VENDORS
  |--------------------------------------------------------------------------
  */

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getVendors();

      setVendors(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load vendors:",
        err
      );

      setError(
        err?.message ||
          "Failed to load vendors."
      );

      setVendors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER VENDORS
  |--------------------------------------------------------------------------
  */

  const filteredVendors =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return vendors.filter(
        (vendor) => {
          const searchableText = [
            vendor.name,
            vendor.code,
            vendor.vendorType,
            getVendorTypeLabel(
              vendor.vendorType
            ),
            vendor.contactPerson,
            vendor.phone,
            vendor.email,
            vendor.category,
            vendor.addressLine1,
            vendor.addressLine2,
            vendor.city,
            vendor.state,
            vendor.zipCode,
            vendor.country,
            vendor.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            searchableText.includes(
              query
            );

          const matchesStatus =
            statusFilter ===
              "All Statuses" ||
            vendor.status ===
              statusFilter;

          const matchesVendorType =
            vendorTypeFilter ===
              "All Vendor Types" ||
            getVendorTypeLabel(
              vendor.vendorType
            ) ===
              vendorTypeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesVendorType
          );
        }
      );
    }, [
      vendors,
      search,
      statusFilter,
      vendorTypeFilter,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FORM CHANGE
  |--------------------------------------------------------------------------
  */

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [name]: value,
      };

      /*
      |--------------------------------------------------------------------------
      | PHONE NUMBER
      |--------------------------------------------------------------------------
      | Only numbers
      | Maximum 10 digits
      |--------------------------------------------------------------------------
      */

      if (name === "phone") {
        updated.phone = value
          .replace(/\D/g, "")
          .slice(0, 10);
      }

      /*
      |--------------------------------------------------------------------------
      | SUPPLIER
      |--------------------------------------------------------------------------
      | Supplier does not need Contact Person
      |--------------------------------------------------------------------------
      */

      if (
        name === "vendorType" &&
        value === "Supplier"
      ) {
        updated.contactPerson = "";
      }

      return updated;
    });
  }

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  function resetForm() {
    setForm({
      ...emptyForm,
    });

    setEditingId(null);
    setOriginalForm({
      ...emptyForm,
    });
    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | BUILD API PAYLOAD
  |--------------------------------------------------------------------------
  */

  function buildPayload() {
    return {
      vendorName:
        form.name.trim(),

      vendorCode:
        form.code
          .trim()
          .toUpperCase(),

      vendorType:
        getVendorTypeApiValue(
          form.vendorType
        ),

      contactPerson:
        form.vendorType ===
        "Organizer"
          ? form.contactPerson.trim()
          : "",

      phone:
        form.phone.trim(),

      email:
        form.email.trim(),

      productCategory:
        form.category.trim(),

      addressLine1:
        form.addressLine1.trim(),

      addressLine2:
        form.addressLine2.trim(),

      city:
        form.city.trim(),

      state:
        form.state.trim(),

      zipCode:
        form.zipCode.trim(),

      country:
        form.country.trim(),

      status:
        editingId !== null
          ? form.status
          : "Active",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | FORM COMPLETION
  |--------------------------------------------------------------------------
  | Keep the primary action disabled until all required data is entered.
  |--------------------------------------------------------------------------
  */

  const isVendorCodeValid =
    /^(?=.{3,30}$)[A-Za-z0-9_]+$/.test(
      form.code.trim()
    );

  const isFormComplete =
    Boolean(
      form.code.trim() &&
      form.name.trim() &&
      form.vendorType &&
      form.phone.trim() &&
      form.email.trim() &&
      form.category.trim() &&
      form.addressLine1.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.zipCode.trim() &&
      form.country.trim() &&
      (form.vendorType !== "Organizer" ||
        form.contactPerson.trim())
    ) &&
    isVendorCodeValid &&
    /^\d{10}$/.test(form.phone.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.email.trim()
    );

  const isEditDirty =
    editingId !== null &&
    JSON.stringify(form) !==
      JSON.stringify(originalForm);

  /*
  |--------------------------------------------------------------------------
  | SAVE VENDOR
  |--------------------------------------------------------------------------
  */

  async function saveVendor(event) {
    event.preventDefault();

    setError("");

    /*
    |--------------------------------------------------------------------------
    | BASIC REQUIRED VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.vendorType ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.category.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.zipCode.trim() ||
      !form.country.trim()
    ) {
      setError(
        "Please fill all mandatory fields. Address Line 2 is optional."
      );

      return;
    }

    if (!isVendorCodeValid) {
      setError(
        "Vendor Code must be 3–30 characters and contain only letters, numbers, or underscores. No spaces."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | ORGANIZER CONTACT PERSON VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      form.vendorType ===
        "Organizer" &&
      !form.contactPerson.trim()
    ) {
      setError(
        "Contact Person Name is required for an Organizer."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | PHONE REQUIRED
    |--------------------------------------------------------------------------
    */

    if (!form.phone.trim()) {
      setError(
        "Phone Number is required."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | PHONE 10 DIGIT VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !/^\d{10}$/.test(
        form.phone
      )
    ) {
      setError(
        "Phone Number must contain exactly 10 digits."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | EMAIL REQUIRED
    |--------------------------------------------------------------------------
    */

    if (!form.email.trim()) {
      setError(
        "Email is required."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | EMAIL FORMAT VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    try {
      setSaving(true);

      const payload =
        buildPayload();

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */

      if (
        editingId !== null
      ) {
        const updatedVendor =
          await updateVendor(
            editingId,
            payload
          );

        setVendors(
          (current) =>
            current.map(
              (vendor) =>
                String(
                  vendor.id
                ) ===
                String(
                  editingId
                )
                  ? updatedVendor
                  : vendor
            )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */

      else {
        const newVendor =
          await createVendor(
            payload
          );

        setVendors(
          (current) => [
            newVendor,
            ...current,
          ]
        );
      }

      resetForm();
    } catch (err) {
      console.error(
        "Failed to save vendor:",
        err
      );

      setError(
        err?.message ||
          "Failed to save vendor."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | EDIT VENDOR
  |--------------------------------------------------------------------------
  */

  function editVendor(
    vendor
  ) {
    const editForm = {
      name:
        vendor.name || "",

      code:
        vendor.code || "",

      vendorType:
        normalizeVendorType(
          vendor.vendorType
        ),

      contactPerson:
        vendor.contactPerson ||
        "",

      phone:
        vendor.phone || "",

      email:
        vendor.email || "",

      category:
        vendor.category || "",

      addressLine1:
        vendor.addressLine1 ||
        "",

      addressLine2:
        vendor.addressLine2 ||
        "",

      city:
        vendor.city || "",

      state:
        vendor.state ||
        "",

      zipCode:
        vendor.zipCode ||
        "",

      country:
        vendor.country ||
        "",

      status:
        vendor.status ||
        "Active",
    };

    setEditingId(
      vendor.id
    );

    setForm(editForm);
    setOriginalForm(editForm);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | OPEN DELETE POPUP
  |--------------------------------------------------------------------------
  */

  function confirmDelete(
    vendor
  ) {
    setDeleteTarget(
      vendor
    );

    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE VENDOR
  |--------------------------------------------------------------------------
  */

  async function handleDeleteVendor() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteVendorApi(
        deleteTarget.id
      );

      setVendors(
        (current) =>
          current.filter(
            (vendor) =>
              String(
                vendor.id
              ) !==
              String(
                deleteTarget.id
              )
          )
      );

      setDeleteTarget(
        null
      );
    } catch (err) {
      console.error(
        "Failed to delete vendor:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete vendor."
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CLEAR FILTERS
  |--------------------------------------------------------------------------
  */

  function clearFilters() {
    setSearch("");

    setStatusFilter(
      "All Statuses"
    );

    setVendorTypeFilter(
      "All Vendor Types"
    );
  }

  function showCellTooltip(event, value) {
    if (!value || value === "—") {
      setHoveredCell(null);
      return;
    }

    const valueElement =
      event.currentTarget.querySelector(
        ".vendors-cell-value"
      );

    // Show the full value only when the visible cell
    // is actually truncated.
    if (
      !valueElement ||
      valueElement.scrollWidth <=
        valueElement.clientWidth
    ) {
      setHoveredCell(null);
      return;
    }

    const rect =
      valueElement.getBoundingClientRect();

    setHoveredCell({
      value: String(value),
      left: rect.left + rect.width / 2,
      top: rect.top - 8,
    });
  }

  function hideCellTooltip() {
    setHoveredCell(null);
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section className="vendors-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="vendors-header">
        <div>
          <h1>
            Vendors
          </h1>

          <p>
            Manage supplier contacts,
            categories, and vendor
            information.
          </p>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="vendors-error">
          <i className="bi bi-exclamation-circle" />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Close error"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {/* =====================================================
          VENDOR FORM
      ===================================================== */}

      <form
        className="vendors-form"
        onSubmit={saveVendor}
        autoComplete="off"
      >

        <div className="vendors-form-heading">

          <div className="vendors-heading-content">

            <div className="vendors-heading-icon">
              <i className="bi bi-truck" />
            </div>

            <div>
              <h2>
                {editingId !== null
                  ? "Edit Vendor Details"
                  : "Add Vendor Details"}
              </h2>

              <p>
                Provide the vendor and
                business details.
              </p>
            </div>

          </div>

          {editingId !== null && (
            <button
              type="button"
              className="vendors-link-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel Edit
            </button>
          )}

        </div>

        {/* ===================================================
            FORM FIELDS
        =================================================== */}

        <div className="vendors-form-grid">

          {/* =================================================
              VENDOR CODE
          ================================================= */}

          <label>
            <span>
              Vendor Code <b>*</b>
            </span>

            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Enter vendor code"
              autoComplete="off"
              maxLength={30}
              required
              disabled={saving}
              aria-invalid={
                Boolean(form.code) &&
                !isVendorCodeValid
              }
            />

            {form.code && !isVendorCodeValid ? (
              <small className="vendors-field-error">
                Use 3–30 characters. Letters, numbers, and underscores only. No spaces.
              </small>
            ) : (
              <small className="vendors-field-hint">
                Use 3–30 characters. Letters, numbers, and underscores only. No spaces.
              </small>
            )}
          </label>

          {/* =================================================
              VENDOR NAME
          ================================================= */}

          <label>
            <span>
              Vendor Name <b>*</b>
            </span>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter vendor name"
              autoComplete="off"
              required
              disabled={saving}
            />

            <small className="vendors-field-hint">
              Display name for the vendor.
            </small>
          </label>

          {/* =================================================
              VENDOR TYPE
          ================================================= */}

          <label>
            <span>
              Vendor Type <b>*</b>
            </span>

            <select
              name="vendorType"
              value={
                form.vendorType
              }
              onChange={handleChange}
              required
              disabled={saving}
            >
              <option value="Supplier">
                Supplier
              </option>

              <option value="Organizer">
                Organizer
              </option>
            </select>
          </label>

          {/* =================================================
              CONTACT PERSON
          ================================================= */}

          {form.vendorType ===
            "Organizer" && (
            <label>
              <span>
                Contact Person Name{" "}
                <b>*</b>
              </span>

              <input
                type="text"
                name="contactPerson"
                value={
                  form.contactPerson
                }
                onChange={
                  handleChange
                }
                autoComplete="off"
                required
                disabled={saving}
              />
            </label>
          )}

          {/* =================================================
              PHONE
          ================================================= */}

          <label>
            <span>
              Phone Number <b>*</b>
            </span>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              autoComplete="off"
              required
              disabled={saving}
              aria-invalid={
                Boolean(form.phone) &&
                !/^\d{10}$/.test(form.phone)
              }
            />

            {form.phone && !/^\d{10}$/.test(form.phone) ? (
              <small className="vendors-field-error">
                Phone Number must contain exactly 10 digits.
              </small>
            ) : (
              <small className="vendors-field-hint">
                Enter a 10-digit phone number.
              </small>
            )}
          </label>

          {/* =================================================
              EMAIL
          ================================================= */}

          <label>
            <span>
              Email <b>*</b>
            </span>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="off"
              required
              disabled={saving}
              aria-invalid={
                Boolean(form.email) &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                  form.email.trim()
                )
              }
            />

            {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? (
              <small className="vendors-field-error">
                Please enter a valid email address.
              </small>
            ) : (
              <small className="vendors-field-hint">
                Use a valid business email address.
              </small>
            )}
          </label>

          {/* =================================================
              PRODUCT / CATEGORY
          ================================================= */}

          <label>
            <span>
              Product <b>*</b>
            </span>

            <input
              type="text"
              name="category"
              value={
                form.category
              }
              onChange={handleChange}
              autoComplete="off"
              required
              disabled={saving}
            />
          </label>

          {/* =================================================
              ADDRESS LINE 1
          ================================================= */}

          <label>
            <span>
              Address Line 1 <b>*</b>
            </span>

            <input
              type="text"
              name="addressLine1"
              value={
                form.addressLine1
              }
              onChange={handleChange}
              placeholder="Enter street address"
              autoComplete="off"
              required
              disabled={saving}
            />
          </label>

          {/* =================================================
              ADDRESS LINE 2
          ================================================= */}

          <label>
            <span>
              Address Line 2
            </span>

            <input
              type="text"
              name="addressLine2"
              value={
                form.addressLine2
              }
              onChange={handleChange}
              placeholder="Apartment, suite, unit"
              autoComplete="off"
              disabled={saving}
            />
          </label>

          {/* =================================================
              CITY
          ================================================= */}

          <label>
            <span>
              City <b>*</b>
            </span>

            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              autoComplete="off"
              required
              disabled={saving}
            />
          </label>

          {/* =================================================
              STATE
          ================================================= */}

          <label>
            <span>
              State <b>*</b>
            </span>

            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              autoComplete="off"
              required
              disabled={saving}
            />
          </label>

          {/* =================================================
              ZIP CODE
          ================================================= */}

          <label>
            <span>
              ZIP Code <b>*</b>
            </span>

            <input
              type="text"
              name="zipCode"
              value={
                form.zipCode
              }
              onChange={handleChange}
              autoComplete="off"
              required
              disabled={saving}
            />
          </label>

          {/* =================================================
              COUNTRY
          ================================================= */}

          <label>
            <span>
              Country <b>*</b>
            </span>

            <input
              type="text"
              name="country"
              value={
                form.country
              }
              onChange={handleChange}
              autoComplete="off"
              required
              disabled={saving}
            />
          </label>

          {/* =================================================
              STATUS
          ================================================= */}

          {editingId !== null && (
            <label>
              <span>
                Status <b>*</b>
              </span>

              <select
                name="status"
                className={`vendors-status-select ${
                  String(form.status || "active").toLowerCase()
                }`}
                value={
                  form.status
                }
                onChange={handleChange}
                required
                disabled={saving}
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </label>
          )}

        </div>

        {/* ===================================================
            FORM ACTIONS
        =================================================== */}

        <div className="vendors-form-actions">

          <button
            type="button"
            className="vendors-clear-button"
            onClick={resetForm}
            disabled={saving}
          >
            Clear
          </button>

          <button
            type="submit"
            className="vendors-save-button"
            disabled={
              saving ||
              !isFormComplete ||
              (editingId !== null && !isEditDirty)
            }
          >
            {saving ? (
              <>
                <i className="bi bi-arrow-repeat vendors-loading-icon" />

                {editingId !== null
                  ? "Saving..."
                  : "Creating..."}
              </>
            ) : (
              <>
                {editingId !== null
                  ? "Update Vendor"
                  : "Create Vendor"}
              </>
            )}
          </button>

        </div>

      </form>

      {/* =====================================================
          VENDORS LIST
      ===================================================== */}

      <div className="vendors-list-card">

        <div className="vendors-list-toolbar">

          <div>
            <h2>
              Vendors List
            </h2>

            <p>
              {filteredVendors.length}{" "}
              vendor
              {filteredVendors.length ===
              1
                ? ""
                : "s"}{" "}
              found
            </p>
          </div>

          <div className="vendors-filters">

            {/* SEARCH */}

            <div className="vendors-search">

              <i className="bi bi-search" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              />

            </div>

            {/* VENDOR TYPE */}

            <select
              value={
                vendorTypeFilter
              }
              onChange={(event) =>
                setVendorTypeFilter(
                  event.target.value
                )
              }
            >
              <option>
                All Vendor Types
              </option>

              <option value="Supplier">
                Supplier
              </option>

              <option value="Organizer">
                Organizer
              </option>
            </select>

            {/* STATUS */}

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option>
                All Statuses
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

          </div>

        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="vendors-table-wrap">

          <table className="vendors-table">

            <thead>
              <tr>

                <th>
                  Vendor Code
                </th>

                <th>
                  Vendor Name
                </th>

                <th>
                  Address
                </th>

                <th>
                  Vendor Type
                </th>

                <th>
                  Contact Person
                </th>

                <th>
                  Phone Number
                </th>

                <th>
                  Email
                </th>

                <th>
                  Product 
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created At
                </th>

                <th>
                  Updated At
                </th>

                <th>
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="12"
                    className="vendors-loading-cell"
                  >
                    <i className="bi bi-arrow-repeat vendors-loading-icon" />

                    Loading vendors...
                  </td>
                </tr>
              ) : (
                filteredVendors.map(
                  (vendor) => (
                    <tr
                      key={vendor.id}
                    >

                      {/* CODE */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(event, vendor.code || "—")
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorCell
                          value={vendor.code}
                          strong
                        />
                      </td>

                      {/* NAME */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(event, vendor.name || "—")
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorCell
                          value={vendor.name}
                          strong
                        />
                      </td>

                      {/* ADDRESS */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            vendor.addressLine1 || "—"
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorCell
                          value={vendor.addressLine1}
                        />
                      </td>

                      {/* TYPE */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            getVendorTypeLabel(
                              vendor.vendorType
                            )
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <span
                          className={`vendors-type ${
                            String(
                              vendor.vendorType ||
                                ""
                            ).toLowerCase()
                          }`}
                        >
                          {getVendorTypeLabel(
                            vendor.vendorType
                          )}
                        </span>
                      </td>

                      {/* CONTACT PERSON */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            getVendorTypeLabel(
                              vendor.vendorType
                            ) === "Organizer"
                              ? vendor.contactPerson || "—"
                              : "—"
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorCell
                          value={
                            getVendorTypeLabel(
                              vendor.vendorType
                            ) === "Organizer"
                              ? vendor.contactPerson
                              : "—"
                          }
                        />
                      </td>

                      {/* PHONE */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            vendor.phone || "—"
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorCell
                          value={vendor.phone}
                        />
                      </td>

                      {/* EMAIL */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            vendor.email || "—"
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorCell
                          value={vendor.email}
                        />
                      </td>

                      {/* CATEGORY */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            vendor.category || "—"
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorCell
                          value={vendor.category}
                        />
                      </td>

                      {/* STATUS */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            vendor.status || "—"
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <span
                          className={`vendors-status ${
                            String(
                              vendor.status ||
                                ""
                            ).toLowerCase()
                          }`}
                        >
                          {vendor.status ||
                            "—"}
                        </span>
                      </td>

                      {/* CREATED TIME */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            vendor.createdTime || "—"
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorAuditCell
                          value={vendor.createdTime}
                        />
                      </td>

                      {/* UPDATED TIME */}

                      <td
                        onMouseEnter={(event) =>
                          showCellTooltip(
                            event,
                            vendor.updatedTime || "—"
                          )
                        }
                        onMouseLeave={hideCellTooltip}
                      >
                        <VendorAuditCell
                          value={vendor.updatedTime}
                        />
                      </td>

                      {/* ACTIONS */}

                      <td className="vendors-actions">

                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() =>
                            editVendor(
                              vendor
                            )
                          }
                          aria-label={`Edit ${vendor.name}`}
                          title="Edit"
                          disabled={
                            saving ||
                            deleting
                          }
                        >
                          <i className="bi bi-pencil" />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          className="vendors-delete-action"
                          onClick={() =>
                            confirmDelete(
                              vendor
                            )
                          }
                          aria-label={`Delete ${vendor.name}`}
                          title="Delete"
                          disabled={
                            saving ||
                            deleting
                          }
                        >
                          <i className="bi bi-trash" />
                        </button>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {!loading &&
            filteredVendors.length ===
              0 && (
              <div className="vendors-empty">

                <i className="bi bi-truck" />

                <h3>
                  No vendors found
                </h3>

                <p>
                  Try changing your
                  search or filters.
                </p>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear Filters
                </button>

              </div>
            )}

        </div>

      </div>

      {/* =====================================================
          DELETE CONFIRMATION POPUP
      ===================================================== */}

      {deleteTarget && (
        <div
          className="vendors-delete-backdrop"
          onClick={() =>
            !deleting &&
            setDeleteTarget(
              null
            )
          }
        >

          <div
            className="vendors-delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* DELETE ICON */}

            <div className="vendors-delete-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>

            {/* TITLE */}

            <h2>
              Delete Vendor?
            </h2>

            {/* MESSAGE */}

            <p>
              Are you sure you want
              to delete{" "}
              <strong>
                {deleteTarget.name}
              </strong>
              ?
            </p>

            <p className="vendors-delete-warning">
              This action cannot be undone.
            </p>

            {/* ACTIONS */}

            <div className="vendors-delete-actions">

              <button
                type="button"
                className="vendors-delete-cancel"
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                disabled={deleting}
              >
                No, Keep It
              </button>

              <button
                type="button"
                className="vendors-delete-confirm"
                onClick={
                  handleDeleteVendor
                }
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <i className="bi bi-arrow-repeat vendors-loading-icon" />

                    Deleting...
                  </>
                ) : (
                  <>
                    Yes, Delete
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

      {hoveredCell && (
        <div
          className="vendors-hover-tooltip"
          style={{
            left: `${hoveredCell.left}px`,
            top: `${hoveredCell.top}px`,
          }}
          role="tooltip"
        >
          {hoveredCell.value}
        </div>
      )}

    </section>
  );
}