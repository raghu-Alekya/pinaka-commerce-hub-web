import { useMemo, useState } from "react";
import "../styles/featurepermissions.css";

/* =========================================================
   FEATURES
   Temporary frontend data.
   Later this list can come from shared state / backend API.
   ========================================================= */

const initialFeatures = [
  {
    id: 1,
    code: "LOYALTY",
    name: "Loyalty",
  },
  {
    id: 2,
    code: "KDS",
    name: "KDS",
  },
  {
    id: 3,
    code: "DELIVERY",
    name: "Delivery",
  },
  {
    id: 4,
    code: "SAFE_DROP",
    name: "Safe Drop",
  },
  {
    id: 5,
    code: "INVENTORY",
    name: "Inventory",
  },
];

/* =========================================================
   INITIAL PERMISSIONS
   ========================================================= */

const initialPermissions = [
  {
    id: 1,
    key: "VIEW_REFUND",
    name: "View Refund",
    featureId: 1,
    featureName: "Loyalty",
    description: "Allows user to view refund details.",
    status: "Active",
  },
  {
    id: 2,
    key: "CREATE_REFUND",
    name: "Create Refund",
    featureId: 2,
    featureName: "KDS",
    description: "Allows user to create a new refund request.",
    status: "Active",
  },
  {
    id: 3,
    key: "APPROVE_REFUND",
    name: "Approve Refund",
    featureId: 3,
    featureName: "Delivery",
    description: "Allows user to approve refund requests.",
    status: "Active",
  },
  {
    id: 4,
    key: "OVERRIDE_REFUND",
    name: "Override Refund",
    featureId: 4,
    featureName: "Safe Drop",
    description: "Allows user to override refund policies.",
    status: "Inactive",
  },
];

/* =========================================================
   EMPTY FORM
   ========================================================= */

const emptyForm = {
  key: "",
  name: "",
  featureId: "",
  description: "",
  status: "Active",
};

