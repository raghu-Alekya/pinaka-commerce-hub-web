import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Store, Search, Plus, X, Trash2 } from "lucide-react";
import { getFeature } from '../api/features';
import {
  listMappedStoreTypes,
  listAvailableStoreTypes,
  addStoreTypeToFeature,
  removeStoreTypeFromFeature,
} from '../api/featureStoreTypesApi';
import '../styles/featurestoretypes.css';
import '../styles/feature-detail-header.css';

const mapStore = (item) => {
  const s = item.storeType || item;
  return {
    id: s.id || s._id || item.storeTypeId,
    code: s.code || s.storeTypeCode || item.storeTypeCode || '',
    name: s.name || s.storeTypeName || '',
    description: s.description || '',
    mappingId: item.id || item._id,
  };
};

const FeatureStoreTypes = () => {
  const navigate = useNavigate();
  const { featureId } = useParams();
  const [feature, setFeature] = useState(null);
  const [storeTypes, setStoreTypes] = useState([]);
  const [available, setAvailable] = useState([]);
  const [search, setSearch] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [f, mapped, all] = await Promise.all([
        getFeature(featureId),
        listMappedStoreTypes(featureId),
        listAvailableStoreTypes(featureId),
      ]);
      setFeature(f);
      setStoreTypes((mapped || []).map(mapStore));
      setAvailable((all || []).map(mapStore));
    } catch (e) {
      setError(e.message || 'Unable to load store types.');
    }
  };

  useEffect(() => {
    load();
  }, [featureId]);

  const filtered = useMemo(
    () =>
      storeTypes.filter((s) =>
        [s.code, s.name, s.description]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [storeTypes, search]
  );

  const selectableStoreTypes = useMemo(() => {
    const mappedIds = new Set(storeTypes.map((s) => String(s.id)));
    return available
      .filter((s) => !mappedIds.has(String(s.id)))
      .filter((s) =>
        [s.code, s.name, s.description]
          .join(' ')
          .toLowerCase()
          .includes(modalSearch.toLowerCase())
      );
  }, [available, storeTypes, modalSearch]);

  const toggleSelected = (id) => {
    setSelected((current) =>
      current.includes(String(id))
        ? current.filter((item) => item !== String(id))
        : [...current, String(id)]
    );
  };

  const closeModal = () => {
    if (saving) return;
    setShowAddModal(false);
    setSelected([]);
    setModalSearch('');
  };

  const add = async () => {
    if (!selected.length || saving) return;
    try {
      setSaving(true);
      setError('');
      await Promise.all(
        selected.map((storeTypeId, index) =>
          addStoreTypeToFeature(featureId, {
            storeTypeId,
            defaultEnabled: true,
            required: false,
            displayOrder: storeTypes.length + index + 1,
          })
        )
      );
      closeModal();
      await load();
    } catch (e) {
      setError(e.message || 'Unable to add store type.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      setError('');
      await removeStoreTypeFromFeature(featureId, id);
      await load();
    } catch (e) {
      setError(e.message || 'Unable to remove store type.');
    }
  };

  const name = feature?.name || 'Feature';
  const desc = feature?.description || '';

  return (
    <div className="store-types-page feature-detail-page">
      <section className="feature-detail-header">
        <div className="feature-detail-top">
         <button
           type="button"
           className="feature-detail-back"
           onClick={() => navigate("/features")}
           aria-label="Back to Features"
           title="Back to Features"
>
  <i className="bi bi-arrow-left" />
</button>
          <div className="feature-detail-copy"><h1>{name}</h1><p>{desc}</p></div>
        </div>
        <nav className="feature-detail-tabs" aria-label="Feature sections">
          <button className="feature-detail-tab" type="button" onClick={() => navigate(`/features/${featureId}/overview`)}>Overview</button>
          <button className="feature-detail-tab active" type="button">Applicable Store Types</button>
          <button className="feature-detail-tab" type="button" onClick={() => navigate(`/features/${featureId}/permissions`)}>Feature &amp; Permission Access</button>
        </nav>
      </section>

      <section className="st-main-card">
        <div className="st-card-top">
          <div className="st-section-heading">
            <div className="st-store-icon"><Store size={20} /></div>
            <div>
              <h2>Applicable Store Types</h2>
              <p>Select the store types where this feature will be available.</p>
            </div>
          </div>
          <div className="st-toolbar">
            <div className="st-search">
              <Search size={17} />
              <input placeholder="Search store types..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="st-add-button" onClick={() => setShowAddModal(true)}>
              <Plus size={17} />
              <span>Add Store Type</span>
            </button>
          </div>
        </div>

        {error && <p role="alert" className="st-error">{error}</p>}

        <div className="st-table-wrapper">
          <table className="st-table">
            <thead>
              <tr>
                <th>Store Type Code</th>
                <th>Store Type Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="st-code">{s.code}</td>
                  <td className="st-name">{s.name}</td>
                  <td className="st-description">{s.description}</td>
                  <td className="st-action-cell">
                    <button className="st-delete-button" onClick={() => remove(s.id)} aria-label={`Delete ${s.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showAddModal && (
        <div className="st-modal-backdrop" role="presentation">
          <div className="st-add-modal" role="dialog" aria-modal="true" aria-labelledby="add-store-type-title">
            <div className="st-modal-header">
              <div>
                <h2 id="add-store-type-title">Add Store Type</h2>
                <p>Select the store types to make available for this feature.</p>
              </div>
              <button className="st-modal-close" onClick={closeModal} aria-label="Close" disabled={saving}>
                <X size={22} />
              </button>
            </div>

            <div className="st-modal-search">
              <Search size={19} />
              <input
                autoFocus
                placeholder="Search store types..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />
            </div>

            <div className="st-modal-options">
              {selectableStoreTypes.length ? selectableStoreTypes.map((s) => (
                <label className="st-modal-option" key={s.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(String(s.id))}
                    onChange={() => toggleSelected(s.id)}
                  />
                  <span>
                    <strong>{s.name || s.code}</strong>
                    <small>{s.code}</small>
                  </span>
                </label>
              )) : <p className="st-modal-empty">No store types available.</p>}
            </div>

            <div className="st-modal-actions">
              <button className="st-modal-cancel" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="st-modal-confirm" onClick={add} disabled={!selected.length || saving}>
                {saving ? 'Adding...' : 'Add Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureStoreTypes;
