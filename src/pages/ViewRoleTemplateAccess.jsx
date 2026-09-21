import { useEffect, useMemo, useRef, useState } from "react";
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

const getStateArray = (value, fallback = []) =>
  Array.isArray(value) ? value : fallback;

export default function ViewRoleTemplateAccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleId } = useParams();

  const roleTemplate = {
    ...(location.state?.roleTemplate ?? {}),
  };

  const selectedStoreTypes = getStateArray(
    location.state?.selectedStoreTypes
  );

  const initialEnabledFeatures = getStateArray(
    location.state?.enabledFeatures
  );

  const initialSelectedPermissions = getStateArray(
    location.state?.selectedPermissions
  );

  /*
   * IMPORTANT:
   * This was missing from the previous version.
   * The Access screen needs its own feature list loaded
   * from the role-template API.
   */
  const [featurePermissions, setFeaturePermissions] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("saved");
  const [showSavedToast, setShowSavedToast] = useState(false);

  const savedToastTimerRef = useRef(null);

  const [enabledFeatures, setEnabledFeatures] = useState(
    initialEnabledFeatures
  );

  const [selectedPermissions, setSelectedPermissions] = useState(
    initialSelectedPermissions
  );

  const [savedEnabledFeatures, setSavedEnabledFeatures] = useState(
    initialEnabledFeatures
  );

  const [savedSelectedPermissions, setSavedSelectedPermissions] = useState(
    initialSelectedPermissions
  );

  const [showLeavePopup, setShowLeavePopup] = useState(false);

  /*
   * Load Feature & Permission Access based on:
   * - role template ID
   * - selected store type IDs
   */
  useEffect(() => {
    let cancelled = false;

    async function loadFeatures() {
      setLoading(true);
      setError("");

      try {
        if (!roleId) {
          throw new Error("Role template ID is missing.");
        }

        if (selectedStoreTypes.length === 0) {
          setFeaturePermissions([]);

          if (!cancelled) {
            setError(
              "No store type is selected. Please go back and select at least one store type."
            );
          }

          return;
        }

        const response = await roleTemplatesApi.getFeatures(
          roleId,
          selectedStoreTypes
        );

        const items = readFeatureList(response).map(normalizeFeature);

        if (!cancelled) {
          setFeaturePermissions(items);

          /*
           * If the API already marks features/permissions as selected,
           * use those values when no navigation state was supplied.
           */
          if (initialEnabledFeatures.length === 0) {
            const apiEnabledFeatures = items
              .filter((feature) => feature.checked)
              .map((feature) => feature.id);

            setEnabledFeatures(apiEnabledFeatures);
            setSavedEnabledFeatures(apiEnabledFeatures);
          }

          if (initialSelectedPermissions.length === 0) {
            const apiSelectedPermissions = items.flatMap((feature) =>
              feature.permissions
                .filter((permission) => permission.checked)
                .map((permission) => permission.id)
            );

            setSelectedPermissions(apiSelectedPermissions);
            setSavedSelectedPermissions(apiSelectedPermissions);
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error(
            "Failed to load role template features:",
            requestError
          );

          setFeaturePermissions([]);

          setError(
            requestError?.message ||
              "Unable to load features and permissions."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFeatures();

    return () => {
      cancelled = true;
    };
  }, [roleId, selectedStoreTypes.join(",")]);

  const tabs = [
    [
      "overview",
      "Overview",
      `/role-templates/${roleId}`,
    ],
    [
      "store-types",
      "Applicable Store Types",
      `/role-templates/${roleId}/store-types`,
    ],
    [
      "access",
      "Feature & Permission Access",
      `/role-templates/${roleId}/access`,
    ],
  ];

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return featurePermissions.filter((feature) => {
      const permissionText = feature.permissions
        .map((permission) => `${permission.name} ${permission.code}`)
        .join(" ");

      return `${feature.name} ${feature.code} ${feature.description} ${permissionText}`
        .toLowerCase()
        .includes(query);
    });
  }, [featurePermissions, search]);

  useEffect(() => {
    return () => {
      if (savedToastTimerRef.current) {
        clearTimeout(savedToastTimerRef.current);
      }
    };
  }, []);

  function markConfigurationDirty() {
    if (savedToastTimerRef.current) {
      clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = null;
    }

    setSaveState("idle");
    setShowSavedToast(false);
  }

  function toggleFeature(featureId) {
    setEnabledFeatures((current) =>
      current.includes(featureId)
        ? current.filter((item) => item !== featureId)
        : [...current, featureId]
    );

    markConfigurationDirty();
    setError("");
  }

  function togglePermission(permissionId) {
    setSelectedPermissions((current) =>
      current.includes(permissionId)
        ? current.filter((item) => item !== permissionId)
        : [...current, permissionId]
    );

    markConfigurationDirty();
    setError("");
  }

  function selectAll() {
    setEnabledFeatures(
      featurePermissions.map((feature) => feature.id)
    );

    setSelectedPermissions(
      featurePermissions.flatMap((feature) =>
        feature.permissions.map((permission) => permission.id)
      )
    );

    markConfigurationDirty();
    setError("");
  }

  function clearAll() {
    setEnabledFeatures([]);
    setSelectedPermissions([]);

    markConfigurationDirty();
    setError("");
  }

  function buildNavigationState() {
    return {
      roleTemplate,
      selectedStoreTypes,
      enabledFeatures,
      selectedPermissions,
    };
  }

  function navigateToStoreTypes() {
    navigate(`/role-templates/${roleId}/store-types`, {
      state: buildNavigationState(),
    });
  }

  function hasUnsavedChanges() {
    return (
      JSON.stringify(enabledFeatures) !==
        JSON.stringify(savedEnabledFeatures) ||
      JSON.stringify(selectedPermissions) !==
        JSON.stringify(savedSelectedPermissions)
    );
  }

  function handleBackToStoreTypes() {
    if (hasUnsavedChanges()) {
      setShowLeavePopup(true);
      return;
    }

    navigateToStoreTypes();
  }

  async function saveConfiguration() {
    const configuration = {
      roleTemplateId: roleId,
      roleTemplate,
      selectedStoreTypes,
      enabledFeatures,
      selectedPermissions,
      updatedAt: new Date().toISOString(),
    };

    /*
     * Keep local persistence because this is already part
     * of your current flow.
     */
    localStorage.setItem(
      "pinaka_role_template_configs",
      JSON.stringify(configuration)
    );

    /*
     * Also prepare the API payload.
     *
     * We intentionally keep the existing localStorage behavior
     * so your current flow does not break.
     */
    try {
      await roleTemplatesApi.updateFeatureAccess(roleId, {
        storeTypeIds: selectedStoreTypes,
        featureIds: enabledFeatures,
        permissionIds: selectedPermissions,
      });
    } catch (requestError) {
      /*
       * Do not break the UI if the backend endpoint is not
       * ready yet. Local configuration remains saved.
       */
      console.warn(
        "Feature access API update was not completed:",
        requestError
      );
    }

    setSavedEnabledFeatures([...enabledFeatures]);
    setSavedSelectedPermissions([...selectedPermissions]);
  }

  function leaveWithoutSaving() {
    setShowLeavePopup(false);
    navigateToStoreTypes();
  }

  async function saveAndExit() {
    setSaving(true);

    try {
      await saveConfiguration();
    } finally {
      setSaving(false);
      setShowLeavePopup(false);
      navigateToStoreTypes();
    }
  }

  function handleTabNavigation(path) {
    navigate(path, {
      state: buildNavigationState(),
    });
  }

  function showSavedToastMessage() {
    if (savedToastTimerRef.current) {
      clearTimeout(savedToastTimerRef.current);
    }

    setShowSavedToast(true);

    savedToastTimerRef.current = setTimeout(() => {
      setShowSavedToast(false);
      savedToastTimerRef.current = null;
    }, 3000);
  }

  async function handleSaveAndConfirm() {
    setError("");

    if (selectedStoreTypes.length === 0) {
      setError(
        "Please select at least one store type before confirming."
      );
      return;
    }

    if (enabledFeatures.length === 0) {
      setError(
        "Please select at least one feature before confirming."
      );
      return;
    }

    if (selectedPermissions.length === 0) {
      setError(
        "Please select at least one permission before confirming."
      );
      return;
    }

    setSaving(true);
    setSaveState("saving");

    try {
      await saveConfiguration();

      setSaveState("saved");
      showSavedToastMessage();
    } catch (requestError) {
      console.error(
        "Failed to save role template configuration:",
        requestError
      );

      setSaveState("idle");

      setError(
        requestError?.message ||
          "Unable to save the role template configuration."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="role-details-page">
        <div className="role-details-top">
          <button
            type="button"
            className="role-details-back"
            onClick={handleBackToStoreTypes}
            aria-label="Back to applicable store types"
          >
            <i className="bi bi-arrow-left" />
          </button>

          <div className="role-details-heading">
            <div>
              <h1>{roleTemplate.name || "Role Template"}</h1>

              <p>
                Configure store types, features and permissions for this role.
              </p>
            </div>

            <span className="role-details-active">
              <i className="bi bi-circle-fill" />
              {roleTemplate.status || "Active"}
            </span>
          </div>
        </div>

        <nav className="role-details-tabs">
          {tabs.map(([id, label, path]) => (
            <button
              type="button"
              key={id}
              className={id === "access" ? "active" : ""}
              onClick={() => handleTabNavigation(path)}
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
                  Select the features and common permissions available to this
                  role.
                </p>
              </div>
            </div>

            <div className="role-access-actions">
              <button
                type="button"
                onClick={selectAll}
                disabled={loading || featurePermissions.length === 0}
              >
                Select All
              </button>

              <button
                type="button"
                onClick={clearAll}
                disabled={loading || featurePermissions.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>

          {error && (
            <p className="role-error-message" role="alert">
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </p>
          )}

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
            {loading && (
              <div className="role-loading-message">
                <i className="bi bi-arrow-repeat role-save-spinner" />
                <span>Loading features and permissions...</span>
              </div>
            )}

            {!loading &&
              !error &&
              featurePermissions.length === 0 && (
                <div className="role-empty-message">
                  <i className="bi bi-grid" />

                  <strong>No features found</strong>

                  <span>
                    No features and permissions are available for the selected
                    store type.
                  </span>
                </div>
              )}

            {!loading &&
              filteredFeatures.length === 0 &&
              featurePermissions.length > 0 && (
                <div className="role-empty-message">
                  <i className="bi bi-search" />

                  <strong>No matching features</strong>

                  <span>
                    Try another feature or permission search.
                  </span>
                </div>
              )}

            {!loading &&
              filteredFeatures.map((feature) => {
                const isEnabled = enabledFeatures.includes(feature.id);

                return (
                  <section
                    className="role-feature-access-card"
                    key={feature.id}
                  >
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
                          {feature.name}

                          <small>{feature.code}</small>
                        </h3>

                        {feature.description && (
                          <p>{feature.description}</p>
                        )}
                      </div>

                      <span
                        className={
                          isEnabled
                            ? "role-enabled"
                            : "role-disabled"
                        }
                      >
                        {isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <div className="role-permissions-heading">
                      <strong>Permissions</strong>

                      <span>
                        Common permissions for this feature
                      </span>
                    </div>

                    <div className="role-permissions-grid">
                      {feature.permissions.length === 0 && (
                        <span className="role-empty-permissions">
                          No permissions available for this feature.
                        </span>
                      )}

                      {feature.permissions.map((permission) => {
                        const isPermissionSelected =
                          selectedPermissions.includes(permission.id);

                        return (
                          <label
                            key={permission.id}
                            className={
                              isPermissionSelected ? "selected" : ""
                            }
                          >
                            <input
                              type="checkbox"
                              checked={isPermissionSelected}
                              disabled={!isEnabled}
                              onChange={() =>
                                togglePermission(permission.id)
                              }
                            />

                            <span>
                              <strong>{permission.name}</strong>

                              <small>{permission.code}</small>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
          </div>

          <div className="role-details-actions role-access-bottom-actions">
            <button
              type="button"
              className="role-details-secondary-btn"
              onClick={handleBackToStoreTypes}
              disabled={saving}
            >
              <i className="bi bi-arrow-left" />
              Back
            </button>

            <button
              type="button"
              className={`role-details-primary-btn ${
                saveState === "saved" && !hasUnsavedChanges()
                  ? "is-saved"
                  : ""
              }`}
              onClick={handleSaveAndConfirm}
              disabled={
                saving ||
                loading ||
                featurePermissions.length === 0 ||
                !hasUnsavedChanges()
              }
            >
              {saveState === "saving"
                ? "Saving..."
                : hasUnsavedChanges()
                  ? "Save & Confirm"
                  : "Saved"}

              <i
                className={
                  saveState === "saving"
                    ? "bi bi-arrow-repeat role-save-spinner"
                    : hasUnsavedChanges()
                      ? "bi bi-check-lg"
                      : "bi bi-check-circle-fill"
                }
              />
            </button>
          </div>
        </section>
      </section>

      {showSavedToast && (
        <div
          className="role-save-toast"
          role="status"
          aria-live="polite"
        >
          <span className="role-save-toast-icon">
            <i className="bi bi-check-lg" />
          </span>

          <div>
            <strong>Configuration saved successfully</strong>

            <span>
              Your feature and permission changes are saved.
            </span>
          </div>

          <button
            type="button"
            className="role-save-toast-close"
            onClick={() => setShowSavedToast(false)}
            aria-label="Close save confirmation"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {showLeavePopup && (
        <div
          className="role-leave-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-leave-title"
        >
          <div className="role-leave-modal">
            <div className="role-leave-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>

            <h3 id="role-leave-title">
              Leave Configuration?
            </h3>

            <p>
              You have unsaved changes. Would you like to save your changes
              before leaving?
            </p>

            <div className="role-leave-actions">
              <button
                type="button"
                className="role-leave-cancel-btn"
                onClick={() => setShowLeavePopup(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="role-leave-discard-btn"
                onClick={leaveWithoutSaving}
                disabled={saving}
              >
                Leave Without Saving
              </button>

              <button
                type="button"
                className="role-leave-save-btn"
                onClick={saveAndExit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save & Exit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}