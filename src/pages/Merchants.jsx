import MerchantTenders from "./MerchantTenders";
import MerchantVendors from "./MerchantVendors";
import MerchantStores from "./MerchantStores";
import AddMerchantDevice from "./AddMerchantDevice";
import { MerchantEmployeeForm } from "./AddMerchantEmployee";
import { useReferenceData } from "../api/referenceData";
import { listSubscriptionPlans } from "../api/subscriptions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listMerchants, getMerchant } from "../api/merchants";
import { listMerchantEmployees } from "../api/employees";
import { ApiError } from "../api/http";
import "../styles/merchants.css";

function readValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return typeof value === 'object' ? (value.name || value.label || '—') : String(value);
}
function ViewSection({ title, children, actions }) {
  return <section className="merchant-view-section">{actions ? <div className="merchant-section-heading"><h2>{title}</h2>{actions}</div> : <h2>{title}</h2>}{children}</section>;
}
function ViewFields({ items }) {
  return <dl className="merchant-view-fields">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{readValue(value)}</dd></div>)}</dl>;
}
function ViewTable({ headings, rows }) {
  return rows.length ? <div className="table-wrapper"><table className="merchant-table"><thead><tr>{headings.map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{readValue(cell)}</td>)}</tr>)}</tbody></table></div> : <p className="merchant-view-empty">No records provided.</p>;
}
function MerchantReadOnly({ merchantId, merchant, onBack, onSaveEmployee, onSaveDevice, masterVendors, vendorAssignments, onSaveVendorAssignments, vendorsLoading, vendorsError, masterTenders, tenderAssignments, onSaveTenderAssignments, tendersLoading, tendersError }) {
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [createdEmployees, setCreatedEmployees] = useState([]);
  async function saveEmployeeAndRefresh(values) {
    if(typeof onSaveEmployee !== 'function') throw new Error('Connect onSaveEmployee to your employee creation API.');
    const result=await onSaveEmployee(values);
    if(result?.success===false)throw new Error(result.message || 'Employee creation failed.');
    const record=result?.employee || result?.data?.employee || result?.data || result;
    // Never retain password, login PIN, or temporary photo URL in the list.
    const source=record && typeof record==='object' && !Array.isArray(record) ? record : {};
    const employee={id:source.id || source.employeeId || source.employeeCode || crypto.randomUUID(), employeeCode:source.employeeCode || '', merchantId:apiMerchantId,
      name:source.name || source.employeeName || [values.firstName,values.lastName].filter(Boolean).join(' '),
      email:source.email || values.email,phone:source.phone || source.phoneNumber || values.phone,
      gender:source.gender || values.gender,username:source.username || values.username,
      status:source.status || 'Not provided',createdAt:source.createdAt || new Date().toISOString()};
    setCreatedEmployees(old=>[employee,...old.filter(item=>String(item.id)!==String(employee.id))]);
    return result;
  }
  const [addingDevice, setAddingDevice] = useState(false);
  const [createdDevices,setCreatedDevices]=useState([]);
  async function saveDeviceAndRefresh(values) {
    if(typeof onSaveDevice!=='function')throw new Error('Connect onSaveDevice to your device creation API.');
    const result=await onSaveDevice(values);
    if(result?.success===false)throw new Error(result.message || 'Device creation failed.');
    const returned=result?.device || result?.data?.device || result?.data || result;
    const record=returned && typeof returned==='object' && !Array.isArray(returned)?returned:{};
    const device={id:record.id || record.deviceId || crypto.randomUUID(),merchantId,name:record.name || record.deviceName || values.deviceName,type:record.type || record.deviceType || values.deviceType,serialNumber:record.serialNumber || record.serial || values.serialNumber,storeId:record.storeId || values.storeId,storeName:record.storeName,status:record.connectionStatus || record.status || values.status || 'Unknown'};
    setCreatedDevices(old=>[device,...old.filter(item=>String(item.id)!==String(device.id))]);return result;
  }
  const navigate = useNavigate();
  const openMerchantCreation = path => navigate(path + '?merchantId=' + encodeURIComponent(merchantId), {
    state: { merchantId, merchant },
  });
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = [['overview', 'Overview'], ['subscription', 'Subscription & Usage'], ['stores', 'Stores'], ['employees', 'Employees'], ['devices', 'Devices'], ['vendors', 'Vendors'], ['tenders', 'Tenders'], ['roles', 'Roles & Permissions'], ['payments', 'Payment History']];
  function tabKeyDown(event, index) {
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
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
  const [apiEmployees, setApiEmployees] = useState(null);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState('');
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
  const merchantIds = [merchant?.merchantId, result?.merchant?.merchantId, raw.merchantId, raw.id, merchantId].filter(Boolean);
  const apiMerchantId = merchantIds.find(value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value))) || merchantIds[0];
  useEffect(() => {
    let active = true;
    setEmployeesLoading(true);
    setEmployeesError('');
    setApiEmployees(null);
    listMerchantEmployees(apiMerchantId).then(value => {
      if (active) setApiEmployees(value);
    }).catch(failure => {
      if (active) setEmployeesError(failure.message || 'Unable to load merchant employees.');
    }).finally(() => {
      if (active) setEmployeesLoading(false);
    });
    return () => { active = false; };
  }, [apiMerchantId]);
  const saved = draft || raw._onboarding;
  const summary = { ...(result?.merchant || {}), ...(merchant || {}) };
  const contact = saved?.merchant || raw;
  const subscription = result?.subscription || raw.subscription || response.subscription || {};
  const address = contact.address || raw.businessAddress || {};
  const list = value => Array.isArray(value) ? value : [];
  const stores = list(saved?.stores ?? response.stores ?? raw.stores);
  const employeeRecords = apiEmployees ?? saved?.employees ?? raw.employees ?? response.employees ?? response.data?.employees ?? merchant?.employees;
  const employeeRows = list(employeeRecords).filter(employee=>!createdEmployees.some(item=>String(item.id)===String(employee.id || employee.employeeId) || (item.email && item.email===employee.email)));
  const employees = [...createdEmployees, ...employeeRows].filter(employee => {
    if (apiEmployees) return true;
    const ownerId = employee.merchantId ?? employee.merchant?.id;
    return ownerId == null || String(ownerId) === String(apiMerchantId);
  });
  const employeeStoreName = employee => employee.storeName || employee.store?.name || stores.find(store =>
    [store.id, store.storeId, store.code, store.storeCode].some(id => id != null && String(id) === String(employee.storeId))
  )?.name || employee.storeId;
  const devices = [...createdDevices,...list(saved?.devices ?? raw.devices ?? response.devices).filter(device=>!createdDevices.some(item=>String(item.id)===String(device.id || device.deviceId) || (item.serialNumber && item.serialNumber===(device.serialNumber || device.serial))))].filter(device=>device.merchantId==null || String(device.merchantId)===String(merchantId));
  const roles = list(saved?.roles ?? raw.roles ?? response.roles);
  const payments = list(saved?.paymentHistory ?? raw.paymentHistory);
  const business = contact.business || raw.legalBusinessName || raw.businessName || summary.name;
  const storeName = device => device.storeName || stores.find(store=>device.storeId!=null && [store.id,store.code,store.storeId].some(id=>id!=null && String(id)===String(device.storeId)))?.name || (saved && typeof device.store==='number' ? stores[device.store]?.name : '') || device.storeId || '—';
  return <div className="page-content merchant-readonly">
    <style>{`
      .merchant-readonly .merchant-detail-actions{display:flex;flex-direction:column;align-items:stretch;gap:10px;min-width:200px;}
      .merchant-readonly .merchant-detail-actions .btn{display:flex;align-items:center;justify-content:flex-start;gap:8px;margin:0;width:100%;}
      @media(max-width:650px){.merchant-readonly .page-header{flex-wrap:wrap;gap:16px;}.merchant-readonly .merchant-detail-actions{width:100%;}}
      .merchant-readonly .merchant-view-section{background:#fff;border:1px solid #e1e4eb;border-radius:10px;margin-bottom:16px;overflow:hidden;}
      .merchant-readonly .merchant-view-section h2{font-size:17px;padding:16px 20px;margin:0;border-bottom:1px solid #edf0f4;color:#17233e;}
      .merchant-readonly .merchant-view-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 28px;padding:20px;margin:0;}
      .merchant-readonly .merchant-view-fields dt{font-weight:500;color:#7c8495;font-size:13px;margin-bottom:5px;}
      .merchant-readonly .merchant-view-fields dd{margin:0;color:#17233e;font-size:15px;overflow-wrap:anywhere;}
      .merchant-readonly .merchant-view-empty{padding:16px 20px;color:#7c8495;margin:0;}
      .merchant-readonly .merchant-view-back{border:0;background:none;color:#5143bc;padding:0;margin-bottom:12px;cursor:pointer;}
      .merchant-readonly .merchant-view-section details{padding:14px 20px;border-top:1px solid #edf0f4;}
      .merchant-readonly .merchant-view-section summary{cursor:pointer;color:#5143bc;}
      .merchant-readonly .merchant-view-layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:20px;align-items:start;}
      .merchant-readonly .merchant-view-layout > [role="tabpanel"]{grid-column:2;grid-row:1;min-width:0;}
      .merchant-readonly .merchant-view-tabs{display:flex;flex-direction:column;gap:4px;border:1px solid #e1e4eb;border-radius:10px;padding:8px;background:#fff;}
      .merchant-readonly .merchant-view-tabs button{flex:none;white-space:nowrap;border:0;border-left:3px solid transparent;text-align:left;background:transparent;padding:14px 18px;color:#758096;font-size:14px;cursor:pointer;}
      .merchant-readonly .merchant-view-tabs button[aria-selected="true"]{color:#5143bc;border-left-color:#5143bc;font-weight:600;background:#f8f7ff;}
      .merchant-readonly .merchant-view-tabs button:focus-visible{outline:2px solid #5143bc;outline-offset:-4px;}
      .merchant-readonly [role="tabpanel"][hidden]{display:none;}
      @media(max-width:650px){.merchant-readonly .merchant-view-fields{grid-template-columns:1fr;}.merchant-readonly .merchant-view-layout{grid-template-columns:1fr;}.merchant-readonly .merchant-view-layout > [role="tabpanel"]{grid-column:1;grid-row:2;}}
    `}</style>
    <button type="button" className="merchant-view-back" onClick={onBack}>← Merchants</button>
    <div className="page-header"><div><h1>Merchant Details</h1><p>{readValue(business)} · {merchantId}</p></div>
    </div>
    {loading ? <p role="status">Loading merchant details…</p> : error ? <div className="alert alert-danger" role="alert">{error} <button type="button" className="btn btn-secondary" onClick={() => setAttempt(value => value + 1)}>Retry</button></div> : <div className="merchant-view-layout">
      <div className="merchant-view-tabs" role="tablist" aria-orientation="vertical" aria-label="Merchant details">
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
          ['Registered Employees', Array.isArray(employeeRecords) ? employees.length : saved?.employeeCount ?? raw.employeeCount ?? summary.employeeCount],
          ['Employee Allowance', summary.employeeLimit ?? subscription.employeeLimit],
        ]} /></ViewSection>
      </div>
      <div role="tabpanel" id="merchant-panel-stores" aria-labelledby="merchant-tab-stores" hidden={activeTab !== 'stores'} tabIndex={0}>
        {activeTab === 'stores' && <MerchantStores merchantId={merchantId} embedded />}
      </div>
      <div role="tabpanel" id="merchant-panel-vendors" aria-labelledby="merchant-tab-vendors" hidden={activeTab !== 'vendors'} tabIndex={0}>
        <MerchantVendors merchantId={merchantId} masterVendors={masterVendors} assignedVendorIds={vendorAssignments?.[merchantId] ?? saved?.vendorIds ?? raw.vendorIds ?? raw.vendors ?? []} onSaveAssignments={onSaveVendorAssignments} loading={vendorsLoading} error={vendorsError}/>
      </div>
      <div role="tabpanel" id="merchant-panel-tenders" aria-labelledby="merchant-tab-tenders" hidden={activeTab !== 'tenders'} tabIndex={0}>
        <MerchantTenders merchantId={merchantId} masterTenders={masterTenders} assignedTenderIds={tenderAssignments?.[merchantId] ?? saved?.tenderIds ?? raw.tenderIds ?? raw.tenders ?? []} onSaveAssignments={onSaveTenderAssignments} loading={tendersLoading} error={tendersError}/>
      </div>
      <div role="tabpanel" id="merchant-panel-employees" aria-labelledby="merchant-tab-employees" hidden={activeTab !== 'employees'} tabIndex={0}>
        {employeesError && <div className="alert alert-danger" role="alert">{employeesError}</div>}
        {employeesLoading && <p role="status">Loading employees...</p>}
        {addingEmployee ? <ViewSection title="Add Employee" actions={<button type="button" className="merchant-back-employees" onClick={()=>setAddingEmployee(false)}>← Back to Employees</button>}>
          <MerchantEmployeeForm embedded key={apiMerchantId} merchantId={apiMerchantId} initialMerchant={merchant} onSave={saveEmployeeAndRefresh} onBack={()=>setAddingEmployee(false)}/>
        </ViewSection> : <MerchantEmployeeList employees={employees} merchantName={business} onAdd={()=>setAddingEmployee(true)}/>}

      </div>
      <div role="tabpanel" id="merchant-panel-devices" aria-labelledby="merchant-tab-devices" hidden={activeTab !== 'devices'} tabIndex={0}>
        {addingDevice ? <ViewSection title="Add Device" actions={<button type="button" className="merchant-back-employees" onClick={()=>setAddingDevice(false)}>← Back to Devices</button>}>
          <AddMerchantDevice key={merchantId} merchantId={merchantId} merchant={merchant} onSave={saveDeviceAndRefresh} onBack={()=>setAddingDevice(false)}/>
        </ViewSection> : <MerchantDeviceList devices={devices} storeName={storeName} onAdd={()=>setAddingDevice(true)}/>}

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
    </div>}
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
export default function Merchants({ deleteMerchant, localMerchants = [], onLocalDelete, onSaveEmployee, onSaveDevice, masterVendors = [], vendorAssignments = {}, onSaveVendorAssignments, vendorsLoading = false, vendorsError = "", masterTenders = [], tenderAssignments = {}, onSaveTenderAssignments, tendersLoading = false, tendersError = "" }) {
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

  if (viewedId) return <MerchantReadOnly masterTenders={masterTenders} tenderAssignments={tenderAssignments} onSaveTenderAssignments={onSaveTenderAssignments} tendersLoading={tendersLoading} tendersError={tendersError} masterVendors={masterVendors} vendorAssignments={vendorAssignments} onSaveVendorAssignments={onSaveVendorAssignments} vendorsLoading={vendorsLoading} vendorsError={vendorsError} key={viewedId} merchantId={viewedId} onSaveEmployee={onSaveEmployee} onSaveDevice={onSaveDevice}
    merchant={merchants.find(item => String(item.id) === viewedId)} onBack={closeView}
    />;

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

function MerchantEmployeeList({employees,merchantName,onAdd}) {
  const blank={query:''};
  const [filters,setFilters]=useState(blank),[page,setPage]=useState(1),[view,setView]=useState(null);
  const dialog=useRef(null),lastFocus=useRef(null);
  useEffect(()=>{if(view)dialog.current?.showModal();else if(dialog.current?.open){dialog.current.close();lastFocus.current?.focus();}},[view]);
  const employeeName=e=>e.name || e.employeeName || [e.firstName,e.lastName].filter(Boolean).join(' ') || '—';
  const storeNames=e=>[e.storeName,e.store?.name,...(Array.isArray(e.stores)?e.stores.map(v=>typeof v==='string'?v:v.name || v.storeName):[])].filter(Boolean);
  const assignedStoreCount=e=>{if(Array.isArray(e?.stores)) return e.stores.length;if(e?.assignedStoreCount!==undefined&&e?.assignedStoreCount!==null)return Number(e.assignedStoreCount);if(e?.assignedStoresCount!==undefined&&e?.assignedStoresCount!==null)return Number(e.assignedStoresCount);if(e?.storeId||e?.store_id||e?.storeName||e?.store?.name)return 1;return 0;};
  const roleNames=e=>[e.roleName,typeof e.role==='string'?e.role:e.role?.name,...(Array.isArray(e.roles)?e.roles.map(v=>typeof v==='string'?v:v.name || v.roleName):[])].filter(Boolean);
  const update=(key,value)=>{setFilters(old=>({...old,[key]:value}));setPage(1);};
  const filtered=employees.filter(e=>[employeeName(e),e.id,e.employeeCode,e.username,e.phone,e.phoneNumber,e.email].join(' ').toLowerCase().includes(filters.query.trim().toLowerCase())).sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
  const pages=Math.max(1,Math.ceil(filtered.length/10)),current=Math.min(page,pages);
  return <div className="mel"><header className="mel-card mel-heading"><div><h2>Employees</h2><p>These are the employees connected to this merchant.</p></div><button className="mel-primary" onClick={onAdd}>＋ Add Employee</button></header>
    <section className="mel-card"><h3>Employee List</h3><div className="mel-search"><input aria-label="Search employees" placeholder="Search employee, ID, username, phone or email…" value={filters.query} onChange={e=>update('query',e.target.value)}/><button onClick={()=>{setFilters(blank);setPage(1);}}>↺ Reset</button></div>
    <div className="mel-scroll"><table><thead><tr>{['Employee','Email','Phone','Gender','Assigned Stores','Actions'].map(title=><th key={title}>{title}</th>)}</tr></thead><tbody>{filtered.slice((current-1)*10,current*10).map((e,index)=><tr key={e.id || e.employeeCode || index}><td><strong>{employeeName(e)}</strong>{e.employeeCode&&<small>{e.employeeCode}</small>}</td><td>{e.email || '—'}</td><td>{e.phone || e.phoneNumber || '—'}</td><td>{e.gender || '—'}</td><td>{assignedStoreCount(e)}</td><td><button aria-label={'View '+employeeName(e)} onClick={event=>{lastFocus.current=event.currentTarget;setView(e);}}>View</button></td></tr>)}{!filtered.length&&<tr><td colSpan={6}>No employees found for this merchant.</td></tr>}</tbody></table></div>
      <footer><span>Showing {filtered.length?(current-1)*10+1:0} to {Math.min(current*10,filtered.length)} of {filtered.length} entries</span><div className="mel-pages"><button disabled={current===1} onClick={()=>setPage(current-1)}>‹</button><span>{current} / {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)}>›</button></div></footer>
    </section>
    <dialog ref={dialog} className="mel-dialog" aria-labelledby="mel-title" onCancel={event=>{event.preventDefault();setView(null);}}><header className="mel-heading"><h2 id="mel-title">Employee Details</h2><button onClick={()=>setView(null)} aria-label="Close employee details">×</button></header>{view&&<dl>{Object.entries({Name:employeeName(view),Email:view.email,Phone:view.phone || view.phoneNumber,Username:view.username,Gender:view.gender,Status:view.status,'Assigned Stores':assignedStoreCount(view),Roles:roleNames(view).join(', ')}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value || '—'}</dd></div>)}</dl>}</dialog>
  </div>;
}

