import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { roleTemplatesApi } from "../api/roleTemplatesApi";

function readStoreTypes(response) {
  const candidates = [
    response?.storeTypes,
    response?.data?.storeTypes,
    response?.data?.data,
    response?.data?.items,
    response?.data?.results,
    response?.data,
    response?.items,
    response?.results,
    response,
  ];

  return candidates.find((value) => Array.isArray(value)) || [];
}

function normalizeStoreTypeEntry(item, index) {
  const storeType = item?.storeType ?? item ?? {};
  const rawId =
    storeType.id ??
    storeType._id ??
    item?.storeTypeId ??
    item?.id ??
    `store-type-${index}`;

  return {
    ...storeType,
    id: rawId,
    name:
      storeType.name ??
      storeType.storeTypeName ??
      item?.name ??
      "Unnamed store type",
    code:
      storeType.code ??
      storeType.storeTypeCode ??
      item?.code ??
      item?.storeTypeCode ??
      "",
    checked:
      item?.checked ??
      storeType?.checked ??
      item?.mapped ??
      storeType?.mapped ??
      item?.enabled ??
      storeType?.enabled ??
      item?.active ??
      storeType?.active ??
      item?.isEnabled ??
      storeType?.isEnabled ??
      item?.isActive ??
      storeType?.isActive ??
      false,
  };
}

const fallbackStoreTypesList = [
  { id: "retail", name: "Retail", code: "RETAIL" },
  { id: "restaurant", name: "Restaurant", code: "RESTAURANT" },
  { id: "spa", name: "Spa", code: "SPA" },
  { id: "kiosk", name: "Kiosk", code: "KIOSK" },
];

const getStateArray = (value) => (Array.isArray(value) ? value : []);

