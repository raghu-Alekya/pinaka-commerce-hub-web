import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const initialFeatures = [
  {
    id: 1,
    name: "KDS",
    category: "Restaurant",
    active: true,
    order: 1,
  },
  {
    id: 2,
    name: "Tables",
    category: "Restaurant",
    active: true,
    order: 2,
  },
  {
    id: 3,
    name: "Tips",
    category: "Restaurant",
    active: true,
    order: 3,
  },
  {
    id: 4,
    name: "Service Charges",
    category: "Restaurant",
    active: true,
    order: 4,
  },
  {
    id: 5,
    name: "Delivery",
    category: "Integration",
    active: true,
    order: 5,
  },
];

const featureOptions = {
  Restaurant: ["KDS", "Tables", "Tips", "Service Charges", "Dining"],
  Integration: ["Delivery", "Online Ordering", "Payment Gateway"],
  POS: ["Fast Keys", "Customer Display", "Printer", "Cash Management"],
};

export default function StoreTypeFeatures() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();

  const [features, setFeatures] = useState(initialFeatures);
  const [search, setSearch] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return features.filter((feature) =>
      feature.name.toLowerCase().includes(query)
    );
  }, [features, search]);

  const filteredGroups = useMemo(() => {
    const query = modalSearch.trim().toLowerCase();

    return Object.entries(featureOptions)
      .map(([category, options]) => ({
        category,
        options: options.filter((featureName) =>
          featureName.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [modalSearch]);

  function toggleFeature(id) {
    setFeatures((current) =>
      current.map((feature) =>
        feature.id === id
          ? { ...feature, active: !feature.active }
          : feature
      )
    );
  }

  function toggleSelectedFeature(featureName) {
    setSelectedFeatures((current) =>
      current.includes(featureName)
        ? current.filter((item) => item !== featureName)
        : [...current, featureName]
    );
  }

  function openAddModal() {
    setSelectedFeatures([]);
    setModalSearch("");
    setShowAddModal(true);
  }

  function addSelectedFeatures() {
    const existingNames = features.map((feature) => feature.name);

    const additions = selectedFeatures
      .filter((featureName) => !existingNames.includes(featureName))
      .map((featureName, index) => {
        const category = Object.entries(featureOptions).find(([, options]) =>
          options.includes(featureName)
        )?.[0];

        return {
          id: Date.now() + index,
          name: featureName,
          category: category || "Restaurant",
          active: true,
          order: features.length + index + 1,
        };
      });

    setFeatures((current) => [...current, ...additions]);
    setShowAddModal(false);
    setSelectedFeatures([]);
  }

  function confirmDeleteFeature() {
    if (!deleteTarget) return;

    setFeatures((current) =>
      current.filter((feature) => feature.id !== deleteTarget.id)
    );
    setDeleteTarget(null);
  }

  return (
    <section className="store-features-page">
      <button
        type="button"
        className="store-features-back"
        onClick={() => navigate("/store-types/new")}
      >
        <i className="bi bi-arrow-left" />
        Back to Store Types
      </button>

      <div className="store-features-title">
        <div className="store-type-title-line">
          <h1>Restaurant</h1>

          <span className="store-type-active-badge">
            <i className="bi bi-circle-fill" />
            Active
          </span>
        </div>

        <p>
          Store type for restaurant vertical with full service and quick
          service operations.
        </p>
      </div>

      <nav className="store-type-tabs">
        <button
          type="button"
          onClick={() => navigate(`/store-types/${storeTypeId}`)}
        >
          Overview
        </button>

        <button type="button" className="active">
          Features
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(`/store-types/${storeTypeId}/role-templates`)
          }
        >
          Role Templates
        </button>
      </nav>

      <section className="store-features-card">
        <div className="store-features-card-header">
          <div className="store-features-card-title">
            <div className="store-features-title-icon">
              <i className="bi bi-boxes" />
            </div>

            <div>
              <h2>Features</h2>
              <p>Manage platform features and their details.</p>
            </div>
          </div>

          <div className="store-features-tools">
            <label className="store-features-search">
              <i className="bi bi-search" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search features..."
              />
            </label>

            <button
              type="button"
              className="store-features-add-button"
              onClick={openAddModal}
            >
              <i className="bi bi-plus-lg" />
              Add Feature
            </button>
          </div>
        </div>

        <div className="store-features-table">
          <div className="store-features-row store-features-row-head">
            <div>Feature</div>
            <div>Category</div>
            <div>Action</div>
          </div>

          {filteredFeatures.map((feature) => (
            <div className="store-features-row" key={feature.id}>
              <div className="store-features-name">{feature.name}</div>

              <div>{feature.category}</div>

              <div>
                <button
                  type="button"
                  className="feature-delete-button"
                  title={`Delete ${feature.name}`}
                  aria-label={`Delete ${feature.name}`}
                  onClick={() => setDeleteTarget(feature)}
                >
                  <i className="bi bi-trash3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="store-features-footer">
          <span>
            Showing 1 to {filteredFeatures.length} of {features.length} entries
          </span>

          <div className="store-features-pagination">
            <button type="button" aria-label="Previous page">
              <i className="bi bi-chevron-left" />
            </button>

            <button type="button" className="active">
              1
            </button>

            <button type="button" aria-label="Next page">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {showAddModal && (
        <div
          className="add-features-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="add-features-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="add-features-modal-header">
              <h2>Add Features</h2>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <label className="add-features-search">
              <i className="bi bi-search" />
              <input
                type="search"
                value={modalSearch}
                onChange={(event) => setModalSearch(event.target.value)}
                placeholder="Search features..."
                autoFocus
              />
            </label>

            <div className="add-features-groups">
              {filteredGroups.map((group) => (
                <div className="add-features-group" key={group.category}>
                  <div className="add-features-group-title">
                    <span>
                      <i className="bi bi-chevron-down" />
                      {group.category}
                    </span>

                    <small>
                      (
                      {
                        selectedFeatures.filter((featureName) =>
                          featureOptions[group.category].includes(featureName)
                        ).length
                      }
                      /{featureOptions[group.category].length})
                    </small>
                  </div>

                  {group.options.map((featureName) => (
                    <label className="add-feature-option" key={featureName}>
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(featureName)}
                        onChange={() => toggleSelectedFeature(featureName)}
                      />
                      <span>{featureName}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <div className="add-features-modal-actions">
              <button
                type="button"
                className="add-features-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="add-features-confirm"
                onClick={addSelectedFeatures}
                disabled={selectedFeatures.length === 0}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="delete-feature-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-feature-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-feature-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>

            <h2>Delete Feature?</h2>

            <p>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>

            <p className="delete-feature-warning">
              This action cannot be undone.
            </p>

            <div className="delete-feature-actions">
              <button
                type="button"
                className="delete-feature-keep-button"
                onClick={() => setDeleteTarget(null)}
              >
                No, Keep It
              </button>

              <button
                type="button"
                className="delete-feature-confirm-button"
                onClick={confirmDeleteFeature}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}