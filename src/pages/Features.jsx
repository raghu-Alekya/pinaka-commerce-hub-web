import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/features.css";
import { listFeatures, createFeature as createFeatureApi, updateFeature as updateFeatureApi, deleteFeature as deleteFeatureApi } from "../api/features";

const initialFeatures = [];

const emptyForm = { code: "", name: "", description: "", category: "", status: "Active" };


function FeatureDescriptionCell({ description = "" }) {
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
    <td className="feature-description">
      <div className="feature-description-tooltip-wrap">
        <span ref={textRef} className="feature-description-clamp">
          {description || "—"}
        </span>
        {isTruncated && (
          <div className="feature-description-tooltip" role="tooltip">
            {description}
          </div>
        )}
      </div>
    </td>
  );
}

export default function Features() {
  const navigate = useNavigate();
  const [features, setFeatures] = useState(initialFeatures);
  const [apiError, setApiError] = useState("");
  useEffect(() => { listFeatures().then(setFeatures).catch((e) => setApiError(e.message || "Unable to load features.")); }, []);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sortBy, setSortBy] = useState("newest");
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      code: feature.code || feature.name.toUpperCase().replace(/\s+/g, "_"),
      name: feature.name,
      description: feature.description,
      category: feature.category,
      status: feature.status,
    });
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveFeature = async () => {
    if (!validateFeature()) return;
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase() };
      await createFeatureApi(payload);
      const latestFeatures = await listFeatures();

      setFeatures(latestFeatures);
      setCurrentPage(1);
      clearForm();
      setApiError("");
    } catch (e) {
      setApiError(e.message || "Unable to create feature.");
    }
  };

  const updateFeature = async () => {
    if (!validateFeature()) return;
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase() };
      await updateFeatureApi(editingId, payload);
      const latestFeatures = await listFeatures();

      setFeatures(latestFeatures);
      setCurrentPage(1);
      clearForm();
      setApiError("");
    } catch (e) {
      setApiError(e.message || "Unable to update feature.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All Statuses");
    setSortBy("newest");
  };

  const deleteFeature = async (featureId) => {
    try {
      await deleteFeatureApi(featureId);

      // Re-fetch from the API after delete so the table reflects the persisted backend state.
      const latestFeatures = await listFeatures();
      setFeatures(latestFeatures);
      setApiError("");
    } catch (e) {
      setApiError(e.message || "Unable to delete feature.");
      throw e;
    }
  };

  const confirmDeleteFeature = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFeature(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Keep the modal open when the delete request fails.
    }
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

  const totalEntries = filteredFeatures.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
  const paginatedFeatures = filteredFeatures.slice(startIndex, endIndex);


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
      <header className="features-page-heading">
        <h1>Features</h1>
        <p>Manage platform features and their details.</p>
      </header>

      {apiError && <p role="alert">{apiError}</p>}

      <section className="feature-details-card">
        <div className="feature-section-heading">
          <div className="feature-title-icon">
            <i className="bi bi-grid-1x2" />
          </div>
          <div>
            <h2>{isEditing ? "Edit Feature" : "Add Feature"}</h2>
            <p>Provide the basic details and configuration for this feature.</p>
          </div>
        </div>

        <div className="feature-form-grid">
          <div className="feature-field">
            <label>Feature Code<span>*</span></label>
            <input
              data-field="code"
              value={form.code}
              onChange={updateField}
              autoComplete="off"
              placeholder="Enter a unique code, e.g. INVENTORY_MANAGEMENT"
              className={formErrors.code ? "feature-input-error" : ""}
            />
            {formErrors.code ? (
              <small className="feature-error-text">{formErrors.code}</small>
            ) : (
              <small></small>
            )}
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
            <label>Feature Category<span>*</span></label>
            <div className="select-shell">
              <select
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  autoComplete="off"
                >
                  <option value="">Select category</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Payments">Payments</option>
                  <option value="Operations">Operations</option>
                  <option value="Cash Management">Cash Management</option>
                  <option value="Refund">Refund</option>
                  <option value="Promotions">Promotions</option>
                  <option value="Peripheral">Peripheral</option>
                  <option value="Billing">Billing</option>
                  <option value="Store Management">Store Management</option>
                  <option value="Reports">Reports</option>
                  <option value="Administration">Administration</option>
                  <option value="Integration">Integration</option>
                  <option value="KOT Management">KOT Management</option>
                  <option value="Kitchen Management">Kitchen Management</option>
                </select>
              <i className="bi bi-chevron-down" />
            </div>
            {formErrors.category ? (
              <small className="feature-error-text">{formErrors.category}</small>
            ) : (
              <small></small>
            )}
          </div>

          <div className="feature-field feature-form-status-field">
            <label>Status</label>
            <div className="select-shell">
              <select
                name="status"
                value={form.status}
                onChange={updateField}
                autoComplete="off"
                className={`feature-form-status-select ${form.status === "Inactive" ? "inactive" : "active"}`}
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
              {isEditing ? "Update Feature" : "Create Feature"}
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
                autoComplete="off"
              />
            </div>

            <div className="feature-filter-control">
              <select
                className="features-filter-select features-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All Statuses">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="updated">Recently Updated</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
              <i className="bi bi-chevron-down feature-filter-chevron" />
            </div>

            <button className="reset-filter" type="button" onClick={resetFilters}>
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
                <th>Feature Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedFeatures.map((item) => (
                <tr
                  key={item.id}
                  className="feature-clickable-row"
                  onClick={() =>
                    navigate(`/features/${item.id}/overview`, {
                      state: { feature: item },
                    })
                  }
                  role="link"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/features/${item.id}/overview`, {
                        state: { feature: item },
                      });
                    }
                  }}
                  aria-label={`Open ${item.name} feature overview`}
                >
                  <td className="feature-code-cell">
                    {(item.code || item.name?.replace(/\s+/g, "_") || "—").toUpperCase()}
                  </td>
                  <td className="feature-name-cell">
                    <span className="feature-name feature-name-button">
                      {item.name}
                    </span>
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
                      const created = formatFeatureDate(item.createdAt || item.createdOn || item.createdDate || item.created_at);
                      return (
                        <div className="feature-date-stack">
                          <strong>{created.date}</strong>
                          {created.time && <span className="feature-time">{created.time}</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="feature-updated">
                    {(() => {
                      const updated = formatFeatureDate(item.updatedAt || item.updatedOn || item.updatedDate || item.updated_at);
                      return (
                        <div className="feature-date-stack">
                          <strong>{updated.date}</strong>
                          {updated.time && <span className="feature-time">{updated.time}</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="actions-col">
                    <div className="feature-row-actions">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          editFeature(item);
                        }}
                        aria-label={`Edit ${item.name}`}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        aria-label={`Delete ${item.name}`}
                        title={`Delete ${item.name}`}
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
          <span>
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of {totalEntries} entries
          </span>
          <div className="feature-pagination">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left" />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? "current" : ""}
                onClick={() => setCurrentPage(page)}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              aria-label="Next page"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
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
