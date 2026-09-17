import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const initialStoreType = {
  code: "RESTAURANT",
  name: "Restaurant",
  status: "Active",
  description:
    "Full-service and quick service restaurant vertical with kitchen and dining operations.",
};

export default function StoreTypeDetails() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();

  const [form, setForm] = useState(initialStoreType);

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
        <div className="store-type-title-line">
          <h1>{form.name}</h1>

          <span
            className={`store-type-active-badge ${
              form.status === "Inactive" ? "inactive" : ""
            }`}
          >
            <i className="bi bi-circle-fill" />
            {form.status}
          </span>
        </div>

        <p>
          Store type for restaurant vertical with full service and quick
          service operations.
        </p>
      </div>

      <nav className="store-type-tabs" aria-label="Store type sections">
        <button type="button" className="active">
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
          onClick={() =>
            navigate(`/store-types/${storeTypeId}/role-templates`)
          }
        >
          Role Templates
        </button>
      </nav>

      <section className="store-type-details-card">
        <div className="store-type-details-card-heading">
          <div className="store-type-details-icon">
            <i className="bi bi-info-circle" />
          </div>

          <div>
            <h2>Basic Information</h2>
            <p>View and update the core store type details.</p>
          </div>
        </div>

        <div className="store-type-details-grid">
          <label className="store-type-details-field">
            <span>
              Store Type Code <b>*</b>
            </span>
            <input
             name="code"
              value={form.code}
               readOnly
               />
            <small>
              Use uppercase letters, numbers, and underscores only.
            </small>
          </label>

          <label className="store-type-details-field">
            <span>
              Status <b>*</b>
            </span>

            <input
              name="status"
              value={form.status}
              readOnly
              className="store-type-details-status"
            />

            <small>Inactive types cannot be used for new stores.</small>
          </label>
        </div>

        <label className="store-type-details-field store-type-details-name">
          <span>
            Store Type Name <b>*</b>
          </span>

          <input
            name="name"
            value={form.name}
            readOnly
            maxLength="80"
          />
        </label>

        <label className="store-type-details-field store-type-details-description">
          <span>
            Description
          </span>

          <textarea
            name="description"
            value={form.description}
            readOnly
            maxLength="500"
          />

          <small>{form.description.length}/500</small>
        </label>

      </section>
    </section>
  );
}