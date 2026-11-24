import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Pencil } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  createMerchant,
  getMerchant,
  mapMerchantToRow,
  updateMerchant,
} from "../api/merchants";
import { listPlans } from "../api/plans";
import { useLocationOptions } from "../data/useLocationOptions";
import { storeTypesApi } from "../api/storeTypes";
import FilterDropdown from "../components/FilterDropdown";
import StatusBadge from "../components/StatusBadge";
import PhoneInputModule from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../styles/merchant-form.css";

const PhoneInput = PhoneInputModule.default || PhoneInputModule;

const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const TAX_RATE = 8.6;
const blankMerchant = () => ({
  code: "",
  ein: "",
  firstName: "",
  lastName: "",
  name: "",
  business: "",
  display: "",
  email: "",
  password: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postal: "",
  country: "India",
});

function merchantDetailToDraft(result, fallback = {}) {
  const response = result?.raw || {};
  const raw = response.merchant || response.data?.merchant || response.data?.data?.merchant || response.data || response;
  const address = raw.businessAddress || raw.business_address || raw.address || {};
  const subscription = result?.subscription || raw.subscription || {};
  const owner = String(raw.ownerName || raw.owner_name || raw.merchantName || raw.merchant_name || "").trim().split(/\s+/);
  const contact = raw.primaryContact || raw.primary_contact || raw.contactDetails || raw.contact_details || raw.contact || {};
  const planId = subscription.planId || subscription.plan_id || subscription.plan?.id || subscription.plan?.planId || raw.planId || raw.plan_id || "";
  const field = (...values) => values.find((value) => value !== undefined && value !== null && value !== "") ?? "";
  const addressField = (...values) => field(...values, typeof address === "string" ? address : "");
  const phone = [
    raw.merchantPhoneNumber, raw.merchant_phone_number, raw.merchant_phone,
    contact.phone, contact.phoneNumber, contact.phone_number, contact.contactNo, contact.contact_no,
    raw.phone, raw.phoneNumber, raw.phone_number, raw.contactNo, raw.contact_no, raw.contactNumber,
    fallback?._onboarding?.merchant?.phone, fallback.phone, fallback.phoneNumber,
    fallback.merchantPhoneNumber, fallback.merchant_phone_number, fallback.contactNumber,
  ].filter((value) => value != null && String(value).trim() !== "")
    .sort((left, right) => String(right).replace(/\D/g, "").length - String(left).replace(/\D/g, "").length)[0] || "";
  const phoneDialCode = field(
    raw.phoneDialCode, raw.phone_dial_code, raw.dialCode, raw.dial_code,
    contact.phoneDialCode, contact.phone_dial_code, contact.dialCode, contact.dial_code,
    fallback?._onboarding?.merchant?.phoneDialCode, fallback.phoneDialCode, fallback.phone_dial_code,
  );
  const phoneCountry = field(
    raw.phoneCountry, raw.phone_country, raw.phoneCountryCode, raw.phone_country_code,
    contact.phoneCountry, contact.phone_country, contact.phoneCountryCode, contact.phone_country_code,
    fallback?._onboarding?.merchant?.phoneCountry, fallback.phoneCountry, fallback.phone_country,
  );
  return {
    merchant: {
      ...blankMerchant(),
      code: String(field(raw.merchantCode, raw.merchant_code, raw.code, fallback.merchantCode)),
      ein: field(raw.ein, raw.EIN),
      firstName: field(raw.firstName, raw.first_name, owner[0]),
      lastName: field(raw.lastName, raw.last_name, owner.slice(1).join(" ")),
      name: field(raw.ownerName, raw.owner_name, [raw.firstName || raw.first_name, raw.lastName || raw.last_name].filter(Boolean).join(" ")),
      business: field(raw.legalBusinessName, raw.legal_business_name, raw.businessName, raw.business_name, fallback.name),
      display: field(raw.businessDisplayName, raw.business_display_name, raw.display, raw.businessName, raw.business_name, raw.name, fallback.name),
      email: field(raw.email, raw.merchantEmail, raw.merchant_email, fallback.email),
      password: field(raw.actual_password, raw.actualPassword, raw.password),
      phone: normalizePhone(phone),
      addressLine1: addressField(raw.addressLine1, raw.address_line_1, raw.address_line1, typeof address === "object" && (address.addressLine1 || address.address_line1 || address.street || address.streetAddress)),
      addressLine2: field(raw.addressLine2, raw.address_line_2, typeof address === "object" && (address.addressLine2 || address.address_line2 || address.unit)),
      city: field(raw.city, address.city),
      state: field(raw.state, address.state, address.province),
      postal: field(raw.postalCode, raw.postal_code, raw.pinCode, raw.pin_code, address.zipCode, address.zip_code, address.postalCode),
      country: field(raw.country, address.country),
    },
    phoneDialCode: String(phoneDialCode || "").replace(/\D/g, ""),
    phoneCountry: String(phoneCountry || "").toLowerCase(),
    planId,
    planName: field(subscription.planName, subscription.plan_name, subscription.planCode, subscription.plan_code, subscription.plan?.name, raw.plan, fallback.plan),
    cycle: normalizeCycle(subscription.billingCycle || subscription.billing_cycle || raw.billingCycle || raw.billing_cycle),
    start: String(subscription.startDate || subscription.start_date || subscription.start || "").slice(0, 10),
    subscriptionId: subscription.id || subscription.subscriptionId || "",
    subscriptionStatus: subscription.status || "Pending activation",
    employeeCount: raw.employeeCount ?? fallback.employeeCount ?? null,
    paymentHistory: raw.paymentHistory || [],
  };
}

