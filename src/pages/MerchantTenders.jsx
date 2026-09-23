import { useEffect, useRef, useState } from "react";
import "../styles/merchant-tenders.css";

const idOf = value => String(value && typeof value === "object" ? value.tenderId ?? value.id ?? value._id ?? "" : value ?? "");
const normalize = value => ({ ...value, id:idOf(value), name:value.name || value.tenderName || "Unnamed tender", code:value.code || value.tenderCode || "—", createdAt:formatDate(value.createdAt), updatedAt:formatDate(value.updatedAt), status:String(value.status || "Active") });
function formatDate(value) { if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString(); }

const active = tender => tender.status.toLowerCase() === "active";
const matches = (tender, query) => [tender.name,tender.code].join(" ").toLowerCase().includes(query.trim().toLowerCase());

// onSaveAssignments({merchantId, tenderIds}) must resolve only after saving succeeds.
export default function MerchantTenders({ merchantId, masterTenders = [], assignedTenderIds = [], onSaveAssignments, loading = false, error = "" }) {
  const [ids,setIds]=useState(()=>assignedTenderIds.map(idOf));
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(1);
  const [sort,setSort]=useState({key:"name",direction:1});
  const [modal,setModal]=useState(null);
  const [selection,setSelection]=useState([]);
  const [search,setSearch]=useState("");
  const [busy,setBusy]=useState(false);
  const [saveError,setSaveError]=useState("");
  const lock=useRef(false), dialog=useRef(null), addButton=useRef(null);
  const signature=JSON.stringify(assignedTenderIds.map(idOf));
  useEffect(()=>{setIds(JSON.parse(signature));setPage(1);setModal(null);},[merchantId,signature]);
  useEffect(()=>{if(modal){dialog.current?.showModal();}else if(dialog.current?.open){dialog.current.close();addButton.current?.focus();}},[modal]);
  const tenders=Array.from(new Map(masterTenders.map(normalize).filter(v=>v.id).map(v=>[v.id,v])).values());
  const assigned=ids.map(id=>tenders.find(v=>v.id===id) || {id,name:`Tender ${id}`,code:"—",createdAt:"—",updatedAt:"—",status:"Unavailable"});
  const rows=assigned.filter(v=>matches(v,query)).sort((a,b)=>String(a[sort.key]).localeCompare(String(b[sort.key]))*sort.direction);
  const pages=Math.max(1,Math.ceil(rows.length/10)), current=Math.min(page,pages);
  const available=tenders.filter(v=>!ids.includes(v.id)&&matches(v,search));
  const selectable=available.filter(active);
  const close=()=>{if(!lock.current){setModal(null);setSaveError("");}};
  async function save(next){
    if(lock.current)return;
    if(typeof onSaveAssignments!=="function"){setSaveError("Connect onSaveTenderAssignments to save merchant tender assignments.");return;}
    lock.current=true;setBusy(true);setSaveError("");
    try{await onSaveAssignments({merchantId,tenderIds:next});setIds(next);setModal(null);}catch(e){setSaveError(e.message || "Unable to save assignments.");}finally{lock.current=false;setBusy(false);}
  }
  const badge=v=><span className={`mt-badge ${active(v)?"mt-active":"mt-inactive"}`}>● {v.status}</span>;
  const name=v=><span className="mt-name"><span className="mt-avatar" aria-hidden="true">▤</span><strong>{v.name}</strong></span>;
  function headings(select=false){return <tr>{select&&<th><input type="checkbox" aria-label="Select all available active tenders in search" checked={selectable.length>0&&selectable.every(v=>selection.includes(v.id))} disabled={!selectable.length||busy} onChange={e=>setSelection(old=>e.target.checked?[...new Set([...old,...selectable.map(v=>v.id)])]:old.filter(id=>!selectable.some(v=>v.id===id)))}/></th>}{["name","code","status"].map(key=><th key={key}>{select?({name:"Tender",code:"Code",status:"Status"}[key]):<button className="mt-sort" onClick={()=>setSort(old=>({key,direction:old.key===key?-old.direction:1}))}>{key==="name"?"Tender":key[0].toUpperCase()+key.slice(1)} {sort.key===key?(sort.direction===1?"↑":"↓"):"↕"}</button>}</th>)}{!select&&<th>Actions</th>}</tr>;}
  return <div className="merchant-tenders">
    <header className="mt-card mt-header"><div><h2>Tenders</h2><p>These are the tenders connected to this merchant.</p></div><button ref={addButton} className="mt-primary" disabled={loading||!!error} onClick={()=>{setSelection([]);setSearch("");setSaveError("");setModal({type:"select"});}}>＋ Add Tender</button></header>
    <section className="mt-card"><h3>Tender List</h3><div className="mt-toolbar"><input aria-label="Search assigned tenders" placeholder="Search tenders by name or code…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/><button onClick={()=>{setQuery("");setPage(1);setSort({key:"name",direction:1});}}>↺ Reset</button></div>
    {loading?<p role="status">Loading tenders…</p>:error?<p role="alert">{error}</p>:<><div className="mt-scroll"><table><thead>{headings()}</thead><tbody>{rows.slice((current-1)*10,current*10).map(v=><tr key={v.id}><td>{name(v)}</td><td>{v.code}</td><td>{badge(v)}</td><td><div className="mt-actions"><button aria-label={`View ${v.name}`} onClick={()=>setModal({type:"view",tender:v})}>View</button><button aria-label={`Remove ${v.name} assignment`} onClick={()=>{setSaveError("");setModal({type:"remove",tender:v});}}>Remove</button></div></td></tr>)}{!rows.length&&<tr><td colSpan={4}>No assigned tenders match. Use Add Tender to select from master data.</td></tr>}</tbody></table></div><footer className="mt-footer"><span>Showing {rows.length?(current-1)*10+1:0} to {Math.min(current*10,rows.length)} of {rows.length} entries</span><div><button disabled={current===1} onClick={()=>setPage(current-1)} aria-label="Previous page">‹</button><span className="mt-page">{current} / {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)} aria-label="Next page">›</button></div></footer></>}
    </section>
    <dialog className="mt-dialog" ref={dialog} aria-labelledby="mt-dialog-title" onCancel={e=>{e.preventDefault();close();}}>
      <div className="merchant-tenders"><header className="mt-header"><div><h2 id="mt-dialog-title">{modal?.type==="select"?"Select Tender":modal?.type==="remove"?"Remove tender assignment":"Tender Details"}</h2><p>{modal?.type==="select"?"Choose one or more tenders to add to this merchant.":modal?.type==="remove"?"The tender remains available in Master Data.":"Read-only master tender details."}</p></div><button aria-label="Close" disabled={busy} onClick={close}>×</button></header>
      {modal?.type==="select"?<><input className="mt-search" autoFocus aria-label="Search master tenders" placeholder="Search tenders by name or code…" value={search} disabled={busy} onChange={e=>setSearch(e.target.value)}/><div className="mt-scroll mt-options"><table><thead>{headings(true)}</thead><tbody>{available.map(v=><tr key={v.id}><td><input type="checkbox" aria-label={`Select ${v.name}`} disabled={busy||!active(v)} checked={selection.includes(v.id)} onChange={e=>setSelection(old=>e.target.checked?[...old,v.id]:old.filter(id=>id!==v.id))}/></td><td>{name(v)}</td><td>{v.code}</td><td>{badge(v)}</td></tr>)}{!available.length&&<tr><td colSpan={5}>No unassigned tenders found in master data.</td></tr>}</tbody></table></div></>:modal?.tender&&<dl className="mt-details">{Object.entries({Tender:modal.tender.name,Code:modal.tender.code,Status:modal.tender.status,Created:modal.tender.createdAt,Updated:modal.tender.updatedAt}).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      {saveError&&<p role="alert" className="mt-error">{saveError}</p>}
      <footer className="mt-footer"><span>{modal?.type==="select"?`${selection.length} tenders selected`:""}</span><div><button disabled={busy} onClick={close}>{modal?.type==="view"?"Close":"Cancel"}</button>{modal?.type==="select"&&<button className="mt-primary" disabled={busy||!selection.length} onClick={()=>save([...new Set([...ids,...selection.filter(id=>tenders.some(v=>v.id===id&&active(v)))])])}>{busy?"Saving…":"Add Selected"}</button>}{modal?.type==="remove"&&<button className="mt-primary" disabled={busy} onClick={()=>save(ids.filter(id=>id!==modal.tender.id))}>{busy?"Saving…":"Remove Assignment"}</button>}</div></footer></div>
    </dialog>
  </div>;
}
