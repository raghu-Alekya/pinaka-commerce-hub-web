import StoreTypeDialog from "../components/StoreTypeDialog";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listStoreTypes, createStoreType, updateStoreType, deleteStoreType } from "../api/storeTypes";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  category: "",
  status: "Active",
};

export default function CreateStoreType() {
  const navigate = useNavigate();
  const [storeTypes, setStoreTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  async function loadStoreTypes() {
  const response = await storeTypesApi.getAll();

  if (!Array.isArray(response?.storeTypes)) {
    throw new Error("GET /store-types did not return a storeTypes array.");
  }

  const sorted = response.storeTypes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  setStoreTypes(sorted.map(toRow));
  setCurrentPage(1);
}

  useEffect(() => {
    let cancelled = false;
    storeTypesApi.getAll()
      .then((response) => {
  if (!Array.isArray(response?.storeTypes)) {
    throw new Error("GET /store-types did not return a storeTypes array.");
  }

  if (!cancelled) {
    const sorted = response.storeTypes.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    setStoreTypes(sorted.map(toRow));
  }
})
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
  const searchValue = search.trim().toLowerCase();

  const filtered = storeTypes.filter((item) => {
    const matchesSearch = `${item.code} ${item.name} ${item.description}`
      .toLowerCase()
      .includes(searchValue);

    return matchesSearch && (!statusFilter || item.status === statusFilter);
  });

  return filtered.sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);

      case "name-asc":
        return a.name.localeCompare(b.name);

      case "name-desc":
        return b.name.localeCompare(a.name);

      case "newest":
          default:
             return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
}, [storeTypes, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredStoreTypes.length / ITEMS_PER_PAGE);

  const paginatedStoreTypes = filteredStoreTypes.slice(
   (currentPage - 1) * ITEMS_PER_PAGE,
   currentPage * ITEMS_PER_PAGE
);
useEffect(() => {
  setCurrentPage(1);
}, [search, statusFilter]);

useEffect(() => {
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }
}, [totalPages, currentPage]);

  const hasChanges =
  form.code.trim() !== (originalForm.code || "").trim() ||
  form.name.trim() !== (originalForm.name || "").trim() ||
  form.description.trim() !== (originalForm.description || "").trim() ||
  form.status !== originalForm.status;

  const canSubmitStoreType = !!form.code.trim() && !!form.name.trim();

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
    setOriginalForm(emptyForm);
    setEditingId(null);
    setErrors({});
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
    setErrors({});

    const nextForm = {
      code: item.code,
      name: item.name,
      description: item.description === "-" ? "" : item.description,
      status: item.status,
    };

    setForm(nextForm);
    setOriginalForm(nextForm);

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
}

  return (
    <section className="store-types-page">
      <div className="store-types-page-heading">
        <div>
          <h1>Store Type Information</h1>
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
            <h2>{editingId ? "Edit Store Type" : "Create Store Type"}</h2>
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

        <div className="store-type-form-grid">
  <div className="store-type-field store-type-description-field">
    <label>Description</label>

    <textarea
      name="description"
      value={form.description}
      onChange={updateField}
      onInput={(e) => {
        e.currentTarget.style.height = "44px";
        e.currentTarget.style.height = `${Math.max(
          44,
          e.currentTarget.scrollHeight
        )}px`;
      }}
      placeholder="Enter a brief description about the store type"
      maxLength={500}
    />

    <div className="store-type-description-meta">
      {errors.description ? (
        <small className="field-error">{errors.description}</small>
      ) : (
        <small></small>
      )}
      <span>{form.description.length}/500</span>
    </div>
  </div>
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

          <button
             type="submit"
             className="store-type-submit-button"
             disabled={
               saving ||
               !canSubmitStoreType ||
                (editingId !== null && !hasChanges)
                 } >
              {saving
              ? "Saving..."
              : editingId
               ? "Update Store Type"
             : "Create Store Type"}
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

            <div className="store-filter-select">
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="">All Statuses</option>
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
  </select>
  <i className="bi bi-chevron-down" />
</div>

          <div className="store-filter-select">
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
    <option value="name-asc">Name (A–Z)</option>
    <option value="name-desc">Name (Z–A)</option>
  </select>
  <i className="bi bi-chevron-down" />
</div>

            <button
              type="button"
              className="store-type-reset-button"
              onClick={resetFilters}
            >
              <i className="bi bi-arrow-counterclockwise" />
            </button>
          </div>
        </div>

        <div className="store-types-table-wrap">
          <div className="store-types-table">
            <div className="store-types-row store-types-row-head">
              <div>Store Type Code</div>
              <div>Name</div>
              <div>Description</div>
              <div>Status</div>
              <div>Created At</div>
              <div>Updated At</div>
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
                  <strong>{item.code}</strong>
                </div>

                <button
  type="button"
  className="store-type-name-cell store-type-name-clickable"
  onClick={(e) => {
    e.stopPropagation();
    navigate(`/store-types/${item.id}`, {
      state: { storeType: item },
    });
  }}
>
  <strong>{item.name}</strong>
</button>

                <div className="store-type-description-cell"
                 title={item.description} >
                  {item.description}
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

                <div className="store-type-date-cell"
                      title={`${item.createdDate}, ${item.createdTime}`} >
                      <strong>{item.createdDate}</strong>
                      <span>{item.createdTime}</span>
                </div>


               <div className="store-type-date-cell"
                    title={`${item.updatedDate}, ${item.updatedTime}`} >
                    <strong>{item.updatedDate}</strong>
                    <span>{item.updatedTime}</span>
                 </div>

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
