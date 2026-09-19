import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeTypesApi } from "../api/storeTypes";
import {
  listFeatures,
  createFeature as createFeatureApi,
  updateFeature as updateFeatureApi,
  deleteFeature as deleteFeatureApi,
} from "../api/features";
import "../styles/features.css";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  category: "",
  price: "",
  type: "BOOLEAN",
  status: "Active",
};

export default function Features() {
  const navigate = useNavigate();
  const actionMenuRef = useRef(null);

  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [actionMenu, setActionMenu] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [storeTypes, setStoreTypes] = useState([]);
  const [storeTypesLoading, setStoreTypesLoading] = useState(false);

  const isEditing = editingId !== null;
  const editingFeature = features.find((item) => item.id === editingId);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      setApiError("");
      const data = await listFeatures();
      setFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load features:", err);
      setApiError(err?.message || "Failed to load features from server.");
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreTypes = async () => {
    try {
      setStoreTypesLoading(true);
      const response = await storeTypesApi.getAll();
      if (Array.isArray(response)) {
        setStoreTypes(response);
      } else if (Array.isArray(response?.data)) {
        setStoreTypes(response.data);
      } else if (Array.isArray(response?.storeTypes)) {
        setStoreTypes(response.storeTypes);
      } else {
        setStoreTypes([]);
      }
    } catch (error) {
      console.error("Failed to load store types:", error);
      setStoreTypes([]);
    } finally {
      setStoreTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
    fetchStoreTypes();
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateFeature = () => {
    const errors = {};
    const code = (form.code || "").trim();
    const name = (form.name || "").trim();

    if (!code) errors.code = "Feature Code is required.";
    if (!name) errors.name = "Feature Name is required.";

    if (
      code &&
      features.some(
        (item) =>
          item.id !== editingId &&
          (item.code || "").trim().toLowerCase() === code.toLowerCase()
      )
    ) {
      errors.code = "Feature Code already exists. Enter a unique code.";
    }

    if (
      name &&
      features.some(
        (item) =>
          item.id !== editingId &&
          (item.name || "").trim().toLowerCase() === name.toLowerCase()
      )
    ) {
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
      code: feature.code || (feature.name || "").toUpperCase().replace(/\s+/g, "_"),
      name: feature.name || "",
      price: feature.price !== undefined && feature.price !== null ? feature.price : "",
      description: feature.description || "",
      category: feature.category || "",
      type: feature.type || "BOOLEAN",
      status: feature.status || "Active",
    });
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveFeature = async () => {
    if (!validateFeature()) return;
    try {
      setSubmitting(true);
      setApiError("");
      const created = await createFeatureApi(form);
      setFeatures((prev) => [created, ...prev]);
      clearForm();
    } catch (e) {
      setApiError(e?.message || "Unable to create feature.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFeature = async () => {
    if (!validateFeature()) return;
    try {
      setSubmitting(true);
      setApiError("");
      const updated = await updateFeatureApi(editingId, form);
      setFeatures((prev) =>
        prev.map((item) => (item.id === editingId ? updated : item))
      );
      clearForm();
    } catch (e) {
      setApiError(e?.message || "Unable to update feature.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatureStatus = async () => {
    if (!actionMenu?.feature) return;
    const selectedFeature = actionMenu.feature;
    const nextStatus = selectedFeature.status === "Active" ? "Inactive" : "Active";
    closeActionMenu();

    try {
      setSubmitting(true);
      const updated = await updateFeatureApi(selectedFeature.id, {
        ...selectedFeature,
        status: nextStatus,
      });
      setFeatures((prev) =>
        prev.map((item) => (item.id === selectedFeature.id ? updated : item))
      );
      if (editingId === selectedFeature.id) {
        setForm((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
      setApiError(err?.message || "Failed to toggle feature status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFeature = async (featureId) => {
    const idToDelete = featureId || actionMenu?.feature?.id;
    if (!idToDelete) return;
    const itemToDelete = features.find((f) => f.id === idToDelete);
    closeActionMenu();

    if (!window.confirm(`Are you sure you want to delete "${itemToDelete?.name || "this feature"}"?`)) {
      return;
    }

    try {
      setSubmitting(true);
      await deleteFeatureApi(idToDelete);
      setFeatures((prev) => prev.filter((item) => item.id !== idToDelete));
      if (editingId === idToDelete) clearForm();
    } catch (err) {
      console.error("Failed to delete feature:", err);
      setApiError(err?.message || "Failed to delete feature.");
    } finally {
      setSubmitting(false);
    }
  };

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
    const menuHeight = 180;
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
    navigate(`/features/${selectedFeature.id}/permissions`, {
      state: {
        featureId: selectedFeature.id,
        featureName: selectedFeature.name,
        feature: selectedFeature,
      },
    });
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

  // Safe Dynamic Filtering with Null Checks
  const filteredFeatures = useMemo(() => {
    if (!Array.isArray(features)) return [];
    const q = (search || "").trim().toLowerCase();
    return features.filter((item) => {
      if (!item) return false;
      const name = (item.name || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      const code = (item.code || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        category.includes(q) ||
        description.includes(q) ||
        code.includes(q);

      const matchesCategory =
        categoryFilter === "All Categories" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All Statuses" ||
        String(item.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [features, search, categoryFilter, statusFilter]);

  return (
    <div className="features-page">
      <header className="features-page-heading">
        <h1>Features</h1>
        <p>Manage platform features and their details.</p>
      </header>

      {apiError && (
        <div
          style={{
            marginBottom: "14px",
            padding: "10px 14px",
            background: "#fde8e8",
            border: "1px solid #f8b4b4",
            borderRadius: "6px",
            color: "#9b1c1c",
            fontSize: "13px",
          }}
        >
          {apiError}
        </div>
      )}

      <section className="feature-details-card">
        <div className="feature-section-heading">
          <div className="feature-title-icon">
            <i className="bi bi-grid-1x2" />
          </div>
          <div>
            <h2>Feature Details</h2>
            <p>Provide the basic details and configuration for this feature.</p>
          </div>
        </div>

        <div className="feature-form-grid">
          <div className="feature-field">
            <label>
              Feature Code<span>*</span>
            </label>
            <input
              name="code"
              value={form.code || ""}
              onChange={updateField}
              placeholder="Enter a unique code, e.g. INVENTORY_MANAGEMENT"
              className={formErrors.code ? "feature-input-error" : ""}
            />
            {formErrors.code && (
              <small className="feature-error-text">{formErrors.code}</small>
            )}
          </div>

          <div className="feature-field">
            <label>
              Feature Name<span>*</span>
            </label>
            <input
              name="name"
              value={form.name || ""}
              onChange={updateField}
              placeholder="Enter a unique feature name, e.g. Inventory Management"
              className={formErrors.name ? "feature-input-error" : ""}
            />
            {formErrors.name && (
              <small className="feature-error-text">{formErrors.name}</small>
            )}
          </div>

          <div className="feature-field">
            <label>
              Category<span>*</span>
            </label>
            <div className="select-shell">
              <select
                name="category"
                value={form.category || ""}
                onChange={updateField}
                disabled={submitting || storeTypesLoading}
              >
                <option value="">
                  {storeTypesLoading ? "Loading categories..." : "Select category"}
                </option>
                {storeTypes.map((st) => (
                  <option key={st.id} value={st.name || st.storeTypeName}>
                    {st.name || st.storeTypeName}
                  </option>
                ))}
                <option value="Restaurant">Restaurant</option>
                <option value="Customer Engagement">Customer Engagement</option>
                <option value="Orders">Orders</option>
                <option value="Cash Management">Cash Management</option>
                <option value="Stock Control">Stock Control</option>
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            {formErrors.category && (
              <small className="feature-error-text">{formErrors.category}</small>
            )}
          </div>

          <div className="feature-field">
            <label>Price</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price || ""}
              onChange={updateField}
              placeholder="Enter price e.g. $29.92"
            />
          </div>

          <div className="feature-field feature-description-field">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description || ""}
              onChange={updateField}
              placeholder="Explain what the feature does, where it is used, and its purpose."
              maxLength={500}
            />
            <div className="feature-description-meta">
              <span style={{ marginLeft: "auto" }}>
                {(form.description || "").length}/500
              </span>
            </div>
          </div>

          <div className="feature-field feature-form-status-field">
            <label>Status</label>
            <div className="select-shell">
              <select
                name="status"
                value={form.status || "Active"}
                onChange={updateField}
                disabled={submitting}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <i className="bi bi-chevron-down" />
            </div>
          </div>
        </div>

        <div className="feature-form-footer">
          {isEditing && (
            <span className="editing-chip">
              Editing: {editingFeature?.name || "Feature"}
            </span>
          )}

          <div className="feature-footer-actions">
            {isEditing ? (
              <>
                <button
                  className="feature-action secondary"
                  type="button"
                  onClick={clearForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="feature-action primary"
                  type="button"
                  onClick={handleUpdateFeature}
                  disabled={submitting}
                >
                  <i className="bi bi-floppy" />
                  {submitting ? "Updating..." : "Update Feature"}
                </button>
              </>
            ) : (
              <>
                <button
                  className="feature-action secondary blue-text"
                  type="button"
                  onClick={clearForm}
                  disabled={submitting}
                >
                  <i className="bi bi-arrow-repeat" />
                  Clear
                </button>
                <button
                  className="feature-action primary"
                  type="button"
                  onClick={saveFeature}
                  disabled={submitting}
                >
                  <i className="bi bi-floppy" />
                  {submitting ? "Saving..." : "Save Feature"}
                </button>
              </>
            )}
          </div>
        </div>
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
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All Categories">All Categories</option>
                {storeTypes.map((st) => (
                  <option key={st.id} value={st.name || st.storeTypeName}>
                    {st.name || st.storeTypeName}
                  </option>
                ))}
                <option value="Restaurant">Restaurant</option>
                <option value="Customer Engagement">Customer Engagement</option>
                <option value="Orders">Orders</option>
                <option value="Cash Management">Cash Management</option>
                <option value="Stock Control">Stock Control</option>
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
              <col className="col-name" />
              <col className="col-category" />
              <col className="col-price" />
              <col className="col-description" />
              <col className="col-status" />
              <col className="col-created" />
              <col className="col-actions" />
            </colgroup>

            <thead>
              <tr>
                <th>Feature Name <i className="bi bi-arrow-down-up" /></th>
                <th>Category <i className="bi bi-arrow-down-up" /></th>
                <th>Price <i className="bi bi-arrow-down-up" /></th>
                <th>Description <i className="bi bi-arrow-down-up" /></th>
                <th>Status <i className="bi bi-arrow-down-up" /></th>
                <th>Created At <i className="bi bi-arrow-down-up" /></th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    Loading features...
                  </td>
                </tr>
              ) : filteredFeatures.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    No features found.
                  </td>
                </tr>
              ) : (
                filteredFeatures.map((item) => {
                  const statusStr = String(item.status || "Active");
                  const isItemActive = statusStr.toLowerCase() === "active";
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="feature-name">
                          <span className={`row-icon ${item.tone || "purple"}`}>
                            <i className={`bi ${item.icon || "bi-diamond"}`} />
                          </span>
                          {item.name}
                        </div>
                      </td>
                      <td>{item.category || "—"}</td>
                      <td className="feature-price">
                        {item.price !== "" && item.price !== undefined && item.price !== null
                          ? `$${Number(item.price).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="feature-description">{item.description || "—"}</td>
                      <td>
                        <span className={`feature-status ${isItemActive ? "active" : "inactive"}`}>
                          <b />
                          {statusStr}
                        </span>
                      </td>
                      <td className="feature-created">{item.createdAt || "—"}</td>
                      <td className="actions-col">
                        <div className="feature-row-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => editFeature(item)}
                            aria-label={`Edit ${item.name}`}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            type="button"
                            className={`more-action-button ${
                              actionMenu?.feature?.id === item.id ? "active" : ""
                            }`}
                            onClick={(event) => openActionMenu(event, item)}
                            aria-label={`More options for ${item.name}`}
                            aria-expanded={actionMenu?.feature?.id === item.id}
                          >
                            <i className="bi bi-three-dots-vertical" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="feature-pagination-row">
          <span>
            Showing {filteredFeatures.length} of {features.length} entries
          </span>
          <div className="feature-pagination">
            <button type="button" aria-label="Previous page">
              <i className="bi bi-chevron-left" />
            </button>
            <button type="button" className="current">
              1
            </button>
            <button type="button" aria-label="Next page">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
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

          <button
            type="button"
            className="feature-menu-item configure"
            onClick={handleConfigurePermissions}
          >
            <span className="feature-menu-icon permission-icon">
              <i className="bi bi-shield-check" />
            </span>
            <span>Configure Permissions</span>
          </button>

          <button
            type="button"
            className={`feature-menu-item ${
              String(actionMenu.feature.status || "").toLowerCase() === "active"
                ? "deactivate"
                : "activate"
            }`}
            onClick={handleToggleFeatureStatus}
          >
            <span className="feature-menu-icon">
              <i
                className={
                  String(actionMenu.feature.status || "").toLowerCase() === "active"
                    ? "bi bi-slash-circle"
                    : "bi bi-check-circle"
                }
              />
            </span>
            <span>
              {String(actionMenu.feature.status || "").toLowerCase() === "active"
                ? "Deactivate Feature"
                : "Activate Feature"}
            </span>
          </button>

          <button
            type="button"
            className="feature-menu-item delete"
            onClick={() => handleDeleteFeature()}
            style={{ color: "#dc2626" }}
          >
            <span className="feature-menu-icon" style={{ color: "#dc2626" }}>
              <i className="bi bi-trash" />
            </span>
            <span>Delete Feature</span>
          </button>
        </div>
      )}
    </div>
  );
}
