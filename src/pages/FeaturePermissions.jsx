import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/featurepermissions.css";

const initialPermissions = [
  {
    id: 1,
    key: "VIEW_REFUND",
    name: "View Refund",
    description: "Allows user to view refund details.",
    status: "Active",
  },
  {
    id: 2,
    key: "CREATE_REFUND",
    name: "Create Refund",
    description: "Allows user to create a new refund request.",
    status: "Active",
  },
  {
    id: 3,
    key: "APPROVE_REFUND",
    name: "Approve Refund",
    description: "Allows user to approve refund requests.",
    status: "Active",
  },
  {
    id: 4,
    key: "OVERRIDE_REFUND",
    name: "Override Refund",
    description: "Allows user to override refund policies.",
    status: "Inactive",
  },
];

const emptyForm = {
  key: "",
  name: "",
  description: "",
  status: "Active",
};

export default function FeaturePermissions() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedFeatureName =
    location.state?.featureName ||
    location.state?.feature?.name ||
    "Feature";

  const [permissions, setPermissions] = useState(initialPermissions);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const isEditing = editingId !== null;

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const savePermission = () => {
    if (!form.key.trim() || !form.name.trim()) return;

    if (isEditing) {
      setPermissions((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                key: form.key.trim().toUpperCase(),
                name: form.name.trim(),
                description: form.description.trim(),
                status: form.status,
              }
            : item
        )
      );
    } else {
      setPermissions((prev) => [
        ...prev,
        {
          id: Date.now(),
          key: form.key.trim().toUpperCase(),
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
        },
      ]);
    }

    clearForm();
  };

  const editPermission = (permission) => {
    setEditingId(permission.id);

    setForm({
      key: permission.key,
      name: permission.name,
      description: permission.description,
      status: permission.status,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const duplicatePermission = (permission) => {
    setPermissions((prev) => [
      ...prev,
      {
        ...permission,
        id: Date.now(),
        key: `${permission.key}_COPY`,
        name: `${permission.name} Copy`,
      },
    ]);
  };

  const deletePermission = (permissionId) => {
    setPermissions((prev) =>
      prev.filter((item) => item.id !== permissionId)
    );

    if (editingId === permissionId) {
      clearForm();
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All Statuses");
  };

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return permissions.filter((item) => {
      const matchesSearch =
        item.key.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [permissions, search, statusFilter]);

  return (
    <div className="feature-permissions-page">
      <div className="fp-page-head">
        <div className="fp-title-wrap">
          <div className="fp-title-icon">
            <i className="bi bi-arrow-repeat" />
          </div>

          <div>
            <h1>Feature Permissions</h1>
            <p>
              Manage permissions for the selected feature.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="fp-back-btn"
          onClick={() => navigate("/features")}
        >
          <i className="bi bi-arrow-left" />
          Back to Features
        </button>
      </div>

      <section className="fp-info-card">
        <div className="fp-info-top">
          <div>
            <h2>Permission Information</h2>
            <p>
              Create a new permission for this feature or edit an existing one.
            </p>
          </div>

          <div className="fp-mode-chip">
            {isEditing
              ? `Editing: ${form.key}`
              : "Creating New Permission"}
          </div>
        </div>

        <div className="fp-form-grid">
          <div className="fp-field">
            <label>
              Permission Key
              <span>*</span>
            </label>

            <input
              type="text"
              name="key"
              value={form.key}
              onChange={updateField}
              placeholder="e.g. VIEW_REFUND"
            />

            <small>
              Unique key for the permission. Use UPPERCASE with underscores.
            </small>
          </div>

          <div className="fp-field">
            <label>
              Permission Name
              <span>*</span>
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Enter permission name"
            />

            <small>
              Display name for the permission.
            </small>
          </div>

          <div className="fp-field">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Enter a brief description of what this permission allows..."
            />

            <small>
              Explain what this permission allows users to do.
            </small>
          </div>

          <div className="fp-field">
            <label>
              Status
              <span>*</span>
            </label>

            <div className="fp-select-wrap">
              <select
                name="status"
                value={form.status}
                onChange={updateField}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <i className="bi bi-chevron-down" />
            </div>

            <small>Active or Inactive.</small>
          </div>
        </div>

        <div className="fp-form-actions">
          <button
            type="button"
            className="fp-btn fp-btn-secondary"
            onClick={clearForm}
          >
            <i className="bi bi-arrow-counterclockwise" />
            Clear
          </button>

          <button
            type="button"
            className="fp-btn fp-btn-primary"
            onClick={savePermission}
          >
            <i className="bi bi-floppy" />
            {isEditing ? "Update Permission" : "Save Permission"}
          </button>
        </div>
      </section>

      <section className="fp-list-card">
        <div className="fp-list-toolbar">
          <h2>
            Permissions List ({filteredPermissions.length})
          </h2>

          <div className="fp-list-filters">
            <div className="fp-search">
              <i className="bi bi-search" />

              <input
                type="text"
                placeholder="Search permissions..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="fp-status-filter">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="All Statuses">
                  All Statuses
                </option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <i className="bi bi-chevron-down" />
            </div>

            <button
              type="button"
              className="fp-reset-btn"
              onClick={resetFilters}
            >
              <i className="bi bi-arrow-repeat" />
              Reset
            </button>
          </div>
        </div>

        <div className="fp-table-wrap">
          <table className="fp-table">
            <colgroup>
              <col className="fp-col-key" />
              <col className="fp-col-name" />
              <col className="fp-col-description" />
              <col className="fp-col-status" />
              <col className="fp-col-actions" />
            </colgroup>

            <thead>
              <tr>
                <th>
                  Permission Key
                  <i className="bi bi-chevron-expand" />
                </th>

                <th>
                  Permission Name
                  <i className="bi bi-chevron-expand" />
                </th>

                <th>
                  Description
                  <i className="bi bi-chevron-expand" />
                </th>

                <th>
                  Status
                  <i className="bi bi-chevron-expand" />
                </th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPermissions.map((permission) => (
                <tr key={permission.id}>
                  <td>{permission.key}</td>

                  <td>{permission.name}</td>

                  <td className="fp-description-cell">
                    {permission.description}
                  </td>

                  <td>
                    <span
                      className={`fp-status-pill ${permission.status.toLowerCase()}`}
                    >
                      <b />
                      {permission.status}
                    </span>
                  </td>

                  <td>
                    <div className="fp-row-actions">
                      <button
                        type="button"
                        className="edit"
                        aria-label={`Edit ${permission.name}`}
                        onClick={() =>
                          editPermission(permission)
                        }
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      <button
                        type="button"
                        className="copy"
                        aria-label={`Duplicate ${permission.name}`}
                        onClick={() =>
                          duplicatePermission(permission)
                        }
                      >
                        <i className="bi bi-copy" />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        aria-label={`Delete ${permission.name}`}
                        onClick={() =>
                          deletePermission(permission.id)
                        }
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="fp-list-footer">
          <span>
            Showing 1 to {filteredPermissions.length} of {filteredPermissions.length} entries
          </span>

          <div className="fp-pagination">
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

      <div className="fp-feature-context" aria-hidden="true">
        {selectedFeatureName}
      </div>
    </div>
  );
}
