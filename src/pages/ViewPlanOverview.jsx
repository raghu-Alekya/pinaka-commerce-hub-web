import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function ViewPlanOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId } = useParams();

  const selectedPlan = location.state?.plan || {};

  const plan = {
    id: selectedPlan.id || planId,
    code: selectedPlan.code || "BASIC",
    name: selectedPlan.name || "Basic Plan",
    status: selectedPlan.status || "Active",
    description:
      selectedPlan.description ||
      "Suitable for small businesses with essential features.",
    storeType:
      selectedPlan.applicableStoreType ||
      selectedPlan.storeType ||
      "Retail",
  };

  const tabs = [
    ["overview", "Overview", `/plans/${planId}`],
    ["pricing", "Pricing", `/plans/${planId}/pricing`],
    ["features", "Features & Limits", `/plans/${planId}/features-limits`],
  ];

  return (
    <section className="plan-details-page">
      <button
        type="button"
        className="plan-details-back"
        onClick={() => navigate("/plans/new")}
      >
        <i className="bi bi-arrow-left" />
        Back to Plans
      </button>

      <div className="plan-details-heading">
        <div className="plan-details-title-line">
          <h1>{plan.name}</h1>

          <span
            className={`plan-details-active-badge ${
              plan.status === "Inactive"
                ? "plan-details-inactive-badge"
                : ""
            }`}
          >
            <i className="bi bi-circle-fill" />
            {plan.status}
          </span>
        </div>

        <p>{plan.description}</p>
      </div>

      <nav className="plan-details-tabs" aria-label="Plan sections">
        {tabs.map(([id, label, path]) => (
          <button
            type="button"
            key={id}
            className={id === "overview" ? "active" : ""}
            onClick={() => navigate(path, { state: { plan: selectedPlan } })}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="plan-details-card">
        <div className="plan-details-card-heading">
          <div className="plan-details-icon">
            <i className="bi bi-card-text" />
          </div>

          <div>
            <h2>Plan Information</h2>
            <p>View the core plan details and its applicable store type.</p>
          </div>
        </div>

        <div className="plan-details-grid">
          <label className="plan-details-field">
            <span>
              Plan Code <b>*</b>
            </span>

            <input value={plan.code} readOnly />
            <small>Unique identifier for this subscription plan.</small>
          </label>

          <label className="plan-details-field">
            <span>
              Status <b>*</b>
            </span>

            <input
              className={
                plan.status === "Inactive"
                  ? "plan-details-status-inactive"
                  : "plan-details-status"
              }
              value={`● ${plan.status}`}
              readOnly
            />
            <small>
              Inactive plans cannot be assigned to new subscriptions.
            </small>
          </label>
        </div>

        <label className="plan-details-field plan-details-full-field">
          <span>
            Plan Name <b>*</b>
          </span>

          <input value={plan.name} readOnly />
        </label>

        <label className="plan-details-field plan-details-full-field">
          <span>
            Applicable Business/Store Type <b>*</b>
          </span>

          <input value={plan.storeType} readOnly />
          <small>The store type this plan can be assigned to.</small>
        </label>

        <label className="plan-details-field plan-details-description">
          <span>Description</span>

          <textarea value={plan.description} readOnly />
          <small>{plan.description.length}/500</small>
        </label>
      </section>
    </section>
  );
}