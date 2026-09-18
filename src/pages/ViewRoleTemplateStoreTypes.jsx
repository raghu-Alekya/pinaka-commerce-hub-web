import { useEffect, useState } from "react";
import { storeTypesApi } from "../api/storeTypes";
import RoleTemplateDetailsHeader from "../components/RoleTemplateDetailsHeader";

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

const storeTypes = [
  { id: "retail", name: "Retail", code: "RETAIL" },
  { id: "restaurant", name: "Restaurant", code: "RESTAURANT" },
  { id: "spa", name: "Spa", code: "SPA" },
  { id: "kiosk", name: "Kiosk", code: "KIOSK" },
];

export default function ViewRoleTemplateStoreTypes() {
  const [storeTypes, setStoreTypes] = useState([]);
  const [selectedStoreTypes, setSelectedStoreTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStoreTypes() {
      setLoading(true);
      setError("");

      try {
        const response = await storeTypesApi.getAll();
        const items = readStoreTypes(response);

        if (!cancelled) {
          setStoreTypes(items);
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
  }, []);

  function toggleStoreType(id) {
    setSelectedStoreTypes((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
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

          {!loading && !error && storeTypes.length === 0 && (
            <p>No store types found.</p>
          )}

          {!loading && storeTypes.map((storeType) => {
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