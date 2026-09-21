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

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RoleTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
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

  // Use existing role-template values as optional form suggestions.
  // These suggestions are only shown while entering data; they are not added to the table.
  const roleCodeSuggestions = useMemo(
    () =>
      [...new Set(
        templates
          .map((template) => String(template.roleCode || "").trim())
          .filter(Boolean)
      )],
    [templates]
  );

  const roleNameSuggestions = useMemo(
    () =>
      [...new Set(
        templates
          .map((template) => String(template.name || "").trim())
          .filter(Boolean)
      )],
    [templates]
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

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
  }

  return (
    <>
      <section className="role-templates-page">
        <div className="role-templates-page-heading">
          <div>
            <h1>
              {editingId !== null
                ? "Edit Role Template"
                : "Create Role Template"}
            </h1>
            <p>Create and manage role templates using feature permissions.</p>
          </div>
        </div>

        <div className="role-details-card">
          <div className="role-card-heading">
            <div className="role-heading-icon">
              <i className="bi bi-grid-1x2" />
            </div>

            <div>
              <h2>Role Template Details</h2>
              <p>
                Provide the basic details and configuration for this role template.
              </p>
            </div>
          </div>

          {error && (
            <p className="role-error-message" role="alert">
              {error}
            </p>
          )}

          <div className="role-form-grid role-create-fields-grid">
            <label className="role-field role-code-field">
              <span>
                Role Code <b>*</b>
              </span>

              <div className="role-input-wrap">
                <i className="bi bi-tag" />
                <input
                  type="text"
                  name="roleCode"
                  value={form.roleCode}
                  onChange={handleChange}
                  placeholder="e.g. CASHIER"
                  maxLength={50}
                  list="role-code-suggestions"
                  autoComplete="off"
                />
                <datalist id="role-code-suggestions">
                  {roleCodeSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>

              <small>
                Unique code using uppercase letters and underscores.
              </small>
            </label>

            <label className="role-field role-name-field">
              <span>
                Role Template Name <b>*</b>
              </span>

              <div className="role-input-wrap">
                <i className="bi bi-type" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter role template name"
                  maxLength={100}
                  list="role-name-suggestions"
                  autoComplete="off"
                />
                <datalist id="role-name-suggestions">
                  {roleNameSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>

              <small>
                Display name for the role template.
              </small>
            </label>

            <label className="role-field role-status-field">
              <span>
                Status <b>*</b>
              </span>

              <div className="role-select-wrap">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <i className="bi bi-chevron-down" />
              </div>

              <small>Active or Inactive.</small>
            </label>

            <label className="role-field role-description-field">
              <span>Description</span>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                onInput={(event) => {
                  event.currentTarget.style.height = "44px";
                  event.currentTarget.style.height = `${Math.max(
                    44,
                    event.currentTarget.scrollHeight
                  )}px`;
                }}
                autoComplete="off"
                placeholder="Enter a brief description..."
                maxLength={500}
              />

              <div className="role-description-meta">
                <small>Explain the purpose of this role template.</small>
                <span>{form.description.length}/500</span>
              </div>
            </label>
          </div>

          <div className="role-form-actions">
            <button
              type="button"
              className="role-template-cancel-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="role-template-submit-button"
              onClick={saveTemplate}
              disabled={saving}
            >


              {saving
                ? "Saving..."
                : editingId !== null
                ? "Update Role Template"
                : "Create Role Template"}
            </button>
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
                Reset
              </button>
            </div>
          </div>

          <div className="role-table-wrap">
            <table className="role-table">
              <colgroup>
                <col className="role-code-col" />
                <col className="role-name-col" />
                <col className="role-description-col" />
                <col className="role-status-col" />
                <col className="role-created-col" />
                <col className="role-updated-col" />
                <col className="role-actions-col" />
              </colgroup>

              <thead>
                <tr>
                  <th className="role-code-col">Role Code</th>
                  <th className="role-name-col">Role Template Name</th>
                  <th className="role-description-col">Description</th>
                  <th className="role-status-col">Status</th>
                  <th className="role-created-col">Created On</th>
                  <th className="role-updated-col">Updated On</th>
                  <th className="role-actions-col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id}>
                    <td className="role-code-cell">
                      <div className="role-key-cell">
                        <strong>{template.roleCode || "—"}</strong>
                      </div>
                    </td>

                    <td className="role-name-cell">
                      <button
                        type="button"
                        className="role-name-link"
                        onClick={() =>
                          navigate(`/role-templates/${template.id}`, {
                            state: { roleTemplate: template },
                          })
                        }
                        title={template.name || "—"}
                      >
                        <strong>{template.name || "—"}</strong>
                      </button>
                    </td>

                    <td
                      className="role-description-cell"
                      title={template.description || "—"}
                    >
                      <span className="role-description-text">
                        {template.description || "—"}
                      </span>
                    </td>

                    <td className="role-status-cell">
                      <span
                        className={`role-status ${String(
                          template.status || ""
                        ).toLowerCase()}`}
                      >
                        <i />
                        {String(template.status).toUpperCase() === "ACTIVE"
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

                    <td className="role-updated-cell">
                      {displayDate(
                        template.updatedAt ||
                          template.updated_at ||
                          template.updatedDate
                      )}
                    </td>

                    <td className="role-actions">
                      <button
                        type="button"
                        className="role-edit-action"
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
                        className="role-delete-action"
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
                    <td colSpan={7} className="role-empty-state">
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