import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCategories, listFeatures, createFeature, updateFeature as persistFeature, deleteFeature, setFeatureStatus } from "../api/features";
import "../styles/features.css";

const emptyForm = { featureKey: "", name: "", description: "", category: "", type: "", status: "Active" };

export default function Features() {
  const navigate = useNavigate();
  const actionMenuRef = useRef(null);

  const [features, setFeatures] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [actionMenu, setActionMenu] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesAttempt, setCategoriesAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setCategoriesLoading(true);
    setCategoriesError("");
    getAllCategories()
      .then((items) => { if (active) setCategories(items); })
      .catch((error) => { if (active) setCategoriesError(error.message || "Unable to load categories"); })
      .finally(() => { if (active) setCategoriesLoading(false); });
    return () => { active = false; };
  }, [categoriesAttempt]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    listFeatures().then(items => { if (active) setFeatures(items); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const isEditing = editingId !== null;
  const editingFeature = features.find((item) => item.id === editingId);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const clearForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const editFeature = (feature) => {
    setEditingId(feature.id);
    setForm({
      featureKey: feature.featureKey,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      type: feature.type,
      status: feature.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveFeature = async () => {
    if (busy) return;
    if (!form.featureKey.trim() || !form.name.trim() || !form.category.trim() || !form.type.trim()) {
      setError("Feature key, name, category and type are required."); return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = isEditing ? await persistFeature(editingId, form) : await createFeature(form);
      setFeatures(items => isEditing ? items.map(item => item.id === editingId ? saved : item) : [saved, ...items]);
      setMessage(isEditing ? "Feature updated." : "Feature created.");
      clearForm();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const updateFeature = saveFeature;

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("All Categories");
    setStatusFilter("All Statuses");
  };

  const closeActionMenu = () => setActionMenu(null);

  const openActionMenu = (event, feature) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 245;
    const menuHeight = 150;
    const gap = 8;
    const screenPadding = 12;

    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;

    if (left < screenPadding) left = screenPadding;
    if (left + menuWidth > window.innerWidth - screenPadding) {
      left = window.innerWidth - menuWidth - screenPadding;
    }
    if (top + menuHeight > window.innerHeight - screenPadding) {
      top = rect.top - menuHeight - gap;
    }

    setActionMenu({ feature, top, left });
  };

  const handleConfigurePermissions = () => {
    if (!actionMenu?.feature) return;
    const selectedFeature = actionMenu.feature;
    closeActionMenu();
    navigate("/permissions", {
      state: {
        featureId: selectedFeature.id,
        featureName: selectedFeature.name,
        feature: selectedFeature,
      },
    });
  };

  const handleToggleFeatureStatus = async () => {
    if (busy || !actionMenu?.feature) return;
    const selected = actionMenu.feature;
    if (selected.status === "Active" && !window.confirm('Deactivate ' + selected.name + '?')) return;
    setBusy(true); setError(""); setMessage("");
    closeActionMenu();
    try {
      let saved;
      if (selected.status === "Active") {
        await deleteFeature(selected.id);
        saved = { ...selected, status: "Inactive" };
      } else { saved = await setFeatureStatus(selected.id, "ACTIVE"); }
      setFeatures(items => items.map(item => item.id === saved.id ? saved : item));
      if (editingId === saved.id) setForm(current => ({ ...current, status: saved.status }));
      setMessage("Feature status updated.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        closeActionMenu();
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") closeActionMenu();
    };

    if (actionMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", closeActionMenu, true);
      window.addEventListener("resize", closeActionMenu);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", closeActionMenu, true);
      window.removeEventListener("resize", closeActionMenu);
    };
  }, [actionMenu]);

  const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "All Categories" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [features, search, categoryFilter, statusFilter]);

  return (
    <div className="features-page">
      {error && <div role="alert">{error} <button onClick={() => setAttempt(n => n + 1)}>Retry list</button></div>}
      {message && <p role="status">{message}</p>}
      <section className="feature-details-card">
        <div className="feature-header-row">
          <div className="feature-title-wrap">
            <div className="feature-title-icon">
              <i className="bi bi-grid-1x2" />
            </div>
            <div>
              <h1>Features</h1>
              <p>Manage platform features and their details.</p>
            </div>
          </div>

          <div className="feature-header-actions">
            {isEditing ? (
              <>
                <span className="editing-chip">Editing: {editingFeature?.name}</span>
                <button className="feature-action secondary" type="button" disabled={busy || loading} onClick={clearForm}>
                  Cancel
                </button>
                <button className="feature-action primary" type="button" disabled={busy || loading} onClick={updateFeature}>
                  <i className="bi bi-floppy" />
                  Update Feature
                </button>
              </>
            ) : (
              <>
                <button className="feature-action secondary blue-text" type="button" disabled={busy || loading} onClick={clearForm}>
                  <i className="bi bi-arrow-repeat" />
                  Clear
                </button>
                <button className="feature-action primary" type="button" disabled={busy || loading} onClick={saveFeature}>
                  <i className="bi bi-floppy" />
                  Save Feature
                </button>
              </>
            )}
          </div>
        </div>

        <h2 className="feature-details-heading">Feature Details</h2>

        <fieldset disabled={busy || loading} className="feature-form-grid" style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="feature-field">
            <label>Feature Key<span>*</span></label>
            <input name="featureKey" value={form.featureKey} onChange={updateField} disabled={isEditing} maxLength={100} placeholder="e.g. LOYALTY" />
            <small>Unique key; cannot be changed after creation.</small>
          </div>
          <div className="feature-field">
            <label>Name:</label>
            <input name="name" maxLength={150} value={form.name} onChange={updateField} placeholder="e.g. REFUNDS" />
            <small>Display name shown in the system</small>
          </div>

          <div className="feature-field">
            <label>Description:</label>
            <input name="description" value={form.description} onChange={updateField} placeholder="Enter feature name" />
            <small>Feature metadata or display name</small>
          </div>

          <div className="feature-field">
            <label>Category<span>*</span></label>
            <div className="select-shell">
              <select name="category" value={form.category} onChange={updateField} disabled={categoriesLoading || Boolean(categoriesError)}>
                <option value="">{categoriesLoading ? "Loading categories..." : categoriesError ? "Unable to load categories" : categories.length ? "Select category" : "No categories available"}</option>
                {form.category && !categories.includes(form.category) && (
                  <option value={form.category}>{form.category}</option>
                )}
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            <small>e.g. POS / Orders / Cash / Workforce / etc.</small>
            {categoriesError && (
              <div role="alert">
                {categoriesError}{" "}
                <button type="button" onClick={() => setCategoriesAttempt((attempt) => attempt + 1)}>Retry</button>
              </div>
            )}
          </div>

          <div className="feature-field">
            <label>Feature Type<span>*</span></label>
            <input name="type" maxLength={20} value={form.type} onChange={updateField} placeholder="Enter feature type" />
            <small>BOOLEAN / LIMIT / CONFIG</small>
          </div>

          <div className="feature-field">
            <label>Status<span>*</span></label>
            <div className="select-shell">
              <select name="status" value={form.status} onChange={updateField}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            <small>Active or Inactive</small>
          </div>
        </fieldset>
      </section>

      <section className="features-list-card">
        <div className="features-list-toolbar">
          <h2>Features List</h2>
          <div className="features-filters">
            <div className="feature-search">
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="Search features..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="feature-filter-control">
              <select
                className="features-filter-select"
                value={categoryFilter}
                disabled={categoriesLoading || Boolean(categoriesError)}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All Categories">All Categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <i className="bi bi-chevron-down feature-filter-chevron" />
            </div>

            <div className="feature-filter-control">
              <select
                className="features-filter-select features-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <i className="bi bi-chevron-down feature-filter-chevron" />
            </div>

            <button className="reset-filter" type="button" onClick={resetFilters}>
              <i className="bi bi-arrow-repeat" />
              Reset
            </button>
          </div>
        </div>

        <div className="features-table-wrap">
          <table className="features-table">
            <colgroup>
              <col className="col-check" />
              <col className="col-name" />
              <col className="col-category" />
              <col className="col-description" />
              <col className="col-status" />
              <col className="col-created" />
              <col className="col-actions" />
            </colgroup>

            <thead>
              <tr>
                <th className="check-col"><input type="checkbox" /></th>
                <th>Feature Name <i className="bi bi-arrow-down-up" /></th>
                <th>Category <i className="bi bi-arrow-down-up" /></th>
                <th>Description <i className="bi bi-arrow-down-up" /></th>
                <th>Status <i className="bi bi-arrow-down-up" /></th>
                <th>Created At <i className="bi bi-arrow-down-up" /></th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && <tr><td colSpan={7} role="status">Loading features...</td></tr>}
              {!loading && !error && !filteredFeatures.length && <tr><td colSpan={7}>No features found.</td></tr>}
              {filteredFeatures.map((item) => (
                <tr key={item.id}>
                  <td className="check-col"><input type="checkbox" /></td>
                  <td>
                    <div className="feature-name">
                      <span className={`row-icon ${item.tone}`}>
                        <i className={`bi ${item.icon}`} />
                      </span>
                      {item.name}
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td className="feature-description">{item.description}</td>
                  <td>
                    <span className={`feature-status ${item.status.toLowerCase()}`}>
                      <b />{item.status}
                    </span>
                  </td>
                  <td className="feature-created">{item.createdAt}</td>
                  <td className="actions-col">
                    <div className="feature-row-actions">
                      <button type="button" className="edit-button" disabled={busy} onClick={() => editFeature(item)} aria-label={`Edit ${item.name}`}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        type="button"
                        className={`more-action-button ${actionMenu?.feature?.id === item.id ? "active" : ""}`}
                        disabled={busy} onClick={(event) => openActionMenu(event, item)}
                        aria-label={`More options for ${item.name}`}
                        aria-expanded={actionMenu?.feature?.id === item.id}
                      >
                        <i className="bi bi-three-dots-vertical" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="feature-pagination-row">
          <span>Showing {filteredFeatures.length} of {features.length} entries</span>
        </div>
      </section>

      {actionMenu && (
        <div
          ref={actionMenuRef}
          className="feature-actions-menu"
          style={{ top: `${actionMenu.top}px`, left: `${actionMenu.left}px` }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="feature-actions-title">Feature Actions</div>

          <button type="button" className="feature-menu-item configure" onClick={handleConfigurePermissions}>
            <span className="feature-menu-icon permission-icon">
              <i className="bi bi-shield-check" />
            </span>
            <span>Configure Permissions</span>
          </button>

          <button
            type="button"
            className={`feature-menu-item ${actionMenu.feature.status === "Active" ? "deactivate" : "activate"}`}
            onClick={handleToggleFeatureStatus}
          >
            <span className="feature-menu-icon">
              <i className={actionMenu.feature.status === "Active" ? "bi bi-slash-circle" : "bi bi-check-circle"} />
            </span>
            <span>
              {actionMenu.feature.status === "Active" ? "Deactivate Feature" : "Activate Feature"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
