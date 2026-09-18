import React from "react";
import { Gift, Info, ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/featureoverview.css";

const FeatureOverview = () => {
  const navigate = useNavigate();
  const { featureId } = useParams();

  return (
    <div className="feature-overview-page">

      <button
        type="button"
        className="feature-overview-back"
        onClick={() => navigate("/features")}
      >
        <i className="bi bi-arrow-left" />
        Back to Features
      </button>

      {/* =========================
          FEATURE HEADER CARD
      ========================== */}
      <section className="feature-header-card">

        <div className="feature-header-content">
          <div className="feature-icon-box">
            <Gift size={25} strokeWidth={2.2} />
          </div>

          <div className="feature-header-text">
            <h1>Loyalty</h1>
            <p>Manage loyalty programs and rewards.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="feature-tabs">
          <button className="feature-tab active" type="button">
            Overview
          </button>

          <button
            className="feature-tab"
            type="button"
            onClick={() => navigate(`/features/${featureId}/store-types`)}
          >
            Store Types
          </button>

          <button
            className="feature-tab"
            type="button"
            onClick={() => navigate(`/features/${featureId}/permissions`)}
          >
            Feature Permissions
          </button>
        </div>

      </section>


      {/* =========================
          FEATURE INFORMATION
      ========================== */}
      <section className="feature-info-card">

        {/* Section Header */}
        <div className="feature-info-header">

          <div className="info-icon-box">
            <Info size={20} strokeWidth={2.2} />
          </div>

          <div className="feature-info-title">
            <h2>Feature Information</h2>
            <p>View the core feature details.</p>
          </div>

        </div>


        {/* =========================
            FORM CONTENT
        ========================== */}
        <div className="feature-info-form">

          {/* First Row */}
          <div className="feature-form-row feature-two-columns">

            {/* Feature Code */}
            <div className="feature-field">
              <label>Feature Code</label>

              <div className="feature-readonly-input">
                LOYALTY
              </div>
            </div>


            {/* Status */}
            <div className="feature-field">
              <label>Status</label>

              <div className="feature-status-field">

                <div className="feature-status-value">
                  <span className="feature-status-dot"></span>
                  <span>Active</span>
                </div>

                <ChevronDown
                  className="feature-status-chevron"
                  size={16}
                  strokeWidth={2}
                />

              </div>
            </div>

          </div>


          {/* Feature Name */}
          <div className="feature-field feature-full-width">
            <label>Feature Name</label>

            <div className="feature-readonly-input">
              Loyalty
            </div>
          </div>


          {/* Description */}
          <div className="feature-field feature-full-width">
            <label>Description</label>

            <div className="feature-description-box">
              Manage loyalty programs and rewards.
            </div>
          </div>

        </div>

      </section>

    </div>
  );
};

export default FeatureOverview;