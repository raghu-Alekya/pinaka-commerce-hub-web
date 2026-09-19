import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const plan = {
  code: "BASIC",
  name: "Basic Plan",
  status: "Active",
  description: "Suitable for small businesses with essential features.",
  applicableType: "Retail",
  billingModel: "Per store",
  currency: "USD",
  cycle: "Monthly",
  basePrice: "USD 49.00",
  trialPeriod: "7 days",
  includedStores: "5",
  includedTerminals: "2",
  additionalTerminalPrice: "USD 10.00",
  includedUsers: "5",
  additionalUserPrice: "USD 5.00",
  effectiveFrom: "Sep 10, 2025",
};

const tabs = [
  ["overview", "Overview"],
  ["pricing", "Pricing"],
  ["features", "Features & Limits"],
  ["roles", "Role Templates"],
  ["configuration", "Configuration Defaults"],
];

export default function ViewPlan() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const sectionIds = [
      "overview",
      "pricing",
      "features",
      "roles",
      "configuration",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleSection) {
          setActiveTab(visibleSection.target.id.replace("plan-", ""));
        }
      },
      {
        rootMargin: "-190px 0px -55% 0px",
        threshold: [0.1, 0.3, 0.6],
      }
    );

    sectionIds.forEach((id) => {
      const section = document.getElementById(`plan-${id}`);

      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, []);

  function scrollToSection(id) {
    setActiveTab(id);

    document.getElementById(`plan-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section className="view-plan-page">
      <div className="view-plan-sticky-area">
        <button
          type="button"
          className="view-plan-back"
          onClick={() => navigate("/plans/new")}
        >
          <i className="bi bi-arrow-left" />
          Back to Plans
        </button>

        <div className="view-plan-heading">
          <h1>View Plan</h1>
          <p>
            View detailed information about the plan, including pricing,
            features and limits.
          </p>
        </div>

        <nav className="view-plan-tabs">
          {tabs.map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={activeTab === id ? "active" : ""}
              onClick={() => scrollToSection(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <section className="view-plan-summary">
        <div className="view-plan-main">
          <div className="view-plan-icon">
            <i className="bi bi-layers" />
          </div>

          <div>
            <div className="view-plan-name">
              <h2>{plan.name}</h2>

              <span className="view-plan-active">
                <i className="bi bi-circle-fill" />
                {plan.status}
              </span>
            </div>

            <p>For small businesses</p>
          </div>
        </div>

        <div className="view-plan-summary-item">
          <i className="bi bi-file-earmark-text" />
          <div>
            <span>Plan Code</span>
            <strong>{plan.code}</strong>
          </div>
        </div>

        <div className="view-plan-summary-item">
          <i className="bi bi-calendar3" />
          <div>
            <span>Billing Model</span>
            <strong>{plan.billingModel}</strong>
          </div>
        </div>

        <div className="view-plan-summary-item">
          <i className="bi bi-cash-stack" />
          <div>
            <span>Price / Cycle</span>
            <strong>
              {plan.basePrice} / {plan.cycle}
            </strong>
          </div>
        </div>

        <div className="view-plan-summary-item">
          <i className="bi bi-star" />
          <div>
            <span>Applicable Type</span>
            <strong>{plan.applicableType}</strong>
          </div>
        </div>

        <button
          type="button"
          className="view-plan-edit"
          onClick={() => navigate("/plans/new", { state: { planId } })}
        >
          <i className="bi bi-pencil" />
          Edit Plan
        </button>
      </section>

      <section id="plan-overview" className="view-plan-card">
        <div className="view-plan-card-title">
          <span>
            <i className="bi bi-card-text" />
          </span>
          <h2>Plan Information</h2>
        </div>

        <div className="view-plan-information">
          <div>
            <span>Plan Code</span>
            <strong>{plan.code}</strong>

            <span>Applicable Business/Store Type</span>
            <strong>
              <i className="bi bi-shop" /> {plan.applicableType}
            </strong>
          </div>

          <div>
            <span>Plan Name</span>
            <strong>{plan.name}</strong>

            <span>Status</span>
            <strong className="view-plan-status-text">
              <i className="bi bi-circle-fill" /> {plan.status}
            </strong>
          </div>

          <div>
            <span>Description</span>
            <strong>{plan.description}</strong>
          </div>
        </div>
      </section>

      <section id="plan-pricing" className="view-plan-card">
        <div className="view-plan-card-title">
          <span>
            <i className="bi bi-coin" />
          </span>
          <h2>Pricing</h2>
        </div>

        <div className="view-plan-pricing">
          <div><span>Billing Model</span><strong>{plan.billingModel}</strong></div>
          <div><span>Currency</span><strong>{plan.currency}</strong></div>
          <div><span>Billing Cycle</span><strong>{plan.cycle}</strong></div>
          <div><span>Base Price</span><strong>{plan.basePrice}</strong></div>
          <div><span>Trial Period</span><strong>{plan.trialPeriod}</strong></div>
          <div><span>Included Stores</span><strong>{plan.includedStores}</strong></div>
          <div><span>Included Terminals</span><strong>{plan.includedTerminals}</strong></div>
          <div><span>Additional Terminal Price</span><strong>{plan.additionalTerminalPrice}</strong></div>
          <div><span>Included Users/Employees</span><strong>{plan.includedUsers}</strong></div>
          <div><span>Additional User Price</span><strong>{plan.additionalUserPrice}</strong></div>
          <div><span>Effective From</span><strong>{plan.effectiveFrom}</strong></div>
        </div>
      </section>

      <section id="plan-features" className="view-plan-card">
        <div className="view-plan-card-title">
          <span>
            <i className="bi bi-stars" />
          </span>
          <h2>Features & Limits</h2>
        </div>

        <div className="view-plan-features-grid">
          <div className="view-plan-feature-list">
            <h3>Included Features</h3>

            {["POS", "Reporting", "Inventory", "Payments", "Loyalty Program"].map(
              (feature) => (
                <div key={feature}>
                  <span>
                    <i className="bi bi-check-circle-fill" />
                    {feature}
                  </span>
                  <small>Included</small>
                </div>
              )
            )}
          </div>

          <div id="plan-roles" className="view-plan-roles">
            <h3>Role Templates</h3>

            <p>
              Default role templates included in this plan. You can manage role
              permissions from the Role Templates tab.
            </p>

            <div className="view-plan-role-head">
              <span>Role</span>
              <span>Scope</span>
              <span>Default</span>
              <span>Required</span>
            </div>

            {[
              ["Manager", "Store", "Yes", "Yes"],
              ["Cashier", "Store", "Yes", "No"],
              ["Kitchen Staff", "Store", "No", "No"],
            ].map(([role, scope, defaultValue, required]) => (
              <div className="view-plan-role-row" key={role}>
                <span>{role}</span>
                <span>{scope}</span>
                <span className={defaultValue === "Yes" ? "yes" : "no"}>
                  <i className="bi bi-check-circle-fill" /> {defaultValue}
                </span>
                <span className={required === "Yes" ? "yes" : "no"}>
                  <i className="bi bi-check-circle-fill" /> {required}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="plan-configuration"
        className="view-plan-card view-plan-configuration"
      >
        <div className="view-plan-card-title">
          <span>
            <i className="bi bi-gear" />
          </span>
          <h2>Configuration Defaults</h2>
        </div>

        <p>Default plan configuration is ready for merchant assignment.</p>
      </section>
    </section>
  );
}