import { useReferenceData } from "../api/referenceData";
import { listSubscriptionPlans } from "../api/subscriptions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMerchants } from "../api/merchants";
import { ApiError } from "../api/http";
import "../styles/merchants.css";


function exportMerchants(rows) {
  if (!rows.length) {
    alert("There are no merchants to export.");
    return;
  }
  const headaer = [
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
  if(!value || value==='—') return null;
  const text=String(value).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year,month,day]=text.split('-').map(Number);
    const date=new Date(year,month-1,day);
    return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
  }
  const date=new Date(text);return Number.isNaN(date.getTime())?null:date;
}
function joinedMatch(merchant, value, from='', to='', now=new Date()) {
  if(!value) return true;
  const date=parseFilterDate(merchant.createdAt)||parseFilterDate(merchant.joined);
  if(!date) return false;
  let start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  let end=new Date(start);
  if(value==='today') end.setDate(end.getDate()+1);
  else if(value==='week') {start.setDate(start.getDate()-((start.getDay()+6)%7));end=new Date(start);end.setDate(end.getDate()+7);}
  else if(value==='month') {start=new Date(now.getFullYear(),now.getMonth(),1);end=new Date(now.getFullYear(),now.getMonth()+1,1);}
  else if(value==='custom') {start=parseFilterDate(from);end=parseFilterDate(to);if(!start||!end||start>end)return false;end.setDate(end.getDate()+1);}
  else return true;
  return date>=start&&date<end;
}
function CalendarField({label,value,onChange,min,max}) {
  const input=useRef(null);
  return <label style={{display:'flex',flexDirection:'column',gap:6,minWidth:180}}>{label}
    <span style={{display:'flex',gap:6}}><input ref={input} type="date" value={value} min={min} max={max} onChange={event=>onChange(event.target.value)} style={{minWidth:145,padding:'8px 10px',border:'1px solid #dfe3ea',borderRadius:6,colorScheme:'light'}}/>
      <button type="button" aria-label={'Open '+label.toLowerCase()+' calendar'} onClick={()=>{try {if(input.current.showPicker)input.current.showPicker();else input.current.focus();}catch {input.current.focus();}}} style={{padding:'8px 10px',border:'1px solid #dfe3ea',borderRadius:6,background:'#fff'}}>▦</button></span>
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
  const [datePickerOpen,setDatePickerOpen]=useState(false);
  const [dateFrom,setDateFrom]=useState('');const [dateTo,setDateTo]=useState('');
  const [draftFrom,setDraftFrom]=useState('');const [draftTo,setDraftTo]=useState('');
  const [dateError,setDateError]=useState('');
  function openDateRange(){setDraftFrom(dateFrom);setDraftTo(dateTo);setDateError('');setDatePickerOpen(true);}
  function applyDateRange(){
    const start=parseFilterDate(draftFrom),end=parseFilterDate(draftTo);
    if(!start||!end){setDateError('Select both From and To dates.');return;}
    if(start>end){setDateError('To date must be on or after From date.');return;}
    setDateFrom(draftFrom);setDateTo(draftTo);setJoinedRange('custom');setPage(1);setDatePickerOpen(false);
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
  const currentPage=Math.min(page,pageCount);
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(()=>{setPage(1);},[q,status,plan,joinedRange,storeCount,location,dateFrom,dateTo]);
  useEffect(()=>{setPage(previous=>Math.min(previous,pageCount));},[pageCount]);

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
          <select value={joinedRange} aria-label="Joined date filter" onChange={e => {if(e.target.value==='custom')openDateRange();else {setJoinedRange(e.target.value);setDatePickerOpen(false);}}}><option value="">Any Joined Date</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="custom">Custom Date Range</option></select>
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
        {datePickerOpen&&<section id="merchant-date-range" aria-label="Custom joined date range" style={{padding:16,background:'#f8f7ff',borderBottom:'1px solid #e1e4eb'}}>
          <div style={{display:'flex',alignItems:'end',gap:12,flexWrap:'wrap'}}>
            <CalendarField label="From date" value={draftFrom} max={draftTo||undefined} onChange={value=>{setDraftFrom(value);setDateError('');}}/>
            <CalendarField label="To date" value={draftTo} min={draftFrom||undefined} onChange={value=>{setDraftTo(value);setDateError('');}}/>
            <button type="button" className="btn btn-primary" onClick={applyDateRange}>Apply date range</button>
            <button type="button" className="btn btn-secondary" onClick={()=>{setDatePickerOpen(false);setDateError('');}}>Cancel</button>
            <button type="button" className="btn btn-secondary" onClick={()=>{setJoinedRange('');setDateFrom('');setDateTo('');setDatePickerOpen(false);setDateError('');setPage(1);}}>Clear dates</button>
          </div>{dateError&&<p role="alert" style={{color:'#b42318',margin:'10px 0 0'}}>{dateError}</p>}
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
                        onClick={() => nav(`/merchants/${encodeURIComponent(m.id)}/stores`)}
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
                          onClick={() => nav(`/merchants/${encodeURIComponent(m.id)}/stores`)}
                          title="View"
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