function renderFieldLabel(label) { if (label == null || typeof label !== "string") return label; if (!label.includes("*")) return label; const parts = label.split("*"); return (<>{parts.map((part, index) => (<span key={index}>{part}{index < parts.length - 1 && (<span className="text-red-500" style={{ color: "#dc2626" }}>*</span>)}</span>))}</>); }

function Field({ label, value, onChange, error, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === "password";
  const autoComplete = props.autoComplete || (props.readOnly || props.type === "date" ? undefined : "new-password");
  return (
    <label className={`pch-field${error ? " pch-field-invalid" : ""}`}>
      {renderFieldLabel(label)}
      <span className={isPassword ? "pch-password-input" : undefined}>
        <input {...props} name={isPassword ? (props.name || "merchant-password-entry") : props.name} autoComplete={autoComplete} className={`${props.className || ""}${isPassword && !showPassword ? " pch-password-masked" : ""}`.trim()} type={isPassword ? "text" : props.type} aria-invalid={Boolean(error)} value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} />
        {isPassword && <button type="button" className="pch-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
      </span>
      {error && <span className="pch-field-error" role="alert">{error}</span>}
    </label>
  );
}

function Select({ label, value, options, onChange, placeholder, error, ...props }) {
  return (
    <label className={`pch-field${error ? " pch-field-invalid" : ""}`}>
      {renderFieldLabel(label)}
      <FilterDropdown {...props} searchable={label.startsWith("Country") || label.startsWith("State / Province")} aria-label={label} aria-required={props.required} aria-invalid={Boolean(error)} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder || `Select ${label.replace(/\s*\*$/, "")}`}</option>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}
      </FilterDropdown>
      {error && <span className="pch-field-error" role="alert">{error}</span>}
    </label>
  );
}

