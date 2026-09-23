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
  const [originalForm, setOriginalForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [attempt, setAttempt] = useState(0);
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listStoreTypes()
      .then((items) => {
        if (active) setStoreTypes(items);
      })
      .catch((e) => {
        if (active) setError(e.message || "Failed to load store types.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const filteredStoreTypes = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const filtered = storeTypes.filter((item) => {
      const matchesSearch = `${item.code || ""} ${item.name || ""} ${item.description || ""}`
        .toLowerCase()
        .includes(searchValue);

      return matchesSearch && (!statusFilter || item.status === statusFilter);
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "newest":
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
  }, [storeTypes, search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredStoreTypes.length / ITEMS_PER_PAGE));

  const paginatedStoreTypes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStoreTypes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStoreTypes, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

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

  async function submitForm(event) {
    event.preventDefault();
    if (busy) return;
    if (!form.code.trim() || !form.name.trim()) {
      setError("Store type code and name are required.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const saved = editingId
        ? await updateStoreType(editingId, form)
        : await createStoreType(form);
      setStoreTypes((items) =>
        editingId ? items.map((item) => (item.id === editingId ? saved : item)) : [saved, ...items]
      );
      setMessage(editingId ? "Store type updated successfully." : "Store type created successfully.");
      resetForm();
    } catch (e) {
      setError(e.message || "Failed to save store type.");
    } finally {
      setBusy(false);
    }
  }

  function editStoreType(item) {
    setEditingId(item.id);
    setErrors({});
    const nextForm = {
      code: item.code || "",
      name: item.name || "",
      description: item.description === "-" ? "" : item.description || "",
      status: item.status || "Active",
    };
    setForm(nextForm);
    setOriginalForm(nextForm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmDelete() {
    if (busy || !deleteTarget) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await deleteStoreType(deleteTarget.id);
      setStoreTypes((items) =>
        items.map((item) => (item.id === deleteTarget.id ? { ...item, status: "Inactive" } : item))
      );
      if (editingId === deleteTarget.id) resetForm();
      setMessage("Store type deactivated successfully.");
      setDeleteTarget(null);
    } catch (e) {
      setError(e.message || "Failed to deactivate store type.");
    } finally {
      setBusy(false);
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

      {error && (
        <p role="alert" className="store-type-error">
          {error}
        </p>
      )}

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
                  maxLength={50}
                />
              </div>
              <small>Unique key (e.g. GROCERY / FASHION / RESTAURANT)</small>
            </label>

            <label className="store-type-field">
              <span>
                Store Type Name <b>*</b>
              </span>
              <div className="store-type-input-wrap">
                <i className="bi bi-shop" />
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Grocery & Supermarket"
                  maxLength={100}
                />
              </div>
              <small>Display name for this store vertical</small>
            </label>

            <label className="store-type-field">
              <span>Status</span>
              <div className="store-filter-select">
                <select name="status" value={form.status} onChange={updateField}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <i className="bi bi-chevron-down" />
              </div>
              <small>Whether merchants can select this store type</small>
            </label>
          </div>

          <div className="store-type-field store-type-description-field" style={{ marginTop: 16 }}>
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Enter a brief description about the store type"
              maxLength={500}
              rows={3}
            />
            <div className="store-type-description-meta">
              <small>{errors.description || ""}</small>
              <span>{form.description.length}/500</span>
            </div>
          </div>

          <div className="store-type-actions">
            {editingId && (
              <button
                type="button"
                className="store-type-cancel-button"
                onClick={resetForm}
                disabled={busy}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="store-type-submit-button"
              disabled={busy || !canSubmitStoreType || (editingId !== null && !hasChanges)}
            >
              {busy ? "Saving..." : editingId ? "Update Store Type" : "Create Store Type"}
            </button>
          </div>
        </fieldset>
      </form>

      <section className="store-types-list-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2>Store Types List</h2>
          <button
            type="button"
            className="store-type-reset-button"
            disabled={loading || busy}
            onClick={() => setAttempt((n) => n + 1)}
          >
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>

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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <i className="bi bi-chevron-down" />
          </div>

          <div className="store-filter-select">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
            title="Reset Filters"
          >
            <i className="bi bi-arrow-counterclockwise" />
          </button>
        </div>

        <div className="store-types-table-wrap">
          <div className="store-types-table">
            <div className="store-types-row store-types-row-head">
              <div>Code</div>
              <div>Name</div>
              <div>Description</div>
              <div>Status</div>
              <div>Created</div>
              <div>Actions</div>
            </div>

            {loading && <div className="store-types-row">Loading store types...</div>}
            {!loading && paginatedStoreTypes.length === 0 && (
              <div className="store-types-row">No store types found.</div>
            )}
            {!loading &&
              paginatedStoreTypes.map((item) => (
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
                  </button>

                  <div className="store-type-description-cell" title={item.description}>
                    {item.description || "—"}
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

                  <div className="store-type-date-cell">
                    <span>{item.createdOn || "—"}</span>
                  </div>

                  <div className="store-type-table-actions">
                    <button
                      type="button"
                      disabled={busy}
                      title="Edit store type"
                      onClick={() => editStoreType(item)}
                    >
                      <i className="bi bi-pencil" />
                    </button>

                    <button
                      type="button"
                      className="store-type-delete-icon"
                      disabled={busy || item.status === "Inactive"}
                      title="Deactivate store type"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="store-types-pagination">
            <span>
              Showing {filteredStoreTypes.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredStoreTypes.length)} of{" "}
              {filteredStoreTypes.length} entries
            </span>

            <div>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  className={currentPage === page ? "active" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </section>

      {deleteTarget && !error && !message && (
        <StoreTypeDialog
          title="Deactivate Store Type?"
          variant="confirm"
          confirmLabel="Deactivate"
          busy={busy}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        >
          Are you sure you want to deactivate <strong>{deleteTarget.name}</strong>? The record will
          remain available with inactive status.
        </StoreTypeDialog>
      )}
      {error && (
        <StoreTypeDialog title="Unable to Complete Request" variant="error" onClose={() => setError("")}>
          {error}
        </StoreTypeDialog>
      )}
      {message && !error && (
        <StoreTypeDialog
          title={message.includes("deactivated") ? "Store Type Deactivated" : "Store Type Saved"}
          onClose={() => setMessage("")}
        >
          {message}
        </StoreTypeDialog>
      )}
    </section>
  );
}
