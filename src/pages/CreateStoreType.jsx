import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialStoreTypes = [
  {
    id: 1,
    code: "GROCERY",
    name: "Grocery",
    description: "Retail grocery stores and supermarkets.",
    category: "POS",
    status: "Active",
    createdOn: "Sep 10, 2025",
    icon: "bi-shop",
    tone: "green",
  },
  {
    id: 2,
    code: "RESTAURANT",
    name: "Restaurant / F&B",
    description: "Dine-in, takeaway and delivery restaurants.",
    category: "Orders",
    status: "Active",
    createdOn: "Sep 08, 2025",
    icon: "bi-fork-knife",
    tone: "orange",
  },
  {
    id: 3,
    code: "SPA",
    name: "Spa & Wellness",
    description: "Spa, salon and wellness services.",
    category: "Customer",
    status: "Active",
    createdOn: "Sep 05, 2025",
    icon: "bi-flower1",
    tone: "purple",
  },
  {
    id: 4,
    code: "DELIVERY",
    name: "Delivery",
    description: "Manage delivery orders and logistics.",
    category: "Orders",
    status: "Active",
    createdOn: "Sep 03, 2025",
    icon: "bi-truck",
    tone: "blue",
  },
  {
    id: 5,
    code: "SAFE_DROP",
    name: "Safe Drop",
    description: "Secure cash drop and pickup management.",
    category: "Cash",
    status: "Inactive",
    createdOn: "Aug 28, 2025",
    icon: "bi-shield",
    tone: "red",
  },
];

const emptyForm = {
  code: "",
  name: "",
  description: "",
  status: "Active",
};

export default function CreateStoreType() {
  const navigate = useNavigate();
  const [storeTypes, setStoreTypes] = useState(initialStoreTypes);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");

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
    setCategoryFilter("");
    setStatusFilter("");
  }

  function submitForm(event) {
    event.preventDefault();

    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.description.trim()
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (editingId) {
      setStoreTypes((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                code: form.code.trim().toUpperCase(),
                name: form.name.trim(),
                description: form.description.trim(),
                status: form.status,
              }
            : item
        )
      );

      setMessage("Store type updated successfully.");
    } else {
      setStoreTypes((current) => [
        {
          id: Date.now(),
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          category: form.category,
          description: form.description.trim(),
          status: form.status,
          createdOn: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          icon: "bi-grid",
          tone: "blue",
        },
        ...current,
      ]);

      setMessage("Store type created successfully.");
    }

    resetForm();
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

  function confirmDelete() {
    setStoreTypes((current) =>
      current.filter((item) => item.id !== deleteTarget.id)
    );

    setMessage(`${deleteTarget.name} store type deleted.`);
    setDeleteTarget(null);
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
      </form>

      <section className="store-types-list-card">
        <h2>Store Types List</h2>

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
          </div>
        </div>

        <div className="store-types-pagination">
          <span>
            Showing 1 to {filteredStoreTypes.length} of{" "}
            {filteredStoreTypes.length} entries
          </span>

          <div>
            <button type="button">
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
              <i className="bi bi-trash3" />
            </div>

            <h2>Delete Store Type?</h2>

            <p>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
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