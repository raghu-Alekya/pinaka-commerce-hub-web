import { storeTypesApi } from "../api/storeTypes";
import { createMerchant, getMerchant, updateMerchant } from "../api/merchants";
import { listPlans } from "../api/plans";
import { listFeatures } from "../api/features";
import { listFeaturePermissions } from "../api/featurePermissionsApi";
import { readRoleTemplatesList, roleTemplatesApi } from "../api/roleTemplatesApi";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import React, { useState, useRef, useEffect, useMemo } from 'react';


import "../styles/merchant-form.css";

// Master-data options stay unchanged. Entry fields start empty.
const CODE_PREFIXES = Object.freeze({merchant:'MER-',store:'STR-'});

function makeSafeId(prefix = 'id') {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}-${cryptoApi.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function formatGeneratedCode(kind, sequence) {
  const bounds = kind === 'merchant' ? [4001, 4999] : kind === 'store' ? [50001, 59999] : null;
  if (!bounds || !Number.isSafeInteger(sequence) || sequence < bounds[0] || sequence > bounds[1]) {
    throw new Error(kind === 'merchant' ? 'Merchant code must be MER-4001 through MER-4999. Check the sequence allocation.' : 'Store code must be STR-50001 through STR-59999. Check the sequence allocation.');
  }
  return CODE_PREFIXES[kind]+String(sequence).padStart(kind==='merchant'?4:5,'0');
}

// Sample master data. Replace with your API catalog.
const catalog=[{n:'Fastkeys',a:['View','Use']},{n:'Refunds',a:['View','Create','Approve','Override']},{n:'Safe Drop',a:['View','Create']},{n:'Loyalty',a:['View','Enroll','Redeem']},{n:'Delivery',a:['View','Manage']},{n:'Weighing Scale',a:['Use']},{n:'Payroll',a:['View','Manage']},{n:'KDS',a:['View','Manage']},{n:'Service Charges',a:['View','Configure']}];
const verticals={Grocery:{f:[0,1,2,3,4,5,6],r:['Store Manager','Shift Manager','Cashier','Inventory Clerk','Receiving Clerk']},Convenience:{f:[0,1,2,3,6],r:['Store Manager','Shift Manager','Cashier','Inventory Clerk']},Restaurant:{f:[0,1,3,4,6,7,8],r:['Restaurant Manager','Shift Manager','Cashier','Server','Kitchen Manager','Kitchen Staff']},Liquor:{f:[0,1,2,3,6],r:['Store Manager','Cashier']},Kiosk:{f:[0,1,3],r:['Store Manager','Cashier']},Fuel:{f:[0,1,2,3],r:['Store Manager','Shift Manager','Cashier','Fuel Attendant']}};
const fallbackPackages=[{name:'Starter',f:[0,1,2,5],stores:1,devices:3,employees:5,price:29,currency:'USD'},{name:'Pro',f:[0,1,2,3,4,5,7,8],stores:5,devices:15,employees:50,price:99,currency:'USD'},{name:'Enterprise',f:[0,1,2,3,4,5,6,7,8],stores:null,devices:null,employees:null,price:249,currency:'USD'}];const regions={'United States':{currency:'USD',prices:[29,99,249]},USA:{currency:'USD',prices:[29,99,249]},India:{currency:'INR',prices:[999,3499,8999]},IND:{currency:'INR',prices:[999,3499,8999]},Canada:{currency:'CAD',prices:[39,129,329]},CAN:{currency:'CAD',prices:[39,129,329]},'United Kingdom':{currency:'GBP',prices:[25,85,219]},GBR:{currency:'GBP',prices:[25,85,219]},UK:{currency:'GBP',prices:[25,85,219]},Australia:{currency:'AUD',prices:[45,149,379]},AUS:{currency:'AUD',prices:[45,149,379]}};

const DEFAULT_COUNTRY_RULE = {
  dial: '',
  phone: /.*/,
  postal: /.*/,
  postalLabel: 'ZIP / Postal Code',
  hint: '',
  zones: ['Asia/Kolkata', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'Europe/London', 'Australia/Sydney', 'UTC']
};

const countryRules = {
  'United States': {dial:'+1',phone:/^\d{10}$/,postal:/^\d{5}(-\d{4})?$/,postalLabel:'ZIP Code',hint:'ZIP: 85001 or 85001-1234.',zones:['America/New_York','America/Chicago','America/Denver','America/Phoenix','America/Los_Angeles','America/Anchorage','Pacific/Honolulu']},
  'USA': {dial:'+1',phone:/^\d{10}$/,postal:/^\d{5}(-\d{4})?$/,postalLabel:'ZIP Code',hint:'ZIP: 85001 or 85001-1234.',zones:['America/New_York','America/Chicago','America/Denver','America/Phoenix','America/Los_Angeles','America/Anchorage','Pacific/Honolulu']},
  India: {dial:'+91',phone:/^\d{10}$/,postal:/^[1-9]\d{5}$/,postalLabel:'PIN Code',hint:'PIN: six digits, e.g. 500081.',zones:['Asia/Kolkata']},
  IND: {dial:'+91',phone:/^\d{10}$/,postal:/^[1-9]\d{5}$/,postalLabel:'PIN Code',hint:'PIN: six digits, e.g. 500081.',zones:['Asia/Kolkata']},
  Canada: {dial:'+1',phone:/^\d{10}$/,postal:/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,postalLabel:'Postal Code',hint:'Postal code: A1A 1A1.',zones:['America/Toronto','America/Vancouver','America/Edmonton','America/Winnipeg','America/Halifax','America/St_Johns','America/Regina','America/Whitehorse']},
  CAN: {dial:'+1',phone:/^\d{10}$/,postal:/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,postalLabel:'Postal Code',hint:'Postal code: A1A 1A1.',zones:['America/Toronto','America/Vancouver','America/Edmonton','America/Winnipeg','America/Halifax','America/St_Johns','America/Regina','America/Whitehorse']},
  'United Kingdom': {dial:'+44',phone:/^\d{9,10}$/,postal:/^(GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i,postalLabel:'Postcode',hint:'Postcode: SW1A 1AA.',zones:['Europe/London']},
  GBR: {dial:'+44',phone:/^\d{9,10}$/,postal:/^(GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i,postalLabel:'Postcode',hint:'Postcode: SW1A 1AA.',zones:['Europe/London']},
  Australia: {dial:'+61',phone:/^\d{9}$/,postal:/^\d{4}$/,postalLabel:'Postcode',hint:'Postcode: four digits, e.g. 2000.',zones:['Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Adelaide','Australia/Perth','Australia/Darwin','Australia/Hobart','Australia/Broken_Hill','Australia/Lord_Howe']},
  AUS: {dial:'+61',phone:/^\d{9}$/,postal:/^\d{4}$/,postalLabel:'Postcode',hint:'Postcode: four digits, e.g. 2000.',zones:['Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Adelaide','Australia/Perth','Australia/Darwin','Australia/Hobart','Australia/Broken_Hill','Australia/Lord_Howe']},
};

export function getCountryRule(country) {
  if (!country) return DEFAULT_COUNTRY_RULE;
  return countryRules[country] || DEFAULT_COUNTRY_RULE;
}

export function getRegion(country) {
  if (!country) return { currency: 'USD', prices: [29, 99, 249] };
  return regions[country] || { currency: 'USD', prices: [29, 99, 249] };
}

const STANDARD_COUNTRY_OPTIONS = [
  { value: 'United States', label: 'United States' },
  { value: 'USA', label: 'United States (USA)' },
  { value: 'India', label: 'India' },
  { value: 'IND', label: 'India (IND)' },
  { value: 'Canada', label: 'Canada' },
  { value: 'CAN', label: 'Canada (CAN)' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'GBR', label: 'United Kingdom (GBR)' },
  { value: 'Australia', label: 'Australia' },
  { value: 'AUS', label: 'Australia (AUS)' },
];

export function getCountrySelectOptions(currentValue) {
  const options = [...STANDARD_COUNTRY_OPTIONS];
  if (currentValue && !options.some(opt => opt.value === currentValue)) {
    options.push({ value: currentValue, label: currentValue });
  }
  return options;
}

const deviceTypes=['POS','KDS','Printer','Scanner'];
const templateDefinitions=Object.fromEntries([...new Set(Object.values(verticals).flatMap(type=>type.r))].map(name=>[name,{perms:catalog.map(feature=>name==='Cashier'?feature.a.filter(action=>['View','Use','Create','Enroll','Redeem'].includes(action)):[...feature.a])}]));

// Browser-local sequence for this mockup. Supply getNextSequence for server-wide codes.
let codeQueue=Promise.resolve();
function reserveLocalSequence({kind,requestId}) {
  const reserve=()=>{
    const key='pch.onboarding.sequences.v1';
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    const requests=saved.requests||{};
    if(requests[requestId]?.kind===kind) {
      formatGeneratedCode(kind, requests[requestId].value);
      return requests[requestId].value;
    }
    const value=(saved[kind]??(kind==='merchant'?4000:50000))+1;
    formatGeneratedCode(kind, value); // Reject exhausted or invalid sequences before persisting.
    saved[kind]=value;saved.requests={...requests,[requestId]:{kind,value}};
    localStorage.setItem(key,JSON.stringify(saved));
    return value;
  };
  if(navigator.locks) return navigator.locks.request('pch-code-sequence',reserve);
  const next=codeQueue.then(reserve);codeQueue=next.catch(()=>{});return next;
}

function employeeCountFor(state) {
  if (Array.isArray(state.employees)) return state.employees.length;
  const count = state.employeeCount;
  return count !== null && count !== undefined && count !== '' && Number.isInteger(Number(count)) && Number(count) >= 0 ? Number(count) : null;
}
export function normalizeStoreTypes(response) {
  if (!Array.isArray(response?.storeTypes)) throw new Error('GET /store-types did not return a storeTypes array.');
  return response.storeTypes.filter(item=>item && item.id !== null && item.id !== undefined && String(item.name || '').trim()).map(item=>({
    id:String(item.id), name:String(item.name).trim(), code:item.storeTypeCode || '',
    active:String(item.status || '').toUpperCase() !== 'INACTIVE',
  }));
}
export function findStoreType(store, types) {
  if (store.storeTypeId !== undefined && store.storeTypeId !== null && store.storeTypeId !== '') return types.find(type=>type.id===String(store.storeTypeId));
  const matches=types.filter(type=>type.name.toLowerCase()===String(store.type || '').trim().toLowerCase());
  return matches.length===1 ? matches[0] : undefined;
}
function storeTypeDefaults(name) {
  const key=Object.keys(verticals).find(key=>key.toLowerCase()===String(name || '').trim().toLowerCase());
  return key ? verticals[key] : {f:[],r:[]};
}

function featureIndexes(features = []) {
  return features.reduce((indexes, feature) => {
    const name = typeof feature === 'string' ? feature : feature?.name || feature?.featureKey || feature?.code;
    const index = catalog.findIndex(item => item.n.toLowerCase() === String(name || '').trim().toLowerCase());
    if (index >= 0) indexes.push(index);
    return indexes;
  }, []);
}

function getPlanStoreTypeName(item, storeTypesList = []) {
  const planType = item.applicableStoreType ?? item.storeType ?? item.store_type;
  if (!planType) return 'General Plans';
  if (typeof planType === 'object') {
    return planType.name || planType.storeTypeName || planType.title || planType.code || 'General Plans';
  }
  const str = String(planType).trim();
  if (!str || ['all', 'any', '*'].includes(str.toLowerCase())) {
    return 'General Plans';
  }
  const matched = storeTypesList.find(st => 
    String(st.id).toLowerCase() === str.toLowerCase() || 
    String(st.code).toLowerCase() === str.toLowerCase() || 
    String(st.name).toLowerCase() === str.toLowerCase()
  );
  if (matched) return matched.name;
  return str;
}


function toMerchantPlan(plan) {
  return {
    ...plan,
    f: featureIndexes(plan.includedFeatures || plan.included_features),
    stores: Number.isFinite(Number(plan.includedStores)) ? Number(plan.includedStores) || null : null,
    devices: Number.isFinite(Number(plan.includedTerminals)) ? Number(plan.includedTerminals) || null : null,
    employees: Number.isFinite(Number(plan.includedUsers)) ? Number(plan.includedUsers) || null : null,
    price: Number(plan.price ?? plan.basePrice ?? 0),
    currency: String(plan.currency || '').toUpperCase(),
  };
}

function assignedFeatures(response) {
  const source = response?.features || response?.storeTypeFeatures || response?.items ||
    response?.data?.features || response?.data?.storeTypeFeatures || response?.data?.items ||
    response?.data || response;
  return (Array.isArray(source) ? source : []).map((assignment, index) => {
    const feature = assignment.feature || assignment.featureDetails || assignment.featureDefinition || assignment;
    return {
      id: String(feature.id || assignment.featureId || assignment.id || index),
      name: String(feature.name || feature.featureKey || feature.code || 'Unnamed feature').trim(),
      code: String(feature.featureKey || feature.code || '').trim(),
      active: assignment.defaultEnabled !== false && String(feature.status || 'ACTIVE').toUpperCase() !== 'INACTIVE',
    };
  }).filter(feature => feature.name && feature.active);
}

function assignedRoleTemplates(response) {
  return readRoleTemplatesList(response).map((role, index) => {
    const template = role.roleTemplate || role.template || role;
    return {
      id: String(role.roleTemplateId || template.id || template._id || role.id || `role-template-${index}`),
      code: String(template.code || template.roleCode || ''),
      name: String(template.name || template.roleName || template.templateName || template.code || 'Unnamed role template').trim(),
      scope: template.scope || template.roleScope || 'Store',
      active: String(template.status || 'ACTIVE').toUpperCase() !== 'INACTIVE',
    };
  }).filter(role => role.name && role.active);
}
function validateAddress(value, label) {
  return '';
}
function validatePhone(phone) {
  return '';
}
function normalizeMerchantPhone(value) {
  return String(value ?? '');
}

function validEmail(value) {
  return true;
}

function businessTypeFields(merchant) {
  return {type:merchant.type || '',storeTypeId:merchant.storeTypeId || '',storeTypeCode:merchant.storeTypeCode || ''};
}
export function prepareBusinessDraft(value) {
  const draft=structuredClone(value);
  const types=[...new Set(draft.stores.map(store=>store.storeTypeId || store.type).filter(Boolean))];
  const inherited=types.length===1 ? draft.stores.find(store=>store.storeTypeId || store.type) : null;
  draft.merchant={...draft.merchant,type:draft.merchant.type || inherited?.type || '',storeTypeId:draft.merchant.storeTypeId || inherited?.storeTypeId || '',storeTypeCode:draft.merchant.storeTypeCode || inherited?.storeTypeCode || ''};
  draft.stores=draft.stores.map(store=>({...store,
    roleIds:store.roleIds || draft.roles.map(role=>role.id),
    rolePermissions:store.rolePermissions || Object.fromEntries(draft.roles.map(role=>[role.id,structuredClone(role.perms)])),
  }));
  return draft;
}
function createStore(code='') {
  return {code,roleIds:[],rolePermissions:{},name:'',type:'',addressLine1:'',addressLine2:'',city:'',state:'',country:'',postal:'',timezone:'',url:'',logo:'',licensed:false,
    off:[],hours:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day=>({day,status:'',open:'',close:'',shifts:''}))};
}
function initialState() {
  return {step:0,furthest:0,done:false,store:0,plan:-1,cycle:'',start:'',enterpriseStores:'',enterpriseDevices:'',enterpriseEmployees:'',employeeCount:0,
    merchant:{type:'',storeTypeId:'',storeTypeCode:'',code:'',name:'',business:'',display:'',email:'',phone:'',addressLine1:'',addressLine2:'',city:'',state:'',postal:'',country:''},
    phase:'merchant',subscriptionStatus:'Pending activation',stores:[],roles:[],activeRole:0,devices:[]};
}

function featureReason(state, index, store = state.stores[state.store], availablePackages = fallbackPackages) {
  if (!store) return 'Select a store';
  if (!store.licensed) return 'Store not licensed';
  if (!storeTypeDefaults(store.type).f.includes(index)) return 'Not relevant';
  if (!(availablePackages[state.plan]?.f || []).includes(index)) return 'Not entitled';
  if (store.off.includes(index)) return 'Disabled at store';
  return '';
}

function featureKey(feature) {
  return [feature?.id, feature?.code, feature?.featureKey, feature?.name]
    .filter(Boolean)
    .map(value => String(value).trim().toLowerCase());
}

function renewalDate(start, cycle) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start??'')) return '';
  const parsed=new Date(start+'T12:00:00Z');
  if(Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10)!==start) return '';
  const date = new Date(`${start}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + (cycle === 'Annual' ? 12 : 1));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}

export function validateSchedule(hours = []) {
  for (const day of hours) {
    if (day.status && !['Open','Closed','24 hours'].includes(day.status)) return 'Select a valid day status.';
    if (day.status === 'Closed') continue;
    if (String(day.shifts ?? '').trim() && (!Number.isInteger(Number(day.shifts)) || Number(day.shifts) < 1)) return 'Shift counts must be positive whole numbers when entered.';
    if (day.status === '24 hours') continue;
    for (const key of ['open','close']) if (day[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(day[key])) return 'Enter a valid opening or closing time.';
    if (day.open && day.close && day.open === day.close) return 'Opening and closing times must differ; use 24 hours for all-day operation.';
  }
  return '';
}

export function validate(state, storeTypesState, availablePackages = fallbackPackages, availableRoleTemplates = []) {
  return '';
}


// Static UI flow. Never fetched from master data.

function Field({ label, value, onChange, type = 'text', required = false, ...props }) {
  return <label className="pch-field">{label}{required && !props.readOnly ? ' *' : ''}
    <input {...props} type={type} value={value ?? ''} required={required}
      maxLength={type === 'email' ? 254 : props.maxLength}
      placeholder={type === 'email' ? 'name@example.com' : props.placeholder}
      onChange={onChange ? event => { onChange(event.target.value); } : undefined} />
  </label>;
}
function Select({ label, value, onChange, options, required = false }) {
  return <label className="pch-field">{label}<select required={required} value={value ?? ''} onChange={event => onChange(event.target.value)}><option value="">Select {label.replace(/\s*\*$/, "")}</option>
    {options.map(option => typeof option === 'string'
      ? <option key={option} value={option}>{option}</option>
      : <option key={option.value} value={option.value}>{option.label}</option>)}
  </select></label>;
}
function Panel({ title, action, children }) {
  return <section className="pch-panel"><div className="pch-panel-heading"><h2>{title}</h2>{action}</div>{children}</section>;
}
function Table({ headings, rows }) {
  return <div className="pch-tablewrap"><table><thead><tr>{headings.map(h => <th key={h}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
function Detail({ label, value }) {
  return <div className="pch-rule"><span className="pch-muted">{label}</span><span>{value}</span></div>;
}
const toggleItem = (items, item, checked) => checked ? [...new Set([...items, item])] : items.filter(value => value !== item);

/** Frontend prototype. onComplete receives a serializable onboarding payload. */
function MerchantPageHeader({ editing = false, code = '', onBack }) {
  return (
    <header>
      <nav className="pch-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={onBack}>← Merchants</button>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{editing ? 'Edit Merchant' : 'Add Merchant'}</span>
      </nav>
      <span className="pch-pill">
        {editing ? (code ? `Editing ${code}` : 'Edit merchant') : 'New merchant'}
      </span>
    </header>
  );
}

function MerchantOnboarding({ onComplete, onCancel, onDashboard, initialValue, getNextSequence = reserveLocalSequence }) {
  const editing=Boolean(initialValue);
  const [paymentPreview,setPaymentPreview]=useState('card');
  const [historyStatus,setHistoryStatus]=useState('All');
  const [historyDetails,setHistoryDetails]=useState(null);
  const [manageSubscription,setManageSubscription]=useState(false);
  const [cancelRequested,setCancelRequested]=useState(false);
  const [state, setState] = useState(()=>initialValue?{...prepareBusinessDraft(initialValue),step:0,furthest:6,done:false,store:0,activeRole:0,phase:'merchant'}:initialState());
  const [storeTypesState,setStoreTypesState]=useState({items:[],loading:true,error:''});
  const [storeTypesAttempt,setStoreTypesAttempt]=useState(0);
  const [allPlans,setAllPlans]=useState([]);
  const [plansLoading,setPlansLoading]=useState(true);
  const [plansError,setPlansError]=useState('');
  const [storeTypeFeaturesState,setStoreTypeFeaturesState]=useState({items:[],loading:false,error:''});
  const [roleTemplatesState,setRoleTemplatesState]=useState({items:[],loading:false,error:''});
  const [masterFeaturesState,setMasterFeaturesState]=useState({items:[],permissions:{},loading:true,error:''});
  useEffect(()=>{
    let active=true;
    setStoreTypesState(previous=>({...previous,loading:true,error:''}));
    Promise.resolve().then(()=>storeTypesApi.getAll()).then(response=>{
      const items=normalizeStoreTypes(response);
      if(!active)return;
      setStoreTypesState({items,loading:false,error:''});
      setState(previous=>{
        const match=findStoreType(previous.merchant,items);
        if(!match)return previous;
        const typeFields={type:match.name,storeTypeId:match.id,storeTypeCode:match.code};
        return {...previous,merchant:{...previous.merchant,...typeFields},stores:previous.stores.map(store=>({...store,...typeFields}))};
      });
    }).catch(error=>{if(active)setStoreTypesState(previous=>({...previous,loading:false,error:error.message || 'Unable to load store types.'}));});
    return()=>{active=false;};
  },[storeTypesAttempt]);
  useEffect(()=>{
    let active=true;
    setPlansLoading(true);
    setPlansError('');
    listPlans().then(response=>{
      if(!active)return;
      setAllPlans(response);
    }).catch(error=>{
      if(!active)return;
      setAllPlans([]);
      setPlansError(error.message || 'Unable to load plans.');
    }).finally(()=>{if(active)setPlansLoading(false);});
    return()=>{active=false;};
  },[]);
  useEffect(()=>{
    let active=true;
    Promise.resolve().then(()=>listFeatures()).then(async features=>{
      const activeFeatures=features.filter(feature=>String(feature.status).toUpperCase() !== 'INACTIVE');
      const permissionEntries=await Promise.all(activeFeatures.map(async feature=>{
        try {
          return [String(feature.id), await listFeaturePermissions(feature.id, { status: 'ACTIVE' })];
        } catch {
          return [String(feature.id), []];
        }
      }));
      if(active)setMasterFeaturesState({items:activeFeatures,permissions:Object.fromEntries(permissionEntries),loading:false,error:''});
    }).catch(error=>{
      if(active)setMasterFeaturesState(previous=>({...previous,loading:false,error:error.message || 'Unable to load master features.'}));
    });
    return()=>{active=false;};
  },[]);
  const [codesReady,setCodesReady]=useState(Boolean(initialValue));
  const [codeError,setCodeError]=useState('');
  const [codeAttempt,setCodeAttempt]=useState(0);
  const initialCodes=useRef(null);
  const requestKeys=useRef(null);
  const addingStore=useRef(false);
  const pendingStoreKey=useRef(null);
  useEffect(()=>{
    if(initialValue) return;
    let active=true;
    if(!requestKeys.current) requestKeys.current={merchant:makeSafeId('merchant-request')};
    if(!initialCodes.current) initialCodes.current=Promise.all(['merchant'].map(async kind=>{
      if(typeof getNextSequence!=='function') throw new Error('Connect getNextSequence to your backend code reservation service.');
      return formatGeneratedCode(kind,await getNextSequence({kind,requestId:requestKeys.current[kind]}));
    }));
    initialCodes.current.then(([merchantCode,storeCode])=>{if(active){setState(previous=>({...previous,merchant:{...previous.merchant,code:merchantCode},stores:previous.stores.map((store,index)=>index===0?{...store,code:storeCode}:store)}));setCodesReady(true);setCodeError('');}}).catch(error=>{if(active)setCodeError(error.message||'Unable to reserve codes.');});
    return ()=>{active=false;};
  },[getNextSequence,codeAttempt,initialValue]);
  const [error, setError] = useState('');
  const [custom, setCustom] = useState({ open: false, code: '', name: '', description: '', status: 'ACTIVE', scope: 'Store', id: null });
  const [returnToReview, setReturnToReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef(null);
  const formRef = useRef(null);
  useEffect(() => { headingRef.current?.scrollIntoView({ block: 'start' }); }, [state.step, state.done]);
  const store = state.stores[state.store] || createStore();
  const selectedStoreType = findStoreType(state.merchant,storeTypesState.items);
  useEffect(()=>{
    if(!selectedStoreType?.id){
      setStoreTypeFeaturesState({items:[],loading:false,error:''});
      setRoleTemplatesState({items:[],loading:false,error:''});
      return;
    }
    let active=true;
    setStoreTypeFeaturesState({items:[],loading:true,error:''});
    setRoleTemplatesState({items:[],loading:true,error:''});
    Promise.all([storeTypesApi.getFeatures(selectedStoreType.id),roleTemplatesApi.getForStoreType(selectedStoreType.id)]).then(([featureResponse,roleResponse])=>{
      if(!active)return;
      setStoreTypeFeaturesState({items:assignedFeatures(featureResponse),loading:false,error:''});
      setRoleTemplatesState({items:assignedRoleTemplates(roleResponse),loading:false,error:''});
    }).catch(error=>{
      if(!active)return;
      const message=error.message || 'Unable to load store-type features and role templates.';
      setStoreTypeFeaturesState(previous=>({...previous,loading:false,error:message}));
      setRoleTemplatesState(previous=>({...previous,loading:false,error:message}));
    });
    return()=>{active=false;};
  },[selectedStoreType?.id]);
  const packages = useMemo(() => {
    const activePlans = (allPlans || []).filter(plan => String(plan.status || '').toUpperCase() !== 'INACTIVE');
    if (activePlans.length > 0) {
      return activePlans.map(toMerchantPlan);
    }
    return fallbackPackages.map(toMerchantPlan);
  }, [allPlans]);
  const groupedPackages = useMemo(() => {
    const groups = {};
    packages.forEach((item, index) => {
      const groupName = getPlanStoreTypeName(item, storeTypesState.items);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push({ ...item, originalIndex: index });
    });
    return Object.entries(groups).map(([storeType, items]) => ({
      storeType,
      items,
    }));
  }, [packages, storeTypesState.items]);
  const handleSelectPlan = (originalIndex) => {
    const item = packages[originalIndex];
    if (!item) return;
    const planType = item.applicableStoreType ?? item.storeType ?? item.store_type;
    let typeFields = {};
    if (planType && typeof planType === 'object') {
      typeFields = {
        type: planType.name || planType.storeTypeName || '',
        storeTypeId: planType.id || planType._id || planType.storeTypeId || '',
        storeTypeCode: planType.code || planType.storeTypeCode || ''
      };
    } else if (planType && typeof planType === 'string' && !['all', 'any', '*'].includes(planType.toLowerCase())) {
      const matched = storeTypesState.items.find(st => 
        String(st.id).toLowerCase() === planType.toLowerCase() || 
        String(st.code).toLowerCase() === planType.toLowerCase() || 
        String(st.name).toLowerCase() === planType.toLowerCase()
      );
      if (matched) {
        typeFields = {
          type: matched.name,
          storeTypeId: matched.id,
          storeTypeCode: matched.code
        };
      } else {
        typeFields = { type: planType };
      }
    }
    setError('');
    patch({
      plan: originalIndex,
      planId: item.id,
      planName: item.name,
      merchant: {
        ...state.merchant,
        ...typeFields
      },
      stores: state.stores.map(store => ({
        ...store,
        ...typeFields
      }))
    });
  };
  useEffect(() => {
    if (plansLoading || !packages.length) return;
    if (state.plan >= 0 && packages[state.plan]) return;
    const targetId = state.planId || initialValue?.planId || initialValue?.planDetails?.id || initialValue?.subscription?.planId || initialValue?.subscription?.plan_id;
    const targetName = String(state.planName || initialValue?.planName || initialValue?.plan || initialValue?.subscription?.planName || initialValue?.subscription?.planCode || '').toLowerCase();
    let matchedIdx = -1;
    if (targetId) {
      matchedIdx = packages.findIndex(p => String(p.id).toLowerCase() === String(targetId).toLowerCase());
    }
    if (matchedIdx === -1 && targetName) {
      matchedIdx = packages.findIndex(p => {
        const pName = String(p.name || p.planName || p.code || '').toLowerCase();
        return pName.includes(targetName) || targetName.includes(pName);
      });
    }
    if (matchedIdx >= 0) {
      patch({ plan: matchedIdx });
    } else if (state.plan >= 0 && !packages[state.plan]) {
      patch({ plan: -1 });
    }
  }, [packages, plansLoading, initialValue, state.planId, state.planName]);
  const plan = packages[state.plan] || {name:'',f:[],stores:0,devices:0};
  const planFeatureItems = useMemo(() => {
    const assigned = storeTypeFeaturesState.items;
    const raw = Array.isArray(plan.includedFeatures) && plan.includedFeatures.length
      ? plan.includedFeatures
      : assigned;
    return raw.map((entry, index) => {
      const candidate = typeof entry === 'string' ? { id: entry, name: entry, code: entry } : entry || {};
      const keys = [candidate.id, candidate.code, candidate.featureKey, candidate.name]
        .filter(Boolean)
        .map(value => String(value).trim().toLowerCase());
      const match = assigned.find(feature => [feature.id, feature.code, feature.name]
        .filter(Boolean)
        .some(value => keys.includes(String(value).trim().toLowerCase())));
      return match || {
        id: String(candidate.id || candidate.code || index),
        name: String(candidate.name || candidate.featureKey || candidate.code || `Feature ${index + 1}`).trim(),
        code: String(candidate.code || candidate.featureKey || '').trim(),
      };
    }).filter(feature => feature.name);
  }, [plan.includedFeatures, storeTypeFeaturesState.items]);
  const effectiveFeatureItems = planFeatureItems.length
    ? planFeatureItems
    : catalog.map((feature, index) => ({ id: String(index), name: feature.n, code: feature.n }));
  const masterFeatureItems = masterFeaturesState.items.length
    ? masterFeaturesState.items.map(feature=>({
        ...feature,
        id:String(feature.id),
        name:feature.name || feature.code,
      }))
    : effectiveFeatureItems;
  const explicitPlanFeatures = Array.isArray(plan.includedFeatures) && plan.includedFeatures.length > 0;
  const featureStatus = (feature, currentStore) => {
    if (!currentStore?.licensed) return 'Store not licensed';
    const assigned = storeTypeFeaturesState.items;
    const relevant = !assigned.length || assigned.some(item =>
      featureKey(item).some(key => featureKey(feature).includes(key))
    );
    if (!relevant) return 'Not relevant';
    const entitled = !explicitPlanFeatures || plan.includedFeatures.some(item =>
      featureKey(typeof item === 'string' ? { code: item } : item)
        .some(key => featureKey(feature).includes(key))
    );
    if (!entitled) return 'Not entitled';
    if (currentStore.off?.includes(feature.id)) return 'Disabled at store';
    return '';
  };
  const storeLimit = plan.stores ?? Number(state.enterpriseStores);
  const deviceLimit = plan.devices ?? Number(state.enterpriseDevices);
  const employeeLimit = plan.employees ?? Number(state.enterpriseEmployees);
  const employeeCount = employeeCountFor(state);
  const employeeUsage = `${employeeCount ?? '—'} / ${employeeLimit || 'Not set'}`;
  const licensed = state.stores.filter(item => item.licensed).length;
  const region = getRegion(state.merchant.country);
  const formatPrice = (amount, currency = region.currency) => !currency || !Number.isFinite(amount) ? '—' : new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const planPrice = Number.isFinite(Number(plan.price)) ? Number(plan.price) : region.prices[state.plan];
  const planCurrency = plan.currency || region.currency;
  const price = formatPrice(planPrice * (state.cycle === 'Annual' ? 12 : 1), planCurrency);
  const subtotal = Math.round((planPrice || 0) * (state.cycle === 'Annual' ? 12 : 1) * 100) / 100;
  const sampleTax = Math.round(subtotal * 0.086 * 100) / 100;
  const sampleTotal = Math.round((subtotal + sampleTax) * 100) / 100;
  const roleTemplates = roleTemplatesState.items.length ? roleTemplatesState.items.map(role=>role.name) : storeTypeDefaults(state.merchant.type).r;
  const assignedRoles=state.roles.filter(role=>String(role.status || 'ACTIVE').toUpperCase()!=='INACTIVE' && store.roleIds?.includes(role.id));
  const currentRole=assignedRoles.find(role=>role.id===state.roles[state.activeRole]?.id) || assignedRoles[0];
  const storePhase = state.phase === 'store';
  const journey = storePhase ? [1,4,3,5,6] : [0,2,6];
  const stepLabels = storePhase
    ? [['Store details','Location & optional operating schedule'],['Subscription & features','Inherited plan and store enablement'],['Devices','Register & allocate licenses'],['Roles & permissions','Templates and custom roles'],['Review & save','Review store configuration']]
    : [['Merchant details','Business & primary contact'],['Choose plan','Country pricing & subscription limits'],['Review & Subscribe','Plan review & billing summary']];
  const position = journey.indexOf(state.step);
  const patch = values => { setError(''); setState(previous => ({ ...previous, ...values })); };
  const changeMerchant = (key, value) => { setError(''); setState(previous => ({ ...previous, merchant: { ...previous.merchant, [key]: value } })); };
  const changeStore = (key, value, index = state.store) => { setError(''); setState(previous => ({ ...previous,
    stores: previous.stores.map((item, i) => i === index ? { ...item, [key]: value } : item) })); };
  const changeDevice = (index, key, value) => { setError(''); setState(previous => ({ ...previous,
    devices: previous.devices.map((device, i) => i === index ? { ...device, [key]: value } : device) })); };
  const storePicker = <Select label="Store context" value={state.store} onChange={value => patch({ store: Number(value) })}
    options={state.stores.map((item, i) => ({ value: i, label: `${item.code} · ${item.name}` }))} />;
  const merchantField = (label, key, type = 'text') => <Field
    label={label} value={state.merchant[key]} type={type} required={false}
    onChange={value => changeMerchant(key, key === 'phone' ? normalizeMerchantPhone(value) : value)} />;
  const storeField = (label, key, type = 'text', required = false) => <Field label={label} value={store[key]} type={type} required={required} onChange={value => changeStore(key, value)} />;

  function goTo(step) {
    if (submitting || !journey.includes(step)) return;
    if (custom.open) return setError('Save or cancel the custom role before continuing.');
    const target = journey.indexOf(step);
    if (target > position) {
      if (!formRef.current?.reportValidity()) return;
      for (const current of journey.slice(0, target)) {
        const message = validate({...state, step: current},storeTypesState,packages,roleTemplates);
        if (message) return setError(message);
      }
    }
    setReturnToReview(false);
    patch({step, done:false});
  }
  function editSection(step, values = {}) {
    setReturnToReview(true);
    setCustom({ open: false, code: '', name: '', description: '', status: 'ACTIVE', scope: 'Store', id: null });
    patch({ ...values, step, done: false });
  }
  const editButton = (label, step, values) => journey.includes(step) ? <button type="button" onClick={() => editSection(step, values)}>{label}</button> : null;
  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    if (custom.open) return setError('Save or cancel the custom role before continuing.');
    const message = validate(state,storeTypesState,packages,roleTemplates);
    if (message) return setError(message);
    if (state.step === 6) {
      setSubmitting(true);
      try {
        const historyEntry = {
          id: makeSafeId('bill'), createdAt:new Date().toISOString(),
          plan:plan.name, cycle:state.cycle, currency:region.currency,
          subtotal, tax:sampleTax, amount:sampleTotal,
          method:paymentPreview === 'card' ? 'Credit / Debit Card' : 'ACH (Bank Transfer)',
          status:'Pending integration', transactionId:null,
        };
        const previousHistory = state.paymentHistory || [];
        const lastBilling = previousHistory[0];
        const billingChanged = !lastBilling || lastBilling.plan !== historyEntry.plan ||
          lastBilling.cycle !== historyEntry.cycle || lastBilling.currency !== historyEntry.currency ||
          lastBilling.amount !== historyEntry.amount;
        const calculatedRenewal = renewalDate(state.start, state.cycle);
        const saved = {...state, renewalDate: calculatedRenewal, planDetails:plan,stores:state.stores.map(item=>({...item,roleIds:(item.roleIds || []).filter(id=>state.roles.some(role=>role.id===id)),rolePermissions:Object.fromEntries(Object.entries(item.rolePermissions || {}).filter(([id])=>state.roles.some(role=>String(role.id)===id)))})), done:true, merchantSaved:true,
          paymentHistory:!storePhase && billingChanged ? [historyEntry,...previousHistory] : previousHistory};
        const backendResult = await onComplete?.(structuredClone(saved));
        patch({
          ...saved,
          ...(backendResult || {}),
          merchant: {
            ...saved.merchant,
            code: backendResult?.merchantCode || saved.merchant.code,
          },
        });
      } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to provision. Please try again.'); }
      finally { setSubmitting(false); }
    } else if (returnToReview) {
      setReturnToReview(false);
      patch({ step: 6 });
    } else patch({ step: journey[position + 1], furthest: Math.max(state.furthest, position + 1) });
  }
  function addRole(name, source, scope = 'Store', details = {}) {
    setState(previous => ({ ...previous, activeRole: previous.roles.length, roles: [...previous.roles, {
      id: `role-${Date.now()}-${previous.roles.length}`, name, source, scope, ...details,
      perms: catalog.map((feature,index) => source === 'Custom' ? [] : feature.a.filter(action=>(templateDefinitions[source]?.perms?.[index] || []).includes(action))),
    }] }));
  }
  function toggleTemplate(name, checked) {
    if (checked) addRole(name, name);
    else patch({ roles: state.roles.filter(role => role.source !== name), activeRole: 0 });
  }
  function uploadLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2097152) return setError('Choose PNG, JPG or WebP up to 2 MB.');
    const index = state.store;
    const reader = new FileReader();
    reader.onload = () => changeStore('logo', String(reader.result), index);
    reader.onerror = () => setError('Unable to read the selected image.');
    reader.readAsDataURL(file);
  }

  function review() {
    if (!storePhase) return <div className="pch-subscribe-grid">
      <section className="pch-selected-summary">
        <h2>Selected Plan</h2>
        <div className="pch-selected-identity">
          <span className="pch-plan-bars" aria-hidden="true"><i/><i/><i/></span>
          <div><strong>{plan.name}</strong><span>{price} / {state.cycle === 'Annual' ? 'year' : 'month'}</span></div>
        </div>
        <ul className="pch-feature-checklist">
          {[storeLimit + ' Store' + (storeLimit === 1 ? '' : 's'), 'Up to ' + deviceLimit + ' Devices', 'Up to ' + employeeLimit + ' Employees', ...planFeatureItems.slice(0,4).map(feature=>feature.name)].map(item=><li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
        </ul>
        <details className="pch-all-features"><summary>View all features ({planFeatureItems.length})</summary><ul>{planFeatureItems.map(feature=><li key={feature.id}>{feature.name}</li>)}</ul></details>
        <div className="pch-review-links">{editButton('Change plan',2)}{editButton('Edit merchant details',0)}</div>
        <details className="pch-all-features"><summary>Review merchant details</summary><p>Store type: {state.merchant.type}</p>
          <p>{state.merchant.business}<br/>{state.merchant.name}<br/>{state.merchant.email}<br/>{state.merchant.phone}</p>
          <p>{['addressLine1','addressLine2','city','state','postal','country'].map(key=>state.merchant[key]).filter(Boolean).join(', ')}</p>
        </details>
      </section>
      <section className="pch-billing-summary">
        <h2>Billing Summary</h2>
        <div className="pch-billing-line"><span>Plan</span><span>{plan.name}</span><strong>{formatPrice(subtotal)}</strong></div>
        <div className="pch-billing-line"><span>Billing Cycle</span><strong>{state.cycle}</strong></div>
        <div className="pch-billing-line"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <div className="pch-billing-line"><span>Tax (8.6% · sample)</span><strong>{formatPrice(sampleTax)}</strong></div>
        <div className="pch-billing-line pch-total"><strong>Total Due Today</strong><strong>{formatPrice(sampleTotal)}</strong></div>
        <h2 className="pch-payment-heading">Payment Method</h2>
        <div className="pch-payment-options">
          <label><input type="radio" name="payment-preview" checked={paymentPreview==='card'} onChange={()=>setPaymentPreview('card')}/> Credit / Debit Card</label>
          <label><input type="radio" name="payment-preview" checked={paymentPreview==='ach'} onChange={()=>setPaymentPreview('ach')}/> ACH (Bank Transfer)</label>
        </div>
        {paymentPreview==='card'?<div className="pch-card-preview" aria-label="Card payment preview">
          <span aria-hidden="true">▣</span><input aria-label="Card number preview" placeholder="Card number" readOnly autoComplete="off"/>
          <input aria-label="Expiry preview" placeholder="MM / YY" readOnly autoComplete="off"/><input aria-label="CVC preview" placeholder="CVC" readOnly autoComplete="off"/>
        </div>:<div className="pch-card-preview pch-ach-preview"><input aria-label="Bank account preview" placeholder="Bank account" readOnly autoComplete="off"/><input aria-label="Routing number preview" placeholder="Routing number" readOnly autoComplete="off"/></div>}
        <p className="pch-payment-caption">▣ Payment details are shown for preview only.</p>
        <button type="submit" className="pch-subscribe-now" disabled={submitting}>{submitting?'Saving…':(editing || state.merchantSaved)?'Save Subscription':'Subscribe Now'}</button>
        <p className="pch-preview-note">Static preview: 8.6% is an illustrative tax, not a country tax calculation. No payment details are collected and no charge is made.</p>
      </section>
    </div>;
    return <>
      <Panel title="Business & primary contact" action={editButton('Edit merchant', 0)}><div className="pch-grid"><div>
        <Detail label="Merchant code" value={state.merchant.code} />
        <Detail label="Business" value={state.merchant.business} />
        <Detail label="Business display name" value={state.merchant.display} />
        <Detail label="Primary contact" value={state.merchant.name} />
        <Detail label="Email" value={state.merchant.email} />
        <Detail label="Phone" value={state.merchant.phone} />
        <Detail label="Address" value={['addressLine1','addressLine2','city','state','postal','country'].map(key => state.merchant[key]).filter(Boolean).join(', ')} />
      </div><div>
        <Detail label="Store locations" value={state.stores.length} />
        <Detail label="Merchant roles" value={state.roles.length} />
        <Detail label="Status" value={state.done ? 'Submitted' : 'Ready for review'} />
      </div></div></Panel>
      <Panel title="Merchant subscription & licensing" action={editButton('Edit subscription', 2)}><div className="pch-grid"><div>
        <Detail label="Subscription" value={`${plan.name} · ${state.cycle}`} />
        <Detail label="Contract amount" value={price} />
        <Detail label="Renewal" value={renewalDate(state.start, state.cycle)} />
        <Detail label="Licensed stores" value={`${licensed} / ${storeLimit}`} />
        <Detail label="Devices" value={`${state.devices.length} / ${deviceLimit}`} /><Detail label="Employees" value={employeeUsage}/>
        <Detail label="Merchant roles" value={state.roles.length} />
      </div><div><Detail label="Start date" value={state.start} /><Detail label="Currency" value={region.currency} /><Detail label="Remaining device licenses" value={Math.max(0,deviceLimit-state.devices.length)} /></div></div></Panel>
      <Panel title="Store locations" action={editButton('Edit locations', 1)}><Table headings={['Store ID','Store','Template','License','Action']}
        rows={state.stores.map((item,index) => [item.code, item.name, item.type, item.licensed ? 'Licensed' : 'Pending', editButton('Edit store',1,{store:index})])} />
        {state.stores.map(item => <details key={item.code} className="pch-review-details"><summary>{item.code} · {item.name} — address, logo & operating hours</summary>
          <div className="pch-review-body"><Detail label="Address" value={[item.addressLine1,item.addressLine2,item.city,item.state,item.postal,item.country].filter(Boolean).join(', ')} /><Detail label="Base URL" value={item.url || 'Not provided'} /><Detail label="Time zone / currency" value={`${item.timezone} / ${(regions[item.country]?.currency || '')}`} />
            {item.logo && <img className="pch-store-logo" src={item.logo} alt={`${item.name} logo`} />}
            <Table headings={['Day','Hours','Shifts']} rows={item.hours.map(day=>[day.day,day.status==='Open'?`${day.open} – ${day.close}${day.close<day.open?' (next day)':''}`:day.status,day.status==='Closed'?0:day.shifts])}/>
          </div></details>)}
      </Panel>
      <Panel title="Device registrations" action={editButton('Edit devices', 3)}><Table headings={['Device','Type','Store','Identifier']}
        rows={state.devices.map(device => [device.name, device.type, state.stores[device.store]?.name, device.serial])} /></Panel>
      <Panel title="Effective store features" action={editButton('Edit features', 4)}>{state.stores.map((item,index)=><details key={item.code} className="pch-review-details"><summary>{item.name} · {masterFeatureItems.filter(feature=>!featureStatus(feature,item)).length} features enabled</summary>
      <div className="pch-review-body">{editButton('Edit store features',4,{store:index})}<Table headings={['Feature','Effective result']} rows={masterFeatureItems.map(feature=>[feature.name,featureStatus(feature,item)||'Enabled'])}/></div></details>)}</Panel>
      <Panel title="Store roles & permissions" action={editButton('Edit store permissions',5)}>
        {state.stores.map(item=><details key={item.code} className="pch-review-details"><summary>{item.name} — {(item.roleIds || []).length} roles</summary>
          {state.roles.filter(role=>item.roleIds?.includes(role.id)).map(role=><div key={role.id} className="pch-review-body"><strong>{role.name}</strong><Table headings={['Feature','Permissions']} rows={catalog.map((feature,index)=>[feature.n,(item.rolePermissions?.[role.id]?.[index] || []).join(', ') || 'No permission'])}/></div>)}
        </details>)}
      </Panel>
      <div className="pch-note">{state.done ? onComplete ? 'Merchant submitted successfully.' : 'Preview completed. No live records were created.' : 'Saves store configuration, device registrations and roles for this merchant.'}</div>
    </>;
  }

  function content() {
          if (state.step === 6) return review();
    switch (state.step) {
      case 0: return <>
        <Panel title="Business Details"><div className="pch-grid">
          {merchantField('Legal / Business Name','business')}{merchantField('Business Display Name','display')}
          <Field label="Merchant code" value={state.merchant.code} readOnly /><Field label="Initial status" value={state.subscriptionStatus || 'Pending activation'} readOnly />
        </div></Panel>
        <Panel title="Primary Contact"><div className="pch-grid">
          {merchantField('Merchant Name','name')}{merchantField('Merchant Email','email','email')}{merchantField('Merchant Phone Number','phone','tel')}
          {merchantField('Address Line 1 (Street number + Street name)','addressLine1')}{<Field label="Address Line 2 (Apartment / Suite / Unit)" value={state.merchant.addressLine2} required={false} onChange={value=>changeMerchant('addressLine2',value)} />}
          {merchantField('City','city')}{merchantField(['United States','USA'].includes(state.merchant.country)?'State (2-letter abbreviation)':'State / Province','state')}{merchantField((getCountryRule(state.merchant.country)?.postalLabel || 'ZIP / Postal Code'),'postal')}
          <Select label="Country *" value={state.merchant.country} options={getCountrySelectOptions(state.merchant.country)} onChange={value => { changeMerchant('country', value); }} />
          <p className="pch-small pch-muted">{(getCountryRule(state.merchant.country)?.hint || '')}</p>
        </div></Panel>
      </>;
      case 1: if(!state.stores.length) return <Panel title="Store locations"><p className="pch-note">No store details were returned. Add a location to enter its details.</p><button type="button" disabled={submitting} onClick={async()=>{setSubmitting(true);try{const code=formatGeneratedCode('store',await getNextSequence({kind:'store',requestId:makeSafeId('store-request')}));patch({stores:[{...createStore(code),...businessTypeFields(state.merchant),licensed:true}],store:0});}catch(error){setError(error.message);}finally{setSubmitting(false);}}}>+ Add location</button></Panel>;
      return <>
        <div className="pch-context-toolbar">{storePicker}<button type="button" disabled={submitting} onClick={async () => {
          if(addingStore.current) return;
          if(state.stores.length >= storeLimit) return setError('Store limit reached. Update the merchant plan before adding another store.');
          const message = validate(state,storeTypesState,packages,roleTemplates); if (message) return setError(message);
          addingStore.current=true;setSubmitting(true);
          try {
            pendingStoreKey.current ||= makeSafeId('store-request');
            const code=formatGeneratedCode('store',await getNextSequence({kind:'store',requestId:pendingStoreKey.current}));
            if(state.stores.some(item=>item.code===code)) throw new Error('The backend returned an existing store code.');
            const location={...createStore(code),...businessTypeFields(state.merchant),licensed:true};
            patch({stores:[...state.stores,location],store:state.stores.length});pendingStoreKey.current=null;
          } catch(error) {setError(error.message||'Unable to generate store code.');}
          finally {addingStore.current=false;setSubmitting(false);}
        }}>+ Add location</button></div>
        <Panel title="Location identity"><div className="pch-grid">
          {storeField('Store name','name')}          {storeField('Store Base URL','url','url',false)}<Field label="Store ID" value={store.code} readOnly />
        </div><div className="pch-note">{store.type && storeTypeDefaults(store.type).f.length ? 'Existing feature and role defaults apply to this store type.' : 'Feature and role mappings are not yet configured for this store type. Custom roles remain available.'} Store types are loaded from master data; they do not grant commercial access.</div></Panel>
        <Panel title="Address & regional settings"><div className="pch-grid">
          {storeField('Address Line 1 (Street number + Street name)','addressLine1')}{storeField('Address Line 2 (Apartment / Suite / Unit)','addressLine2','text',false)}
          {storeField('City','city')}{storeField(['United States','USA'].includes(store.country)?'State (2-letter abbreviation)':'State / Province','state')}{storeField((getCountryRule(store.country)?.postalLabel || 'ZIP / Postal Code'),'postal')}
          <Select label="Country *" value={store.country} options={getCountrySelectOptions(store.country)} onChange={value => { changeStore('country', value); changeStore('timezone', ''); }} />
          <Select label="Time zone *" value={store.timezone} options={(getCountryRule(store.country)?.zones || [])} onChange={value=>changeStore('timezone',value)}/><Field label="Currency" value={(getRegion(store.country)?.currency || '')} readOnly />
          <label className="pch-field">Store logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} /></label>
          {store.logo && <div className="pch-row"><img className="pch-store-logo" alt="Store logo" src={store.logo} /><button type="button" onClick={()=>changeStore("logo", "")}>Remove logo</button></div>}
        </div></Panel>
        <Panel title="Operating schedule"><Table headings={['Day','Status','Opens','Closes','Shifts']} rows={store.hours.map((day, index) => {
          const update = (key, value) => changeStore('hours', store.hours.map((item, i) => i === index ? { ...item, [key]: value } : item));
          return [day.day, <Select required={false} label={`${day.day} status`} value={day.status} options={['Open','Closed','24 hours']} onChange={value => update('status', value)} />,
            ...['open','close','shifts'].map(key => <Field required={false} label={key} value={day.status === 'Closed' && key === 'shifts' ? 0 : day[key]}
              type={key === 'shifts' ? 'number' : 'time'} min={key === 'shifts' ? 1 : undefined} step={key === 'shifts' ? 1 : undefined}
              disabled={day.status === 'Closed' || day.status === '24 hours' && key !== 'shifts'} onChange={value => update(key, value)} />)];
        })} /><p className="pch-small pch-muted">Timings and shift counts are optional. Earlier closing times mean next-day closing.</p></Panel>
      </>;
      case 2: return <>
        <Panel title="Merchant subscription"><div className="pch-row pch-between"><h3>{state.merchant.display || 'Choose Plan'}</h3><span className="pch-pill">{(selectedStoreType?.name || state.merchant.type || 'All Store Types')} · {planCurrency}</span></div>
          {plansLoading && <p className="pch-note">Loading plans…</p>}
          {plansError && <div className="pch-error" role="alert">{plansError}</div>}
          {!plansLoading && !plansError && !packages.length && <p className="pch-note">No active plans are available.</p>}
          {!plansLoading && !plansError && groupedPackages.map(group => (
            <div key={group.storeType} className="pch-plan-group" style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '8px 16px 6px 16px',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--pch-primary, #5143bc)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #e1e4eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span>{group.storeType}</span>
                <span className="pch-pill" style={{ fontSize: '10px' }}>{group.items.length} {group.items.length === 1 ? 'plan' : 'plans'}</span>
              </div>
              <div className="pch-plans">
                {group.items.map(item => (
                  <div key={item.id || item.code || item.name} className={`pch-plan ${state.plan === item.originalIndex ? 'pch-selected' : ''}`}>
                    <h2>{item.name}</h2>
                    <div className="pch-price">{formatPrice(item.price, item.currency || region.currency)}</div>
                    <span className="pch-small pch-muted">per merchant / {item.billingCycle || 'month'}</span>
                    <div>
                      {item.stores ?? 'Custom'} stores<br />
                      {item.devices ?? 'Custom'} devices<br />
                      {item.employees ?? 'Custom'} employees
                    </div>
                    <details>
                      <summary>Store type features ({storeTypeFeaturesState.items.length})</summary>
                      <ul>{storeTypeFeaturesState.items.map(feature => <li key={feature.id}>{feature.name}</li>)}</ul>
                    </details>
                    <button type="button" onClick={() => handleSelectPlan(item.originalIndex)}>
                      {state.plan === item.originalIndex ? '✓ Selected' : `Select ${item.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Panel>
        <Panel title="Subscription agreement"><div className="pch-grid">
          <Select label="Billing cycle" value={state.cycle} options={['Monthly','Annual']} onChange={value => patch({ cycle: value })} />
          <Field label="Start date" value={state.start} type="date" onChange={value => patch({ start: value })} />
          <Field label="Renewal date" value={renewalDate(state.start, state.cycle)} readOnly /><Field label="Agreement price" value={`${price} / ${state.cycle === 'Annual' ? 'year' : 'month'}`} readOnly />
          {state.plan >= 0 && plan.stores == null && <Field label="Licensed stores" value={state.enterpriseStores} type="number" min="1" step="1" onChange={value => patch({ enterpriseStores: value })} />}
        </div><div className="pch-note">Country-based merchant pricing. Annual amount is 12 monthly payments; tax excluded.</div></Panel>

      </>;
      case 3: return <>
        <Panel title="Device license allocation"><div className="pch-grid"><div>Registered devices<div className="pch-price">{state.devices.length} / {deviceLimit}</div></div><div>Remaining<div className="pch-price">{Math.max(0,deviceLimit-state.devices.length)}</div></div></div>
          <div className="pch-note">Current sample plans use one shared device allowance across POS, KDS, printers and scanners.<div className="pch-row">{deviceTypes.map(type=><span key={type} className="pch-pill">{type}: {state.devices.filter(device=>device.type===type).length}</span>)}</div></div></Panel>
        <Panel title="Merchant devices"><Table headings={['Name','Type','Licensed store','Identifier','Action']} rows={state.devices.map((device, index) => [
          <Field label="Device name" value={device.name} onChange={value => changeDevice(index,'name',value)} />,
          <Select label="Type" value={device.type} options={deviceTypes} onChange={value => changeDevice(index,'type',value)} />,
          <Select label="Store" value={state.stores[device.store]?.licensed ? device.store : ''} options={[{value:'',label:'Select licensed store'},...state.stores.flatMap((item,i)=>item.licensed?[{value:i,label:item.name}]:[])]} onChange={value => changeDevice(index,'store',value === '' ? -1 : Number(value))} />,
          <Field label="Identifier" value={device.serial} onChange={value => changeDevice(index,'serial',value)} />,
          <button type="button" onClick={() => patch({ devices: state.devices.filter((_,i)=>i!==index) })}>Remove</button>,
        ])} /><button type="button" disabled={state.devices.length >= deviceLimit} onClick={() => patch({ devices:[...state.devices,{name:'',type:'',store:-1,serial:''}] })}>+ Register device</button></Panel>
      </>;
      case 4: return <>
        <Panel title="Inherited merchant subscription"><div className="pch-note">{plan.name} · {state.cycle} · {state.merchant.country}. Configure store access now; operational access requires an active subscription.</div></Panel>
        <Panel title="Assign stores to subscription"><Table headings={['Store ID','Location','Type','License']} rows={state.stores.map((item, index) => [item.code,item.name,item.type,
          <label className="pch-check"><input type="checkbox" checked={item.licensed} onChange={event => changeStore('licensed', event.target.checked, index)} />Licensed</label>])} />
          <div className="pch-note">{licensed} / {storeLimit} store licenses selected · {deviceLimit} device licenses.</div>
        </Panel>
        <div className="pch-context-toolbar">{storePicker}</div><Panel title="Effective feature resolution"><Table headings={['Feature','Type relevance','Plan entitlement','Store setting','Effective']} rows={masterFeatureItems.map((feature)=>{
        const status=featureStatus(feature,store);
        const relevant=status !== 'Not relevant';
        const entitled=status !== 'Not entitled';
        return [feature.name,relevant?'Relevant':'Not relevant',entitled?'Included':'Excluded',
          <input aria-label={`Enable ${feature.name}`} type="checkbox" checked={!store.off?.includes(feature.id)&&relevant&&entitled&&store.licensed} disabled={!relevant||!entitled||!store.licensed}
            onChange={event=>changeStore('off',toggleItem(store.off || [],feature.id,!event.target.checked))} />,status||'Enabled'];
      })} /></Panel><div className="pch-note">Store relevance, subscription entitlement and store settings are separate access gates.</div></>;
      case 5: return <>
        {!storePhase && <>
        <Panel title="Select business roles"><div className="pch-note">Business store type: {state.merchant.type}. Choose roles here; assign them and configure permissions separately for each store.</div>{roleTemplatesState.loading && <p className="pch-note">Loading role templates for {state.merchant.type}…</p>}{roleTemplatesState.error && <div className="pch-error" role="alert">{roleTemplatesState.error}</div>}<div className="pch-grid">{[...new Set([...roleTemplates,...state.roles.filter(role=>role.source!=='Custom').map(role=>role.source)])].map(name=><label className="pch-check pch-role-option" key={name}>
          <input type="checkbox" checked={state.roles.some(role=>role.source===name)} disabled={!roleTemplates.includes(name) && !state.roles.some(role=>role.source===name)} onChange={event=>toggleTemplate(name,event.target.checked)} />{name}{!roleTemplates.includes(name) ? ' (not applicable — deselect)' : ''}
        </label>)}</div><div className="pch-row pch-between"><span className="pch-pill">{state.roles.length} merchant roles</span><button type="button" onClick={()=>setCustom({open:true,code:'',name:'',description:'',status:'ACTIVE',scope:'Store',id:null})}>+ Custom merchant role</button></div>
          {custom.open&&<div className="pch-note"><div className="pch-grid"><Field label="Role code *" value={custom.code} required={false} onChange={value=>setCustom({...custom,code:value})}/><Field label="Role name *" value={custom.name} required={false} onChange={value=>setCustom({...custom,name:value})}/>
            <Field label="Description" value={custom.description} required={false} onChange={value=>setCustom({...custom,description:value})}/>
            <Select label="Status *" value={custom.status} options={[{value:'ACTIVE',label:'Active'},{value:'INACTIVE',label:'Inactive'}]} onChange={value=>setCustom({...custom,status:value})}/>
            </div>
            <div className="pch-row"><button type="button" onClick={()=>{
              const code=custom.code.trim();
              if(!code) return setError('Role code is required.');
              if(!/^[A-Za-z0-9_-]+$/.test(code)) return setError('Role code may contain only letters, numbers, underscores and hyphens.');
              if([...roleTemplatesState.items,...state.roles.filter(role=>role.id!==custom.id)].some(role=>String(role.code || role.roleCode || '').toLowerCase()===code.toLowerCase())) return setError('Enter a unique role code.');
              if(!['ACTIVE','INACTIVE'].includes(custom.status)) return setError('Select a valid role status.');
              const details={code,description:custom.description.trim(),status:custom.status};
              const name=custom.name.trim();if(!name||[...roleTemplates,...state.roles.filter(role=>role.id!==custom.id).map(role=>role.name)].some(item=>item.toLowerCase()===name.toLowerCase()))return setError('Enter a unique role name.');
              if(custom.id) patch({roles:state.roles.map(role=>role.id===custom.id?{...role,...details,name,scope:custom.scope}:role)}); else addRole(name,'Custom',custom.scope,details);setError('');setCustom({open:false,code:'',name:'',description:'',status:'ACTIVE',scope:'Store',id:null});
            }}>{custom.id?'Save role':'Add role'}</button><button type="button" onClick={()=>setCustom({...custom,open:false})}>Cancel</button></div></div>}
        </Panel>
        {state.roles.some(role=>role.source==='Custom')&&<Panel title="Custom merchant roles"><Table headings={['Role code','Role name','Description','Status','Actions']} rows={state.roles.filter(role=>role.source==='Custom').map(role=>[role.code || role.roleCode || '—',role.name,role.description || '—',String(role.status || 'ACTIVE').toUpperCase()==='INACTIVE'?'Inactive':'Active',<div className="pch-row"><button type="button" onClick={()=>setCustom({open:true,code:role.code || role.roleCode || '',name:role.name,description:role.description || '',status:String(role.status || 'ACTIVE').toUpperCase(),scope:role.scope,id:role.id})}>Edit role</button><button type="button" onClick={()=>patch({roles:state.roles.filter(item=>item.id!==role.id),activeRole:0})}>Remove role</button></div>])}/></Panel>}
        </>}
        {storePhase && <Panel title="Map selected business roles to this store">
          <div className="pch-grid">{storePicker}</div>
          <div className="pch-grid">{state.roles.map(role=><label key={role.id} className="pch-check pch-role-option">
            <input type="checkbox" disabled={String(role.status || 'ACTIVE').toUpperCase()==='INACTIVE' && !store.roleIds?.includes(role.id)} checked={Boolean(store.roleIds?.includes(role.id))} onChange={event=>{
              const checked=event.target.checked;
              const permissions={...(store.rolePermissions || {})};
              if(checked && !permissions[role.id]) permissions[role.id]=masterFeatureItems.map(()=>[]);
              if(!checked) delete permissions[role.id];
              setState(previous=>({...previous,stores:previous.stores.map((item,index)=>index===previous.store?{...item,roleIds:toggleItem(item.roleIds || [],role.id,checked),rolePermissions:permissions}:item)}));
            }}/>{role.name}{String(role.status || 'ACTIVE').toUpperCase()==='INACTIVE' ? ' (Inactive)' : ''}
          </label>)}</div>
          <div className="pch-note">Only business-selected roles appear here. Permissions below apply to this store only.</div>
        </Panel>}
        {storePhase && currentRole&&<Panel title="Configure permissions"><div className="pch-grid">
          <Select label="Actual merchant role" value={state.roles.findIndex(role=>role.id===currentRole.id)} options={assignedRoles.map(role=>({value:state.roles.findIndex(item=>item.id===role.id),label:role.name}))} onChange={value=>patch({activeRole:Number(value)})}/>{storePicker}</div>
          <div className="pch-note">Owner: {state.merchant.display} · Source: {currentRole.source} · Scope: {currentRole.scope}</div>
          <Table headings={['Feature','Defined permissions','Store access']} rows={masterFeatureItems.map((feature,index)=>{
            const apiPermissions=masterFeaturesState.permissions[String(feature.id)] || [];
            const catalogFeature=catalog.find(item=>item.n.toLowerCase()===feature.name.toLowerCase());
            const actions=apiPermissions.length
              ? apiPermissions.map(permission=>permission.name || permission.permissionKey).filter(Boolean)
              : (catalogFeature?.a || ['View']);
            const status=featureStatus(feature,store);
            return [feature.name,
              <div className="pch-row">{actions.map(action=><label className="pch-check" key={action}><input type="checkbox" checked={Boolean(store.rolePermissions?.[currentRole.id]?.[index]?.includes(action))} disabled={Boolean(status)}
                onChange={event=>changeStore('rolePermissions',{...store.rolePermissions,[currentRole.id]:effectiveFeatureItems.map((_,featureIndex)=>featureIndex===index?toggleItem(store.rolePermissions?.[currentRole.id]?.[featureIndex] || [],action,event.target.checked):(store.rolePermissions?.[currentRole.id]?.[featureIndex] || []))})}/>{action}</label>)}</div>,status||'Available'];
          })}/>
        </Panel>}
      </>;
      default: return null;
    }
  }

  if (!codesReady) {
    return (
      <div id="pch-new">
        <MerchantPageHeader editing={editing} code={state.merchant.code} onBack={onCancel} />
        <div className="pch-note" role="status">
          {codeError || 'Generating merchant and store codes…'}
          {codeError && (
            <button type="button" onClick={() => {
              initialCodes.current = null;
              setCodeError('');
              setCodeAttempt(n => n + 1);
            }}>
              Retry code generation
            </button>
          )}
        </div>
      </div>
    );
  }

  if (manageSubscription) return <div id="pch-new">
    <MerchantPageHeader editing={editing} code={state.merchant.code} onBack={onCancel}/>
    <main className="pch-confirmation">
      <div className="pch-eyebrow">Merchant subscription</div>
      <h1>Manage Subscription</h1>
      <p className="pch-muted">{state.merchant.business} · {state.merchant.code}</p>
      <Panel title="Subscription Details"><div className="pch-grid"><div>
        <Detail label="Plan" value={plan.name}/>
        <Detail label="Subscription reference" value={state.subscriptionId || 'Assigned after backend subscription creation'}/>
        <Detail label="Status" value={state.subscriptionStatus || 'Pending activation'}/>
        <Detail label="Start date" value={state.start}/>
      </div><div>
        <Detail label="Billing cycle" value={state.cycle}/>
        <Detail label="Sample agreement amount" value={price}/>
        <Detail label="Next renewal date" value={state.subscriptionStatus === 'Cancelled' ? 'Not renewing' : renewalDate(state.start,state.cycle)}/>
        <Detail label="Payment" value="Not collected in this flow"/><Detail label="Employee allowance" value={employeeLimit || 'Not set'}/>
      </div></div></Panel>
      <Panel title="Usage & Limits"><div className="pch-grid">
        <div className="pch-usage"><Detail label="Registered stores" value={state.stores.length+' / '+storeLimit}/>
          <progress aria-label="Store usage" value={state.stores.length} max={storeLimit || 1}/></div>
        <div className="pch-usage"><Detail label="Registered devices" value={state.devices.length+' / '+deviceLimit}/>
          <progress aria-label="Device usage" value={state.devices.length} max={deviceLimit || 1}/></div>
        <div className="pch-usage"><Detail label="Registered employees" value={employeeUsage}/>
          {employeeCount !== null && employeeLimit > 0 ? <progress aria-label="Employee usage" value={employeeCount} max={employeeLimit}/> : <p className="pch-muted">Employee usage is not available.</p>}
        </div>
      </div><div className="pch-note">Current sample plans use a shared device allowance. Store types control relevance; the subscription controls entitlement.</div></Panel>
      <Panel title="Included Features"><div className="pch-row">{plan.f.map(index=><span className="pch-pill" key={index}>{catalog[index].n}</span>)}</div></Panel>
      <Panel title="Payment History">
        <div className="pch-row pch-between"><span>Billing records and payment status</span>
          <label className="pch-history-filter">Status <select value={historyStatus} onChange={event=>setHistoryStatus(event.target.value)}>
            {['All',...new Set((state.paymentHistory || []).map(item=>item.status))].map(status=><option key={status}>{status}</option>)}
          </select></label>
        </div>
        <Table headings={['Date','Plan / Cycle','Amount','Payment Method','Status','Actions']} rows={(state.paymentHistory || []).filter(item=>historyStatus==='All'||item.status===historyStatus).map(item=>[
          new Date(item.createdAt).toLocaleDateString(), item.plan+' / '+item.cycle,
          new Intl.NumberFormat('en',{style:'currency',currency:item.currency}).format(item.amount),item.method,
          <span className="pch-subscription-status">{item.status}</span>,
          <button type="button" onClick={()=>setHistoryDetails(item)}>View Details</button>
        ])}/>
        {!(state.paymentHistory || []).some(item=>historyStatus==='All'||item.status===historyStatus)&&<p className="pch-note">No payment records to show.</p>}
        <div className="pch-note">Pending integration records are local billing previews, not payment receipts. Payment status and transaction references must come from the payment API.</div>
      </Panel>
      {historyDetails && <Panel title="Payment Record Details" action={<button type="button" onClick={()=>setHistoryDetails(null)}>Close Details</button>}>
        <div className="pch-grid"><div>
          <Detail label="Record reference" value={historyDetails.id}/><Detail label="Date" value={new Date(historyDetails.createdAt).toLocaleString()}/>
          <Detail label="Plan" value={historyDetails.plan}/><Detail label="Billing cycle" value={historyDetails.cycle}/>
          <Detail label="Payment method" value={historyDetails.method}/>
        </div><div>
          <Detail label="Currency" value={historyDetails.currency}/><Detail label="Subtotal" value={Number(historyDetails.subtotal).toFixed(2)}/>
          <Detail label="Sample tax" value={Number(historyDetails.tax).toFixed(2)}/><Detail label="Total" value={Number(historyDetails.amount).toFixed(2)}/>
          <Detail label="Status" value={historyDetails.status}/><Detail label="Transaction ID" value={historyDetails.transactionId || 'Not available — payment not processed'}/>
        </div></div>
      </Panel>}
      <Panel title="Plan Actions"><div className="pch-row">
        <button type="button" className="pch-primary" disabled={submitting || state.subscriptionStatus === 'Cancelled'} onClick={()=>{
          setManageSubscription(false);setCancelRequested(false);setReturnToReview(false);
          patch({phase:'merchant',step:2,furthest:2,done:false,merchantSaved:true});
        }}>Change Plan / Billing Cycle</button>
        <button type="button" disabled={submitting || state.subscriptionStatus === 'Cancelled'} onClick={()=>setCancelRequested(true)}>Cancel Subscription</button>
      </div><div className="pch-note">Upgrade or downgrade through Change Plan. Selected limits must accommodate registered stores and devices. Changes are saved locally through the existing handler.</div></Panel>
      {cancelRequested && <Panel title="Cancel this subscription?">
        <div className="pch-note">This changes the local subscription status to Cancelled. It does not delete the merchant or stores, or contact a billing provider.</div>
        <div className="pch-row"><button type="button" disabled={submitting} onClick={()=>setCancelRequested(false)}>Keep Subscription</button>
          <button type="button" disabled={submitting} onClick={async()=>{
            if(submitting)return;
            setSubmitting(true);setError('');
            try {
              const saved={...state,subscriptionStatus:'Cancelled',done:true,merchantSaved:true};
              await onComplete?.(structuredClone(saved));
              patch(saved);setCancelRequested(false);
            } catch(failure){setError(failure.message || 'Unable to save subscription status.');}
            finally{setSubmitting(false);}
          }}>{submitting?'Saving…':'Confirm Cancellation'}</button>
        </div>
      </Panel>}
      {error && <div className="pch-error" role="alert">{error}</div>}
      <div className="pch-footerbar"><button type="button" disabled={submitting} onClick={onCancel}>Back to Merchants</button>
        <button type="button" disabled={submitting} onClick={()=>{setCancelRequested(false);setManageSubscription(false);setError('');}}>Back to Confirmation</button>
      </div>
    </main>
  </div>;

  if (state.done && !storePhase) return <div id="pch-new">
    <MerchantPageHeader editing={editing} code={state.merchant.code} onBack={onCancel}/>
    <main className="pch-success-screen">
      <div className="pch-success-art" aria-hidden="true"><span>✓</span><i/><i/><i/><i/><i/><i/></div>
      <h1>Subscription Successful!</h1>
      <p>Welcome to Pinaka Commerce Hub, {state.merchant.business}.</p>
      <div className="pch-success-details">
        <Detail label="Plan" value={<strong>{plan.name}</strong>}/>
        <Detail label="Billing Cycle" value={state.cycle}/><Detail label="Employees" value={employeeUsage}/>
        <Detail label="Amount" value={<strong>{price} / {state.cycle==='Annual'?'year':'month'}</strong>}/>
        <Detail label="Subscription ID" value={state.subscriptionId || 'Pending assignment'}/>
        <Detail label="Start Date" value={state.start}/>
        <Detail label="Next Billing Date" value={renewalDate(state.start,state.cycle)}/>
        <Detail label="Status" value={<span className="pch-subscription-status">{state.subscriptionStatus || 'Pending activation'}</span>}/>
      </div>
      {error && <div className="pch-error" role="alert">{error}</div>}
      <div className="pch-success-actions">
        <button type="button" className="pch-subscribe-now" onClick={onDashboard}>Go to Dashboard</button>
        <button type="button" disabled={submitting} onClick={async()=>{
          if(submitting)return;
          setSubmitting(true);
          try {
            let stores = state.stores;
            if (!stores.length) {
              pendingStoreKey.current ||= makeSafeId('store-request');
              const code=formatGeneratedCode('store',await getNextSequence({kind:'store',requestId:pendingStoreKey.current}));
              pendingStoreKey.current=null;
              stores=[{...createStore(code),...businessTypeFields(state.merchant),licensed:true}];
            }
            setReturnToReview(false);
            patch({phase:'store',stores,store:0,step:1,furthest:0,done:false});
          }catch(failure){setError(failure.message || 'Unable to begin store setup.');}
          finally{setSubmitting(false);}
        }}>{submitting?'Preparing…':state.stores.length?'Manage Store Setup':'Add Your First Store'}</button>
      </div>
      <div className="pch-success-secondary"><button type="button" onClick={()=>setManageSubscription(true)}>Manage Subscription</button><button type="button" onClick={onCancel}>Back to Merchants</button></div>
      <p className="pch-preview-note">Subscription selection saved. Payment and activation have not been performed.</p>
    </main>
  </div>;

  if (state.done) return <div id="pch-new">
    <MerchantPageHeader editing={editing} code={state.merchant.code} onBack={onCancel}/>
    <main className="pch-confirmation">
      <div className="pch-eyebrow">{storePhase ? 'Store setup complete' : 'Step 5 of 5 · Subscription Confirmed'}</div>
      <h1>{storePhase ? 'Store configuration saved' : 'Subscription Confirmed'}</h1>
      <Panel title={state.merchant.business}><div className="pch-grid"><div>
        <Detail label="Merchant code" value={state.merchant.code}/><Detail label="Plan" value={plan.name}/>
        <Detail label="Billing cycle" value={state.cycle}/><Detail label="Sample amount" value={price}/><Detail label="Start date" value={state.start}/><Detail label="Next renewal date" value={renewalDate(state.start,state.cycle)}/><Detail label="Subscription reference" value={state.subscriptionId || 'Assigned after backend subscription creation'}/>
      </div><div><Detail label="Registered stores" value={state.stores.length + ' / ' + storeLimit}/>
        <Detail label="Subscription status" value={state.subscriptionStatus || 'Pending activation'}/>
      </div></div><div className="pch-note">Your subscription details have been saved. This confirmation does not indicate payment or activation.</div></Panel>
      {error && <div className="pch-error" role="alert">{error}</div>}
      <div className="pch-footerbar">
        <button type="button" onClick={onCancel}>Back to Merchants</button>
        <button type="button" disabled={submitting} onClick={()=>{setCancelRequested(false);setManageSubscription(true);}}>Manage Subscription</button>
        <button type="button" onClick={()=>{setReturnToReview(false);patch({phase:'merchant',step:0,furthest:2,done:false});}}>Edit merchant</button>
        <button type="button" className="pch-primary" disabled={submitting} onClick={async()=>{
          if(submitting)return;
          if (state.stores.length > 0) {
            onCancel();
            return;
          }
          setSubmitting(true);
          try {
            let stores=state.stores;
            if(!stores.length){
              pendingStoreKey.current ||= makeSafeId('store-request');
              const code=formatGeneratedCode('store',await getNextSequence({kind:'store',requestId:pendingStoreKey.current}));
              stores=[{...createStore(code),...businessTypeFields(state.merchant),licensed:true}];
              pendingStoreKey.current=null;
            }
            setReturnToReview(false);
            patch({phase:'store',stores,store:0,step:1,furthest:0,done:false});
          } catch(failure){setError(failure.message || 'Unable to begin store setup.');}
          finally{setSubmitting(false);}
        }}>{submitting?'Preparing…':state.stores.length?'Manage Store Setup':'Add First Store'}</button>
      </div>
    </main>
  </div>;

  return <div id="pch-new" className={!storePhase && state.step===6 ? "pch-checkout-mode" : undefined}>
    <MerchantPageHeader editing={editing} code={state.merchant.code} onBack={onCancel}/>
    <div className="pch-layout"><aside><div className="pch-eyebrow pch-aside-note">{storePhase?'Configure stores':'Add merchant'}</div>
      <nav className="pch-rail" aria-label="Setup steps">{stepLabels.map(([name,description],index)=><button type="button" key={name}
        disabled={submitting || index>=journey.length || (index>state.furthest && index>position)}
        onClick={()=>goTo(journey[index])} className={index===position?'pch-current':''} aria-current={index===position?'step':undefined}>
        <span className="pch-number">{index<position?'✓':index+1}</span><span>{name}<small className="pch-muted pch-rail-description">{description}</small></span>
      </button>)}</nav>
    </aside><main>
      <div ref={headingRef} className="pch-eyebrow">Step {position+1} of {stepLabels.length}</div>
      <h1>{!storePhase && state.step===6 ? 'Review & Subscribe' : stepLabels[position]?.[0]}</h1><p className="pch-muted">{!storePhase && state.step===6 ? 'Please review your plan details before subscribing.' : stepLabels[position]?.[1]}</p>
      <form ref={formRef} onSubmit={submit}><fieldset className="pch-form-content" disabled={submitting}>
        {content()}{error&&<div className="pch-error" role="alert">{error}</div>}
        <div className={!storePhase && state.step===6 ? "pch-footerbar pch-review-navigation" : "pch-footerbar"}><button type="button" onClick={onCancel}>Back to Merchants</button>
          <button type="button" disabled={position===0} onClick={()=>goTo(journey[position-1])}>← Back</button>
          <button hidden={!storePhase && state.step===6} className="pch-primary" type="submit">{submitting?'Saving…':state.step===6?(storePhase?'Save store setup':(editing || state.merchantSaved)?'Save subscription changes':'Subscribe & Create Merchant'):returnToReview?'Save & return to review':'Continue →'}</button>
        </div>
      </fieldset></form>
    </main></div><footer>{storePhase?'Store setup':'Merchant creation'}</footer>
  </div>;
}



