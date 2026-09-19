import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeTypesApi } from "../api/storeTypes";
import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
} from "../api/plans";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  applicableStoreType: "",
  status: "Active",
  billingModel: "",
  currency: "",
  billingCycle: "",
  basePrice: "",
  includedStores: "0",
  includedTerminals: "0",
  additionalTerminalPrice: "",
  includedUsers: "0",
  additionalUserPrice: "",
  trialPeriod: "",
  effectiveFrom: "",
};

function normalizeStoreTypeFeatures(response) {
  const source =
    response?.features ??
    response?.storeTypeFeatures ??
    response?.items ??
    response?.data ??
    response;

  return (Array.isArray(source) ? source : [])
    .map((assignment, index) => {
      const feature =
        assignment?.feature ??
        assignment?.featureDetails ??
        assignment?.featureDefinition ??
        assignment;

      return {
        id: String(
          feature?.id ??
            assignment?.featureId ??
            assignment?.id ??
            `feature-${index}`
        ),
        name: String(
          feature?.name ??
            feature?.featureKey ??
            feature?.code ??
            `Feature ${index + 1}`
        ).trim(),
        description: String(
          feature?.description ??
            feature?.category ??
            "Store type feature"
        ).trim(),
        icon: feature?.icon || "bi-grid",
        active:
          assignment?.defaultEnabled !== false &&
          String(feature?.status || "ACTIVE").toUpperCase() !== "INACTIVE",
      };
    })
    .filter((feature) => feature.name && feature.active);
}

function storeTypeDisplayName(value, storeTypes) {
  const candidates =
    value && typeof value === "object"
      ? [
          value.id,
          value._id,
          value.storeTypeId,
          value.storeTypeCode,
          value.code,
          value.name,
          value.storeTypeName,
        ]
      : [value];

  const match = storeTypes.find((storeType) => {
    const identifiers = [
      storeType.id,
      storeType._id,
      storeType.storeTypeId,
      storeType.storeTypeCode,
      storeType.code,
      storeType.name,
      storeType.storeTypeName,
    ].filter(Boolean).map((item) => String(item).trim().toLowerCase());

    return candidates.some(
      (candidate) =>
        candidate !== undefined &&
        candidate !== null &&
        identifiers.includes(String(candidate).trim().toLowerCase())
    );
  });

  if (match) {
    return (
      match.name ??
      match.storeTypeName ??
      match.code ??
      match.storeTypeCode ??
      String(value ?? "")
    );
  }

  return typeof value === "object"
    ? value.name ?? value.storeTypeName ?? value.code ?? ""
    : String(value ?? "");
}

