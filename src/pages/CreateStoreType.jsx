import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeTypesApi } from "../api/storeTypes";

function toRow(item) {
  return {
    id: item.id,
    code: item.storeTypeCode ?? "",
    name: item.name ?? "",
    description: item.description ?? "",
    status: item.status === "INACTIVE" ? "Inactive" : "Active",
    createdOn: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : "—",
    icon: "bi-shop",
    tone: "green",
  };
}

const emptyForm = {
  code: "",
  name: "",
  description: "",
  category: "",
  status: "Active",
};

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function CreateStoreType() {
  const navigate = useNavigate();
  const [storeTypes, setStoreTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formSnapshot, setFormSnapshot] = useState(emptyForm);

  async function loadStoreTypes() {
    const response = await storeTypesApi.getAll();
    if (!Array.isArray(response?.storeTypes)) {
      throw new Error("GET /store-types did not return a storeTypes array.");
    }
    setStoreTypes(response.storeTypes.map(toRow));
  }

  useEffect(() => {
    let cancelled = false;
    storeTypesApi.getAll()
      .then((response) => {
        if (!Array.isArray(response?.storeTypes)) {
          throw new Error("GET /store-types did not return a storeTypes array.");
        }
        if (!cancelled) setStoreTypes(response.storeTypes.map(toRow));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredStoreTypes = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return storeTypes.filter((item) => {
      const matchesSearch = `${item.code} ${item.name} ${item.description}`
        .toLowerCase()
        .includes(searchValue);

      return matchesSearch && (!statusFilter || item.status === statusFilter);
    });
  }, [storeTypes, search, statusFilter]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  function resetForm() {
  setForm(emptyForm);
  setEditingId(null);
  setErrors({});
}

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
  }

  function validateForm() {
    const nextErrors = {};
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const description = form.description.trim();

    if (!code) {
      nextErrors.code = "Store type code is required.";
    } else if (!/^[A-Z][A-Z0-9_]{2,29}$/.test(code)) {
      nextErrors.code =
        "Use 3–30 uppercase letters, numbers, or underscores only.";
    } else if (
      storeTypes.some(
        (item) => item.code.toLowerCase() === code.toLowerCase() &&
          item.id !== editingId
      )
    ) {
      nextErrors.code = "This store type code already exists.";
    }

    if (!name) {
      nextErrors.name = "Display name is required.";
    } else if (
      storeTypes.some(
        (item) => item.name.toLowerCase() === name.toLowerCase() &&
          item.id !== editingId
      )
    ) {
      nextErrors.name = "This display name already exists.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

    async function submitForm(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const values = {
      storeTypeCode: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status === "Inactive" ? "INACTIVE" : "ACTIVE",
    };

    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (editingId !== null) {
        await storeTypesApi.update(editingId, values);
      } else {
        await storeTypesApi.create(values);
      }
      setMessage(editingId !== null
        ? "Store type updated successfully."
        : "Store type created successfully.");
      resetForm();
      try {
        await loadStoreTypes();
      } catch (refreshError) {
        setError(`Saved, but the list could not refresh: ${refreshError.message}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function editStoreType(item) {
    setEditingId(item.id);
    setErrors({});

   const nextForm = {
  code: item.code,
  name: item.name,
  description: item.description,
  status: item.status,
};

setForm(nextForm);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await storeTypesApi.remove(deleteTarget.id);
      await loadStoreTypes();
      if (editingId === deleteTarget.id) resetForm();
      setMessage(`${deleteTarget.name} store type deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="store-types-page">
      <div className="store-types-page-heading">
        <div>
          <h1>{editingId ? "Edit Store Type" : "Create Store Type"}</h1>
          <p>Define a business vertical and its baseline configuration.</p>
        </div>
      </div>

      {error && <p role="alert" className="store-type-error">{error}</p>}

      <form className="store-type-form-card" onSubmit={submitForm} autoComplete="off">
        <div className="store-type-card-heading">
          <div className="store-type-heading-icon">
            <i className="bi bi-shop" />
          </div>

          <div>
            <h2>Store Type Information</h2>
            <p>Provide the basic details about the store type.</p>
          </div>
        </div>

        <div className="store-type-form-grid">
          <label className="store-type-field">
            <span>
              Store Type Code <b>*</b>
            </span>

            <div className={`store-type-input-wrap ${errors.code ? "has-error" : ""}`}>
              <i className="bi bi-tag" />
              <input
                name="code"
                value={form.code}
                onChange={updateField}
                placeholder="e.g. GROCERY"
                maxLength="30"
                autoComplete="off"
              />
            </div>

            <small>
              Use 3–30 uppercase letters, numbers, or underscores. Example:
              GROCERY, RESTAURANT_FNB.
            </small>

            {errors.code && <em className="field-error">{errors.code}</em>}
          </label>

          <label className="store-type-field">
            <span>
              Display Name <b>*</b>
            </span>

            <div className={`store-type-input-wrap ${errors.name ? "has-error" : ""}`}>
              <i className="bi bi-type" />
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="e.g. Grocery"
                maxLength="80"
                autoComplete="off"
              />
            </div>

            <small>Name displayed throughout the system.</small>

            {errors.name && <em className="field-error">{errors.name}</em>}
          </label>
        </div>

        <div className="store-type-bottom-grid">
          <label className="store-type-field store-type-description-field">
            <span>
              Description
            </span>

            <div
              className={`store-type-textarea-wrap ${
                errors.description ? "has-error" : ""
              }`}
            >
              <i className="bi bi-file-earmark-text" />

              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                maxLength="500"
                placeholder="Describe the vertical, its operating model, and configuration needs..."
                autoComplete="off"
              />
            </div>

            <small className="store-type-character-count">
              {form.description.length}/500
            </small>

            {errors.description && (
              <em className="field-error">{errors.description}</em>
            )}
           </label>

           <label className="store-type-field store-type-status-field">
            <span>
              Status <b>*</b>
            </span>

            <select name="status" value={form.status} onChange={updateField}>
              <option value="Active">● Active</option>
              <option value="Inactive">● Inactive</option>
            </select>

            <small>Inactive types cannot be selected for new stores.</small>
           </label>
        </div>

        <div className="store-type-actions">
          <button
            type="button"
            className="store-type-cancel-button"
            onClick={resetForm}
            disabled={saving}
          >
            Cancel
          </button>

          <button type="submit" className="store-type-submit-button" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update store type" : "Create store type"}
          </button>
        </div>
      </form>

      <section className="store-types-list-card">
        <div className="store-types-list-header">
          <h2>Store Types List</h2>

          <div className="store-types-filters">
            <label className="store-type-search">
              <i className="bi bi-search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search store types..."
                autoComplete="off"
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
              onClick={resetFilters}
            >
              <i className="bi bi-arrow-counterclockwise" />
              Reset
            </button>
          </div>
        </div>

        <div className="store-types-table-wrap">
          <div className="store-types-table">
            <div className="store-types-row store-types-row-head">
              <div>Store Type Code</div>
              <div>Name / Description</div>
              <div>Status</div>
              <div>Created On</div>
              <div>Updated On</div>
              <div>Actions</div>
            </div>

            {filteredStoreTypes.map((item) => (
              <div className="store-types-row" key={item.id}>
                <div className="store-type-code-cell">
                  <strong>{item.code}</strong>
                </div>

               <button
                  type="button"
                  className="store-type-name-cell store-type-name-clickable"
                  onClick={() =>
                    navigate(`/store-types/${item.id}`, {
                      state: { storeType: item },
                    })
                  }
                >
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </button>

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
                <div>{item.updatedOn}</div>

                <div className="store-type-table-actions">
                  <button
                    type="button"
                    title="Edit store type"
                    onClick={() => editStoreType(item)}
                  >
                    <i className="bi bi-pencil" />
                  </button>

                  <button
                    type="button"
                    className="store-type-delete-icon"
                    title="Delete store type"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
              </div>
            ))}
            {loading && <div className="store-types-row">Loading store types...</div>}
            {!loading && filteredStoreTypes.length === 0 && (
              <div className="store-types-row">No store types found.</div>
            )}
          </div>
        </div>

        <div className="store-types-pagination">
          <span>
            Showing {filteredStoreTypes.length ? 1 : 0} to {filteredStoreTypes.length} of{" "}
            {filteredStoreTypes.length} entries
          </span>

          <div>
            <button type="button" aria-label="Previous page">
              <i className="bi bi-chevron-left" />
            </button>
            <button type="button" className="active">1</button>
            <button type="button" aria-label="Next page">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {deleteTarget && (
        <div
          className="delete-storetype-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-storetype-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-storetype-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>

            <h2>Delete Store Type?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>?
            </p>

            {deleteTarget.assignedStores > 0 && (
              <div className="delete-impact-warning">
                <i className="bi bi-exclamation-circle-fill" />
                This store type is assigned to{" "}
                <strong>{deleteTarget.assignedStores}</strong>{" "}
                {deleteTarget.assignedStores === 1 ? "store" : "stores"}.
                Deleting it may affect their configuration.
              </div>
            )}

            <p className="delete-final-warning">
              This action cannot be undone.
            </p>

            <div className="delete-storetype-actions">
              <button
                type="button"
                className="delete-keep-button"
                onClick={() => setDeleteTarget(null)}
              >
                No, Keep It
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDelete}
                disabled={saving}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="store-type-toast">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </section>
  );
}
