import { useState } from "react";
import { NavLink } from "react-router-dom";

const sections = [
  {
    title: "",
    items: [["/dashboard", "bi-house-fill", "Dashboard"]],
  },
  {
    title: "MANAGE",
    items: [
      ["/merchants", "bi-person-badge", "Merchants"],
      ["/stores", "bi-shop", "Stores"],
      ["/merchant-subscriptions", "bi-cart3", "Subscriptions"],
    ],
  },
  {
    title: "MASTER SETUP",
    items: [
      [
        "/master-setup",
        "bi-sliders",
        "Master Setup",
        true,
        [
["/store-types/new", "bi-shop", "Store Types"],
["/features", "bi-grid-1x2", "Features"],          ["/permissions", "bi-shield-check", "Permissions"],
          ["/role-templates", "bi-person-badge", "Role Templates"],
          ["/plans/new", "bi-credit-card", "Plans"],
        
        ],
      ],
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      ["/pos-configuration", "bi-cpu", "POS Configuration", true],
      ["/orders", "bi-receipt", "Orders"],
      ["/cash-management", "bi-wallet2", "Cash Management"],
      ["/employees", "bi-people", "Employees", true],
      ["/devices", "bi-display", "Devices", true],
      ["/shifts", "bi-clock", "Shifts"],
      ["/attendance", "bi-person-check", "Attendance"],
    ],
  },
  {
    title: "INTEGRATIONS",
    items: [
      ["/integrations", "bi-diagram-3", "Integrations", true],
      ["/synchronization", "bi-arrow-repeat", "Synchronization"],
      ["/reconciliation", "bi-arrow-left-right", "Reconciliation"],
      ["/notifications", "bi-bell", "Notifications"],
    ],
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const [masterSetupOpen, setMasterSetupOpen] = useState(false);

  return (
    <aside
      className={`sidebar ${
        collapsed ? "sidebar-collapsed" : ""
      } ${mobileOpen ? "mobile-open" : ""}`}
    >
      <div className="sidebar-brand">
        <div className="brand-icon">
          <i className="bi bi-cloud-fill" />
        </div>

        {!collapsed && (
          <div className="brand-text">
            <div className="brand-title">PINAKA</div>
            <div className="brand-subtitle">COMMERCE HUB</div>
          </div>
        )}
      </div>

      <nav className="sidebar-menu">
        {sections.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`}>
            {section.title && !collapsed && (
              <div className="menu-section">{section.title}</div>
            )}

            {section.items.map(
              ([to, icon, label, hasArrow, subItems]) => {
                const isMasterSetup = label === "Master Setup";

                if (isMasterSetup) {
                  return (
                    <div key={to} className="master-setup-group">
                      <button
                        type="button"
                        className="menu-item master-setup-button"
                        onClick={() =>
                          setMasterSetupOpen((current) => !current)
                        }
                      >
                        <i className={`bi ${icon}`} />

                        {!collapsed && <span>{label}</span>}

                        {!collapsed && (
                          <i
                            className={`bi bi-chevron-down arrow ${
                              masterSetupOpen
                                ? "master-setup-arrow-open"
                                : ""
                            }`}
                          />
                        )}
                      </button>

                      {!collapsed && masterSetupOpen && (
                        <div className="master-setup-submenu">
                          {subItems.map(([subTo, subIcon, subLabel]) => (
                            <NavLink
                              key={subTo}
                              to={subTo}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) =>
                                `master-setup-submenu-item ${
                                  isActive ? "active" : ""
                                }`
                              }
                            >
                              <i className={`bi ${subIcon}`} />
                              <span>{subLabel}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `menu-item ${isActive ? "active" : ""}`
                    }
                  >
                    <i className={`bi ${icon}`} />

                    {!collapsed && <span>{label}</span>}

                    {!collapsed && hasArrow && (
                      <i className="bi bi-chevron-down arrow" />
                    )}
                  </NavLink>
                );
              }
            )}
          </div>
        ))}
      </nav>

      <button
        type="button"
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        <i
          className={`bi ${
            collapsed ? "bi-chevron-right" : "bi-chevron-left"
          }`}
        />

        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}