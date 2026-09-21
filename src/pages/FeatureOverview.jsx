import React, { useEffect, useState } from 'react';
import { Gift, Info, ChevronDown, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFeature } from '../api/features';
import '../styles/featureoverview.css';

const FeatureOverview = () => {
  const navigate = useNavigate();
  const { featureId } = useParams();
  const [feature, setFeature] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getFeature(featureId).then((data) => active && setFeature(data)).catch((err) => active && setError(err.message || 'Unable to load feature.'));
    return () => { active = false; };
  }, [featureId]);

  const name = feature?.name || 'Feature';
  const description = feature?.description || '—';
  const code = feature?.code || feature?.featureKey || '—';
  const status = feature?.status || 'Inactive';

  return <div className="feature-overview-page">
    <button className="feature-overview-back" type="button" onClick={() => navigate('/features')}>
      <ArrowLeft size={16} />
      Back to Features
    </button>
    <section className="feature-header-card">
      <div className="feature-header-content"><div className="feature-icon-box"><Gift size={25} strokeWidth={2.2} /></div><div className="feature-header-text"><h1>{name}</h1><p>{description}</p></div></div>
      <div className="feature-tabs"><button className="feature-tab active" type="button">Overview</button><button className="feature-tab" type="button" onClick={() => navigate(`/features/${featureId}/store-types`)}>Store Types</button><button className="feature-tab" type="button" onClick={() => navigate(`/features/${featureId}/permissions`)}>Feature Permissions</button></div>
    </section>
    <section className="feature-info-card">
      <div className="feature-info-header"><div className="info-icon-box"><Info size={20} strokeWidth={2.2} /></div><div className="feature-info-title"><h2>Feature Information</h2><p>View the core feature details.</p></div></div>
      {error && <p role="alert">{error}</p>}
      <div className="feature-info-form"><div className="feature-form-row feature-two-columns"><div className="feature-field"><label>Feature Code</label><div className="feature-readonly-input">{code}</div></div><div className="feature-field"><label>Status</label><div className="feature-status-field"><div className="feature-status-value"><span className="feature-status-dot" /><span>{status}</span></div><ChevronDown className="feature-status-chevron" size={16} strokeWidth={2} /></div></div></div><div className="feature-field feature-full-width"><label>Feature Name</label><div className="feature-readonly-input">{name}</div></div><div className="feature-field feature-full-width"><label>Description</label><div className="feature-description-box">{description}</div></div></div>
    </section>
  </div>;
};
export default FeatureOverview;
