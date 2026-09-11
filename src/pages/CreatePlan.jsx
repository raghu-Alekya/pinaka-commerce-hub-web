import { useMemo, useState } from "react";

const initialPlans = [
  {
    id: 1,
    code: "BASIC",
    name: "Basic Plan",
    description: "For small businesses getting started.",
    billingModel: "Per store",
    price: 49,
    cycle: "Monthly",
    status: "Active",
    createdOn: "Sep 10, 2025",
    icon: "bi-credit-card",
    tone: "blue",
  },
  {
    id: 2,
    code: "PRO",
    name: "Pro Plan",
    description: "For growing businesses with higher demand.",
    billingModel: "Per store",
    price: 99,
    cycle: "Monthly",
    status: "Active",
    createdOn: "Sep 08, 2025",
    icon: "bi-trophy",
    tone: "purple",
  },
  {
    id: 3,
    code: "ENTERPRISE",
    name: "Enterprise Plan",
    description: "For large businesses with custom requirements.",
    billingModel: "Flat rate",
    price: 199,
    cycle: "Monthly",
    status: "Active",
    createdOn: "Sep 05, 2025",
    icon: "bi-buildings",
    tone: "green",
  },
  {
    id: 4,
    code: "SEASONAL",
    name: "Seasonal Plan",
    description: "A limited plan for seasonal merchants.",
    billingModel: "Per store",
    price: 69,
    cycle: "Quarterly",
    status: "Inactive",
    createdOn: "Aug 28, 2025",
    icon: "bi-calendar2-week",
    tone: "orange",
  },
];

const emptyForm = {
  code: "",
  name: "",
  description: "",
  billingModel: "Per store",
  basePrice: "",
  billingCycle: "Monthly",
  status: "Active",
};

export default function CreatePlan() {
  const [plans, setPlans] = useState(initialPlans);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [billingFilter, setBillingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");

  const filteredPlans = useMemo(() => {
    const value = search.toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch = `${plan.code} ${plan.name} ${plan.description}`
        .toLowerCase()
        .includes(value);

      const matchesBilling =
        !billingFilter || plan.billingModel === billingFilter;

      const matchesStatus = !statusFilter || plan.status === statusFilter;

      return matchesSearch && matchesBilling && matchesStatus;
    });
  }, [plans, search, billingFilter, statusFilter]);

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
    setBillingFilter("");
    setStatusFilter("");
  }

  function submitForm(event) {
    event.preventDefault();

    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.description.trim() ||
      form.basePrice === ""
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    const planData = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      billingModel: form.billingModel,
      price: Number(form.basePrice),
      cycle: form.billingCycle,
      status: form.status,
    };

    if (editingId) {
      setPlans((current) =>
        current.map((plan) =>
          plan.id === editingId ? { ...plan, ...planData } : plan
        )
      );
      setMessage("Plan updated successfully.");
    } else {
      setPlans((current) => [
        {
          id: Date.now(),
          ...planData,
          createdOn: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          icon: "bi-credit-card",
          tone: "blue",
        },
        ...current,
      ]);
      setMessage("Plan created successfully.");
    }

    resetForm();
  }

  function editPlan(plan) {
    setEditingId(plan.id);

    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      billingModel: plan.billingModel,
      basePrice: String(plan.price),
      billingCycle: plan.cycle,
      status: plan.status,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function confirmDelete() {
    setPlans((current) =>
      current.filter((plan) => plan.id !== deleteTarget.id)
    );

    setMessage(`${deleteTarget.name} deleted successfully.`);
    setDeleteTarget(null);
  }

  return (
    <section className="plans-page">
      <div className="plans-page-heading">    
       <div>
          <h1>{editingId ? "Edit Plan" : "Create Plan"}</h1>
          <p>Create a commercial package and configure its pricing.</p>
        </div>
      </div>

      <form className="plan-form-card" onSubmit={submitForm}>
        <div className="plan-card-heading">
          <div className="plan-heading-icon">
            <i className="bi bi-file-earmark-text" />
          </div>

          <div>
            <h2>Plan Information</h2>
            <p>Provide the basic details for the subscription plan.</p>
          </div>
        </div>

        <div className="plan-form-grid">
          <label className="plan-field">
            <span>Plan Code <b>*</b></span>

            <div className="plan-input-wrap">
              <i className="bi bi-tag" />
              <input
                name="code"
                value={form.code}
                onChange={updateField}
                placeholder="e.g. PRO"
              />
            </div>

            <small>Unique key for this commercial plan.</small>
          </label>

          <label className="plan-field">
            <span>Plan Name <b>*</b></span>

            <div className="plan-input-wrap">
              <i className="bi bi-type" />
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="e.g. Pinaka Pro"
              />
            </div>

            <small>Name shown to merchants.</small>
          </label>

          <label className="plan-field">
            <span>Billing Model <b>*</b></span>

            <select
              name="billingModel"
              value={form.billingModel}
              onChange={updateField}
            >
              <option>Per store</option>
              <option>Per device</option>
              <option>Flat rate</option>
            </select>

            <small>How the plan is priced.</small>
          </label>
        </div>

        <label className="plan-field plan-description-field">
          <span>Description <b>*</b></span>

          <div className="plan-textarea-wrap">
            <i className="bi bi-file-earmark-text" />
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              maxLength="500"
              placeholder="Describe this commercial package and its target customer..."
            />
          </div>

          <small className="plan-character-count">
            {form.description.length}/500
          </small>
        </label>

        <div className="plan-form-grid plan-settings-grid">
          <label className="plan-field">
            <span>Base Price <b>*</b></span>

            <div className="plan-input-wrap">
              <span className="plan-currency">₹</span>
              <input
                name="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={updateField}
                placeholder="0.00"
              />
            </div>
          </label>

          <label className="plan-field">
            <span>Billing Cycle <b>*</b></span>

            <select
              name="billingCycle"
              value={form.billingCycle}
              onChange={updateField}
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Yearly</option>
            </select>
          </label>

          <label className="plan-field">
            <span>Status <b>*</b></span>

            <select
              name="status"
              value={form.status}
              onChange={updateField}
              className="plan-status-select"
            >
              <option value="Active">● Active</option>
              <option value="Inactive">● Inactive</option>
            </select>
          </label>
        </div>

        <div className="plan-actions">
          <button
            type="button"
            className="plan-cancel-button"
            onClick={resetForm}
          >
            Cancel
          </button>

          <button type="submit" className="plan-submit-button">
            {editingId ? "Update Plan" : "Create Plan"}
          </button>
        </div>
      </form>

      <section className="plans-list-card">
        <h2>Plans List</h2>

        <div className="plans-filters">
          <label className="plan-search">
            <i className="bi bi-search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search plans..."
            />
          </label>

          <select
            value={billingFilter}
            onChange={(event) => setBillingFilter(event.target.value)}
          >
            <option value="">All Billing Models</option>
            <option value="Per store">Per Store</option>
            <option value="Per device">Per Device</option>
            <option value="Flat rate">Flat Rate</option>
          </select>

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
            className="plan-reset-button"
            title="Reset filters"
            onClick={resetFilters}
          >
            <i className="bi bi-arrow-clockwise" />
            Reset
          </button>
        </div>

        <div className="plans-table-wrap">
          <div className="plans-table">
            <div className="plans-row plans-row-head">
              <div><input type="checkbox" aria-label="Select all plans" /></div>
              <div>Plan Code</div>
              <div>Name / Description</div>
              <div>Billing Model</div>
              <div>Price</div>
              <div>Status</div>
              <div>Created On</div>
              <div>Actions</div>
            </div>

            {filteredPlans.map((plan) => (
              <div className="plans-row" key={plan.id}>
                <div>
                  <input
                    type="checkbox"
                    aria-label={`Select ${plan.name}`}
                  />
                </div>

                <div className="plan-code-cell">
                  <span className={`plan-item-icon ${plan.tone}`}>
                    <i className={`bi ${plan.icon}`} />
                  </span>
                  <strong>{plan.code}</strong>
                </div>

                <div className="plan-name-cell">
                  <strong>{plan.name}</strong>
                  <span>{plan.description}</span>
                </div>

                <div>{plan.billingModel}</div>

                <div className="plan-price-cell">
                  ₹{plan.price}
                  <small>/{plan.cycle.toLowerCase()}</small>
                </div>

                <div>
                  <span
                    className={`plan-status ${
                      plan.status === "Inactive" ? "inactive" : ""
                    }`}
                  >
                    <i className="bi bi-circle-fill" />
                    {plan.status}
                  </span>
                </div>

                <div>{plan.createdOn}</div>

                <div className="plan-table-actions">
                  <button
                    type="button"
                    title="Edit plan"
                    onClick={() => editPlan(plan)}
                  >
                    <i className="bi bi-pencil" />
                  </button>

                  <button
                    type="button"
                    className="plan-delete-icon"
                    title="Delete plan"
                    onClick={() => setDeleteTarget(plan)}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="plans-pagination">
          <span>
            Showing 1 to {filteredPlans.length} of {filteredPlans.length} entries
          </span>

          <div>
            <button type="button">
              <i className="bi bi-chevron-left" />
            </button>
            <button type="button" className="active">1</button>
            <button type="button">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {deleteTarget && (
        <div
          className="delete-plan-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-plan-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-plan-icon">
              <i className="bi bi-trash3" />
            </div>

            <h2>Delete Plan?</h2>

            <p>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="delete-plan-actions">
              <button
                type="button"
                className="delete-plan-keep-button"
                onClick={() => setDeleteTarget(null)}
              >
                No, Keep It
              </button>

              <button
                type="button"
                className="delete-plan-confirm-button"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="plan-toast">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </section>
  );
}