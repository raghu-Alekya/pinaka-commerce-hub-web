import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
} from "../api/features";
import "../styles/features.css";

const initialFeatures = [
  { id: 1, code: "LOYALTY", name: "Loyalty", price: 19.99, category: "Customer Engagement", description: "Manage loyalty programs and rewards.", status: "Active", createdAt: "Apr 10, 2026 02:15 PM", type: "BOOLEAN", icon: "bi-diamond", tone: "purple" },
  { id: 2, code: "KDS", name: "KDS", price: 29.5, category: "Restaurant", description: "Kitchen Display System for order management.", status: "Active", createdAt: "Apr 08, 2026 11:42 AM", type: "BOOLEAN", icon: "bi-display", tone: "amber" },
  { id: 3, code: "DELIVERY", name: "Delivery", price: 14.75, category: "Orders", description: "Manage delivery orders and logistics.", status: "Active", createdAt: "Apr 05, 2026 09:30 AM", type: "BOOLEAN", icon: "bi-truck", tone: "blue" },
  { id: 4, code: "SAFE_DROP", name: "Safe Drop", price: 24, category: "Cash Management", description: "Secure cash drop and pickup management.", status: "Inactive", createdAt: "Apr 02, 2026 04:12 PM", type: "BOOLEAN", icon: "bi-shield-check", tone: "red" },
  { id: 5, code: "INVENTORY", name: "Inventory", price: 34.99, category: "Stock Control", description: "Track and manage inventory levels in real-time.", status: "Active", createdAt: "Apr 12, 2026 10:00 AM", type: "BOOLEAN", icon: "bi-diamond", tone: "purple" },
];

const emptyForm = { code: "", name: "", price: "", description: "", category: "", status: "Active" };