export default function ViewRoleTemplateStoreTypes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleId } = useParams();

  const roleTemplate = {
    ...(location.state?.roleTemplate ?? {}),
  };

  const initialSelectedStoreTypes = getStateArray(
    location.state?.selectedStoreTypes
  );

  const [storeTypesList, setStoreTypesList] = useState(
    fallbackStoreTypesList
  );
  const [selectedStoreTypes, setSelectedStoreTypes] = useState(
    initialSelectedStoreTypes
  );
  const [enabledFeatures, setEnabledFeatures] = useState(
    getStateArray(location.state?.enabledFeatures)
  );
  const [selectedPermissions, setSelectedPermissions] = useState(
    getStateArray(location.state?.selectedPermissions)
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // This snapshot represents the last state received/saved for this screen.
  const [savedStoreTypes, setSavedStoreTypes] = useState(
    initialSelectedStoreTypes
  );

  const tabs = [
    [
      "overview",
      "Overview",
      `/role-templates/${roleId || "store-manager"}`,
    ],
    [
      "store-types",
      "Applicable Store Types",
      `/role-templates/${roleId || "store-manager"}/store-types`,
    ],
    [
      "access",
      "Feature & Permission Access",
      `/role-templates/${roleId || "store-manager"}/access`,
    ],
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadStoreTypes() {
      setLoading(true);
      setError("");

      try {
        const response = await roleTemplatesApi.getAvailableStoreTypes(roleId);
        const items = readStoreTypes(response).map(normalizeStoreTypeEntry);

        if (!cancelled) {
          setStoreTypesList(items);
          setSelectedStoreTypes(
            items
              .filter((storeType) => Boolean(storeType.checked))
              .map((storeType) => storeType.id)
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError?.message || "Unable to load store types."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStoreTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleStoreType(id) {
    setSelectedStoreTypes((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );

    // Selecting/deselecting fixes the validation message.
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

  function navigateBackToOverview() {
    navigate(`/role-templates/${roleId || "store-manager"}`, {
      state: buildNavigationState(),
    });
  }

  function handleSaveAndContinue() {
    setError("");

    if (selectedStoreTypes.length === 0) {
      setError("Please select at least one store type before continuing.");
      return;
    }

    setSaving(true);

    setSavedStoreTypes(selectedStoreTypes);

    navigate(
      `/role-templates/${roleId || "store-manager"}/access`,
      {
        state: buildNavigationState(),
      }
    );

    setSaving(false);
  }

  function hasUnsavedChanges() {
    return (
      JSON.stringify(selectedStoreTypes) !==
      JSON.stringify(savedStoreTypes)
    );
  }

  function handleBack() {
    if (hasUnsavedChanges()) {
      setPendingNavigation(() => navigateBackToOverview);
      setShowLeavePopup(true);
      return;
    }

    navigateBackToOverview();
  }

  function closeLeavePopup() {
    if (saving) return;

    setShowLeavePopup(false);
    setPendingNavigation(null);
  }

  function leaveWithoutSaving() {
    if (saving) return;

    setShowLeavePopup(false);

    if (pendingNavigation) {
      pendingNavigation();
    }

    setPendingNavigation(null);
  }

  function saveAndExit() {
    if (selectedStoreTypes.length === 0) {
      setShowLeavePopup(false);
      setPendingNavigation(null);
      setError("Please select at least one store type before saving.");
      return;
    }

    setSaving(true);

    // Front-end persistence until the role-configuration save API is connected.
    const configuration = {
      roleTemplateId: roleId,
      roleTemplate,
      selectedStoreTypes,
      enabledFeatures,
      selectedPermissions,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "pinaka_role_template_configs",
      JSON.stringify(configuration)
    );

    setSavedStoreTypes(selectedStoreTypes);
    setSaving(false);
    setShowLeavePopup(false);

    if (pendingNavigation) {
      pendingNavigation();
    } else {
      navigateBackToOverview();
    }

    setPendingNavigation(null);
  }

  function handleTabNavigation(path) {
    navigate(path, {
      state: buildNavigationState(),
    });
  }

  return (
    <>
      <section className="role-details-page">
        <div className="role-details-top">
          <button
            type="button"
            className="role-details-back"
            onClick={handleBack}
            aria-label="Back to role template"
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
              className={id === "store-types" ? "active" : ""}
              onClick={() => handleTabNavigation(path)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="role-details-card">
          <div className="role-details-card-title">
            <span>
              <i className="bi bi-shop" />
            </span>

            <div>
              <h2>Applicable Store Types</h2>
              <p>
                Select the store types where this role template can be used.
              </p>
            </div>
          </div>

          {error && (
            <p className="role-error-message" role="alert">
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </p>
          )}

          <div className="role-store-types-grid">
            {loading && (
              <p className="role-loading-message">
                Loading store types...
              </p>
            )}

            {!loading && storeTypesList.length === 0 && (
              <p className="role-empty-message">
                No store types found.
              </p>
            )}

            {!loading &&
              storeTypesList.map((storeType) => {
                const storeTypeId =
                  storeType.id ??
                  storeType._id ??
                  storeType.storeTypeId;

                const storeTypeName =
                  storeType.name ||
                  storeType.storeTypeName ||
                  "Store Type";

                const storeTypeCode =
                  storeType.code ||
                  storeType.storeTypeCode ||
                  "";

                const isSelected = selectedStoreTypes.includes(storeTypeId);

                return (
                  <label
                    key={storeTypeId}
                    className={`role-store-type-option ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStoreType(storeTypeId)}
                    />

                    <span>
                      <strong>{storeTypeName}</strong>
                      <small>{storeTypeCode}</small>
                    </span>
                  </label>
                );
              })}
          </div>

          <div className="role-selection-summary">
            <span>
              {selectedStoreTypes.length} store type
              {selectedStoreTypes.length === 1 ? "" : "s"} selected
            </span>
          </div>

          <div className="role-details-actions">
            <button
              type="button"
              className="role-details-secondary-btn"
              onClick={handleBack}
              disabled={saving}
            >
              Back
            </button>

            <button
              type="button"
              className="role-details-primary-btn"
              onClick={handleSaveAndContinue}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save & Continue"}
              {!saving && <i className="bi bi-arrow-right" />}
            </button>
          </div>
        </section>
      </section>

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

            <h3 id="role-leave-title">Leave Configuration?</h3>

            <p>
              You have unsaved changes. Would you like to save your changes
              before leaving?
            </p>

            <div className="role-leave-actions">
              <button
                type="button"
                className="role-leave-cancel-btn"
                onClick={closeLeavePopup}
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