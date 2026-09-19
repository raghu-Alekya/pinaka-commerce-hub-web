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
        <div className="role-templates-page-heading">
  <div>
    <h1>
      {editingId !== null ? "Edit Role Template" : "Create Role Template"}
    </h1>

    <p>
      Create and manage role templates using feature permissions.
    </p>
  </div>
</div>

<div className="role-details-card">
  <div className="role-card-heading">
    <div className="role-heading-icon">
      <i className="bi bi-person-vcard" />
    </div>

    <div>
      <h2>Role Template Information</h2>
      <p>Provide the basic details about the role template.</p>
    </div>
  </div>

  {error && (
    <p className="role-error-message" role="alert">
      {error}
    </p>
  )}

  <div className="role-form-grid">
    <label className="role-field">
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
          autoComplete="off"
        />
      </div>

      <small>
        Use uppercase letters, numbers, and underscores only.
      </small>
    </label>

    <label className="role-field">
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
          placeholder="e.g. Cashier"
          maxLength={100}
          autoComplete="off"
        />
      </div>

      <small>Name displayed throughout the system.</small>
    </label>
  </div>

  <div className="role-bottom-grid">
    <label className="role-field role-description-field">
      <span>Description</span>

      <div className="role-textarea-wrap">
        <i className="bi bi-file-earmark-text" />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the role, its responsibilities, and permission access..."
          rows={3}
          maxLength={250}
          autoComplete="off"
        />
      </div>

      <small className="role-character-count">
        {form.description.length}/250
      </small>
    </label>

    <label className="role-field role-status-field">
      <span>
        Status <b>*</b>
      </span>

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
      >
        <option value="ACTIVE">● Active</option>
        <option value="INACTIVE">● Inactive</option>
      </select>

      <small>Inactive roles cannot be assigned to employees.</small>
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
    <thead>
      <tr>
        <th className="role-code-col">Role Code</th>
        <th className="role-name-col">Role Template Name</th>
        <th className="role-description-col">Description</th>
        <th className="role-status-col">Status</th>
        <th className="role-created-col">Created At</th>
        <th className="role-updated-col">Updated At</th>
        <th className="role-actions-col">Actions</th>
      </tr>
    </thead>

    <tbody>
      {filteredTemplates.map((template) => (
        <tr key={template.id}>
          <td className="role-code-cell">
            <strong>{template.roleCode || "—"}</strong>
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
            >
              {template.name || "—"}
            </button>
          </td>

          <td className="role-description-cell">
            {template.description || "—"}
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
                template.updatedDate ||
                template.modifiedAt ||
                template.modified_at ||
                template.createdAt
            )}
          </td>

          <td className="role-actions">
            <button
              type="button"
              onClick={() => editTemplate(template)}
              disabled={saving}
              aria-label={`Edit ${template.name || template.roleCode}`}
              title="Edit role template"
            >
              <i className="bi bi-pencil" />
            </button>

            <button
              type="button"
              onClick={() => openDeletePopup(template)}
              disabled={saving}
              aria-label={`Delete ${template.name || template.roleCode}`}
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