export default function FeaturePermissions() {
  const [features] = useState(initialFeatures);

  const [permissions, setPermissions] =
    useState(initialPermissions);

  const [form, setForm] =
    useState(emptyForm);

  const [errors, setErrors] =
    useState({});

  const [editingId, setEditingId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const isEditing = editingId !== null;

  /* =========================================================
     UPDATE FIELD
     ========================================================= */

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      const next = {
        ...prev,
      };

      delete next[name];

      return next;
    });
  };

  /* =========================================================
     CLEAR / RESET FORM
     ========================================================= */

  const clearForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setErrors({});
  };

  /* =========================================================
     SAVE / UPDATE PERMISSION
     ========================================================= */

  const savePermission = () => {
    const permissionKey =
      form.key.trim();

    const permissionName =
      form.name.trim();

    const selectedFeature =
      features.find(
        (feature) =>
          String(feature.id) ===
          String(form.featureId)
      );

    const validationErrors = {};

    if (!permissionKey) {
      validationErrors.key =
        "Permission key is required.";
    }

    if (!permissionName) {
      validationErrors.name =
        "Permission name is required.";
    }

    if (!selectedFeature) {
      validationErrors.featureId =
        "Please select a feature.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    /* =========================
       UPDATE EXISTING
       ========================= */

    if (isEditing) {
      setPermissions((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,

                key:
                  permissionKey.toUpperCase(),

                name:
                  permissionName,

                featureId:
                  selectedFeature.id,

                featureName:
                  selectedFeature.name,

                description:
                  form.description.trim(),

                status:
                  form.status,
              }
            : item
        )
      );
    }

    /* =========================
       CREATE NEW
       ========================= */

    else {
      const newPermission = {
        id: Date.now(),

        key:
          permissionKey.toUpperCase(),

        name:
          permissionName,

        featureId:
          selectedFeature.id,

        featureName:
          selectedFeature.name,

        description:
          form.description.trim(),

        status:
          form.status,
      };

      setPermissions((prev) => [
        ...prev,
        newPermission,
      ]);
    }

    clearForm();
  };

  /* =========================================================
     EDIT PERMISSION
     ========================================================= */

  const editPermission = (
    permission
  ) => {
    setEditingId(
      permission.id
    );

    setForm({
      key:
        permission.key,

      name:
        permission.name,

      featureId:
        permission.featureId
          ? String(
              permission.featureId
            )
          : "",

      description:
        permission.description,

      status:
        permission.status,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     DELETE PERMISSION
     ========================================================= */

  const deletePermission = (
    permissionId
  ) => {
    setPermissions((prev) =>
      prev.filter(
        (item) =>
          item.id !== permissionId
      )
    );

    if (
      editingId ===
      permissionId
    ) {
      clearForm();
    }
  };

  /* =========================================================
     RESET FILTERS
     ========================================================= */

  const resetFilters = () => {
    setSearch("");

    setStatusFilter(
      "All Statuses"
    );
  };

  /* =========================================================
     FILTERED PERMISSIONS
     ========================================================= */

  const filteredPermissions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return permissions.filter(
        (item) => {
          const featureName =
            item.featureName || "";

          const matchesSearch =
            item.key
              .toLowerCase()
              .includes(query) ||

            item.name
              .toLowerCase()
              .includes(query) ||

            item.description
              .toLowerCase()
              .includes(query) ||

            featureName
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "All Statuses" ||
            item.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      permissions,
      search,
      statusFilter,
    ]);

  return (
    <div className="feature-permissions-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="fp-page-head">

        <div className="fp-title-wrap">

          <div>

            <h1>
              Feature Permissions
            </h1>

            <p>
              Manage feature permissions
              and permission access.
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          PERMISSION INFORMATION CARD
          ===================================================== */}

      <section className="fp-info-card">

        <div className="fp-info-top">

          <div className="fp-info-heading">

            <div className="fp-info-icon">
              <i className="bi bi-key" />
            </div>

            <div>

              <h2>
                Permission Information
              </h2>

              <p>
                Create a new permission
                or edit an existing
                permission.
              </p>

            </div>

          </div>

          <div className="fp-mode-chip">

            {isEditing
              ? `Editing: ${form.key}`
              : "Creating New Permission"}

          </div>

        </div>

        {/* ===================================================
            FORM
            =================================================== */}

        <form
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault();

            savePermission();
          }}
        >

          <div className="fp-form-grid">

            {/* ===============================
                PERMISSION KEY
                =============================== */}

            <div
              className={`fp-field${
                errors.key
                  ? " fp-field-invalid"
                  : ""
              }`}
            >

              <label
                htmlFor="permission-key"
              >
                Permission Key
                <span>*</span>
              </label>

              <input
                id="permission-key"
                type="text"
                name="key"
                value={form.key}
                onChange={updateField}
                autoComplete="off"
                placeholder="e.g. refunds.view"
                aria-invalid={Boolean(errors.key)}
              />

              {errors.key && (
                <p className="fp-field-error">
                  {errors.key}
                </p>
              )}

            </div>

            {/* ===============================
                PERMISSION NAME
                =============================== */}

            <div
              className={`fp-field${
                errors.name
                  ? " fp-field-invalid"
                  : ""
              }`}
            >

              <label
                htmlFor="permission-name"
              >
                Permission Name
                <span>*</span>
              </label>

              <input
                id="permission-name"
                type="text"
                name="name"
                value={form.name}
                onChange={updateField}
                autoComplete="off"
                placeholder="e.g. View Refunds"
                aria-invalid={Boolean(errors.name)}
              />

              {errors.name && (
                <p className="fp-field-error">
                  {errors.name}
                </p>
              )}

            </div>

            {/* ===============================
                FEATURE DROPDOWN
                =============================== */}

            <div
              className={`fp-field${
                errors.featureId
                  ? " fp-field-invalid"
                  : ""
              }`}
            >

              <label
                htmlFor="permission-feature"
              >
                Feature
                <span>*</span>
              </label>

              <div className="fp-select-wrap">

                <select
                  id="permission-feature"
                  name="featureId"
                  value={form.featureId}
                  onChange={updateField}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.featureId)}
                >

                  <option value="">
                    Select Feature
                  </option>

                  {features.map(
                    (feature) => (
                      <option
                        key={
                          feature.id
                        }
                        value={
                          feature.id
                        }
                      >
                        {
                          feature.name
                        }
                      </option>
                    )
                  )}

                </select>

                <i className="bi bi-chevron-down" />

              </div>

              {errors.featureId && (
                <p className="fp-field-error">
                  {errors.featureId}
                </p>
              )}

            </div>

            {/* ===============================
                DESCRIPTION
                =============================== */}

            <div className="fp-field fp-description-field">

              <label
                htmlFor="permission-description"
              >
                Description
              </label>

              <textarea
                id="permission-description"
                name="description"
                value={
                  form.description
                }
                onChange={
                  updateField
                }
                autoComplete="off"
                placeholder="Describe what this permission allows users to do"
                rows={3}
              />

            </div>

            {/* ===============================
                STATUS
                =============================== */}

            <div className="fp-field">

              <label
                htmlFor="permission-status"
              >
                Status
              </label>

              <div className="fp-select-wrap">

                <select
                  id="permission-status"
                  name="status"
                  value={form.status}
                  onChange={updateField}
                  autoComplete="off"
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                </select>

                <i className="bi bi-chevron-down" />

              </div>

            </div>

          </div>

          {/* =================================================
              FORM ACTIONS
              ================================================= */}

          <div className="fp-form-actions">

            <button
              type="button"
              className="fp-btn fp-btn-secondary"
              onClick={clearForm}
            >

              <i className="bi bi-arrow-counterclockwise" />

              Reset

            </button>

            <button
              type="submit"
              className="fp-btn fp-btn-primary"
            >

              <i className="bi bi-floppy" />

              {isEditing
                ? "Update Permission"
                : "Save Permission"}

            </button>

          </div>

        </form>

      </section>

      {/* =====================================================
          PERMISSIONS LIST
          ===================================================== */}

      <section className="fp-list-card">

        <div className="fp-list-toolbar">

          <h2>
            Permissions List (
            {
              filteredPermissions.length
            }
            )
          </h2>

          <div className="fp-list-filters">

            {/* SEARCH */}

            <div className="fp-search">

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
                placeholder="Search permissions..."
              />

            </div>

            {/* STATUS FILTER */}

            <div className="fp-status-filter">

              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                autoComplete="off"
              >

                <option value="All Statuses">
                  All Statuses
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>

              </select>

              <i className="bi bi-chevron-down" />

            </div>

            {/* RESET FILTER */}

            <button
              type="button"
              className="fp-reset-btn"
              onClick={resetFilters}
            >

              <i className="bi bi-arrow-repeat" />

              Reset

            </button>

          </div>

        </div>

        {/* ===================================================
            TABLE
            =================================================== */}

        <div className="fp-table-wrap">

          <table className="fp-table">

            <colgroup>

              <col className="fp-col-key" />

              <col className="fp-col-name" />

              <col className="fp-col-description" />

              <col className="fp-col-status" />

              <col className="fp-col-actions" />

            </colgroup>

            <thead>

              <tr>

                <th>
                  Permission Key
                  <i className="bi bi-chevron-expand" />
                </th>

                <th>
                  Permission Name
                  <i className="bi bi-chevron-expand" />
                </th>

                <th>
                  Description
                  <i className="bi bi-chevron-expand" />
                </th>

                <th>
                  Status
                  <i className="bi bi-chevron-expand" />
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredPermissions.map(
                (permission) => (

                  <tr
                    key={
                      permission.id
                    }
                  >

                    {/* Permission Key */}

                    <td>
                      {
                        permission.key
                      }
                    </td>

                    {/* Permission Name */}

                    <td>
                      {
                        permission.name
                      }
                    </td>

                    {/* Description */}

                    <td className="fp-description-cell">
                      {
                        permission.description
                      }
                    </td>

                    {/* Status */}

                    <td>

                      <span
                        className={`fp-status-pill ${permission.status.toLowerCase()}`}
                      >

                        <b />

                        {
                          permission.status
                        }

                      </span>

                    </td>

                    {/* =========================
                        ACTIONS
                        Edit + Delete only
                        ========================= */}

                    <td>

                      <div className="fp-row-actions">

                        {/* EDIT */}

                        <button
                          type="button"
                          className="edit"
                          aria-label={`Edit ${permission.name}`}
                          onClick={() =>
                            editPermission(
                              permission
                            )
                          }
                        >

                          <i className="bi bi-pencil" />

                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          className="delete"
                          aria-label={`Delete ${permission.name}`}
                          onClick={() =>
                            deletePermission(
                              permission.id
                            )
                          }
                        >

                          <i className="bi bi-trash3" />

                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            TABLE FOOTER
            =================================================== */}

        <div className="fp-list-footer">

          <span>

            Showing 1 to{" "}
            {
              filteredPermissions.length
            }{" "}
            of{" "}
            {
              filteredPermissions.length
            }{" "}
            entries

          </span>

          <div className="fp-pagination">

            <button
              type="button"
              aria-label="Previous page"
            >

              <i className="bi bi-chevron-left" />

            </button>

            <button
              type="button"
              className="current"
            >
              1
            </button>

            <button
              type="button"
              aria-label="Next page"
            >

              <i className="bi bi-chevron-right" />

            </button>

          </div>

        </div>

      </section>

    </div>
  );
}