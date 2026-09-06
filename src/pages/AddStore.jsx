import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createStores } from "../api/stores";
import { ApiError } from "../api/http";
const empty = {
  merchant: "",
  storeName: "",
  storeID: "",
  storeType: "",
  phone: "",
  currency: "",
  address: "",
  status: "active",
  timezone: "",
  city: "",
  state: "",
  zip: "",
};
export default function AddStore() {
  const nav = useNavigate(),
    { merchantId } = useParams(),
    [blocks, setBlocks] = useState([{ ...empty }]),
    [submitting, setSubmitting] = useState(false);
  const set = (i, k, v) =>
    setBlocks((b) => b.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const save = async (e) => {
    e.preventDefault();
    if (
      blocks.some(
        (s) =>
          !s.merchant ||
          !s.storeName ||
          !s.storeID ||
          !s.address ||
          !s.city ||
          !s.state ||
          !s.zip,
      )
    ) {
      alert("Please complete all required fields for every store.");
      return;
    }
    setSubmitting(true);
    try {
      await createStores(blocks, merchantId);
      alert(
        blocks.length === 1
          ? "Store created successfully!"
          : `${blocks.length} stores created successfully!`,
      );
      nav(merchantId ? `/merchants/${merchantId}/stores` : "/stores");
    } catch (error) {
      alert(
        error instanceof ApiError
          ? error.message
          : "Unable to reach the API. Check the NestJS URL in your .env file.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="page-content add-store-page">
      <div className="breadcrumb-area">
        <button
          className="link-button"
          onClick={() =>
            nav(merchantId ? `/merchants/${merchantId}/stores` : "/stores")
          }
        >
          <i className="bi bi-arrow-left" /> Stores
        </button>
        <span>/</span>
        <span>Add Store</span>
      </div>
      <div className="page-header add-store-header">
        <div>
          <h1>Add Store</h1>
          <p>Create a new store and connect it to Pinaka Commerce Hub</p>
        </div>
      </div>
      <form className="store-form" onSubmit={save}>
        <div className="form-card">
          <div className="form-card-header">
            <div>
              <h2>Store Details</h2>
              <p>Add the store locations belonging to this merchant.</p>
            </div>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => setBlocks((b) => [...b, { ...empty }])}
            >
              <i className="bi bi-plus-lg" /> Add Store
            </button>
          </div>
          <div>
            {blocks.map((s, i) => (
              <div className="store-block" key={i}>
                <div className="store-block-header">
                  <div>
                    <strong>Store {i + 1}</strong>
                    <span>
                      {i === 0 ? "Primary Location" : "Additional Location"}
                    </span>
                  </div>
                  {i > 0 && (
                    <button
                      type="button"
                      className="remove-store-btn"
                      onClick={() =>
                        setBlocks((b) => b.filter((_, j) => j !== i))
                      }
                    >
                      <i className="bi bi-trash3" /> Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  {f(
                    i,
                    "merchant",
                    "Merchant",
                    s.merchant,
                    "select",
                    [
                      "ABC Retail",
                      "XYZ Foods",
                      "Sunshine LLC",
                      "Retail Corp",
                      "Westside Market LLC",
                    ],
                    true,
                  )}
                  {f(
                    i,
                    "storeName",
                    "Store Name",
                    s.storeName,
                    "input",
                    [],
                    true,
                  )}
                  {f(i, "storeID", "Store ID", s.storeID, "input", [], true)}
                  {f(i, "storeType", "Store Type", s.storeType, "select", [
                    "Restaurant",
                    "Retail Store",
                    "Warehouse",
                  ])}
                  {f(i, "phone", "Phone", s.phone)}
                  {f(i, "currency", "Currency", s.currency, "select", [
                    "INR - Indian Rupee",
                    "USD - United States Dollar",
                    "EUR - Euro",
                    "GBP - British Pound",
                  ])}
                  {f(i, "address", "Address", s.address, "input", [], true)}
                  {f(i, "status", "Store Status", s.status, "select", [
                    "Active",
                    "Inactive",
                  ])}
                  {f(i, "timezone", "Timezone", s.timezone, "select", [
                    "Kolkata",
                    "Central Time (CT)",
                    "Eastern Time (ET)",
                    "Pacific Time (PT)",
                  ])}
                  {f(i, "city", "City", s.city, "input", [], true)}
                  {f(
                    i,
                    "state",
                    "State / Province",
                    s.state,
                    "input",
                    [],
                    true,
                  )}
                  {f(i, "zip", "ZIP / Postal Code", s.zip, "input", [], true)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button
            className="cancel-btn"
            type="button"
            onClick={() =>
              nav(merchantId ? `/merchants/${merchantId}/stores` : "/stores")
            }
          >
            <i className="bi bi-arrow-left" /> Back
          </button>
          <button
            className="create-store-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Store"}
          </button>
        </div>
      </form>
    </div>
  );
  function f(i, k, label, val, type = "input", opts = [], req = false) {
    return (
      <div className="form-group">
        <label>
          {label} {req && <span>*</span>}
        </label>
        {type === "select" ? (
          <select
            value={val}
            required={req}
            onChange={(e) => set(i, k, e.target.value)}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {opts.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            value={val}
            required={req}
            placeholder={`Enter ${label.toLowerCase()}`}
            onChange={(e) => set(i, k, e.target.value)}
          />
        )}
      </div>
    );
  }
}