function today() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function CreatePlan() {
  const navigate = useNavigate();

  // ============================================================
  // STORE TYPE STATE
  // ============================================================
  const [storeTypes, setStoreTypes] = useState([]);
  const [storeTypesLoading, setStoreTypesLoading] = useState(false);
  const [storeTypesError, setStoreTypesError] = useState("");

  // ============================================================
  // PLAN API STATE
  // ============================================================
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);

  // ============================================================
  // FORM STATE
  // ============================================================
  const [form, setForm] = useState(emptyForm);
  const [planStep, setPlanStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [includedFeatures, setIncludedFeatures] = useState([]);
  const [storeTypeFeatures, setStoreTypeFeatures] = useState([]);
  const [storeTypeFeaturesLoading, setStoreTypeFeaturesLoading] = useState(false);
  const [storeTypeFeaturesError, setStoreTypeFeaturesError] = useState("");

  // ============================================================
  // FILTER / UI STATE
  // ============================================================
  const [search, setSearch] = useState("");
  const [billingFilter, setBillingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");

  // ============================================================
  // LOAD STORE TYPES
  // Existing Store Type API behavior is preserved.
  // ============================================================
  async function fetchStoreTypes() {
    try {
      setStoreTypesLoading(true);
      setStoreTypesError("");

      const response = await storeTypesApi.getAll();
      const normalized = Array.isArray(response?.storeTypes)
        ? response.storeTypes
        : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

      console.log("Store Types API response:", response);
      console.log("Normalized store types:", normalized);
      setStoreTypes(normalized);
    } catch (error) {
      console.error("Failed to fetch store types:", error);

      setStoreTypesError(
        error?.message || "Failed to load store types."
      );

      setStoreTypes([]);
    } finally {
      setStoreTypesLoading(false);
    }
  }

  // ============================================================
  // LOAD PLANS FROM API
  // GET /plans
  // Plans are loaded only from the API.
  // ============================================================
  async function fetchPlans() {
    try {
      setPlansLoading(true);
      setPlansError("");

      const data = await listPlans();
      const nextPlans = Array.isArray(data) ? data : [];

      console.log("Plans loaded:", nextPlans);
      setPlans(nextPlans);
    } catch (error) {
      console.error("Failed to fetch plans:", error);

      setPlansError(
        error?.message || "Failed to load plans."
      );

      // Do not use local/static plan data as a fallback.
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }

  // ============================================================
  // INITIAL DATA LOAD
  // Fixed the broken useEffect from the uploaded file.
  // ============================================================
  useEffect(() => {
    fetchStoreTypes();
    fetchPlans();
  }, []);

  useEffect(() => {
    const selectedStoreType = storeTypes.find(
      (storeType) =>
        String(
          storeType.id ?? storeType._id ?? storeType.storeTypeId ?? storeType.code
        ) === String(form.applicableStoreType) ||
        String(
          storeType.name ?? storeType.storeTypeName ?? storeType.code
        ).toLowerCase() === String(form.applicableStoreType).toLowerCase()
    );

    if (!selectedStoreType) {
      setStoreTypeFeatures([]);
      setStoreTypeFeaturesError("");
      setStoreTypeFeaturesLoading(false);
      return undefined;
    }

    let active = true;
    const storeTypeId =
      selectedStoreType.id ??
      selectedStoreType._id ??
      selectedStoreType.storeTypeId ??
      selectedStoreType.code;

    setStoreTypeFeaturesLoading(true);
    setStoreTypeFeaturesError("");

    storeTypesApi
      .getFeatures(storeTypeId)
      .then((response) => {
        if (!active) return;
        const features = normalizeStoreTypeFeatures(response);
        setStoreTypeFeatures(features);
        setIncludedFeatures((current) =>
          current.filter((name) =>
            features.some(
              (feature) => feature.name.toLowerCase() === String(name).toLowerCase()
            )
          )
        );
      })
      .catch((error) => {
        if (!active) return;
        setStoreTypeFeatures([]);
        setStoreTypeFeaturesError(
          error?.message || "Failed to load store type features."
        );
      })
      .finally(() => {
        if (active) setStoreTypeFeaturesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [form.applicableStoreType, storeTypes]);

  const textInputProps = {
    autoComplete: "off",
    spellCheck: false,
  };

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch = `${plan.code} ${plan.name} ${plan.description}`
        .toLowerCase()
        .includes(query);

      const matchesBilling =
        !billingFilter || plan.billingModel === billingFilter;

      const matchesStatus = !statusFilter || plan.status === statusFilter;

      return matchesSearch && matchesBilling && matchesStatus;
    });
  }, [plans, search, billingFilter, statusFilter]);

  const canContinueStepOne =
    form.code.trim() &&
    form.name.trim() &&
    form.applicableStoreType;

  const canContinuePricing =
    form.billingModel &&
    form.currency &&
    form.billingCycle &&
    form.basePrice !== "";

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  }

  function toggleIncludedFeature(featureName) {
    setIncludedFeatures((current) =>
      current.includes(featureName)
        ? current.filter((item) => item !== featureName)
        : [...current, featureName]
    );
  }

  function resetCreationForm() {
    setForm(emptyForm);
    setPlanStep(1);
    setEditingId(null);
    setIncludedFeatures([]);
  }

  function resetFilters() {
    setSearch("");
    setBillingFilter("");
    setStatusFilter("");
  }

  // ============================================================
  // CREATE / UPDATE PLAN
  // POST /plans for create
  // PUT /plans/:id for update
  // ============================================================
  async function createOrUpdatePlan() {
    const planData = {
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
    };

    try {
      setSavingPlan(true);
      setMessage("");

      let savedPlan;

      if (editingId) {
        savedPlan = await updatePlan(
          editingId,
          planData,
          includedFeatures
        );
        setMessage("Plan updated successfully.");
      } else {
        savedPlan = await createPlan(
          planData,
          includedFeatures
        );
        setMessage("Plan created successfully.");
      }

      console.log("Plan saved result:", savedPlan);

      const refreshedPlans = await listPlans();
      const parsedPlans = Array.isArray(refreshedPlans) ? refreshedPlans : [];

      console.log("Plans after save:", parsedPlans);
      setPlans(parsedPlans);

      resetCreationForm();
    } catch (error) {
      console.error("Failed to save plan:", error);

      setMessage(
        error?.message || "Failed to save plan."
      );
    } finally {
      setSavingPlan(false);
    }
  }

  // ============================================================
  // EDIT PLAN
  // Loads all API-backed fields into the existing form.
  // ============================================================
  function editPlan(plan) {
    setEditingId(plan.id);

    setForm({
      ...emptyForm,
      code: plan.code || "",
      name: plan.name || "",
      description: plan.description || "",
      applicableStoreType:
        storeTypeDisplayName(
          plan.applicableStoreType || plan.storeType || "",
          storeTypes
        ),
      billingModel: plan.billingModel || "",
      currency: plan.currency || "",
      billingCycle: plan.billingCycle || plan.cycle || "",
      basePrice: String(plan.basePrice ?? plan.price ?? ""),
      includedStores: String(plan.includedStores ?? 0),
      includedTerminals: String(plan.includedTerminals ?? 0),
      additionalTerminalPrice: String(
        plan.additionalTerminalPrice ?? ""
      ),
      includedUsers: String(plan.includedUsers ?? 0),
      additionalUserPrice: String(
        plan.additionalUserPrice ?? ""
      ),
      trialPeriod: plan.trialPeriod || "",
      effectiveFrom: plan.effectiveFrom
        ? String(plan.effectiveFrom).slice(0, 10)
        : "",
      status: plan.status || "Active",
    });

    setIncludedFeatures(
      Array.isArray(plan.includedFeatures)
        ? plan.includedFeatures.map((feature) =>
            typeof feature === "string" ? feature : feature.name
          )
        : []
    );

    setPlanStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ============================================================
  // DELETE PLAN
  // DELETE /plans/:id
  // ============================================================
  async function confirmDelete() {
    if (!deleteTarget?.id || deletingPlan) {
      return;
    }

    try {
      setDeletingPlan(true);
      setMessage("");

      await deletePlan(deleteTarget.id);

      const refreshedPlans = await listPlans();
      const parsedPlans = Array.isArray(refreshedPlans) ? refreshedPlans : [];

      console.log("Plans after delete:", parsedPlans);
      setPlans(parsedPlans);

      setMessage(
        `${deleteTarget.name} deleted successfully.`
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete plan:", error);

      setMessage(
        error?.message || "Failed to delete plan."
      );
    } finally {
      setDeletingPlan(false);
    }
  }

  return (
    <section className="plans-page">
      <div className="plans-page-heading">
        <h1>{editingId ? "Edit Plan" : "Create Plan"}</h1>
        <p>
          Create a commercial package. Entitlements and limits are configured
          after saving.
        </p>
      </div>

      <div className="plan-stepper">
        {[
          ["Plan Information", 1],
          ["Pricing", 2],
          ["Features and Limits", 3],
          ["Review and Create", 4],
        ].map(([label, step], index) => (
          <div className="plan-stepper-item" key={step}>
            <button
              type="button"
              className={`plan-step ${planStep === step ? "active" : ""} ${
                planStep > step ? "complete" : ""
              }`}
              onClick={() => {
                if (step < planStep) setPlanStep(step);
              }}
            >
              <span>{step}</span>
              <strong>{label}</strong>
            </button>

            {index < 3 && <div className="plan-step-line" />}
          </div>
        ))}
      </div>

      {planStep === 1 && (
        <section className="plan-form-card">
          <div className="plan-card-heading">
            <div className="plan-heading-icon">
              <i className="bi bi-file-earmark-text" />
            </div>

            <div>
              <h2>Plan Information</h2>
              <p>Provide the basic details for the subscription plan.</p>
            </div>
          </div>

          <div className="plan-create-grid">
            <label className="plan-field">
              <span>
                Plan Code <b>*</b>
              </span>

              <div className="plan-input-wrap">
                <i className="bi bi-tag" />
                <input
                  {...textInputProps}
                  name="code"
                  value={form.code}
                  onChange={updateField}
                  placeholder="e.g. BASIC"
                />
              </div>
            </label>

            <label className="plan-field">
              <span>
                Plan Name <b>*</b>
              </span>

              <div className="plan-input-wrap">
                <i className="bi bi-type" />
                <input
                  {...textInputProps}
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Basic Plan"
                />
              </div>
            </label>
          </div>

          <label className="plan-field plan-description-field">
            <span>
              Description
            </span>

            <div className="plan-textarea-wrap">
              <i className="bi bi-file-earmark-text" />
              <textarea
                {...textInputProps}
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Describe the plan, its features and target audience..."
              />
            </div>
          </label>

          <div className="plan-create-grid plan-bottom-grid">
            <label className="plan-field">
              <span>
                Applicable Business/Store Type <b>*</b>
              </span>

        <select
  name="applicableStoreType"
  value={form.applicableStoreType}
  onChange={updateField}
  disabled={storeTypesLoading}
>
  <option value="">
    {storeTypesLoading
      ? "Loading store types..."
      : "Select store type"}
  </option>

  {storeTypes.map((storeType) => (
    <option
      key={storeType.id ?? storeType._id ?? storeType.code}
      value={
        storeType.name ??
        storeType.storeTypeName ??
        storeType.code
      }
    >
      {storeType.name ??
        storeType.storeTypeName ??
        storeType.code}
    </option>
  ))}
</select>

{storeTypesError && (
  <small className="plan-field-error">
    {storeTypesError}
  </small>
)}
            </label>

            <label className="plan-field">
              <span>
                Status <b>*</b>
              </span>

              <select
                autoComplete="off"
                name="status"
                value={form.status}
                onChange={updateField}
                className="plan-status-select"
              >
                <option value="Active">● Active</option>
                <option value="Inactive">● Inactive</option>
              </select>
            </label>
          </div>

          <div className="plan-actions">
            <button
              type="button"
              className="plan-cancel-button"
              onClick={resetCreationForm}
            >
              Cancel
            </button>

            <button
              type="button"
              className="plan-submit-button"
              disabled={!canContinueStepOne}
              onClick={() => setPlanStep(2)}
            >
              Save and Continue
            </button>
          </div>
        </section>
      )}

      {planStep === 2 && (
        <section className="plan-form-card">
          <div className="plan-card-heading">
            <div className="plan-heading-icon">
              <i className="bi bi-currency-rupee" />
            </div>

            <div>
              <h2>Pricing</h2>
              <p>Configure pricing, included resources, and trial period.</p>
            </div>
          </div>

          <div className="plan-pricing-grid two-columns">
            <label className="plan-field">
              <span>Billing Model <b>*</b></span>
              <select
                autoComplete="off"
                name="billingModel"
                value={form.billingModel}
                onChange={updateField}
              >
                <option value="">Select billing model</option>
                <option value="Per store">Per Store</option>
                <option value="Per terminal">Per Terminal</option>
                <option value="Flat rate">Flat Rate</option>
              </select>
            </label>

            <label className="plan-field">
              <span>Currency <b>*</b></span>
              <select
                autoComplete="off"
                name="currency"
                value={form.currency}
                onChange={updateField}
              >
                <option value="">Select currency</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="INR">Indian Rupee (INR)</option>
                <option value="AED">UAE Dirham (AED)</option>
              </select>
            </label>

            <label className="plan-field">
              <span>Billing Cycle <b>*</b></span>
              <select
                autoComplete="off"
                name="billingCycle"
                value={form.billingCycle}
                onChange={updateField}
              >
                <option value="">Select billing cycle</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </label>

            <label className="plan-field">
              <span>Base Price <b>*</b></span>
              <div className="plan-price-input">
                <input
                  {...textInputProps}
                  name="basePrice"
                  type="number"
                  min="0"
                  value={form.basePrice}
                  onChange={updateField}
                  placeholder="0.00"
                />
                <span>{form.currency || "Currency"}</span>
              </div>
            </label>
          </div>

          <div className="plan-pricing-grid three-columns">
            <label className="plan-field">
              <span>Included Stores <b>*</b></span>
              <input
                {...textInputProps}
                name="includedStores"
                type="number"
                min="0"
                value={form.includedStores}
                onChange={updateField}
              />
            </label>

            <label className="plan-field">
              <span>Included Terminals <b>*</b></span>
              <input
                {...textInputProps}
                name="includedTerminals"
                type="number"
                min="0"
                value={form.includedTerminals}
                onChange={updateField}
              />
            </label>

            <label className="plan-field">
              <span>Additional Terminal Price</span>
              <div className="plan-price-input">
                <input
                  {...textInputProps}
                  name="additionalTerminalPrice"
                  type="number"
                  min="0"
                  value={form.additionalTerminalPrice}
                  onChange={updateField}
                  placeholder="0.00"
                />
                <span>{form.currency || "Currency"}</span>
              </div>
            </label>
          </div>

          <div className="plan-pricing-grid two-columns">
            <label className="plan-field">
              <span>Included Users/Employees <b>*</b></span>
              <input
                {...textInputProps}
                name="includedUsers"
                type="number"
                min="0"
                value={form.includedUsers}
                onChange={updateField}
              />
            </label>

            <label className="plan-field">
              <span>Additional User Price</span>
              <div className="plan-price-input">
                <input
                  {...textInputProps}
                  name="additionalUserPrice"
                  type="number"
                  min="0"
                  value={form.additionalUserPrice}
                  onChange={updateField}
                  placeholder="0.00"
                />
                <span>{form.currency || "Currency"}</span>
              </div>
            </label>

            <label className="plan-field">
              <span>Trial Period</span>
              <select
                autoComplete="off"
                name="trialPeriod"
                value={form.trialPeriod}
                onChange={updateField}
              >
                <option value="">Select trial period</option>
                <option value="No trial">No Trial</option>
                <option value="7 days">7 Days</option>
                <option value="14 days">14 Days</option>
                <option value="30 days">30 Days</option>
              </select>
            </label>

            <label className="plan-field">
              <span>Effective From</span>
              <input
                {...textInputProps}
                name="effectiveFrom"
                type="date"
                value={form.effectiveFrom}
                onChange={updateField}
              />
            </label>
          </div>

          <div className="plan-actions">
            <button
              type="button"
              className="plan-cancel-button"
              onClick={() => setPlanStep(1)}
            >
              Back
            </button>

            <button
              type="button"
              className="plan-submit-button"
              disabled={!canContinuePricing}
              onClick={() => setPlanStep(3)}
            >
              Save and Continue
            </button>
          </div>
        </section>
      )}

      {planStep === 3 && (
        <section className="plan-form-card">
          <div className="plan-card-heading">
            <div className="plan-heading-icon">
              <i className="bi bi-boxes" />
            </div>

            <div>
              <h2>Features</h2>
              <p>Select the features included in this plan.</p>
            </div>
          </div>

          <div className="plan-features-limits-grid">
            <section className="plan-feature-panel">
              <h3>Included Features <b>*</b></h3>

              {storeTypeFeaturesLoading && (
                <p className="plan-review-empty">Loading features for the selected store type...</p>
              )}

              {storeTypeFeaturesError && (
                <p className="plan-field-error">{storeTypeFeaturesError}</p>
              )}

              {!storeTypeFeaturesLoading && !storeTypeFeaturesError && !form.applicableStoreType && (
                <p className="plan-review-empty">Select a store type to view its features.</p>
              )}

              {!storeTypeFeaturesLoading && !storeTypeFeaturesError && form.applicableStoreType && storeTypeFeatures.length === 0 && (
                <p className="plan-review-empty">No active features are assigned to this store type.</p>
              )}

              {!storeTypeFeaturesLoading && storeTypeFeatures.map(({ name, description, icon }) => (
                <label className="plan-feature-check" key={name}>
                  <input
                    type="checkbox"
                    checked={includedFeatures.includes(name)}
                    onChange={() => toggleIncludedFeature(name)}
                  />

                  <span className="plan-feature-icon">
                    <i className={`bi ${icon}`} />
                  </span>

                  <span>
                    <strong>{name}</strong>
                    <small>{description || "Store type feature"}</small>
                  </span>
                </label>
              ))}

              <div className="plan-feature-summary">
                <span className="plan-feature-summary-label">Selected Features</span>
                <div className="plan-review-feature-list">
                  {includedFeatures.length > 0 ? (
                    includedFeatures.map((feature) => (
                      <span className="plan-review-feature-pill" key={feature}>
                        {feature}
                      </span>
                    ))
                  ) : (
                    <span className="plan-review-empty">No features selected</span>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="plan-actions">
            <button
              type="button"
              className="plan-cancel-button"
              onClick={() => setPlanStep(2)}
            >
              Back
            </button>

            <button
              type="button"
              className="plan-submit-button"
              disabled={includedFeatures.length === 0}
              onClick={() => setPlanStep(4)}
            >
              Save and Continue
            </button>
          </div>
        </section>
      )}

      {planStep === 4 && (
        <section className="plan-form-card plan-review-card">
          <div className="plan-card-heading">
            <div className="plan-heading-icon">
              <i className="bi bi-check2-circle" />
            </div>

            <div>
              <h2>Review and Create</h2>
              <p>Please review the details before creating the plan.</p>
            </div>
          </div>

          <div className="plan-review-grid">
            <section className="plan-review-section">
              <h3>
                <i className="bi bi-file-earmark-text" />
                Plan Information
              </h3>

              <dl>
                <div><dt>Plan Code</dt><dd>{form.code}</dd></div>
                <div><dt>Plan Name</dt><dd>{form.name}</dd></div>
                <div><dt>Description</dt><dd>{form.description}</dd></div>
                <div><dt>Business/Store Type</dt><dd>{form.applicableStoreType}</dd></div>
                <div>
                  <dt>Status</dt>
                  <dd className="plan-review-active">
                    <i className="bi bi-circle-fill" />
                    {form.status}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="plan-review-section">
              <h3>
                <i className="bi bi-currency-rupee" />
                Pricing
              </h3>

              <dl className="two-column-list">
                <div><dt>Billing Model</dt><dd>{form.billingModel}</dd></div>
                <div><dt>Currency</dt><dd>{form.currency}</dd></div>
                <div><dt>Billing Cycle</dt><dd>{form.billingCycle}</dd></div>
                <div><dt>Base Price</dt><dd>{form.currency} {form.basePrice}</dd></div>
                <div><dt>Included Stores</dt><dd>{form.includedStores}</dd></div>
                <div><dt>Included Terminals</dt><dd>{form.includedTerminals}</dd></div>
                <div><dt>Additional Terminal Price</dt><dd>{form.currency} {form.additionalTerminalPrice}</dd></div>
                <div><dt>Included Users</dt><dd>{form.includedUsers}</dd></div>
                <div><dt>Additional User Price</dt><dd>{form.currency} {form.additionalUserPrice}</dd></div>
                <div><dt>Trial Period</dt><dd>{form.trialPeriod}</dd></div>
                <div><dt>Effective From</dt><dd>{form.effectiveFrom}</dd></div>
              </dl>
            </section>

            <section className="plan-review-section">
              <h3>
                <i className="bi bi-boxes" />
                Features
              </h3>

              <dl>
                <div>
                  <dt>Included Features</dt>
                  <dd className="plan-review-feature-container">
                    <div className="plan-review-feature-list">
                      {includedFeatures.length > 0 ? (
                        includedFeatures.map((feature) => (
                          <span className="plan-review-feature-pill" key={feature}>
                            {feature}
                          </span>
                        ))
                      ) : (
                        <span className="plan-review-empty">None</span>
                      )}
                    </div>
                  </dd>
                </div>
              </dl>
            </section>

            <aside className="plan-review-note">
              <i className="bi bi-info-circle-fill" />
              Once created, the plan will be available for assignment to
              merchants and stores.
            </aside>
          </div>

          <div className="plan-actions">
            <button
              type="button"
              className="plan-cancel-button"
              onClick={() => setPlanStep(3)}
            >
              Back
            </button>

            <button
              type="button"
              className="plan-submit-button"
              disabled={savingPlan}
              onClick={createOrUpdatePlan}
            >
              {savingPlan
                ? editingId
                  ? "Updating..."
                  : "Creating..."
                : editingId
                  ? "Update Plan"
                  : "Create Plan"}
            </button>
          </div>
        </section>
      )}

      <section className="plans-list-card">
        <div className="plans-list-header">
          <div>
            <h2>Plans List</h2>
            {plansLoading && (
              <small>Loading plans...</small>
            )}
            {plansError && (
              <small className="plan-field-error">
                {plansError}
              </small>
            )}
          </div>

          <div className="plans-filters">
            <label className="plan-search">
              <i className="bi bi-search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search plans..."
              />
            </label>

            <select
              value={billingFilter}
              onChange={(event) => setBillingFilter(event.target.value)}
            >
              <option value="">All Billing Models</option>
              <option value="Per store">Per Store</option>
              <option value="Per terminal">Per Terminal</option>
              <option value="Flat rate">Flat Rate</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              type="button"
              className="plan-reset-button"
              onClick={resetFilters}
            >
              <i className="bi bi-arrow-counterclockwise" />
              Reset
            </button>
          </div>
        </div>

        <div className="plans-table-wrap">
          <div className="plans-table">
            <div className="plans-row plans-row-head">
              <div>Plan Code</div>
              <div>Name / Description</div>
              <div>Applicable Type</div>
              <div>Billing Model</div>
              <div>Price</div>
              <div>Status</div>
              <div>Created / Updated</div>
              <div>Actions</div>
            </div>

            {filteredPlans.map((plan) => (
              <div className="plans-row" key={plan.id}>
                <div className="plan-code-cell">
                  <strong>{plan.code}</strong>
                </div>

                <button type="button"
                 className="plan-name-cell plan-name-clickable"
                 onClick={() =>
                    navigate(`/plans/${plan.id}`, {
                      state: { plan },
                    })
                  } >
                 <strong>{plan.name}</strong>
                 <span>{plan.description}</span>
               </button>
                <div>
                  <span className="plan-type-badge">{plan.storeType}</span>
                </div>

                <div>{plan.billingModel}</div>

                <div className="plan-price-cell">
                  {plan.currency} {plan.price}
                  <small>/{plan.cycle.toLowerCase()}</small>
                </div>

                <div>
                  <span
                    className={`plan-status ${
                      plan.status === "Inactive" ? "inactive" : ""
                    }`}
                  >
                    <i className="bi bi-circle-fill" />
                    {plan.status}
                  </span>
                </div>

                <div>
                  <div>{plan.createdOn}</div>
                  {plan.updatedOn && plan.updatedOn !== plan.createdOn && (
                    <small>{plan.updatedOn}</small>
                  )}
                </div>

                <div className="plan-table-actions">
                  <button
                    type="button"
                    title="Edit plan"
                    onClick={() => editPlan(plan)}
                  >
                    <i className="bi bi-pencil" />
                  </button>

                  <button
                    type="button"
                    className="plan-delete-icon"
                    title="Delete plan"
                    onClick={() => setDeleteTarget(plan)}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="plans-pagination">
          <span>
            Showing 1 to {filteredPlans.length} of {plans.length} entries
          </span>

          <div>
            <button type="button" aria-label="Previous page">
              <i className="bi bi-chevron-left" />
            </button>
            <button type="button" className="active">1</button>
            <button type="button" aria-label="Next page">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {deleteTarget && (
        <div
          className="delete-plan-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-plan-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-plan-icon">
              <i className="bi bi-trash3" />
            </div>

            <h2>Delete Plan?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>? This action cannot be
              undone.
            </p>

            <div className="delete-plan-actions">
              <button
                type="button"
                className="delete-plan-keep-button"
                onClick={() => setDeleteTarget(null)}
              >
                No, Keep It
              </button>

              <button
                type="button"
                className="delete-plan-confirm-button"
                disabled={deletingPlan}
                onClick={confirmDelete}
              >
                {deletingPlan ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="plan-toast">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </section>
  );
}
//