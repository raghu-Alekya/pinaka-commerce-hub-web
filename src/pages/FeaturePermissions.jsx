import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/featurepermissions.css";

import {
  createPermission,
  deletePermission as deletePermissionApi,
  listPermissions,
  updatePermission,
} from "../api/permissions";
import { listFeatures } from "../api/features";

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
  const { featureId: routeFeatureId } = useParams();

  const [features, setFeatures] = useState([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState(routeFeatureId || "");
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [loading, setLoading] = useState(true);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = editingId !== null;
  const hasUnsavedChanges = Object.keys(emptyForm).some(
    (field) => form[field] !== savedForm[field]
  );

  /* =========================================================
     UPDATE FIELD
     ========================================================= */

  const loadFeatures = async () => {
    try {
      setFeaturesLoading(true);
      const result = await listFeatures();
      setFeatures(Array.isArray(result) ? result : []);

      if (routeFeatureId) {
        setSelectedFeatureId(routeFeatureId);
      } else if (!selectedFeatureId && result.length === 1) {
        setSelectedFeatureId(String(result[0].id));
      }
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to load features.");
    } finally {
      setFeaturesLoading(false);
    }
  };

  const loadPermissions = async (featureId = selectedFeatureId) => {
    if (!featureId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await listPermissions({ featureId });
      const permissionList = Array.isArray(response)
        ? response
        : Array.isArray(response?.permissions)
        ? response.permissions
        : Array.isArray(response?.data?.permissions)
        ? response.data.permissions
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setPermissions(permissionList);
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, [routeFeatureId]);

  useEffect(() => {
    loadPermissions(selectedFeatureId);
    setEditingId(null);
    setForm(emptyForm);
  }, [selectedFeatureId]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  /* =========================================================
     CLEAR / RESET FORM
     ========================================================= */

  const clearForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  const savePermission = async (event) => {
    event?.preventDefault();
    setError("");
    setSuccess("");

    const featureId = String(selectedFeatureId || "").trim();
    const permissionKey = String(form.key || "").trim().toUpperCase();
    const name = String(form.name || "").trim();
    const description = String(form.description || "").trim();
    const status = String(form.status || "ACTIVE").trim().toUpperCase();
//
    if (!featureId) return setError("Please select a feature.");
    if (!permissionKey) return setError("Permission key is required.");
    if (!name) return setError("Permission name is required.");

    const payload = { featureId, permissionKey, name, description, status };

    try {
      setSaving(true);
      if (editingId) {
        await updatePermission(editingId, { name, description, status });
        setSuccess("Permission updated successfully.");
      } else {
        await createPermission(payload);
        setSuccess("Permission created successfully.");
      }
      await loadPermissions(featureId);
      clearForm();
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to save permission.");
    } finally {
      setSaving(false);
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
          <div><h2>Permission Information</h2><p>Create a new permission or edit an existing permission.</p></div>
          <div className="fp-mode-chip">{isEditing ? `Editing: ${form.key}` : "Creating New Permission"}</div>
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
        <div className="fp-list-toolbar"><h2>Permissions List ({filteredPermissions.length})</h2><div className="fp-list-filters"><div className="fp-search"><i className="bi bi-search" /><input placeholder="Search permissions..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="fp-status-filter"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All Statuses">All Statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><i className="bi bi-chevron-down" /></div><button type="button" className="fp-reset-btn" onClick={() => { setSearch(""); setStatusFilter("All Statuses"); }}><i className="bi bi-arrow-repeat" /> Reset</button></div></div>
        <div className="fp-table-wrap"><table className="fp-table"><thead><tr><th>Permission Key</th><th>Permission Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className="fp-empty-cell">Loading permissions...</td></tr> : !selectedFeatureId ? <tr><td colSpan="5" className="fp-empty-cell">Select a feature to view permissions.</td></tr> : filteredPermissions.length === 0 ? <tr><td colSpan="5" className="fp-empty-cell">No permissions found.</td></tr> : filteredPermissions.map((permission) => { const id = permission.id; const status = String(permission.status || "ACTIVE").toUpperCase(); return <tr key={id}><td>{permission.permissionKey || permission.key || "-"}</td><td>{permission.name || "-"}</td><td className="fp-description-cell">{permission.description || "-"}</td><td><span className={`fp-status-pill ${status.toLowerCase()}`}><b />{status === "ACTIVE" ? "Active" : "Inactive"}</span></td><td><div className="fp-row-actions"><button type="button" className="edit" onClick={() => editPermission(permission)} disabled={saving || deletingId !== null}><i className="bi bi-pencil" /></button><button type="button" className="copy" onClick={() => duplicatePermission(permission)} disabled={saving || deletingId !== null}><i className="bi bi-copy" /></button><button type="button" className="delete" onClick={() => deletePermission(id)} disabled={saving || deletingId === id}><i className="bi bi-trash3" /></button></div></td></tr>; })}</tbody></table></div>
      </section>

    </div>
  );
}