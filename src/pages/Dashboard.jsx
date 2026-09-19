import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   KPI DATA
========================================================= */

const kpis = [
  {
    label: "Merchants",
    value: "148",
    trend: "+12%",
    detail: (
      <>
        <b className="is-good">139 active</b>
        <span>4 onboarding</span>
        <span>5 inactive</span>
      </>
    ),
    icon: "bi-shop",
    tone: "blue",
  },
  {
    label: "Stores",
    value: "342",
    trend: "+8%",
    detail: (
      <>
        <b className="is-good">331 active</b>
        <span>6 pending</span>
        <span>5 inactive</span>
      </>
    ),
    icon: "bi-buildings",
    tone: "green",
  },
  {
    label: "Employees",
    value: "2,486",
    trend: "+5%",
    detail: (
      <>
        <b className="is-warning">24 without roles</b>
        <span>6 locked</span>
      </>
    ),
    icon: "bi-people",
    tone: "orange",
  },
  {
    label: "Active subscriptions",
    value: "136",
    trend: "+3%",
    detail: (
      <>
        <b className="is-warning">3 expiring</b>
        <span>4 payment pending</span>
      </>
    ),
    icon: "bi-credit-card-2-front",
    tone: "purple",
  },
];

/* =========================================================
   PLATFORM HEALTH
========================================================= */

const healthRows = [
  ["Devices online", "974 / 982", "99%", "good"],
  ["Stores synchronized", "337 / 342", "98%", "warn"],
  ["POS configuration complete", "336 / 342", "98%", "warn"],
  ["Integrations connected", "144 / 148", "97%", "warn"],
];

/* =========================================================
   ADMINISTRATION MODULES
========================================================= */

const adminModules = [
  {
    title: "Merchants & Stores",
    icon: "bi-shop",
    rows: [
      ["Pending onboarding", "10"],
      ["Suspended accounts", "4"],
      ["Setup completion", "96%"],
    ],
    path: "/merchants",
  },
  {
    title: "Employees & Access",
    icon: "bi-people",
    rows: [
      ["Active role templates", "14"],
      ["Permissions", "126"],
      ["Access exceptions", "30"],
    ],
    path: "/employees",
  },
  {
    title: "Stores",
    icon: "bi-buildings",
    rows: [
      ["Active stores", "331"],
      ["Pending stores", "6"],
      ["Inactive stores", "5"],
    ],
    path: "/stores",
  },
  {
    title: "Subscriptions",
    icon: "bi-credit-card",
    rows: [
      ["Trial", "5"],
      ["Expiring soon", "3"],
      ["Expired", "2"],
    ],
    path: "/subscriptions",
  },
];

/* =========================================================
   PLANS & ENTITLEMENTS
========================================================= */

const planEntitlements = [
  ["Basic · 1 store", "48"],
  ["Pro · 3 stores", "46"],
  ["Executive · 5 stores", "18"],
];

/* =========================================================
   ROLE & PERMISSION METRICS
   KEEP AS-IS
========================================================= */

const roleMetrics = [
  ["System Roles", "8", "bi-shield-check", "blue"],
  ["Custom Roles", "6", "bi-person-badge", "purple"],
  ["Permissions", "126", "bi-key", "purple"],
  ["Employees Assigned", "2,456", "bi-person-check", "blue"],
  ["Without Roles", "24", "bi-exclamation-circle", "orange"],
  ["Locked Accounts", "6", "bi-lock", "red"],
];

/* =========================================================
   DONUT
========================================================= */

