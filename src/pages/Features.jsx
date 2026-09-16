import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/features.css";

const initialFeatures = [
  { id: 1, name: "Loyalty", category: "Customer Engagement", description: "Manage loyalty programs and rewards.", status: "Active", createdAt: "Apr 10, 2026 02:15 PM", type: "BOOLEAN", icon: "bi-diamond", tone: "purple" },
  { id: 2, name: "KDS", category: "Restaurant", description: "Kitchen Display System for order management.", status: "Active", createdAt: "Apr 08, 2026 11:42 AM", type: "BOOLEAN", icon: "bi-display", tone: "amber" },
  { id: 3, name: "Delivery", category: "Orders", description: "Manage delivery orders and logistics.", status: "Active", createdAt: "Apr 05, 2026 09:30 AM", type: "BOOLEAN", icon: "bi-truck", tone: "blue" },
  { id: 4, name: "Safe Drop", category: "Cash Management", description: "Secure cash drop and pickup management.", status: "Inactive", createdAt: "Apr 02, 2026 04:12 PM", type: "BOOLEAN", icon: "bi-shield-check", tone: "red" },
  { id: 5, name: "Inventory", category: "Stock Control", description: "Track and manage inventory levels in real-time.", status: "Active", createdAt: "Apr 12, 2026 10:00 AM", type: "BOOLEAN", icon: "bi-diamond", tone: "purple" },
];

const emptyForm = { name: "", description: "", category: "", type: "", status: "Active" };

export default function Features() {
  const navigate = useNavigate();
  const actionMenuRef = useRef(null);

  const [features, setFeatures] = useState(initialFeatures);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [actionMenu, setActionMenu] = useState(null);

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
      name: feature.name,
      description: feature.description,
      category: feature.category,
      type: feature.type,
      status: feature.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveFeature = () => {
    if (!form.name.trim()) return;
    setFeatures((prev) => [
      {
        id: Date.now(),
        ...form,
        category: form.category || "Uncategorized",
        createdAt: "Apr 12, 2026 10:00 AM",
        icon: "bi-diamond",
        tone: "purple",
      },
      ...prev,
    ]);
    clearForm();
  };

  const updateFeature = () => {
    setFeatures((prev) =>
      prev.map((item) =>
        item.id === editingId ? { ...item, ...form } : item
      )
    );
    clearForm();
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
                <button className="feature-action secondary" type="button" onClick={clearForm}>
                  Cancel
                </button>
                <button className="feature-action primary" type="button" onClick={updateFeature}>
                  <i className="bi bi-floppy" />
                  Update Feature
                </button>
              </>
            ) : (
              <>
                <button className="feature-action secondary blue-text" type="button" onClick={clearForm}>
                  <i className="bi bi-arrow-repeat" />
                  Clear
                </button>
                <button className="feature-action primary" type="button" onClick={saveFeature}>
                  <i className="bi bi-floppy" />
                  Save Feature
                </button>
              </>
            )}
          </div>
        </div>

        <h2 className="feature-details-heading">Feature Details</h2>

        <div className="feature-form-grid">
          <div className="feature-field">
            <label>Name:</label>
            <input name="name" value={form.name} onChange={updateField} placeholder="e.g. REFUNDS" />
            <small>Unique key (e.g. REFUNDS / KDS / LOYALTY)</small>
          </div>

          <div className="feature-field">
            <label>Description:</label>
            <input name="description" value={form.description} onChange={updateField} placeholder="Enter feature name" />
            <small>Feature metadata or display name</small>
          </div>

          <div className="feature-field">
            <label>Category<span>*</span></label>
            <div className="select-shell">
              <select name="category" value={form.category} onChange={updateField}>
                <option value="">Select category</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Customer Engagement">Customer Engagement</option>
                <option value="Orders">Orders</option>
                <option value="Cash Management">Cash Management</option>
                <option value="Stock Control">Stock Control</option>
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            <small>e.g. POS / Orders / Cash / Workforce / etc.</small>
          </div>

          <div className="feature-field">
            <label>Feature Type<span>*</span></label>
            <input name="type" value={form.type} onChange={updateField} placeholder="Enter feature type" />
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="feature-pagination-row">
          <span>Showing 1 to 5 of 18 entries</span>
          <div className="feature-pagination">
            <button type="button" aria-label="Previous page"><i className="bi bi-chevron-left" /></button>
            <button type="button" className="current">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
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
