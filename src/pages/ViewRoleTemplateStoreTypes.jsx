import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const storeTypes = [
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
  const defaultSelection = roleTemplate.storeTypeId ?? "retail";
  const [selectedStoreTypes, setSelectedStoreTypes] = useState([defaultSelection]);

  const tabs = [
    ["overview", "Overview", `/role-templates/${roleId}`],
    ["store-types", "Applicable Store Types", `/role-templates/${roleId}/store-types`],
    ["access", "Feature & Permission Access", `/role-templates/${roleId}/access`],
  ];

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

        <div className="role-store-types-grid">
          {storeTypes.map((storeType) => (
            <label
              key={storeType.id}
              className={`role-store-type-option ${
                selectedStoreTypes.includes(storeType.id) ? "selected" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selectedStoreTypes.includes(storeType.id)}
                onChange={() => toggleStoreType(storeType.id)}
              />

              <span>
                <strong>{storeType.name}</strong>
                <small>{storeType.code}</small>
              </span>
            </label>
          ))}
        </div>
      </section>
    </section>
  );
}