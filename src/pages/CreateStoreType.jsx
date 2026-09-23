import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeTypesApi } from "../api/storeTypes";

function toRow(item) {
  const created = item.createdAt ? new Date(item.createdAt) : null;
  const updated = item.updatedAt ? new Date(item.updatedAt) : null;

  return {
  id: item.id,
  code: item.storeTypeCode ?? "",
  name: item.name ?? "",
  description: item.description?.trim() || "-",
  status: item.status === "INACTIVE" ? "Inactive" : "Active",

  // Add these two lines
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,

  createdDate: created
    ? created.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—",

  createdTime: created
    ? created.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "",

  updatedDate: updated
    ? updated.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—",

  updatedTime: updated
    ? updated.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "",
};
}

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
  setSortBy("newest");
}

  function validateForm() {
    const nextErrors = {};
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();

    if (!code) {
      nextErrors.code = "Store type code is required.";
    } else if (!/^[A-Z][A-Z0-9_]{2,29}$/.test(code)) {
      nextErrors.code =
        "Use 3–30 uppercase letters, numbers, or underscores only.";
    } else if (
      storeTypes.some(
        (item) =>
          item.code.toLowerCase() === code.toLowerCase() && item.id !== editingId
      )
    ) {
      nextErrors.code = "This store type code already exists.";
    }

    if (!name) {
      nextErrors.name = "Display name is required.";
    } else if (
      storeTypes.some(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase() && item.id !== editingId
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
      setMessage(
        editingId !== null
          ? "Store type updated successfully."
          : "Store type created successfully."
      );
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
      description: item.description === "-" ? "" : item.description,
      status: item.status,
    };

    setForm(nextForm);
    setOriginalForm(nextForm);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmDelete() {
  if (!deleteTarget) return;

  setSaving(true);
  setError("");

  try {
    await storeTypesApi.remove(deleteTarget.id); // Hard delete

    await loadStoreTypes();

    if (editingId === deleteTarget.id) {
      resetForm();
    }

    setMessage("Store type deleted successfully.");
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

      <div className="store-type-form-grid">
        <div className="store-type-field">
    <label> Store Type Code <span className="required">*</span> </label>
    <input
      name="code"
      value={form.code}
      onChange={updateField}
      placeholder="Enter a unique code, e.g. GROCERY"
      maxLength={30}
      className={errors.code ? "store-type-input-error" : ""}
    />
    {errors.code ? (
      <small className="field-error">{errors.code}</small>
    ) : (
      <small></small>
    )}
  </div>

        <div className="store-type-field">
   <label> Display Name <span className="required">*</span> </label>
    <input
      name="name"
      value={form.name}
      onChange={updateField}
      placeholder="Enter display name, e.g. Grocery"
      maxLength={80}
      className={errors.name ? "store-type-input-error" : ""}
    />
    {errors.name ? (
      <small className="field-error">{errors.name}</small>
    ) : (
      <small></small>
    )}
  </div>

        <div className="store-type-field">
    <label> Status <span className="required">*</span> </label>
    <div className="select-shell">
  <select
    name="status"
    value={form.status}
    onChange={updateField}
    className={form.status === "Active" ? "active" : "inactive"}
  >
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
  </select>
  <i className="bi bi-chevron-down" />
</div>
    <small></small>
  </div>
</div>

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

            {paginatedStoreTypes.map((item) => (
              <div className="store-types-row store-types-row-clickable" key={item.id} onClick={() =>
                 navigate(`/store-types/${item.id}`, { state: { storeType: item },}) } >
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
                     onClick={(e) => {
                     e.stopPropagation();
                     editStoreType(item); }} >
                     <i className="bi bi-pencil" />
                  </button>

                  <button
                      type="button"
                      className="store-type-delete-icon"
                      onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(item); }} >
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
    Showing {filteredStoreTypes.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
    {" "}to{" "}
    {Math.min(currentPage * ITEMS_PER_PAGE, filteredStoreTypes.length)}
    {" "}of {filteredStoreTypes.length} entries
  </span>

  <div>
    <button
      type="button"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
    >
      <i className="bi bi-chevron-left" />
    </button>

    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        type="button"
        className={currentPage === i + 1 ? "active" : ""}
        onClick={() => setCurrentPage(i + 1)}
      >
        {i + 1}
      </button>
    ))}

    <button
      type="button"
      disabled={currentPage === totalPages || totalPages === 0}
      onClick={() => setCurrentPage((p) => p + 1)}
    >
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
             Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
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
