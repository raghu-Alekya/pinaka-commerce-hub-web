import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Store, Search, Plus, X, Trash2 } from "lucide-react";
import { getFeature } from '../api/features';
import { listFeaturePermissions, createFeaturePermission, deleteFeaturePermission } from '../api/featurePermissionsApi';

import "../styles/featurepermissiondetails.css";
import "../styles/feature-detail-header.css";

const FeaturePermissions = () => {
  const navigate = useNavigate();
  const { featureId } = useParams();
  const [permissions, setPermissions] = useState([]);
  const [feature, setFeature] = useState(null);
  const [error, setError] = useState('');
  React.useEffect(() => { Promise.all([getFeature(featureId), listFeaturePermissions(featureId)]).then(([f, list]) => { setFeature(f); setPermissions(list.map(p => ({ ...p, key: p.permissionKey || p.key || '', feature: f?.name || p.feature?.name || '', active: String(p.status || '').toUpperCase() === 'ACTIVE' }))); }).catch(e => setError(e.message || 'Unable to load permissions.')); }, [featureId]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ key: '', name: '', description: '', status: 'Active' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return permissions.filter((permission) => {
      const matchesSearch =
        permission.key.toLowerCase().includes(query) ||
        permission.name.toLowerCase().includes(query) ||
        permission.feature.toLowerCase().includes(query) ||
        permission.description.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && permission.active) ||
        (filter === "inactive" && !permission.active);

      return matchesSearch && matchesFilter;
    });
  }, [permissions, search, filter]);

  const confirmDeletePermission = async () => {
    if (!deleteTarget?.id || deleting) return;
    try {
      setDeleting(true);
      setError('');
      await deleteFeaturePermission(featureId, deleteTarget.id);
      setPermissions((current) =>
        current.filter((permission) => permission.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
    } catch (e) {
      setError(e.message || 'Unable to delete permission.');
    } finally {
      setDeleting(false);
    }
  };

  const openCreateModal = () => {
    setForm({ key: '', name: '', description: '', status: 'Active' });
    setFormError('');
    setIsCreateOpen(true);
  };

  const saveNewPermission = async (event) => {
    event.preventDefault();
    const key = form.key.trim();
    const name = form.name.trim();
    if (!key || !name) { setFormError('Permission Key and Permission Name are required.'); return; }
    setSaving(true); setFormError('');
    try {
const created = await createFeaturePermission(featureId, {
  permissionKey: key,
  name,
  featureId,
  description: form.description.trim(),
  status: form.status.toUpperCase()
});      const item = created?.data || created?.permission || created || {};
      setPermissions(current => [{ ...item, id: item.id || `${featureId}-${Date.now()}`, key: item.permissionKey || item.key || key, name: item.permissionName || item.name || name, feature: feature?.name || item.feature?.name || '', description: item.description || form.description.trim(), active: String(item.status || form.status).toUpperCase() === 'ACTIVE' }, ...current]);
      setIsCreateOpen(false);
    } catch (e) { setFormError(e.message || 'Unable to create permission.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fp-page feature-detail-page">
      <section className="feature-detail-header">
        <div className="feature-detail-top">
          <button
  type="button"
  className="feature-detail-back"
  onClick={() => navigate("/features")}
  aria-label="Back to Features"
  title="Back to Features"
>
  <i className="bi bi-arrow-left" />
</button>
          <div className="feature-detail-copy"><h1>{feature?.name || "Feature"}</h1><p>{feature?.description || "Manage permissions for this feature."}</p></div>
        </div>
        <nav className="feature-detail-tabs" aria-label="Feature sections">
          <button type="button" className="feature-detail-tab" onClick={() => navigate(`/features/${featureId}/overview`)}>Overview</button>
          <button type="button" className="feature-detail-tab" onClick={() => navigate(`/features/${featureId}/store-types`)}>Applicable Store Types</button>
          <button type="button" className="feature-detail-tab active">Feature &amp; Permission Access</button>
        </nav>
      </section>


      {/* =====================================================
          PERMISSIONS CARD
      ====================================================== */}

      <section className="fp-permissions-card">

        {/* TOP */}

        <div className="fp-card-header">

          <div className="fp-title-section">

            <div className="fp-shield-icon">
              <ShieldCheck size={20} strokeWidth={2.1} />
            </div>

            <div className="fp-title-copy">
              <h2>Permissions List ({permissions.length})</h2>

              <p>
                Manage and configure permissions for this feature.
              </p>
            </div>

          </div>


          {/* SEARCH + FILTER */}

          <div className="fp-toolbar">

            <button type="button" className="fp-create-permission-btn" onClick={openCreateModal}>
              <span aria-hidden="true">+</span> Create Feature Permission
            </button>

            <div className="fp-search-box">

              <Search size={17} strokeWidth={2} />

              <input
                type="text"
                placeholder="Search permissions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

            </div>


            <div className="fp-filter-wrapper">

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="fp-filter"
              >
                <option value="all">All Permissions</option>
                <option value="active">Active Permissions</option>
                <option value="inactive">Inactive Permissions</option>
              </select>

              <ChevronDown
                size={16}
                strokeWidth={2}
                className="fp-filter-chevron"
              />

            </div>

          </div>

        </div>


        {/* =====================================================
            TABLE
        ====================================================== */}

        <div className="fp-table-wrapper">

          <table className="fp-table">

            <thead>

              <tr>

                <th>
                  <div className="fp-table-heading">
                    Permission Key
                  </div>
                </th>


                <th>
                  <div className="fp-table-heading">
                    Permission Name
                  </div>
                </th>


                <th>
                  <div className="fp-table-heading">
                    Feature
                  </div>
                </th>


                <th>
                  <div className="fp-table-heading">
                    Description
                  </div>
                </th>


                <th className="fp-actions-heading">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {error && <p role="alert">{error}</p>}
              {filteredPermissions.map((permission) => (

                <tr key={permission.key}>

                  {/* PERMISSION KEY */}

                  <td className="fp-permission-key">
                    {permission.key}
                  </td>


                  {/* PERMISSION NAME */}

                  <td className="fp-permission-name">
                    {permission.name}
                  </td>


                  {/* FEATURE */}

                  <td className="fp-feature-name">
                    {permission.feature}
                  </td>


                  {/* DESCRIPTION */}

                  <td className="fp-description">
                    {permission.description}
                  </td>


                  {/* DELETE */}

                  <td className="fp-action-cell">

                    <button
                      type="button"
                      className="fp-delete"
                      onClick={() => setDeleteTarget(permission)}
                      aria-label={`Delete ${permission.name}`}
                    >

                      <Trash2
                        size={15}
                        strokeWidth={2}
                      />

                    </button>

                  </td>

                </tr>

              ))}


              {/* EMPTY STATE */}

              {filteredPermissions.length === 0 && (

                <tr>

                  <td
                    colSpan="5"
                    className="fp-empty-state"
                  >
                    No permissions found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="fp-table-footer">

          <p className="fp-results-text">
            Showing{" "}
            {filteredPermissions.length > 0 ? 1 : 0} to{" "}
            {filteredPermissions.length} of{" "}
            {filteredPermissions.length} entries
          </p>


          <div className="fp-pagination">

            <button
              type="button"
              className="fp-page-button fp-arrow"
              disabled
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>


            <button
              type="button"
              className="fp-page-button active"
            >
              1
            </button>


            <button
              type="button"
              className="fp-page-button fp-arrow"
              disabled
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>

          </div>

        </div>

      </section>

      {isCreateOpen && (
        <div className="fp-modal-backdrop" role="presentation" onMouseDown={() => !saving && setIsCreateOpen(false)}>
          <div className="fp-create-modal" role="dialog" aria-modal="true" aria-labelledby="fp-create-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="fp-modal-header">
              <div><h2 id="fp-create-title">Add New Feature Permission</h2><p>Create a permission for {feature?.name || 'this feature'}.</p></div>
              <button type="button" className="fp-modal-close" onClick={() => !saving && setIsCreateOpen(false)} aria-label="Close">×</button>
            </div>
            <form className="fp-create-form" onSubmit={saveNewPermission}>
              <div className="fp-create-grid">
                <label>Permission Key <span>*</span><input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. refunds.view" autoFocus /></label>
                <label>Permission Name <span>*</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. View Refunds" /></label>
                <label className="fp-create-description">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what this permission allows users to do" rows={3} /></label>
                <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
              </div>
              {formError && <p className="fp-modal-error" role="alert">{formError}</p>}
              <div className="fp-modal-actions"><button type="button" className="fp-modal-cancel" onClick={() => !saving && setIsCreateOpen(false)} disabled={saving}>Cancel</button><button type="submit" className="fp-modal-save" disabled={saving}>{saving ? 'Saving...' : 'Save Permission'}</button></div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fp-delete-overlay" role="dialog" aria-modal="true"
          aria-labelledby="fp-delete-title"
          onMouseDown={() => !deleting && setDeleteTarget(null)}>
          <div className="fp-delete-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="fp-delete-modal-icon"><Trash2 size={23} strokeWidth={2} /></div>
            <h2 id="fp-delete-title">Delete Permission?</h2>
            <p>Are you sure you want to delete <strong>{deleteTarget.name || deleteTarget.key}</strong>?</p>
            <p className="fp-delete-warning">This action cannot be undone.</p>
            <div className="fp-delete-modal-actions">
              <button type="button" className="fp-delete-cancel-button"
                onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="fp-delete-confirm-button"
                onClick={confirmDeletePermission} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeaturePermissions;