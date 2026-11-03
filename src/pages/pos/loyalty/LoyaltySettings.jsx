import { useEffect, useMemo, useState } from "react";
import { Award, ChevronDown, ChevronUp, Search } from "lucide-react";
import Pagination from "../../../components/Pagination";
import { ConfigHeader, usePosSettings } from "../shared";
import "./loyalty-settings.css";

const DEFAULT_SETTINGS = {
  ratio_dollar: 10,
  ratio_point: 1,
  new_customer_points: 100,
  default_points: 15,
  expiry_days: 365,
  allow_expiry: true,
  calculation_mode: "order",
  loyalty_tag: "LoyaltyPoints",
  min_spend: 10,
  max_spend: 1000,
  redeem_point: 500,
  redeem_amt: 25,
  min_points: 100,
  max_points: 500,
  redeem_perc: 100,
  allow_redemption: true,
  allow_with_coupons: true,
};

const SAMPLE_CUSTOMERS = [
  { user_id: 29, name: "Customer 8668", contact: "0866868668", credited: 100, redeemed: 0, expired: 0, available: 100, last_updated: "2026-09-23 05:27", transactions: [{ order_id: "17137", order_amount: 116.13, credited_points: 100, redeemed_points: 0, expired_points: 0, order_redeem_points: 0, points_status: "Active", points_created_date: "2026-09-23 05:27", points_expiry_date: "2027-09-23" }] },
  { user_id: 28, name: "Customer 3210", contact: "9876543210", credited: 317, redeemed: 0, expired: 0, available: 317, last_updated: "2026-09-18 01:03", transactions: [] },
  { user_id: 27, name: "Customer 7878", contact: "799887878", credited: 764, redeemed: 500, expired: 0, available: 264, last_updated: "2026-06-05 04:12", transactions: [] },
  { user_id: 26, name: "Customer 9999", contact: "9999999999", credited: 0, redeemed: 0, expired: 0, available: 0, last_updated: "2026-06-05 10:54", transactions: [] },
  { user_id: 25, name: "Customer 5432", contact: "6789765432", credited: 0, redeemed: 0, expired: 0, available: 0, last_updated: "2026-06-05 10:54", transactions: [] },
  { user_id: 24, name: "Customer madhuri", contact: "madhuri@gmail.com", credited: 1, redeemed: 0, expired: 0, available: 1, last_updated: "2026-05-27 02:15", transactions: [] },
  { user_id: 23, name: "Customer 7872", contact: "6302557872", credited: 0, redeemed: 0, expired: 0, available: 0, last_updated: "2026-05-27 03:31", transactions: [] },
  { user_id: 22, name: "Customer 1982", contact: "9948681982", credited: 119, redeemed: 0, expired: 0, available: 119, last_updated: "2026-06-11 22:40", transactions: [] },
  { user_id: 21, name: "Customer 5112", contact: "6025165112", credited: 4, redeemed: 0, expired: 0, available: 4, last_updated: "2026-05-26 19:20", transactions: [] },
];

