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

export default function ViewRoleTemplateStoreTypes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleId } = useParams();
  const roleTemplate = {
    ...(location.state?.roleTemplate ?? {}),
  };

  const [storeTypesList, setStoreTypesList] = useState(fallbackStoreTypesList);
  const [selectedStoreTypes, setSelectedStoreTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingStoreTypeId, setSavingStoreTypeId] = useState(null);
  const [error, setError] = useState("");

  const tabs = [
    ["overview", "Overview", `/role-templates/${roleId || "store-manager"}`],
    ["store-types", "Applicable Store Types", `/role-templates/${roleId || "store-manager"}/store-types`],
    ["access", "Feature & Permission Access", `/role-templates/${roleId || "store-manager"}/access`],
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
            requestError?.message ||
              "Unable to load store types."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStoreTypes();

    return () => {
      cancelled = true;
    };
  }, [roleId]);

  async function toggleStoreType(id) {
    const previousSelection = selectedStoreTypes;
    const nextSelection = previousSelection.includes(id)
      ? previousSelection.filter((item) => item !== id)
      : [...previousSelection, id];

    setSelectedStoreTypes(nextSelection);
    setSavingStoreTypeId(id);
    setError("");

    try {
      await roleTemplatesApi.bulkUpdateStoreTypes(roleId, nextSelection);
    } catch (requestError) {
      setSelectedStoreTypes(previousSelection);
      setError(
        requestError?.message ||
          "Unable to update applicable store types."
      );
    } finally {
      setSavingStoreTypeId(null);
    }
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
            className={id === "store-types" ? "active" : ""}
            onClick={() => navigate(path, { state: { roleTemplate } })}
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
            <p>Select the store types where this role template can be used.</p>
          </div>
        </div>
        {error && (
          <p className="role-error-message" role="alert">
            {error}
          </p>
        )}

        <div className="role-store-types-grid">
          {loading && <p>Loading store types...</p>}

          {!loading && storeTypesList.length === 0 && (
            <p>No store types found.</p>
          )}

          {!loading && storeTypesList.map((storeType) => {
            const storeTypeId =
              storeType.id ??
              storeType._id ??
              storeType.storeTypeId;

            return (
              <label
                key={storeTypeId}
                className={`role-store-type-option ${
                  selectedStoreTypes.includes(storeTypeId) ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedStoreTypes.includes(storeTypeId)}
                  onChange={() => toggleStoreType(storeTypeId)}
                  disabled={savingStoreTypeId !== null}
                />

                <span>
                  <strong>{storeType.name || storeType.storeTypeName}</strong>
                  <small>{storeType.code || storeType.storeTypeCode}</small>
                </span>
              </label>
            );
          })}
        </div>
      </section>
    </section>
  );
}