// Keep the full draft so merchant edits preserve existing stores, devices and roles.
export function onboardingToRow(data) {
  const now=new Date();
  return {id:data.merchant.code,merchantCode:data.merchant.code,name:data.merchant.business,email:data.merchant.email,phone:data.merchant.phone,
    employeeCount:employeeCountFor(data),employeeLimit:fallbackPackages[data.plan]?.employees ?? Number(data.enterpriseEmployees),country:data.merchant.country,state:data.merchant.state,storeLimit:fallbackPackages[data.plan]?.stores ?? Number(data.enterpriseStores),stores:data.stores.length,plan:fallbackPackages[data.plan]?.name||'',status:'Inactive',createdAt:now.toISOString(),joined:now.toLocaleDateString(),active:'—',
    initials:data.merchant.business.trim().split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase(),_onboarding:structuredClone(data)};
}


// The existing App routes both render this page; the URL selects the mode.
export default function AddMerchant({ localMerchants = [], onSave }) {
  const {merchantId}=useParams();
  return <MerchantRouteEditor key={merchantId || 'new'} merchantId={merchantId} localMerchants={localMerchants} onSave={onSave}/>;
}

export function merchantDetailToDraft(result, fallback={}) {
  const response=result.raw || {};
  const raw=response.merchant || response.data?.merchant || response.data || response;
  if(raw._onboarding) return structuredClone(raw._onboarding);
  const draft=initialState();
  const address=raw.businessAddress || raw.address || '';
  const subscription=result.subscription || raw.subscription || {};
  const planId = subscription.planId || subscription.plan_id || raw.planId || raw.plan_id || '';
  const planName = subscription.planName || subscription.planCode || raw.plan || fallback.plan || '';
  const matchPlan=String(planName).toLowerCase().replace(/[^a-z]/g,'').replace(/plan$/,'');
  draft.planId = planId;
  draft.planName = planName;
  draft.plan=fallbackPackages.findIndex(plan=>plan.name.toLowerCase()===matchPlan);
  const cycle=String(subscription.billingCycle||raw.billingCycle||'').toLowerCase();draft.cycle=cycle==='monthly'?'Monthly':cycle==='annual'||cycle==='yearly'?'Annual':'';
  draft.subscriptionStatus=subscription.status || 'Pending activation';
  draft.paymentHistory=Array.isArray(raw.paymentHistory)?raw.paymentHistory:[];
  draft.subscriptionId=subscription.id || subscription.subscriptionId || '';
  draft.start=String(subscription.startDate||subscription.start||'').slice(0,10);
  draft.merchant={code:String(raw.merchantCode||raw.code||fallback.merchantCode||raw.merchantId||raw.id||fallback.id||''),business:raw.legalBusinessName||raw.businessName||fallback.name||'',display:raw.businessName||raw.name||fallback.name||'',name:raw.ownerName||[raw.firstName,raw.lastName].filter(Boolean).join(' ')||'',email:raw.email||fallback.email||'',phone:raw.phone||fallback.phone||'',addressLine1:raw.addressLine1||(typeof address==='string'?address:address.addressLine1||address.street||''),addressLine2:raw.addressLine2||(typeof address==='object'?address.addressLine2||address.unit||'':''),city:raw.city||address.city||'',state:raw.state||address.state||'',postal:raw.postalCode||address.zipCode||'',country:raw.country||address.country||''};
  draft.merchant={...draft.merchant,type:raw.storeTypeName || raw.storeType?.name || (typeof raw.storeType==='string'?raw.storeType:''),storeTypeId:raw.storeTypeId ?? raw.storeType?.id ?? '',storeTypeCode:raw.storeTypeCode || ''};
  const stores=response.stores||raw.stores||[];
  draft.stores=(Array.isArray(stores)?stores:[]).map(item=>{
    const store=createStore(String(item.storeCode||item.storeId||item.id||''));
    const a=item.address||{};const type=String(item.storeType||item.type||'').toLowerCase();
    return {...store,roleIds:item.roleIds,rolePermissions:item.rolePermissions,name:item.storeName||item.name||'',type:(typeof item.storeType==='object' ? item.storeType?.name : item.storeTypeName || item.storeType || item.type) || '',storeTypeId:item.storeTypeId ?? (typeof item.storeType==='object' ? item.storeType?.id : undefined),storeTypeCode:item.storeTypeCode || '',addressLine1:item.addressLine1||(typeof a==='string'?a:a.addressLine1||a.street||''),addressLine2:item.addressLine2||(typeof a==='object'?a.addressLine2||a.unit||'':''),city:item.city||a.city||'',state:item.state||a.state||'',postal:item.postalCode||item.zip||a.zipCode||'',country:item.country||a.country||'',timezone:item.timezone||'',url:item.baseUrl||item.url||'',logo:item.logo||'',licensed:item.licensed===true,off:Array.isArray(item.off)?item.off:store.off,hours:Array.isArray(item.hours)&&item.hours.length===7?item.hours:store.hours};
  });
  draft.roleIds = Array.isArray(raw.roleIds) ? raw.roleIds : (Array.isArray(response.roleIds) ? response.roleIds : []);
  draft.roles=Array.isArray(raw.roles)?raw.roles.filter(role=>role.name&&Array.isArray(role.perms)&&role.perms.length===catalog.length).map((role,index)=>({...role,id:role.id||'saved-role-'+index,source:role.source||'Custom',scope:role.scope||'Store'})):(draft.roleIds.length ? draft.roleIds.map((id, index) => ({ id, name: `Role ${index + 1}`, source: 'Custom', scope: 'Store', perms: catalog.map(f => f.a) })) : []);
  draft.employeeCount=raw.employeeCount ?? result.merchant?.employeeCount ?? fallback.employeeCount ?? (Array.isArray(raw.employees)?raw.employees.length:null);
  draft.enterpriseEmployees=raw.enterpriseEmployees ?? subscription.employeeLimit ?? '';
  draft.devices=Array.isArray(raw.devices)?raw.devices.map(device=>({...device,store:typeof device.store==='number'?device.store:draft.stores.findIndex(store=>store.code===String(device.storeId))})):[];
  return draft;
}
function MerchantRouteEditor({merchantId,localMerchants,onSave}) {
  const nav=useNavigate();const location=useLocation();
  const selected=merchantId
    ? localMerchants.find(row=>String(row.id)===String(merchantId)) ||
      (location.state?.merchant && String(location.state.merchant.id)===String(merchantId) ? location.state.merchant : null)
    : null;
  const [loaded,setLoaded]=useState(()=>({row:selected,draft:selected?._onboarding||null,loading:Boolean(merchantId&&!selected?._onboarding),error:''}));
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(!merchantId||selected?._onboarding) return;
    let active=true;setLoaded(previous=>({...previous,loading:true,error:''}));
    getMerchant(merchantId).then(result=>{if(active)setLoaded({row:selected||result.merchant,draft:merchantDetailToDraft(result,selected||result.merchant),loading:false,error:''});}).catch(error=>{if(active)setLoaded(previous=>({...previous,loading:false,error:error.message||'Unable to load merchant details.'}));});
    return()=>{active=false;};
  },[merchantId,attempt]);
  const cancel=()=>nav('/merchants');
  const savedRow=useRef(null);
  async function saveFull(data) {
    if(typeof onSave !== 'function') throw new Error('Connect the existing onSave handler in App.jsx before saving.');
    let savedData = data;
    let serverResult;

    console.log("[SUBSCRIBE NOW] Selected Plan details:", data.planDetails, "Roles:", data.roles);

    if (merchantId) {
      serverResult = await updateMerchant(merchantId, data);
      console.log("[UPDATE MERCHANT API RESPONSE]", serverResult);
    } else {
      serverResult = await createMerchant(data);
      console.log("[CREATE MERCHANT API RESPONSE]", serverResult);
    }

    const savedMerchant = serverResult?.merchant || serverResult?.data?.merchant;
    const savedDataWithId = savedData;
    const summary=onboardingToRow(savedDataWithId);
    if(!merchantId && !savedRow.current && localMerchants.some(row=>String(row.id)===String(summary.id))) throw new Error('Merchant code already exists.');
    const existing=savedRow.current || loaded.row;
    const row={...existing,...summary,id:existing?.id||savedMerchant?.id||serverResult?.merchantId||summary.id,merchantId:savedMerchant?.id||serverResult?.merchantId||existing?.id||summary.id,createdAt:existing?.createdAt||summary.createdAt,joined:existing?.joined||summary.joined,status:existing?.status||summary.status};
    await onSave(row);
    savedRow.current=row;
    const subscription = serverResult?.subscription || serverResult?.data?.subscription;
    return {
      merchantId: row.id,
      merchantCode: savedData.merchant.code,
      stores: savedDataWithId.stores,
      subscriptionId: subscription?.id || subscription?.subscriptionId || serverResult?.subscriptionId || '',
      subscriptionStatus: subscription?.status || serverResult?.subscriptionStatus || 'Pending activation',
    };
  }
  if (loaded.loading) return (
    <div id="pch-new">
      <MerchantPageHeader editing onBack={cancel} />
      <div className="pch-note" role="status">Loading full merchant details…</div>
    </div>
  );
  if (loaded.error) return (
    <div id="pch-new">
      <MerchantPageHeader editing onBack={cancel} />
      <div className="pch-note">
        <p role="alert">{loaded.error}</p>
        <button type="button" onClick={() => setAttempt(n => n + 1)}>Retry</button>
        <button type="button" onClick={cancel}>Back to merchants</button>
      </div>
    </div>
  );
  return <MerchantOnboarding initialValue={merchantId?loaded.draft:undefined} onComplete={saveFull} onCancel={cancel} onDashboard={()=>nav('/dashboard')}/>;
}
