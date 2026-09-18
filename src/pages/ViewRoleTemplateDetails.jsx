import { useLocation, useNavigate, useParams } from "react-router-dom";

const defaultRoleTemplate = {
  id: "store-manager",
  name: "Store Manager",
  code: "STORE_MANAGER",
  description: "Full store operations access.",
  status: "Active",
};

export default function ViewRoleTemplateOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleId } = useParams();
  const roleTemplate = {
    ...defaultRoleTemplate,
    ...(location.state?.roleTemplate ?? {}),
  };

  const tabs = [
    ["overview", "Overview", `/role-templates/${roleId}`],
    ["store-types", "Applicable Store Types", `/role-templates/${roleId}/store-types`],
    ["access", "Feature & Permission Access", `/role-templates/${roleId}/access`],
  ];

  return (
    <section className="role-details-page">
      <button
        type="button"
        className="role-details-back"
        onClick={() => navigate("/role-templates")}
        aria-label="Back to role templates"
      >
        <i className="bi bi-arrow-left" />
      </button>

      <div className="role-details-heading">
        <div>
          <h1>{roleTemplate.name}</h1>
          <p>Configure store types, features and permissions for this role.</p>
        </div>

        <span className="role-details-active">
          <i className="bi bi-circle-fill" />
          {roleTemplate.status}
        </span>
      </div>

      <nav className="role-details-tabs">
        {tabs.map(([id, label, path]) => (
          <button
            type="button"
            key={id}
            className={id === "overview" ? "active" : ""}
            onClick={() => navigate(path, { state: { roleTemplate } })}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="role-details-card">
        <div className="role-details-card-title">
          <span>
            <i className="bi bi-person-vcard" />
          </span>

          <div>
            <h2>Role Template Overview</h2>
            <p>View the core configuration of this role template.</p>
          </div>
        </div>

        <div className="role-overview-grid">
          <div>
            <span>Role Template Name</span>
            <strong>{roleTemplate.name}</strong>
          </div>

          <div>
            <span>Role Code</span>
            <strong>{roleTemplate.code}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong className="role-overview-active">
              <i className="bi bi-circle-fill" />
              {roleTemplate.status}
            </strong>
          </div>

          <div className="role-overview-description">
            <span>Description</span>
            <strong>{roleTemplate.description}</strong>
          </div>
        </div>
      </section>
    </section>
  );
}