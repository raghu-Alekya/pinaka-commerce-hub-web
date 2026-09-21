import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listFeatures } from "../api/features";
import { storeTypesApi } from "../api/storeTypes";

const initialStoreType = {
  name: "Store Type",
  description: "Manage the features assigned to this store type.",
  status: "ACTIVE",
};

// const featureOptions = {
//   Restaurant: ["KDS", "Tables", "Tips", "Service Charges", "Dining"],
//   Integration: ["Delivery", "Online Ordering", "Payment Gateway"],
//   POS: ["Fast Keys", "Customer Display", "Printer", "Cash Management"],
// };

function getFeatureAssignments(response) {
  if (Array.isArray(response)) return response;

  const containers = [response, response?.data, response?.result];

  for (const container of containers) {
    if (!container || typeof container !== "object") continue;

    const assignments =
      container.features ??
      container.storeTypeFeatures ??
      container.items ??
      container.results;

    if (Array.isArray(assignments)) return assignments;
  }

  return [];
}

function toFeatureRow(assignment, index) {
  const feature =
    assignment.feature ??
    assignment.featureDetails ??
    assignment.featureDefinition ??
    assignment;
  const assignmentData = assignment.data ?? assignment.storeTypeFeature ?? {};

  return {
    id: feature.id ?? assignment.featureId ?? assignment.id,
    storeTypeFeatureId:
      assignment.featureId ??
      feature.id ??
      assignment.id ??
      assignment.storeTypeFeatureId ??
      assignment.featureAssignmentId ??
      assignmentData.id ??
      assignmentData.storeTypeFeatureId ??
      assignmentData.featureId,
    name: feature.name ?? feature.featureKey ?? "Unnamed feature",
    category: feature.category ?? "Uncategorized",
    active: assignment.defaultEnabled ?? true,
    order: assignment.displayOrder ?? index + 1,
  };
}