function Panel({ title, subtitle, children, action }) {
  return <section className="pch-panel"><div className="pch-panel-heading"><div className="pch-panel-heading-copy"><h2>{title}</h2>{subtitle && <p className="pch-panel-subtitle">{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function formatPrice(amount, currency = "USD") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "â€”";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function getPlanStoreType(plan, storeTypes) {
  const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "").trim());
  const explicitName = [plan.storeTypeName, plan.store_type_name]
    .find((value) => typeof value === "string" && value.trim() && !isUuid(value));
  const values = [
    plan.storeTypeId,
    plan.store_type_id,
    plan.applicableStoreType,
    plan.applicable_store_type,
    plan.storeType,
    plan.store_type,
  ].filter((value) => value !== undefined && value !== null && value !== "");
  if (!values.length) return "General Plans";
  const objectNames = values.flatMap((value) => typeof value === "object"
    ? [value.name, value.storeTypeName, value.store_type_name, value.title]
    : []).filter((value) => typeof value === "string" && value.trim() && !isUuid(value));
  const identifiers = values.flatMap((value) => typeof value === "object"
    ? [value.id, value.storeTypeId, value.store_type_id, value.code, value.storeTypeCode, value.store_type_code, ...objectNames]
    : [value]).filter(Boolean);
  const key = (value) => String(value ?? "").trim().toLowerCase();
  const match = storeTypes.find((type) => [type.id, type.storeTypeId, type.store_type_id, type.code, type.storeTypeCode, type.store_type_code, type.name]
    .some((field) => identifiers.some((identifier) => key(field) && key(field) === key(identifier))));
  if (match?.name) return match.name;
  if (explicitName) return explicitName.trim();

  const fallback = objectNames.find((name) => name.trim());
  if (fallback) return fallback.trim();
  return "Other Plans";
}

function renewalDate(start, cycle) {
  if (!start) return "";
  const date = new Date(`${start}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + (/annual|year/i.test(cycle) ? 12 : /quarter/i.test(cycle) ? 3 : 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

function normalizeCycle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("annual") || normalized.includes("year")) return "Annual";
  if (normalized.includes("quarter")) return "Quarterly";
  return "Monthly";
}

function normalizePhone(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  return raw.startsWith("+") ? `+${digits}` : digits;
}

function phoneInputValue(value, phoneCode) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  const callingCode = String(phoneCode || "").replace(/\D/g, "");

  if (!digits) return callingCode;

  // react-phone-input-2 expects the dial code to be part of `value`.
  // A national US number such as 5125550101 must be passed as 15125550101;
  // otherwise the component interprets the leading "51" as Peru (+51).
  if (!callingCode) return digits;

  const internationalDigits = raw.startsWith("00") ? digits.slice(2) : digits;
  if (
    internationalDigits.startsWith(callingCode) &&
    (raw.startsWith("+") || raw.startsWith("00") || internationalDigits.length > 10)
  ) {
    return internationalDigits;
  }

  return `${callingCode}${internationalDigits}`;
}

// Merchant APIs may return a national `phone` and an international `contact_no`
// without a leading '+'. Resolve the phone country from the international prefix,
// independently of the merchant's business-address country.
function resolvePhoneDetails(value, countries = [], preferredDialCode = "") {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  const hasInternationalForm = raw.startsWith("+") || raw.startsWith("00");
  const normalizedDigits = raw.startsWith("00") ? digits.slice(2) : digits;

  if (hasInternationalForm) {
    const matches = countries
      .map((country) => ({
        country,
        dialCode: String(country.phoneCode || country.phone_code || country.dialCode || "").replace(/\D/g, ""),
      }))
      .filter(({ dialCode }) => dialCode && normalizedDigits.startsWith(dialCode))
      .sort((a, b) => b.dialCode.length - a.dialCode.length);

    if (matches.length) {
      const { country, dialCode } = matches[0];
      return { country, dialCode, nationalNumber: normalizedDigits.slice(dialCode.length) };
    }
  }

  const preferred = String(preferredDialCode || "").replace(/\D/g, "");
  if (preferred) {
    const country = countries.find((item) =>
      String(item.phoneCode || item.phone_code || item.dialCode || "").replace(/\D/g, "") === preferred,
    );
    if (country) return { country, dialCode: preferred, nationalNumber: digits };
  }

  // Never infer the phone country from the merchant's address country.
  // A national-only number has no reliable country prefix, so leave its
  // country unresolved instead of displaying a potentially incorrect flag.
  return { country: null, dialCode: "", nationalNumber: digits };
}

function merchantPhoneFromRow(merchantRow) {
  return [
    merchantRow?._onboarding?.merchant?.phone,
    merchantRow?.phone,
    merchantRow?.merchantPhoneNumber,
    merchantRow?.merchant_phone_number,
  ]
    .filter((value) => value != null && String(value).trim() !== "")
    .sort((left, right) => {
      const digitDifference = String(right).replace(/\D/g, "").length - String(left).replace(/\D/g, "").length;
      if (digitDifference) return digitDifference;
      return Number(String(right).trim().startsWith("+")) - Number(String(left).trim().startsWith("+"));
    })[0] || "";
}

function Header({ editing, onBack }) {
  return <header><nav className="pch-breadcrumb" aria-label="Breadcrumb"><button type="button" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> Merchants</button><span aria-hidden="true">/</span><span>{editing ? "Edit Merchant" : "Add Merchant"}</span></nav></header>;
}

export function onboardingToRow(data) {
  const merchant = data.merchant;
  const { password: _password, ...safeMerchant } = merchant;
  const { password: _topLevelPassword, ...safeData } = data;
  const name = merchant.business || merchant.display || "Merchant";
  return {
    id: merchant.code || data.merchantId,
    merchantCode: merchant.code,
    name,
    email: merchant.email,
    phone: merchant.phone,
    employeeCount: data.employeeCount ?? null,
    country: merchant.country,
    state: merchant.state,
    stores: 0,
    plan: data.planDetails?.name || data.planName || "",
    status: "Inactive",
    createdAt: new Date().toISOString(),
    joined: new Date().toLocaleDateString(),
    active: "â€”",
    initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
    _onboarding: structuredClone({ ...safeData, merchant: safeMerchant }),
  };
}

export default function AddMerchant({ localMerchants = [], onSave }) {
  const { merchantId } = useParams();
  return <MerchantEditor key={merchantId || "new"} merchantId={merchantId} localMerchants={localMerchants} onSave={onSave} />;
}

function MerchantEditor({ merchantId, localMerchants, onSave }) {
  const navigate = useNavigate();
  const location = useLocation();
  const selected = merchantId
    ? localMerchants.find((row) => String(row.id) === String(merchantId)) || location.state?.merchant || null
    : null;
  const [merchant, setMerchant] = useState(
    (selected?._onboarding?.merchant
      ? { ...blankMerchant(), ...selected._onboarding.merchant, phone: merchantPhoneFromRow(selected) || selected._onboarding.merchant.phone || "" }
      : null) ||
    (selected ? merchantDetailToDraft({ raw: selected, merchant: selected }, selected).merchant : blankMerchant())
  );
  const locationOptions = useLocationOptions(merchant);
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(selected?._onboarding?.planId || "");
  const [cycle, setCycle] = useState(normalizeCycle(selected?._onboarding?.cycle || "Monthly"));
  const [start, setStart] = useState(selected?._onboarding?.start || today());
  const [step, setStep] = useState(0);
  const [storeTypes, setStoreTypes] = useState([]);
  const lookedUpStoreTypeIdsRef = useRef(new Set());
  const [loading, setLoading] = useState(Boolean(merchantId && !selected?._onboarding));
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  // For edit mode, wait for the saved international phone value to identify
  // the phone country. Do not default every merchant to India.
  const [phoneCountry, setPhoneCountry] = useState(
    selected?._onboarding?.merchant?.phoneCountry || selected?.phoneCountry || (merchantId ? "" : "in"),
  );
  const [phoneDialCode, setPhoneDialCode] = useState(
    selected?._onboarding?.merchant?.phoneDialCode || selected?.phoneDialCode || (merchantId ? "" : "91"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [saved, setSaved] = useState(null);

  const phoneCountryInitializedRef = useRef(false);
  useEffect(() => {
    if (locationOptions.loading || !locationOptions.locationRecords.length || loading || phoneCountryInitializedRef.current) return;
    const resolved = resolvePhoneDetails(merchant.phone, locationOptions.locationRecords, phoneDialCode);
    if (resolved.country?.iso2) setPhoneCountry(resolved.country.iso2.toLowerCase());
    if (resolved.dialCode) setPhoneDialCode(resolved.dialCode);
    if (resolved.country?.name && resolved.country.name !== merchant.country) {
      setMerchant((current) => ({ ...current, country: resolved.country.name, state: "", city: "" }));
    }
    if (resolved.nationalNumber && resolved.nationalNumber !== String(merchant.phone || "").replace(/\D/g, "")) {
      setMerchant((current) => ({ ...current, phone: resolved.nationalNumber }));
    }
    phoneCountryInitializedRef.current = true;
  }, [locationOptions.loading, locationOptions.locationRecords.length, loading, phoneDialCode]);
  useEffect(() => {
    const canonicalCountry = locationOptions.selectedCountry?.name;
    if (!canonicalCountry || merchant.country === canonicalCountry) return;
    setMerchant((current) => current.country === canonicalCountry ? current : { ...current, country: canonicalCountry });
  }, [locationOptions.selectedCountry?.name, merchant.country]);
  const editing = Boolean(merchantId);
  const currentDraftSnapshot = JSON.stringify({ merchant, phoneCountry, phoneDialCode, planId, cycle, start, paymentMethod });
  const cancel = () => {
    if (submitting) return;
    navigate("/merchants");
  };
  const goToStep = (index) => setStep(index);

  useEffect(() => {
    let active = true;
    listPlans().then((items) => active && setPlans(items.filter((item) => String(item.status).toUpperCase() === "ACTIVE")))
      .catch((failure) => active && setError(failure.message || "Unable to load plans."))
      .finally(() => active && setPlansLoading(false));
    storeTypesApi.getAll().then((response) => {
      const source = response?.storeTypes ?? response?.data?.storeTypes ?? response?.data;
      const items = Array.isArray(source) ? source : [];
      if (active) setStoreTypes(items);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!plans.length) return;
    const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "").trim());
    const knownIds = new Set(storeTypes.flatMap((type) => [type.id, type.storeTypeId, type.store_type_id]
      .filter(Boolean).map((value) => String(value).trim().toLowerCase())));
    const ids = new Set();
    plans.forEach((item) => {
      [item.storeTypeId, item.store_type_id, item.storeTypeName, item.store_type_name, item.applicableStoreType, item.applicable_store_type, item.storeType, item.store_type]
        .forEach((value) => {
          const candidates = value && typeof value === "object"
            ? [value.id, value.storeTypeId, value.store_type_id]
            : [value];
          candidates.filter(isUuid).forEach((id) => {
            const key = String(id).trim().toLowerCase();
            if (!knownIds.has(key) && !lookedUpStoreTypeIdsRef.current.has(key)) ids.add(String(id).trim());
          });
        });
    });
    if (!ids.size) return;

    let active = true;
    const lookups = [...ids].map(async (id) => {
      lookedUpStoreTypeIdsRef.current.add(id.toLowerCase());
      try {
        const response = await storeTypesApi.getById(id);
        return response?.storeType || null;
      } catch {
        return null;
      }
    });
    Promise.all(lookups).then((resolved) => {
      const items = resolved.filter((item) => item?.name);
      if (active && items.length) {
        setStoreTypes((current) => {
          const byId = new Map(current.map((item) => [String(item.id || item.storeTypeId || "").toLowerCase(), item]));
          items.forEach((item) => byId.set(String(item.id || item.storeTypeId || "").toLowerCase(), item));
          return [...byId.values()];
        });
      }
    });
    return () => { active = false; };
  }, [plans, storeTypes]);

  useEffect(() => {
    if (!merchantId || selected?._onboarding || locationOptions.loading || !locationOptions.locationRecords.length) return;
    let active = true;
    getMerchant(merchantId).then((result) => {
      if (!active) return;
      const draft = merchantDetailToDraft(result, selected || result.merchant);
      // Use the detailed API phone value. List-row phone values may be
      // national-only and must not overwrite the international number.
      const resolvedPhone = resolvePhoneDetails(draft.merchant.phone, locationOptions.locationRecords, draft.phoneDialCode);
      const savedCountryKey = String(draft.phoneCountry || "").trim().toLowerCase();
      const savedDialDigits = savedCountryKey.replace(/\D/g, "");
      const metadataCountry = locationOptions.locationRecords.find((country) =>
        [country.iso2, country.iso3, country.name].some((value) => String(value || "").trim().toLowerCase() === savedCountryKey) ||
        (savedDialDigits && String(country.phoneCode || country.phone_code || country.dialCode || "").replace(/\D/g, "") === savedDialDigits),
      );
      if (metadataCountry?.iso2) setPhoneCountry(metadataCountry.iso2.toLowerCase());
      else if (/^[a-z]{2}$/i.test(savedCountryKey)) setPhoneCountry(savedCountryKey);
      else if (resolvedPhone.country?.iso2) setPhoneCountry(resolvedPhone.country.iso2.toLowerCase());
      const dialCode = draft.phoneDialCode || resolvedPhone.dialCode || metadataCountry?.phoneCode || metadataCountry?.phone_code || "";
      if (dialCode) setPhoneDialCode(String(dialCode).replace(/\D/g, ""));
      if (resolvedPhone.nationalNumber) draft.merchant.phone = resolvedPhone.nationalNumber;
      phoneCountryInitializedRef.current = true;
      setMerchant(draft.merchant);
      setPlanId(draft.planId || "");
      setCycle(normalizeCycle(draft.cycle));
      setStart(draft.start || today());
    }).catch((failure) => active && setError(failure.message || "Unable to load merchant details."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [merchantId, locationOptions.loading, locationOptions.locationRecords.length]);

  const plan = plans.find((item) => [item.id, item.planId, item.plan_id, item.code, item.planCode, item.plan_code, item.name].some((value) => String(value || "").toLowerCase() === String(planId || "").toLowerCase())) || null;
  const planGroups = useMemo(() => {
    const groups = new Map();
    plans.forEach((item) => {
      const name = getPlanStoreType(item, storeTypes);
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(item);
    });
    return [...groups].map(([storeType, items]) => ({ storeType, items }));
  }, [plans, storeTypes]);
  useEffect(() => {
    if (!plan && plans.length && selected?._onboarding?.planName) {
      const match = plans.find((item) => item.name.toLowerCase() === selected._onboarding.planName.toLowerCase());
      if (match) setPlanId(match.id);
    }
  }, [plans]);

  const updateField = (key, value) => {
    setMerchant((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: "" }));
  };
  const validatePhone = (selectedDialCode = phoneDialCode, phoneValue = merchant.phone) => {
    const phoneDigits = String(phoneValue || "").replace(/\D/g, "");
    if (!selectedDialCode) return "Select a phone country code.";
    if (!phoneDigits || phoneDigits.length <= selectedDialCode.length) return "Phone Number is required.";
    const nationalDigits = phoneDigits.startsWith(selectedDialCode) ? phoneDigits.slice(selectedDialCode.length) : phoneDigits;
    if (nationalDigits.length < 7 || phoneDigits.length > 15) return "Enter a valid phone number.";
    return "";
  };
  const validateMerchant = () => {
    const errors = {};
    for (const [key, label] of [["business", "Legal Business Name"], ["display", "Business Display Name"], ["firstName", "First Name"], ["lastName", "Last Name"], ["addressLine1", "Address Line 1"], ["city", "City"], ["state", "State / Province"], ["postal", "ZIP Code"], ["country", "Country"]]) {
      if (!String(merchant[key] || "").trim()) errors[key] = `${label} is required.`;
    }
    if (!String(merchant.email || "").trim()) errors.email = "Email Address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(merchant.email)) errors.email = "Enter a valid email address.";
    if (!editing && !String(merchant.password || "")) errors.password = "Password is required.";
    else if (String(merchant.password || "") && String(merchant.password).length < 8) errors.password = "Password must be at least 8 characters.";
    errors.phone = validatePhone();
    return errors;
  };

  const continueStep = () => {
    if (step === 0) {
      const validation = validateMerchant();
      setFieldErrors(validation);
      if (Object.values(validation).some(Boolean)) {
        setError("");
        return;
      }
    } else if (step === 1 && !plan) {
      setError("Choose an active plan.");
      return;
    } else if (step === 1 && !editing && start < today()) {
      setError("Start date must be today or later.");
      return;
    }
    setError("");
    setStep((current) => current + 1);
  };

  async function save() {
    const validation = validateMerchant();
    setFieldErrors(validation);
    const firstFieldError = Object.values(validation).find(Boolean);
    if (firstFieldError) {
      setStep(0);
      setError("");
      return;
    }
    if (!plan) {
      setStep(1);
      return setError("Choose an active plan.");
    }
    if (!editing && start < today()) {
      setStep(1);
      return setError("Start date must be today or later.");
    }
    if (!onSave) return setError("Merchant saving is not connected.");
    setError("");
    setSubmitting(true);
    const data = {
      merchant: { ...merchant, countryCode: locationOptions.selectedCountry?.iso3 || merchant.country, phoneDialCode, phoneCountry, name: [merchant.firstName, merchant.lastName].filter(Boolean).join(" ") },
      password: String(merchant.password || "") || undefined,
      planId: plan.id,
      planDetails: plan,
      planName: plan.name,
      cycle,
      start,
      renewalDate: renewalDate(start, cycle),
      agreementPrice: total,
      tax: Math.round(total * (TAX_RATE / 100) * 100) / 100,
      totalDueToday: Math.round(total * (1 + TAX_RATE / 100) * 100) / 100,
      paymentMethod: paymentMethod.toUpperCase(),
      employeeCount: selected?._onboarding?.employeeCount ?? 0,
      stores: [],
      roles: [],
    };
    try {
      const response = merchantId ? await updateMerchant(merchantId, data) : await createMerchant(data);
      const raw = response?.merchant || response?.data?.merchant || response?.data || response;
      const code = raw?.merchantCode || raw?.merchant_code || raw?.code || merchant.code;
      const row = onboardingToRow({ ...data, merchant: { ...merchant, code } });
      const mapped = mapMerchantToRow(response);
      const apiMerchant = response?.merchant || response?.data?.merchant || response?.data || response;
      row.createdAt = mapped?.createdAt || apiMerchant?.createdAt || apiMerchant?.created_at || selected?.createdAt || row.createdAt;
      row.updatedAt = apiMerchant?.updatedAt || apiMerchant?.updated_at || apiMerchant?.updatedOn || apiMerchant?.updated_on || apiMerchant?.updatedDate || apiMerchant?.updated_date || response?.updatedAt || response?.updated_at || new Date().toISOString();
      row.phoneDialCode = phoneDialCode;
      row.phoneCountry = phoneCountry;
      row.id = selected?.id || raw?.id || raw?.merchantId || raw?._id || response?.merchantId || code;
      row.merchantId = raw?.merchantId || raw?.id || raw?._id || response?.merchantId || row.id;
      row.name = mapped?.name || row.name;
      row.status = mapped?.status || row.status;
      await onSave(row);
      setSaved({
        ...row,
        cycle,
        start,
        renewalDate: renewalDate(start, cycle),
        amount: total,
        currency: plan.currency || "USD",
        employeeLimit: plan.includedUsers,
        subscriptionId: response?.subscription?.id || response?.subscriptionId || "",
        subscriptionStatus: response?.subscription?.status || "Pending activation",
      });
    } catch (failure) {
      setError(failure.message || "Unable to save merchant.");
    } finally {
      setSubmitting(false);
    }
  }

  const address = [merchant.addressLine1, merchant.addressLine2, merchant.city, merchant.state, merchant.postal, merchant.country].filter(Boolean).join(", ");
  const cycleLabel = cycle === "Annual" ? "year" : cycle === "Quarterly" ? "quarter" : "month";
  const price = Number(plan?.price ?? plan?.basePrice ?? 0);
  const total = price * (cycle === "Annual" ? 12 : cycle === "Quarterly" ? 3 : 1);
  const features = useMemo(() => (plan?.includedFeatures || []).map((feature) => typeof feature === "string" ? feature : feature.name || feature.featureName || feature.code).filter(Boolean), [plan]);

  if (loading) return <div id="pch-new"><Header editing onBack={cancel} /><p className="pch-note">Loading merchantâ€¦</p></div>;
  if (saved) return (
    <div id="pch-new"><Header editing={editing} onBack={cancel} />
      <main className="pch-success-screen">
        <h1>Subscription Successful!</h1>
        <p>Welcome to Pinaka Commerce Hub, {saved.name}.</p>
        <section className="pch-success-details">
          <div className="pch-rule"><span className="pch-muted">Plan</span><span>{saved.plan}</span></div>
          <div className="pch-rule"><span className="pch-muted">Billing Cycle</span><span>{saved.cycle}</span></div>
          <div className="pch-rule"><span className="pch-muted">Employees</span><span>{saved.employeeCount ?? 0} / {saved.employeeLimit ?? "Not set"}</span></div>
          <div className="pch-rule"><span className="pch-muted">Amount</span><span>{formatPrice(saved.amount, saved.currency)} / {saved.cycle === "Annual" ? "year" : saved.cycle === "Quarterly" ? "quarter" : "month"}</span></div>
          <div className="pch-rule"><span className="pch-muted">Subscription ID</span><span>{saved.subscriptionId || "Pending assignment"}</span></div>
          <div className="pch-rule"><span className="pch-muted">Start Date</span><span>{saved.start}</span></div>
          <div className="pch-rule"><span className="pch-muted">Next Billing Date</span><span>{saved.renewalDate}</span></div>
          <div className="pch-rule"><span className="pch-muted">Status</span><span><StatusBadge status={saved.subscriptionStatus} /></span></div>
        </section>
        <div className="pch-success-actions">
          <button className="pch-subscribe-now" type="button" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
          <button type="button" onClick={cancel}>Back to Merchants</button>
        </div>
      </main>
    </div>
  );

  return (
    <div id="pch-new" className={`pch-merchant-one-page ${editing ? "pch-editing" : "pch-step-scroll"}`}><Header editing={editing} onBack={cancel} />
      <div className="pch-layout">
        <aside><div className="pch-eyebrow pch-aside-note">Add merchant</div><nav className="pch-rail" aria-label="Setup steps">
          {[
            ["Merchant details", "Business & primary contact"],
            ["Select Plan", "Plan Pricing and Included Limits"],
            ["Review & Confirm", "Merchant, Subscription, and Billing Summary"],
          ].map(([label, description], index) => <button key={label} type="button" disabled={!editing && index > step} className={index === step ? "pch-current" : ""} aria-current={index === step ? "step" : undefined} onClick={() => goToStep(index)}><span className="pch-number">{index < step ? "✓" : index + 1}</span><span>{label}<small className="pch-muted pch-rail-description">{description}</small></span></button>)}
        </nav></aside>
        <main>
          <section hidden={step !== 0} className="pch-merchant-step">
            <div className="pch-eyebrow">Step 1 - Merchant Details</div>
            <h1>Merchant details</h1>
            <p className="pch-muted">Business and primary contact</p>
            <Panel title="Business Information" subtitle="Legal and display names for the merchant."><div className="pch-grid">
              <Field label="Legal Business Name *" placeholder="Enter legal business name" value={merchant.business} required error={fieldErrors.business} onChange={(v) => updateField("business", v)} />
              <Field label="Business Display Name *" placeholder="Enter business display name" value={merchant.display} required error={fieldErrors.display} onChange={(v) => updateField("display", v)} />
              <Field label="Merchant Code" value={merchant.code} readOnly placeholder=" Auto Generated" />
              <Field label="EIN" placeholder="Enter EIN" value={merchant.ein} onChange={(v) => updateField("ein", v)} />
            </div></Panel>
            <Panel title="Primary Contact" subtitle="Contact details and the merchant's location."><div className="pch-grid">
              <Field label="First Name *" placeholder="Enter first name" value={merchant.firstName} required error={fieldErrors.firstName} onChange={(v) => updateField("firstName", v)} />
              <Field label="Last Name *" placeholder="Enter last name" value={merchant.lastName} required error={fieldErrors.lastName} onChange={(v) => updateField("lastName", v)} />
              <Field label="Email Address *" type="text" inputMode="email" placeholder="Enter email address" value={merchant.email} required error={fieldErrors.email} onChange={(v) => updateField("email", v)} />
              <Field label="Password *" type="password" name="merchant-entry-token" placeholder={editing ? "Enter a new password" : "Enter password"} value={merchant.password} required={!editing} autoComplete="one-time-code" error={fieldErrors.password} onChange={(v) => updateField("password", v)} />
              <div className={`pch-field pch-phone-field${fieldErrors.phone ? " pch-field-invalid" : ""}`}>
                <label htmlFor="merchant-phone">Phone Number <span className="text-red-500" style={{ color: "#dc2626" }}>*</span></label>
              <PhoneInput key={`${merchantId || "new"}-${loading ? "loading" : "ready"}-${phoneCountry || "unresolved"}`} country={phoneCountry || undefined} disableCountryGuess enableSearch countryCodeEditable={false} autoFormat value={phoneInputValue(merchant.phone, phoneDialCode)} onChange={(value, data) => {
                const nextCountry = data?.countryCode || phoneCountry;
                const nextDialCode = String(data?.dialCode || phoneDialCode).replace(/\D/g, "");
                const dialCodeChanged = Boolean(phoneDialCode && nextDialCode && nextDialCode !== phoneDialCode);
                const digits = String(value || "").replace(/\D/g, "");
                const nationalNumber = dialCodeChanged ? "" : nextDialCode && digits.startsWith(nextDialCode) ? digits.slice(nextDialCode.length) : digits;
                const matchedCountry = locationOptions.locationRecords.find((country) => country.iso2?.toLowerCase() === nextCountry?.toLowerCase());
                setPhoneCountry(nextCountry);
                setPhoneDialCode(nextDialCode);
                setMerchant((current) => ({ ...current, phone: nationalNumber, ...(matchedCountry ? { country: matchedCountry.name, state: "", city: "" } : {}) }));
                setFieldErrors((previous) => ({ ...previous, phone: validatePhone(nextDialCode, nationalNumber), ...(matchedCountry ? { country: "", state: "", city: "" } : {}) }));
              }} inputProps={{ id: "merchant-phone", name: "merchant-phone-entry", required: true, autoComplete: "new-password", "aria-invalid": Boolean(fieldErrors.phone) }} />
                {fieldErrors.phone && <span className="pch-field-error" role="alert">{fieldErrors.phone}</span>}
              </div>
              <Field label="Country *" value={merchant.country || locationOptions.selectedCountry?.name || ""} required error={fieldErrors.country} readOnly aria-readonly="true" />
              <Select label="State / Province *" value={merchant.state} placeholder={merchant.country ? "Select state or province" : "Select country first"} options={locationOptions.states.map((value) => ({ value, label: value }))} required error={fieldErrors.state} onChange={(v) => { updateField("state", v); updateField("city", ""); }} />
              <Field label="City *" placeholder="Enter city" value={merchant.city} required error={fieldErrors.city} onChange={(v) => updateField("city", v)} />
              <Field label="Address Line 1 *" placeholder="Enter street address" value={merchant.addressLine1} required error={fieldErrors.addressLine1} onChange={(v) => updateField("addressLine1", v)} />
              <Field label="Address Line 2" placeholder="Apartment, suite, etc. (optional)" value={merchant.addressLine2} onChange={(v) => updateField("addressLine2", v)} />
              <Field label="ZIP / Postal Code *" placeholder="Enter ZIP or postal code" value={merchant.postal} required error={fieldErrors.postal} onChange={(v) => updateField("postal", v)} />
            </div></Panel>
            {error && <div className="pch-error" role="alert">{error}</div>}
            <div className="pch-footerbar"><button type="button" disabled={submitting} onClick={cancel}>Back</button><button className="pch-primary" type="button" disabled={submitting} onClick={continueStep}>Continue</button></div>
          </section>
          <section hidden={step !== 1} className="pch-plan-step">
            <div className="pch-eyebrow">Step 2 - Plan Selection</div>
            <h1>Choose plan</h1>
            <p className="pch-muted">Select an active plan and billing details.</p>
            <Panel title="Subscription Plan" subtitle="Choose an active plan and set its billing preferences.">
              {plansLoading ? <p className="pch-note">Loading plansâ€¦</p> : null}
              {!plansLoading && !plans.length ? <p className="pch-note">No active plans are available.</p> : null}
              <div className="pch-plan-browser">
                <section className="pch-plan-list" aria-label="Available plans">
                  <h4>Available plans</h4>
                  <div className="pch-plan-list-scroll">
                    {planGroups.map((group) => <div key={group.storeType} className="pch-plan-group">
                      <div className="pch-plan-group-heading"><span>{group.storeType}</span><span>{group.items.length} {group.items.length === 1 ? "plan" : "plans"}</span></div>
                      {group.items.map((item) => <label key={item.id} className={`pch-plan-option ${String(item.id) === String(planId) ? "pch-selected" : ""}`}>
                        <input type="radio" name="merchant-plan-selection" value={item.id} checked={String(item.id) === String(planId)} onChange={() => setPlanId(String(item.id))} aria-label={`Select ${item.name}`} />
                        <span className="pch-plan-option-copy"><strong>{item.name}</strong><span className="pch-plan-option-price">{formatPrice(item.price ?? item.basePrice, item.currency || "USD")}</span><small>per merchant / {item.billingCycle || "month"}</small><span className="pch-plan-option-limits">{item.includedStores ?? "Custom"} stores · {item.includedTerminals ?? "Custom"} devices · {item.includedUsers ?? "Custom"} employees</span></span>
                      </label>)}
                    </div>)}
                  </div>
                </section>
                <div className="pch-plan-detail-column">
                  <section className="pch-plan-detail" aria-live="polite">
                    {!plan ? <div className="pch-plan-empty"><span className="pch-plan-empty-icon" aria-hidden="true"><i>+</i></span><strong>Select a plan to view details</strong><span>Plan price, limits and included features will appear here.</span></div> : <div className="pch-plan-detail-content">
                      <div className="pch-plan-detail-heading"><div><span className="pch-small pch-muted">Plan details</span><h3>{plan.name}</h3><div className="pch-price">{formatPrice(plan.price ?? plan.basePrice, plan.currency || "USD")} <small>per merchant / {plan.billingCycle || "month"}</small></div></div><span className="pch-plan-selected-label">Selected</span></div>
                      <div className="pch-plan-detail-limits"><div><strong>{plan.includedStores ?? "Custom"}</strong><span>stores</span></div><div><strong>{plan.includedTerminals ?? "Custom"}</strong><span>devices</span></div><div><strong>{plan.includedUsers ?? "Custom"}</strong><span>employees</span></div></div>
                      <details className="pch-plan-features" open><summary>Included Features <span>{features.length}</span></summary>{features.length ? <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : <p>No included features configured for this plan.</p>}</details>
                    </div>}
                  </section>
                  <section className="pch-plan-agreement" aria-label="Billing Details"><h3>Billing Details</h3><div className="pch-grid">
                    <Select label="Billing cycle" value={cycle} options={["Monthly", "Quarterly", "Annual"]} onChange={(value) => setCycle(normalizeCycle(value))} />
                    <Field label="Start date" type="date" min={editing ? undefined : today()} value={start} onChange={(value) => setStart(!editing && value && value < today() ? today() : value)} />
                    <Field label="Renewal date" type="date" value={renewalDate(start, cycle)} readOnly />
                    <Field label="Subscription Price" value={`${formatPrice(total, plan?.currency || "USD")} / ${cycleLabel}`} readOnly />
                  </div><p className="pch-note">Country-based merchant pricing. Annual amount is 12 monthly payments; tax excluded.</p></section>
                </div>
              </div>
            </Panel>
            {error && <div className="pch-error" role="alert">{error}</div>}
            <div className="pch-footerbar">
              <button type="button" disabled={submitting} onClick={() => { setError(""); setStep(0); }}>Back</button>
              <button className="pch-primary" type="button" disabled={submitting || plansLoading} onClick={continueStep}>Review &amp; Confirm</button>
            </div>
          </section>
          <section hidden={step !== 2} className="pch-review-step">
            <div className="pch-eyebrow">Step 3 - Review &amp; Subscribe</div>
            <h1>Review &amp; Subscribe</h1>
            <p className="pch-muted">Review merchant, plan, and billing information.</p>
            <div className="pch-review-grid">
              <Panel title="Merchant Details" subtitle="Review the merchant's business and contact information." action={editing && <button className="pch-review-edit" type="button" aria-label="Edit merchant details" data-tooltip="Edit merchant details" onClick={() => { setError(""); setStep(0); }}><Pencil size={16} aria-hidden="true" /><span>Edit</span></button>}>
                <dl className="pch-review-list">
                  <div><dt>Business Name</dt><dd>{merchant.business || merchant.display || "—"}</dd></div>
                  <div><dt>Merchant Code</dt><dd>{merchant.code || "Auto Generated"}</dd></div>
                  <div><dt>EIN</dt><dd>{merchant.ein || "—"}</dd></div>
                  <div><dt>Primary Contact</dt><dd>{[merchant.firstName, merchant.lastName].filter(Boolean).join(" ") || "—"}</dd></div>
                  <div><dt>Email Address</dt><dd>{merchant.email || "—"}</dd></div>
                  <div><dt>Phone Number</dt><dd>{merchant.phone || "—"}</dd></div>
                  <div><dt>Business Address</dt><dd>{address || "—"}</dd></div>
                </dl>
              </Panel>
              <Panel title="Plan Details" subtitle="Review the selected plan and its included limits." action={editing && <button className="pch-review-edit" type="button" aria-label="Edit plan details" data-tooltip="Edit plan details" onClick={() => { setError(""); setStep(1); }}><Pencil size={16} aria-hidden="true" /><span>Edit</span></button>}>
                <dl className="pch-review-list">
                  <div><dt>Subscription Plan</dt><dd>{plan?.name || "—"}</dd></div>
                  <div><dt>Store Type</dt><dd>{plan ? getPlanStoreType(plan, storeTypes) : "—"}</dd></div>
                  <div><dt>Billing Cycle</dt><dd>{cycle}</dd></div>
                  <div><dt>Plan Includes</dt><dd>{plan ? `${plan.includedStores ?? "Custom"} stores · ${plan.includedTerminals ?? "Custom"} devices · ${plan.includedUsers ?? "Custom"} employees` : "—"}</dd></div>
                  <div><dt>Start Date</dt><dd>{start || "—"}</dd></div>
                  <div><dt>Renewal Date</dt><dd>{renewalDate(start, cycle) || "—"}</dd></div>
                </dl>
              </Panel>
              <Panel title="Billing Summary" subtitle="Review the initial amount and subscription dates.">
                <div className="pch-billing-summary">
                  <div><span>Subscription Subtotal</span><strong>{formatPrice(total, plan?.currency || "USD")}</strong></div>
                  <div><span>Tax ({TAX_RATE.toFixed(2)}%)</span><strong>{formatPrice(Math.round(total * TAX_RATE) / 100, plan?.currency || "USD")}</strong></div>
                  <div className="pch-billing-total"><span>Total Due</span><strong>{formatPrice(Math.round(total * (1 + TAX_RATE / 100) * 100) / 100, plan?.currency || "USD")}</strong></div>
                </div>
              </Panel>
              <Panel title="Payment Method" subtitle="Select how the merchant will pay for the subscription.">
                <fieldset className="pch-payment-methods">
                  <legend>Select a payment method</legend>
                  <label><input type="radio" name="merchant-payment-method" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} /> Credit or Debit Card</label>
                  <label><input type="radio" name="merchant-payment-method" value="ach" checked={paymentMethod === "ach"} onChange={() => setPaymentMethod("ach")} /> Bank transfer</label>
                </fieldset>
                <p className="pch-note">No payment information is entered on this screen.</p>
              </Panel>
            </div>
            {error && <div className="pch-error" role="alert">{error}</div>}
            <div className="pch-footerbar">
              <button type="button" disabled={submitting} onClick={() => { setError(""); setStep(1); }}>Back</button>
              <button className="pch-primary" type="button" disabled={submitting || !plan} onClick={save}>{submitting ? "Saving…" : editing ? "Save Changes" : "Create Merchant"}</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
