import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function ViewPlanPricing() {
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
    billingModel: selectedPlan.billingModel || "Per store",
    currency: selectedPlan.currency || "USD",
    billingCycle: selectedPlan.billingCycle || "Monthly",
    basePrice: selectedPlan.basePrice || "49.00",
    trialPeriod: selectedPlan.trialPeriod || "7 days",
    includedStores: selectedPlan.includedStores || "5",
    includedTerminals: selectedPlan.includedTerminals || "2",
    additionalTerminalPrice: selectedPlan.additionalTerminalPrice || "10.00",
    includedUsers: selectedPlan.includedUsers || "5",
    additionalUserPrice: selectedPlan.additionalUserPrice || "5.00",
    effectiveFrom: selectedPlan.effectiveFrom || "Sep 10, 2025",
  };

  const tabs = [
    ["overview", "Overview", `/plans/${planId}`],
    ["pricing", "Pricing", `/plans/${planId}/pricing`],
    ["features", "Features & Limits", `/plans/${planId}/features-limits`],
  ];

  function goToTab(path) {
    navigate(path, { state: { plan: selectedPlan } });
  }

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
            className={id === "pricing" ? "active" : ""}
            onClick={() => goToTab(path)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="plan-details-card">
        <div className="plan-details-card-heading">
          <div className="plan-details-icon">
            <i className="bi bi-coin" />
          </div>

          <div>
            <h2>Pricing</h2>
            <p>View billing model, pricing, limits, and trial configuration.</p>
          </div>
        </div>

        <div className="plan-pricing-fields">
          <label className="plan-details-field">
            <span>Billing Model</span>
            <input value={plan.billingModel} readOnly />
          </label>

          <label className="plan-details-field">
            <span>Currency</span>
            <input value={plan.currency} readOnly />
          </label>

          <label className="plan-details-field">
            <span>Billing Cycle</span>
            <input value={plan.billingCycle} readOnly />
          </label>

          <label className="plan-details-field">
            <span>Base Price</span>
            <input value={`${plan.currency} ${plan.basePrice}`} readOnly />
          </label>

          <label className="plan-details-field">
            <span>Trial Period</span>
            <input value={plan.trialPeriod} readOnly />
          </label>

          <label className="plan-details-field">
            <span>Included Stores</span>
            <input value={plan.includedStores} readOnly />
          </label>

          <label className="plan-details-field">
            <span>Included Terminals</span>
            <input value={plan.includedTerminals} readOnly />
          </label>

          <label className="plan-details-field">
            <span>Additional Terminal Price</span>
            <input
              value={`${plan.currency} ${plan.additionalTerminalPrice}`}
              readOnly
            />
          </label>

          <label className="plan-details-field">
            <span>Included Users/Employees</span>
            <input value={plan.includedUsers} readOnly />
          </label>

          <label className="plan-details-field">
            <span>Additional User Price</span>
            <input
              value={`${plan.currency} ${plan.additionalUserPrice}`}
              readOnly
            />
          </label>

          <label className="plan-details-field">
            <span>Effective From</span>
            <input value={plan.effectiveFrom} readOnly />
          </label>
        </div>
      </section>
    </section>
  );
}