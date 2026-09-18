import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Gift,
  Store,
  Search,
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "../styles/featurestoretypes.css";

const initialStoreTypes = [
  {
    code: "RESTAURANT",
    name: "Restaurant",
    description: "Full-service and quick service restaurants.",
  },
  {
    code: "RETAIL",
    name: "Retail",
    description: "Retail stores and supermarkets.",
  },
  {
    code: "GROCERY",
    name: "Grocery",
    description: "Grocery and convenience stores.",
  },
  {
    code: "BOUTIQUE",
    name: "Boutique",
    description: "Boutique and fashion stores.",
  },
  {
    code: "PHARMACY",
    name: "Pharmacy",
    description: "Pharmacies and medical stores.",
  },
  {
    code: "CAFÉ",
    name: "Café",
    description: "Cafés and beverage stores.",
  },
];

const availableStoreTypes = [
  ...initialStoreTypes,
  {
    code: "CONVENIENCE",
    name: "Convenience",
    description: "Convenience stores and quick-service locations.",
  },
  {
    code: "WHOLESALE",
    name: "Wholesale",
    description: "Wholesale and bulk retail operations.",
  },
];

const FeatureStoreTypes = () => {
  const navigate = useNavigate();
  const { featureId } = useParams();
  const [storeTypes, setStoreTypes] = useState(initialStoreTypes);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedStoreTypes, setSelectedStoreTypes] = useState([]);

  const deleteStore = (index) => {
    setStoreTypes((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  const filteredAvailableStoreTypes = availableStoreTypes.filter((store) => {
    const value = modalSearch.trim().toLowerCase();
    return (
      !storeTypes.some((currentStore) => currentStore.code === store.code) &&
      (store.code.toLowerCase().includes(value) ||
        store.name.toLowerCase().includes(value) ||
        store.description.toLowerCase().includes(value))
    );
  });

  const toggleStoreTypeSelection = (code) => {
    setSelectedStoreTypes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setModalSearch("");
    setSelectedStoreTypes([]);
  };

  const addSelectedStoreTypes = () => {
    const additions = availableStoreTypes.filter((store) =>
      selectedStoreTypes.includes(store.code)
    );

    setStoreTypes((current) => [
      ...current,
      ...additions.filter(
        (store) => !current.some((currentStore) => currentStore.code === store.code)
      ),
    ]);
    closeAddModal();
  };

  const filteredStores = storeTypes.filter((store) => {
    const value = search.toLowerCase();

    return (
      store.code.toLowerCase().includes(value) ||
      store.name.toLowerCase().includes(value) ||
      store.description.toLowerCase().includes(value)
    );
  });

  return (
    <div className="store-types-page">

      {/* ================= HEADER ================= */}

      <section className="st-feature-header">
        <div className="st-feature-info">
          <div className="st-feature-icon">
            <Gift size={27} strokeWidth={2.2} />
          </div>

          <div>
            <h1>Loyalty</h1>
            <p>Manage loyalty programs and rewards.</p>
          </div>
        </div>

        <div className="st-tabs">
          <button
            className="st-tab"
            type="button"
            onClick={() => navigate(`/features/${featureId}/overview`)}
          >
            Overview
          </button>

          <button className="st-tab active" type="button">
            Store Types
          </button>

          <button
            className="st-tab"
            type="button"
            onClick={() => navigate(`/features/${featureId}/permissions`)}
          >
            Feature Permissions
          </button>
        </div>
      </section>


      {/* ================= MAIN CARD ================= */}

      <section className="st-main-card">

        {/* TOP SECTION */}

        <div className="st-card-top">

          <div className="st-section-heading">
            <div className="st-store-icon">
              <Store size={20} strokeWidth={2} />
            </div>

            <div>
              <h2>Applicable Store Types</h2>
              <p>
                Select the store types where this feature will be available.
              </p>
            </div>
          </div>


          {/* SEARCH + ADD */}

          <div className="st-toolbar">

            <div className="st-search">
              <Search size={17} strokeWidth={2} />

              <input
                type="text"
                placeholder="Search store types..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="st-add-button"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={17} strokeWidth={2} />
              <span>Add Store Type</span>
            </button>

          </div>
        </div>


        {/* ================= TABLE ================= */}

        <div className="st-table-wrapper">

          <table className="st-table">

            <thead>
              <tr>

                <th>
                  <div className="st-th-content">
                    Store Type Code
                    <ChevronDown size={13} />
                  </div>
                </th>

                <th>
                  <div className="st-th-content">
                    Store Type Name
                    <ChevronDown size={13} />
                  </div>
                </th>

                <th>
                  <div className="st-th-content">
                    Description
                    <ChevronDown size={13} />
                  </div>
                </th>

                <th className="st-actions-column">
                  <div className="st-th-content">
                    Actions
                    <ChevronDown size={13} />
                  </div>
                </th>

              </tr>
            </thead>


            <tbody>

              {filteredStores.map((store, index) => (
                <tr key={`${store.code}-${index}`}>

                  <td className="st-code">
                    {store.code}
                  </td>

                  <td className="st-name">
                    {store.name}
                  </td>

                  <td className="st-description">
                    {store.description}
                  </td>

                  {/* ACTION */}

                  <td className="st-action-cell">

                    <button
                      type="button"
                      className="st-delete-button"
                      onClick={() => deleteStore(index)}
                      aria-label={`Delete ${store.name}`}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>


        {/* ================= TABLE FOOTER ================= */}

        <div className="st-table-footer">

          <div className="st-results">
            Showing 1 to {filteredStores.length} of{" "}
            {filteredStores.length} entries
          </div>


          <div className="st-pagination">

            <button
              type="button"
              className="st-page-button st-page-arrow"
              disabled
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="st-page-button active"
            >
              1
            </button>

            <button
              type="button"
              className="st-page-button st-page-arrow"
              disabled
            >
              <ChevronRight size={16} />
            </button>

          </div>

        </div>


        {/* ================= BOTTOM ACTIONS ================= */}

        <div className="st-bottom-actions">

          <button
            type="button"
            className="st-cancel-button"
          >
            Cancel
          </button>

          <button
            type="button"
            className="st-save-button"
          >
            Save Changes
          </button>

        </div>

      </section>

      {showAddModal && (
        <div className="st-modal-backdrop" onClick={closeAddModal}>
          <section
            className="st-add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-store-type-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="st-modal-header">
              <div>
                <h2 id="add-store-type-title">Add Store Type</h2>
                <p>Select the store types to make available for this feature.</p>
              </div>
              <button
                type="button"
                className="st-modal-close"
                onClick={closeAddModal}
                aria-label="Close add store type dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="st-modal-search">
              <Search size={16} strokeWidth={2} />
              <input
                type="text"
                placeholder="Search store types..."
                value={modalSearch}
                onChange={(event) => setModalSearch(event.target.value)}
                autoFocus
              />
            </div>

            <div className="st-modal-options">
              {filteredAvailableStoreTypes.length > 0 ? (
                filteredAvailableStoreTypes.map((store) => (
                  <label className="st-modal-option" key={store.code}>
                    <input
                      type="checkbox"
                      checked={selectedStoreTypes.includes(store.code)}
                      onChange={() => toggleStoreTypeSelection(store.code)}
                    />
                    <span>
                      <strong>{store.name}</strong>
                      <small>{store.code}</small>
                    </span>
                  </label>
                ))
              ) : (
                <p className="st-modal-empty">No additional store types found.</p>
              )}
            </div>

            <div className="st-modal-actions">
              <button type="button" className="st-modal-cancel" onClick={closeAddModal}>
                Cancel
              </button>
              <button
                type="button"
                className="st-modal-confirm"
                onClick={addSelectedStoreTypes}
                disabled={selectedStoreTypes.length === 0}
              >
                Add Selected
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
};

export default FeatureStoreTypes;