import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialRoleTemplates = [
  {
    id: 1,
    key: "STORE_MANAGER",
    name: "Store Manager",
    description: "Full store operations access.",
    status: "Active",
    createdOn: "Jan 10, 2024",
    icon: "bi-person-badge",
  },
  {
    id: 2,
    key: "CASHIER",
    name: "Cashier",
    description: "Handles sales and payments.",
    status: "Active",
    createdOn: "Jan 12, 2024",
    icon: "bi-person",
  },
  {
    id: 3,
    key: "KITCHEN_STAFF",
    name: "Kitchen Staff",
    description: "Manages kitchen operations.",
    status: "Active",
    createdOn: "Jan 15, 2024",
    icon: "bi-shop-window",
  },
  {
    id: 4,
    key: "SUPERVISOR",
    name: "Supervisor",
    description: "Supervises daily operations.",
    status: "Inactive",
    createdOn: "Feb 01, 2024",
    icon: "bi-person-check",
  },
  {
    id: 5,
    key: "ACCOUNTANT",
    name: "Accountant",
    description: "Handles financial operations.",
    status: "Active",
    createdOn: "Feb 10, 2024",
    icon: "bi-person",
  },
];

const initialForm = {
  key: "",
  name: "",
  description: "",
  status: "Active",
};

export default function RoleTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState(initialRoleTemplates);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch =
        !query ||
        [template.key, template.name, template.description, template.status]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" || template.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [templates, search, statusFilter]);

  const allVisibleSelected =
    filteredTemplates.length > 0 &&
    filteredTemplates.every((template) => selectedIds.includes(template.id));

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function saveTemplate() {
    const key = form.key.trim().toUpperCase();
    const name = form.name.trim();

    if (!key || !name) return;

    if (editingId) {
      setTemplates((current) =>
        current.map((template) =>
          template.id === editingId
            ? {
                ...template,
                key,
                name,
                description: form.description.trim(),
                status: form.status,
              }
            : template
        )
      );
    } else {
      const newTemplate = {
        id: Date.now(),
        key,
        name,
        description: form.description.trim(),
        status: form.status,
        createdOn: "Today",
        icon: "bi-person",
      };
      setTemplates((current) => [newTemplate, ...current]);
    }

    resetForm();
  }

  function editTemplate(template) {
    setEditingId(template.id);
    setForm({
      key: template.key,
      name: template.name,
      description: template.description,
      status: template.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function duplicateTemplate(template) {
    const copy = {
      ...template,
      id: Date.now(),
      key: `${template.key}_COPY`,
      name: `${template.name} Copy`,
      createdOn: "Today",
    };
    setTemplates((current) => [copy, ...current]);
  }

  function toggleSelection(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredTemplates.some((item) => item.id === id))
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...filteredTemplates.map((item) => item.id)]),
    ]);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("All Statuses");
    setSelectedIds([]);
  }

  return (
    <section className="role-templates-page">
      <div className="role-details-card">
        <div className="role-page-heading">
          <div className="role-title-wrap">
            <div className="role-title-icon">
              <i className="bi bi-grid-1x2" />
            </div>
            <div>
              <h1>Role Templates</h1>
              <p>Create and manage role templates using feature permissions.</p>
            </div>
          </div>

          <div className="role-heading-actions">
            <span className="role-mode-pill">
              {editingId ? "Editing" : "Creating New"}
            </span>
            <button
              type="button"
              className="role-secondary-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
            <button
              type="button"
              className="role-primary-btn"
              onClick={saveTemplate}
            >
              <i className="bi bi-floppy" />
              {editingId ? "Update Role Template" : "Save & Configure Permissions"}
            </button>
          </div>
        </div>

        <div className="role-section-title">Role Template Details</div>

        <div className="role-form-grid">
          <label className="role-field">
            <span>
              Role Code <b>*</b> 
            </span>
            <input
              name="key"
              value={form.key}
              onChange={handleChange}
              placeholder="e.g. CASHIER"
              maxLength={50}
            />
            <small>Unique key for the role template. Use UPPERCASE with underscores.</small>
          </label>

          <label className="role-field">
            <span>
              Template Name <b>*</b>
            </span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter template name"
              maxLength={100}
            />
            <small>Display name for the role template.</small>
          </label>

          <label className="role-field">
            <span1>
              Status <b>*</b>
            </span1>
            <select name="status" value={form.status} onChange={handleChange}>
              <option>Active</option>
              <option>Inactive</option>
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
              rows="3"
              maxLength={250}
            />
            <small>Explain the purpose of this role template.</small>
          </label>
        </div>
      </div>

      <div className="role-list-card">
        <div className="role-list-header">
          <div>
            <h2>Role Templates List</h2>
            <p>Manage role templates and their assigned feature permissions.</p>
          </div>

          <div className="role-filters">
            <div className="role-search">
              <i className="bi bi-search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search role templates..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
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
                <th>Template Key <span>↕</span></th>
                <th>Template Name <span>↕</span></th>
                <th>Description <span>↕</span></th>
                <th>Status <span>↕</span></th>
                <th>Created On <span>↕</span></th>
                <th className="role-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => (
                <tr key={template.id}>
                  <td className="role-check-col">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(template.id)}
                      onChange={() => toggleSelection(template.id)}
                      aria-label={`Select ${template.name}`}
                    />
                  </td>
                  <td>
                    <div className="role-key-cell">
                      <span className={`role-row-icon role-icon-${template.id}`}>
                        <i className={`bi ${template.icon}`} />
                      </span>
                      <strong>{template.key}</strong>
                    </div>
                  </td>
                  <td>{template.name}</td>
                  <td className="role-description-cell">{template.description}</td>
                  <td>
                    <span className={`role-status ${template.status.toLowerCase()}`}>
                      <i />
                      {template.status}
                    </span>
                  </td>
                  <td>{template.createdOn}</td>
                  <td className="role-actions">
                    <button
                      type="button"
                      onClick={() => editTemplate(template)}
                      aria-label={`Edit ${template.name}`}
                    >
                      <i className="bi bi-pencil" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateTemplate(template)}
                      aria-label={`Duplicate ${template.name}`}
                    >
                      <i className="bi bi-copy" />
                    </button>
                    <button
                      type="button"
                      aria-label={`More options for ${template.name}`}
                      onClick={() => window.alert(`More options for ${template.name}`)}
                    >
                      <i className="bi bi-three-dots-vertical" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan="7" className="role-empty-state">
                    No role templates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="role-pagination">
          <span>
            Showing {filteredTemplates.length ? 1 : 0} to {filteredTemplates.length} of 5 entries
          </span>
          <div>
            <button type="button" aria-label="Previous page">‹</button>
            <button type="button" className="current-page">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <span>…</span>
            <button type="button">71</button>
            <button type="button" aria-label="Next page">›</button>
          </div>
        </div>
      </div>
    </section>
  );
}
