import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const featurePermissions = [
  {
    id: "pos",
    name: "Point of Sale",
    code: "POS",
    description: "Manage sales, checkout, payments and POS operations.",
    permissions: [
      ["view-pos", "View POS", "VIEW_POS"],
      ["create-order", "Create Order", "CREATE_ORDER"],
      ["edit-order", "Edit Order", "EDIT_ORDER"],
      ["void-order", "Void Order", "VOID_ORDER"],
      ["refund-order", "Refund Order", "REFUND_ORDER"],
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    code: "INVENTORY",
    description: "Manage stock, products and inventory operations.",
    permissions: [
      ["view-inventory", "View Inventory", "VIEW_INVENTORY"],
      ["adjust-stock", "Adjust Stock", "ADJUST_STOCK"],
      ["manage-products", "Manage Products", "MANAGE_PRODUCTS"],
    ],
  },
];

export default function ViewRoleTemplateAccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleId } = useParams();
  const roleTemplate = {
    ...(location.state?.roleTemplate ?? {}),
  };
  const [search, setSearch] = useState("");
  const [enabledFeatures, setEnabledFeatures] = useState([
    location.state?.roleTemplate?.featureId ?? "pos",
  ]);
  const [selectedPermissions, setSelectedPermissions] = useState([
    location.state?.roleTemplate?.permissionId ?? "view-pos",
   ]);

  const tabs = [
    ["overview", "Overview", `/role-templates/${roleId}`],
    ["store-types", "Applicable Store Types", `/role-templates/${roleId}/store-types`],
    ["access", "Feature & Permission Access", `/role-templates/${roleId}/access`],
  ];

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return featurePermissions.filter((feature) => {
      const permissionText = feature.permissions
        .map((permission) => permission[1])
        .join(" ");

      return `${feature.name} ${feature.description} ${permissionText}`
        .toLowerCase()
        .includes(query);
    });
  }, [search]);

  function toggleFeature(featureId) {
    setEnabledFeatures((current) =>
      current.includes(featureId)
        ? current.filter((item) => item !== featureId)
        : [...current, featureId]
    );
  }

  function togglePermission(permissionId) {
    setSelectedPermissions((current) =>
      current.includes(permissionId)
        ? current.filter((item) => item !== permissionId)
        : [...current, permissionId]
    );
  }

  function selectAll() {
    setEnabledFeatures(featurePermissions.map((feature) => feature.id));

    setSelectedPermissions(
      featurePermissions.flatMap((feature) =>
        feature.permissions.map(([id]) => id)
      )
    );
  }

  function clearAll() {
    setEnabledFeatures([]);
    setSelectedPermissions([]);
  }

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
          <h1>{roleTemplate.name || "Role Template"}</h1>
          <p>Configure store types, features and permissions for this role.</p>
        </div>

        <span className="role-details-active">
          <i className="bi bi-circle-fill" />
          {roleTemplate.status || "Active"}
        </span>
      </div>

      <nav className="role-details-tabs">
        {tabs.map(([id, label, path]) => (
          <button
            type="button"
            key={id}
            className={id === "access" ? "active" : ""}
            onClick={() => navigate(path, { state: { roleTemplate } })}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="role-details-card">
        <div className="role-details-card-title role-access-heading">
          <div className="role-access-title">
            <span>
              <i className="bi bi-grid-1x2" />
            </span>

            <div>
              <h2>Feature & Permission Access</h2>
              <p>
                Select the features and common permissions available to this role.
              </p>
            </div>
          </div>

          <div className="role-access-actions">
            <button type="button" onClick={selectAll}>Select All</button>
            <button type="button" onClick={clearAll}>Clear All</button>
          </div>
        </div>

        <label className="role-access-search">
          <i className="bi bi-search" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search features or permissions..."
          />
        </label>

        <p className="role-access-count">
          {enabledFeatures.length} Features selected ·{" "}
          {selectedPermissions.length} Permissions selected
        </p>

        <div className="role-feature-list">
          {filteredFeatures.map((feature) => {
            const isEnabled = enabledFeatures.includes(feature.id);

            return (
              <section className="role-feature-access-card" key={feature.id}>
                <div className="role-feature-access-top">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleFeature(feature.id)}
                  />

                  <span className="role-feature-access-icon">
                    <i className="bi bi-grid" />
                  </span>

                  <div>
                    <h3>
                      {feature.name} <small>{feature.code}</small>
                    </h3>
                    <p>{feature.description}</p>
                  </div>

                  <span className={isEnabled ? "role-enabled" : "role-disabled"}>
                    {isEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="role-permissions-heading">
                  <strong>Permissions</strong>
                  <span>Common permissions for this feature</span>
                </div>

                <div className="role-permissions-grid">
                  {feature.permissions.map(([id, name, code]) => (
                    <label
                      key={id}
                      className={
                        selectedPermissions.includes(id)
                          ? "selected"
                          : ""
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(id)}
                        disabled={!isEnabled}
                        onChange={() => togglePermission(id)}
                      />

                      <span>
                        <strong>{name}</strong>
                        <small>{code}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </section>
  );
}