import { getMerchant } from "../api/merchants";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import React, { useState, useRef, useEffect } from 'react';


import "../styles/merchant-form.css";

// Master-data options stay unchanged. Entry fields start empty.
const CODE_PREFIXES = Object.freeze({merchant:'MER-',store:'STR-'});
export function formatGeneratedCode(kind, sequence) {
  if(!Object.hasOwn(CODE_PREFIXES,kind) || !Number.isSafeInteger(sequence) || sequence<1) throw new Error('The code service must return a positive integer sequence.');
  return CODE_PREFIXES[kind]+String(sequence).padStart(kind==='merchant'?4:5,'0');
}

// Sample master data. Replace with your API catalog.
const catalog=[{n:'Fastkeys',a:['View','Use']},{n:'Refunds',a:['View','Create','Approve','Override']},{n:'Safe Drop',a:['View','Create']},{n:'Loyalty',a:['View','Enroll','Redeem']},{n:'Delivery',a:['View','Manage']},{n:'Weighing Scale',a:['Use']},{n:'Payroll',a:['View','Manage']},{n:'KDS',a:['View','Manage']},{n:'Service Charges',a:['View','Configure']}];
const verticals={Grocery:{f:[0,1,2,3,4,5,6],r:['Store Manager','Shift Manager','Cashier','Inventory Clerk','Receiving Clerk']},Convenience:{f:[0,1,2,3,6],r:['Store Manager','Shift Manager','Cashier','Inventory Clerk']},Restaurant:{f:[0,1,3,4,6,7,8],r:['Restaurant Manager','Shift Manager','Cashier','Server','Kitchen Manager','Kitchen Staff']},Liquor:{f:[0,1,2,3,6],r:['Store Manager','Cashier']},Kiosk:{f:[0,1,3],r:['Store Manager','Cashier']},Fuel:{f:[0,1,2,3],r:['Store Manager','Shift Manager','Cashier','Fuel Attendant']}};
const packages=[{name:'Starter',f:[0,1,2,5],stores:1,devices:3,employees:5},{name:'Pro',f:[0,1,2,3,4,5,7,8],stores:5,devices:15,employees:50},{name:'Enterprise',f:[0,1,2,3,4,5,6,7,8],stores:null,devices:null,employees:null}];const regions={'United States':{currency:'USD',prices:[29,99,249]},India:{currency:'INR',prices:[999,3499,8999]},Canada:{currency:'CAD',prices:[39,129,329]},'United Kingdom':{currency:'GBP',prices:[25,85,219]},Australia:{currency:'AUD',prices:[45,149,379]}};





