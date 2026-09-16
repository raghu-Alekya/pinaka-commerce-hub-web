import StoreTypeDialog from "../components/StoreTypeDialog";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getStoreType, updateStoreType } from "../api/storeTypes";

export default function StoreTypeDetails() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState({ code: "", name: "", description: "", status: "Active" });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setMessage("");
    getStoreType(storeTypeId).then(item => { if (active) setForm(item); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [storeTypeId, attempt]);
  async function save() {
    if (busy || !form.id) return;
    if (!form.code.trim() || !form.name.trim()) { setError("Code and name are required."); return; }
    setBusy(true); setError(""); setMessage(""); setMessage("");
    try { setForm(await updateStoreType(form.id, form)); setMessage("Store type updated."); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <section className="store-type-details-page">
      {loading && <p role="status">Loading store type...</p>}
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
            {form.description}
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

      </nav>

      {activeTab === "overview" ? (
        <section className="store-type-details-card">
          <div className="store-type-details-card-heading">
            <div className="store-type-details-icon">
              <i className="bi bi-record-circle" />
            </div>

            <h2>Basic Information</h2>
          </div>

          <fieldset disabled={loading || busy || !form.id} style={{ border: 0, padding: 0, margin: 0 }}>
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
          <button type="button" className="store-type-submit-button" onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
          </fieldset>
        </section>
      ) : (
        <section className="store-type-details-card store-type-empty-tab">
          <i className="bi bi-gear" />
          <h2>
            {activeTab === "features" && "Features"}
            {activeTab === "roles" && "Role Templates"}
          </h2>
          <p>
            Configure this store type section here.
          </p>
        </section>
      )}
      {error && <StoreTypeDialog title="Unable to Complete Request" variant="error" confirmLabel={form.id ? "OK" : "Retry"} onConfirm={() => { setError(""); if (!form.id) setAttempt(n => n + 1); }} onClose={() => setError("")}>{error}</StoreTypeDialog>}
      {message && !error && <StoreTypeDialog title="Store Type Saved" onClose={() => setMessage("")}>{message}</StoreTypeDialog>}
    </section>
  );
}