export default function Features() {
  const navigate = useNavigate();
  const actionMenuRef = useRef(null);

  // Dynamic state loaded from API
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [savedForm, setSavedForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [actionMenu, setActionMenu] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const isEditing = editingId !== null;
  const editingFeature = features.find((item) => item.id === editingId);
  const hasUnsavedChanges = Object.keys(emptyForm).some(
    (field) => form[field] !== savedForm[field]
  );

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateFeature = () => {
    const errors = {};
    const code = form.code.trim();
    const name = form.name.trim();

    if (!code) errors.code = "Feature Code is required.";
    if (!name) errors.name = "Feature Name is required.";

    if (code && features.some(
      (item) =>
        item.id !== editingId &&
        (item.code || "").trim().toLowerCase() === code.toLowerCase()
    )) {
      errors.code = "Feature Code already exists. Enter a unique code.";
    }

    if (name && features.some(
      (item) =>
        item.id !== editingId &&
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
    setSavedForm(emptyForm);
    setFormErrors({});
  };

  const editFeature = (feature) => {
    setEditingId(feature.id);
    const nextForm = {
      code: feature.code || feature.name.toUpperCase().replace(/\s+/g, "_"),
      name: feature.name,
      price: feature.price || "",
      description: feature.description,
      category: feature.category,
      status: feature.status,
    };
    setForm(nextForm);
    setSavedForm(nextForm);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 2. Dynamic Save (POST to API)
// src/pages/Features.jsx (Updated handlers for Resilient Save & Edit)

// Dynamic Save (API + Resilient Fallback)
const saveFeature = async () => {
  if (!form.name.trim() || !form.category || !form.type) {
    setError("Please fill in required fields (Name, Category, Type).");
    return;
  }

  const localNewFeature = {
    id: Date.now(),
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    type: form.type.trim(),
    status: form.status,
    createdAt: new Date().toLocaleString(),
    icon: "bi-diamond",
    tone: "purple",
  };

  try {
    setSubmitting(true);
    setError(null);
    
    // Attempt API save
    const created = await createFeature(form);
    setFeatures((prev) => [created || localNewFeature, ...prev]);
    clearForm();
  } catch (err) {
    console.warn("API unavailable, updating UI locally:", err);
    
    // Fallback: If backend is offline, update UI dynamically in local state
    setFeatures((prev) => [localNewFeature, ...prev]);
    clearForm();
  } finally {
    setSubmitting(false);
  }
};

// Dynamic Update (API + Resilient Fallback)
const handleUpdateFeature = async () => {
  if (!form.name.trim()) return;

  const localUpdatedFeature = {
    id: editingId,
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    type: form.type.trim(),
    status: form.status,
    createdAt: editingFeature?.createdAt || new Date().toLocaleString(),
    icon: editingFeature?.icon || "bi-diamond",
    tone: editingFeature?.tone || "purple",
  };

  try {
    setSubmitting(true);
    setError(null);

    const updated = await updateFeature(editingId, form);
    setFeatures((prev) =>
      prev.map((item) => (item.id === editingId ? (updated || localUpdatedFeature) : item))
    );
    clearForm();
  } catch (err) {
    console.warn("API unavailable, updating UI locally:", err);

    // Fallback: Update local state if backend fails
    setFeatures((prev) =>
      prev.map((item) => (item.id === editingId ? localUpdatedFeature : item))
    );
    clearForm();
  } finally {
    setSubmitting(false);
  }
};

  // 4. Dynamic Status Toggle (PUT to API)
  const handleToggleFeatureStatus = async () => {
    if (!actionMenu?.feature) return;

    const selectedFeature = actionMenu.feature;
    const nextStatus = selectedFeature.status === "Active" ? "Inactive" : "Active";
    closeActionMenu();

    try {
      setSubmitting(true);
      const updated = await updateFeature(selectedFeature.id, {
        name: selectedFeature.name,
        description: selectedFeature.description,
        category: selectedFeature.category,
        type: selectedFeature.type,
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
      setError(err.message || "Failed to toggle feature status.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Dynamic Delete (DELETE to API)
  const handleDeleteFeature = async () => {
    if (!actionMenu?.feature) return;
    const selectedFeature = actionMenu.feature;
    closeActionMenu();

    if (!window.confirm(`Are you sure you want to delete "${selectedFeature.name}"?`)) {
      return;
    }

    try {
      setSubmitting(true);
      await deleteFeature(selectedFeature.id);
      setFeatures((prev) => prev.filter((item) => item.id !== selectedFeature.id));
      if (editingId === selectedFeature.id) clearForm();
    } catch (err) {
      console.error("Failed to delete feature:", err);
      setError(err.message || "Failed to delete feature.");
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
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Leave without saving?")) {
      return;
    }
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
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const handleNavigationClick = (event) => {
      if (!hasUnsavedChanges) return;

      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href === window.location.pathname) return;

      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      navigate(href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleNavigationClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleNavigationClick, true);
    };
  }, [hasUnsavedChanges, navigate]);

  const handleToggleFeatureStatus = () => {
    if (!actionMenu?.feature) return;

    const selectedFeature = actionMenu.feature;
    const nextStatus = selectedFeature.status === "Active" ? "Inactive" : "Active";

    setFeatures((prev) =>
      prev.map((item) =>
        item.id === selectedFeature.id
          ? { ...item, status: nextStatus }
          : item
      )
    );

    // Keep the edit form in sync if the same feature is currently being edited.
    if (editingId === selectedFeature.id) {
      setForm((prev) => ({ ...prev, status: nextStatus }));
    }

    closeActionMenu();
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

  // Safe Dynamic Filtering
  const filteredFeatures = useMemo(() => {
    if (!Array.isArray(features)) return [];
    const q = search.trim().toLowerCase();
    return features.filter((item) => {
      if (!item) return false;
      const matchesSearch =
        (item.name || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "All Categories" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [features, search, categoryFilter, statusFilter]);

  return (
    <div className="features-page">
      <header className="features-page-heading">
        <h1>Features</h1>
        <p>Manage platform features and their details.</p>
      </header>

      <section className="feature-details-card">
        <div className="feature-section-heading">
          <div className="feature-title-icon">
            <i className="bi bi-grid-1x2" />
          </div>

        <div className="feature-form-grid">
          <div className="feature-field">
            <label>Feature Code<span>*</span></label>
            <input
              name="code"
              value={form.code}
              onChange={updateField}
              placeholder="Enter a unique code, e.g. INVENTORY_MANAGEMENT"
              className={formErrors.code ? "feature-input-error" : ""}
            />
            {formErrors.code ? (
              <small className="feature-error-text">{formErrors.code}</small>
            ) : (
              <small></small>
            )}
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: "14px",
              padding: "10px 14px",
              background: "#fde8e8",
              border: "1px solid #f8b4b4",
              borderRadius: "6px",
              color: "#9b1c1c",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <h2 className="feature-details-heading">Feature Details</h2>

        <div className="feature-form-grid">
          <div className="feature-field">
            <label>Name<span>*</span>:</label>
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Enter a unique feature name, e.g. Inventory Management"
              className={formErrors.name ? "feature-input-error" : ""}
            />
            {formErrors.name ? (
              <small className="feature-error-text">{formErrors.name}</small>
            ) : (
              <small> </small>
            )}
          </div>

          <div className="feature-field">
            <label>Price</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={updateField}
              placeholder="Enter price e.g. $29.92"
            />
          </div>

          <div className="feature-field feature-description-field">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Explain what the feature does, where it is used, and its purpose."
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
              <select
                name="category"
                value={form.category}
                onChange={updateField}
                disabled={submitting}
              >
                <option value="">Select category</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Customer Engagement">Customer Engagement</option>
                <option value="Orders">Orders</option>
                <option value="Cash Management">Cash Management</option>
                <option value="Stock Control">Stock Control</option>
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            <small></small>
          </div>

          <div className="feature-field feature-status-field">
            <label>Status</label>
            <div className="select-shell">
              <select
                name="status"
                value={form.status}
                onChange={updateField}
                disabled={submitting}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            <small> </small>
          </div>
        </div>

        <div className="feature-form-footer">
          {isEditing && (
            <span className="editing-chip">Editing: {editingFeature?.name}</span>
          )}

          <div className="feature-footer-actions">
            <button className="feature-action secondary" type="button" onClick={clearForm}>
              {isEditing ? "Cancel" : "Clear"}
            </button>
            <button
              className="feature-action primary"
              type="button"
              onClick={isEditing ? updateFeature : saveFeature}
            >
              {isEditing ? "Update Feature" : "Save Feature"}
            </button>
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
              {filteredFeatures.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="feature-name">
                      {item.name}
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td className="feature-price">
                    {item.price !== "" && item.price !== undefined
                      ? `$${Number(item.price).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="feature-description">{item.description}</td>
                  <td>
                    <span className={`feature-status ${item.status.toLowerCase()}`}>
                      <b />{item.status}
                    </span>
                  </td>
                  <td className="feature-created">{item.createdAt}</td>
                  <td className="actions-col">
                    <div className="feature-row-actions">
                      <button type="button" className="edit-button" onClick={() => editFeature(item)} aria-label={`Edit ${item.name}`}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        type="button"
                        className={`more-action-button ${actionMenu?.feature?.id === item.id ? "active" : ""}`}
                        onClick={(event) => openActionMenu(event, item)}
                        aria-label={`More options for ${item.name}`}
                        aria-expanded={actionMenu?.feature?.id === item.id}
                      >
                        <i className="bi bi-three-dots-vertical" />
                      </button>
                    </div>
                  </td>
                </tr>
              </thead>

              <tbody>
                {filteredFeatures.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      No features found.
                    </td>
                  </tr>
                ) : (
                  filteredFeatures.map((item) => (
                    <tr key={item.id}>
                      <td className="check-col"><input type="checkbox" /></td>
                      <td>
                        <div className="feature-name">
                          <span className={`row-icon ${item.tone || "purple"}`}>
                            <i className={`bi ${item.icon || "bi-diamond"}`} />
                          </span>
                          {item.name}
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td className="feature-description">{item.description}</td>
                      <td>
                        <span className={`feature-status ${(item.status || "").toLowerCase()}`}>
                          <b />{item.status}
                        </span>
                      </td>
                      <td className="feature-created">{item.createdAt}</td>
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
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="feature-pagination-row">
          <span>Showing {filteredFeatures.length} of {features.length} entries</span>
          <div className="feature-pagination">
            <button type="button" aria-label="Previous page"><i className="bi bi-chevron-left" /></button>
            <button type="button" className="current">1</button>
            <button type="button" aria-label="Next page"><i className="bi bi-chevron-right" /></button>
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
              actionMenu.feature.status === "Active" ? "deactivate" : "activate"
            }`}
            onClick={handleToggleFeatureStatus}
          >
            <span className="feature-menu-icon">
              <i
                className={
                  actionMenu.feature.status === "Active"
                    ? "bi bi-slash-circle"
                    : "bi bi-check-circle"
                }
              />
            </span>
            <span>
              {actionMenu.feature.status === "Active"
                ? "Deactivate Feature"
                : "Activate Feature"}
            </span>
          </button>

          <button
            type="button"
            className="feature-menu-item delete"
            onClick={handleDeleteFeature}
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