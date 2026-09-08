import { useReferenceData } from "../api/referenceData";
import { useEffect, useState } from "react";
import { listMerchants } from "../api/merchants";
import {
  listSubscriptions,
  listSubscriptionPlans,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  subscriptionPayload,
} from "../api/subscriptions";
const empty = {
  merchantId: "",
  planCode: "",
  planName: "",
  maxStoresAllowed: 1,
  entitlements: "",
  billingCycle: "MONTHLY",
  trialDays: 0,
  price: 0,
  status: "ACTIVE",
};
export default function Subscriptions() {
  const { data: reference, error: referenceError } = useReferenceData();
  const [rows, setRows] = useState([]),
    [merchants, setMerchants] = useState([]),
    [plans, setPlans] = useState([]);
  const [form, setForm] = useState(null),
    [editing, setEditing] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0),
    [filter, setFilter] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([listSubscriptions(), listMerchants(), listSubscriptionPlans()])
      .then(([s, m, p]) => {
        if (active) {
          setRows(s.subscriptions);
          setMerchants(m);
          setPlans(p.plans);
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
  }, [version]);
  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  async function edit(id) {
    setBusy(true);
    setError("");
    try {
      const { subscription: s } = await getSubscription(id);
      setForm({ ...s, entitlements: s.entitlements.join(", ") });
      setEditing(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (
        !plans.some(
          (p) => p.planCode === form.planCode && p.status === "ACTIVE",
        )
      )
        throw new Error("Select an active master plan.");
      const payload = subscriptionPayload(form);
      if (editing) await updateSubscription(editing, payload);
      else
        await createSubscription({ ...payload, merchantId: form.merchantId });
      setForm(null);
      setEditing(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(row) {
    if (!window.confirm(`Delete subscription ${row.id} for ${row.merchantId}?`))
      return;
    setBusy(true);
    setError("");
    try {
      await deleteSubscription(row.id);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function choosePlan(code) {
    const p = plans.find((p) => p.planCode === code);
    if (p)
      setForm((f) => ({
        ...f,
        planCode: p.planCode,
        planName: p.planName,
        maxStoresAllowed: p.maxStoresAllowed,
        entitlements: p.entitlements.join(", "),
        billingCycle: p.billingCycle,
        trialDays: p.trialDays,
        price: p.price,
      }));
    else field("planCode", code);
  }
  const names = new Map(merchants.map((m) => [m.id, m.name]));
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Subscriptions</h1>
          <p>Manage merchant plans and billing periods</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary"
            disabled={loading || busy}
            onClick={() => setVersion((v) => v + 1)}
          >
            Refresh
          </button>
          <button
            className="btn btn-primary"
            disabled={loading || busy}
            onClick={() => {
              setEditing(null);
              setForm({ ...empty });
              setError("");
            }}
          >
            Add Subscription
          </button>
        </div>
      </div>
      {(error || referenceError) && (
        <p role="alert">{error || referenceError}</p>
      )}
      {!loading && !plans.some((p) => p.status === "ACTIVE") && (
        <p>
          No active plans are available in the subscription master. Add or
          activate a master plan before creating a subscription.
        </p>
      )}
      {form && (
        <form className="form-card" onSubmit={save}>
          <h2>{editing ? "Edit" : "Add"} Subscription</h2>
          <fieldset disabled={busy}>
            <div className="form-grid">
              <label className="form-group">
                Merchant
                <select
                  required
                  disabled={Boolean(editing)}
                  value={form.merchantId}
                  onChange={(e) => field("merchantId", e.target.value)}
                >
                  <option value="">Select merchant</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                Plan
                <select
                  required
                  value={form.planCode}
                  onChange={(e) => choosePlan(e.target.value)}
                >
                  <option value="">Select plan</option>
                  {[
                    ...new Set(
                      [
                        ...plans
                          .filter((p) => p.status === "ACTIVE")
                          .map((p) => p.planCode),
                        form.planCode,
                      ].filter(Boolean),
                    ),
                  ].map((code) => (
                    <option key={code} value={code}>
                      {plans.find((p) => p.planCode === code)?.planName || code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                Plan name
                <input
                  required
                  readOnly
                  value={form.planName}
                  onChange={(e) => field("planName", e.target.value)}
                />
              </label>
              {["maxStoresAllowed", "trialDays", "price"].map((key) => (
                <label className="form-group" key={key}>
                  {
                    {
                      maxStoresAllowed: "Maximum stores",
                      trialDays: "Trial days",
                      price: "Price",
                    }[key]
                  }
                  <input
                    required
                    type="number"
                    min={key === "maxStoresAllowed" ? 1 : 0}
                    step={key === "price" ? "0.01" : "1"}
                    readOnly
                    value={form[key]}
                    onChange={(e) => field(key, e.target.value)}
                  />
                </label>
              ))}
              <label className="form-group">
                Billing cycle
                <select
                  disabled
                  value={form.billingCycle}
                  onChange={(e) => field("billingCycle", e.target.value)}
                >
                  {(reference.billingCycles || []).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                Status
                <select
                  value={form.status}
                  onChange={(e) => field("status", e.target.value)}
                >
                  {(reference.subscriptionStatuses || []).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              {["currentPeriodStart", "currentPeriodEnd"].map((key) => (
                <label className="form-group" key={key}>
                  {key === "currentPeriodStart"
                    ? "Period start (UTC)"
                    : "Period end (UTC)"}
                  <input
                    type="datetime-local"
                    value={form[key] ? form[key].slice(0, 16) : ""}
                    onChange={(e) =>
                      field(key, e.target.value ? e.target.value + "Z" : "")
                    }
                  />
                </label>
              ))}
              <label className="form-group">
                Entitlements (comma-separated)
                <input
                  readOnly
                  value={form.entitlements}
                  onChange={(e) => field("entitlements", e.target.value)}
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                {busy ? "Saving…" : "Save subscription"}
              </button>
            </div>
          </fieldset>
        </form>
      )}
      <div className="stores-card">
        <div className="store-toolbar">
          <input
            aria-label="Search subscriptions"
            placeholder="Search merchant or plan…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {loading ? (
          <p role="status">Loading subscriptions…</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {[
                    "Merchant",
                    "Plan",
                    "Billing cycle",
                    "Price",
                    "Status",
                    "Period end",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((s) =>
                    `${names.get(s.merchantId)} ${s.merchantId} ${s.planName}`
                      .toLowerCase()
                      .includes(filter.toLowerCase()),
                  )
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{names.get(s.merchantId) || s.merchantId}</td>
                      <td>{s.planName}</td>
                      <td>{s.billingCycle}</td>
                      <td>{Number(s.price).toFixed(2)}</td>
                      <td>{s.status}</td>
                      <td>
                        {s.currentPeriodEnd
                          ? new Date(s.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          disabled={busy}
                          className="btn btn-secondary"
                          onClick={() => edit(s.id)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          disabled={busy}
                          className="btn btn-secondary"
                          onClick={() => remove(s)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={7}>No subscriptions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
