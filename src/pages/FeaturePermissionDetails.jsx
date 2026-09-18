import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Gift,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Trash2,
} from "lucide-react";

import "../styles/featurepermissiondetails.css";

const initialPermissions = [
  {
    key: "VIEW_LOYALTY",
    name: "View Loyalty",
    feature: "Loyalty",
    description: "Allows user to view loyalty programs and details.",
    active: true,
  },
  {
    key: "CREATE_LOYALTY",
    name: "Create Loyalty",
    feature: "Loyalty",
    description: "Allows user to create a new loyalty program.",
    active: true,
  },
  {
    key: "EDIT_LOYALTY",
    name: "Edit Loyalty",
    feature: "Loyalty",
    description: "Allows user to edit existing loyalty programs.",
    active: false,
  },
  {
    key: "DELETE_LOYALTY",
    name: "Delete Loyalty",
    feature: "Loyalty",
    description: "Allows user to delete loyalty programs.",
    active: false,
  },
  {
    key: "MANAGE_REWARDS",
    name: "Manage Rewards",
    feature: "Loyalty",
    description: "Allows user to manage loyalty rewards.",
    active: true,
  },
  {
    key: "VIEW_CUSTOMERS",
    name: "View Customers",
    feature: "Loyalty",
    description: "Allows user to view customer points and history.",
    active: true,
  },
  {
    key: "ADJUST_POINTS",
    name: "Adjust Points",
    feature: "Loyalty",
    description: "Allows user to manually adjust customer points.",
    active: false,
  },
  {
    key: "EXPORT_REPORTS",
    name: "Export Reports",
    feature: "Loyalty",
    description: "Allows user to export loyalty reports.",
    active: true,
  },
];

const FeaturePermissions = () => {
  const navigate = useNavigate();
  const { featureId } = useParams();
  const [permissions, setPermissions] = useState(initialPermissions);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return permissions.filter((permission) => {
      const matchesSearch =
        permission.key.toLowerCase().includes(query) ||
        permission.name.toLowerCase().includes(query) ||
        permission.feature.toLowerCase().includes(query) ||
        permission.description.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && permission.active) ||
        (filter === "inactive" && !permission.active);

      return matchesSearch && matchesFilter;
    });
  }, [permissions, search, filter]);

  const deletePermission = (key) => {
    setPermissions((current) =>
      current.filter((permission) => permission.key !== key)
    );
  };

  return (
    <div className="fp-page">

      {/* =====================================================
          FEATURE HEADER
      ====================================================== */}

      <section className="fp-feature-card">

        <div className="fp-feature-top">

          <div className="fp-feature-icon">
            <Gift size={27} strokeWidth={2.1} />
          </div>

          <div className="fp-feature-copy">
            <h1>Loyalty</h1>
            <p>Manage loyalty programs and rewards.</p>
          </div>

        </div>


        {/* TABS */}

        <div className="fp-tabs">

          <button
            type="button"
            className="fp-tab"
            onClick={() => navigate(`/features/${featureId}/overview`)}
          >
            Overview
          </button>

          <button
            type="button"
            className="fp-tab"
            onClick={() => navigate(`/features/${featureId}/store-types`)}
          >
            Store Types
          </button>

          <button type="button" className="fp-tab active">
            Feature Permissions
          </button>

        </div>

      </section>


      {/* =====================================================
          PERMISSIONS CARD
      ====================================================== */}

      <section className="fp-permissions-card">

        {/* TOP */}

        <div className="fp-card-header">

          <div className="fp-title-section">

            <div className="fp-shield-icon">
              <ShieldCheck size={20} strokeWidth={2.1} />
            </div>

            <div className="fp-title-copy">
              <h2>Permissions List ({permissions.length})</h2>

              <p>
                Manage and configure permissions for the Loyalty feature.
              </p>
            </div>

          </div>


          {/* SEARCH + FILTER */}

          <div className="fp-toolbar">

            <div className="fp-search-box">

              <Search size={17} strokeWidth={2} />

              <input
                type="text"
                placeholder="Search permissions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

            </div>


            <div className="fp-filter-wrapper">

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="fp-filter"
              >
                <option value="all">All Permissions</option>
                <option value="active">Active Permissions</option>
                <option value="inactive">Inactive Permissions</option>
              </select>

              <ChevronDown
                size={16}
                strokeWidth={2}
                className="fp-filter-chevron"
              />

            </div>

          </div>

        </div>


        {/* =====================================================
            TABLE
        ====================================================== */}

        <div className="fp-table-wrapper">

          <table className="fp-table">

            <thead>

              <tr>

                <th>
                  <div className="fp-table-heading">
                    Permission Key
                    <ChevronsUpDown size={11} strokeWidth={1.8} />
                  </div>
                </th>


                <th>
                  <div className="fp-table-heading">
                    Permission Name
                    <ChevronsUpDown size={11} strokeWidth={1.8} />
                  </div>
                </th>


                <th>
                  <div className="fp-table-heading">
                    Feature
                    <ChevronsUpDown size={11} strokeWidth={1.8} />
                  </div>
                </th>


                <th>
                  <div className="fp-table-heading">
                    Description
                    <ChevronsUpDown size={11} strokeWidth={1.8} />
                  </div>
                </th>


                <th className="fp-actions-heading">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredPermissions.map((permission) => (

                <tr key={permission.key}>

                  {/* PERMISSION KEY */}

                  <td className="fp-permission-key">
                    {permission.key}
                  </td>


                  {/* PERMISSION NAME */}

                  <td className="fp-permission-name">
                    {permission.name}
                  </td>


                  {/* FEATURE */}

                  <td className="fp-feature-name">
                    {permission.feature}
                  </td>


                  {/* DESCRIPTION */}

                  <td className="fp-description">
                    {permission.description}
                  </td>


                  {/* DELETE */}

                  <td className="fp-action-cell">

                    <button
                      type="button"
                      className="fp-delete"
                      onClick={() =>
                        deletePermission(permission.key)
                      }
                      aria-label={`Delete ${permission.name}`}
                    >

                      <Trash2
                        size={15}
                        strokeWidth={2}
                      />

                    </button>

                  </td>

                </tr>

              ))}


              {/* EMPTY STATE */}

              {filteredPermissions.length === 0 && (

                <tr>

                  <td
                    colSpan="5"
                    className="fp-empty-state"
                  >
                    No permissions found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="fp-table-footer">

          <p className="fp-results-text">
            Showing{" "}
            {filteredPermissions.length > 0 ? 1 : 0} to{" "}
            {filteredPermissions.length} of{" "}
            {filteredPermissions.length} entries
          </p>


          <div className="fp-pagination">

            <button
              type="button"
              className="fp-page-button fp-arrow"
              disabled
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>


            <button
              type="button"
              className="fp-page-button active"
            >
              1
            </button>


            <button
              type="button"
              className="fp-page-button fp-arrow"
              disabled
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>

          </div>

        </div>

      </section>

    </div>
  );
};

export default FeaturePermissions;