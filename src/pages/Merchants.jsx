import { useReferenceData } from "../api/referenceData";
import { listSubscriptionPlans } from "../api/subscriptions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listMerchants, getMerchant } from "../api/merchants";
import { ApiError } from "../api/http";
import "../styles/merchants.css";

function readValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return typeof value === 'object' ? (value.name || value.label || '—') : String(value);
}
function ViewSection({ title, children }) {
  return <section className="merchant-view-section"><h2>{title}</h2>{children}</section>;
}
function ViewFields({ items }) {
  return <dl className="merchant-view-fields">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{readValue(value)}</dd></div>)}</dl>;
}
function ViewTable({ headings, rows }) {
  return rows.length ? <div className="table-wrapper"><table className="merchant-table"><thead><tr>{headings.map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{readValue(cell)}</td>)}</tr>)}</tbody></table></div> : <p className="merchant-view-empty">No records provided.</p>;
}
function MerchantReadOnly({ merchantId, merchant, onBack, onStores }) {
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = [['overview', 'Overview'], ['subscription', 'Subscription & Usage'], ['stores', 'Stores'], ['devices', 'Devices'], ['roles', 'Roles & Permissions'], ['payments', 'Payment History']];
  function tabKeyDown(event, index) {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); setActiveTab(tabs[next][0]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus();
  }
  const draft = merchant?._onboarding;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!draft);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (draft) { setLoading(false); setError(''); return; }
    let active = true;
    setLoading(true); setError('');
    Promise.resolve().then(() => getMerchant(merchantId)).then(value => {
      if (active) setResult(value);
    }).catch(failure => { if (active) setError(failure.message || 'Unable to load merchant details.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [merchantId, draft, attempt]);
  const response = result?.raw || result || {};
  const raw = response.merchant || response.data?.merchant || response.data || response;
  const saved = draft || raw._onboarding;
  const summary = { ...(result?.merchant || {}), ...(merchant || {}) };
  const contact = saved?.merchant || raw;
  const subscription = result?.subscription || raw.subscription || response.subscription || {};
  const address = contact.address || raw.businessAddress || {};
  const list = value => Array.isArray(value) ? value : [];
  const stores = list(saved?.stores ?? response.stores ?? raw.stores);
  const devices = list(saved?.devices ?? raw.devices ?? response.devices);
  const roles = list(saved?.roles ?? raw.roles ?? response.roles);
  const payments = list(saved?.paymentHistory ?? raw.paymentHistory);
  const business = contact.business || raw.legalBusinessName || raw.businessName || summary.name;
  const storeName = device => saved ? stores[device.store]?.name : device.storeName || device.storeId;
  return <div className="page-content merchant-readonly">
    <style>{`
      .merchant-readonly .merchant-view-section{background:#fff;border:1px solid #e1e4eb;border-radius:10px;margin-bottom:16px;overflow:hidden;}
      .merchant-readonly .merchant-view-section h2{font-size:17px;padding:16px 20px;margin:0;border-bottom:1px solid #edf0f4;color:#17233e;}
      .merchant-readonly .merchant-view-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 28px;padding:20px;margin:0;}
      .merchant-readonly .merchant-view-fields dt{font-weight:500;color:#7c8495;font-size:13px;margin-bottom:5px;}
      .merchant-readonly .merchant-view-fields dd{margin:0;color:#17233e;font-size:15px;overflow-wrap:anywhere;}
      .merchant-readonly .merchant-view-empty{padding:16px 20px;color:#7c8495;margin:0;}
      .merchant-readonly .merchant-view-back{border:0;background:none;color:#5143bc;padding:0;margin-bottom:12px;cursor:pointer;}
      .merchant-readonly .merchant-view-section details{padding:14px 20px;border-top:1px solid #edf0f4;}
      .merchant-readonly .merchant-view-section summary{cursor:pointer;color:#5143bc;}
      .merchant-readonly .merchant-view-tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid #e1e4eb;margin-bottom:20px;background:#fff;}
      .merchant-readonly .merchant-view-tabs button{flex:none;white-space:nowrap;border:0;border-bottom:3px solid transparent;background:transparent;padding:14px 18px;color:#758096;font-size:14px;cursor:pointer;}
      .merchant-readonly .merchant-view-tabs button[aria-selected="true"]{color:#5143bc;border-bottom-color:#5143bc;font-weight:600;background:#f8f7ff;}
      .merchant-readonly .merchant-view-tabs button:focus-visible{outline:2px solid #5143bc;outline-offset:-4px;}
      .merchant-readonly [role="tabpanel"][hidden]{display:none;}
      @media(max-width:650px){.merchant-readonly .merchant-view-fields{grid-template-columns:1fr;}}
    `}</style>
    <button type="button" className="merchant-view-back" onClick={onBack}>← Merchants</button>
    <div className="page-header"><div><h1>Merchant Details</h1><p>{readValue(business)} · {merchantId}</p></div>
      <div className="page-actions"><button type="button" className="btn btn-primary" onClick={onStores}><i className="bi bi-shop" /> View List Of Stores</button></div>
    </div>
    {loading ? <p role="status">Loading merchant details…</p> : error ? <div className="alert alert-danger" role="alert">{error} <button type="button" className="btn btn-secondary" onClick={() => setAttempt(value => value + 1)}>Retry</button></div> : <>
      <div className="merchant-view-tabs" role="tablist" aria-label="Merchant details">
        {tabs.map(([id, label], index) => <button key={id} type="button" role="tab" id={'merchant-tab-' + id}
          aria-selected={activeTab === id} aria-controls={'merchant-panel-' + id} tabIndex={activeTab === id ? 0 : -1}
          onClick={() => setActiveTab(id)} onKeyDown={event => tabKeyDown(event, index)}>{label}</button>)}
      </div>
      <div role="tabpanel" id="merchant-panel-overview" aria-labelledby="merchant-tab-overview" hidden={activeTab !== 'overview'} tabIndex={0}>
        <ViewSection title="Business Details"><ViewFields items={[
          ['Merchant Code', contact.code || raw.merchantCode || summary.id || merchantId], ['Legal / Business Name', business],
          ['Business Display Name', contact.display || raw.businessName || raw.name || summary.name], ['Status', summary.status || raw.status],
          ['Joined Date', summary.joined || raw.createdAt],
        ]} /></ViewSection>
        <ViewSection title="Primary Contact"><ViewFields items={[
          ['Merchant Name', saved ? contact.name : raw.ownerName || [raw.firstName, raw.lastName].filter(Boolean).join(' ')],
          ['Email', contact.email || summary.email], ['Phone', contact.phone || summary.phone],
          ['Country', contact.country || address.country || summary.country], ['City', contact.city || address.city],
          ['State / Province', contact.state || address.state || summary.state],
          ['Address', typeof address === 'string' ? address : address.street || address.addressLine1],
          ['Postal Code', contact.postal || contact.postalCode || address.postalCode || address.zipCode],
        ]} /></ViewSection>
      </div>
      <div role="tabpanel" id="merchant-panel-subscription" aria-labelledby="merchant-tab-subscription" hidden={activeTab !== 'subscription'} tabIndex={0}>
        <ViewSection title="Subscription & Usage"><ViewFields items={[
          ['Plan', subscription.planName || subscription.plan?.name || summary.plan], ['Billing Cycle', saved?.cycle || subscription.billingCycle],
          ['Subscription ID', saved?.subscriptionId || subscription.id || subscription.subscriptionId],
          ['Subscription Status', saved?.subscriptionStatus || subscription.status], ['Start Date', saved?.start || subscription.startDate],
          ['Renewal Date', subscription.renewalDate || subscription.nextBillingDate || summary.renewal],
          ['Registered Stores', saved ? stores.length : summary.stores ?? raw.storeCount ?? (Array.isArray(raw.stores) ? stores.length : undefined)],
          ['Store Allowance', summary.storeLimit ?? subscription.storeLimit],
          ['Registered Devices', saved ? devices.length : raw.deviceCount ?? (Array.isArray(raw.devices) ? devices.length : undefined)],
          ['Device Allowance', subscription.deviceLimit ?? summary.deviceLimit],
          ['Registered Employees', saved?.employeeCount ?? raw.employeeCount ?? summary.employeeCount],
          ['Employee Allowance', summary.employeeLimit ?? subscription.employeeLimit],
        ]} /></ViewSection>
      </div>
      <div role="tabpanel" id="merchant-panel-stores" aria-labelledby="merchant-tab-stores" hidden={activeTab !== 'stores'} tabIndex={0}>
        <ViewSection title="Stores"><ViewTable headings={['Store ID', 'Store Name', 'Type', 'Location', 'Licensed']} rows={stores.map(store => [
          store.code || store.storeCode || store.id, store.name || store.storeName, store.type || store.storeTypeName || store.storeType,
          [store.city, store.state, store.country].filter(Boolean).join(', '), store.licensed,
        ])} />{stores.map((store, index) => <details key={store.code || store.id || index}><summary>{store.name || store.storeName || 'Store'} — Details & Timings</summary>
          <ViewFields items={[["Base URL", store.url || store.baseUrl], ["Time Zone", store.timezone], ["Address", typeof store.address === 'object' ? store.address?.street : store.address], ["Postal Code", store.postal || store.postalCode]]} />
          <ViewTable headings={['Day', 'Status', 'Opens', 'Closes', 'Shifts']} rows={list(store.hours).map(day => [day.day, day.status, day.open, day.close, day.shifts])} />
        </details>)}</ViewSection>
      </div>
      <div role="tabpanel" id="merchant-panel-devices" aria-labelledby="merchant-tab-devices" hidden={activeTab !== 'devices'} tabIndex={0}>
        <ViewSection title="Devices"><ViewTable headings={['Device', 'Type', 'Store', 'Identifier']} rows={devices.map(device => [device.name, device.type, storeName(device), device.serial || device.serialNumber])} /></ViewSection>
      </div>
      <div role="tabpanel" id="merchant-panel-roles" aria-labelledby="merchant-tab-roles" hidden={activeTab !== 'roles'} tabIndex={0}>
        <ViewSection title="Roles & Permissions"><ViewTable headings={['Role', 'Source', 'Scope', 'Permissions']} rows={roles.map(role => [
          role.name, role.source, role.scope, Array.isArray(role.perms) ? role.perms.flat().join(', ') : undefined,
        ])} /></ViewSection>
      </div>
      <div role="tabpanel" id="merchant-panel-payments" aria-labelledby="merchant-tab-payments" hidden={activeTab !== 'payments'} tabIndex={0}>
        <ViewSection title="Payment History"><ViewTable headings={['Date', 'Plan', 'Amount', 'Method', 'Status']} rows={payments.map(payment => [
          payment.createdAt, payment.plan, [payment.currency, payment.amount].filter(value => value !== undefined && value !== null).join(' '), payment.method, payment.status,
        ])} /></ViewSection>
      </div>
    </>}
  </div>;
}


function exportMerchants(rows) {
  if (!rows.length) {
    alert("There are no merchants to export.");
    return;
  }
  const header = [
    "Merchant",
    "Merchant ID",
    "Contact",
    "Phone",
    "Stores",
    "Subscription Plan",
    "Status",
    "Joined On",
  ];
  const data = rows.map((m) => [
    m.name,
    m.id,
    m.email,
    m.phone,
    m.stores,
    m.plan,
    m.status,
    m.joined,
  ]);
  const csv = [header, ...data]
    .map((row) =>
      row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pch-merchants.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function avatarClass(index) {
  return ["purple-avatar", "blue-avatar", "green-avatar"][index % 3];
}

function monthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${date.getMonth()}`;
}
function parseFilterDate(value) {
  if (!value || value === '—') return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }
  const date = new Date(text); return Number.isNaN(date.getTime()) ? null : date;
}
function joinedMatch(merchant, value, from = '', to = '', now = new Date()) {
  if (!value) return true;
  const date = parseFilterDate(merchant.createdAt) || parseFilterDate(merchant.joined);
  if (!date) return false;
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let end = new Date(start);
  if (value === 'today') end.setDate(end.getDate() + 1);
  else if (value === 'week') { start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); end = new Date(start); end.setDate(end.getDate() + 7); }
  else if (value === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth() + 1, 1); }
  else if (value === 'custom') { start = parseFilterDate(from); end = parseFilterDate(to); if (!start || !end || start > end) return false; end.setDate(end.getDate() + 1); }
  else return true;
  return date >= start && date < end;
}
function CalendarField({ label, value, onChange, min, max }) {
  const input = useRef(null);
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>{label}
    <span style={{ display: 'flex', gap: 6 }}><input ref={input} type="date" value={value} min={min} max={max} onChange={event => onChange(event.target.value)} style={{ minWidth: 145, padding: '8px 10px', border: '1px solid #dfe3ea', borderRadius: 6, colorScheme: 'light' }} />
      <button type="button" aria-label={'Open ' + label.toLowerCase() + ' calendar'} onClick={() => { try { if (input.current.showPicker) input.current.showPicker(); else input.current.focus(); } catch { input.current.focus(); } }} style={{ padding: '8px 10px', border: '1px solid #dfe3ea', borderRadius: 6, background: '#fff' }}>▦</button></span>
  </label>;
}
function storeLimitFor(merchant, masterPlans) {
  const plan = String(merchant.plan || "").toLowerCase();

  const masterPlan = masterPlans.find((item) =>
    String(item.planName || item.name || "")
      .toLowerCase()
      .includes(plan),
  );

  const suppliedLimit =
    masterPlan?.maxStores ??
    masterPlan?.storeLimit ??
    masterPlan?.allowedStores ??
    masterPlan?.storeCount ??
    masterPlan?.stores;

  if (Number.isFinite(Number(suppliedLimit))) {
    return Number(suppliedLimit);
  }

  if (plan.includes("starter")) return 1;
  if (plan.includes("pro")) return 5;
  if (plan.includes("enterprise")) return null;

  return null;
}
// Pass your existing delete API function as deleteMerchant until its module contract is connected.
export default function Merchants({ deleteMerchant, localMerchants = [], onLocalDelete }) {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewedId = searchParams.get('view');
  function openView(merchant) {
    setSearchParams(previous => { const next = new URLSearchParams(previous); next.set('view', String(merchant.id)); return next; });
  }
  function closeView() {
    setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete('view'); return next; });
  }
  function openEdit(merchant) {
    try { nav('/merchants/' + encodeURIComponent(merchant.id) + '/edit', { state: { merchant } }); }
    catch (error) { setError('Unable to open editor: ' + error.message); }
  }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState('');
  const deleteDialog = useRef(null);
  const deleteInFlight = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (deleteTarget && deleteDialog.current && !deleteDialog.current.open) deleteDialog.current.showModal(); }, [deleteTarget]);
  async function confirmDelete() {
    if (deleteInFlight.current || !deleteTarget) return;
    if (typeof deleteMerchant !== 'function') { setDeleteError('The merchant delete API has not been connected. No record was deleted.'); return; }
    deleteInFlight.current = true; setDeleting(true); setDeleteError('');
    const target = deleteTarget;
    try {
      await deleteMerchant(target.id);
      onLocalDelete?.(target.id);
      if (!mounted.current) return;
      setMerchants(previous => previous.filter(item => item.id !== target.id));
      setNotice(target.name + ' was deleted.'); setDeleteTarget(null);
    } catch (error) { if (mounted.current) setDeleteError(error.message || 'Unable to delete merchant. Please try again.'); }
    finally { deleteInFlight.current = false; if (mounted.current) setDeleting(false); }
  }
  const { data: reference } = useReferenceData();
  const [masterPlans, setMasterPlans] = useState([]);
  useEffect(() => {
    let active = true;
    listSubscriptionPlans()
      .then((d) => {
        if (active) setMasterPlans(d.plans || []);
      })
      .catch(e => { if (active) setError(e.message); });
    return () => {
      active = false;
    };
  }, []);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [joinedRange, setJoinedRange] = useState(""); const [storeCount, setStoreCount] = useState(""); const [location, setLocation] = useState(""); const [page, setPage] = useState(1); const pageSize = 10;
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(''); const [dateTo, setDateTo] = useState('');
  const [draftFrom, setDraftFrom] = useState(''); const [draftTo, setDraftTo] = useState('');
  const [dateError, setDateError] = useState('');
  function openDateRange() { setDraftFrom(dateFrom); setDraftTo(dateTo); setDateError(''); setDatePickerOpen(true); }
  function applyDateRange() {
    const start = parseFilterDate(draftFrom), end = parseFilterDate(draftTo);
    if (!start || !end) { setDateError('Select both From and To dates.'); return; }
    if (start > end) { setDateError('To date must be on or after From date.'); return; }
    setDateFrom(draftFrom); setDateTo(draftTo); setJoinedRange('custom'); setPage(1); setDatePickerOpen(false);
  }
  const [apiMerchants, setMerchants] = useState([]);
  const merchants = useMemo(() => { const combined = new Map(apiMerchants.map(row => [String(row.id), row])); localMerchants.forEach(row => combined.set(String(row.id), row)); return [...combined.values()]; }, [apiMerchants, localMerchants]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMerchants() {
      setLoading(true);
      setError("");
      try {
        const rows = await listMerchants();
        if (!cancelled) setMerchants(rows);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load merchants from the API.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMerchants();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () =>
      merchants.filter(
        (m) =>
          (!q ||
            `${m.name} ${m.id} ${m.email}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (!status || m.status === status) &&
          (!plan || m.plan === plan) && (!storeCount || (storeCount === 'none' ? Number(m.stores) === 0 : storeCount === 'one' ? Number(m.stores) === 1 : Number(m.stores) > 1)) && (!location || `${m.country || ''} ${m.state || ''}`.trim() === location) && (!joinedRange || joinedMatch(m, joinedRange, dateFrom, dateTo)),
      ),
    [merchants, q, status, plan, joinedRange, storeCount, location, dateFrom, dateTo],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => { setPage(1); }, [q, status, plan, joinedRange, storeCount, location, dateFrom, dateTo]);
  useEffect(() => { setPage(previous => Math.min(previous, pageCount)); }, [pageCount]);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;
  const total = merchants.length;
  const activeCount = merchants.filter((m) => m.status === "Active").length;
  const suspendedCount = merchants.filter(
    (m) => m.status === "Suspended",
  ).length;
  const inactiveCount = merchants.filter((m) => m.status === "Inactive").length;
  const newThisMonth = merchants.filter(
    (m) => monthKey(m.createdAt) === thisMonth,
  ).length;
  const newLastMonth = merchants.filter(
    (m) => monthKey(m.createdAt) === lastMonth,
  ).length;
  const monthChange =
    newLastMonth === 0
      ? newThisMonth > 0
        ? "New this month"
        : "No new merchants"
      : `${Math.abs(Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100))}% vs last month`;
  const activePct = total
    ? `${((activeCount / total) * 100).toFixed(1)}% of total`
    : "0% of total";
  const inactivePct = total
    ? `${((inactiveCount / total) * 100).toFixed(1)}% of total`
    : "0% of total";

  const stat = [
    [
      "purple",
      "bi-people-fill",
      "Total Merchants",
      String(total),
      `${newThisMonth} this month`,
    ],
    [
      "green",
      "bi-check-circle-fill",
      "Active Merchants",
      String(activeCount),
      activePct,
    ],
    [
      "orange",
      "bi-pause-circle-fill",
      "Pending Setup",
      String(merchants.filter((m) => m.status === "Pending Setup").length),
      "Needs onboarding",
    ],
    [
      "blue",
      "bi-pause-circle-fill",
      "Suspended Merchants",
      String(suspendedCount),
      `${suspendedCount} currently`,
    ],
    [
      "red",
      "bi-x-circle-fill",
      "Inactive Merchants",
      String(inactiveCount),
      inactivePct,
    ],
  ];

  const plans = [...new Set(masterPlans.map((p) => p.planName))];
  const statuses = ["Pending Setup", "Active", "Suspended", "Inactive"];
  const locations = [...new Set(merchants.map(m => `${m.country || ''} ${m.state || ''}`.trim()).filter(Boolean))];

  if (viewedId) return <MerchantReadOnly key={viewedId} merchantId={viewedId}
    merchant={merchants.find(item => String(item.id) === viewedId)} onBack={closeView}
    onStores={() => nav(`/merchants/${encodeURIComponent(viewedId)}/stores`)} />;

  return (
    <div className="page-content">
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <div className="page-header">
        <div>
          <h1>Merchants</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>
              <i className="bi bi-chevron-right" />
            </span>
            <strong>Merchants</strong>
          </div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            type="button" onClick={() => nav("/merchants/new")}
          >
            <i className="bi bi-plus-lg" /> Add Merchant
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => exportMerchants(rows)}
          >
            <i className="bi bi-download" /> Export
          </button>
        </div>
      </div>
      <div className="row g-3 stats-grid">
        {stat.map((x, i) => (
          <div className="col-xl col-lg-4 col-md-6" key={x[2]}>
            <div className="stat-card">
              <div className={`stat-icon ${x[0]}`}>
                <i className={`bi ${x[1]}`} />
              </div>
              <div className="stat-content">
                <span>{x[2]}</span>
                <strong>{x[3]}</strong>
                <small
                  className={
                    i === 0 || i === 4 ? "positive" : i === 2 ? "negative" : ""
                  }
                >
                  <i
                    className={`bi ${i === 2 ? "bi-arrow-down" : "bi-arrow-up"}`}
                  />{" "}
                  {x[4]}
                </small>
                {(i === 1 || i === 3) && (
                  <div className={`progress ${i === 3 ? "red-progress" : ""}`}>
                    <div
                      style={{
                        width:
                          i === 1
                            ? `${total ? (activeCount / total) * 100 : 0}%`
                            : `${total ? (inactiveCount / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="merchant-table-card">
        <div className="filter-bar">
          <div className="merchant-search">
            <i className="bi bi-search" />
            <input
              id="merchantSearch"
              placeholder="Search merchants..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            id="statusFilter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={joinedRange} aria-label="Joined date filter" onChange={e => { if (e.target.value === 'custom') openDateRange(); else { setJoinedRange(e.target.value); setDatePickerOpen(false); } }}><option value="">Any Joined Date</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="custom">Custom Date Range</option></select>
          <select value={storeCount} onChange={e => setStoreCount(e.target.value)}><option value="">Any Store Count</option><option value="none">No Stores</option><option value="one">1 Store</option><option value="many">Multiple Stores</option></select>
          <select value={location} onChange={e => setLocation(e.target.value)}><option value="">All Locations</option>{locations.map(item => <option key={item}>{item}</option>)}</select>
          <select
            id="subscriptionFilter"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="">All Plans</option>
            {plans.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            className="filter-button"
            onClick={() => {
              setQ("");
              setStatus("");
              setPlan("");
              setJoinedRange(""); setDateFrom(""); setDateTo(""); setDraftFrom(""); setDraftTo(""); setDatePickerOpen(false); setDateError(""); setStoreCount(""); setLocation(""); setPage(1);
            }}
          >
            <i className="bi bi-arrow-counterclockwise" /> Reset
          </button>
        </div>
        {datePickerOpen && <section id="merchant-date-range" aria-label="Custom joined date range" style={{ padding: 16, background: '#f8f7ff', borderBottom: '1px solid #e1e4eb' }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
            <CalendarField label="From date" value={draftFrom} max={draftTo || undefined} onChange={value => { setDraftFrom(value); setDateError(''); }} />
            <CalendarField label="To date" value={draftTo} min={draftFrom || undefined} onChange={value => { setDraftTo(value); setDateError(''); }} />
            <button type="button" className="btn btn-primary" onClick={applyDateRange}>Apply date range</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setDatePickerOpen(false); setDateError(''); }}>Cancel</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setJoinedRange(''); setDateFrom(''); setDateTo(''); setDatePickerOpen(false); setDateError(''); setPage(1); }}>Clear dates</button>
          </div>{dateError && <p role="alert" style={{ color: '#b42318', margin: '10px 0 0' }}>{dateError}</p>}
        </section>}
        <div className="table-wrapper">
          <table className="merchant-table">
            <thead>
              <tr>
                <th>MERCHANT</th>
                <th>CONTACT</th><th>LOCATION</th>
                <th>STORES</th>
                <th>SUBSCRIPTION PLAN</th>
                <th>STATUS</th>
                <th>JOINED ON</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Loading merchants...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8}>{error}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>No merchants found.</td>
                </tr>
              ) : (
                visibleRows.map((m, index) => (
                  <tr key={m.id}>
                    <td>
                      <div
                        className="merchant-name clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => openView(m)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openView(m);
                          }
                        }}
                      >
                        <div
                          className={`merchant-avatar ${avatarClass(index)}`}
                        >
                          {m.initials}
                        </div>
                        <div>
                          <strong>{m.name}</strong>
                          <small>{m.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <strong>{m.email || "—"}</strong>
                        <span>{m.phone || "—"}</span>
                      </div>
                    </td>
                    <td><div className="contact-info"><strong>{m.state || "—"}</strong><span>{m.country || "—"}</span></div></td>
                    <td>
                      <strong>
                        {m.stores}
                        {storeLimitFor(m, masterPlans)
                          ? ` / ${storeLimitFor(m, masterPlans)}`
                          : ""}
                      </strong>
                    </td>
                    <td>
                      <div className="plan-info">
                        <strong>{m.plan}</strong>
                        {m.renewal ? <span>Renews on {m.renewal}</span> : null}
                      </div>
                    </td>
                    <td>
                      <span className={`status ${String(m.status || '').toLowerCase()}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>{m.joined}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="action-btn view-btn"
                          type="button"
                          onClick={() => openView(m)}
                          title="View merchant details"
                          aria-label={`View ${m.name} details`}
                        >
                          <i className="bi bi-eye" />
                        </button>
                        <button
                          type="button" className="action-btn edit-btn"
                          onClick={() => openEdit(m)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button type="button" className="action-btn text-danger" title="Delete" aria-label={`Delete ${m.name}`} disabled={deleting}
                          onClick={() => { setDeleteError(''); setDeleteTarget(m); }}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="merchant-pagination"><span>{rows.length ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, rows.length)} of ${rows.length}` : 'Showing 0 of 0'}</span><div><button type="button" disabled={currentPage === 1} onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'active' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" disabled={currentPage === pageCount} onClick={() => setPage(value => Math.min(pageCount, value + 1))}>Next</button></div></div>
      </div>
      {deleteTarget && <dialog className="merchant-delete-dialog" ref={deleteDialog} aria-labelledby="merchant-delete-title" onCancel={event => { event.preventDefault(); if (!deleting) setDeleteTarget(null); }}>
        <h2 id="merchant-delete-title">Delete merchant? </h2>
        <p><strong>{deleteTarget.name}</strong> · {deleteTarget.id}</p>
        <p>Confirm deletion of this merchant. Its linked stores and subscriptions will be handled according to your backend deletion rules.</p>
        {deleteError && <p className="alert alert-danger" role="alert">{deleteError}</p>}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary" autoFocus disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" disabled={deleting} onClick={confirmDelete}>{deleting ? 'Deleting…' : 'Delete merchant'}</button>
        </div>
      </dialog>}
    </div>
  );
}
