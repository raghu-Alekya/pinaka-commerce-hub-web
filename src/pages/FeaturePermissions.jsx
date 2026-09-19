import { useEffect, useMemo, useState } from "react";
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
  status: "ACTIVE",
};

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

  const loadPermissions = async (featureId = selectedFeatureId) => {
    if (!featureId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const payload = {
      ...(isEditing ? {} : { permissionKey: permissionKey.toUpperCase() }),
      name: permissionName,
      description: form.description.trim(),
      status: form.status.toUpperCase(),
    };

    try {
      const response = isEditing
        ? await updateFeaturePermission(selectedFeature.id, editingId, payload)
        : await createFeaturePermission(selectedFeature.id, payload);

      // Reload from the backend so the UI reflects the actual saved row,
      // including server-generated IDs and normalized fields.
      await loadData();
      clearForm();
    } catch (error) {
      console.error("Save permission failed:", error);
      window.alert(error?.message || "Unable to save permission.");
    }
  };

  /* =========================================================
     CLEAR / RESET FORM
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

  const editPermission = (permission) => {
    setEditingId(permission.id);
    setForm({
      key: permission.permissionKey || permission.key || "",
      name: permission.name || "",
      description: permission.description || "",
      status: String(permission.status || "ACTIVE").toUpperCase(),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicatePermission = async (permission) => {
    if (!selectedFeatureId || saving) return;
    try {
      setSaving(true);
      setError("");
      await createPermission({
        featureId: selectedFeatureId,
        permissionKey: `${String(permission.permissionKey || permission.key || "PERMISSION").toUpperCase()}_COPY`,
        name: `${permission.name || "Permission"} Copy`,
        description: permission.description || "",
        status: String(permission.status || "ACTIVE").toUpperCase(),
      });
      await loadPermissions(selectedFeatureId);
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to duplicate permission.");
    } finally {
      setSaving(false);
    }
  };

  const deletePermission = async (permissionId) => {
    if (!permissionId || deletingId !== null) return;
    if (!window.confirm("Are you sure you want to deactivate this permission?")) return;
    try {
      setDeletingId(permissionId);
      await deletePermissionApi(permissionId);
      await loadPermissions(selectedFeatureId);
      if (editingId === permissionId) clearForm();
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to delete permission.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return permissions.filter((permission) => {
      const key = String(permission.permissionKey || permission.key || "").toLowerCase();
      const name = String(permission.name || "").toLowerCase();
      const description = String(permission.description || "").toLowerCase();
      const status = String(permission.status || "ACTIVE").toUpperCase();
      return (key.includes(query) || name.includes(query) || description.includes(query)) &&
        (statusFilter === "All Statuses" || status === statusFilter);
    });
  }, [permissions, search, statusFilter]);

  const selectedFeature = features.find((feature) => String(feature.id) === String(selectedFeatureId));

  return (
    <div className="feature-permissions-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="fp-page-head">
        <div className="fp-title-wrap"><div><h1>Feature Permissions</h1><p>Manage feature permissions and permission access.</p></div></div>
      </div>

      {error && <div className="fp-error-message" role="alert">{error}</div>}
      {success && <div className="fp-success-message" role="status">{success}</div>}

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

        <div className="fp-form-grid">
          <div className="fp-field">
            <label>Feature <span>*</span></label>
            <div className="fp-select-wrap">
              <select value={selectedFeatureId} onChange={(event) => setSelectedFeatureId(event.target.value)} disabled={featuresLoading || isEditing}>
                <option value="">Select feature</option>
                {features.map((feature) => (
                  <option key={feature.id} value={feature.id}>
                    {feature.name || feature.featureKey || feature.featureName}
                  </option>
                ))}
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            <small>{selectedFeature ? `Feature ID: ${selectedFeature.id}` : "Select the feature this permission belongs to."}</small>
          </div>

          <div className="fp-field"><label>Permission Key <span>*</span></label><input type="text" name="key" value={form.key} onChange={updateField} placeholder="e.g. VIEW_REFUND" disabled={isEditing} /><small>Unique key for the permission. Use UPPERCASE with underscores.</small></div>
          <div className="fp-field"><label>Permission Name <span>*</span></label><input type="text" name="name" value={form.name} onChange={updateField} placeholder="Enter permission name" /><small>Display name for the permission.</small></div>
          <div className="fp-field"><label>Status <span>*</span></label><div className="fp-select-wrap"><select name="status" value={form.status} onChange={updateField}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><i className="bi bi-chevron-down" /></div><small>Active or Inactive.</small></div>
          <div className="fp-field fp-description-field"><label>Description</label><textarea name="description" value={form.description} onChange={updateField} placeholder="Enter a brief description of what this permission allows..." /><small>Explain what this permission allows users to do.</small></div>
        </div>

        <div className="fp-form-actions"><button type="button" className="fp-btn fp-btn-secondary" onClick={clearForm} disabled={saving}><i className="bi bi-arrow-counterclockwise" /> Reset</button><button type="button" className="fp-btn fp-btn-primary" onClick={savePermission} disabled={saving}><i className="bi bi-floppy" />{saving ? "Saving..." : isEditing ? "Update Permission" : "Save Permission"}</button></div>
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
                  Feature Name
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

                    {/* Feature Name */}

                    <td>
                      {
                        permission.featureName
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