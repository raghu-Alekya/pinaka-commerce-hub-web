import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMerchant, updateMerchant } from "../api/merchants";
import { ApiError } from "../api/http";
import { merchants } from "../data/data";

const steps = [
  ["Merchant Details", "Basic information"],
  ["Store Details", "Store information"],
  ["Plan & Subscription", "Choose your plan"],
  ["Review & Confirm", "Verify details"],
];

const makeMerchantId = () => {
  const lastId = Number(localStorage.getItem("lastMerchantId")) || 4000;
  const nextId = lastId + 1;

  localStorage.setItem("lastMerchantId", nextId);

  return `MER-${nextId}`;
};

const makeStoreId = () => {
  const lastId = Number(localStorage.getItem("lastStoreId")) || 50000;
  const nextId = lastId + 1;

  localStorage.setItem("lastStoreId", nextId);

  return `STR-${nextId}`;
};

const createEmptyStore = () => ({
  name: "",
  id: makeStoreId(),
  type: "",
  retailType: "",
  phone: "",
  url: "",
  currency: "",
  status: "",
  address: "",
  timezone: "",
  city: "",
  state: "",
  zip: "",
});

export default function AddMerchant() {
  const nav = useNavigate();
  const { merchantId } = useParams();
  const existing = useMemo(
    () => merchants.find((merchant) => merchant.id === merchantId),
    [merchantId]
  );

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState(() => ({
    businessName: existing?.name || "",
    legalBusinessName: existing?.name || "",
    merchantId: existing?.id || makeMerchantId(),
    retailType: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    businessAddress: "",
    taxId: "",
    firstName: "",
    lastName: "",
    email: existing?.email || "",
    phone: existing?.phone || "",
    jobTitle: "",
    alternatePhone: "",
    billingContact: true,
    stores: [createEmptyStore()],
    plan: existing?.plan || "Professional",
    billingCycle: "Monthly",
    trialPeriod: "14",
  }));

  const setField = (key, value) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const setStoreField = (index, key, value) => {
    setData((current) => ({
      ...current,
      stores: current.stores.map((store, i) =>
        i === index
          ? { ...store, [key]: value}
          : store
      ),
    }));
  };
const addStore = () => {
  setData((current) => ({
    ...current,
    stores: [
      ...current.stores,
      createEmptyStore(),
    ],
  }));
};

const removeStore = (index) => {
  setData((current) => ({
    ...current,
    stores: current.stores.filter((_, i) => i !== index),
  }));
};
  const validateStep = (targetStep = step) => {
    if (targetStep === 1) {
      const required = {
        businessName: "Business Name",
        legalBusinessName: "Legal Business Name",
        country: "Country",
        state: "State / Province",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email Address",
        phone: "Phone Number",
      };

      for (const [key, label] of Object.entries(required)) {
        if (!String(data[key] || "").trim()) {
          alert(`Please enter ${label}.`);
          return false;
        }
      }
    }

    if (targetStep === 2) {
      const store = data.stores[0];

      if (
        !store.name.trim() ||
        !store.id.trim() ||
        !store.url.trim() ||
        !store.address.trim() ||
        !store.city.trim() ||
        !store.state.trim() ||
        !store.zip.trim()
      ) {
        alert("Please complete the required store details.");
        return false;
      }
    }

    if (targetStep === 3 && !data.plan) {
      alert("Please select a subscription plan.");
      return false;
    }

    return true;
  };

  const goToStep = (targetStep) => {
    if (targetStep > step && !validateStep(step)) return;
    setStep(targetStep);
  };

const handleSubmit = async (event) => {
  event.preventDefault();

  // IMPORTANT:
  // Do not save anything until the user reaches Review & Confirm.
  if (step !== 4) {
    return;
  }

  // Validate all required data before final save
  if (!validateStep(1)) {
    setStep(1);
    return;
  }

  if (!validateStep(2)) {
    setStep(2);
    return;
  }

  if (!validateStep(3)) {
    setStep(3);
    return;
  }

  const merchantPayload = {
    ...data,
    onboardingStatus: "Completed",
  };

  setSubmitting(true);

  try {
    if (merchantId) {
      await updateMerchant(merchantId, merchantPayload);
      alert("Merchant details saved successfully.");
    } else {
      await createMerchant(merchantPayload);
      alert("Merchant created successfully.");
    }

    nav("/merchants");

  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Unable to reach the API. Check the NestJS URL in your .env file.";

    alert(message);

  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="page-content merchant-onboarding-page">
      <div className="page-header">
        <div>
          <h1>{merchantId ? "Edit Merchant" : "Add New Merchant"}</h1>
          <div className="breadcrumb">
            <button className="link-button" onClick={() => nav("/dashboard")}>
              Home
            </button>
            <span>›</span>
            <button className="link-button" onClick={() => nav("/merchants")}>
              Merchants
            </button>
            <span>›</span>
            <strong>{merchantId ? "Edit Merchant" : "Add Merchant"}</strong>
          </div>
        </div>

        <button className="back-button" onClick={() => nav("/merchants")}>
          <i className="bi bi-arrow-left" /> Back to Merchants
        </button>
      </div>

      <div className="form-stepper">
        {steps.map(([title, subtitle], index) => {
          const number = index + 1;
          return (
            <div
              key={title}
              className={`step ${step === number ? "active" : ""} ${
                step > number ? "completed" : ""
              }`}
              onClick={() => step > number && setStep(number)}
            >
              <div className="step-number">{number}</div>
              <div className="step-info">
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </div>
              {number < steps.length && <div className="step-line" />}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <Card
              title="Merchant Information"
              sub="Enter the basic business information for this merchant."
            >
              <div className="form-grid">
                <Field
                  label="Business Name"
                  value={data.businessName}
                  placeholder="Enter business name"
                  required
                  onChange={(value) => setField("businessName", value)}
                />
                <Field
                  label="Legal Business Name"
                  value={data.legalBusinessName}
                  placeholder="Enter legal business name"
                  required
                  onChange={(value) => setField("legalBusinessName", value)}
                />

                <div className="form-group">
                  <label>Merchant ID</label>
                  <div className="input-with-prefix">
                    <span>MER-</span>
                    <input
                      value={data.merchantId.replace(/^MER-/, "")}
                      readOnly
                    />
                  </div>
                </div>

                <SelectField
                  label="Country"
                  value={data.country}
                  required
                  options={[
                    "United States",
                    "Canada",
                    "India",
                    "United Kingdom",
                    "Australia",
                  ]}
                  onChange={(value) => setField("country", value)}
                />

                <Field
                  label="State / Province"
                  value={data.state}
                  placeholder="Enter state or province"
                  required
                  onChange={(value) => setField("state", value)}
                />


                <Field
                  label="Tax ID / EIN"
                  value={data.taxId}
                  placeholder="Enter tax ID or EIN"
                  onChange={(value) => setField("taxId", value)}
                />

              
              </div>
            </Card>

            <Card
              title="Primary Contact"
              sub="Main contact person for this merchant."
            >
              <div className="form-grid">
                <Field
                  label="First Name"
                  value={data.firstName}
                  placeholder="Enter first name"
                  required
                  onChange={(value) => setField("firstName", value)}
                />
                <Field
                  label="Last Name"
                  value={data.lastName}
                  placeholder="Enter last name"
                  required
                  onChange={(value) => setField("lastName", value)}
                />
                <Field
                  label="Email Address"
                  value={data.email}
                  placeholder="name@company.com"
                  required
                  type="email"
                  onChange={(value) => setField("email", value)}
                />
                <Field
                  label="Phone Number"
                  value={data.phone}
                  placeholder="+1 (000) 000-0000"
                  required
                  onChange={(value) => setField("phone", value)}
                />
                <Field
                  label="Job Title"
                  value={data.jobTitle}
                  placeholder="e.g. Owner, Manager"
                  onChange={(value) => setField("jobTitle", value)}
                />
                <Field
                  label="Alternate Phone"
                  value={data.alternatePhone}
                  placeholder="Optional"
                  onChange={(value) => setField("alternatePhone", value)}
                />
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={data.billingContact}
                  onChange={(event) =>
                    setField("billingContact", event.target.checked)
                  }
                />
                Use this person as the billing contact
              </label>
            </Card>
          </>
        )}

        {step === 2 && (
          <Card
            title="Store Details"
            sub="Add the store locations belonging to this merchant."
          >
            <div className="store-list">

              {data.stores.map((store, index) => (
                <div className="store-block" key={index}>

                  {/* Store Header */}
                  <div className="store-block-header">
          <div>
            <strong>Store {index + 1}</strong>
            <span>
              {index === 0
                ? "Primary Location"
                : "Additional Location"}
            </span>
          </div>

          <div className="store-header-actions">

            {/* Add Store - only on Store 1 */}
            {index === 0 && (
              <button
                type="button"
                className="add-store-btn"
                onClick={addStore}
              >
                + Add Store
              </button>
            )}

            {/* Remove - only on additional stores */}
            {index > 0 && (
              <button
                type="button"
                className="remove-store-btn"
                onClick={() => removeStore(index)}
              >
                Remove Store
              </button>
            )}

          </div>
        </div>

          {/* Store Fields */}
          <div className="form-grid">

            {/* Store Name */}
            <Field
              label="Store Name"
              value={store.name}
              placeholder="Enter store name"
              required
              onChange={(value) =>
                setStoreField(index, "name", value)
              }
            />

            {/* Store ID */}
           <div className="form-group">
            <label>
              Store ID <span>*</span>
            </label>

            <input
              value={store.id}
              readOnly
            />
          </div>

            {/* Store Type */}
            <SelectField
                label="Store Type"
                value={store.type}
                options={[
                  "Retail",
                  "Restaurant",
                ]}
                onChange={(value) => {
                  setStoreField(index, "type", value);

                  // Clear retail type when Restaurant is selected
                  if (value !== "Retail") {
                    setStoreField(index, "retailType", "");
                  }
                }}
              />

              {store.type === "Retail" && (
                <div className="form-group">
                  <label>
                    Retail Type <span>*</span>
                  </label>

                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name={`retailType-${index}`}
                        value="Convenience"
                        checked={store.retailType === "Convenience"}
                        onChange={(event) =>
                          setStoreField(index, "retailType", event.target.value)
                        }
                      />
                      <span>Convenience</span>
                    </label>

                    <label className="radio-option">
                      <input
                        type="radio"
                        name={`retailType-${index}`}
                        value="Grocery"
                        checked={store.retailType === "Grocery"}
                        onChange={(event) =>
                          setStoreField(index, "retailType", event.target.value)
                        }
                      />
                      <span>Grocery</span>
                    </label>
                  </div>
                </div>
              )}

            {/* Phone */}
            <Field
              label="Phone"
              value={store.phone}
              placeholder="Store phone"
              onChange={(value) =>
                setStoreField(index, "phone", value)
              }
            />

            {/* Store Base URL */}
            <Field
              label="Store Base Url"
              value={store.url}
              placeholder="Store Base url"
              required
              onChange={(value) =>
                setStoreField(index, "url", value)
              }
            />

            {/* Currency */}
            <SelectField
              label="Currency"
              value={store.currency}
              options={[
                "USD",
                "EUR",
                "GBP",
                "INR",
                "AED",
              ]}
              onChange={(value) =>
                setStoreField(index, "currency", value)
              }
            />

            {/* Status */}
            <SelectField
              label="Status"
              value={store.status}
              options={[
                "Active",
                "Inactive",
                "Pending",
              ]}
              onChange={(value) =>
                setStoreField(index, "status", value)
              }
            />

            {/* Address */}
            <Field
              label="Address"
              value={store.address}
              placeholder="Street address"
              required
              onChange={(value) =>
                setStoreField(index, "address", value)
              }
            />

            {/* Timezone */}
            <SelectField
              label="Timezone"
              value={store.timezone}
              options={[
                "Asia/Kolkata",
                "America/New_York",
                "America/Los_Angeles",
                "Europe/London",
                "Asia/Dubai",
              ]}
              onChange={(value) =>
                setStoreField(index, "timezone", value)
              }
            />

            {/* City */}
            <Field
              label="City"
              value={store.city}
              placeholder="City"
              required
              onChange={(value) =>
                setStoreField(index, "city", value)
              }
            />

            {/* State */}
            <Field
              label="State / Province"
              value={store.state}
              placeholder="State / Province"
              required
              onChange={(value) =>
                setStoreField(index, "state", value)
              }
            />

            {/* ZIP */}
            <Field
              label="ZIP / Postal Code"
              value={store.zip}
              placeholder="ZIP / Postal Code"
              required
              onChange={(value) =>
                setStoreField(index, "zip", value)
              }
            />

          </div>
        </div>
      ))}

    </div>
  </Card>
)}

        {step === 3 && (
          <Card
            title="Plan & Subscription"
            sub="Choose the subscription plan for this merchant."
          >
            <div className="plan-grid onboarding-plan-grid">
              {["Starter", "Professional", "Enterprise"].map((plan) => (
                <label
                  key={plan}
                  className={`plan-card ${data.plan === plan ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="plan"
                    checked={data.plan === plan}
                    onChange={() => setField("plan", plan)}
                  />
                  <div>
                    <strong>{plan}</strong>
                    <small>
                      {plan === "Starter"
                        ? "Essential tools for small businesses"
                        : plan === "Professional"
                        ? "Advanced tools for growing businesses"
                        : "Complete tools for larger businesses"}
                    </small>
                  </div>
                </label>
              ))}
            </div>

            <div className="form-grid">
              <SelectField
                label="Billing Cycle"
                value={data.billingCycle}
                options={["Monthly","Free Trial", "Annual"]}
                onChange={(value) => setField("billingCycle", value)}
              />
              <SelectField
                label="Trial Period"
                value={data.trialPeriod}
                options={["0", "7", "14", "30"]}
                onChange={(value) => setField("trialPeriod", value)}
              />
            </div>
          </Card>
        )}

       {step === 4 && (
          <Review
            data={data}
            setField={setField}
            setStoreField={setStoreField}
          />
        )}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => nav("/merchants")}
          >
            Cancel
          </button>

          {step > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(step - 1)}
            >
              ← Back
            </button>
          )}

        {step < 4 ? (
          <button
            type="button"
            className="save-next-btn"
            onClick={() => {
              if (step === 1) {
                if (validateStep(1)) {
                  setStep(2);
                }
                return;
              }

              if (step === 2) {
                if (validateStep(2)) {
                  setStep(3);
                }
                return;
              }

              if (step === 3) {
                if (validateStep(3)) {
                  setStep(4);
                }
                return;
              }
            }}
          >
            Continue
            <i className="bi bi-arrow-right" />
          </button>
        ) : (
          <button
            type="submit"
            className="save-next-btn"
            disabled={submitting}
          >
            {submitting
              ? "Saving..."
              : merchantId
              ? "Save Changes"
              : "Create Merchant"}

            <i className="bi bi-check2" />
          </button>
        )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  required = false,
  type = "text",
  fullWidth = false,
  textarea = false,
  onChange,
}) {
  return (
    <div className={`form-group ${fullWidth ? "full-width" : ""}`}>
      <label>
        {label} {required && <span>*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  required = false,
  onChange,
}) {
  return (
    <div className="form-group">
      <label>
        {label} {required && <span>*</span>}
      </label>
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Card({ title, sub, children }) {
  return (
    <section className="form-card">
      <div className="form-card-header">
        <div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
      </div>
      <div className="form-card-body">{children}</div>
    </section>
  );
}

function Review({ data, setField, setStoreField }) {
  return (
    <>
      {/* =========================
          MERCHANT INFORMATION
          ========================= */}
      <Card
        title="Review Merchant Information"
        sub="Review and update the merchant information before saving."
      >
        <div className="form-grid">

          <Field
            label="Business Name"
            value={data.businessName}
            required
            onChange={(value) =>
              setField("businessName", value)
            }
          />

          <Field
            label="Legal Business Name"
            value={data.legalBusinessName}
            required
            onChange={(value) =>
              setField("legalBusinessName", value)
            }
          />

          <div className="form-group">
            <label>Merchant ID</label>

            <div className="input-with-prefix">
              <span>MER-</span>

              <input
                value={data.merchantId.replace(/^MER-/, "")}
                readOnly
              />
            </div>
          </div>

          <SelectField
            label="Country"
            value={data.country}
            required
            options={[
              "United States",
              "Canada",
              "India",
              "United Kingdom",
              "Australia",
            ]}
            onChange={(value) =>
              setField("country", value)
            }
          />

          <Field
            label="State / Province"
            value={data.state}
            required
            onChange={(value) =>
              setField("state", value)
            }
          />

          <Field
            label="Tax ID / EIN"
            value={data.taxId}
            onChange={(value) =>
              setField("taxId", value)
            }
          />

          <Field
            label="Business Address"
            value={data.businessAddress}
            fullWidth
            onChange={(value) =>
              setField("businessAddress", value)
            }
          />

        </div>
      </Card>


      {/* =========================
          PRIMARY CONTACT
          ========================= */}
      <Card
        title="Primary Contact"
        sub="Review and update the primary contact information."
      >
        <div className="form-grid">

          <Field
            label="First Name"
            value={data.firstName}
            required
            onChange={(value) =>
              setField("firstName", value)
            }
          />

          <Field
            label="Last Name"
            value={data.lastName}
            required
            onChange={(value) =>
              setField("lastName", value)
            }
          />

          <Field
            label="Email Address"
            value={data.email}
            type="email"
            required
            onChange={(value) =>
              setField("email", value)
            }
          />

          <Field
            label="Phone Number"
            value={data.phone}
            required
            onChange={(value) =>
              setField("phone", value)
            }
          />

          <Field
            label="Job Title"
            value={data.jobTitle}
            onChange={(value) =>
              setField("jobTitle", value)
            }
          />

          <Field
            label="Alternate Phone"
            value={data.alternatePhone}
            onChange={(value) =>
              setField("alternatePhone", value)
            }
          />

        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={data.billingContact}
            onChange={(event) =>
              setField(
                "billingContact",
                event.target.checked
              )
            }
          />

          Use this person as the billing contact
        </label>
      </Card>


      {/* =========================
          STORE DETAILS
          ========================= */}
      <Card
        title="Store Details"
        sub="Review and update all store information before saving."
      >
        <div className="store-list">

          {data.stores.map((store, index) => (

            <div
              className="store-block"
              key={store.id || index}
            >

              <div className="store-block-header">
                <div>
                  <strong>Store {index + 1}</strong>

                  <span>
                    {index === 0
                      ? "Primary Location"
                      : "Additional Location"}
                  </span>
                </div>
              </div>


              <div className="form-grid">

                <Field
                  label="Store Name"
                  value={store.name}
                  required
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "name",
                      value
                    )
                  }
                />


                <div className="form-group">
                  <label>Store ID</label>

                  <input
                    value={store.id}
                    readOnly
                  />
                </div>


                <SelectField
                  label="Store Type"
                  value={store.type}
                  options={[
                    "Retail",
                    "Restaurant",
                  ]}
                  onChange={(value) => {
                    setStoreField(
                      index,
                      "type",
                      value
                    );

                    if (value !== "Retail") {
                      setStoreField(
                        index,
                        "retailType",
                        ""
                      );
                    }
                  }}
                />


                {store.type === "Retail" && (
                  <div className="form-group">
                    <label>
                      Retail Type <span>*</span>
                    </label>

                    <div className="radio-group">

                      <label className="radio-option">
                        <input
                          type="radio"
                          name={`review-retailType-${index}`}
                          value="Convenience"
                          checked={
                            store.retailType ===
                            "Convenience"
                          }
                          onChange={(event) =>
                            setStoreField(
                              index,
                              "retailType",
                              event.target.value
                            )
                          }
                        />

                        <span>Convenience</span>
                      </label>


                      <label className="radio-option">
                        <input
                          type="radio"
                          name={`review-retailType-${index}`}
                          value="Grocery"
                          checked={
                            store.retailType ===
                            "Grocery"
                          }
                          onChange={(event) =>
                            setStoreField(
                              index,
                              "retailType",
                              event.target.value
                            )
                          }
                        />

                        <span>Grocery</span>
                      </label>

                    </div>
                  </div>
                )}


                <Field
                  label="Phone"
                  value={store.phone}
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "phone",
                      value
                    )
                  }
                />


                <Field
                  label="Store Base URL"
                  value={store.url}
                  required
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "url",
                      value
                    )
                  }
                />


                <SelectField
                  label="Currency"
                  value={store.currency}
                  options={[
                    "USD",
                    "EUR",
                    "GBP",
                    "INR",
                    "AED",
                  ]}
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "currency",
                      value
                    )
                  }
                />


                <SelectField
                  label="Status"
                  value={store.status}
                  options={[
                    "Active",
                    "Inactive",
                    "Pending",
                  ]}
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "status",
                      value
                    )
                  }
                />


                <Field
                  label="Address"
                  value={store.address}
                  required
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "address",
                      value
                    )
                  }
                />


                <SelectField
                  label="Timezone"
                  value={store.timezone}
                  options={[
                    "Asia/Kolkata",
                    "America/New_York",
                    "America/Los_Angeles",
                    "Europe/London",
                    "Asia/Dubai",
                  ]}
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "timezone",
                      value
                    )
                  }
                />


                <Field
                  label="City"
                  value={store.city}
                  required
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "city",
                      value
                    )
                  }
                />


                <Field
                  label="State / Province"
                  value={store.state}
                  required
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "state",
                      value
                    )
                  }
                />


                <Field
                  label="ZIP / Postal Code"
                  value={store.zip}
                  required
                  onChange={(value) =>
                    setStoreField(
                      index,
                      "zip",
                      value
                    )
                  }
                />

              </div>

            </div>
          ))}

        </div>
      </Card>


      {/* =========================
          PLAN & SUBSCRIPTION
          ========================= */}
      <Card
        title="Plan & Subscription"
        sub="Review and update the selected subscription details."
      >
        <div className="form-grid">

          <SelectField
            label="Plan"
            value={data.plan}
            options={[
              "Starter",
              "Professional",
              "Enterprise",
            ]}
            onChange={(value) =>
              setField("plan", value)
            }
          />

          <SelectField
            label="Billing Cycle"
            value={data.billingCycle}
            options={[
              "Monthly",
              "Free Trial",
              "Annual",
            ]}
            onChange={(value) =>
              setField("billingCycle", value)
            }
          />

          <SelectField
            label="Trial Period"
            value={data.trialPeriod}
            options={[
              "0",
              "7",
              "14",
              "30",
            ]}
            onChange={(value) =>
              setField("trialPeriod", value)
            }
          />

        </div>
      </Card>
    </>
  );
}


