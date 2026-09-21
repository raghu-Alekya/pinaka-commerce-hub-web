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

const readAccessFlag = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null);

  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const normalizePermission = (permission, featureId, permissionIndex) => {
  const permissionRecord = permission?.permission ?? permission ?? {};
  const permissionAssignment =
    permission?.permissionAccess ??
    permission?.roleTemplatePermission ??
    permission?.assignment ??
    permission?.data ??
    {};
  const backendPermissionId =
    permission?.permissionId ??
    permission?.permission_id ??
    permissionRecord.permissionId ??
    permissionRecord.permission_id ??
    permissionRecord.id ??
    permission?.id ??
    permissionRecord.uuid;
  const permissionId = backendPermissionId ?? `${featureId}-permission-${permissionIndex}`;

  return {
    id: String(permissionId),
    backendId: backendPermissionId ? String(backendPermissionId) : "",
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
    checked: readAccessFlag(
      permissionAssignment?.assigned,
      permissionAssignment?.isAssigned,
      permissionAssignment?.hasAccess,
      permissionAssignment?.isEnabled,
      permission?.assigned,
      permissionRecord?.assigned,
      permission?.isAssigned,
      permissionRecord?.isAssigned,
      permission?.hasAccess,
      permissionRecord?.hasAccess,
      permission?.isEnabled,
      permissionRecord?.isEnabled,
      permission?.checked,
      permissionRecord?.checked,
      permission?.enabled,
      permissionRecord?.enabled,
      permission?.mapped,
      permissionRecord?.mapped,
      permission?.defaultAllowed,
      permissionRecord?.defaultAllowed,
      permission?.defaultEnabled,
      permissionRecord?.defaultEnabled
    ),
  };
};

