import StoreTypeDialog from "../components/StoreTypeDialog";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listStoreTypes, createStoreType, updateStoreType, deleteStoreType } from "../api/storeTypes";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  status: "Active",
};

export default function CreateStoreType() {
  const navigate = useNavigate();
  const [storeTypes, setStoreTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    listStoreTypes().then(items => { if (active) setStoreTypes(items); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const filteredStoreTypes = useMemo(() => {
    const value = search.toLowerCase();

    return storeTypes.filter((item) => {
      const matchesSearch = `${item.code} ${item.name} ${item.description}`
        .toLowerCase()
        .includes(value);

      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [storeTypes, search, statusFilter]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
  }

  async function submitForm(event) {
    event.preventDefault();
    if (busy) return;
    if (!form.code.trim() || !form.name.trim()) { setError("Code and name are required."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = editingId ? await updateStoreType(editingId, form) : await createStoreType(form);
      setStoreTypes(items => editingId ? items.map(item => item.id === editingId ? saved : item) : [saved, ...items]);
      setMessage(editingId ? "Store type updated." : "Store type created.");
      resetForm();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  function editStoreType(item) {
    setEditingId(item.id);

    setForm({
      code: item.code,
      name: item.name,
      description: item.description,
      status: item.status,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmDelete() {
    if (busy || !deleteTarget) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await deleteStoreType(deleteTarget.id);
      setStoreTypes(items => items.map(item => item.id === deleteTarget.id ? { ...item, status: "Inactive" } : item));
      if (editingId === deleteTarget.id) resetForm();
      setMessage("Store type deactivated.");
      setDeleteTarget(null);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <section className="store-types-page">
      <div className="store-types-page-heading">
        <div>
          <h1>{editingId ? "Edit Store Type" : "Create Store Type"}</h1>
          <p>Define a business vertical and its baseline configuration.</p>
        </div>
      </div>

      <form className="store-type-form-card" onSubmit={submitForm}>
        <div className="store-type-card-heading">
          <div className="store-type-heading-icon">
            <i className="bi bi-shop" />
          </div>

          <div>
            <h2>Store Type Information</h2>
            <p>Provide the basic details about the store type.</p>
          </div>
        </div>

        <fieldset disabled={busy || loading} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="store-type-form-grid">
          <label className="store-type-field">
            <span>
              Store Type Code <b>*</b>
            </span>

            <div className="store-type-input-wrap">
              <i className="bi bi-tag" />
              <input
                name="code"
                value={form.code}
                onChange={updateField}
                placeholder="e.g. GROCERY"
              />
            </div>

            <small>Unique key (e.g. REFUNDS / KIDS / LOYALTY)</small>
          </label>

          <label className="store-type-field">
            <span>
              Display Name <b>*</b>
            </span>

            <div className="store-type-input-wrap">
              <i className="bi bi-type" />
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="e.g. Grocery"
              />
            </div>

            <small>Name shown in the system</small>
          </label>
        </div>

        <label className="store-type-field store-type-description-field">
          <span>
            Description <b>*</b>
          </span>

          <div className="store-type-textarea-wrap">
            <i className="bi bi-file-earmark-text" />
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              maxLength="500"
              placeholder="Describe the vertical, its operating model, and configuration needs..."
            />
          </div>

          <small className="store-type-character-count">
            {form.description.length}/500
          </small>
        </label>

        <label className="store-type-field store-type-status-field">
          <span>
            Status <b>*</b>
          </span>

          <select name="status" value={form.status} onChange={updateField}>
            <option value="Active">● Active</option>
            <option value="Inactive">● Inactive</option>
          </select>

          <small>Active or Inactive.</small>
        </label>

        <div className="store-type-actions">
          <button
            type="button"
            className="store-type-cancel-button"
            onClick={resetForm}
          >
            Cancel
          </button>

          <button type="submit" className="store-type-submit-button">
            {editingId ? "Update store type" : "Create store type"}
          </button>
        </div>
        </fieldset>
      </form>

      <section className="store-types-list-card">
        <h2>Store Types List</h2>
        <button type="button" className="store-type-reset-button" disabled={loading || busy} onClick={() => setAttempt(n => n + 1)}>Refresh list</button>

        <div className="store-types-filters">
          <label className="store-type-search">
            <i className="bi bi-search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search store types..."
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="store-type-reset-button"
            title="Reset filters"
            onClick={resetFilters}
          >
            <i className="bi bi-arrow-clockwise" />
            Reset
          </button>
        </div>

        <div className="store-types-table-wrap">
          <div className="store-types-table">
            <div className="store-types-row store-types-row-head">
              <div>
                <input type="checkbox" aria-label="Select all" />
              </div>
              <div>Store Type Code</div>
              <div>Name / Description</div>
              <div>Status</div>
              <div>Created On</div>
              <div>Actions</div>
            </div>

            {loading && <p role="status">Loading store types...</p>}
            {!loading && !error && !filteredStoreTypes.length && <p>No store types found.</p>}
            {filteredStoreTypes.map((item) => (
              <div className="store-types-row" key={item.id}>
                <div>
                  <input type="checkbox" aria-label={`Select ${item.name}`} />
                </div>

                <div className="store-type-code-cell">
                  <span className={`store-type-item-icon ${item.tone}`}>
                    <i className={`bi ${item.icon}`} />
                  </span>
                  <strong>{item.code}</strong>
                </div>

                <div
                   className="store-type-name-cell store-type-name-clickable"
                     onClick={() => navigate(`/store-types/${item.id}`)}
                   >
                        <strong>{item.name}</strong>
                       <span>{item.description}</span>
                    </div>

                <div>
                  <span
                    className={`store-type-status ${
                      item.status === "Inactive" ? "inactive" : ""
                    }`}
                  >
                    <i className="bi bi-circle-fill" />
                    {item.status}
                  </span>
                </div>

                <div>{item.createdOn}</div>

                <div className="store-type-table-actions">
                  <button
                    type="button"
                    disabled={busy} title="Edit store type"
                    onClick={() => editStoreType(item)}
                  >
                    <i className="bi bi-pencil" />
                  </button>

                  <button
                    type="button"
                    className="store-type-delete-icon"
                    disabled={busy || item.status === "Inactive"} title="Deactivate store type"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="store-types-pagination">
          <span>
            Showing {filteredStoreTypes.length ? 1 : 0} to {filteredStoreTypes.length} of{" "}
            {filteredStoreTypes.length} entries
          </span>

          <div>
            <button type="button" disabled>
              <i className="bi bi-chevron-left" />
            </button>
            <button type="button" className="active">
              1
            </button>
            <button type="button">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {deleteTarget && !error && !message && (
        <StoreTypeDialog title="Deactivate Store Type?" variant="confirm" confirmLabel="Deactivate" busy={busy} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)}>
          Are you sure you want to deactivate <strong>{deleteTarget.name}</strong>? The record will remain available with inactive status.
        </StoreTypeDialog>
      )}
      {error && <StoreTypeDialog title="Unable to Complete Request" variant="error" onClose={() => setError("")}>{error}</StoreTypeDialog>}
      {message && !error && <StoreTypeDialog title={message.includes("deactivated") ? "Store Type Deactivated" : "Store Type Saved"} onClose={() => setMessage("")}>{message}</StoreTypeDialog>}

    </section>
  );
}