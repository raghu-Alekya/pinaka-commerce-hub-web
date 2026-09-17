import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const initialRoles = [
  { id: 1, name: "Restaurant Manager", scope: "Store", active: true },
  { id: 2, name: "Shift Manager", scope: "Store", active: true },
  { id: 3, name: "Cashier", scope: "Store", active: true },
  { id: 4, name: "Server", scope: "Store", active: true },
  { id: 5, name: "Kitchen Manager", scope: "Store", active: true },
  { id: 6, name: "Kitchen Staff", scope: "Store", active: true },
];

export default function StoreTypeRoleTemplates() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();

  const [roles, setRoles] = useState(initialRoles);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newRoleName, setNewRoleName] = useState("");

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return roles.filter((role) =>
      role.name.toLowerCase().includes(query)
    );
  }, [roles, search]);

  function toggleRole(id) {
    setRoles((current) =>
      current.map((role) =>
        role.id === id
          ? { ...role, active: !role.active }
          : role
      )
    );
  }

  function addRole(event) {
    event.preventDefault();

    const name = newRoleName.trim();

    if (!name) return;

    const duplicate = roles.some(
      (role) => role.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      window.alert("This role template already exists.");
      return;
    }

    setRoles((current) => [
      ...current,
      {
        id: Date.now(),
        name,
        scope: "Store",
        active: true,
      },
    ]);

    setNewRoleName("");
    setShowModal(false);
  }

  function confirmDeleteRole() {
    if (!deleteTarget) return;

    setRoles((current) => current.filter((role) => role.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <section className="role-templates-page">
      <button
        type="button"
        className="role-templates-back"
        onClick={() => navigate("/store-types/new")}
      >
        <i className="bi bi-arrow-left" />
        Back to Store Types
      </button>

      <div className="role-templates-title">
        <div className="store-type-title-line">
          <h1>Restaurant</h1>

          <span className="store-type-active-badge">
            <i className="bi bi-circle-fill" />
            Active
          </span>
        </div>

        <p>
          Store type for restaurant vertical with full service and quick
          service operations.
        </p>
      </div>

      <nav className="role-templates-tabs">
        <button
          type="button"
          onClick={() => navigate(`/store-types/${storeTypeId}`)}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => navigate(`/store-types/${storeTypeId}/features`)}
        >
          Features
        </button>

        <button type="button" className="active">
          Role Templates
        </button>
      </nav>

      <section className="role-templates-card">
        <div className="role-templates-card-header">
          <div className="role-templates-card-title">
            <div className="role-templates-title-icon">
              <i className="bi bi-person-badge" />
            </div>

            <div>
              <h2>Role Templates</h2>
              <p>
                Role templates mapped to this store type. These are
                recommendations and do not assign roles to employees.
              </p>
            </div>
          </div>

          <div className="role-templates-tools">
            <label className="role-templates-search">
              <i className="bi bi-search" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search role templates..."
              />
            </label>

            <button
              type="button"
              className="role-templates-add-button"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-lg" />
              Add Role Template
            </button>
          </div>
        </div>

        <div className="role-templates-table">
          <div className="role-template-row role-template-row-head">
            <div>Role Template</div>
            <div>Scope</div>
            <div>Action</div>
          </div>

          {filteredRoles.map((role) => (
            <div className="role-template-row" key={role.id}>
              <div className="role-template-name">{role.name}</div>

              <div>{role.scope}</div>

              <div>
                <button
                  type="button"
                  className="role-template-delete-button"
                  title={`Delete ${role.name}`}
                  aria-label={`Delete ${role.name}`}
                  onClick={() => setDeleteTarget(role)}
                >
                  <i className="bi bi-trash3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="role-templates-footer">
          <div className="role-templates-info">
            <i className="bi bi-info-circle-fill" />
            Role templates are reusable defaults. They are not assigned to
            employees here.
          </div>

          <div className="role-templates-pagination">
            <button type="button" aria-label="Previous page">
              <i className="bi bi-chevron-left" />
            </button>

            <button type="button" className="active">
              1
            </button>

            <button type="button" aria-label="Next page">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {showModal && (
        <div
          className="role-template-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <form
            className="role-template-modal"
            onSubmit={addRole}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="role-template-modal-heading">
              <h2>Add Role Template</h2>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <label>
              Role Template Name
              <input
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                placeholder="e.g. Restaurant Supervisor"
                autoFocus
              />
            </label>

            <div className="role-template-modal-actions">
              <button
                type="button"
                className="role-template-cancel-button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="role-template-create-button"
                disabled={!newRoleName.trim()}
              >
                Add Role
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="delete-roletemplate-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-roletemplate-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-roletemplate-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>

            <h2>Delete Role Template?</h2>

            <p>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>

            <p className="delete-roletemplate-warning">
              This action cannot be undone.
            </p>

            <div className="delete-roletemplate-actions">
              <button
                type="button"
                className="delete-roletemplate-keep-button"
                onClick={() => setDeleteTarget(null)}
              >
                No, Keep It
              </button>

              <button
                type="button"
                className="delete-roletemplate-confirm-button"
                onClick={confirmDeleteRole}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}