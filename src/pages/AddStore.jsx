import { allocateId } from "../api/ids";
import { useReferenceData } from "../api/referenceData";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listMerchants } from "../api/merchants";
import { createStores, getStore, updateStore } from "../api/stores";

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
  const { data: reference, error: referenceError } = useReferenceData();
  const nav = useNavigate(),
    { merchantId, storeId } = useParams(),
    [blocks, setBlocks] = useState([{ ...empty, merchant: merchantId || "" }]),
    [submitting, setSubmitting] = useState(false);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      listMerchants(),
      storeId
        ? getStore(storeId)
        : allocateId("store").then((id) => ({
            ...empty,
            merchant: merchantId || "",
            storeID: id,
          })),
    ])
      .then(([rows, store]) => {
        if (active) {
          if (storeId && store && merchantId && store.merchant !== merchantId)
            throw new Error("Store does not belong to this merchant.");
          setMerchants(rows);
          if (store) setBlocks([store]);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [merchantId, storeId]);
  const addBlock = async () => {
    try {
      const id = await allocateId("store");
      setBlocks((b) => [
        ...b,
        { ...empty, merchant: merchantId || b[0].merchant, storeID: id },
      ]);
    } catch (e) {
      alert(e.message);
    }
  };
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
      if (storeId) await updateStore(storeId, blocks[0]);
      else await createStores(blocks, merchantId);
      alert(
        storeId
          ? "Store updated successfully!"
          : blocks.length === 1
            ? "Store created successfully!"
            : `${blocks.length} stores created successfully!`,
      );
      nav(merchantId ? `/merchants/${merchantId}/stores` : "/stores");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to reach the API. Check the NestJS URL in your .env file.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (loading)
    return (
      <div className="page-content" role="status">
        Loading store form…
      </div>
    );
  if (error)
    return (
      <div className="page-content" role="alert">
        {error}
      </div>
    );
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
        <span>{storeId ? "Edit Store" : "Add Store"}</span>
      </div>
      <div className="page-header add-store-header">
        <div>
          <h1>{storeId ? "Edit Store" : "Add Store"}</h1>
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
              hidden={Boolean(storeId)}
              className="btn btn-outline"
              type="button"
              onClick={addBlock}
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
                    merchants.map((m) => ({ value: m.id, label: m.name })),
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
                  {f(
                    i,
                    "storeType",
                    "Store Type",
                    s.storeType,
                    "select",
                    reference.storeTypes || [],
                  )}
                  {f(i, "phone", "Phone", s.phone)}
                  {f(i, "url", "Website URL", s.url || "")}
                  {f(
                    i,
                    "currency",
                    "Currency",
                    s.currency,
                    "select",
                    reference.currencies || [],
                  )}
                  {f(i, "address", "Address", s.address, "input", [], true)}
                  {f(
                    i,
                    "status",
                    "Store Status",
                    s.status,
                    "select",
                    reference.storeStatuses || [],
                  )}
                  {f(
                    i,
                    "timezone",
                    "Timezone",
                    s.timezone,
                    "select",
                    reference.timezones || [],
                  )}
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
            value={val || ""}
            required={req}
            disabled={k === "merchant" && Boolean(merchantId || storeId)}
            onChange={(e) => set(i, k, e.target.value)}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {(k === "merchant"
              ? opts
              : [...new Set([...opts, val].filter(Boolean))]
            ).map((o) => (
              <option key={o.value || o} value={o.value || o}>
                {o.label || o}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={val}
            required={req}
            readOnly={k === "storeID"}
            placeholder={`Enter ${label.toLowerCase()}`}
            onChange={(e) => set(i, k, e.target.value)}
          />
        )}
      </div>
    );
  }
}
