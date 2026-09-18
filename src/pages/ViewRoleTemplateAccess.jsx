import { useMemo, useState } from "react";
import RoleTemplateDetailsHeader from "../components/RoleTemplateDetailsHeader";
import { featurePermissions } from "../data/roleTemplateDetails";

export default function ViewRoleTemplateAccess() {
  const [search, setSearch] = useState("");
  const [enabledFeatures, setEnabledFeatures] = useState(["pos"]);
  const [selectedPermissions, setSelectedPermissions] = useState(["view-pos"]);

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
      <RoleTemplateDetailsHeader activeTab="access" />

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