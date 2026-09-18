import { useState } from "react";
import RoleTemplateDetailsHeader from "../components/RoleTemplateDetailsHeader";
import { storeTypes } from "../data/roleTemplateDetails";

export default function ViewRoleTemplateStoreTypes() {
  const [selectedStoreTypes, setSelectedStoreTypes] = useState(["retail"]);

  function toggleStoreType(id) {
    setSelectedStoreTypes((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <section className="role-details-page">
      <RoleTemplateDetailsHeader activeTab="store-types" />

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