// Format validation for supported countries; these do not verify delivery or phone ownership.
const countryRules = {
  'United States': {dial:'+1',phone:/^\d{10}$/,postal:/^\d{5}(-\d{4})?$/,postalLabel:'ZIP Code',hint:'ZIP: 85001 or 85001-1234.',zones:['America/New_York','America/Chicago','America/Denver','America/Phoenix','America/Los_Angeles','America/Anchorage','Pacific/Honolulu']},
  India: {dial:'+91',phone:/^\d{10}$/,postal:/^[1-9]\d{5}$/,postalLabel:'PIN Code',hint:'PIN: six digits, e.g. 500081.',zones:['Asia/Kolkata']},
  Canada: {dial:'+1',phone:/^\d{10}$/,postal:/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,postalLabel:'Postal Code',hint:'Postal code: A1A 1A1.',zones:['America/Toronto','America/Vancouver','America/Edmonton','America/Winnipeg','America/Halifax','America/St_Johns','America/Regina','America/Whitehorse']},
  'United Kingdom': {dial:'+44',phone:/^\d{9,10}$/,postal:/^(GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i,postalLabel:'Postcode',hint:'Postcode: SW1A 1AA.',zones:['Europe/London']},
  Australia: {dial:'+61',phone:/^\d{9}$/,postal:/^\d{4}$/,postalLabel:'Postcode',hint:'Postcode: four digits, e.g. 2000.',zones:['Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Adelaide','Australia/Perth','Australia/Darwin','Australia/Hobart','Australia/Broken_Hill','Australia/Lord_Howe']},
};

const deviceTypes=['POS','KDS','Printer','Scanner'];
const templateDefinitions=Object.fromEntries([...new Set(Object.values(verticals).flatMap(type=>type.r))].map(name=>[name,{perms:catalog.map(feature=>name==='Cashier'?feature.a.filter(action=>['View','Use','Create','Enroll','Redeem'].includes(action)):[...feature.a])}]));

// Browser-local sequence for this mockup. Supply getNextSequence for server-wide codes.
let codeQueue=Promise.resolve();
function reserveLocalSequence({kind,requestId}) {
  const reserve=()=>{
    const key='pch.onboarding.sequences.v1';
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    const requests=saved.requests||{};
    if(requests[requestId]?.kind===kind) return requests[requestId].value;
    const value=(saved[kind]??(kind==='merchant'?4000:50000))+1;
    if(!Number.isSafeInteger(value)||value<1) throw new Error('Invalid stored code sequence.');
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
function validateAddress(value, label) {
  const rule=countryRules[value.country];
  if(!rule) return label+': select a supported country.';
  for(const key of ['city','state','address','postal']) if(!String(value[key]??'').trim()) return label+': '+key+' is required.';
  if(!rule.postal.test(String(value.postal).trim())) return label+': invalid '+rule.postalLabel+'. '+rule.hint;
  return '';
}
function validatePhone(phone,country) {
  const rule=countryRules[country];
  if(!rule || !String(phone??'').trim()) return 'Merchant phone number is required.';
  const raw=String(phone).trim();
  if(!/^\+?[\d ()-]+$/.test(raw)) return 'Enter a phone number using digits and an optional country prefix.';
  let number=raw.replace(/[ ()-]/g,'');
  if(number.startsWith('+')) {if(!number.startsWith(rule.dial)) return 'Phone prefix must match '+country+' ('+rule.dial+').';number=number.slice(rule.dial.length);}
  else if(['India','United Kingdom','Australia'].includes(country) && number.startsWith('0')) number=number.slice(1);
  if(!rule.phone.test(number)) return 'Enter a valid-length phone number for '+country+'.';
  return '';
}


// Common business email format: ASCII local part and DNS-style domain.
// International domains can be supplied in punycode form.
function validEmail(value) {
  const email=String(value ?? '');
  if(email.length>254 || /\s/.test(email)) return false;
  const parts=email.split('@');
  if(parts.length!==2) return false;
  const [local,domain]=parts;
  if(!local || local.length>64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if(!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
  const labels=domain.split('.');
  if(labels.length<2 || labels.some(label=>!label || label.length>63 || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label))) return false;
  return /^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]+)$/.test(labels[labels.length-1]);
}

function createStore(code='') {
  return {code,name:'',type:'',address:'',city:'',state:'',country:'',postal:'',timezone:'',url:'',logo:'',licensed:false,
    off:catalog.map((_,index)=>index),hours:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day=>({day,status:'',open:'',close:'',shifts:''}))};
}
function initialState() {
  return {step:0,furthest:0,done:false,store:0,plan:-1,cycle:'',start:'',enterpriseStores:'',enterpriseDevices:'',enterpriseEmployees:'',employeeCount:0,
    merchant:{code:'',name:'',business:'',display:'',email:'',phone:'',country:'',city:'',state:'',address:'',postal:''},
    phase:'merchant',subscriptionStatus:'Pending activation',stores:[],roles:[],activeRole:0,devices:[]};
}

function featureReason(state, index, store = state.stores[state.store]) {
  if (!store) return 'Select a store';
  if (!store.licensed) return 'Store not licensed';
  if (!(verticals[store.type]?.f || []).includes(index)) return 'Not relevant';
  if (!(packages[state.plan]?.f || []).includes(index)) return 'Not entitled';
  if (store.off.includes(index)) return 'Disabled at store';
  return '';
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

export function validate(state) {
  const stage = state.step;
  if(!state.merchant.code || (state.phase === 'store' && state.stores.some(store=>!store.code))) return 'Wait for automatic code generation.';
  if (state.phase !== 'store') {
    if (stage === 0 || stage === 6) {
      const addressError = validateAddress(state.merchant, 'Primary contact');
      if (addressError) return addressError;
      const phoneError = validatePhone(state.merchant.phone, state.merchant.country);
      if (phoneError) return phoneError;
      if (Object.values(state.merchant).some(value => !String(value).trim())) return 'Complete all merchant and primary contact fields.';
      if (!validEmail(state.merchant.email)) return 'Enter a valid email such as name@example.com.';
    }
    if (stage === 2 || stage === 6) {
      const selectedPlan = packages[state.plan];
      if (!selectedPlan) return 'Select a subscription plan.';
      if (!['Monthly','Annual'].includes(state.cycle)) return 'Select a billing cycle.';
      if (!renewalDate(state.start, state.cycle)) return 'Enter a valid subscription start date.';
      const limits = [selectedPlan.stores ?? +state.enterpriseStores, selectedPlan.devices ?? +state.enterpriseDevices, selectedPlan.employees ?? +state.enterpriseEmployees];
      if (!limits.every(value => Number.isInteger(value) && value > 0)) return 'License limits must be positive whole numbers.';
      if (employeeCountFor(state) !== null && employeeCountFor(state) > limits[2]) return 'The selected plan cannot accommodate registered employees.';
      if (state.stores.length > limits[0] || state.devices.length > limits[1]) return 'The selected plan cannot accommodate existing stores or devices.';
    }
    return '';
  }
  if (!state.stores.length) return 'Add at least one store.';
  if (stage === 0 || stage === 6) {
    const addressError=validateAddress(state.merchant,'Primary contact');
    if(addressError) return addressError;
    const phoneError=validatePhone(state.merchant.phone,state.merchant.country);
    if(phoneError) return phoneError;
    if (Object.values(state.merchant).some(value => !String(value).trim())) return 'Complete all merchant and primary contact fields.';
    if (!validEmail(state.merchant.email)) return 'Enter a valid merchant email, for example name@example.com. Spaces and consecutive dots are not allowed.';
  }
  if (stage === 1 || stage === 6) {
    for (const store of state.stores) {
      const addressError=validateAddress(store,store.name||store.code);
      if(addressError) return addressError;
      if(!verticals[store.type]) return 'Select a valid store type.';
      if(!countryRules[store.country].zones.includes(store.timezone)) return store.name+': select a time zone for '+store.country+'.';
      if (['name','address','city','state','postal','timezone'].some(key => !String(store[key] ?? '').trim())) return 'Complete each store’s location details.';
      if (store.url) {
        try { const url = new URL(store.url); if (url.protocol !== 'https:' || url.username || url.password) throw Error(); }
        catch { return `${store.name}: enter a valid HTTPS base URL.`; }
      }
      const scheduleError = validateSchedule(store.hours);
      if (scheduleError) return store.name + ': ' + scheduleError;
    }
  }
  const plan = packages[state.plan];
  if(stage>=2 && !plan) return 'Select a subscription plan.';
  if(stage>=2 && !['Monthly','Annual'].includes(state.cycle)) return 'Select a billing cycle.';
  const storeLimit = plan?.stores ?? +state.enterpriseStores;
  const deviceLimit = plan?.devices ?? +state.enterpriseDevices;
  const employeeLimit = plan?.employees ?? +state.enterpriseEmployees;
  if (stage >= 2) {
    if (![storeLimit, deviceLimit, employeeLimit].every(value => Number.isInteger(value) && value > 0)) return 'License limits must be positive whole numbers.';
    if (employeeCountFor(state) !== null && employeeCountFor(state) > employeeLimit) return 'Employee limit exceeded for the selected plan.';
    const licensed = state.stores.filter(store => store.licensed).length;
    if (!licensed || licensed > storeLimit) return `Select between 1 and ${storeLimit} store licenses.`;
    if (!renewalDate(state.start, state.cycle)) return 'Enter a valid subscription start date.';
  }
  if (stage >= 3) {
    if (state.devices.length > deviceLimit) return 'Device license limit exceeded. Remove devices or upgrade the subscription.';
    if(state.devices.some(device=>!deviceTypes.includes(device.type))) return 'Select a valid device type.';
    if (state.devices.some(device => !device.name.trim() || !device.serial.trim() || !state.stores[device.store]?.licensed)) return 'Every device needs a name, identifier, and licensed store.';
    const identifiers = state.devices.map(device => device.serial.trim().toLowerCase());
    if (new Set(identifiers).size !== identifiers.length) return 'Device identifiers must be unique.';
  }
  if(stage>=5 && state.roles.some(role=>!String(role.name??'').trim() || !['Store','Merchant'].includes(role.scope))) return 'Every role requires a name and valid scope.';
  if(stage>=5 && new Set(state.roles.map(role=>role.name.trim().toLowerCase())).size!==state.roles.length) return 'Role names must be unique.';
  if (stage >= 5 && !state.roles.length) return 'Select at least one role template or create a custom role.';
  return '';
}


// Static UI flow. Never fetched from master data.

function Field({ label, value, onChange, type = 'text', required = true, ...props }) {
  return <label className="pch-field">{label}{required && !props.readOnly ? ' *' : ''}
    <input {...props} type={type} value={value ?? ''} required={required}
      maxLength={type === 'email' ? 254 : props.maxLength}
      placeholder={type === 'email' ? 'name@example.com' : props.placeholder}
      onBlur={event => {
        if(type === 'email') event.target.setCustomValidity(event.target.value && !validEmail(event.target.value) ? 'Enter a valid email such as name@example.com.' : '');
      }}
      onChange={onChange ? event => { event.target.setCustomValidity(''); onChange(event.target.value); } : undefined} />
  </label>;
}
function Select({ label, value, onChange, options, required = true }) {
  return <label className="pch-field">{label}<select required={required} value={value} onChange={event => onChange(event.target.value)}><option value="" disabled={required}>Select {label.replace(/\s*\*$/, "")}</option>
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
  const [state, setState] = useState(()=>initialValue?{...structuredClone(initialValue),step:0,furthest:6,done:false,store:0,activeRole:0,phase:'merchant'}:initialState());
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
    if(!requestKeys.current) requestKeys.current={merchant:crypto.randomUUID()};
    if(!initialCodes.current) initialCodes.current=Promise.all(['merchant'].map(async kind=>{
      if(typeof getNextSequence!=='function') throw new Error('Connect getNextSequence to your backend code reservation service.');
      return formatGeneratedCode(kind,await getNextSequence({kind,requestId:requestKeys.current[kind]}));
    }));
    initialCodes.current.then(([merchantCode,storeCode])=>{if(active){setState(previous=>({...previous,merchant:{...previous.merchant,code:merchantCode},stores:previous.stores.map((store,index)=>index===0?{...store,code:storeCode}:store)}));setCodesReady(true);setCodeError('');}}).catch(error=>{if(active)setCodeError(error.message||'Unable to reserve codes.');});
    return ()=>{active=false;};
  },[getNextSequence,codeAttempt,initialValue]);
  const [error, setError] = useState('');
  const [custom, setCustom] = useState({ open: false, name: '', scope: 'Store', id: null });
  const [returnToReview, setReturnToReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef(null);
  const formRef = useRef(null);
  useEffect(() => { headingRef.current?.scrollIntoView({ block: 'start' }); }, [state.step, state.done]);
  const store = state.stores[state.store] || createStore();
  const plan = packages[state.plan] || {name:'',f:[],stores:0,devices:0};
  const storeLimit = plan.stores ?? Number(state.enterpriseStores);
  const deviceLimit = plan.devices ?? Number(state.enterpriseDevices);
  const employeeLimit = plan.employees ?? Number(state.enterpriseEmployees);
  const employeeCount = employeeCountFor(state);
  const employeeUsage = `${employeeCount ?? '—'} / ${employeeLimit || 'Not set'}`;
  const licensed = state.stores.filter(item => item.licensed).length;
  const region = regions[state.merchant.country] || {currency:'',prices:[]};
  const formatPrice = amount => !region.currency || !Number.isFinite(amount) ? '—' : new Intl.NumberFormat('en', { style: 'currency', currency: region.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const price = formatPrice(region.prices[state.plan] * (state.cycle === 'Annual' ? 12 : 1));
  const subtotal = Math.round((region.prices[state.plan] || 0) * (state.cycle === 'Annual' ? 12 : 1) * 100) / 100;
  const sampleTax = Math.round(subtotal * 0.086 * 100) / 100;
  const sampleTotal = Math.round((subtotal + sampleTax) * 100) / 100;
  const roleTemplates = [...new Set([...state.stores.flatMap(item => (verticals[item.type]?.r || [])), ...state.roles.filter(role=>role.source!=='Custom').map(role=>role.source)])];
  const currentRole = state.roles[state.activeRole];
  const storePhase = state.phase === 'store';
  const journey = storePhase ? [1,4,3,5,6] : [0,2,6];
  const stepLabels = storePhase
    ? [['Store details','Location & optional operating schedule'],['Subscription & features','Inherited plan and store enablement'],['Devices','Register & allocate licenses'],['Roles & permissions','Templates and custom roles'],['Review & save','Review store configuration']]
    : [['Merchant details','Business & primary contact'],['Choose plan','Country pricing & subscription limits'],['Review Plan & Subscribe','Merchant review and billing summary'],['Subscription Confirmed','Subscription details saved']];
  const position = journey.indexOf(state.step);
  const patch = values => { setError(''); setState(previous => ({ ...previous, ...values })); };
  const changeMerchant = (key, value) => { setError(''); setState(previous => ({ ...previous, merchant: { ...previous.merchant, [key]: value } })); };
  const changeStore = (key, value, index = state.store) => { setError(''); setState(previous => ({ ...previous,
    stores: previous.stores.map((item, i) => i === index ? { ...item, [key]: value } : item) })); };
  const changeDevice = (index, key, value) => { setError(''); setState(previous => ({ ...previous,
    devices: previous.devices.map((device, i) => i === index ? { ...device, [key]: value } : device) })); };
  const storePicker = <Select label="Store context" value={state.store} onChange={value => patch({ store: Number(value) })}
    options={state.stores.map((item, i) => ({ value: i, label: `${item.code} · ${item.name}` }))} />;
  const merchantField = (label, key, type = 'text') => <Field label={label} value={state.merchant[key]} type={type} onChange={value => changeMerchant(key, value)} />;
  const storeField = (label, key, type = 'text', required = true) => <Field label={label} value={store[key]} type={type} required={required} onChange={value => changeStore(key, value)} />;

  function goTo(step) {
    if (submitting || !journey.includes(step)) return;
    if (custom.open) return setError('Save or cancel the custom role before continuing.');
    const target = journey.indexOf(step);
    if (target > position) {
      if (!formRef.current?.reportValidity()) return;
      for (const current of journey.slice(0, target)) {
        const message = validate({...state, step: current});
        if (message) return setError(message);
      }
    }
    setReturnToReview(false);
    patch({step, done:false});
  }
  function editSection(step, values = {}) {
    setReturnToReview(true);
    setCustom({ open: false, name: '', scope: 'Store', id: null });
    patch({ ...values, step, done: false });
  }
  const editButton = (label, step, values) => journey.includes(step) ? <button type="button" onClick={() => editSection(step, values)}>{label}</button> : null;
  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    if (custom.open) return setError('Save or cancel the custom role before continuing.');
    const message = validate(state);
    if (message) return setError(message);
    if (state.step === 6) {
      setSubmitting(true);
      try {
        const historyEntry = {
          id:'BILL-' + crypto.randomUUID(), createdAt:new Date().toISOString(),
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
        const saved = {...state, done:true, merchantSaved:true,
          paymentHistory:!storePhase && billingChanged ? [historyEntry,...previousHistory] : previousHistory};
        await onComplete?.(structuredClone(saved));
        patch(saved);
      } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to provision. Please try again.'); }
      finally { setSubmitting(false); }
    } else if (returnToReview) {
      setReturnToReview(false);
      patch({ step: 6 });
    } else patch({ step: journey[position + 1], furthest: Math.max(state.furthest, position + 1) });
  }
  function addRole(name, source, scope = 'Store') {
    setState(previous => ({ ...previous, activeRole: previous.roles.length, roles: [...previous.roles, {
      id: `role-${Date.now()}-${previous.roles.length}`, name, source, scope,
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
          {[storeLimit + ' Store' + (storeLimit === 1 ? '' : 's'), 'Up to ' + deviceLimit + ' Devices', 'Up to ' + employeeLimit + ' Employees', ...plan.f.slice(0,4).map(index=>catalog[index].n)].map(item=><li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
        </ul>
        <details className="pch-all-features"><summary>View all features</summary><ul>{plan.f.map(index=><li key={index}>{catalog[index].n}</li>)}</ul></details>
        <div className="pch-review-links">{editButton('Change plan',2)}{editButton('Edit merchant details',0)}</div>
        <details className="pch-all-features"><summary>Review merchant details</summary>
          <p>{state.merchant.business}<br/>{state.merchant.name}<br/>{state.merchant.email}<br/>{state.merchant.phone}</p>
          <p>{['country','city','state','address','postal'].map(key=>state.merchant[key]).join(', ')}</p>
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
        <Detail label="Address" value={['country','city','state','address','postal'].map(key => state.merchant[key]).join(', ')} />
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
          <div className="pch-review-body"><Detail label="Address" value={[item.country,item.city,item.state,item.address,item.postal].join(', ')} /><Detail label="Base URL" value={item.url || 'Not provided'} /><Detail label="Time zone / currency" value={`${item.timezone} / ${(regions[item.country]?.currency || '')}`} />
            {item.logo && <img className="pch-store-logo" src={item.logo} alt={`${item.name} logo`} />}
            <Table headings={['Day','Hours','Shifts']} rows={item.hours.map(day=>[day.day,day.status==='Open'?`${day.open} – ${day.close}${day.close<day.open?' (next day)':''}`:day.status,day.status==='Closed'?0:day.shifts])}/>
          </div></details>)}
      </Panel>
      <Panel title="Device registrations" action={editButton('Edit devices', 3)}><Table headings={['Device','Type','Store','Identifier']}
        rows={state.devices.map(device => [device.name, device.type, state.stores[device.store]?.name, device.serial])} /></Panel>
      <Panel title="Effective store features" action={editButton('Edit features', 4)}>{state.stores.map((item,index)=><details key={item.code} className="pch-review-details"><summary>{item.name} · {catalog.filter((_,i)=>!featureReason(state,i,item)).length} features enabled</summary>
        <div className="pch-review-body">{editButton('Edit store features',4,{store:index})}<Table headings={['Feature','Effective result']} rows={catalog.map((feature,i)=>[feature.n,featureReason(state,i,item)||'Enabled'])}/></div></details>)}</Panel>
      <Panel title="Merchant roles & permissions" action={editButton('Edit roles', 5)}><Table headings={['Role','Source','Scope','Defined actions','Action']}
        rows={state.roles.map((role,index) => [role.name, role.source, role.scope, role.perms.reduce((total, actions) => total + actions.length, 0),editButton('Edit permissions',5,{activeRole:index})])} />
        {state.roles.map(role=><details className="pch-review-details" key={role.id}><summary>{role.name} · defined permissions</summary><div className="pch-review-body"><Table headings={['Feature','Actions']} rows={catalog.map((feature,index)=>[feature.n,role.perms[index].join(', ')||'No permission'])}/></div></details>)}
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
          <Select label="Country *" value={state.merchant.country} options={Object.keys(regions)} onChange={value => { changeMerchant('country', value); }} />
          {merchantField('City','city')}{merchantField('State / Province','state')}{merchantField('Address','address')}{merchantField((countryRules[state.merchant.country]?.postalLabel || 'Postal Code'),'postal')}<p className="pch-small pch-muted">{(countryRules[state.merchant.country]?.hint || 'Select a country to see its format requirements.')} Phone: national format or {(countryRules[state.merchant.country]?.dial || '')} international format.</p>
        </div></Panel>
      </>;
      case 1: if(!state.stores.length) return <Panel title="Store locations"><p className="pch-note">No store details were returned. Add a location to enter its details.</p><button type="button" disabled={submitting} onClick={async()=>{setSubmitting(true);try{const code=formatGeneratedCode('store',await getNextSequence({kind:'store',requestId:crypto.randomUUID()}));patch({stores:[{...createStore(code),country:state.merchant.country,licensed:true}],store:0});}catch(error){setError(error.message);}finally{setSubmitting(false);}}}>+ Add location</button></Panel>;
      return <>
        <div className="pch-context-toolbar">{storePicker}<button type="button" disabled={submitting} onClick={async () => {
          if(addingStore.current) return;
          if(state.stores.length >= storeLimit) return setError('Store limit reached. Update the merchant plan before adding another store.');
          const message = validate(state); if (message) return setError(message);
          addingStore.current=true;setSubmitting(true);
          try {
            pendingStoreKey.current ||= crypto.randomUUID();
            const code=formatGeneratedCode('store',await getNextSequence({kind:'store',requestId:pendingStoreKey.current}));
            if(state.stores.some(item=>item.code===code)) throw new Error('The backend returned an existing store code.');
            const location={...createStore(code),country:state.merchant.country,licensed:true};
            patch({stores:[...state.stores,location],store:state.stores.length});pendingStoreKey.current=null;
          } catch(error) {setError(error.message||'Unable to generate store code.');}
          finally {addingStore.current=false;setSubmitting(false);}
        }}>+ Add location</button></div>
        <Panel title="Location identity"><div className="pch-grid">
          {storeField('Store name','name')}<Select label="Store Type Master" value={store.type} options={Object.keys(verticals)} onChange={value => changeStore('type', value)} />
          {storeField('Store Base URL','url','url',false)}<Field label="Store ID" value={store.code} readOnly />
        </div><div className="pch-note">{store.type} supplies relevant features and role templates. It does not grant commercial access.</div></Panel>
        <Panel title="Address & regional settings"><div className="pch-grid">
          <Select label="Store country" value={store.country} options={Object.keys(regions)} onChange={value => { changeStore('country', value); changeStore('timezone', ''); }} />
          {storeField('City','city')}{storeField('State / Province','state')}{storeField('Address','address')}{storeField((countryRules[store.country]?.postalLabel || 'Postal Code'),'postal')}
          <Select label="Time zone *" value={store.timezone} options={(countryRules[store.country]?.zones || [])} onChange={value=>changeStore('timezone',value)}/><Field label="Currency" value={(regions[store.country]?.currency || '')} readOnly />
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
        <Panel title="Merchant subscription"><div className="pch-row pch-between"><h3>{state.merchant.display}</h3><span className="pch-pill">{state.merchant.country} · {region.currency}</span></div>
          <div className="pch-plans">{packages.map((item, index) => <div key={item.name} className={`pch-plan ${state.plan === index ? 'pch-selected' : ''}`}>
            <h2>{item.name}</h2><div className="pch-price">{formatPrice(region.prices[index])}</div><span className="pch-small pch-muted">per merchant / month</span>
            <div>{item.stores ?? 'Custom'} stores<br />{item.devices ?? 'Custom'} devices<br />{item.employees ?? 'Custom'} employees</div><details><summary>Included features ({item.f.length})</summary><ul>{item.f.map(i=><li key={i}>{catalog[i].n}</li>)}</ul></details>
            <button type="button" onClick={() => patch({ plan: index })}>{state.plan === index ? '✓ Selected' : `Select ${item.name}`}</button>
          </div>)}</div>
        </Panel>
        <Panel title="Subscription agreement"><div className="pch-grid">
          <Select label="Billing cycle" value={state.cycle} options={['Monthly','Annual']} onChange={value => patch({ cycle: value })} />
          <Field label="Start date" value={state.start} type="date" onChange={value => patch({ start: value })} />
          <Field label="Renewal date" value={renewalDate(state.start, state.cycle)} readOnly /><Field label="Agreement price" value={`${price} / ${state.cycle === 'Annual' ? 'year' : 'month'}`} readOnly />
          {state.plan >= 0 && plan.stores == null && <Field label="Licensed stores" value={state.enterpriseStores} type="number" min="1" step="1" onChange={value => patch({ enterpriseStores: value })} />}
          {state.plan >= 0 && plan.devices == null && <Field label="Licensed devices" value={state.enterpriseDevices} type="number" min="1" step="1" onChange={value => patch({ enterpriseDevices: value })} />}
          {state.plan >= 0 && plan.employees == null && <Field label="Licensed employees" value={state.enterpriseEmployees} type="number" min="1" step="1" onChange={value => patch({ enterpriseEmployees: value })} />}
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
        <div className="pch-context-toolbar">{storePicker}</div><Panel title="Effective feature resolution"><Table headings={['Feature','Type relevance','Plan entitlement','Store setting','Effective']} rows={catalog.map((feature,index)=>{
        const relevant=(verticals[store.type]?.f || []).includes(index), entitled=plan.f.includes(index);
        return [feature.n,relevant?'Relevant':'Not relevant',entitled?'Included':'Excluded',
          <input aria-label={`Enable ${feature.n}`} type="checkbox" checked={!store.off.includes(index)&&relevant&&entitled&&store.licensed} disabled={!relevant||!entitled||!store.licensed}
            onChange={event=>changeStore('off',toggleItem(store.off,index,!event.target.checked))} />,featureReason(state,index)||'Enabled'];
      })} /></Panel><div className="pch-note">Store relevance, subscription entitlement and store settings are separate access gates.</div></>;
      case 5: return <>
        <Panel title="Create merchant roles from templates"><div className="pch-grid">{roleTemplates.map(name=><label className="pch-check pch-role-option" key={name}>
          <input type="checkbox" checked={state.roles.some(role=>role.source===name)} onChange={event=>toggleTemplate(name,event.target.checked)} />{name}
        </label>)}</div><div className="pch-row pch-between"><span className="pch-pill">{state.roles.length} merchant roles</span><button type="button" onClick={()=>setCustom({open:true,name:'',scope:'Store',id:null})}>+ Custom merchant role</button></div>
          {custom.open&&<div className="pch-note"><div className="pch-grid"><Field label="Role name" value={custom.name} required={false} onChange={value=>setCustom({...custom,name:value})}/>
            <Select label="Role scope" value={custom.scope} options={['Store','Merchant']} onChange={value=>setCustom({...custom,scope:value})}/></div>
            <div className="pch-row"><button type="button" onClick={()=>{
              const name=custom.name.trim();if(!name||[...roleTemplates,...state.roles.filter(role=>role.id!==custom.id).map(role=>role.name)].some(item=>item.toLowerCase()===name.toLowerCase()))return setError('Enter a unique role name.');
              if(custom.id) patch({roles:state.roles.map(role=>role.id===custom.id?{...role,name,scope:custom.scope}:role)}); else addRole(name,'Custom',custom.scope);setCustom({open:false,name:'',scope:'Store',id:null});
            }}>{custom.id?'Save role':'Add role'}</button><button type="button" onClick={()=>setCustom({...custom,open:false})}>Cancel</button></div></div>}
        </Panel>
        {state.roles.some(role=>role.source==='Custom')&&<Panel title="Custom merchant roles"><Table headings={['Name','Scope','Actions']} rows={state.roles.filter(role=>role.source==='Custom').map(role=>[role.name,role.scope,<div className="pch-row"><button type="button" onClick={()=>setCustom({open:true,name:role.name,scope:role.scope,id:role.id})}>Edit role</button><button type="button" onClick={()=>patch({roles:state.roles.filter(item=>item.id!==role.id),activeRole:0})}>Remove role</button></div>])}/></Panel>}
        {currentRole&&<Panel title="Configure permissions"><div className="pch-grid">
          <Select label="Actual merchant role" value={state.activeRole} options={state.roles.map((role,index)=>({value:index,label:role.name}))} onChange={value=>patch({activeRole:Number(value)})}/>{storePicker}</div>
          <div className="pch-note">Owner: {state.merchant.display} · Source: {currentRole.source} · Scope: {currentRole.scope}</div>
          <Table headings={['Feature','Defined permissions','Store access']} rows={catalog.map((feature,index)=>[feature.n,
            <div className="pch-row">{feature.a.map(action=><label className="pch-check" key={action}><input type="checkbox" checked={currentRole.perms[index].includes(action)} disabled={Boolean(featureReason(state,index))}
              onChange={event=>patch({roles:state.roles.map((role,roleIndex)=>roleIndex===state.activeRole?{...role,perms:role.perms.map((permissions,featureIndex)=>featureIndex===index?toggleItem(permissions,action,event.target.checked):permissions)}:role)})}/>{action}</label>)}</div>,featureReason(state,index)||'Available'])}/>
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
          if(state.stores.length){onCancel();return;}
          setSubmitting(true);
          try {
            pendingStoreKey.current ||= crypto.randomUUID();
            const code=formatGeneratedCode('store',await getNextSequence({kind:'store',requestId:pendingStoreKey.current}));
            pendingStoreKey.current=null;
            setReturnToReview(false);
            patch({phase:'store',stores:[{...createStore(code),country:state.merchant.country,licensed:true}],store:0,step:1,furthest:0,done:false});
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
      <div className="pch-eyebrow">{storePhase ? 'Store setup complete' : 'Step 4 of 4 · Subscription Confirmed'}</div>
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
              pendingStoreKey.current ||= crypto.randomUUID();
              const code=formatGeneratedCode('store',await getNextSequence({kind:'store',requestId:pendingStoreKey.current}));
              stores=[{...createStore(code),country:state.merchant.country,licensed:true}];
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
  return {id:data.merchant.code,name:data.merchant.business,email:data.merchant.email,phone:data.merchant.phone,
    employeeCount:employeeCountFor(data),employeeLimit:packages[data.plan]?.employees ?? Number(data.enterpriseEmployees),country:data.merchant.country,state:data.merchant.state,storeLimit:packages[data.plan]?.stores ?? Number(data.enterpriseStores),stores:data.stores.length,plan:packages[data.plan]?.name||'',status:'Inactive',createdAt:now.toISOString(),joined:now.toLocaleDateString(),active:'—',
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
  const matchPlan=String(subscription.planName||subscription.planCode||raw.plan||fallback.plan||'').toLowerCase().replace(/[^a-z]/g,'').replace(/plan$/,'');
  draft.plan=packages.findIndex(plan=>plan.name.toLowerCase()===matchPlan);
  const cycle=String(subscription.billingCycle||raw.billingCycle||'').toLowerCase();draft.cycle=cycle==='monthly'?'Monthly':cycle==='annual'||cycle==='yearly'?'Annual':'';
  draft.subscriptionStatus=subscription.status || 'Pending activation';
  draft.paymentHistory=Array.isArray(raw.paymentHistory)?raw.paymentHistory:[];
  draft.subscriptionId=subscription.id || subscription.subscriptionId || '';
  draft.start=String(subscription.startDate||subscription.start||'').slice(0,10);
  draft.merchant={code:String(raw.merchantCode||raw.merchantId||raw.id||fallback.id||''),business:raw.legalBusinessName||raw.businessName||fallback.name||'',display:raw.businessName||raw.name||fallback.name||'',name:raw.ownerName||[raw.firstName,raw.lastName].filter(Boolean).join(' ')||'',email:raw.email||fallback.email||'',phone:raw.phone||fallback.phone||'',country:raw.country||'',city:raw.city||address.city||'',state:raw.state||address.state||'',address:typeof address==='string'?address:address.street||'',postal:raw.postalCode||address.zipCode||''};
  const stores=response.stores||raw.stores||[];
  draft.stores=(Array.isArray(stores)?stores:[]).map(item=>{
    const store=createStore(String(item.storeCode||item.storeId||item.id||''));
    const a=item.address||{};const type=String(item.storeType||item.type||'').toLowerCase();
    return {...store,name:item.storeName||item.name||'',type:Object.keys(verticals).find(name=>name.toLowerCase()===type)||'',country:item.country||raw.country||'',city:item.city||a.city||'',state:item.state||a.state||'',address:typeof a==='string'?a:a.street||'',postal:item.postalCode||item.zip||a.zipCode||'',timezone:item.timezone||'',url:item.baseUrl||item.url||'',logo:item.logo||'',licensed:item.licensed===true,off:Array.isArray(item.off)?item.off:store.off,hours:Array.isArray(item.hours)&&item.hours.length===7?item.hours:store.hours};
  });
  draft.roles=Array.isArray(raw.roles)?raw.roles.filter(role=>role.name&&Array.isArray(role.perms)&&role.perms.length===catalog.length).map((role,index)=>({...role,id:role.id||'saved-role-'+index,source:role.source||'Custom',scope:role.scope||'Store'})):[];
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
    const summary=onboardingToRow(data);
    if(!merchantId && !savedRow.current && localMerchants.some(row=>String(row.id)===String(summary.id))) throw new Error('Merchant code already exists.');
    const existing=savedRow.current || loaded.row;
    const row={...existing,...summary,id:existing?.id||summary.id,createdAt:existing?.createdAt||summary.createdAt,joined:existing?.joined||summary.joined,status:existing?.status||summary.status};
    await onSave(row);
    savedRow.current=row;
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
