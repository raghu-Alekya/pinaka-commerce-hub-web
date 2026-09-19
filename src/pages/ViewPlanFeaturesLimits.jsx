import { useLocation, useNavigate, useParams } from "react-router-dom";

const fallbackFeatures = [
  { id: 1, name: "POS", category: "Operations", order: 1 },
  { id: 2, name: "Inventory", category: "Operations", order: 2 },
  { id: 3, name: "Reporting", category: "Analytics", order: 3 },
  { id: 4, name: "Payments", category: "Payments", order: 4 },
  { id: 5, name: "Loyalty Program", category: "Customer", order: 5 },
];

export default function ViewPlanFeaturesLimits() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId } = useParams();

  const selectedPlan = location.state?.plan || {};

  const plan = {
    id: selectedPlan.id || planId,
    name: selectedPlan.name || "Basic Plan",
    status: selectedPlan.status || "Active",
    description:
      selectedPlan.description ||
      "Suitable for small businesses with essential features.",
  };

  const selectedFeatures =
    selectedPlan.includedFeatures?.length > 0
      ? selectedPlan.includedFeatures.map((feature, index) => ({
          id: feature.id || index + 1,
          name: feature.name || feature,
          category: feature.category || "General",
          order: feature.order || index + 1,
        }))
      : fallbackFeatures;

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
            className={id === "features" ? "active" : ""}
            onClick={() => goToTab(path)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="plan-details-card">
        <div className="plan-details-card-heading">
          <div className="plan-details-icon">
            <i className="bi bi-stars" />
          </div>

          <div>
            <h2>Features & Limits</h2>
            <p>Features included with this plan and their configured access.</p>
          </div>
        </div>

        <div className="plan-view-features-table-wrap">
          <table className="plan-view-features-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Category</th>
                <th>Included</th>
              </tr>
            </thead>

            <tbody>
              {selectedFeatures.map((feature) => (
                <tr key={feature.id}>
                  <td>
                    <strong>{feature.name}</strong>
                  </td>

                  <td>{feature.category}</td>

                  <td>
                    <span className="plan-feature-included-badge">
                      <i className="bi bi-circle-fill" />
                      Included
                    </span>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="plan-view-table-count">
          Showing 1 to {selectedFeatures.length} of {selectedFeatures.length}{" "}
          included features
        </p>
      </section>
    </section>
  );
}