export function LoyaltySettings() {
  const { currencySymbol } = usePosSettings();
  const [tab, setTab] = useState("customers");
  const [customers] = useState(SAMPLE_CUSTOMERS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState("");

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return customers.filter((customer) =>
      [customer.name, customer.contact, customer.user_id]
        .some((value) => String(value || "").toLowerCase().includes(normalizedQuery)),
    );
  }, [customers, query]);
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const rows = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [query]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setNotice("");
  };

  const save = (event) => {
    event.preventDefault();
    setNotice("Settings saved for this session.");
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    setNotice("Settings restored to the sample values.");
  };

  return (
    <main className="loyalty-page pos-panel">
      <ConfigHeader title="Loyalty Settings" description="Manage customer points, earning rules, and redemption settings." />

      <div className="loyalty-tabs" role="tablist" aria-label="Loyalty settings sections">
        <button type="button" role="tab" aria-selected={tab === "customers"} className={tab === "customers" ? "active" : ""} onClick={() => setTab("customers")}>Loyalty Points</button>
        <button type="button" role="tab" aria-selected={tab === "settings"} className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>Loyalty Settings</button>
      </div>

      {notice && <div className="loyalty-success" role="status">{notice}</div>}

      {tab === "customers" ? (
        <section className="loyalty-card">
          <div className="loyalty-card-heading">
            <div><h2>Loyalty Points List</h2><p>View customer balances and their loyalty points history.</p></div>
            <label className="loyalty-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by customer name or contact" aria-label="Search loyalty customers" /></label>
          </div>
          <div className="loyalty-table-scroll"><table className="loyalty-table">
            <thead><tr><th>Customer Name</th><th>Mobile / Email</th><th>Total Points</th><th>Redeemed Points</th><th>Expired Points</th><th>Available Points</th><th>Last Updated</th><th>Details</th></tr></thead>
            <tbody>{rows.length ? rows.map((customer, index) => {
              const rowId = customer.user_id;
              const expanded = String(expandedId) === String(rowId);
              return <CustomerRow key={rowId} customer={customer} currencySymbol={currencySymbol} expanded={expanded} onToggle={() => setExpandedId(expanded ? null : rowId)} />;
            }) : <tr><td colSpan={8} className="loyalty-table-message">No loyalty customers match your search.</td></tr>}</tbody>
          </table></div>
          <Pagination currentPage={Math.min(page, totalPages)} totalPages={totalPages} totalItems={filteredCustomers.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} itemLabel="customers" showWhenEmpty />
        </section>
      ) : (
        <form className="loyalty-settings-form" onSubmit={save}>
          <section className="loyalty-card">
            <h2 className="loyalty-section-title"><Award size={20} /> Loyalty Program Settings</h2>
            <div className="loyalty-form-grid">
              <div className="loyalty-field loyalty-field-wide"><label>Earning Ratio <b>*</b></label><div className="loyalty-ratio"><span>{currencySymbol}</span><input type="number" min="0" step="1" name="ratio_dollar" value={settings.ratio_dollar} onChange={updateField} required /><span>=</span><input type="number" min="0" step="1" name="ratio_point" value={settings.ratio_point} onChange={updateField} required /><span>point(s)</span></div><small>Example: spend {currencySymbol}{settings.ratio_dollar} to earn {settings.ratio_point} point(s).</small></div>
              <NumberField label="New Customer Reward Points" name="new_customer_points" value={settings.new_customer_points} onChange={updateField} help="Points awarded to newly registered customers." />
              <NumberField label="Default Loyalty Points" name="default_points" value={settings.default_points} onChange={updateField} help="Default points configured for the loyalty program." />
              <NumberField label="Points Expiry (Days)" name="expiry_days" value={settings.expiry_days} onChange={updateField} help="Number of days before points expire." disabled={!settings.allow_expiry} />
              <ToggleField label="Allow Points Expiry" name="allow_expiry" checked={settings.allow_expiry} onChange={updateField} help="Enable expiry for loyalty points." />
              <div className="loyalty-field"><label>Points Calculation Mode <b>*</b></label><div className="loyalty-radio-options"><label><input type="radio" name="calculation_mode" value="order" checked={settings.calculation_mode === "order"} onChange={updateField} /> Order Level</label><label><input type="radio" name="calculation_mode" value="item" checked={settings.calculation_mode === "item"} onChange={updateField} /> Item Level</label></div><small>Choose how loyalty points are calculated.</small></div>
              <label className="loyalty-field"><span>Loyalty Tag Name</span><input name="loyalty_tag" value={settings.loyalty_tag} onChange={updateField} /><small>Tag used to identify loyalty point products.</small></label>
              <NumberField label={`Minimum Amount to Earn (${currencySymbol})`} name="min_spend" value={settings.min_spend} onChange={updateField} help="Minimum spend required to earn points." />
              <NumberField label={`Maximum Amount to Earn (${currencySymbol})`} name="max_spend" value={settings.max_spend} onChange={updateField} help="Spends above this amount will not earn extra points." />
            </div>
          </section>

          <section className="loyalty-card">
            <h2 className="loyalty-section-title"><i className="bi bi-gift" /> Redemption Settings</h2>
            <div className="loyalty-form-grid">
              <div className="loyalty-field loyalty-field-wide"><label>Redemption Ratio <b>*</b></label><div className="loyalty-ratio"><input type="number" min="0" step="1" name="redeem_point" value={settings.redeem_point} onChange={updateField} required /><span>point(s) =</span><span>{currencySymbol}</span><input type="number" min="0" step="1" name="redeem_amt" value={settings.redeem_amt} onChange={updateField} required /></div><small>Example: {settings.redeem_point} points = {currencySymbol}{settings.redeem_amt}.</small></div>
              <ToggleField label="Allow Redemption" name="allow_redemption" checked={settings.allow_redemption} onChange={updateField} help="Enable customers to redeem points." />
              <NumberField label="Minimum Redemption Points" name="min_points" value={settings.min_points} onChange={updateField} help="Minimum points required for redemption." disabled={!settings.allow_redemption} />
              <NumberField label="Maximum Redemption per Order" name="max_points" value={settings.max_points} onChange={updateField} help="Maximum points that can be redeemed in one order." disabled={!settings.allow_redemption} />
              <NumberField label="Maximum Redemption (% of order)" name="redeem_perc" value={settings.redeem_perc} onChange={updateField} help="Cap the share of order value paid with points." disabled={!settings.allow_redemption} />
              <ToggleField label="Allow Loyalty with Coupons?" name="allow_with_coupons" checked={settings.allow_with_coupons} onChange={updateField} help="Customers can earn loyalty points when coupons are applied." />
            </div>
          </section>
          <div className="loyalty-form-actions"><button type="button" className="loyalty-cancel" onClick={reset}>Reset</button><button type="submit" className="loyalty-save">Save Settings</button></div>
        </form>
      )}
    </main>
  );
}

