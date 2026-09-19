import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { roleTemplatesApi } from "../api/roleTemplatesApi";

const readFeatureList = (response) => {
  const candidates = [
    response?.features,
    response?.data?.features,
    response?.data?.data,
    response?.data?.items,
    response?.data?.results,
    response?.data,
    response?.items,
    response?.results,
    response,
  ];

  return candidates.find((value) => Array.isArray(value)) || [];
};

const normalizePermission = (permission, featureId, permissionIndex) => {
  const permissionRecord = permission?.permission ?? permission ?? {};
  const permissionId =
    permissionRecord.id ??
    permission?.permissionId ??
    permission?.id ??
    permissionRecord.permissionId ??
    permissionRecord.permissionKey ??
    permissionRecord.key ??
    `${featureId}-permission-${permissionIndex}`;

  return {
    id: String(permissionId),
    name:
      permissionRecord.name ??
      permissionRecord.permissionName ??
      permission?.name ??
      permission?.permissionName ??
      permissionRecord.label ??
      permissionRecord.permissionKey ??
      permissionRecord.key ??
      "Permission",
    code:
      permissionRecord.code ??
      permissionRecord.permissionCode ??
      permission?.code ??
      permission?.permissionCode ??
      permissionRecord.permissionKey ??
      permissionRecord.key ??
      permissionRecord.name ??
      "PERMISSION",
    checked:
      permission?.checked ??
      permissionRecord?.checked ??
      permission?.enabled ??
      permissionRecord?.enabled ??
      permission?.mapped ??
      permissionRecord?.mapped ??
      permission?.defaultAllowed ??
      permissionRecord?.defaultAllowed ??
      permission?.defaultEnabled ??
      permissionRecord?.defaultEnabled ??
      false,
  };
};

const normalizeFeature = (feature, featureIndex) => {
  const featureRecord = feature?.feature ?? feature ?? {};
  const featureId =
    featureRecord.id ??
    feature?.featureId ??
    feature?.id ??
    featureRecord.featureId ??
    `feature-${featureIndex}`;

  const permissions = Array.isArray(feature?.permissions)
    ? feature.permissions
    : Array.isArray(featureRecord?.permissions)
      ? featureRecord.permissions
      : [];

  return {
    id: String(featureId),
    name:
      featureRecord.name ??
      feature?.name ??
      featureRecord.featureName ??
      "Feature",
    code:
      featureRecord.code ??
      featureRecord.featureCode ??
      feature?.code ??
      feature?.featureCode ??
      featureRecord.featureKey ??
      feature?.featureKey ??
      "FEATURE",
    description:
      featureRecord.description ??
      feature?.description ??
      "",
    checked:
      feature?.checked ??
      featureRecord?.checked ??
      feature?.enabled ??
      featureRecord?.enabled ??
      feature?.mapped ??
      featureRecord?.mapped ??
      feature?.defaultEnabled ??
      featureRecord?.defaultEnabled ??
      false,
    permissions: permissions.map((permission, index) =>
      normalizePermission(permission, featureId, index)
    ),
  };
};

export default function ViewRoleTemplateAccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleId } = useParams();
  const roleTemplate = {
    ...(location.state?.roleTemplate ?? {}),
  };
  const activeStoreTypeId = location.state?.storeType?.id ?? location.state?.storeTypeId;
  const [featurePermissions, setFeaturePermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [enabledFeatures, setEnabledFeatures] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRoleFeatureAccess() {
      setLoading(true);
      setError("");

      try {
        const response = await roleTemplatesApi.getFeatures(roleId, activeStoreTypeId ? [activeStoreTypeId] : []);
        const features = readFeatureList(response).map(normalizeFeature);

        if (!cancelled) {
          setFeaturePermissions(features);
          setEnabledFeatures(
            features.filter((feature) => Boolean(feature.checked)).map((feature) => feature.id)
          );
          setSelectedPermissions(
            features.flatMap((feature) =>
              feature.permissions
                .filter((permission) => Boolean(permission.checked))
                .map((permission) => permission.id)
            )
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError?.message || "Unable to load feature access.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoleFeatureAccess();

    return () => {
      cancelled = true;
    };
  }, [roleId, activeStoreTypeId]);

  const tabs = [
    ["overview", "Overview", `/role-templates/${roleId}`],
    ["store-types", "Applicable Store Types", `/role-templates/${roleId}/store-types`],
    ["access", "Feature & Permission Access", `/role-templates/${roleId}/access`],
  ];

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return featurePermissions.filter((feature) => {
      const permissionText = feature.permissions
        .map((permission) => `${permission.name} ${permission.code}`)
        .join(" ");

      return `${feature.name} ${feature.description} ${permissionText}`
        .toLowerCase()
        .includes(query);
    });
  }, [featurePermissions, search]);

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
        feature.permissions.map((permission) => permission.id)
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

        {error && (
          <p className="role-error-message" role="alert">
            {error}
          </p>
        )}

        {loading && <p>Loading feature access...</p>}

        {!loading && (
          <>
            <p className="role-access-count">
              {enabledFeatures.length} Features selected ·{" "}
              {selectedPermissions.length} Permissions selected
            </p>

            {filteredFeatures.length === 0 ? (
              <div className="role-empty-state" style={{ padding: "24px", textAlign: "center", border: "1px dashed #cad1e6", borderRadius: "12px", color: "#53627b", background: "#f8faff" }}>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                  No feature permissions are assigned to this role template yet.
                </p>
                <small style={{ display: "block", marginTop: "8px" }}>
                  The backend returned an empty features list for this role template.
                </small>
              </div>
            ) : (
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
                        {feature.permissions.length === 0 ? (
                          <div style={{ padding: "10px 0", color: "#53627b" }}>
                            No permissions configured for this feature.
                          </div>
                        ) : (
                          feature.permissions.map((permission) => (
                            <label
                              key={permission.id}
                              className={
                                selectedPermissions.includes(permission.id)
                                  ? "selected"
                                  : ""
                              }
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(permission.id)}
                                disabled={!isEnabled}
                                onChange={() => togglePermission(permission.id)}
                              />

                              <span>
                                <strong>{permission.name}</strong>
                                <small>{permission.code}</small>
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}