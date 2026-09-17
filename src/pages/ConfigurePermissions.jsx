import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/configurepermissions.css";

const fallbackFeature = {
  id: 0,
  name: "Refunds",
  category: "Orders",
  description: "Allows user to process and manage refund requests for orders.",
  status: "Active",
};

const initialPermissions = [
  { id: 1, key: "VIEW_REFUND", name: "View Refund", description: "Allows user to view refund details.", status: "Active" },
  { id: 2, key: "CREATE_REFUND", name: "Create Refund", description: "Allows user to create a new refund request.", status: "Active" },
  { id: 3, key: "APPROVE_REFUND", name: "Approve Refund", description: "Allows user to approve refund requests.", status: "Active" },
  { id: 4, key: "OVERRIDE_REFUND", name: "Override Refund", description: "Allows user to override refund policies.", status: "Inactive" },
];

export default function ConfigurePermissions() {
  const navigate = useNavigate();
  const location = useLocation();
  const feature = { ...fallbackFeature, ...(location.state?.feature || {}) };
  const featureKey = (feature.name || "Feature").trim().replace(/\s+/g, "_").toUpperCase();

  const [permissions, setPermissions] = useState(initialPermissions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filteredPermissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return permissions.filter((permission) => {
      const matchesSearch =
        permission.key.toLowerCase().includes(q) ||
        permission.name.toLowerCase().includes(q) ||
        permission.description.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All Statuses" || permission.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [permissions, search, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All Statuses");
  };

  const deletePermission = (id) => {
    setPermissions((current) => current.filter((permission) => permission.id !== id));
  };

  const duplicatePermission = (permission) => {
    setPermissions((current) => [
      ...current,
      { ...permission, id: Date.now(), key: `${permission.key}_COPY`, name: `${permission.name} Copy` },
    ]);
  };

  return (
    <div className="configure-permissions-page">
      <header className="cp-page-head">
        <div>
          <h1>Configure Permissions</h1>
          <p>View and manage permissions for the selected feature.</p>
        </div>
        <button type="button" className="cp-back-btn" onClick={() => navigate("/features")}>
          <i className="bi bi-arrow-left" /> Back to Features
        </button>
      </header>

      <section className="cp-details-card">
        <h2>Selected Feature Details</h2>
        <div className="cp-details-grid">
          <div className="cp-detail-box">
            <span>Feature Name</span>
            <strong>{feature.name}</strong>
          </div>
          <div className="cp-detail-box">
            <span>Feature Key</span>
            <strong>{featureKey}</strong>
          </div>
          <div className="cp-detail-box">
            <span>Category</span>
            <strong>{feature.category || "—"}</strong>
          </div>
          <div className="cp-detail-box">
            <span>Status</span>
            <span className={`cp-status-pill ${feature.status === "Active" ? "active" : "inactive"}`}>
              <b /> {feature.status || "Inactive"}
            </span>
          </div>
          <div className="cp-detail-box cp-description-box">
            <span>Description</span>
            <strong>{feature.description || "No description available."}</strong>
          </div>
        </div>
      </section>

      <section className="cp-list-card">
        <div className="cp-list-toolbar">
          <div>
            <h2>Permissions List ({filteredPermissions.length})</h2>
            <p>Manage permissions assigned to this feature.</p>
          </div>
          <div className="cp-list-filters">
            <div className="cp-search">
              <i className="bi bi-search" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search permissions..." />
            </div>
            <div className="cp-select-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All Statuses</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <i className="bi bi-chevron-down" />
            </div>
            <button type="button" className="cp-reset-btn" onClick={resetFilters}>
              <i className="bi bi-arrow-repeat" /> Reset
            </button>
          </div>
        </div>

        <div className="cp-table-wrap">
          <table className="cp-table">
            <colgroup>
              <col className="cp-col-key" /><col className="cp-col-name" /><col className="cp-col-description" />
              <col className="cp-col-status" /><col className="cp-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Permission Key <i className="bi bi-chevron-expand" /></th>
                <th>Permission Name <i className="bi bi-chevron-expand" /></th>
                <th>Description <i className="bi bi-chevron-expand" /></th>
                <th>Status <i className="bi bi-chevron-expand" /></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((permission) => (
                <tr key={permission.id}>
                  <td>{permission.key}</td>
                  <td>{permission.name}</td>
                  <td className="cp-description-cell">{permission.description}</td>
                  <td>
                    <span className={`cp-status-pill ${permission.status.toLowerCase()}`}>
                      <b />{permission.status}
                    </span>
                  </td>
                  <td>
                    <div className="cp-row-actions">
                      <button className="edit" type="button" aria-label={`Edit ${permission.name}`}><i className="bi bi-pencil" /></button>
                      <button className="copy" type="button" onClick={() => duplicatePermission(permission)} aria-label={`Duplicate ${permission.name}`}><i className="bi bi-copy" /></button>
                      <button className="delete" type="button" onClick={() => deletePermission(permission.id)} aria-label={`Delete ${permission.name}`}><i className="bi bi-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="cp-list-footer">
          <span>Showing {filteredPermissions.length ? 1 : 0} to {filteredPermissions.length} of {filteredPermissions.length} entries</span>
          <div className="cp-pagination">
            <button type="button"><i className="bi bi-chevron-left" /></button>
            <button type="button" className="current">1</button>
            <button type="button"><i className="bi bi-chevron-right" /></button>
          </div>
        </footer>
      </section>
    </div>
  );
}