function NumberField({ label, name, value, onChange, help, disabled = false }) {
  return <label className={`loyalty-field${disabled ? " is-disabled" : ""}`}><span>{label} <b>*</b></span><input type="number" min="0" step="1" name={name} value={value} onChange={onChange} required disabled={disabled} /><small>{help}</small></label>;
}

function ToggleField({ label, name, checked, onChange, help }) {
  return <label className="loyalty-toggle-field"><span className="loyalty-toggle-copy"><strong>{label}</strong><small>{help}</small></span><span className="loyalty-switch"><input type="checkbox" name={name} checked={checked} onChange={onChange} /><span /></span></label>;
}

function CustomerRow({ customer, currencySymbol, expanded, onToggle }) {
  const transactions = Array.isArray(customer.transactions) ? customer.transactions : [];
  return <>
    <tr><td>{customer.name}</td><td>{customer.contact}</td><td>{customer.credited}</td><td>{customer.redeemed}</td><td>{customer.expired}</td><td><strong>{customer.available}</strong></td><td>{customer.last_updated}</td><td><button className="loyalty-details-button" type="button" aria-expanded={expanded} onClick={onToggle}>{expanded ? "Hide Details" : "View Details"}{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></td></tr>
    {expanded && <tr className="loyalty-transaction-row"><td colSpan={8}><div className="loyalty-transaction-wrap"><table><thead><tr><th>Order ID</th><th>Order Amount</th><th>Credited Points</th><th>Redeemed Points</th><th>Expired Points</th><th>Order Redeem Points</th><th>Status</th><th>Created Date</th><th>Expiry Date</th></tr></thead><tbody>{transactions.length ? transactions.map((transaction, index) => <tr key={`${transaction.order_id}-${index}`}><td>{transaction.order_id}</td><td>{transaction.order_amount == null ? "—" : `${currencySymbol}${Number(transaction.order_amount).toFixed(2)}`}</td><td>{transaction.credited_points}</td><td>{transaction.redeemed_points}</td><td>{transaction.expired_points}</td><td>{transaction.order_redeem_points}</td><td>{transaction.points_status}</td><td>{transaction.points_created_date}</td><td>{transaction.points_expiry_date}</td></tr>) : <tr><td colSpan={9}>No points transactions for this customer.</td></tr>}</tbody></table></div></td></tr>}
  </>;
}