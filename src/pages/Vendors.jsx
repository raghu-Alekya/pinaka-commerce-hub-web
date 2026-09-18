import { useMemo, useState } from "react";

const initialVendors = [
  {
    id: 1,
    name: "Freshline Foods",
    code: "VEN-001",
    vendorType: "Organization",
    contactPerson: "Maya Patel",
    phone: "+1 (512) 555-0148",
    email: "maya@freshline.example",
    category: "Food & Beverage",
    addressLine1: "120 Market Street",
    addressLine2: "",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    country: "United States",
    status: "Active",
    changedBy: "Admin",
    changedAt: "Sep 12, 2026",
  },
  {
    id: 2,
    name: "Raj Kumar",
    code: "VEN-002",
    vendorType: "Individual",
    contactPerson: "",
    phone: "+1 (512) 555-0192",
    email: "raj@example.com",
    category: "Vegetables",
    addressLine1: "44 Industrial Drive",
    addressLine2: "",
    city: "Dallas",
    state: "TX",
    zipCode: "75201",
    country: "United States",
    status: "Active",
    changedBy: "Admin",
    changedAt: "Sep 10, 2026",
  },
];

const emptyForm = {
  name: "",
  code: "",
  vendorType: "Individual",
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

export default function Vendors({
  merchantId,
  storeId,
  store,
  embedded = false,
}) {
  const [vendors, setVendors] = useState(initialVendors);

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);


  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [vendorTypeFilter, setVendorTypeFilter] =
    useState("All Vendor Types");

  /* =========================================================
     FILTER VENDORS
  ========================================================= */

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const searchableText = [
        vendor.name,
        vendor.code,
        vendor.vendorType,
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
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        vendor.status === statusFilter;

      const matchesVendorType =
        vendorTypeFilter === "All Vendor Types" ||
        vendor.vendorType === vendorTypeFilter;

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

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [name]: value,
      };

      if (
        name === "vendorType" &&
        value === "Individual"
      ) {
        updated.contactPerson = "";
      }

      return updated;
    });
  }

  /* =========================================================
     RESET FORM
  ========================================================= */

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  /* =========================================================
     SAVE VENDOR
  ========================================================= */

  function saveVendor(event) {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.code.trim() ||
      !form.vendorType
    ) {
      return;
    }

    if (
      form.vendorType === "Organization" &&
      !form.contactPerson.trim()
    ) {
      return;
    }

    const vendorData = {
      name: form.name.trim(),

      code: form.code
        .trim()
        .toUpperCase(),

      vendorType: form.vendorType,

      contactPerson:
        form.vendorType === "Organization"
          ? form.contactPerson.trim()
          : "",

      phone: form.phone.trim(),

      email: form.email.trim(),

      category: form.category.trim(),

      addressLine1: form.addressLine1.trim(),

      addressLine2: form.addressLine2.trim(),

      city: form.city.trim(),

      state: form.state.trim().toUpperCase(),

      zipCode: form.zipCode.trim(),

      country: form.country,

      status: editingId
        ? form.status
        : "Active",

      createdTime:
        editingId !== null
          ? vendors.find((vendor) => vendor.id === editingId)?.createdTime || ""
          : new Date().toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),

      updatedTime:
        new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    };

    /* UPDATE */

    if (editingId !== null) {
      setVendors((current) =>
        current.map((vendor) =>
          vendor.id === editingId
            ? {
                ...vendor,
                ...vendorData,
              }
            : vendor
        )
      );
    }

    /* CREATE */

    else {
      const newVendor = {
        ...vendorData,
        id: Date.now(),
      };

      setVendors((current) => [
        newVendor,
        ...current,
      ]);
    }

    resetForm();
  }

  /* =========================================================
     EDIT VENDOR
  ========================================================= */

  function editVendor(vendor) {
    setEditingId(vendor.id);

    setForm({
      name: vendor.name || "",
      code: vendor.code || "",
      vendorType:
        vendor.vendorType || "Individual",
      contactPerson:
        vendor.contactPerson || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      category: vendor.category || "",
      addressLine1: vendor.addressLine1 || "",
      addressLine2: vendor.addressLine2 || "",
      city: vendor.city || "",
      state: vendor.state || "",
      zipCode: vendor.zipCode || "",
      country: vendor.country || "",
      status: vendor.status || "Active",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =========================================================
     OPEN DELETE POPUP
  ========================================================= */

  function confirmDelete(vendor) {
    setDeleteTarget(vendor);
  }

  /* =========================================================
     DELETE VENDOR
  ========================================================= */

  function deleteVendor() {
    if (!deleteTarget) {
      return;
    }

    setVendors((current) =>
      current.filter(
        (vendor) =>
          vendor.id !== deleteTarget.id
      )
    );

    setDeleteTarget(null);
  }

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  function clearFilters() {
    setSearch("");
    setStatusFilter("All Statuses");
    setVendorTypeFilter(
      "All Vendor Types"
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section className="vendors-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="vendors-header">
        <div>
          <h1>
            {editingId
              ? "Edit Vendor"
              : "Vendors"}
          </h1>

          <p>
            Manage supplier contacts, categories,
            and vendor information.
          </p>
        </div>
      </div>

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
                {editingId
                  ? "Update Vendor"
                  : "Add Vendor"}
              </h2>

              <p>
                Provide the vendor and business
                details.
              </p>
            </div>

          </div>

          {editingId && (
            <button
              type="button"
              className="vendors-link-button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}

        </div>

        {/* ===================================================
            FORM FIELDS
        =================================================== */}

        <div className="vendors-form-grid">

          {/* VENDOR CODE FIRST */}

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
            />
          </label>

          {/* VENDOR NAME SECOND */}

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
            />
          </label>

          {/* VENDOR TYPE */}

          <label>
            <span>
              Vendor Type <b>*</b>
            </span>

            <select
              name="vendorType"
              value={form.vendorType}
              onChange={handleChange}
              required
            >
              <option value="Individual">
                Individual
              </option>

              <option value="Organization">
                Organization
              </option>
            </select>
          </label>

          {/* CONTACT PERSON - ORGANIZATION ONLY */}

          {form.vendorType ===
            "Organization" && (
            <label>
              <span>
                Contact Person Name <b>*</b>
              </span>

              <input
                type="text"
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                placeholder="Enter contact person name"
                required
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
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Food & Beverage"
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
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="Enter street address"
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
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Apartment, suite, unit"
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
              placeholder="e.g. AZ"
              maxLength="2"
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
              value={form.zipCode}
              onChange={handleChange}
              placeholder="Enter ZIP code"
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
              value={form.country}
              onChange={handleChange}
              placeholder="Enter country"
            />
          </label>

          {/* STATUS - EDIT ONLY */}

          {editingId && (
            <label>
              <span>
                Status
              </span>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
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
          >
            Clear
          </button>

          <button
            type="submit"
            className="vendors-save-button"
          >
            {editingId
              ? "Save Changes"
              : "Create Vendor"}
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
              {filteredVendors.length === 1
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
              value={vendorTypeFilter}
              onChange={(event) =>
                setVendorTypeFilter(
                  event.target.value
                )
              }
            >
              <option>
                All Vendor Types
              </option>

              <option value="Individual">
                Individual
              </option>

              <option value="Organization">
                Organization
              </option>
            </select>

            {/* STATUS */}

            <select
              value={statusFilter}
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

                {/* CODE FIRST */}

                <th>
                  Vendor Code
                </th>

                {/* NAME SECOND */}

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

              {filteredVendors.map(
                (vendor) => (

                  <tr key={vendor.id}>

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
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </small>
                    </td>

                    {/* TYPE */}

                    <td>

                      <span
                        className={`vendors-type ${
                          vendor.vendorType.toLowerCase()
                        }`}
                      >
                        {vendor.vendorType}
                      </span>

                    </td>

                    {/* CONTACT PERSON */}

                    <td>
                      {vendor.vendorType ===
                      "Organization"
                        ? vendor.contactPerson ||
                          "—"
                        : "—"}
                    </td>

                    {/* PHONE */}

                    <td>
                      {vendor.phone || "—"}
                    </td>

                    {/* EMAIL */}

                    <td>
                      {vendor.email || "—"}
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
                          vendor.status.toLowerCase()
                        }`}
                      >
                        {vendor.status}
                      </span>

                    </td>

                    {/* CREATED TIME */}

                    <td>
                      {vendor.createdTime || "—"}
                    </td>

                    {/* UPDATED TIME */}

                    <td>
                      {vendor.updatedTime || "—"}
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
                      >
                        <i className="bi bi-trash" />
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

          {/* EMPTY */}

          {filteredVendors.length ===
            0 && (
            <div className="vendors-empty">

              <i className="bi bi-truck" />

              <h3>
                No vendors found
              </h3>

              <p>
                Try changing your search
                or filters.
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
              Are you sure you want to delete{" "}
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
                  setDeleteTarget(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="vendors-delete-confirm"
                onClick={deleteVendor}
              >
                <i className="bi bi-trash" />
                Delete Vendor
              </button>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}