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
  const [roleCodeError, setRoleCodeError] = useState("");

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

  const roleNameSuggestions = useMemo(
    () =>
      [...new Set(
        templates
          .map((template) => String(template.name || "").trim())
          .filter(Boolean)
      )],
    [templates]
  );

  function validateRoleCode(value) {
    const code = String(value || "").trim();

    if (!code) return "Role Code is required.";
    if (code.length < 3 || code.length > 30) {
      return "Role Code must be 3 to 30 characters.";
    }
    if (!/^[A-Z0-9_]+$/.test(code)) {
      return "Use only letters, numbers, and underscores. No spaces or special characters.";
    }

    return "";
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "roleCode") {
      const nextValue = value.toUpperCase();
      setRoleCodeError(validateRoleCode(nextValue));

      setForm((currentForm) => ({
        ...currentForm,
        roleCode: nextValue,
      }));
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setRoleCodeError("");
  }

  async function saveTemplate() {
    const values = {
      roleCode: form.roleCode.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
    };

   

    const codeError = validateRoleCode(values.roleCode);

    if (codeError) {
      setRoleCodeError(codeError);
      return;
    }

    if (!values.name) {
      setError("Role Template Name is required.");
      return;
    }

    setRoleCodeError("");
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
    setRoleCodeError("");

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

  const isFormValid =
    form.roleCode.length >= 3 &&
    form.roleCode.length <= 30 &&
    /^[A-Z0-9_]+$/.test(form.roleCode) &&
    form.name.trim().length > 0;

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
                  maxLength={30}
                  autoComplete="off"
                  aria-invalid={Boolean(roleCodeError)}
                  className={roleCodeError ? "role-input-invalid" : ""}
                />
              </div>

              <small className={roleCodeError ? "role-field-error" : ""}>
                {roleCodeError || "3–30 characters. Letters, numbers, and underscores only. No spaces."}
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
                  autoComplete="off"
                />
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
                  className={form.status === "INACTIVE" ? "status-inactive" : "status-active"}
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
              disabled={saving || !isFormValid}
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
                <col className="role-code-col role-equal-col" />
                <col className="role-name-col role-equal-col" />
                <col className="role-description-col role-equal-col" />
                <col className="role-status-col role-equal-col" />
                <col className="role-created-col role-equal-col" />
                <col className="role-updated-col role-equal-col" />
                <col className="role-actions-col role-equal-col" />
              </colgroup>

              <thead>
                <tr>
                  <th className="role-code-col role-equal-col">Role Code</th>
                  <th className="role-name-col role-equal-col">Role Template Name</th>
                  <th className="role-description-col role-equal-col">Description</th>
                  <th className="role-status-col role-equal-col">Status</th>
                  <th className="role-created-col role-equal-col">Created At</th>
                  <th className="role-updated-col role-equal-col">Updated At</th>
                  <th className="role-actions-col role-equal-col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id}>
                    <td className="role-code-cell role-equal-col">
                      <div className="role-key-cell">
                        <strong>{template.roleCode || "—"}</strong>
                      </div>
                    </td>

                    <td className="role-name-cell role-equal-col">
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
                      className="role-description-cell role-equal-col"
                      title={template.description || "—"}
                    >
                      <span className="role-description-text">
                        {template.description || "—"}
                      </span>
                    </td>

                    <td className="role-status-cell role-equal-col">
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

                    <td className="role-created-cell role-equal-col">
                      {displayDate(
                        template.createdAt ||
                          template.created_at ||
                          template.createdDate
                      )}
                    </td>

                    <td className="role-updated-cell role-equal-col">
                      {displayDate(
                        template.updatedAt ||
                          template.updated_at ||
                          template.updatedDate
                      )}
                    </td>

                    <td className="role-actions role-equal-col">
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