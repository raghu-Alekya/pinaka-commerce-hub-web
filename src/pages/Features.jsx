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

  const requiredFieldsComplete =
    form.code.trim() !== "" &&
    form.name.trim() !== "" &&
    form.category.trim() !== "";

  const hasEditChanges =
    !isEditing ||
    !editingFeature ||
    form.code.trim().toUpperCase() !==
      String(
        editingFeature.code ||
          editingFeature.name?.toUpperCase().replace(/\s+/g, "_") ||
          ""
      ).trim().toUpperCase() ||
    form.name.trim() !== String(editingFeature.name || "").trim() ||
    form.description.trim() !== String(editingFeature.description || "").trim() ||
    form.category !== String(editingFeature.category || "") ||
    form.status !== String(editingFeature.status || "Active");

  const canSubmitFeature =
    requiredFieldsComplete &&
    (!isEditing || hasEditChanges);

  const updateField = (event) => {
    const field = event.target.dataset.field || event.target.name;
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateFeature = () => {
    const errors = {};
    const code = form.code.trim();
    const name = form.name.trim();

    if (!code) errors.code = "Feature Code is required.";
    if (!name) errors.name = "Feature Name is required.";
    if (!form.category) errors.category = "Category is required.";

    if (code && features.some(
      (item) =>
        String(item.id) !== String(editingId) &&
        (item.code || "").trim().toLowerCase() === code.toLowerCase()
    )) {
      errors.code = "Feature Code already exists. Enter a unique code.";
    }

    if (name && features.some(
      (item) =>
        String(item.id) !== String(editingId) &&
        item.name.trim().toLowerCase() === name.toLowerCase()
    )) {
      errors.name = "Feature Name already exists. Enter a unique name.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const editFeature = (feature) => {
    setEditingId(feature.id);
    setForm({
      featureKey: feature.featureKey,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      status: feature.status,
    });
    setFormErrors({});
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
    setStatusFilter("All Statuses");
    setSortBy("newest");
  };

  const deleteFeature = async (featureId) => {
    try { await deleteFeature(featureId); setFeatures((prev) => prev.filter((item) => item.id !== featureId)); setApiError(""); } catch (e) { setApiError(e.message || "Unable to delete feature."); }
  };

  const confirmDeleteFeature = async () => {
    if (!deleteTarget) return;
    await deleteFeature(deleteTarget.id);
    setDeleteTarget(null);
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

    const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    const getCreatedTime = (item) => {
      const value = item.createdAt || item.createdOn || item.createdDate || item.created_at;
      const time = value ? new Date(value).getTime() : 0;
      return Number.isNaN(time) ? 0 : time;
    };

    const getUpdatedTime = (item) => {
      const value = item.updatedAt || item.updatedOn || item.updatedDate || item.updated_at;
      const time = value ? new Date(value).getTime() : 0;
      return Number.isNaN(time) ? 0 : time;
    };

    const result = features.filter((item) => {
      const matchesSearch =
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.code || "").toLowerCase().includes(q) ||
        String(item.category || "").toLowerCase().includes(q) ||
        String(item.description || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sortBy === "oldest") return getCreatedTime(a) - getCreatedTime(b);
      if (sortBy === "updated") return getUpdatedTime(b) - getUpdatedTime(a);
      if (sortBy === "name-asc") return String(a.name || "").localeCompare(String(b.name || ""));
      if (sortBy === "name-desc") return String(b.name || "").localeCompare(String(a.name || ""));
      return getCreatedTime(b) - getCreatedTime(a);
    });
  }, [features, search, statusFilter, sortBy]);


  const formatFeatureDate = (value) => {
    if (!value) return { date: "—", time: "" };

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return { date: String(value), time: "" };
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
    <div className="features-page">
      {error && <div role="alert">{error} <button onClick={() => setAttempt(n => n + 1)}>Retry list</button></div>}
      {message && <p role="status">{message}</p>}
      <section className="feature-details-card">
        <div className="feature-section-heading">
          <div className="feature-title-icon">
            <i className="bi bi-grid-1x2" />
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

        <fieldset disabled={busy || loading} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="feature-form-grid">
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
            <label>Feature Name<span>*</span></label>
            <input
              data-field="name"
              value={form.name}
              onChange={updateField}
              autoComplete="off"
              placeholder="Enter a unique feature name, e.g. Inventory Management"
              className={formErrors.name ? "feature-input-error" : ""}
            />
            {formErrors.name ? (
              <small className="feature-error-text">{formErrors.name}</small>
            ) : (
              <small> </small>
            )}
          </div>

          <div className="feature-field feature-description-field">
            <label>Description</label>
            <textarea
              data-field="description"
              value={form.description}
              onChange={updateField}
              onInput={(event) => {
                event.currentTarget.style.height = "44px";
                event.currentTarget.style.height = `${Math.max(44, event.currentTarget.scrollHeight)}px`;
              }}
              autoComplete="off"
              placeholder="Describe the feature and its purpose."
              maxLength={500}
            />
            <div className="feature-description-meta">
              <small></small>
              <span>{form.description.length}/500</span>
            </div>
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

          <div className="feature-field feature-form-status-field">
            <label>Status</label>
            <div className="select-shell">
              <select name="status" value={form.status} onChange={updateField} autoComplete="off">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            <small> </small>
          </div>
        </div>

        <div className="feature-form-footer">
<div className="feature-footer-actions">
            <button className="feature-action secondary" type="button" onClick={clearForm}>
              {isEditing ? "Cancel" : "Cancel"}
            </button>
            <button
              className="feature-action primary"
              type="button"
              onClick={isEditing ? updateFeature : saveFeature}
              disabled={!canSubmitFeature}
            >
              {isEditing ? "Update Feature" : "Save Feature"}
            </button>
          </div>
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
                autoComplete="off"
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

            <div className="feature-filter-control feature-sort-control">
              <select
                className="features-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort features"
              >
                <option value="newest">Newly Created First</option>
                <option value="oldest">Oldest Created First</option>
                <option value="updated">Recently Updated First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
              <i className="bi bi-chevron-down feature-filter-chevron" />
            </div>

            <button
             type="button"
               className="feature-filter-reset-icon"
               title="Reset filters"
               aria-label="Reset filters"
                onClick={resetFilters}
                 >
                 <i className="bi bi-arrow-counterclockwise" />
                 </button>
          </div>
        </div>

        <div className="features-table-wrap">
          <table className="features-table">
            <colgroup>
              <col className="col-code" />
              <col className="col-name" />
              <col className="col-category" />
              <col className="col-description" />
              <col className="col-status" />
              <col className="col-created" />
              <col className="col-updated" />
              <col className="col-actions" />
            </colgroup>

            <thead>
              <tr>
                <th>Feature Code</th>
                <th>Feature Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && <tr><td colSpan={7} role="status">Loading features...</td></tr>}
              {!loading && !error && !filteredFeatures.length && <tr><td colSpan={7}>No features found.</td></tr>}
              {filteredFeatures.map((item) => (
                <tr key={item.id}>
                  <td className="feature-code-cell">
                    {(item.code || item.name?.replace(/\s+/g, "_") || "—").toUpperCase()}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="feature-name feature-name-button"
                      onClick={() => navigate(`/features/${item.id}/overview`, { state: { feature: item } })}
                    >
                      {item.name}
                    </button>
                  </td>
                  <td>{item.category}</td>
                  <FeatureDescriptionCell description={item.description} />
                  <td>
                    <span className={`feature-status ${item.status.toLowerCase()}`}>
                      <b />{item.status}
                    </span>
                  </td>
                  <td className="feature-created">
                    {(() => {
                      const created = formatFeatureDate(item.createdAt);
                      return (
                        <div className="feature-date-stack">
                          <span>{created.date}</span>
                          {created.time && <span className="feature-time">{created.time}</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="feature-updated">
                    {(() => {
                      const updated = formatFeatureDate(item.updatedAt);
                      return (
                        <div className="feature-date-stack">
                          <span>{updated.date}</span>
                          {updated.time && <span className="feature-time">{updated.time}</span>}
                        </div>
                      );
                    })()}
                  </td>
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
                        <i className="bi bi-trash" />
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

      {deleteTarget && (
        <div
          className="features-delete-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-feature-title"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="features-delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="features-delete-icon">
              <i className="bi bi-trash" />
            </div>

            <h2 id="delete-feature-title">Delete Feature?</h2>

            <p>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>

            <p className="features-delete-final-warning">
              This action cannot be undone.
            </p>

            <div className="features-delete-actions">
              <button
                type="button"
                className="features-delete-keep-button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="features-delete-confirm-button"
                onClick={confirmDeleteFeature}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
