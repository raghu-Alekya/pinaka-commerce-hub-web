import RoleTemplateDetailsHeader from "../components/RoleTemplateDetailsHeader";
import { roleTemplate } from "../data/roleTemplateDetails";

export default function ViewRoleTemplateOverview() {
  return (
    <section className="role-details-page">
      <RoleTemplateDetailsHeader activeTab="overview" />

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