export default function StoreTypeFeatures() {
  const navigate = useNavigate();
  const { storeTypeId } = useParams();

  const [storeType, setStoreType] = useState(initialStoreType);
  const [features, setFeatures] = useState([]);
  const [featureCatalog, setFeatureCatalog] = useState([]);
  const [search, setSearch] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    storeTypesApi
      .getOne(storeTypeId)
      .then((response) => {
        const item = response?.storeType ?? response?.data ?? response;

        if (!item || typeof item !== "object" || cancelled) return;

        setStoreType({
          name: item.name ?? initialStoreType.name,
          description: item.description ?? initialStoreType.description,
          status: item.status ?? initialStoreType.status,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [storeTypeId]);

  useEffect(() => {
    let cancelled = false;

    storeTypesApi
      .getFeatures(storeTypeId)
      .then((response) => {
        const assignments = getFeatureAssignments(response);

        if (cancelled) return;

        setFeatures(assignments.map(toFeatureRow));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [storeTypeId]);

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();

    return features.filter((feature) =>
      feature.name.toLowerCase().includes(query)
    );
  }, [features, search]);

  const featureGroups = useMemo(() => {
    return featureCatalog.reduce((groups, feature) => {
      const category = feature.category || "Uncategorized";
      const group = groups.find((item) => item.category === category);

      if (group) group.options.push(feature);
      else groups.push({ category, options: [feature] });

      return groups;
    }, []);
  }, [featureCatalog]);

  const filteredGroups = useMemo(() => {
    const query = modalSearch.trim().toLowerCase();

    return featureGroups
      .map((group) => ({
        ...group,
        options: group.options.filter((feature) =>
          feature.name.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [featureGroups, modalSearch]);

  const selectedFeatureDetails = useMemo(
    () =>
      featureCatalog.filter((feature) => selectedFeatures.includes(feature.id)),
    [featureCatalog, selectedFeatures]
  );

  const addFeatureModalStyle = {
    maxHeight: `${Math.min(78, 40 + selectedFeatures.length * 4 + filteredGroups.length * 5)}vh`,
  };

  function toggleFeature(id) {
    setFeatures((current) =>
      current.map((feature) =>
        feature.id === id
          ? { ...feature, active: !feature.active }
          : feature
      )
    );
  }

  function toggleSelectedFeature(feature) {
    if (!feature.id) return;

    setSelectedFeatures((current) =>
      current.includes(feature.id)
        ? current.filter((item) => item !== feature.id)
        : [...current, feature.id]
    );
  }

  function openAddModal() {
    setSelectedFeatures([]);
    setModalSearch("");
    setShowAddModal(true);
    setLoadingCatalog(true);
    setError("");

    listFeatures()
      .then((items) => {
        setFeatureCatalog(items.filter((item) => item?.id));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoadingCatalog(false);
      });
  }

  async function addSelectedFeatures() {
    const selected = featureCatalog.filter((feature) =>
      selectedFeatures.includes(feature.id)
    );

    if (!storeTypeId || selected.length === 0) return;

    const existingNames = features.map((feature) => feature.name);
    setSaving(true);
    setError("");

    try {
      const createdFeatures = await Promise.all(
        selected.map((feature, index) =>
          storeTypesApi
            .createFeature(storeTypeId, {
            featureId: feature.id,
            defaultEnabled: true,
            required: false,
            displayOrder: features.length + index + 1,
            configurationJson: {
              showInPos: true,
            },
            })
        )
      );

      const refreshed = await storeTypesApi.getFeatures(storeTypeId);
      const persistedAssignments = getFeatureAssignments(refreshed);

      if (persistedAssignments.length > 0) {
        setFeatures(persistedAssignments.map(toFeatureRow));
      } else {
        const additions = selected.map((feature, index) => ({
          id: feature.id,
          storeTypeFeatureId:
            createdFeatures[index]?.featureId ||
            createdFeatures[index]?.feature?.id ||
            createdFeatures[index]?.feature?.featureId ||
            createdFeatures[index]?.data?.id ||
            createdFeatures[index]?.storeTypeFeature?.id ||
            createdFeatures[index]?.data?.storeTypeFeature?.id,
          name: feature.name,
          category: feature.category || "Uncategorized",
          active: true,
          order: features.length + index + 1,
        }));

        setFeatures((current) => [
          ...current,
          ...additions.filter((feature) => !existingNames.includes(feature.name)),
        ]);
      }
      setShowAddModal(false);
      setSelectedFeatures([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteFeature() {
    if (!deleteTarget) return;

    const featureId =
      deleteTarget.storeTypeFeatureId ??
      (typeof deleteTarget.id === "string" ? deleteTarget.id : null);

    if (!storeTypeId || !featureId) {
      setError("This feature is missing its store-type assignment ID.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await storeTypesApi.removeFeature(storeTypeId, featureId);
      setFeatures((current) =>
        current.filter((feature) => feature.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="store-features-page">
     {error && <p role="alert">{error}</p>}
     <div className="store-features-top">
  <button
    type="button"
    className="store-features-back"
    onClick={() => navigate("/store-types/new")}
    aria-label="Back to Store Types"
    title="Back to Store Types"
  >
    <i className="bi bi-arrow-left" />
  </button>

  <div className="store-features-title">
    <div className="store-type-title-line">
      <h1>{storeType.name}</h1>

      <span
        className={`store-type-active-badge ${
          storeType.status === "INACTIVE" ? "inactive" : ""
        }`}
      >
        <i className="bi bi-circle-fill" />
        {storeType.status === "INACTIVE" ? "Inactive" : "Active"}
      </span>
    </div>

    <p>{storeType.description}</p>
  </div>
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
            style={addFeatureModalStyle}
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
              {loadingCatalog ? (
                <p>Loading features...</p>
              ) : error ? (
                <p role="alert">{error}</p>
              ) : filteredGroups.length === 0 ? (
                <p>No features available.</p>
              ) : (
                filteredGroups.map((group) => (
                  <div className="add-features-group" key={group.category}>
                    <div className="add-features-group-title">
                      <span>
                        <i className="bi bi-chevron-down" />
                        {group.category}
                      </span>

                      <small>
                        (
                        {
                          group.options.filter((feature) =>
                            selectedFeatures.includes(feature.id)
                          ).length
                        }
                        /{group.options.length})
                      </small>
                    </div>

                    {group.options.map((feature) => (
                      <label className="add-feature-option" key={feature.id || feature.name}>
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature.id)}
                          onChange={() => toggleSelectedFeature(feature)}
                          disabled={saving}
                        />
                        <span>{feature.name}</span>
                      </label>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="add-features-preview">
              <div className="add-features-preview-header">
                <span>Selected Features</span>
                <strong>{selectedFeatures.length}</strong>
              </div>

              <div className="add-features-preview-list">
                {selectedFeatureDetails.length > 0 ? (
                  selectedFeatureDetails.map((feature) => (
                    <span className="add-features-preview-pill" key={feature.id}>
                      {feature.name}
                    </span>
                  ))
                ) : (
                  <span className="add-features-preview-empty">
                    No features selected yet
                  </span>
                )}
              </div>
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
                disabled={selectedFeatures.length === 0 || saving}
              >
                {saving ? "Adding..." : "Add Selected"}
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

            {error && <p role="alert">{error}</p>}

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
                disabled={saving}
              >
                {saving ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}