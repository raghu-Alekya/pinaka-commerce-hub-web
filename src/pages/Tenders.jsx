import { useEffect, useMemo, useState } from "react";
import { storeTypesApi } from "../api/storeTypes";
import { tendorsApi } from "../api/tendors";
 
const emptyForm = {
  code: "",
  name: "",
  status: "Active",
};

const TENDER_CODE_PATTERN = /^[A-Za-z0-9]{3,30}$/;
function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateDate(value) {
  const date = parseDate(value);

  if (!date) {
    return value ? String(value) : "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  const date = parseDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(value) {
  const date = parseDate(value);

  if (!date) {
    return value ? String(value) : "-";
  }

  return `${formatDateDate(date)} ${formatDateTime(date)}`;
}
 
function mapTendorToUI(tendor) {
  return {
    id: tendor.id,
    code:
      tendor.code ||
      tendor.tendorCode ||
       "",
    name:
      tendor.tendorName ||
      tendor.name ||
      "",
    status:
      tendor.status === "ACTIVE"
        ? "Active"
        : tendor.status === "INACTIVE"
        ? "Inactive"
        : tendor.status || "Active",
    createdAt:
      tendor.createdAt ||
      tendor.created_at ||
      null,
    updatedAt:
      tendor.updatedAt ||
      tendor.updated_at ||
      null,
    changedBy:
      tendor.changedBy ||
      tendor.updatedBy ||
      tendor.createdBy ||
      "Admin",
    changedAt:
      tendor.changedAt ||
      tendor.updatedAt ||
      tendor.createdAt ||
      null,
  };
}
 
function getTendorList(response) {
  if (Array.isArray(response)) {
    return response;
  }
 
  if (Array.isArray(response?.data)) {
    return response.data;
  }
 
  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }
 
  if (Array.isArray(response?.data?.tendors)) {
    return response.data.tendors;
  }
 
  if (Array.isArray(response?.tendors)) {
    return response.tendors;
  }
 
  if (Array.isArray(response?.items)) {
    return response.items;
  }
 
  return [];
}
 
function getTendorData(response) {
  if (response?.data?.id) {
    return response.data;
  }
 
  if (response?.tendor?.id) {
    return response.tendor;
  }
 
  if (response?.id) {
    return response;
  }
 
  return null;
}
 
