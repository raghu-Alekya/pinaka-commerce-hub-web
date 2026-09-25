import { useEffect, useMemo, useRef, useState } from "react";
import { listFeatures } from "../api/features";
import {
  listFeaturePermissions,
  getFeaturePermissionById,
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

  const [form, setForm] = useState(emptyForm);

  const [errors, setErrors] = useState({});

  const [editingId, setEditingId] = useState(null);

  const [permissionToDelete, setPermissionToDelete] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const isEditing = editingId !== null;

  const requiredFieldsComplete =
    form.key.trim() !== "" &&
    form.name.trim() !== "" &&
    String(form.featureId).trim() !== "";

  const originalEditingPermission = isEditing
    ? permissions.find((item) => String(item.id) === String(editingId))
    : null;

  const originalEditingStatus =
    String(originalEditingPermission?.status || "ACTIVE").toUpperCase() ===
    "ACTIVE"
      ? "Active"
      : "Inactive";

  const hasEditChanges =
    !isEditing ||
    !originalEditingPermission ||
    form.key.trim().toUpperCase() !==
      String(originalEditingPermission.key || "")
        .trim()
        .toUpperCase() ||
    form.name.trim() !== String(originalEditingPermission.name || "").trim() ||
    String(form.featureId) !==
      String(originalEditingPermission.featureId ?? "") ||
    form.description.trim() !==
      String(originalEditingPermission.description || "").trim() ||
    form.status !== originalEditingStatus;

  const canSubmit = requiredFieldsComplete && (!isEditing || hasEditChanges);

  const normalizeStatus = (status) =>
    String(status || "ACTIVE").toUpperCase() === "ACTIVE"
      ? "Active"
      : "Inactive";

  const normalizePermission = (item, feature) => {
    const source = item?.permission || item?.data || item || {};
    return {
      ...source,
      id:
        source.id ?? source._id ?? source.permissionId ?? source.permission_id,
      key: source.permissionKey || source.permission_key || source.key || "",
      name: source.name || "",
      featureId:
        source.featureId ??
        source.feature_id ??
        source.feature?.id ??
        feature?.id ??
        "",
      featureName:
        source.feature?.name || source.featureName || feature?.name || "",
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
          .filter(
            (feature) => feature?.id !== undefined && feature?.id !== null,
          )
          .map(async (feature) => {
            const list = await listFeaturePermissions(feature.id);
            return list.map((item) => normalizePermission(item, feature));
          }),
      );

      setPermissions(permissionGroups.flat());
    } catch (error) {
      console.error("Feature permissions load failed:", error);
      window.alert(error?.message || "Unable to load feature permissions.");
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
      (feature) => String(feature.id) === String(form.featureId),
    );
    const validationErrors = {};

    if (!permissionKey) validationErrors.key = "Permission key is required.";
    if (!permissionName) validationErrors.name = "Permission name is required.";
    if (!selectedFeature)
      validationErrors.featureId = "Please select a feature.";

    const normalizedKey = permissionKey.toLowerCase();
    const normalizedName = permissionName.toLowerCase();

    const duplicateKey = permissions.some(
      (item) =>
        String(item.id) !== String(editingId) &&
        String(item.key || "")
          .trim()
          .toLowerCase() === normalizedKey,
    );

    const duplicateName = permissions.some(
      (item) =>
        String(item.id) !== String(editingId) &&
        String(item.name || "")
          .trim()
          .toLowerCase() === normalizedName,
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

    const payload = isEditing
      ? {
          name: permissionName,
          description: form.description.trim(),
          status: form.status.toUpperCase(),
        }
      : {
          permissionKey: permissionKey.toUpperCase(),
          name: permissionName,
          description: form.description.trim(),
          status: form.status.toUpperCase(),
        };

    try {
      const response = isEditing
        ? await updateFeaturePermission(selectedFeature.id, editingId, payload)
        : await createFeaturePermission(selectedFeature.id, payload);

      await loadData();
      if (!isEditing) setCurrentPage(1);

      clearForm();
    } catch (error) {
      console.error("Save permission failed:", error);
      window.alert(error?.message || "Unable to save permission.");
    }
  };

  /* =========================================================
     EDIT PERMISSION
     ========================================================= */

  const editPermission = async (permission) => {
    try {
      const record = await getFeaturePermissionById(
        permission.featureId,
        permission.id,
      );
      const loaded = normalizePermission(
        record,
        features.find(
          (item) => String(item.id) === String(permission.featureId),
        ),
      );
      setEditingId(loaded.id ?? permission.id);
      setForm({
        key: loaded.key || permission.key,
        name: loaded.name || permission.name,
        featureId: String(loaded.featureId || permission.featureId || ""),
        description: loaded.description || "",
        status: loaded.status || permission.status,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Get permission failed:", error);
      window.alert(error?.message || "Unable to load permission.");
    }
  };

  /* =========================================================
     DELETE PERMISSION
     ========================================================= */

  const openDeleteConfirmation = (permission) => {
    setPermissionToDelete(permission);
  };

  const closeDeleteConfirmation = () => {
    if (isDeleting) return;
    setPermissionToDelete(null);
  };

  const confirmDeletePermission = async () => {
    const permission = permissionToDelete;
    if (!permission) return;

    const permissionId = permission.id;
    const featureId = permission.featureId;

    if (
      permissionId === undefined ||
      permissionId === null ||
      featureId === undefined ||
      featureId === null ||
      String(permissionId).trim() === "" ||
      String(featureId).trim() === ""
    ) {
      window.alert("Permission ID or feature ID is missing.");
      return;
    }

    setIsDeleting(true);

    try {
      await deleteFeaturePermission(featureId, permissionId);

      await loadData();

      if (String(editingId) === String(permissionId)) {
        clearForm();
      }

      setPermissionToDelete(null);
    } catch (error) {
      console.error("Delete permission failed:", error);
      window.alert(error?.message || "Unable to delete permission.");
    } finally {
      setIsDeleting(false);
    }
  };

  /* =========================================================
     RESET FILTERS
     ========================================================= */

  const resetFilters = () => {
    setSearch("");

    setStatusFilter("All Statuses");

    setSortBy("newest");
  };

  /* =========================================================
     FILTERED PERMISSIONS
     ========================================================= */

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    const getCreatedTime = (item) => {
      const parsed = new Date(item.createdAt || "").getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const getUpdatedTime = (item) => {
      const parsed = new Date(item.updatedAt || "").getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const filtered = permissions.filter((item) => {
      const featureName = item.featureName || "";

      const matchesSearch =
        String(item.key || "")
          .toLowerCase()
          .includes(query) ||
        String(item.name || "")
          .toLowerCase()
          .includes(query) ||
        String(item.description || "")
          .toLowerCase()
          .includes(query) ||
        String(featureName).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") {
        return getCreatedTime(a) - getCreatedTime(b);
      }

      if (sortBy === "updated") {
        return getUpdatedTime(b) - getUpdatedTime(a);
      }

      if (sortBy === "name-asc") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (sortBy === "name-desc") {
        return String(b.name || "").localeCompare(String(a.name || ""));
      }

      return getCreatedTime(b) - getCreatedTime(a);
    });
  }, [permissions, search, statusFilter, sortBy]);

  /* =========================================================
   PAGINATION
   ========================================================= */

  const totalEntries = filteredPermissions.length;

  useEffect(() => {
    const pages = Math.max(
      1,
      Math.ceil(filteredPermissions.length / ITEMS_PER_PAGE),
    );
    if (currentPage > pages) setCurrentPage(pages);
  }, [filteredPermissions.length, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalEntries / ITEMS_PER_PAGE));

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalEntries);

  const paginatedPermissions = filteredPermissions.slice(startIndex, endIndex);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  const formatPermissionDate = (value) => {
    if (!value) {
      return {
        date: "—",
        time: "",
      };
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return {
        date: "—",
        time: "",
      };
    }

    return {
      date: parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: parsedDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  return (
    <div className="feature-permissions-page">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="fp-page-head">
        <div className="fp-title-wrap">
          <div>
            <h1>Feature Permissions</h1>

            <p>Manage feature permissions and permission access.</p>
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
              <h2>{isEditing ? "Edit Permission" : "Add Permission"}</h2>

              <p>Create a new permission or edit an existing permission.</p>
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

            <div className={`fp-field${errors.key ? " fp-field-invalid" : ""}`}>
              <label htmlFor="permission-key">
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

              {errors.key && <p className="fp-field-error">{errors.key}</p>}
            </div>

            {/* ===============================
                PERMISSION NAME
                =============================== */}

            <div
              className={`fp-field${errors.name ? " fp-field-invalid" : ""}`}
            >
              <label htmlFor="permission-name">
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

              {errors.name && <p className="fp-field-error">{errors.name}</p>}
            </div>

            {/* ===============================
                FEATURE DROPDOWN
                =============================== */}

            <div
              className={`fp-field${
                errors.featureId ? " fp-field-invalid" : ""
              }`}
            >
              <label htmlFor="permission-feature">
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
                  <option value="">Select Feature</option>

                  {features.map((feature) => (
                    <option key={feature.id} value={feature.id}>
                      {feature.name}
                    </option>
                  ))}
                </select>

                <i className="bi bi-chevron-down" />
              </div>

              {errors.featureId && (
                <p className="fp-field-error">{errors.featureId}</p>
              )}
            </div>

            {/* ===============================
                DESCRIPTION
                =============================== */}

            <div className="fp-field fp-description-field">
              <label htmlFor="permission-description">Description</label>

              <textarea
                id="permission-description"
                data-field="description"
                value={form.description}
                onChange={updateField}
                onInput={(event) => {
                  event.currentTarget.style.height = "44px";
                  event.currentTarget.style.height = `${Math.max(
                    44,
                    event.currentTarget.scrollHeight,
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
              <label htmlFor="permission-status">Status</label>

              <div className="fp-select-wrap">
                <select
                  className={`fp-form-status-select ${form.status === "Inactive" ? "inactive" : "active"}`}
                  id="permission-status"
                  name="status"
                  value={form.status}
                  onChange={updateField}
                  autoComplete="off"
                >
                  <option value="Active">Active</option>

                  <option value="Inactive">Inactive</option>
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
              Cancel
            </button>

            <button
              type="submit"
              className="fp-btn fp-btn-primary"
              disabled={!canSubmit}
            >
              {isEditing ? "Update Permission" : "Create Permission"}
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          PERMISSIONS LIST
          ===================================================== */}

      <section className="fp-list-card">
        <div className="fp-list-toolbar">
          <h2>Permissions List</h2>

          <div className="fp-list-filters">
            {/* SEARCH */}

            <div className="fp-search">
              <i className="bi bi-search" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoComplete="off"
                placeholder="Search permissions..."
              />
            </div>

            {/* STATUS FILTER */}

            <div className="fp-status-filter">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                autoComplete="off"
              >
                <option value="All Statuses">All Status</option>

                <option value="Active">Active</option>

                <option value="Inactive">Inactive</option>
              </select>

              <i className="bi bi-chevron-down" />
            </div>

            {/* SORTING FILTER */}

            <div className="fp-sort-filter">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                autoComplete="off"
                aria-label="Sort permissions"
              >
                <option value="newest">Newest First</option>

                <option value="oldest">Oldest First</option>

                <option value="updated">Recently Updated</option>

                <option value="name-asc">Name A-Z</option>

                <option value="name-desc">Name Z-A</option>
              </select>

              <i className="bi bi-chevron-down" />
            </div>

            {/* RESET FILTER */}

            <button
              type="button"
              className="fp-reset-btn"
              title="Reset filters"
              aria-label="Reset filters"
              onClick={resetFilters}
            >
              <i className="bi bi-arrow-counterclockwise" />
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
                <th>Permission Key</th>

                <th>Permission Name</th>

                <th>Feature Name</th>

                <th>Description</th>

                <th>Status</th>

                <th>Created At</th>

                <th>Updated At</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedPermissions.map((permission) => (
                <tr key={permission.id}>
                  {/* Permission Key */}

                  <td className="fp-permission-code-cell">
                    {String(permission.key || "—").toUpperCase()}
                  </td>

                  {/* Permission Name */}

                  <td>{permission.name}</td>

                  {/* Feature Name */}

                  <td>{permission.featureName}</td>

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

                      {permission.status}
                    </span>
                  </td>

                  <td className="fp-date-cell">
                    {(() => {
                      const created = formatPermissionDate(
                        permission.createdAt,
                      );

                      return (
                        <div className="fp-date-stack">
                          <span className="fp-date-value">{created.date}</span>
                          {created.time && (
                            <span className="fp-time-value">
                              {created.time}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  <td className="fp-date-cell">
                    {(() => {
                      const updated = formatPermissionDate(
                        permission.updatedAt,
                      );

                      return (
                        <div className="fp-date-stack">
                          <span className="fp-date-value">{updated.date}</span>
                          {updated.time && (
                            <span className="fp-time-value">
                              {updated.time}
                            </span>
                          )}
                        </div>
                      );
                    })()}
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
                        onClick={() => editPermission(permission)}
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        className="delete delete-button"
                        aria-label={`Delete ${permission.name}`}
                        onClick={() => openDeleteConfirmation(permission)}
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            TABLE FOOTER
            =================================================== */}
        <div className="fp-list-footer">
          <span>
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of{" "}
            {totalEntries} entries
          </span>

          <div className="fp-pagination">
            {/* PREVIOUS BUTTON */}
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((prev) => Math.max(1, prev - 1));
              }}
            >
              <i className="bi bi-chevron-left" />
            </button>

            {/* PAGE NUMBERS */}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  className={currentPage === page ? "current" : ""}
                  onClick={() => {
                    setCurrentPage(page);
                  }}
                >
                  {page}
                </button>
              ),
            )}

            {/* NEXT BUTTON */}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((prev) => Math.min(totalPages, prev + 1));
              }}
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {permissionToDelete && (
        <div
          className="fp-delete-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteConfirmation();
            }
          }}
        >
          <div
            className="fp-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fp-delete-modal-title"
          >
            <div className="fp-delete-modal-icon">
              <i className="bi bi-trash3" />
            </div>

            <h2 id="fp-delete-modal-title">Delete Permission?</h2>

            <p className="fp-delete-modal-message">
              Are you sure you want to delete{" "}
              <strong>
                {permissionToDelete.name ||
                  permissionToDelete.key ||
                  "this permission"}
              </strong>
              ?
            </p>

            <p className="fp-delete-modal-warning">
              This action cannot be undone.
            </p>

            <div className="fp-delete-modal-actions">
              <button
                type="button"
                className="fp-delete-cancel-btn"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="fp-delete-confirm-btn"
                onClick={confirmDeletePermission}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
