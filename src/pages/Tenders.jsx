import { useEffect, useMemo, useState } from "react";
import { storeTypesApi } from "../api/storeTypes";
import { tendorsApi } from "../api/tendors";

const emptyForm = {
  code: "",
  name: "",
  status: "Active",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapTendorToUI(tendor) {
  return {
    id: tendor.id,
    code:
      tendor.code ||
      tendor.tendorCode ||
      `TND-${tendor.id}`,
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
  const [editingId, setEditingId] = useState(null);
  const [viewingTender, setViewingTender] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [tendersLoading, setTendersLoading] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTendors();
  }, []);

  async function fetchTendors() {
    try {
      setTendersLoading(true);

      const response = await tendorsApi.getAll();

      console.log("Tendors API response:", response);

      const list = getTendorList(response);

      setTenders(list.map(mapTendorToUI));
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

    return tenders.filter((tender) => {
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
  }, [tenders, search, statusFilter]);

  function handleChange(event) {
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

  async function saveTender(event) {
    event.preventDefault();

    if (
      !form.code.trim() ||
      !form.name.trim()
    ) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
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
    setEditingId(tender.id);

    setForm({
      code: tender.code || "",
      name: tender.name || "",
      status: tender.status || "Active",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function viewTender(tender) {
    try {
      const response =
        await tendorsApi.getById(tender.id);

      const data = getTendorData(response);

      if (data) {
        setViewingTender(
          mapTendorToUI(data)
        );
      } else {
        setViewingTender(tender);
      }
    } catch (error) {
      console.error(
        "Failed to fetch tendor:",
        error
      );

      setViewingTender(tender);
    }
  }

  async function deleteTender(tender) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${tender.name}"?`
    );

    if (!confirmed) {
      return;
    }

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

      if (
        viewingTender?.id === tender.id
      ) {
        setViewingTender(null);
      }
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
          <h1>
            {editingId
              ? "Edit Tender"
              : "Tenders"}
          </h1>

          <p>
            Manage payment methods and their
            availability.
          </p>
        </div>
      </div>

      <form
        className="tenders-form"
        onSubmit={saveTender}
      >
        <div className="tenders-form-heading">
          <div className="tenders-heading-content">
            <div className="tenders-heading-icon">
              <i className="bi bi-cash-coin" />
            </div>

            <div>
              <h2>
                {editingId
                  ? "Edit Tender"
                  : "Add Tender"}
              </h2>

              <p>
                Provide the tender details.
              </p>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              className="tenders-link-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="tenders-form-grid">
          <label>
            <span>
              Tender Code <b>*</b>
            </span>

            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. TND-CREDIT"
              required
            />
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
            />
          </label>

          <label>
            <span>Status</span>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
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
            Clear
          </button>

          <button
            type="submit"
            className="tenders-save-button"
            disabled={
              saving ||
              !form.code.trim() ||
              !form.name.trim()
            }
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Save Changes"
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
                        {tender.status}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        tender.createdAt
                      )}
                    </td>

                    <td>
                      {formatDate(
                        tender.updatedAt
                      )}
                    </td>

                    <td className="tenders-actions">
                      <button
                        type="button"
                        onClick={() =>
                          viewTender(tender)
                        }
                        aria-label={`View ${tender.name}`}
                        title="View"
                        disabled={deleting}
                      >
                        <i className="bi bi-eye" />
                      </button>

                      <button
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
                          deleteTender(tender)
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
      </div>

      {viewingTender && (
        <div
          className="tenders-modal-backdrop"
          onClick={() =>
            setViewingTender(null)
          }
        >
          <div
            className="tenders-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="tenders-modal-heading">
              <div>
                <h2>
                  {viewingTender.name}
                </h2>

                <p>
                  {viewingTender.code}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingTender(null)
                }
                aria-label="Close tender details"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <dl>
              {[
                [
                  "Code",
                  viewingTender.code,
                ],
                [
                  "Tender Name",
                  viewingTender.name,
                ],
                [
                  "Status",
                  viewingTender.status,
                ],
                [
                  "Created At",
                  formatDate(
                    viewingTender.createdAt
                  ),
                ],
                [
                  "Updated At",
                  formatDate(
                    viewingTender.updatedAt
                  ),
                ],
              ].map(
                ([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>

                    <dd>
                      {value || "-"}
                    </dd>
                  </div>
                )
              )}
            </dl>

            <p className="tenders-audit">
              Last changed by{" "}
              {viewingTender.changedBy} on{" "}
              {formatDate(
                viewingTender.changedAt
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}