function Donut({ value, className = "" }) {
  return (
    <div className={`dashboard-donut ${className}`}>
      <div className="dashboard-donut-hole">
        <strong>{value}</strong>

        <span>
          {className.includes("coverage")
            ? "Active features"
            : "Healthy"}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  action,
  onAction,
}) {
  return (
    <div className="dash-section-header">
      <div className="dash-section-title">
        <span className="dash-section-icon">
          <i className={`bi ${icon}`} />
        </span>

        <h2>{title}</h2>
      </div>

      {action && (
        <button
          type="button"
          className="dash-link"
          onClick={onAction}
        >
          {action}
          <i className="bi bi-arrow-right" />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const nav = useNavigate();

  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);

    window.setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  return (
    <div className="page-content super-admin-dashboard">

      {/* =====================================================
          DASHBOARD HEADER
      ===================================================== */}

      <div className="super-dashboard-head">

        <div>
          <div className="dashboard-breadcrumb">
            Dashboard / Overview
          </div>

          <h1>Super Admin Dashboard</h1>

          <p>
            Platform administration, access governance and
            service health
          </p>
        </div>

        <div className="dashboard-toolbar">

          {/* Date filter intentionally kept commented */}
          {/*
          <button className="dashboard-filter">
            <i className="bi bi-calendar3" />
            Apr 1, 2025 – Apr 30, 2025
            <i className="bi bi-chevron-down" />
          </button>
          */}

          <button className="dashboard-filter">
            All merchants
            <i className="bi bi-chevron-down" />
          </button>

          <button className="dashboard-filter">
            All stores
            <i className="bi bi-chevron-down" />
          </button>

          <button
            className="dashboard-icon-btn"
            onClick={refresh}
            aria-label="Refresh"
          >
            <i
              className={`bi bi-arrow-clockwise ${
                refreshing ? "spin" : ""
              }`}
            />
          </button>

          <button className="dashboard-primary">
            <i className="bi bi-download" />
            Export Report
          </button>

        </div>
      </div>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <section className="dashboard-kpis">

        {kpis.map((item) => (
          <article
            className={`dashboard-kpi ${item.tone}`}
            key={item.label}
          >
            <div className="dashboard-kpi-icon">
              <i className={`bi ${item.icon}`} />
            </div>

            <div className="dashboard-kpi-body">

              <span>{item.label}</span>

              <div className="dashboard-kpi-value-row">

                <strong>{item.value}</strong>

                <small>
                  <i className="bi bi-arrow-up" />
                  {" "}
                  {item.trend}
                </small>

              </div>

              <div className="dashboard-kpi-details">
                {item.detail}
              </div>

            </div>
          </article>
        ))}

      </section>

      {/* =====================================================
          PLATFORM HEALTH + FEATURES
      ===================================================== */}

      <div className="dashboard-health-feature-grid">

        {/* ===================================================
            PLATFORM HEALTH
        =================================================== */}

        <section className="dashboard-panel platform-health-panel">

          <SectionHeader
            icon="bi-heart-pulse"
            title="Platform Health"
            action="Diagnostics"
            onAction={() => nav("/reports")}
          />

          <div className="health-content">

            <div className="health-summary">

              <Donut value="91%" />


            </div>

            <div className="health-metrics">

              {healthRows.map(
                ([label, count, percent, tone]) => (
                  <div
                    className="health-row"
                    key={label}
                  >

                    <div className="health-row-top">
                      <span>{label}</span>
                      <strong>{count}</strong>
                    </div>

                    <div className="health-progress-line">
                      <span
                        className={tone}
                        style={{ width: percent }}
                      />
                    </div>

                    <b className="health-percent">
                      {percent}
                    </b>

                  </div>
                )
              )}

            </div>

          </div>

        </section>

        {/* ===================================================
            FEATURES & PLAN COVERAGE
        =================================================== */}

        <section className="dashboard-panel coverage-panel">

          <SectionHeader
            icon="bi-boxes"
            title="Features"
            action="Manage features"
            onAction={() => nav("/features")}
          />

          <div className="coverage-content">

            <div className="coverage-visual">

              <Donut
                value="44"
                className="coverage"
              />

              <span className="coverage-total">
                48 total features
              </span>

            </div>

            <div className="coverage-legend">

              <div>
                <span className="legend-dot green" />
                <span>Included in Plans</span>
                <b>41</b>
              </div>

              <div>
                <span className="legend-dot orange" />
                <span>Unassigned Features</span>
                <b>3</b>
              </div>

              <div>
                <span className="legend-dot slate" />
                <span>Inactive Features</span>
                <b>4</b>
              </div>

            </div>

          </div>

          <div className="coverage-bottom">

            

            {/*
            <div className="attention">
              <span>
                <i className="bi bi-exclamation-triangle" />
                Plan Gaps
              </span>
              <strong>2</strong>
            </div>
            */}

          </div>

        </section>

      </div>

      {/* =====================================================
          PLANS + ADMINISTRATION MODULES
      ===================================================== */}

      <div className="dashboard-lower-grid">

        {/* ===================================================
            PLANS & ENTITLEMENTS
        =================================================== */}

        <section className="dashboard-panel plans-entitlements-panel">

          <SectionHeader
            icon="bi-boxes"
            title="Plans & Entitlements"
            action="Manage plans"
            onAction={() => nav("/subscriptions")}
          />

          <div className="plan-tier-grid">

            {planEntitlements.map(
              ([label, value]) => (
                <div
                  className="plan-tier-card"
                  key={label}
                >

                  <span>{label}</span>

                  <strong>{value}</strong>

                </div>
              )
            )}

          </div>

          <div className="plan-entitlement-list">

            <div className="plan-entitlement-row">

              <div>
                <strong>
                  Store capacity reached
                </strong>

                <span>
                  Merchants using all included stores
                </span>
              </div>

              <b>21</b>

            </div>

            <div className="plan-entitlement-row">

              <div>
                <strong>
                  Terminal limit reached
                </strong>

                <span>
                  May require an additional terminal
                </span>
              </div>

              <b>5</b>

            </div>

            <div className="plan-entitlement-row">

              <div>
                <strong>
                  Expired subscriptions
                </strong>

                <span>
                  Requires renewal or account review
                </span>
              </div>

              <b className="expired-value">
                3
              </b>

            </div>

          </div>

        </section>

        {/* ===================================================
            ADMINISTRATION MODULES
        =================================================== */}

        <section className="dashboard-panel administration-panel">

          <SectionHeader
            icon="bi-grid"
            title="Administration Overview"
            action="View all modules"
            onAction={() => nav("/merchants")}
          />

          <div className="admin-grid">

            {adminModules.map((module) => (

              <button
                className="admin-module"
                key={module.title}
                onClick={() => nav(module.path)}
              >

                <div className="admin-module-top">

                  <span className="admin-module-icon">
                    <i
                      className={`bi ${module.icon}`}
                    />
                  </span>

                  <strong>
                    {module.title}
                  </strong>

                  <i
                    className="bi bi-arrow-right admin-module-arrow"
                  />

                </div>

                <div className="admin-module-rows">

                  {module.rows.map(
                    ([label, value]) => (

                      <div key={label}>

                        <span>{label}</span>

                        <b>{value}</b>

                      </div>

                    )
                  )}

                </div>

              </button>

            ))}

          </div>

        </section>

      </div>

      {/* =====================================================
          ROLES & PERMISSIONS
          DO NOT REMOVE / CHANGE
      ===================================================== */}

      <section className="dashboard-panel roles-panel">

        <SectionHeader
          icon="bi-shield-lock"
          title="Roles & Permissions"
          action="Manage roles"
          onAction={() => nav("/role-templates")}
        />

        <div className="roles-summary">

          <div>
            <strong>14</strong>
            <span>active role templates</span>
          </div>

          <span className="attention-text">
            <i className="bi bi-exclamation-circle" />
            {" "}
            3 require attention
          </span>

        </div>

        <div className="roles-grid">

          {roleMetrics.map(
            ([label, value, icon, tone]) => (

              <div
                className={`role-metric ${tone}`}
                key={label}
              >

                <span className="role-metric-icon">
                  <i className={`bi ${icon}`} />
                </span>

                <div>

                  <span>{label}</span>

                  <strong>{value}</strong>

                </div>

              </div>

            )
          )}

        </div>

      </section>

      {/* =====================================================
          GROWTH / REPORTS
      ===================================================== */}

      <div className="dashboard-growth">

        <div className="growth-icon">
          <i className="bi bi-rocket-takeoff" />
        </div>

        <div>

          <strong>
            Platform growing steadily!
          </strong>

          <span>
            Keep your merchants, stores and teams
            connected for the best experience.
          </span>

        </div>

        <button
          onClick={() => nav("/reports")}
        >
          View Reports
          <i className="bi bi-arrow-right" />
        </button>

      </div>

    </div>
  );
}