export default function Tenders() {
  const [tenders, setTenders] = useState([]);
 
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] =
    useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
 
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [sortBy, setSortBy] =
    useState("newest");
 
  const [tendersLoading, setTendersLoading] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmTender, setDeleteConfirmTender] = useState(null);
 
  useEffect(() => {
    fetchTendors();
  }, []);
 
  async function fetchTendors() {
    try {
      setTendersLoading(true);
 
      const response = await tendorsApi.getAll();
 
      console.log("Tendors API response:", response);
 
      const list = getTendorList(response);

      const mappedTenders = list.map(mapTendorToUI);

      mappedTenders.sort((a, b) => {
        const aTime = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
        const bTime = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return bTime - aTime;
      });

      setTenders(mappedTenders);
    } catch (error) {
      console.error(
        "Failed to fetch tendors:",
        error
      );
 
      setTenders([]);
    } finally {
      setTendersLoading(false);
    }
  }
 
  const filteredTenders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = tenders.filter((tender) => {
      const matchesSearch =
        !query ||
        Object.values(tender)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        tender.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") {
        return String(a.name || "").localeCompare(
          String(b.name || ""),
          undefined,
          { sensitivity: "base" }
        );
      }

      if (sortBy === "name-desc") {
        return String(b.name || "").localeCompare(
          String(a.name || ""),
          undefined,
          { sensitivity: "base" }
        );
      }

      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return sortBy === "oldest"
        ? aTime - bTime
        : bTime - aTime;
    });
  }, [tenders, search, statusFilter, sortBy]);
 
  function handleChange(event) {
    const { name, value } = event.target;
 
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }
 
  const tenderCodeValid =
    TENDER_CODE_PATTERN.test(form.code.trim());

  const tenderFormComplete =
    Boolean(form.code.trim() && form.name.trim()) &&
    tenderCodeValid;

  const tenderFormChanged =
    editingId !== null &&
    originalForm !== null &&
    (
      form.code.trim() !== originalForm.code.trim() ||
      form.name.trim() !== originalForm.name.trim() ||
      form.status !== originalForm.status
    );

  const tenderCanSave =
    tenderFormComplete &&
    (editingId === null || tenderFormChanged);

  const tenderCodeError = !form.code.trim()
    ? ""
    : tenderCodeValid
    ? ""
    : "Use 3–30 letters and numbers only. No spaces or special characters.";

  function resetForm() {
    setForm(emptyForm);
    setOriginalForm(null);
    setEditingId(null);
  }
 
  async function saveTender(event) {
    event.preventDefault();
 
    if (!tenderFormComplete) {
      return;
    }
 
    try {
      setSaving(true);
 
      const payload = {
        tendorCode: form.code.trim(),
        tendorName: form.name.trim(),
        status:
          form.status === "Active"
            ? "ACTIVE"
            : "INACTIVE",
      };
 
      if (editingId) {
        await tendorsApi.update(
          editingId,
          payload
        );
      } else {
        await tendorsApi.create(payload);
      }
 
      await fetchTendors();
      resetForm();
    } catch (error) {
      console.error(
        editingId
          ? "Failed to update tendor:"
          : "Failed to create tendor:",
        error
      );
 
      alert(
        error?.response?.data?.message ||
          error?.message ||
          (editingId
            ? "Failed to update tender."
            : "Failed to create tender.")
      );
    } finally {
      setSaving(false);
    }
  }
 
  function editTender(tender) {
    const editValues = {
      code: tender.code || "",
      name: tender.name || "",
      status: tender.status || "Active",
    };

    setEditingId(tender.id);
    setOriginalForm(editValues);
    setForm(editValues);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function requestDeleteTender(tender) {
    if (deleting) {
      return;
    }

    setDeleteConfirmTender(tender);
  }

  function cancelDeleteTender() {
    if (deleting) {
      return;
    }

    setDeleteConfirmTender(null);
  }

  async function confirmDeleteTender() {
    if (!deleteConfirmTender) {
      return;
    }

    const tender = deleteConfirmTender;

    try {
      setDeleting(true);
      setDeletingId(tender.id);

      await tendorsApi.delete(tender.id);

      setTenders((current) =>
        current.filter(
          (item) => item.id !== tender.id
        )
      );

      if (editingId === tender.id) {
        resetForm();
      }

      setDeleteConfirmTender(null);
    } catch (error) {
      console.error(
        "Failed to delete tendor:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete tender."
      );
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  }

  return (
    <section className="tenders-page">
      <div className="tenders-header">
        <div>
          <h1>Create Tender</h1>

          <p>
            Create and manage tenders and their availability.
          </p>
        </div>
      </div>
 
      <form
        className="tenders-form"
        onSubmit={saveTender}
          autoComplete="off"
      >
        <div className="tenders-form-heading">
          <div className="tenders-heading-content">
            <div className="tenders-heading-icon">
              <i className="bi bi-cash-coin" />
            </div>
 
            <div>
              <h2>
                {editingId
                  ? "Edit Tender Details"
                  : "Add Tender Details"}
              </h2>
 
              <p>Provide the basic details and configuration for this tender.</p>
            </div>
          </div>
 
        </div>
 
        <div className="tenders-form-grid tender-create-fields-grid">
          <label>
            <span>
              Tender Code <b>*</b>
            </span>
 
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. TNDCREDIT"
              maxLength={30}
              required
              autoComplete="off"
              aria-invalid={Boolean(tenderCodeError)}
            />
            {tenderCodeError ? (
              <small className="tenders-field-error">
                {tenderCodeError}
              </small>
            ) : (
              <small className="tenders-field-help">
              </small>
            )}
          </label>
 
          <label>
            <span>
              Tender Name <b>*</b>
            </span>
 
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Store Credit"
              required
                autoComplete="off"
            />
          </label>
 
          <label>
            <span>Status <b>*</b></span>
 
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={`tender-status-select ${
                form.status === "Inactive"
                  ? "status-inactive"
                  : "status-active"
              }`}
            >
              <option value="Active">
                Active
              </option>
 
              <option value="Inactive">
                Inactive
              </option>
            </select>
          </label>
        </div>
 
        <div className="tenders-form-actions">
          <button
            type="button"
            className="tenders-clear-button"
            onClick={resetForm}
            disabled={saving}
          >
           
            {editingId ? "Cancel" : "Cancel"}
          </button>
 
          <button
            type="submit"
            className="tenders-save-button"
            disabled={
              saving ||
              !tenderCanSave
            }
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Tender"
              : "Create Tender"}
          </button>
        </div>
      </form>
 
      <div className="tenders-list-card">
        <div className="tenders-list-toolbar">
          <div>
            <h2>Tenders List</h2>
 
            <p>
              {filteredTenders.length} payment method
              {filteredTenders.length === 1
                ? ""
                : "s"} found
            </p>
          </div>
 
          <div className="tenders-filters">
            <div className="tenders-search">
              <i className="bi bi-search" />
 
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search tenders..."
              />
            </div>
 
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="All Statuses">
                All Statuses
              </option>
 
              <option value="Active">
                Active
              </option>
 
              <option value="Inactive">
                Inactive
              </option>
            </select>
            <select
              className="tenders-sort-select"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              aria-label="Sort tenders"
            >
              <option value="newest">
                Newest to Oldest
              </option>

              <option value="oldest">
                Oldest to Newest
              </option>

              <option value="name-asc">
                Alphabetical A–Z
              </option>

              <option value="name-desc">
                Alphabetical Z–A
              </option>
            </select>


           <button type="button"
                   className="tenders-reset-button"
                   onClick={() => {
                 setSearch("");
                 setStatusFilter("All Statuses");
                 setSortBy("newest");
                      }}
                    title="Reset filters"
                  aria-label="Reset filters"
                    >
                   <i className="bi bi-arrow-counterclockwise" />
              </button>
          </div>
        </div>
 
        <div className="tenders-table-wrap">
          <table className="tenders-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Tender</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
 
            <tbody>
              {tendersLoading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                    }}
                  >
                    Loading tenders...
                  </td>
                </tr>
              ) : (
                filteredTenders.map((tender) => (
                  <tr key={tender.id}>
                    <td>
                      {tender.code}
                    </td>
 
                    <td>
                      <strong>
                        {tender.name}
                      </strong>
                    </td>
 
                    <td>
                      <span
                         className={`tenders-status ${String(
                         tender.status
                         ).toLowerCase()}`}
                           >
                         <i className="bi bi-circle-fill" />
                         {tender.status}
                          </span>
                            </td>
 
                    <td className="tender-date-cell">
                      <span className="tender-date">
                        {formatDateDate(tender.createdAt)}
                      </span>
                      <span className="tender-time">
                        {formatDateTime(tender.createdAt)}
                      </span>
                    </td>

                    <td className="tender-date-cell">
                      <span className="tender-date">
                        {formatDateDate(tender.updatedAt)}
                      </span>
                      <span className="tender-time">
                        {formatDateTime(tender.updatedAt)}
                      </span>
                    </td>
 
                    <td className="tenders-actions"><button
                        type="button"
                        onClick={() =>
                          editTender(tender)
                        }
                        aria-label={`Edit ${tender.name}`}
                        title="Edit"
                        disabled={deleting}
                      >
                        <i className="bi bi-pencil" />
                      </button>
 
                      <button
                        type="button"
                        className="tenders-delete-action"
                        onClick={() =>
                          requestDeleteTender(tender)
                        }
                        aria-label={`Delete ${tender.name}`}
                        title="Delete"
                        disabled={
                          deleting &&
                          deletingId ===
                            tender.id
                        }
                      >
                        <i
                          className={
                            deleting &&
                            deletingId ===
                              tender.id
                              ? "bi bi-hourglass-split"
                              : "bi bi-trash"
                          }
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
 
          {!tendersLoading &&
            filteredTenders.length === 0 && (
              <div className="tenders-empty">
                No tenders found.
              </div>
            )}
        </div>
      </div>      {deleteConfirmTender && (
        <div
          className="tenders-confirm-backdrop"
          onClick={cancelDeleteTender}
        >
          <div
            className="tenders-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-tender-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tenders-confirm-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>

            <div className="tenders-confirm-content">
              <h2 id="delete-tender-title">Delete Tender?</h2>

              <p>
                Are you sure you want to delete{" "}
                <strong>{deleteConfirmTender.name}</strong>?
              </p>

              <span className="tenders-confirm-warning">
                This action cannot be undone.
              </span>
            </div>

            <div className="tenders-confirm-actions">
              <button
                type="button"
                className="tenders-confirm-cancel"
                onClick={cancelDeleteTender}
                disabled={deleting}
              >
                No, Keep It
              </button>

              <button
                type="button"
                className="tenders-confirm-delete"
                onClick={confirmDeleteTender}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
 