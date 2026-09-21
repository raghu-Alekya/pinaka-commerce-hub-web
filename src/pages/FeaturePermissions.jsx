import { useEffect, useMemo, useRef, useState } from "react";
import { listFeatures } from "../api/features";
import {
  listFeaturePermissions,
  createFeaturePermission,
  updateFeaturePermission,
  deleteFeaturePermission,
} from "../api/featurePermissionsApi";
import "../styles/featurepermissions.css";

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


function PermissionDescriptionCell({ description = "" }) {
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const element = textRef.current;
      if (!element) return;
      setIsTruncated(element.scrollHeight > element.clientHeight + 1);
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [description]);

  return (
    <td className="fp-description-cell">
      <div className="fp-description-tooltip-wrap">
        <span ref={textRef} className="fp-description-clamp">
          {description || "—"}
        </span>

        {isTruncated && (
          <div className="fp-description-tooltip" role="tooltip">
            {description}
          </div>
        )}
      </div>
    </td>
  );
}

export default function FeaturePermissions() {
  const [features, setFeatures] = useState([]);

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const requiredFieldsComplete =
    form.key.trim() !== "" &&
    form.name.trim() !== "" &&
    String(form.featureId).trim() !== "";

  const normalizeStatus = (status) =>
    String(status || "ACTIVE").toUpperCase() === "ACTIVE"
      ? "Active"
      : "Inactive";

  const normalizePermission = (item, feature) => {
    const source = item?.permission || item?.data || item || {};
    return {
      ...source,
      id: source.id ?? source._id ?? source.permissionId ?? source.permission_id,
      key: source.permissionKey || source.permission_key || source.key || "",
      name: source.name || "",
      featureId:
        source.featureId ??
        source.feature_id ??
        source.feature?.id ??
        feature?.id ??
        "",
      featureName: source.feature?.name || source.featureName || feature?.name || "",
      description: source.description || "",
      status: normalizeStatus(source.status),
      createdAt: source.createdAt || source.created_at || "",
      updatedAt: source.updatedAt || source.updated_at || "",
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const featureList = await listFeatures();
      setFeatures(featureList);

      const permissionGroups = await Promise.all(
        featureList
          .filter((feature) => feature?.id !== undefined && feature?.id !== null)
          .map(async (feature) => {
            const list = await listFeaturePermissions(feature.id);
            return list.map((item) => normalizePermission(item, feature));
          })
      );

      setPermissions(permissionGroups.flat());
    } catch (error) {
      console.error("Feature permissions load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     UPDATE FIELD
     ========================================================= */

  const updateField = (event) => {
    const field = event.target.dataset.field || event.target.name;
    const { value } = event.target;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => {
      const next = {
        ...prev,
      };

      delete next[field];

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

  const savePermission = async () => {
    const permissionKey = form.key.trim();
    const permissionName = form.name.trim();
    const selectedFeature = features.find(
      (feature) => String(feature.id) === String(form.featureId)
    );
    const validationErrors = {};

    if (!permissionKey) validationErrors.key = "Permission key is required.";
    if (!permissionName) validationErrors.name = "Permission name is required.";
    if (!selectedFeature) validationErrors.featureId = "Please select a feature.";

    const normalizedKey = permissionKey.toLowerCase();
    const normalizedName = permissionName.toLowerCase();

    const duplicateKey = permissions.some(
      (item) =>
        String(item.id) !== String(editingId) &&
        String(item.key || "").trim().toLowerCase() === normalizedKey
    );

    const duplicateName = permissions.some(
      (item) =>
        String(item.id) !== String(editingId) &&
        String(item.name || "").trim().toLowerCase() === normalizedName
    );

    if (duplicateKey) {
      validationErrors.key = "Permission code already exists.";
    }

    if (duplicateName) {
      validationErrors.name = "Permission name already exists.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      permissionKey: permissionKey.toUpperCase(),
      name: permissionName,
      description: form.description.trim(),
      status: form.status.toUpperCase(),
    };

    try {
      const response = isEditing
        ? await updateFeaturePermission(selectedFeature.id, editingId, payload)
        : await createFeaturePermission(selectedFeature.id, payload);

      if (isEditing) {
        const normalizedUpdated = normalizePermission(response, selectedFeature);

        setPermissions((prev) =>
          prev.map((item) =>
            String(item.id) === String(editingId)
              ? {
                  ...item,
                  ...normalizedUpdated,
                  id: normalizedUpdated.id || item.id,
                  key: normalizedUpdated.key || permissionKey.toUpperCase(),
                  name: normalizedUpdated.name || permissionName,
                  featureId: normalizedUpdated.featureId || selectedFeature.id,
                  featureName:
                    normalizedUpdated.featureName || selectedFeature.name || "",
                  description:
                    normalizedUpdated.description ?? form.description.trim(),
                  status: normalizedUpdated.status || form.status,
                }
              : item
          )
        );
      } else {
        const normalizedCreated = normalizePermission(response, selectedFeature);

        const createdPermission = {
          ...normalizedCreated,
          key: normalizedCreated.key || permissionKey.toUpperCase(),
          name: normalizedCreated.name || permissionName,
          featureId: normalizedCreated.featureId || selectedFeature.id,
          featureName:
            normalizedCreated.featureName || selectedFeature.name || "",
          description:
            normalizedCreated.description ?? form.description.trim(),
          status: normalizedCreated.status || form.status,
        };

        setPermissions((prev) => [
          createdPermission,
          ...prev.filter(
            (item) =>
              !createdPermission.id ||
              String(item.id) !== String(createdPermission.id)
          ),
        ]);
      }

      clearForm();
    } catch (error) {
      console.error("Save permission failed:", error);
      window.alert(error?.message || "Unable to save permission.");
    }
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

  const deletePermission = async (permissionId) => {
    const permission = permissions.find(
      (item) => String(item.id) === String(permissionId)
    );
    if (!permission?.featureId || !permissionId) {
      window.alert("Permission ID or feature ID is missing.");
      return;
    }

    try {
      await deleteFeaturePermission(permission.featureId, permissionId);
      await loadData();

      if (String(editingId) === String(permissionId)) clearForm();
    } catch (error) {
      console.error("Delete permission failed:", error);
      window.alert(error?.message || "Unable to delete permission.");
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

  const formatPermissionDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="feature-permissions-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="fp-page-head">

        <div className="fp-title-wrap">

          <div>

            <h1>
              Create Feature Permissions
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
                {isEditing ? "Edit Permission" : "Add Permission"}
              </h2>

              <p>
                Create a new permission
                or edit an existing
                permission.
              </p>

            </div>

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
                data-field="key"
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
                data-field="name"
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
                data-field="description"
                value={
                  form.description
                }
                onChange={
                  updateField
                }
                onInput={(event) => {
                  event.currentTarget.style.height = "44px";
                  event.currentTarget.style.height = `${Math.max(
                    44,
                    event.currentTarget.scrollHeight
                  )}px`;
                }}
                autoComplete="off"
                placeholder="Describe this permission and its purpose."
                rows={1}
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

              Clear

            </button>

            <button
              type="submit"
              className="fp-btn fp-btn-primary"
              disabled={!requiredFieldsComplete}
            >

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

              <col className="fp-col-feature" />

              <col className="fp-col-description" />

              <col className="fp-col-status" />

              <col className="fp-col-created" />

              <col className="fp-col-updated" />

              <col className="fp-col-actions" />

            </colgroup>

            <thead>

              <tr>

                <th>
                  Permission Key
                </th>

                <th>
                  Permission Name
                </th>

                <th>
                  Feature Name
                </th>

                <th>
                  Description
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

              {filteredPermissions.map(
                (permission) => (

                  <tr
                    key={
                      permission.id
                    }
                  >

                    {/* Permission Key */}

                    <td className="fp-permission-code-cell">
                      {String(permission.key || "—").toUpperCase()}
                    </td>

                    {/* Permission Name */}

                    <td>
                      {
                        permission.name
                      }
                    </td>

                    {/* Feature Name */}

                    <td>
                      {
                        permission.featureName
                      }
                    </td>

                    {/* Description */}

                    <PermissionDescriptionCell
                      description={permission.description}
                    />

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

                    <td className="fp-date-cell">
                      {formatPermissionDate(permission.createdAt)}
                    </td>

                    <td className="fp-date-cell">
                      {formatPermissionDate(permission.updatedAt)}
                    </td>

                    {/* =========================
                        ACTIONS
                        Edit + Delete only
                        ========================= */}

                    <td>

                      <div className="fp-row-actions feature-row-actions">

                        {/* EDIT */}

                        <button
                          type="button"
                          className="edit edit-button"
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
                          className="delete delete-button"
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