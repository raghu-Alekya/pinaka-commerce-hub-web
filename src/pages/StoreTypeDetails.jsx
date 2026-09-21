import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { storeTypesApi } from "../api/storeTypes";

const initialStoreType = {
  code: "RESTAURANT",
  name: "Restaurant",
  status: "Active",
  description:
    "Full-service and quick service restaurant vertical with kitchen and dining operations.",
};

export default function StoreTypeDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeTypeId } = useParams();
  const initialState = location.state?.storeType;

  const [form, setForm] = useState(() => ({
    ...initialStoreType,
    ...(initialState
      ? {
          code: initialState.code ?? initialState.storeTypeCode ?? "",
          name: initialState.name ?? initialStoreType.name,
          status: initialState.status ?? initialStoreType.status,
          description:
            initialState.description ?? initialStoreType.description,
        }
      : {}),
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    storeTypesApi
      .getOne(storeTypeId)
      .then((response) => {
        const storeType = response?.storeType ?? response?.data ?? response;

        if (!storeType || typeof storeType !== "object") {
          throw new Error("GET /store-types/:id did not return a store type.");
        }

        if (!cancelled) {
          setForm({
            code: storeType.storeTypeCode ?? storeType.code ?? "",
            name: storeType.name ?? "",
            status: storeType.status === "INACTIVE" ? "Inactive" : "Active",
            description: storeType.description ?? "",
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeTypeId]);

  return (
    <section className="store-type-details-page">
      <div className="store-type-details-top">
  <button
    type="button"
    className="store-type-details-back"
    onClick={() => navigate("/store-types/new")}
    aria-label="Back to Store Types"
    title="Back to Store Types"
  >
    <i className="bi bi-arrow-left" />
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

    <p>{form.description}</p>
  </div>
</div>

{loading && <p>Loading store type...</p>}
{error && <p role="alert">{error}</p>}

<nav className="store-type-tabs" aria-label="Store type sections">
  <button type="button" className="active">
    Overview
  </button>

        <button
          type="button"
          onClick={() =>
            navigate(`/store-types/${storeTypeId}/features`, {
              state: { storeType: form },
            })
          }
        >
          Features
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(`/store-types/${storeTypeId}/role-templates`, {
              state: { storeType: form },
            })
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
