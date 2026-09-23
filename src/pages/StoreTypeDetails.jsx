import StoreTypeDialog from "../components/StoreTypeDialog";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStoreType, updateStoreType } from "../api/storeTypes";

export default function StoreTypeDetails() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();
  const [form, setForm] = useState({ id: "", code: "", name: "", description: "", status: "Active" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setMessage("");
    getStoreType(storeTypeId)
      .then((item) => {
        if (active) setForm(item);
      })
      .catch((e) => {
        if (active) setError(e.message || "Failed to load store type.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeTypeId, attempt]);

  async function save(e) {
    if (e) e.preventDefault();
    if (busy || !form.id) return;
    if (!form.code.trim() || !form.name.trim()) {
      setError("Store type code and name are required.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateStoreType(form.id, form);
      setForm(updated);
      setMessage("Store type updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update store type.");
    } finally {
      setBusy(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  }

  return (
    <section className="store-type-details-page">
      <button
        type="button"
        className="store-type-details-back"
        onClick={() => navigate("/store-types/new")}
      >
        <i className="bi bi-arrow-left" /> Back to Store Types
      </button>

      {loading && <p role="status">Loading store type...</p>}

      {!loading && (
        <>
          <div className="store-type-details-heading">
            <div>
              <div className="store-type-title-line">
                <h1>{form.name || "Store Type"}</h1>
                <span className={`store-type-active-badge ${form.status === "Inactive" ? "inactive" : ""}`}>
                  <i className="bi bi-circle-fill" /> {form.status}
                </span>
              </div>
              <p>{form.description || "No description provided."}</p>
            </div>
          </div>

          <nav className="store-type-tabs" aria-label="Store type sections">
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
                <h2>Store Type Details</h2>
                <p>Manage code, name, status, and description.</p>
              </div>
            </div>

            <form onSubmit={save}>
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
                      placeholder="e.g. GROCERY"
                      maxLength={50}
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

                <label className="store-type-details-field store-type-details-name" style={{ marginTop: 16 }}>
                  <span>
                    Store Type Name <b>*</b>
                  </span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="e.g. Grocery & Supermarket"
                    maxLength={100}
                  />
                </label>

                <label className="store-type-details-field store-type-details-description" style={{ marginTop: 16 }}>
                  <span>Description</span>
                  <textarea
                    name="description"
                    maxLength="500"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Enter description..."
                    rows={4}
                  />
                  <small>{form.description.length}/500</small>
                </label>

                <div style={{ marginTop: 24 }}>
                  <button type="submit" className="store-type-submit-button" disabled={busy}>
                    {busy ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </fieldset>
            </form>
          </section>
        </>
      )}

      {error && (
        <StoreTypeDialog
          title="Unable to Complete Request"
          variant="error"
          confirmLabel={form.id ? "OK" : "Retry"}
          onConfirm={() => {
            setError("");
            if (!form.id) setAttempt((n) => n + 1);
          }}
          onClose={() => setError("")}
        >
          {error}
        </StoreTypeDialog>
      )}
      {message && !error && (
        <StoreTypeDialog title="Store Type Saved" onClose={() => setMessage("")}>
          {message}
        </StoreTypeDialog>
      )}
    </section>
  );
}