const normalizeFeature = (feature, featureIndex) => {
  const featureRecord = feature?.feature ?? feature ?? {};
  const featureAssignment =
    feature?.featureAccess ??
    feature?.roleTemplateFeature ??
    feature?.assignment ??
    feature?.data ??
    {};
  const backendFeatureId =
    feature?.featureId ??
    feature?.feature_id ??
    featureRecord.featureId ??
    featureRecord.feature_id ??
    featureRecord.id ??
    feature?.id;
  const featureId = backendFeatureId ?? `feature-${featureIndex}`;

  const permissions = Array.isArray(feature?.permissions)
    ? feature.permissions
    : Array.isArray(featureRecord?.permissions)
      ? featureRecord.permissions
      : [];

  return {
    id: String(featureId),
    backendId: backendFeatureId ? String(backendFeatureId) : "",
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
    checked: readAccessFlag(
      featureAssignment?.assigned,
      featureAssignment?.isAssigned,
      featureAssignment?.hasAccess,
      featureAssignment?.isEnabled,
      feature?.assigned,
      featureRecord?.assigned,
      feature?.isAssigned,
      featureRecord?.isAssigned,
      feature?.hasAccess,
      featureRecord?.hasAccess,
      feature?.isEnabled,
      featureRecord?.isEnabled,
      feature?.checked,
      featureRecord?.checked,
      feature?.enabled,
      featureRecord?.enabled,
      feature?.mapped,
      featureRecord?.mapped,
      feature?.defaultEnabled,
      featureRecord?.defaultEnabled
    ),
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
  const [savingFeatureId, setSavingFeatureId] = useState(null);

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

  function getBackendFeatureIds(featureIds) {
    return featureIds
      .map((featureId) => featurePermissions.find((feature) => feature.id === featureId)?.backendId)
      .filter(Boolean);
  }

  function getBackendPermissionIds(permissionIds) {
    return permissionIds
      .map((permissionId) =>
        featurePermissions
          .flatMap((feature) => feature.permissions)
          .find((permission) => permission.id === permissionId)?.backendId
      )
      .filter(Boolean);
  }

  async function toggleFeature(featureId) {
    const isEnabled = enabledFeatures.includes(featureId);
    const feature = featurePermissions.find((item) => item.id === featureId);

    if (!isEnabled) {
      const permissionIds = feature?.permissions
        .map((permission) => permission.backendId || permission.id)
        .filter(Boolean);

      const featureBackendId = feature?.backendId || feature?.id;

      if (!featureBackendId || !permissionIds.length) {
        setError("This feature must have valid permission IDs before it can be enabled.");
        return;
      }

      setSavingFeatureId(featureId);
      setError("");

      try {
        const nextEnabledFeatures = [...enabledFeatures, featureId];
        const nextSelectedPermissions = [
          ...new Set([
            ...selectedPermissions,
            ...feature.permissions.map((permission) => permission.id),
          ]),
        ];

        await roleTemplatesApi.addFeaturePermissions(
          roleId,
          getBackendFeatureIds(nextEnabledFeatures),
          getBackendPermissionIds(nextSelectedPermissions)
        );
        setEnabledFeatures(nextEnabledFeatures);
        setSelectedPermissions(nextSelectedPermissions);
      } catch (requestError) {
        setError(requestError?.message || "Unable to enable feature access.");
      } finally {
        setSavingFeatureId(null);
      }
      return;
    }

    setSavingFeatureId(featureId);
    setError("");

    try {
      if (!feature?.backendId) {
        throw new Error("This feature has no valid backend ID and cannot be removed.");
      }

      await roleTemplatesApi.removeFeaturePermissions(roleId, [feature.backendId]);
      setEnabledFeatures((current) => current.filter((item) => item !== featureId));
      setSelectedPermissions((current) =>
        current.filter(
          (permissionId) =>
            !featurePermissions
              .find((feature) => feature.id === featureId)
              ?.permissions.some((permission) => permission.id === permissionId)
        )
      );
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove feature access.");
    } finally {
      setSavingFeatureId(null);
    }
  }

  async function togglePermission(featureId, permissionId) {
    const feature = featurePermissions.find((item) => item.id === featureId);

    if (!selectedPermissions.includes(permissionId)) {
      const permission = feature?.permissions.find((item) => item.id === permissionId);
      const featureBackendId = feature?.backendId || feature?.id;
      const permissionBackendId = permission?.backendId || permission?.id;

      if (!featureBackendId || !permissionBackendId) {
        setError("This permission has no valid backend ID and cannot be enabled.");
        return;
      }

      setSavingFeatureId(featureId);
      setError("");

      try {
        await roleTemplatesApi.addFeaturePermissions(
          roleId,
          getBackendFeatureIds(
            enabledFeatures.includes(featureId)
              ? enabledFeatures
              : [...enabledFeatures, featureId]
          ),
          getBackendPermissionIds([...selectedPermissions, permissionId])
        );
        setSelectedPermissions((current) => [...new Set([...current, permissionId])]);
        setEnabledFeatures((current) =>
          current.includes(featureId) ? current : [...current, featureId]
        );
      } catch (requestError) {
        setError(requestError?.message || "Unable to enable permission access.");
      } finally {
        setSavingFeatureId(null);
      }
      return;
    }

    const remainingPermissionIds = selectedPermissions.filter(
      (item) => item !== permissionId
    );
    const featureHasSelectedPermissions = feature?.permissions.some((permission) =>
      remainingPermissionIds.includes(permission.id)
    );

    if (featureHasSelectedPermissions) {
      setSavingFeatureId(featureId);
      setError("");

      try {
        await roleTemplatesApi.addFeaturePermissions(
          roleId,
          getBackendFeatureIds(enabledFeatures),
          getBackendPermissionIds(remainingPermissionIds)
        );
        setSelectedPermissions(remainingPermissionIds);
      } catch (requestError) {
        setError(requestError?.message || "Unable to remove permission access.");
      } finally {
        setSavingFeatureId(null);
      }
      return;
    }

    setSavingFeatureId(featureId);
    setError("");

    try {
      if (!feature?.backendId) {
        throw new Error("This feature has no valid backend ID and cannot be removed.");
      }

      await roleTemplatesApi.removeFeaturePermissions(roleId, [feature.backendId]);
      setSelectedPermissions(remainingPermissionIds);
      setEnabledFeatures((current) => current.filter((item) => item !== featureId));
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove permission access.");
    } finally {
      setSavingFeatureId(null);
    }
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
                          disabled={savingFeatureId === feature.id}
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
                                disabled={savingFeatureId === feature.id}
                                onChange={() => togglePermission(feature.id, permission.id)}
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