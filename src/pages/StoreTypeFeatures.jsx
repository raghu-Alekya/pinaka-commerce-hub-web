import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const initialFeatures = [
  {
    id: 1,
    name: "KDS",
    icon: "bi-chat-square-text",
    category: "Restaurant",
    defaultEnabled: true,
    required: false,
    order: 1,
  },
  {
    id: 2,
    name: "Tables",
    icon: "bi-cup-hot",
    category: "Restaurant",
    defaultEnabled: true,
    required: false,
    order: 2,
  },
  {
    id: 3,
    name: "Tips",
    icon: "bi-key",
    category: "Restaurant",
    defaultEnabled: true,
    required: false,
    order: 3,
  },
  {
    id: 4,
    name: "Service Charges",
    icon: "bi-truck",
    category: "Restaurant",
    defaultEnabled: true,
    required: false,
    order: 4,
  },
  {
    id: 5,
    name: "Delivery",
    icon: "bi-bag-heart",
    category: "Integration",
    defaultEnabled: true,
    required: false,
    order: 5,
  },
];

const featureOptions = {
  Restaurant: ["KDS", "Tables", "Tips", "Service Charge", "Dining"],
  Integration: ["Delivery", "Online Ordering", "Payment Gateway"],
  POS: ["Fast Keys", "Customer Display", "Printer", "Cash Management"],
};

export default function StoreTypeFeatures() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();

  const [features, setFeatures] = useState(initialFeatures);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([
    "KDS",
    "Tables",
    "Tips",
    "Delivery",
  ]);

  const filteredFeatures = useMemo(() => {
    return features.filter((feature) =>
      feature.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [features, search]);

  const filteredGroups = useMemo(() => {
    const query = modalSearch.toLowerCase().trim();

    return Object.entries(featureOptions)
      .map(([category, options]) => ({
        category,
        options: options.filter((feature) =>
          feature.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [modalSearch]);

  function toggleFeature(id, field) {
    setFeatures((current) =>
      current.map((feature) =>
        feature.id === id
          ? { ...feature, [field]: !feature[field] }
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
          icon: "bi-grid",
          category: category || "Restaurant",
          defaultEnabled: true,
          required: false,
          order: features.length + index + 1,
        };
      });

    setFeatures((current) => [...current, ...additions]);
    setShowAddModal(false);
    setModalSearch("");
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
        <div>
          <h1>Restaurant <span>Active</span></h1>
          <p>
            Store type for restaurant vertical with full service and quick
            service operations.
          </p>
        </div>
      </div>

      <div className="store-type-tabs">
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

  <button type="button">
    Configuration Defaults
  </button>
</div>

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
              onClick={() => setShowAddModal(true)}
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
            <div>Default</div>
            <div>Required</div>
            <div>Order</div>
            <div>Action</div>
          </div>

          {filteredFeatures.map((feature) => (
            <div className="store-features-row" key={feature.id}>
              <div className="store-features-name">
                <span className="store-feature-icon">
                  <i className={`bi ${feature.icon}`} />
                </span>
                {feature.name}
              </div>

              <div>{feature.category}</div>

              <div>
                <button
                  type="button"
                  className={`feature-toggle ${
                    feature.defaultEnabled ? "enabled" : ""
                  }`}
                  onClick={() => toggleFeature(feature.id, "defaultEnabled")}
                  aria-label={`Toggle ${feature.name} default`}
                >
                  <span />
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className={`feature-toggle ${
                    feature.required ? "enabled" : ""
                  }`}
                  onClick={() => toggleFeature(feature.id, "required")}
                  aria-label={`Toggle ${feature.name} required`}
                >
                  <span />
                </button>
              </div>

              <div>{feature.order}</div>

              <div>
                <button type="button" className="feature-more-button">
                  <i className="bi bi-three-dots-vertical" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="store-features-count">
          Showing 1 to {filteredFeatures.length} of {features.length} entries
        </p>
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
                aria-label="Close"
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
                        selectedFeatures.filter((item) =>
                          featureOptions[group.category].includes(item)
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
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}