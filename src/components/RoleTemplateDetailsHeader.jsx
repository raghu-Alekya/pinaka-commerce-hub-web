import { useNavigate, useParams } from "react-router-dom";
import { roleTemplate } from "../data/roleTemplateDetails";

export default function RoleTemplateDetailsHeader({ activeTab }) {
  const navigate = useNavigate();
  const { roleId } = useParams();

  const tabs = [
    ["overview", "Overview", `/role-templates/${roleId}`],
    ["store-types", "Applicable Store Types", `/role-templates/${roleId}/store-types`],
    ["access", "Feature & Permission Access", `/role-templates/${roleId}/access`],
  ];

  return (
    <>
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
          <h1>Configure Role Template</h1>
          <p>Configure store types, features and permissions for this role.</p>
        </div>

        <span className="role-details-active">
          <i className="bi bi-circle-fill" />
          {roleTemplate.status}
        </span>
      </div>

      <section className="role-details-summary">
        <div className="role-details-summary-icon">
          <i className="bi bi-person-badge" />
        </div>

        <div>
          <span>ROLE TEMPLATE</span>
          <strong>{roleTemplate.name}</strong>
        </div>

        <div>
          <span>ROLE CODE</span>
          <strong>{roleTemplate.code}</strong>
        </div>

        <div>
          <span>DESCRIPTION</span>
          <strong>{roleTemplate.description}</strong>
        </div>
      </section>

      <nav className="role-details-tabs">
        {tabs.map(([id, label, path]) => (
          <button
            type="button"
            key={id}
            className={activeTab === id ? "active" : ""}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}