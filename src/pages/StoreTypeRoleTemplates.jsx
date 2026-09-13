import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const initialRoles = [
  { id: 1, name: "Restaurant Manager", icon: "bi-person-workspace", scope: "Store", defaultEnabled: true, required: false, color: "orange" },
  { id: 2, name: "Shift Manager", icon: "bi-person-badge", scope: "Store", defaultEnabled: true, required: false, color: "blue" },
  { id: 3, name: "Cashier", icon: "bi-person", scope: "Store", defaultEnabled: true, required: false, color: "blue" },
  { id: 4, name: "Server", icon: "bi-person", scope: "Store", defaultEnabled: true, required: false, color: "purple" },
  { id: 5, name: "Kitchen Manager", icon: "bi-person-workspace", scope: "Store", defaultEnabled: true, required: false, color: "purple" },
  { id: 6, name: "Kitchen Staff", icon: "bi-person", scope: "Store", defaultEnabled: true, required: false, color: "purple" },
];

export default function StoreTypeRoleTemplates() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();

  const [roles, setRoles] = useState(initialRoles);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const filteredRoles = useMemo(() => {
    return roles.filter((role) =>
      role.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [roles, search]);

  function toggleRole(id, property) {
    setRoles((current) =>
      current.map((role) =>
        role.id === id ? { ...role, [property]: !role[property] } : role
      )
    );
  }

  function addRole(event) {
    event.preventDefault();

    const name = newRoleName.trim();
    if (!name) return;

    setRoles((current) => [
      ...current,
      {
        id: Date.now(),
        name,
        icon: "bi-person",
        scope: "Store",
        defaultEnabled: true,
        required: false,
        color: "blue",
      },
    ]);

    setNewRoleName("");
    setShowModal(false);
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
        <h1>
          Restaurant <span>Active</span>
          
        </h1>
        <p>
          Store type for restaurant vertical with full service and quick service
          operations.
        </p>
      </div>

      <div className="role-templates-tabs">
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

        <button type="button">Configuration Defaults</button>
      </div>

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
            <div>Default</div>
            <div>Required</div>
            <div>Action</div>
          </div>

          {filteredRoles.map((role) => (
            <div className="role-template-row" key={role.id}>
              <div className="role-template-name">
                <span className={`role-template-icon ${role.color}`}>
                  <i className={`bi ${role.icon}`} />
                </span>
                {role.name}
              </div>

              <div>{role.scope}</div>

              <div>
                <button
                  type="button"
                  className={`role-template-switch ${
                    role.defaultEnabled ? "enabled" : ""
                  }`}
                  onClick={() => toggleRole(role.id, "defaultEnabled")}
                >
                  <span />
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className={`role-template-switch ${
                    role.required ? "enabled" : ""
                  }`}
                  onClick={() => toggleRole(role.id, "required")}
                >
                  <span />
                </button>
              </div>

              <div>
                <button type="button" className="role-template-more-button">
                  <i className="bi bi-three-dots-vertical" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="role-templates-footer">
          <div>
            <i className="bi bi-info-circle-fill" />
            Role templates are reusable defaults. They are not assigned to
            employees here.
          </div>

          <div className="role-templates-pagination">
            <button type="button">
              <i className="bi bi-chevron-left" />
            </button>
            <button type="button" className="active">1</button>
            <button type="button">
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
              <button type="button" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <label>
              Role template name
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
              <button type="submit" className="role-template-create-button">
                Add Role
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}