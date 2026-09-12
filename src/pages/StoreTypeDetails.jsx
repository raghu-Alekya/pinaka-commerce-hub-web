import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const storeType = {
  code: "RESTAURANT",
  name: "Restaurant",
  status: "Active",
  description:
    "Full-service and quick service restaurant vertical with kitchen and dining operations.",
};

export default function StoreTypeDetails() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState(storeType);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <section className="store-type-details-page">
      <button
        type="button"
        className="store-type-details-back"
        onClick={() => navigate("/store-types/new")}
      >
        <i className="bi bi-arrow-left" />
        Back to Store Types
      </button>

      <div className="store-type-details-heading">
        <div>
          <div className="store-type-title-line">
            <h1>{form.name}</h1>
            <span className="store-type-active-badge">
              <i className="bi bi-circle-fill" />
              {form.status}
            </span>
          </div>

          <p>
            Store type for restaurant vertical with full service and quick
            service operations.
          </p>
        </div>
      </div>

      <nav className="store-type-tabs" aria-label="Store type sections">
        <button
          type="button"
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>

       <button
          type="button"
         onClick={() => navigate(`/store-types/${storeTypeId}/features`)}
>
          Features
        </button>

        <button
          type="button"
          className={activeTab === "roles" ? "active" : ""}
          onClick={() => setActiveTab("roles")}
        >
          Role Templates
        </button>

        <button
          type="button"
          className={activeTab === "configuration" ? "active" : ""}
          onClick={() => setActiveTab("configuration")}
        >
          Configuration Defaults
        </button>
      </nav>

      {activeTab === "overview" ? (
        <section className="store-type-details-card">
          <div className="store-type-details-card-heading">
            <div className="store-type-details-icon">
              <i className="bi bi-record-circle" />
            </div>

            <h2>Basic Information</h2>
          </div>

          <div className="store-type-details-grid">
            <label className="store-type-details-field">
              <span>
                Store Type Code <b>*</b>
              </span>

              <input
                name="code"
                value={form.code}
                onChange={updateField}
              />
            </label>

            <label className="store-type-details-field">
              <span>Status</span>

              <select
                name="status"
                value={form.status}
                onChange={updateField}
                className="store-type-details-status"
              >
                <option value="Active">● Active</option>
                <option value="Inactive">● Inactive</option>
              </select>
            </label>
          </div>

          <label className="store-type-details-field store-type-details-name">
            <span>
              Store Type Name <b>*</b>
            </span>

            <input
              name="name"
              value={form.name}
              onChange={updateField}
            />
          </label>

          <label className="store-type-details-field store-type-details-description">
            <span>
              Description <b>*</b>
            </span>

            <textarea
              name="description"
              maxLength="500"
              value={form.description}
              onChange={updateField}
            />

            <small>{form.description.length}/500</small>
          </label>
        </section>
      ) : (
        <section className="store-type-details-card store-type-empty-tab">
          <i className="bi bi-gear" />
          <h2>
            {activeTab === "features" && "Features"}
            {activeTab === "roles" && "Role Templates"}
            {activeTab === "configuration" && "Configuration Defaults"}
          </h2>
          <p>
            Configure this store type section here.
          </p>
        </section>
      )}
    </section>
  );
}