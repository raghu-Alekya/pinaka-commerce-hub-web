import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  roleTemplatesApi,
  readRoleTemplatesList,
} from "../api/roleTemplatesApi";

const initialForm = {
  roleCode: "",
  name: "",
  description: "",
  status: "ACTIVE",
};

function displayDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

export default function RoleTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deletePopup, setDeletePopup] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  async function loadTemplates() {
    setLoading(true);
    setError("");

    try {
      const response = await roleTemplatesApi.getAll();
      const items = readRoleTemplatesList(response);

      const validItems = items.filter((item) => item?.id != null);

      setTemplates(validItems);

      setSelectedIds((currentIds) =>
        currentIds.filter((id) =>
          validItems.some((template) => template.id === id)
        )
      );
    } catch (err) {
      setError(
        err?.message || "Unable to load role templates."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      const searchableText = [
        template.roleCode,
        template.name,
        template.description,
        template.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        String(template.status).toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [templates, search, statusFilter]);

  const allVisibleSelected =
    filteredTemplates.length > 0 &&
    filteredTemplates.every((template) =>
      selectedIds.includes(template.id)
    );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  }

  async function saveTemplate() {
    const values = {
      roleCode: form.roleCode.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
    };

   

    if (!/^[A-Z0-9_]+$/.test(values.roleCode)) {
      setError(
        "Role code must contain only uppercase letters, numbers, and underscores."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId !== null) {
        await roleTemplatesApi.update(editingId, values);
      } else {
        await roleTemplatesApi.create(values);
      }

      await loadTemplates();
      resetForm();
    } catch (err) {
      setError(
        err?.message || "Unable to save role template."
      );
    } finally {
      setSaving(false);
    }
  }

  function editTemplate(template) {
    setEditingId(template.id);

    setForm({
      roleCode: template.roleCode || "",
      name: template.name || "",
      description: template.description || "",
      status: template.status || "ACTIVE",
    });

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openDeletePopup(template) {
    setTemplateToDelete(template);
    setDeletePopup(true);
    setError("");
  }

  function closeDeletePopup() {
    if (saving) return;

    setDeletePopup(false);
    setTemplateToDelete(null);
  }

  async function confirmDeleteTemplate() {
    if (!templateToDelete?.id) return;

    setSaving(true);
    setError("");

    try {
      await roleTemplatesApi.remove(templateToDelete.id);

      setTemplates((currentTemplates) =>
        currentTemplates.filter(
          (template) => template.id !== templateToDelete.id
        )
      );

      setSelectedIds((currentIds) =>
        currentIds.filter((id) => id !== templateToDelete.id)
      );

      if (editingId === templateToDelete.id) {
        resetForm();
      }

      closeDeletePopup();
    } catch (err) {
      setError(
        err?.message || "Unable to delete role template."
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleSelection(id) {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((itemId) => itemId !== id)
        : [...currentIds, id]
    );
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((currentIds) =>
        currentIds.filter(
          (id) =>
            !filteredTemplates.some(
              (template) => template.id === id
            )
        )
      );
    } else {
      setSelectedIds((currentIds) => [
        ...new Set([
          ...currentIds,
          ...filteredTemplates.map((template) => template.id),
        ]),
      ]);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setSelectedIds([]);
  }

  return (
    <>
      <section className="role-templates-page">
        <div className="role-details-card">
          <div className="role-page-heading">
            <div className="role-title-wrap">
              <div className="role-title-icon">
                <i className="bi bi-grid-1x2" />
              </div>

              <div>
                <h1>Role Templates</h1>
                <p>
                  Create and manage role templates using feature
                  permissions.
                </p>
              </div>
            </div>

            <div className="role-heading-actions">
              <span className="role-mode-pill">
                {editingId !== null ? "Editing" : "Creating New"}
              </span>

              <button
                type="button"
                className="role-secondary-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="role-primary-btn"
                onClick={saveTemplate}
                disabled={saving}
              >
                <i className="bi bi-floppy" />

                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Role Template"
                  : "Save Role Template"}
              </button>
            </div>
          </div>

          {error && (
            <p className="role-error-message" role="alert">
              {error}
            </p>
          )}

          <div className="role-section-title">
            Role Template Details
          </div>

          <div className="role-form-grid">
            <label className="role-field">
              <span>
                Role Code <b>*</b>
              </span>

              <input
                type="text"
                name="roleCode"
                value={form.roleCode}
                onChange={handleChange}
                placeholder="e.g. CASHIER"
                maxLength={50}
              />

              <small>
                Unique code using uppercase letters and underscores.
              </small>
            </label>

            <label className="role-field">
              <span>
                Role Template Name <b>*</b>
              </span>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter role template name"
                maxLength={100}
              />

              <small>
                Display name for the role template.
              </small>
            </label>

            <label className="role-field">
              <span>
                Status <b>*</b>
              </span>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <small>Active or Inactive.</small>
            </label>


            <label className="role-field role-description-field">
              <span>Description</span>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter a brief description..."
                rows={3}
                maxLength={250}
              />

              <small>
                Explain the purpose of this role template.
              </small>
            </label>
          </div>
        </div>

        <div className="role-list-card">
          <div className="role-list-header">
            <div>
              <h2>Role Templates List</h2>

              <p>
                Manage role templates and their assigned feature
                permissions.
              </p>
            </div>

            <div className="role-filters">
              <div className="role-search">
                <i className="bi bi-search" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search role templates..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                aria-label="Filter by status"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <button
                type="button"
                className="role-reset-btn"
                onClick={resetFilters}
              >
                <i className="bi bi-arrow-repeat" />
                Reset
              </button>
            </div>
          </div>

          <div className="role-table-wrap">
            <table className="role-table">
              <thead>
                <tr>
                  <th className="role-check-col">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select all role templates"
                    />
                  </th>

                  <th className="role-code-col">
                    Role Code
                  </th>

                  <th className="role-name-col">
                    Role Template Name
                  </th>

                  <th className="role-description-col">
                    Description
                  </th>

                  <th className="role-status-col">
                    Status
                  </th>

                  <th className="role-created-col">
                    Created On
                  </th>

                  <th className="role-actions-col">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTemplates.map((template, index) => (
                  <tr key={template.id}>
                    <td className="role-check-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(template.id)}
                        onChange={() =>
                          toggleSelection(template.id)
                        }
                        aria-label={`Select ${
                          template.name || template.roleCode
                        }`}
                      />
                    </td>

                    <td className="role-code-cell">
                      <div className="role-key-cell">
                        <span
                          className={`role-row-icon role-icon-${
                            (index % 5) + 1
                          }`}
                        >
                          <i className="bi bi-person-badge" />
                        </span>

                        <strong>
                          {template.roleCode || "—"}
                        </strong>
                      </div>
                    </td>

                    <td className="role-name-cell">
                      <button
                        type="button"
                        className="role-name-link"
                        onClick={() => navigate(`/role-templates/${template.id}`)} >
                        {template.name || "—"}
                      </button>
                   </td>

                    <td className="role-description-cell">
                      {template.description || "-"}
                    </td>

                    <td className="role-status-cell">
                      <span
                        className={`role-status ${String(
                          template.status || ""
                        ).toLowerCase()}`}
                      >
                        <i />

                        {String(template.status).toUpperCase() ===
                        "ACTIVE"
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="role-created-cell">
                      {displayDate(
                        template.createdAt ||
                          template.created_at ||
                          template.createdDate
                      )}
                    </td>

                    <td className="role-actions">
                      <button
                        type="button"
                        onClick={() => editTemplate(template)}
                        disabled={saving}
                        aria-label={`Edit ${
                          template.name || template.roleCode
                        }`}
                        title="Edit role template"
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openDeletePopup(template)}
                        disabled={saving}
                        aria-label={`Delete ${
                          template.name || template.roleCode
                        }`}
                        title="Delete role template"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTemplates.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="role-empty-state"
                    >
                      {loading
                        ? "Loading role templates..."
                        : "No role templates found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="role-pagination">
            <span>
              Showing {filteredTemplates.length} of{" "}
              {templates.length} entries
            </span>
          </div>
        </div>
      </section>

      {deletePopup && templateToDelete && (
        <div
          className="role-delete-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-role-template-title"
        >
          <div className="role-delete-modal">
            <div className="role-delete-icon">
              <i className="bi bi-trash" />
            </div>

            <h3 id="delete-role-template-title">
              Delete Role Template?
            </h3>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {templateToDelete.name ||
                  templateToDelete.roleCode}
              </strong>
              ?
            </p>

            <p>
              This action cannot be undone.
            </p>

            <div className="role-delete-actions">
              <button
                type="button"
                className="role-secondary-btn"
                onClick={closeDeletePopup}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="role-delete-confirm-btn"
                onClick={confirmDeleteTemplate}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}