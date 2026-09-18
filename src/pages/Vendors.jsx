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

function getVendorTypeLabel(vendorType) {
  const type = String(vendorType || "").toUpperCase();

  if (type === "ORGANIZER" || type === "ORGANIZATION") {
    return "Organizer";
  }

  if (type === "SUPPLIER" || type === "INDIVIDUAL") {
    return "Supplier";
  }

  return vendorType || "—";
}

function getVendorTypeApiValue(vendorType) {
  return vendorType === "Organizer"
    ? "ORGANIZER"
    : "SUPPLIER";
}

function normalizeVendorType(vendorType) {
  const type = String(vendorType || "").toUpperCase();

  if (
    type === "ORGANIZER" ||
    type === "ORGANIZATION"
  ) {
    return "Organizer";
  }

  return "Supplier";
}

export default function Vendors({
  merchantId,
  storeId,
  store,
  embedded = false,
}) {
  const [vendors, setVendors] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [vendorTypeFilter, setVendorTypeFilter] =
    useState("All Vendor Types");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD VENDORS
  |--------------------------------------------------------------------------
  */

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const data = await getVendors();

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

  const filteredVendors = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return vendors.filter((vendor) => {
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
        searchableText.includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        vendor.status === statusFilter;

      const matchesVendorType =
        vendorTypeFilter ===
          "All Vendor Types" ||
        getVendorTypeLabel(
          vendor.vendorType
        ) === vendorTypeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVendorType
      );
    });
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
  | SAVE VENDOR
  |--------------------------------------------------------------------------
  */

  async function saveVendor(event) {
    event.preventDefault();

    setError("");

    if (
      !form.name.trim() ||
      !form.code.trim() ||
      !form.vendorType
    ) {
      setError(
        "Vendor Code, Vendor Name and Vendor Type are required."
      );

      return;
    }

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

    try {
      setSaving(true);

      const payload =
        buildPayload();

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */

      if (editingId !== null) {
        const updatedVendor =
          await updateVendor(
            editingId,
            payload
          );

        setVendors(
          (current) =>
            current.map((vendor) =>
              String(vendor.id) ===
              String(editingId)
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

  function editVendor(vendor) {
    setEditingId(vendor.id);

    setForm({
      name:
        vendor.name || "",

      code:
        vendor.code || "",

      vendorType:
        normalizeVendorType(
          vendor.vendorType
        ),

      contactPerson:
        vendor.contactPerson || "",

      phone:
        vendor.phone || "",

      email:
        vendor.email || "",

      category:
        vendor.category || "",

      addressLine1:
        vendor.addressLine1 || "",

      addressLine2:
        vendor.addressLine2 || "",

      city:
        vendor.city || "",

      state:
        vendor.state || "",

      zipCode:
        vendor.zipCode || "",

      country:
        vendor.country || "",

      status:
        vendor.status || "Active",
    });

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

  function confirmDelete(vendor) {
    setDeleteTarget(vendor);
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
              String(vendor.id) !==
              String(deleteTarget.id)
          )
      );

      setDeleteTarget(null);
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
            {editingId !== null
              ? "Edit Vendor"
              : "Vendors"}
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
      >

        <div className="vendors-form-heading">

          <div className="vendors-heading-content">

            <div className="vendors-heading-icon">
              <i className="bi bi-truck" />
            </div>

            <div>
              <h2>
                {editingId !== null
                  ? "Update Vendor"
                  : "Add Vendor"}
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

          {/* VENDOR CODE */}

          <label>
            <span>
              Vendor Code <b>*</b>
            </span>

            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. VEN-001"
              required
              disabled={saving}
            />
          </label>

          {/* VENDOR NAME */}

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
              required
              disabled={saving}
            />
          </label>

          {/* VENDOR TYPE */}

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

          {/* CONTACT PERSON */}

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
                placeholder="Enter contact person name"
                required
                disabled={saving}
              />
            </label>
          )}

          {/* PHONE */}

          <label>
            <span>
              Phone Number
            </span>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={saving}
            />
          </label>

          {/* EMAIL */}

          <label>
            <span>
              Email
            </span>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email address"
              disabled={saving}
            />
          </label>

          {/* PRODUCT / CATEGORY */}

          <label>
            <span>
              Product / Category
            </span>

            <input
              type="text"
              name="category"
              value={
                form.category
              }
              onChange={handleChange}
              placeholder="e.g. Food & Beverage"
              disabled={saving}
            />
          </label>

          {/* ADDRESS LINE 1 */}

          <label className="vendors-wide-field">
            <span>
              Address Line 1
            </span>

            <input
              type="text"
              name="addressLine1"
              value={
                form.addressLine1
              }
              onChange={handleChange}
              placeholder="Enter street address"
              disabled={saving}
            />
          </label>

          {/* ADDRESS LINE 2 */}

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
              disabled={saving}
            />
          </label>

          {/* CITY */}

          <label>
            <span>
              City
            </span>

            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Enter city"
              disabled={saving}
            />
          </label>

          {/* STATE */}

          <label>
            <span>
              State
            </span>

            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="Enter state"
              disabled={saving}
            />
          </label>

          {/* ZIP CODE */}

          <label>
            <span>
              ZIP Code
            </span>

            <input
              type="text"
              name="zipCode"
              value={
                form.zipCode
              }
              onChange={handleChange}
              placeholder="Enter ZIP code"
              disabled={saving}
            />
          </label>

          {/* COUNTRY */}

          <label>
            <span>
              Country
            </span>

            <input
              type="text"
              name="country"
              value={
                form.country
              }
              onChange={handleChange}
              placeholder="Enter country"
              disabled={saving}
            />
          </label>

          {/* STATUS */}

          {editingId !== null && (
            <label>
              <span>
                Status
              </span>

              <select
                name="status"
                value={
                  form.status
                }
                onChange={handleChange}
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

        {/* FORM ACTIONS */}

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
            disabled={saving}
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
                  ? "Save Changes"
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
                placeholder="Search vendors..."
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
                  Product / Category
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created Time
                </th>

                <th>
                  Updated Time
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
                    colSpan="11"
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

                      <td>
                        <strong>
                          {vendor.code}
                        </strong>
                      </td>

                      {/* NAME */}

                      <td>
                        <strong>
                          {vendor.name}
                        </strong>

                        <small>
                          {[
                            vendor.addressLine1,
                            vendor.addressLine2,
                            vendor.city,
                            vendor.state,
                            vendor.zipCode,
                            vendor.country,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(", ") ||
                            "—"}
                        </small>
                      </td>

                      {/* TYPE */}

                      <td>
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

                      <td>
                        {getVendorTypeLabel(
                          vendor.vendorType
                        ) ===
                        "Organizer"
                          ? vendor.contactPerson ||
                            "—"
                          : "—"}
                      </td>

                      {/* PHONE */}

                      <td>
                        {vendor.phone ||
                          "—"}
                      </td>

                      {/* EMAIL */}

                      <td>
                        {vendor.email ||
                          "—"}
                      </td>

                      {/* CATEGORY */}

                      <td>
                        {vendor.category ||
                          "—"}
                      </td>

                      {/* STATUS */}

                      <td>
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

                      <td>
                        {vendor.createdTime ||
                          "—"}
                      </td>

                      {/* UPDATED TIME */}

                      <td>
                        {vendor.updatedTime ||
                          "—"}
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

          {/* EMPTY */}

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
            setDeleteTarget(null)
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
              <i className="bi bi-trash" />
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
              This action cannot be
              undone.
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
                Cancel
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
                    <i className="bi bi-trash" />

                    Delete Vendor
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}