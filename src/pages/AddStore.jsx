import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listMerchantEmployees } from "../api/employees";
import { getMerchant, listMerchants } from "../api/merchants";
import { listFeatures } from "../api/features";
import { storeTypesApi } from "../api/storeTypes";
import { api, ApiError } from "../api/http";
import { endpoints } from "../api/endpoints";
import "../styles/add-store.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const COUNTRIES = {
  India: { currency: "INR", zones: ["Asia/Kolkata"] },
  "United States": { currency: "USD", zones: ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles"] },
  Canada: { currency: "CAD", zones: ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg"] },
  "United Kingdom": { currency: "GBP", zones: ["Europe/London"] },
  Australia: { currency: "AUD", zones: ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth"] },
};
const STEPS = ["Store Details", "Subscription", "Features", "Roles & Permissions", "Employees", "Review & Provision"];
const STEP_HINTS = ["Enter basic information", "Review merchant subscription", "Enable or disable features", "Configure store level access", "Assign employees to this store", "Review and create store"];
const listFrom = value => {
  const rows = value?.features ?? value?.storeTypeFeatures ?? value?.items ?? value?.data ?? value;
  return Array.isArray(rows) ? rows : [];
};
const featureName = item => typeof item === "string" ? item : item?.name ?? item?.featureName ?? item?.featureKey ?? item?.code ?? "";
const featureActions = item => Array.isArray(item?.actions) ? item.actions.map(action => typeof action === "string" ? action : action?.name ?? action?.action ?? action?.code).filter(Boolean) : [];
const idOf = value => String(value?.id ?? value?._id ?? value?.merchantId ?? (typeof value === "string" || typeof value === "number" ? value : ""));
const initials = value => String(value || "Store").split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
const blankHours = () => DAYS.map(day => ({ day, status: "Closed", open: "", close: "", shifts: 0 }));
const blankStore = (merchantId = "") => ({
  merchantId, name: "", type: "", storeTypeId: "", storeCode: "", id: "", phone: "", email: "", url: "",
  logo: "", currency: "", status: "Active", addressLine1: "", addressLine2: "", city: "",
  state: "", zip: "", country: "", timezone: "", defaultLanguage: "", hours: blankHours(),
});
const unwrapMerchant = result => {
  const raw = result?.raw || result || {};
  const merchant = raw.merchant || raw.data?.merchant || raw.data || raw;
  const draft = merchant?._onboarding;
  const owner = { ...(draft?.merchant || {}), ...merchant, ...(result?.merchant || {}) };
  const sub = result?.subscription || raw.subscription || owner.subscription || {};
  const plan = sub.plan && typeof sub.plan === "object" ? sub.plan : {};
  return {
    owner,
    subscription: sub,
    typeId: String(owner.storeTypeId ?? owner.storeType?.id ?? draft?.merchant?.storeTypeId ?? ""),
    typeName: owner.storeTypeName || (typeof owner.storeType === "string" ? owner.storeType : owner.storeType?.name) || owner.type || "",
    roles: result?.roles || raw.roles || owner.roles || draft?.roles || [],
    plan,
  };
};
const Field = ({ label, value, onChange, type = "text", optional = false, ...props }) => (
  <label className="sf-field">
    <span>{label}{optional && <small> (Optional)</small>}</span>
    <input type={type} value={value ?? ""} onChange={event => onChange(event.target.value)} {...props} />
  </label>
);
const SelectField = ({ label, value, onChange, options, optional = false, ...props }) => (
  <label className="sf-field">
    <span>{label}{optional && <small> (Optional)</small>}</span>
    <select value={value ?? ""} onChange={event => onChange(event.target.value)} {...props}>
      {options.map(option => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);
const Panel = ({ title, subtitle, action, children, className = "" }) => (
  <section className={`sf-panel ${className}`}>
    {(title || action) && <div className="sf-panel-head"><div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
    {children}
  </section>
);
const Detail = ({ label, children }) => <div className="sf-detail"><span>{label}</span><strong>{children || "—"}</strong></div>;

export default function AddStore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { merchantId: routeMerchantId, storeId } = useParams();
  const editing = Boolean(storeId);
  const [store, setStore] = useState(() => blankStore(routeMerchantId || ""));
  const [merchants, setMerchants] = useState([]);
  const [merchantInfo, setMerchantInfo] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [merchantStores, setMerchantStores] = useState([]);
  const [storeTypes, setStoreTypes] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [typeFeatures, setTypeFeatures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [merchantError, setMerchantError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const saveLock = useRef(false);
  const featureDefaultsScope = useRef("");
  const loadedFeatureType = useRef("");
  const imageReads = useRef(0);
  const imageGeneration = useRef(0);
  const [enabledFeatures, setEnabledFeatures] = useState([]);
  const [roles, setRoles] = useState([]);
  const [activeRole, setActiveRole] = useState("");
  const [copyFromRole, setCopyFromRole] = useState("");
  const [permissions, setPermissions] = useState({});
  const [employeeAssignments, setEmployeeAssignments] = useState([]);
  const [pinEditorId, setPinEditorId] = useState("");
  const [pinDraft, setPinDraft] = useState("");
  const [pinError, setPinError] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [employeePage, setEmployeePage] = useState(1);
  const [featureSearch, setFeatureSearch] = useState("");
  const [featureCategory, setFeatureCategory] = useState("All Features");

  const merchantId = idOf(routeMerchantId || store.merchantId);
  const merchant = merchantInfo?.owner || merchants.find(item => idOf(item) === merchantId) || null;
  const merchantName = merchant?.name || merchant?.merchantName || merchant?.businessDisplayName || "Selected merchant";
  const selectedType = storeTypes.find(item => String(item.id) === String(store.storeTypeId)) || storeTypes.find(item => String(item.name).toLowerCase() === String(store.type).toLowerCase());
  const typeName = selectedType?.name || store.type || merchantInfo?.typeName || "";
  const plan = subscription?.plan && typeof subscription.plan === "object" ? subscription.plan : null;
  const planName = subscription?.planName || subscription?.planCode || plan?.name || plan?.planName || merchant?.plan || "No active plan";
  const billing = subscription?.billingCycle || subscription?.billingType || plan?.billingCycle || "—";
  const planPrice = subscription?.price ?? subscription?.agreementPrice ?? plan?.price ?? plan?.amount;
  const storeLimit = Number(subscription?.storeLimit ?? subscription?.maxStores ?? subscription?.locationLimit ?? plan?.includedStores ?? NaN);
  const planFeatureList = subscription?.includedFeatures ?? plan?.includedFeatures ?? plan?.features;
  const includedFeatures = useMemo(() => {
    const raw = listFrom(subscription?.includedFeatures ?? plan?.includedFeatures ?? plan?.features ?? []);
    return raw.map(featureName).filter(Boolean);
  }, [subscription, plan]);
  const featureRows = useMemo(() => {
    const source = store.storeTypeId ? typeFeatures : catalog;
    const unique = new Map();
    source.forEach(row => {
      const nested = row.feature || row.featureDetails || row.featureDefinition || row;
      const name = featureName(nested);
      if (name && !unique.has(name)) unique.set(name, { ...nested, name, actions: featureActions(nested), category: nested.category || row.category || "More", description: nested.description || "", defaultEnabled: row.defaultEnabled !== false });
    });
    return [...unique.values()];
  }, [typeFeatures, catalog, store.storeTypeId]);
  const roleDefinitions = (Array.isArray(merchantInfo?.roles) ? merchantInfo.roles : []).map(role => typeof role === "string" ? {name: role} : {...role, name: role.name || role.roleName}).filter(role => role.name);
  const categories = ["All Features", ...new Set(featureRows.map(row => row.category))];
  const entitled = name => planFeatureList == null
    ? Boolean(store.storeTypeId) && featureRows.some(row => row.name === name)
    : includedFeatures.some(item => item.toLowerCase() === name.toLowerCase());
  const filteredFeatures = featureRows.filter(row => {
    const matchesCategory = featureCategory === "All Features" || row.category === featureCategory;
    return matchesCategory && `${row.name} ${row.description}`.toLowerCase().includes(featureSearch.toLowerCase());
  });
  const activeEmployees = employees.filter(employee => String(employee.status || "").toUpperCase() === "ACTIVE" || employee.status === "Active");
  const employeeRows = activeEmployees.filter(employee => {
    const query = employeeSearch.toLowerCase();
    const matchText = `${employee.name} ${employee.id} ${employee.phone} ${employee.email} ${employee.role}`.toLowerCase().includes(query);
    const assigned = employeeAssignments.some(item => item.employeeId === String(employee.id ?? employee.employeeId));
    return matchText && (employeeFilter === "All" || (employeeFilter === "Assigned" ? assigned : !assigned));
  });
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(employeeRows.length / pageSize));
  const currentEmployeePage = Math.min(employeePage, pageCount);
  const pagedEmployees = employeeRows.slice((currentEmployeePage - 1) * pageSize, currentEmployeePage * pageSize);
  const currencyCode = store.currency || COUNTRIES[store.country]?.currency || "";
  const countrySettings = COUNTRIES[store.country];
  const enabledCount = enabledFeatures.length;
  const permissionCount = role => Object.values(permissions[role] || {}).reduce((sum, actions) => sum + Object.values(actions || {}).filter(Boolean).length, 0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setMastersLoading(true); setLoadError("");
      try {
        if (!routeMerchantId && !storeId) {
          const result = await listMerchants();
          if (!cancelled) setMerchants(Array.isArray(result) ? result : result?.merchants || result?.data?.merchants || []);
        }
        const [typesResult, featuresResult] = await Promise.all([storeTypesApi.getAll(), listFeatures()]);
        if (!cancelled) {
          setStoreTypes(Array.isArray(typesResult) ? typesResult : typesResult?.storeTypes || []);
          setCatalog(Array.isArray(featuresResult) ? featuresResult.filter(item => String(item.status || "Active").toUpperCase() !== "INACTIVE") : []);
        }
        if (storeId) {
          const response = await api.get(endpoints.store(encodeURIComponent(storeId)));
          const saved = response?.store || response;
          if (!cancelled) {
            const address = saved.address && typeof saved.address === "object" ? saved.address : {};
            const savedStore = {
              ...blankStore(routeMerchantId || saved.merchantId || saved.merchant),
              ...saved,
              merchantId: routeMerchantId || idOf(saved.merchantId || saved.merchant),
              id: saved.storeID || saved.storeId || saved.id || "",
              name: saved.storeName || saved.name || "",
              type: saved.storeType?.name || saved.storeTypeName || saved.storeType || saved.type || "",
              storeTypeId: String(saved.storeTypeId || saved.storeType?.id || ""),
              storeCode: saved.storeCode || saved.code || "",
              phone: saved.phone || "",
              email: saved.email || saved.storeEmail || "",
              url: saved.baseUrl || saved.url || saved.websiteUrl || "",
              logo: saved.logoUrl || saved.logo || "",
              addressLine1: saved.addressLine1 || address.addressLine1 || address.street || (typeof saved.address === "string" ? saved.address : ""),
              addressLine2: saved.addressLine2 || address.addressLine2 || "",
              city: saved.city || address.city || "",
              state: saved.state || address.state || "",
              zip: saved.zip || saved.postalCode || address.zipCode || "",
              country: saved.country || address.country || "",
              timezone: saved.timezone || "",
              currency: saved.currency || "",
              defaultLanguage: saved.defaultLanguage || "",
              status: saved.status || "Active",
              hours: Array.isArray(saved.hours) ? saved.hours : blankHours(),
            };
            setStore(savedStore);
            setEnabledFeatures((saved.features || saved.enabledFeatures || []).map(featureName).filter(Boolean));
            const savedRoles = (saved.storeRoles || []).map(role => typeof role === "string" ? role : role.name || role.roleName).filter(Boolean);
            setRoles(savedRoles);
            setActiveRole(savedRoles[0] || "");
            setPermissions(saved.storeRolePermissions || {});
            const assignments = saved.employeeAssignments || saved.storeEmployees || [];
            setEmployeeAssignments(assignments.map(item => ({ employeeId: String(item.employeeId ?? item.id ?? item.employee?.id ?? ""), role: item.role || item.storeRole || "" })).filter(item => item.employeeId));
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || "Unable to load the store setup.");
      } finally {
        if (!cancelled) { setLoading(false); setMastersLoading(false); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [routeMerchantId, storeId, reload]);

  useEffect(() => {
    let cancelled = false;
    setMerchantInfo(null); setSubscription(null); setMerchantStores([]); setEmployees([]); setMerchantError("");
    setMerchantLoading(Boolean(merchantId));
    if (!merchantId) return;
    async function loadMerchantContext() {
      try {
        const [result, employeeResult] = await Promise.all([getMerchant(merchantId), listMerchantEmployees(merchantId)]);
        if (cancelled) return;
        const info = unwrapMerchant(result);
        if (!idOf(info.owner)) throw new Error("Merchant details were not returned.");
        setMerchantInfo(info); setSubscription(info.subscription);
        const response = result?.raw || result || {};
        const rows = result?.stores ?? response.stores ?? response.data?.stores ?? info.owner.stores ?? [];
        setMerchantStores(Array.isArray(rows) ? rows : []);
        const employeeRows = Array.isArray(employeeResult) ? employeeResult : employeeResult?.employees ?? employeeResult?.data?.employees;
        if (!Array.isArray(employeeRows)) throw new Error("The merchant employee list could not be read.");
        setEmployees(employeeRows.filter(employee => !employee.merchantId || String(employee.merchantId) === merchantId).map(employee => ({
          ...employee, id: employee.id || employee.employeeId, name: employee.name || employee.employeeName || [employee.firstName, employee.lastName].filter(Boolean).join(" "),
          phone: employee.phone || employee.phoneNumber || "", role: typeof employee.role === "string" ? employee.role : employee.roleName || employee.role?.name || "",
        })).filter(employee => employee.id));
        // Inherit operational defaults only. Each new location gets its own name/code/address.
        if (!editing) {
          const country = info.owner.country || info.owner.address?.country || "";
          setStore(current => ({...current, merchantId, type: info.typeName, storeTypeId: info.typeId,
            country, currency: info.owner.currency || info.subscription?.currency || COUNTRIES[country]?.currency || "",
            timezone: info.owner.timezone || "", defaultLanguage: info.owner.defaultLanguage || ""}));
          const inherited = (Array.isArray(info.roles) ? info.roles : []).map(role => typeof role === "string" ? role : role.name || role.roleName).filter(Boolean);
          setRoles([...new Set(inherited)]); setActiveRole(inherited[0] || "");
        }
      } catch (err) { if (!cancelled) setMerchantError(err?.message || "Unable to load the selected merchant."); }
      finally { if (!cancelled) setMerchantLoading(false); }
    }
    loadMerchantContext();
    return () => { cancelled = true; };
  }, [merchantId, editing, reload]);

  useEffect(() => {
    let cancelled = false;
    loadedFeatureType.current = "";
    setTypeFeatures([]);
    if (!store.storeTypeId) { setFeaturesLoading(false); return; }
    setFeaturesLoading(true);
    storeTypesApi.getFeatures(store.storeTypeId).then(data => {
      if (!cancelled) { loadedFeatureType.current = store.storeTypeId; setTypeFeatures(listFrom(data)); }
    }).catch(err => { if (!cancelled) setLoadError(err?.message || "Unable to load store-type features."); })
      .finally(() => { if (!cancelled) setFeaturesLoading(false); });
    return () => { cancelled = true; };
  }, [store.storeTypeId, reload]);

  useEffect(() => {
    if (editing || loading || merchantLoading || featuresLoading || !merchantInfo || !store.storeTypeId || loadedFeatureType.current !== store.storeTypeId) return;
    const scope = JSON.stringify([merchantId, store.storeTypeId]);
    if (featureDefaultsScope.current === scope) return;
    featureDefaultsScope.current = scope;
    setEnabledFeatures(featureRows.filter(row => entitled(row.name)).map(row => row.name));
  }, [editing, loading, merchantLoading, featuresLoading, merchantInfo, merchantId, store.storeTypeId, featureRows, planFeatureList, includedFeatures]);

  const changeMerchant = id => {
    if (saveLock.current) return;
    featureDefaultsScope.current = "";
    imageGeneration.current += 1;
    setStore(blankStore(id)); setMerchantInfo(null); setSubscription(null); setEmployees([]); setTypeFeatures([]);
    setEnabledFeatures([]); setRoles([]); setActiveRole(""); setPermissions({}); setEmployeeAssignments([]);
    setPinEditorId(""); setPinDraft(""); setPinError(""); setEmployeeSearch(""); setEmployeeFilter("All"); setEmployeePage(1);
    setFeatureSearch(""); setFeatureCategory("All Features"); setCopyFromRole(""); setError(""); setStep(0);
  };

  useEffect(() => {
    if (!editing) changeMerchant(routeMerchantId || "");
  }, [routeMerchantId, storeId]);

  const updateStore = (key, value) => setStore(current => ({ ...current, [key]: value }));
  const updateHours = (index, key, value) => setStore(current => ({ ...current, hours: current.hours.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const changeCountry = country => setStore(current => ({ ...current, country, currency: COUNTRIES[country]?.currency || "", timezone: COUNTRIES[country]?.zones[0] || "" }));
  const copyScheduleToAll = () => setStore(current => {
    const base = current.hours[0] || blankHours()[0];
    return { ...current, hours: DAYS.map(day => ({ ...base, day })) };
  });
  const setLogoFile = (key, file) => {
    if (!file) return;
    const limit = key === "logo" ? 2 : 5;
    if (!["image/png","image/jpeg"].includes(file.type) || file.size > limit * 1024 * 1024) { setError("Choose a PNG or JPG file no larger than " + limit + " MB."); return; }
    const generation = imageGeneration.current;
    const reader = new FileReader(); imageReads.current += 1;
    reader.onload = () => { if (generation === imageGeneration.current) updateStore(key, String(reader.result || "")); };
    reader.onerror = () => setError("The image could not be read. Please try again.");
    reader.onloadend = () => { imageReads.current -= 1; };
    reader.readAsDataURL(file);
  };
  const toggleFeature = name => entitled(name) && setEnabledFeatures(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
  const toggleRole = role => {
    setRoles(current => {
      const next = current.includes(role) ? current.filter(item => item !== role) : [...current, role];
      setActiveRole(active => next.includes(active) ? active : next[0] || "");
      return next;
    });
    if (!roles.includes(role)) setPermissions(current => ({ ...current, [role]: Object.fromEntries(featureRows.map(feature => [feature.name, Object.fromEntries(feature.actions.map(action => [action, false]))])) }));
  };
  const togglePermission = (role, feature, action) => setPermissions(current => ({ ...current, [role]: { ...current[role], [feature]: { ...current[role]?.[feature], [action]: !current[role]?.[feature]?.[action] } } }));
  const setEmployeeSelected = (employee, checked) => {
    const employeeId = String(employee.id ?? employee.employeeId ?? "");
    setEmployeeAssignments(current => checked ? current.some(item => item.employeeId === employeeId) ? current : [...current, { employeeId, role: roles[0] || "", pin: "" }] : current.filter(item => item.employeeId !== employeeId));
    if (!checked && pinEditorId === employeeId) { setPinEditorId(""); setPinDraft(""); setPinError(""); }
  };
  const setEmployeeRole = (employeeId, role) => setEmployeeAssignments(current => current.map(item => item.employeeId === employeeId ? { ...item, role } : item));
  const openPinEditor = employee => {
    const employeeId = String(employee.id ?? employee.employeeId ?? "");
    setEmployeeAssignments(current => current.some(item => item.employeeId === employeeId) ? current : [...current, { employeeId, role: roles[0] || "", pin: "" }]);
    setPinEditorId(employeeId);
    setPinDraft("");
    setPinError("");
  };
  const saveEmployeePin = employeeId => {
    if (!/^[1-9]\d{5}$/.test(pinDraft)) {
      setPinError("Enter a 6-digit PIN that does not start with 0.");
      return;
    }
    setEmployeeAssignments(current => current.map(item => item.employeeId === employeeId ? { ...item, pin: pinDraft } : item));
    setPinEditorId("");
    setPinDraft("");
    setPinError("");
  };
  const validateStep = (index, draftOnly = false) => {
    if (!merchantId) return "Select a merchant first.";
    if (loading || mastersLoading || merchantLoading || featuresLoading) return "Wait for the merchant setup to finish loading.";
    if (loadError || merchantError || !merchantInfo) return loadError || merchantError || "Merchant details are unavailable. Reload and try again.";
    if (imageReads.current > 0) return "Wait for the images to finish loading.";
    if (index === 0) {
      if (!store.name.trim()) return "Enter the store name.";
      if (store.name.trim().length > 150) return "Store name must be 150 characters or fewer.";
      if (!draftOnly && !store.storeTypeId) return "Select a store type.";
      if (store.storeTypeId && !storeTypes.some(type => String(type.id) === String(store.storeTypeId))) return "Select an available store type.";
      if (!draftOnly) {
        for (const [key,label] of [["addressLine1","address"],["city","city"],["state","state or province"],["zip","postal code"],["country","country"],["timezone","time zone"],["currency","currency"],["phone","phone number"],["url","website URL"]]) {
          if (!String(store[key] || "").trim()) return "Enter the store " + label + ".";
        }
      }
      if (store.phone && (!/^[+\d\s().-]+$/.test(store.phone) || !/^\d{7,15}$/.test(store.phone.replace(/\D/g,"")))) return "Enter a valid phone number containing 7–15 digits.";
      if (store.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.email.trim())) return "Enter a valid email address.";
      if (store.url) { try { const url = new URL(store.url.trim()); if (!["https:","http:"].includes(url.protocol) || !url.hostname || url.username || url.password) return "Enter an HTTP or HTTPS website URL without embedded credentials."; } catch { return "Enter a valid website URL, including https://."; } }
      if (store.country && !COUNTRIES[store.country]) return "Select a supported country.";
      if (store.timezone) { try { new Intl.DateTimeFormat("en", {timeZone:store.timezone}); } catch { return "Select a valid time zone."; } }
      if (store.currency && !/^[A-Z]{3}$/.test(store.currency)) return "Select a valid three-letter currency code.";
      if (store.zip && !/^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(store.zip.trim())) return "Enter a valid postal code.";
      if (!["Active","Inactive","Draft"].includes(store.status)) return "Select a valid store status.";
      for (const row of store.hours) {
        if (!["Open","Closed"].includes(row.status)) return "Select Open or Closed for " + row.day + ".";
        if (row.status === "Open" && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.open) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.close) || row.open === row.close)) return "Enter different opening and closing times for " + row.day + ". Overnight hours are supported.";
        if (row.status === "Open" && (!Number.isSafeInteger(Number(row.shifts)) || Number(row.shifts) < 1)) return "Enter a positive whole-number shift count for " + row.day + ".";
      }
    }
    if (index === 1 && !draftOnly) {
      if (!subscription || !Object.keys(subscription).length) return "This merchant has no subscription details. Configure its subscription before creating a store.";
      if (["inactive","expired","cancelled","canceled","suspended"].includes(String(subscription.status || "").toLowerCase())) return "The merchant subscription is not active.";
      const expiry = Date.parse(subscription.endDate || subscription.validUntil || "");
      if (Number.isFinite(expiry) && expiry < Date.now()) return "The merchant subscription has expired.";
      if (!editing && Number.isFinite(storeLimit) && storeLimit >= 0 && merchantStores.length >= storeLimit) return "This merchant has reached its store limit.";
    }
    if (index === 2 && enabledFeatures.some(name => !featureRows.some(row => row.name === name) || !entitled(name))) return "Remove features that are unavailable or not included in the merchant plan.";
    if (index === 3 && !draftOnly && !roles.length) return "Choose or create at least one store role.";
    if (index === 4) {
      if (pinEditorId) return "Save or cancel the open PIN editor before continuing.";
      for (const assignment of employeeAssignments) {
        if (!activeEmployees.some(employee => String(employee.id ?? employee.employeeId) === assignment.employeeId)) return "An assigned employee is unavailable or inactive for this merchant. Remove that assignment.";
        if (!roles.includes(assignment.role)) return "Select a valid store role for every assigned employee.";
        if (assignment.pin && !/^[1-9]\d{5}$/.test(assignment.pin)) return "Employee PINs must be six digits and cannot start with zero.";
      }
      if (new Set(employeeAssignments.map(item => item.employeeId)).size !== employeeAssignments.length) return "An employee can be assigned only once.";
    }
    return "";
  };
  const goTo = index => {
    if (saving) return;
    const next = Math.max(0, Math.min(STEPS.length - 1, index));
    if (next > step) {
      for (let current = 0; current < next; current += 1) {
        const problem = validateStep(current);
        if (problem) { setError(problem); setStep(current); return; }
      }
    }
    setError(""); setStep(next);
  };

  const backToStores = () => {
    if (saveLock.current) return;
    const merchantReturn = routeMerchantId
      ? "/merchants?" + new URLSearchParams({ view: String(routeMerchantId), tab: "stores" }).toString()
      : "/stores";
    const returnTo = location.state?.returnTo;
    // Only accept the merchant list destinations used by MerchantStores.
    const expectedStandalone = routeMerchantId
      ? "/merchants/" + encodeURIComponent(routeMerchantId) + "/stores"
      : "/stores";
    const query = typeof returnTo === "string" && returnTo.startsWith("/merchants?")
      ? new URLSearchParams(returnTo.slice("/merchants?".length))
      : null;
    const validMerchantReturn = Boolean(routeMerchantId) && query?.get("view") === String(routeMerchantId) && query?.get("tab") === "stores";
    navigate(returnTo === expectedStandalone || validMerchantReturn ? returnTo : merchantReturn, { replace: true });
  };
  const readDataUrl = file => new Promise(resolve => {
    if (!file || file.startsWith?.("data:") || typeof file !== "string") return resolve(file || "");
    resolve(file);
  });

  async function submit(event, saveDraft = false) {
    event.preventDefault();
    if (saveLock.current) return;
    const steps = saveDraft ? [0,2,4] : [0,1,2,3,4];
    for (const index of steps) {
      const problem = validateStep(index, saveDraft);
      if (problem) { setError(problem); setStep(index); return; }
    }
    saveLock.current = true; setSaving(true); setError("");
    try {
      const storePayload = {
        merchantId: merchantId || undefined,
        name: store.name.trim(),
        storeName: store.name.trim(),
        type: typeName,
        storeType: typeName,
        storeTypeId: store.storeTypeId,
        phone: store.phone.trim(),
        email: store.email.trim(),
        url: store.url.trim(),
        currency: currencyCode,
        status: saveDraft ? "Draft" : store.status,
        address: { street: store.addressLine1, addressLine1: store.addressLine1, addressLine2: store.addressLine2, city: store.city, state: store.state, zipCode: store.zip, country: store.country },
        addressLine1: store.addressLine1,
        addressLine2: store.addressLine2,
        city: store.city,
        state: store.state,
        zip: store.zip,
        country: store.country,
        timezone: store.timezone,
        defaultLanguage: store.defaultLanguage,
        hours: store.hours,
        logo: await readDataUrl(store.logo),
        features: enabledFeatures,
        storeRoles: roles,
        storeRolePermissions: Object.fromEntries(roles.map(role => [role, Object.fromEntries(featureRows.filter(feature => enabledFeatures.includes(feature.name)).map(feature => [feature.name, Object.fromEntries(feature.actions.map(action => [action, Boolean(permissions[role]?.[feature.name]?.[action])]))]))])),
        employeeAssignments,
      };
      const path = editing ? endpoints.store(encodeURIComponent(storeId)) : merchantId ? endpoints.merchantStores(merchantId) : endpoints.stores;
      if (editing) await api.put(path, storePayload);
      else await api.post(path, storePayload);
      saveLock.current = false;
      backToStores();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err?.message || `Unable to ${editing ? "update" : "create"} this store.`);
    } finally {
      saveLock.current = false; setSaving(false);
    }
  }

  const subscriptionScreen = () => {
    const used = merchantStores.length;
    const limit = Number.isFinite(storeLimit) ? storeLimit : "Not provided";
    const validity = subscription?.endDate || subscription?.renewalDate || plan?.validUntil || "Not provided";
    return <>
      <div className="sf-info-banner"><span className="bi bi-info-circle-fill" /> Subscription and billing are managed on the merchant. This store uses the plan assigned to {merchantName}.</div>
      <Panel title="Selected Store" className="sf-selected-store">
        <div className="sf-store-identity"><span className="sf-icon-square bi bi-shop-window" /><div><strong>{store.name || "New store"}</strong><small>{store.storeCode || "Store code pending"} <i /> {typeName || "Store type pending"}</small></div></div>
        <button type="button" className="sf-outline" onClick={() => goTo(0)}>Edit Store Details</button>
      </Panel>
      <Panel title="1. Choose Subscription Option" subtitle="Subscription and plan changes are managed at merchant level.">
        <div className="sf-sub-options"><div className="sf-sub-option selected"><span className="sf-option-icon bi bi-file-earmark-check" /><span><strong>Use Existing Subscription</strong><small>Use the plan assigned to this merchant.</small></span><i className="bi bi-check-circle-fill" /></div></div>
      </Panel>
      <Panel title="2. Select a Plan" subtitle="Plan details from the selected merchant subscription.">
        <div className="sf-plan-table-wrap"><table className="sf-plan-table"><thead><tr><th>SELECTED PLAN</th><th>PLAN NAME</th><th>BILLING TYPE</th><th>PRICE</th><th>VALIDITY</th><th>STORES USED</th><th>STORES LIMIT</th><th>STATUS</th></tr></thead>
          <tbody><tr><td><span className="sf-radio-dot" /></td><td><strong>{planName}</strong><small>{plan?.description || "Merchant subscription plan"}</small></td><td>{billing}</td><td>{planPrice == null ? "—" : `${subscription?.currency || currencyCode} ${planPrice}`}</td><td>{validity}</td><td>{used}</td><td>{limit}</td><td><span className="sf-status-pill">{subscription?.status || "Not provided"}</span></td></tr></tbody>
        </table></div>
      </Panel>
      <Panel title="Plan Details">
        <div className="sf-plan-details"><div className="sf-plan-title"><span className="sf-icon-square bi bi-file-earmark-text" /><div><strong>{planName}</strong><small>{billing} billing</small></div></div>
          <div className="sf-plan-metrics"><div><strong>{planPrice == null ? "—" : `${subscription?.currency || currencyCode} ${planPrice}`}</strong><small>Price</small></div><div><strong>{billing}</strong><small>Billing Type</small></div><div><strong>{used} / {limit}</strong><small>Stores Used</small></div><div><strong>{subscription?.status || "Not provided"}</strong><small>Status</small></div></div>
          <div className="sf-key-features"><strong>Key Features</strong><div>{includedFeatures.slice(0, 8).map(item => <span key={item}><i className="bi bi-check-circle-fill" />{item}</span>)}{!includedFeatures.length && <small>Included features are not available in the merchant subscription record.</small>}</div></div>
        </div>
      </Panel>
      <Panel title="Store Details" subtitle="Existing stores mapped to this merchant.">
        <div className="sf-table-wrap"><table className="sf-table"><thead><tr><th>#</th><th>STORE NAME</th><th>STORE CODE</th><th>LOCATION</th><th>STATUS</th></tr></thead><tbody>
          {merchantStores.map((item, index) => <tr key={item.id || item.storeId || item.storeID || index}><td>{index + 1}</td><td>{item.storeName || item.name || "Unnamed store"}</td><td>{item.storeCode || item.code || "—"}</td><td>{[item.city || item.address?.city, item.state || item.address?.state].filter(Boolean).join(", ") || (typeof item.address === "string" ? item.address : "—")}</td><td>{item.status || "—"}</td></tr>)}
          {!used && <tr><td colSpan="5" className="sf-empty">No existing stores are mapped to this merchant.</td></tr>}
        </tbody></table></div>
      </Panel>
    </>;
  };

  const storeDetailsScreen = () => <>
    <div className="sf-details-layout">
      <div className="sf-details-main">
        <Panel title="Basic Information" subtitle="Provide the general information for this store.">
          <div className="sf-form-grid sf-basic-grid">
            <div className="sf-field sf-merchant-field"><label htmlFor="sf-merchant">Merchant *</label><select id="sf-merchant" required value={merchantId} disabled={Boolean(routeMerchantId) || editing || saving} onChange={event => changeMerchant(event.target.value)}><option value="">Select merchant</option>{(merchant && !merchants.some(item => idOf(item) === merchantId) ? [{...merchant, id: merchantId}, ...merchants] : merchants).map(item => <option key={idOf(item)} value={idOf(item)}>{item.name || item.merchantName || item.businessDisplayName || idOf(item)}</option>)}</select></div>
            <Field label="Store Name *" value={store.name} onChange={value => updateStore("name", value)} placeholder="Enter store name" />
            <SelectField label="Store Type *" value={store.storeTypeId} onChange={value => { const type = storeTypes.find(item => String(item.id) === value); featureDefaultsScope.current = ""; setStore(current => ({ ...current, storeTypeId: value, type: type?.name || "" })); setEnabledFeatures([]); setPermissions({}); setLoadError(""); }} options={[{ value: "", label: "Select store type" }, ...storeTypes.map(item => ({ value: String(item.id), label: item.name }))]} />
            <div className="sf-code-field"><Field label="Store Code" value={store.storeCode} disabled placeholder={editing ? "Not available" : "Generated after saving"} aria-describedby="sf-code-help" /><small id="sf-code-help">{editing ? "Automatically generated and cannot be changed." : "Automatically generated after saving the store."}</small></div>
          </div>
        </Panel>
        <Panel title="Address Information" subtitle="Enter the complete address of the store.">
          <div className="sf-form-grid sf-address-grid">
            <Field label="Address Line 1 *" value={store.addressLine1} onChange={value => updateStore("addressLine1", value)} placeholder="Street address" />
            <Field label="Address Line 2" optional value={store.addressLine2} onChange={value => updateStore("addressLine2", value)} placeholder="Apartment, suite, etc." />
            <Field label="City *" value={store.city} onChange={value => updateStore("city", value)} placeholder="City" />
            <Field label="State / Province *" value={store.state} onChange={value => updateStore("state", value)} placeholder="State or province" />
            <Field label="Zip / Postal Code *" value={store.zip} onChange={value => updateStore("zip", value)} placeholder="Postal code" />
            <SelectField label="Country *" value={store.country} onChange={changeCountry} options={[{ value: "", label: "Select country" }, ...Object.keys(COUNTRIES).map(value => ({ value, label: value }))]} />
          </div>
        </Panel>
        <Panel title="Operational Settings" subtitle="Configure time zone, currency and other settings.">
          <div className="sf-form-grid sf-three-cols">
            <SelectField label="Time Zone *" value={store.timezone} onChange={value => updateStore("timezone", value)} options={[{ value: "", label: "Select time zone" }, ...[...new Set([store.timezone, ...(countrySettings?.zones || [])].filter(Boolean))].map(value => ({ value, label: value.replaceAll("_", " ") }))]} />
            <SelectField label="Currency *" value={currencyCode} onChange={value => updateStore("currency", value)} options={[{ value: "", label: "Select currency" }, ...Object.values(COUNTRIES).map(item => item.currency).filter((value, index, array) => array.indexOf(value) === index).map(value => ({ value, label: value }))]} />
            <SelectField label="Status" value={store.status} onChange={value => updateStore("status", value)} options={["Active", "Inactive"]} />
          </div>
        </Panel>
        <Panel title="Operating Schedule" subtitle="Configure the opening and closing time for each day." action={<button type="button" className="sf-outline" onClick={copyScheduleToAll}><i className="bi bi-copy" /> Copy to All</button>}>
          <div className="sf-table-wrap"><table className="sf-table sf-hours-table"><thead><tr><th>DAY</th><th>STATUS</th><th>OPENS</th><th>CLOSES</th><th>SHIFTS</th></tr></thead><tbody>
            {store.hours.map((row, index) => <tr key={row.day}><td>{row.day}</td><td><select value={row.status} onChange={event => updateHours(index, "status", event.target.value)}><option>Open</option><option>Closed</option></select></td><td><input aria-label={`${row.day} opens`} type="time" value={row.open} disabled={row.status === "Closed"} onChange={event => updateHours(index, "open", event.target.value)} /></td><td><input aria-label={`${row.day} closes`} type="time" value={row.close} disabled={row.status === "Closed"} onChange={event => updateHours(index, "close", event.target.value)} /></td><td><input aria-label={`${row.day} shifts`} type="number" min="0" value={row.shifts} onChange={event => updateHours(index, "shifts", event.target.value)} /></td></tr>)}
          </tbody></table></div>
        </Panel>
      </div>
      <div className="sf-details-side">
        <Panel title="Store Logo" subtitle="Upload a logo for this store.">
          <div className="sf-upload-card"><div className="sf-image-preview">{store.logo ? <img src={store.logo} alt="Store logo preview" /> : <i className="bi bi-shop-window" />}</div><label className="sf-upload-control"><span>Upload Logo</span><input type="file" accept="image/png,image/jpeg" onChange={event => setLogoFile("logo", event.target.files?.[0])} /></label><small>PNG, JPG (Max 2MB)<br />Recommended size: 512 × 512</small></div>
        </Panel>
        <Panel title="Contact Information" subtitle="Provide the primary contact details for this store.">
          <Field label="Store Phone *" value={store.phone} onChange={value => updateStore("phone", value)} type="tel" placeholder="Enter phone number" />
          <Field label="Store Email" optional value={store.email} onChange={value => updateStore("email", value)} type="email" placeholder="store@example.com" />
          <Field label="Website URL *" value={store.url} onChange={value => updateStore("url", value)} type="url" placeholder="https://example.com" />
        </Panel>
      </div>
    </div>
  </>;

  const featuresScreen = () => {
    const includedCount = featureRows.filter(row => entitled(row.name)).length;
    return <>
      <Panel className="sf-plan-summary">
        <div><span className="sf-icon-square bi bi-shop-window" /><div><small>Selected Plan</small><strong>{planName}</strong><small>{billing} billing</small></div></div>
        <div><small>Total Features</small><strong>{featureRows.length}</strong></div><div><small>Included</small><strong className="sf-green">{includedCount}</strong></div><div><small>Not Included</small><strong className="sf-amber">{Math.max(0, featureRows.length - includedCount)}</strong></div>
      </Panel>
      <Panel title="Features" subtitle="Available features are enabled by default for new stores. Disable any you do not need.">
        <div className="sf-feature-tools"><div className="sf-tabs">{categories.map(category => { const count = category === "All Features" ? featureRows.length : featureRows.filter(row => row.category === category).length; return <button key={category} type="button" className={featureCategory === category ? "active" : ""} onClick={() => setFeatureCategory(category)}>{category} ({count})</button>; })}</div><label className="sf-search"><i className="bi bi-search" /><input placeholder="Search features..." value={featureSearch} onChange={event => setFeatureSearch(event.target.value)} /></label></div>
        <div className="sf-table-wrap"><table className="sf-table sf-feature-table"><thead><tr><th>#</th><th>FEATURE</th><th>DESCRIPTION</th><th>PLAN ACCESS</th><th>ENABLE FOR THIS STORE</th></tr></thead><tbody>
          {filteredFeatures.map((feature, index) => { const hasPlan = entitled(feature.name); const checked = enabledFeatures.includes(feature.name); return <tr key={feature.id || feature.name}><td>{index + 1}</td><td>{feature.name}</td><td>{feature.description || "—"}</td><td><span className={hasPlan ? "sf-access-included" : "sf-access-excluded"}>{hasPlan ? "Included" : "Not included"}</span></td><td><button type="button" role="switch" aria-label={`Enable ${feature.name} for this store`} aria-checked={checked} disabled={!hasPlan || mastersLoading} className={`sf-switch ${checked ? "on" : ""}`} onClick={() => toggleFeature(feature.name)}><span /></button></td></tr>; })}
          {!filteredFeatures.length && <tr><td colSpan="5" className="sf-empty">No features match this search.</td></tr>}
        </tbody></table></div>
      </Panel>
    </>;
  };

  const rolesScreen = () => {

    const active = roles.includes(activeRole) ? activeRole : roles[0] || "";
    const actions = [...new Set(featureRows.filter(feature => enabledFeatures.includes(feature.name)).flatMap(feature => feature.actions))];
    return <>
      <Panel title="Role Templates" subtitle="Choose roles available for this merchant.">
        {!roleDefinitions.length && <p className="sf-empty">No role templates are available. Configure roles on the merchant to make them available here.</p>}<div className="sf-template-grid">{roleDefinitions.map((role, index) => <label className={`sf-template ${roles.includes(role.name) ? "selected" : ""}`} key={role.name}><input type="checkbox" checked={roles.includes(role.name)} onChange={() => toggleRole(role.name)} /><span className={`sf-template-icon icon-${index}`}><i className="bi bi-person-badge" /></span><span><strong>{role.name}</strong><small>{role.description}</small></span></label>)}</div>
      </Panel>
      <div className="sf-permissions-layout">
        <Panel title="Roles for This Store" subtitle="Configure permissions for each selected role.">
          <div className="sf-role-list">{roles.map(role => <button type="button" key={role} className={active === role ? "active" : ""} onClick={() => setActiveRole(role)}><i className="bi bi-grip-vertical" /><span>{role}</span><small>{roleDefinitions.find(item => item.name === role)?.level || "Custom"}</small><i className="bi bi-trash3" onClick={event => { event.stopPropagation(); setRoles(current => current.filter(item => item !== role)); setActiveRole(current => current === role ? roles.find(item => item !== role) || "" : current); }} /></button>)}{!roles.length && <p className="sf-empty">Select a merchant role above.</p>}</div>
        </Panel>
        <Panel title={`Permissions for ${active || "Selected Role"}`} subtitle="Set what this role can view, create, edit or delete." action={<div className="sf-copy-permissions"><label>Copy from<select value={copyFromRole} onChange={event => setCopyFromRole(event.target.value)}><option value="">Select a role</option>{roles.filter(role => role !== active).map(role => <option key={role}>{role}</option>)}</select></label><button type="button" className="sf-outline" disabled={!active || !copyFromRole} onClick={() => { setPermissions(current => ({ ...current, [active]: { ...(current[copyFromRole] || {}) } })); }}>Apply</button></div>}>
          {active && <div className="sf-table-wrap"><table className="sf-table sf-permission-table"><thead><tr><th>MODULE / FEATURE</th>{actions.map(action => <th key={action}>{action.toUpperCase()}</th>)}</tr></thead><tbody>
            {featureRows.filter(feature => enabledFeatures.includes(feature.name)).map(item => { const name = featureName(item); const values = permissions[active]?.[name] || {}; return <tr key={name}><td><i className="bi bi-grid-3x3-gap" /> {name}</td>{actions.map(action => <td key={action}><input type="checkbox" checked={Boolean(values[action])} disabled={!item.actions.includes(action)} onChange={() => togglePermission(active, name, action)} /></td>)}</tr>; })}
          </tbody></table></div>}
          {!active && <p className="sf-empty">Select a role to configure permissions.</p>}
        </Panel>
      </div>
    </>;
  };

  const employeesScreen = () => {
    const assigned = employeeAssignments.length;
    return <>
      <Panel className="sf-employee-summary">
        <div><small>Selected Merchant</small><strong><span className="sf-avatar">{initials(merchantName)}</span>{merchantName}</strong><small>{merchantId} &nbsp;|&nbsp; {typeName || "Merchant"}</small></div>
        <div><small>Total Employees</small><strong>{employees.length}</strong></div><div><small>Already Assigned</small><strong>{assigned}</strong></div><div><small>Available to Assign</small><strong className="sf-green">{Math.max(0, activeEmployees.length - assigned)}</strong></div>
      </Panel>
      <Panel title="Select Employees" subtitle="Choose employees from the merchant to assign to this store. You can assign a store role for each employee.">
        <div className="sf-employee-tools"><label className="sf-search"><i className="bi bi-search" /><input placeholder="Search employees..." value={employeeSearch} onChange={event => { setEmployeeSearch(event.target.value); setEmployeePage(1); }} /></label><SelectField label="Filter" value={employeeFilter} onChange={value => { setEmployeeFilter(value); setEmployeePage(1); }} options={["All", "Assigned", "Available"]} /></div>
        <div className="sf-table-wrap"><table className="sf-table sf-employees-table"><thead><tr><th><span className="sr-only">Select</span></th><th>#</th><th>EMPLOYEE NAME</th><th>EMPLOYEE ID</th><th>PHONE</th><th>EMAIL</th><th>CURRENT ROLE (MERCHANT)</th><th>STORE ROLE</th><th>LOGIN PIN</th><th>STATUS</th></tr></thead><tbody>
          {pagedEmployees.map((employee, index) => {
            const employeeId = String(employee.id ?? employee.employeeId ?? "");
            const assignment = employeeAssignments.find(item => item.employeeId === employeeId);
            const isAssigned = Boolean(assignment);
            const editingPin = pinEditorId === employeeId;
            return <tr key={employeeId}>
              <td><input type="checkbox" checked={isAssigned} onChange={event => setEmployeeSelected(employee, event.target.checked)} aria-label={`Assign ${employee.name}`} /></td>
              <td>{(employeePage - 1) * pageSize + index + 1}</td>
              <td>{employee.name || `${employee.firstName || ""} ${employee.lastName || ""}`.trim()}</td>
              <td>{employee.employeeCode || employeeId}</td><td>{employee.phone || "—"}</td><td>{employee.email || "—"}</td><td>{employee.role || "—"}</td>
              <td><select value={assignment?.role || ""} disabled={!isAssigned} onChange={event => setEmployeeRole(employeeId, event.target.value)}><option value="">Select role</option>{roles.map(role => <option key={role}>{role}</option>)}</select></td>
              <td className="sf-pin-cell">{editingPin ? <div className="sf-pin-editor"><input autoFocus type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} aria-label={`Six-digit login PIN for ${employee.name}`} placeholder="6-digit PIN" value={pinDraft} onChange={event => { setPinDraft(event.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }} /><div><button type="button" className="sf-pin-save" onClick={() => saveEmployeePin(employeeId)}>Save PIN</button><button type="button" className="sf-pin-cancel" onClick={() => { setPinEditorId(""); setPinDraft(""); setPinError(""); }}>Cancel</button></div>{pinError && <small role="alert">{pinError}</small>}</div> : <div className="sf-pin-action">{assignment?.pin && <span className="sf-pin-set"><i className="bi bi-lock-fill" /> PIN set</span>}<button type="button" className="sf-link" onClick={() => openPinEditor(employee)}>{assignment?.pin ? "Change PIN" : "Assign PIN"}</button></div>}</td>
              <td><span className={isAssigned ? "sf-status-assigned" : "sf-status-available"}>{isAssigned ? "Will be assigned" : "Available"}</span></td>
            </tr>;
          })}
          {!pagedEmployees.length && <tr><td colSpan="10" className="sf-empty">{employees.length ? "No active employees match this search." : "No employees were returned for this merchant."}</td></tr>}
        </tbody></table></div>
        <div className="sf-pagination"><span>Showing {employeeRows.length ? (employeePage - 1) * pageSize + 1 : 0}–{Math.min(employeePage * pageSize, employeeRows.length)} of {employeeRows.length} employees</span><div><button type="button" disabled={employeePage <= 1} onClick={() => setEmployeePage(page => Math.max(1, page - 1))}>‹</button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map(page => <button type="button" key={page} className={employeePage === page ? "active" : ""} onClick={() => setEmployeePage(page)}>{page}</button>)}<button type="button" disabled={employeePage >= pageCount} onClick={() => setEmployeePage(page => Math.min(pageCount, page + 1))}>›</button></div></div>
      </Panel>
    </>;
  };

  const reviewScreen = () => <>
    <div className="sf-review-grid">
      <Panel title={<><i className="bi bi-person-vcard" /> Merchant & Subscription</>} action={<button className="sf-link" type="button" onClick={() => goTo(1)}>✎ Edit</button>}>
        <Detail label="Merchant">{merchantName}</Detail><Detail label="Subscription Plan">{planName}</Detail><Detail label="Plan Billing">{billing}</Detail><Detail label="Store Entitlement">{merchantStores.length} / {Number.isFinite(storeLimit) ? storeLimit : "Unlimited"} stores used</Detail>
      </Panel>
      <Panel title={<><i className="bi bi-shop" /> Store Details</>} action={<button className="sf-link" type="button" onClick={() => goTo(0)}>✎ Edit</button>}>
        <Detail label="Store Name">{store.name}</Detail><Detail label="Store Code">{store.storeCode || (editing ? "—" : "Generated after saving")}</Detail><Detail label="Address">{[store.addressLine1, store.addressLine2, store.city, store.state, store.zip].filter(Boolean).join(", ")}</Detail><Detail label="Country / State">{[store.country, store.state].filter(Boolean).join(" / ")}</Detail><Detail label="Time Zone">{store.timezone}</Detail><Detail label="Currency">{currencyCode}</Detail><Detail label="Status">{store.status}</Detail>
      </Panel>
      <Panel title={<><i className="bi bi-grid" /> Features ({enabledCount} enabled)</>} action={<button className="sf-link" type="button" onClick={() => goTo(2)}>✎ Edit</button>}>
        <div className="sf-review-feature-list">{featureRows.map(feature => <span className={enabledFeatures.includes(feature.name) ? "enabled" : "disabled"} key={feature.name}><i className={`bi ${enabledFeatures.includes(feature.name) ? "bi-check-circle-fill" : "bi-dash-circle-fill"}`} />{feature.name}</span>)}</div>
      </Panel>
      <Panel title={<><i className="bi bi-shield-lock" /> Roles & Permissions ({roles.length} roles)</>} action={<button className="sf-link" type="button" onClick={() => goTo(3)}>✎ Edit</button>}>
        <div className="sf-table-wrap"><table className="sf-table sf-review-table"><thead><tr><th>ROLE NAME</th><th>ACCESS LEVEL</th><th>NO. OF PERMISSIONS</th></tr></thead><tbody>{roles.map(role => <tr key={role}><td>{role}</td><td>{roleDefinitions.find(item => item.name === role)?.level || "Custom"}</td><td>{permissionCount(role)}</td></tr>)}{!roles.length && <tr><td colSpan="3">No roles selected</td></tr>}</tbody></table></div>
      </Panel>
      <Panel title={<><i className="bi bi-people" /> Employees ({employeeAssignments.length} assigned)</>} action={<button className="sf-link" type="button" onClick={() => goTo(4)}>✎ Edit</button>}>
        <div className="sf-table-wrap"><table className="sf-table sf-review-table"><thead><tr><th>#</th><th>EMPLOYEE NAME</th><th>EMPLOYEE ID</th><th>ROLE</th></tr></thead><tbody>{employeeAssignments.map((item, index) => { const employee = employees.find(row => String(row.id ?? row.employeeId) === item.employeeId); return <tr key={item.employeeId}><td>{index + 1}</td><td>{employee?.name || "Employee"}</td><td>{employee?.employeeCode || item.employeeId}</td><td>{item.role}</td></tr>; })}{!employeeAssignments.length && <tr><td colSpan="4">No employees assigned</td></tr>}</tbody></table></div>
      </Panel>
      <Panel title={<><i className="bi bi-link-45deg" /> Store Base URL & Contact</>} action={<button className="sf-link" type="button" onClick={() => goTo(0)}>✎ Edit</button>}>
        <Detail label="Store Base URL">{store.url}</Detail><Detail label="Store Phone">{store.phone}</Detail><Detail label="Store Email">{store.email}</Detail>
      </Panel>
    </div>
    <div className="sf-info-banner"><i className="bi bi-info-circle-fill" /> Once the store is created, you can manage these settings from the Store Details page.</div>
  </>;

  const screens = [storeDetailsScreen, subscriptionScreen, featuresScreen, rolesScreen, employeesScreen, reviewScreen];
  if (loading) return <div className="sf-loading">Loading store setup…</div>;

  return <div className="sf-root">
    <header className="sf-topbar"><button type="button" className="sf-back-link" onClick={backToStores}><i className="bi bi-arrow-left" /> Stores</button><span>/</span><strong>{editing ? "Edit store" : "Add store"}</strong><span className="sf-topbar-spacer" /><button type="button" className="sf-outline" disabled={saving} onClick={backToStores}>Cancel</button></header>
    <div className="sf-shell">
      <aside className="sf-sidebar"><div className="sf-sidebar-caption">PROVISION A STORE</div><nav>{STEPS.map((name, index) => <button type="button" key={name} className={step === index ? "active" : step > index ? "complete" : ""} onClick={() => goTo(index)}><span className="sf-step-number">{step > index ? <i className="bi bi-check-lg" /> : index + 1}</span><span><strong>{name}</strong><small>{STEP_HINTS[index]}</small></span></button>)}</nav><div className="sf-sidebar-foot">Store setup · {step + 1} of {STEPS.length}</div></aside>
      <main className="sf-main"><div className="sf-heading-row"><div><div className="sf-eyebrow">STEP {step + 1} OF {STEPS.length}</div><h1>{STEPS[step]}</h1><p>{step === 0 ? "Enter the basic information and settings for this store. You can save and continue later." : step === 5 ? "Review all the information below and create the store. You can go back to any step to make changes." : STEP_HINTS[step]}</p></div>{step === 3 && <div className="sf-role-context"><span className="sf-icon-square bi bi-shop" /><div><small>Selected Store</small><strong>{store.name || "New Store"}</strong><small>{typeName || "Store type"} | {planName}</small></div></div>}</div>
        {error && <div className="sf-error" role="alert">{error}<button type="button" onClick={() => setError("")}>×</button></div>}
        {(loadError || merchantError) && <div className="sf-error" role="alert">{loadError || merchantError}<button type="button" onClick={() => setReload(value => value + 1)}>Retry</button></div>}
        {(mastersLoading || merchantLoading || featuresLoading) && <div className="sf-loading-note" role="status">Loading merchant setup…</div>}
        <form onSubmit={submit} noValidate><fieldset disabled={saving || mastersLoading || merchantLoading || featuresLoading} style={{border:0,padding:0,margin:0,minWidth:0}}><div className="sf-screen">{screens[step]()}</div>
          <div className="sf-footer"><button type="button" className="sf-outline" onClick={() => step === 0 ? backToStores() : goTo(step - 1)}><i className="bi bi-arrow-left" /> Back</button><span className="sf-footer-spacer" />{step === 0 && <button type="button" className="sf-outline sf-save-draft" disabled={saving} onClick={event => submit(event, true)}>Save as Draft</button>}{step < STEPS.length - 1 ? <button type="button" className="sf-primary" onClick={() => goTo(step + 1)}>Save &amp; Continue <i className="bi bi-arrow-right" /></button> : <button type="submit" className="sf-primary" disabled={saving}><i className="bi bi-shop" /> {saving ? "Creating…" : editing ? "Save Changes" : "Create Store"}</button>}</div>
        </fieldset></form>
      </main>
    </div>
  </div>;
}
