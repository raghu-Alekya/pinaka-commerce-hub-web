import { useEffect, useRef, useState } from "react";
import "../styles/merchant-vendors.css";

const idOf = value => String(typeof value === "object" ? value.vendorId ?? value.id ?? value._id ?? "" : value ?? "");
const normalize = value => ({ ...value, id:idOf(value), name:value.name || value.vendorName || "Unnamed vendor", type:value.type || value.vendorType || "—", contact:value.contactName || value.contactPerson?.name || (typeof value.contactPerson === "string" ? value.contactPerson : "") || "—", status:String(value.status || "Active") });
const active = vendor => vendor.status.toLowerCase() === "active";
const matches = (vendor, query) => [vendor.name,vendor.type,vendor.contact,vendor.email,vendor.phone].join(" ").toLowerCase().includes(query.trim().toLowerCase());

// onSaveAssignments({merchantId, vendorIds}) must resolve only after saving succeeds.
export default function MerchantVendors({ merchantId, masterVendors = [], assignedVendorIds = [], onSaveAssignments, loading = false, error = "" }) {
  const [ids,setIds]=useState(()=>assignedVendorIds.map(idOf));
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(1);
  const [sort,setSort]=useState({key:"name",direction:1});
  const [modal,setModal]=useState(null);
  const [selection,setSelection]=useState([]);
  const [search,setSearch]=useState("");
  const [busy,setBusy]=useState(false);
  const [saveError,setSaveError]=useState("");
  const lock=useRef(false), dialog=useRef(null), addButton=useRef(null);
  const signature=JSON.stringify(assignedVendorIds.map(idOf));
  useEffect(()=>{setIds(JSON.parse(signature));setPage(1);setModal(null);},[merchantId,signature]);
  useEffect(()=>{if(modal){dialog.current?.showModal();}else if(dialog.current?.open){dialog.current.close();addButton.current?.focus();}},[modal]);
  const vendors=Array.from(new Map(masterVendors.map(normalize).filter(v=>v.id).map(v=>[v.id,v])).values());
  const assigned=ids.map(id=>vendors.find(v=>v.id===id) || {id,name:`Vendor ${id}`,type:"—",contact:"—",status:"Unavailable"});
  const rows=assigned.filter(v=>matches(v,query)).sort((a,b)=>String(a[sort.key]).localeCompare(String(b[sort.key]))*sort.direction);
  const pages=Math.max(1,Math.ceil(rows.length/10)), current=Math.min(page,pages);
  const available=vendors.filter(v=>!ids.includes(v.id)&&matches(v,search));
  const selectable=available.filter(active);
  const close=()=>{if(!lock.current){setModal(null);setSaveError("");}};
  async function save(next){
    if(lock.current)return;
    if(typeof onSaveAssignments!=="function"){setSaveError("Connect onSaveVendorAssignments to save merchant vendor assignments.");return;}
    lock.current=true;setBusy(true);setSaveError("");
    try{await onSaveAssignments({merchantId,vendorIds:next});setIds(next);setModal(null);}catch(e){setSaveError(e.message || "Unable to save assignments.");}finally{lock.current=false;setBusy(false);}
  }
  const badge=v=><span className={`mv-badge ${active(v)?"mv-active":"mv-inactive"}`}>● {v.status}</span>;
  const name=v=><span className="mv-name"><span className="mv-avatar" aria-hidden="true">▤</span><strong>{v.name}</strong></span>;
  function headings(select=false){return <tr>{select&&<th><input type="checkbox" aria-label="Select all available active vendors in search" checked={selectable.length>0&&selectable.every(v=>selection.includes(v.id))} disabled={!selectable.length||busy} onChange={e=>setSelection(old=>e.target.checked?[...new Set([...old,...selectable.map(v=>v.id)])]:old.filter(id=>!selectable.some(v=>v.id===id)))}/></th>}{["name","type","contact","status"].map(key=><th key={key}>{select?({name:"Vendor",type:"Type",contact:"Contact",status:"Status"}[key]):<button className="mv-sort" onClick={()=>setSort(old=>({key,direction:old.key===key?-old.direction:1}))}>{key==="name"?"Vendor":key[0].toUpperCase()+key.slice(1)} {sort.key===key?(sort.direction===1?"↑":"↓"):"↕"}</button>}</th>)}{!select&&<th>Actions</th>}</tr>;}
  return <div className="merchant-vendors">
    <header className="mv-card mv-header"><div><h2>Vendors</h2><p>These are the vendors connected to this merchant.</p></div><button ref={addButton} className="mv-primary" disabled={loading||!!error} onClick={()=>{setSelection([]);setSearch("");setSaveError("");setModal({type:"select"});}}>＋ Add Vendor</button></header>
    <section className="mv-card"><h3>Vendor List</h3><div className="mv-toolbar"><input aria-label="Search assigned vendors" placeholder="Search vendors by name, type or contact…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/><button onClick={()=>{setQuery("");setPage(1);setSort({key:"name",direction:1});}}>↺ Reset</button></div>
    {loading?<p role="status">Loading vendors…</p>:error?<p role="alert">{error}</p>:<><div className="mv-scroll"><table><thead>{headings()}</thead><tbody>{rows.slice((current-1)*10,current*10).map(v=><tr key={v.id}><td>{name(v)}</td><td>{v.type}</td><td>{v.contact}</td><td>{badge(v)}</td><td><div className="mv-actions"><button aria-label={`View ${v.name}`} onClick={()=>setModal({type:"view",vendor:v})}>View</button><button aria-label={`Remove ${v.name} assignment`} onClick={()=>{setSaveError("");setModal({type:"remove",vendor:v});}}>Remove</button></div></td></tr>)}{!rows.length&&<tr><td colSpan={5}>No assigned vendors match. Use Add Vendor to select from master data.</td></tr>}</tbody></table></div><footer className="mv-footer"><span>Showing {rows.length?(current-1)*10+1:0} to {Math.min(current*10,rows.length)} of {rows.length} entries</span><div><button disabled={current===1} onClick={()=>setPage(current-1)} aria-label="Previous page">‹</button><span className="mv-page">{current} / {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)} aria-label="Next page">›</button></div></footer></>}
    </section>
    <dialog className="mv-dialog" ref={dialog} aria-labelledby="mv-dialog-title" onCancel={e=>{e.preventDefault();close();}}>
      <div className="merchant-vendors"><header className="mv-header"><div><h2 id="mv-dialog-title">{modal?.type==="select"?"Select Vendor":modal?.type==="remove"?"Remove vendor assignment":"Vendor Details"}</h2><p>{modal?.type==="select"?"Choose one or more vendors to add to this merchant.":modal?.type==="remove"?"The vendor remains available in Master Data.":"Read-only master vendor details."}</p></div><button aria-label="Close" disabled={busy} onClick={close}>×</button></header>
      {modal?.type==="select"?<><input className="mv-search" autoFocus aria-label="Search master vendors" placeholder="Search vendors by name, type or contact…" value={search} disabled={busy} onChange={e=>setSearch(e.target.value)}/><div className="mv-scroll mv-options"><table><thead>{headings(true)}</thead><tbody>{available.map(v=><tr key={v.id}><td><input type="checkbox" aria-label={`Select ${v.name}`} disabled={busy||!active(v)} checked={selection.includes(v.id)} onChange={e=>setSelection(old=>e.target.checked?[...old,v.id]:old.filter(id=>id!==v.id))}/></td><td>{name(v)}</td><td>{v.type}</td><td>{v.contact}</td><td>{badge(v)}</td></tr>)}{!available.length&&<tr><td colSpan={5}>No unassigned vendors found in master data.</td></tr>}</tbody></table></div></>:modal?.vendor&&<dl className="mv-details">{Object.entries({Vendor:modal.vendor.name,Type:modal.vendor.type,Contact:modal.vendor.contact,Status:modal.vendor.status,Email:modal.vendor.email||"—",Phone:modal.vendor.phone||"—"}).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      {saveError&&<p role="alert" className="mv-error">{saveError}</p>}
      <footer className="mv-footer"><span>{modal?.type==="select"?`${selection.length} vendors selected`:""}</span><div><button disabled={busy} onClick={close}>{modal?.type==="view"?"Close":"Cancel"}</button>{modal?.type==="select"&&<button className="mv-primary" disabled={busy||!selection.length} onClick={()=>save([...new Set([...ids,...selection.filter(id=>vendors.some(v=>v.id===id&&active(v)))])])}>{busy?"Saving…":"Add Selected"}</button>}{modal?.type==="remove"&&<button className="mv-primary" disabled={busy} onClick={()=>save(ids.filter(id=>id!==modal.vendor.id))}>{busy?"Saving…":"Remove Assignment"}</button>}</div></footer></div>
    </dialog>
  </div>;
}