function MerchantDeviceList({devices,storeName,onAdd}) {
  const [query,setQuery]=useState(''),[page,setPage]=useState(1),[sort,setSort]=useState({key:'name',direction:1}),[view,setView]=useState(null);
  const dialog=useRef(null),lastFocus=useRef(null);
  useEffect(()=>{if(view)dialog.current?.showModal();else if(dialog.current?.open){dialog.current.close();lastFocus.current?.focus();}},[view]);
  const rows=devices.map(d=>({...d,name:d.name || d.deviceName || '—',type:d.type || d.deviceType || '—',storeLabel:storeName(d),serial:d.serial || d.serialNumber || '—',status:d.connectionStatus || d.status || 'Unknown'})).filter(d=>[d.name,d.type,d.serial,d.storeLabel].join(' ').toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>String(a[sort.key]).localeCompare(String(b[sort.key]))*sort.direction);
  const pages=Math.max(1,Math.ceil(rows.length/10)),current=Math.min(page,pages);
  const badge=value=>['online','active'].includes(String(value).toLowerCase())?'mdl-good':['offline','inactive'].includes(String(value).toLowerCase())?'mdl-off':'mdl-unknown';
  return <div className="mdl"><header className="mdl-card mdl-header"><div><h2>Devices</h2><p>These are the devices connected to this merchant.</p></div><button className="mdl-primary" onClick={onAdd}>＋ Add Device</button></header>
    <section className="mdl-card"><h3>Device List</h3><div className="mdl-toolbar"><input aria-label="Search devices" placeholder="Search devices by name, type or serial…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/><button onClick={()=>{setQuery('');setPage(1);setSort({key:'name',direction:1});}}>↺ Reset</button></div>
    <div className="mdl-scroll"><table><thead><tr>{[['name','Device'],['type','Type'],['storeLabel','Store'],['serial','Serial No.'],['status','Status']].map(([key,title])=><th key={key} aria-sort={sort.key===key?(sort.direction===1?'ascending':'descending'):'none'}><button className="mdl-sort" onClick={()=>setSort(old=>({key,direction:old.key===key?-old.direction:1}))}>{title} {sort.key===key?(sort.direction===1?'↑':'↓'):'↕'}</button></th>)}<th>Actions</th></tr></thead><tbody>{rows.slice((current-1)*10,current*10).map((d,index)=><tr key={d.id || d.deviceId || index}><td><span className="mdl-name"><span className="mdl-icon" aria-hidden="true">▣</span><strong>{d.name}</strong></span></td><td>{d.type}</td><td>{d.storeLabel}</td><td>{d.serial}</td><td><span className={'mdl-badge '+badge(d.status)}>● {d.status}</span></td><td><button aria-label={'View '+d.name} onClick={e=>{lastFocus.current=e.currentTarget;setView(d);}}>View</button></td></tr>)}{!rows.length&&<tr><td colSpan={6}>No devices found for this merchant.</td></tr>}</tbody></table></div>
    <footer><span>Showing {rows.length?(current-1)*10+1:0} to {Math.min(current*10,rows.length)} of {rows.length} entries</span><div><button aria-label="Previous page" disabled={current===1} onClick={()=>setPage(current-1)}>‹</button><span>{current} / {pages}</span><button aria-label="Next page" disabled={current===pages} onClick={()=>setPage(current+1)}>›</button></div></footer></section>
    <dialog className="mdl-dialog" ref={dialog} aria-labelledby="mdl-title" onCancel={e=>{e.preventDefault();setView(null);}}><header className="mdl-header"><h2 id="mdl-title">Device Details</h2><button aria-label="Close device details" onClick={()=>setView(null)}>×</button></header>{view&&<dl>{Object.entries({Device:view.name,Type:view.type,Store:view.storeLabel,'Serial No.':view.serial,Status:view.status,'Device ID':view.id || view.deviceId}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value || '—'}</dd></div>)}</dl>}</dialog>
  </div>;
}