import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMerchant, listMerchants } from "../api/merchants";
import { createStore, getStore, updateStore } from "../api/stores";
import { storeTypesApi } from "../api/storeTypes";
//import { allocateId } from "../api/ids";
import { ApiError } from "../api/http";
import "../styles/merchant-form.css";

// Supported countries and time zones match the merchant onboarding form.
const COUNTRY_SETTINGS = {
  "United States": {
    currency: "USD",
    symbol: "$",
    zones: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Phoenix",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
    ],
  },
  India: { currency: "INR", symbol: "₹", zones: ["Asia/Kolkata"] },
  Canada: {
    currency: "CAD",
    symbol: "C$",
    zones: [
      "America/Toronto",
      "America/Vancouver",
      "America/Edmonton",
      "America/Winnipeg",
      "America/Halifax",
      "America/St_Johns",
      "America/Regina",
      "America/Whitehorse",
    ],
  },
  "United Kingdom": { currency: "GBP", symbol: "£", zones: ["Europe/London"] },
  Australia: {
    currency: "AUD",
    symbol: "A$",
    zones: [
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Brisbane",
      "Australia/Adelaide",
      "Australia/Perth",
      "Australia/Darwin",
      "Australia/Hobart",
      "Australia/Broken_Hill",
      "Australia/Lord_Howe",
    ],
  },
};

function applyCountry(store, country) {
  const settings = COUNTRY_SETTINGS[country];
  return {
    ...store,
    country,
    currency: settings?.currency || "",
    timezone: settings?.zones.includes(store.timezone)
      ? store.timezone
      : settings?.zones.length === 1
        ? settings.zones[0]
        : "",
  };
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const STEPS = [
  ["Store locations", "Type defaults & operations"],
  ["Merchant subscription", "Package & location licenses"],
  ["Devices", "Register & allocate licenses"],
  ["Effective features", "Relevance × entitlement"],
  ["Merchant roles", "Inherited access, templates & permissions"],
  ["Review & provision", "Connected records"],
];

// Store-level role templates a store admin can layer on top of the roles
// inherited from the merchant. Actual permission actions for each feature
// come from the store type's feature definitions (typeData.features), not
// a hardcoded map, so they always match what the store type actually offers.
const ROLE_TEMPLATES = [
  "Store Manager",
  "Shift Manager",
  "Cashier",
  "Inventory Clerk",
  "Receiving Clerk",
];

const DEVICE_TYPES = ["POS", "KDS", "Printer", "Scanner"];

const listFrom = (response) => {
  const rows =
    response?.features ??
    response?.storeTypeFeatures ??
    response?.items ??
    response?.data ??
    response;
  return Array.isArray(rows) ? rows : [];
};
const featureName = (item) =>
  typeof item === "string"
    ? item
    : (item?.name ?? item?.featureName ?? item?.featureKey ?? item?.code ?? "");
const actionsFrom = (items) =>
  Array.isArray(items)
    ? items
      .map((item) =>
        typeof item === "string"
          ? item
          : (item?.name ?? item?.action ?? item?.code),
      )
      .filter(Boolean)
    : [];
const limitFrom = (...values) => {
  const value = values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !Array.isArray(value),
  );
  if (value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};
const displayLimit = (value) => (value == null ? "Unavailable" : value);

const emptyHours = () =>
  DAYS.map((day) => ({
    day,
    status: "Open",
    open: "06:00",
    close: "22:00",
    shifts: 2,
  }));

const initialStore = (merchantId = "") => ({
  merchantId,
  id: "",
  name: "",
  type: "",
  storeTypeId: "",
  phone: "",
  url: "",
  currency: "",
  status: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  timezone: "",
  hours: emptyHours(),
});

// Store address format: Address Line 1, optional Address Line 2, City,
// State/Province, ZIP/Postal Code, and Country.

const Field = ({ label, value, onChange, type = "text", ...props }) => (
  <label className="pch-field">
    {label}
    <input
      {...props}
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const Select = ({ label, value, onChange, options, disabled = false }) => (
  <label className="pch-field">
    {label}
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o}>{o}</option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  </label>
);

const Panel = ({ title, children }) => (
  <section className="pch-panel">
    <div className="pch-panel-heading">
      <h2>{title}</h2>
    </div>
    {children}
  </section>
);

const Detail = ({ label, value }) => (
  <div className="pch-rule">
    <span className="pch-muted">{label}</span>
    <span>{value ?? "—"}</span>
  </div>
);

function merchantIdOf(value) {
  if (value && typeof value === "object") {
    return String(value.id ?? value._id ?? value.merchantId ?? "");
  }
  return value == null ? "" : String(value);
}

function merchantConfiguration(result) {
  const response = result.raw || {};
  const raw =
    response.merchant || response.data?.merchant || response.data || response;
  const draft = raw._onboarding || result.merchant?._onboarding;
  const owner = { ...(draft?.merchant || {}), ...raw, ...result.merchant };
  const type = owner.storeType;
  return {
    merchant: owner,
    type: {
      id: String(
        owner.storeTypeId ?? type?.id ?? draft?.merchant?.storeTypeId ?? "",
      ),
      name:
        owner.storeTypeName ||
        (typeof type === "string" ? type : type?.name) ||
        owner.type ||
        "",
      code:
        owner.storeTypeCode ||
        type?.code ||
        draft?.merchant?.storeTypeCode ||
        "",
    },
    subscription: result.subscription ?? raw.subscription ?? null,
    roles: Array.isArray(result.roles)
      ? result.roles
      : Array.isArray(raw.roles)
        ? raw.roles
        : Array.isArray(result.merchant?.roles)
          ? result.merchant.roles
          : draft?.roles || [],
  };
}

export default function AddStore() {
  const nav = useNavigate();
  const { merchantId: routeMerchantId, storeId } = useParams();
  const editing = Boolean(storeId);

  const [store, setStore] = useState(() => initialStore(routeMerchantId));
  const [merchant, setMerchant] = useState(null);
  const [merchantType, setMerchantType] = useState({
    id: "",
    name: "",
    code: "",
  });
  const [merchantRoles, setMerchantRoles] = useState([]);
  const [loadedMerchantId, setLoadedMerchantId] = useState("");
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [merchantError, setMerchantError] = useState("");
  const [merchants, setMerchants] = useState([]);
  const [merchantStores, setMerchantStores] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [devices, setDevices] = useState([]);
  const [enabledFeatures, setEnabledFeatures] = useState([]);
  const [storeTypes, setStoreTypes] = useState([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [mastersError, setMastersError] = useState("");
  const [typeData, setTypeData] = useState({
    id: "",
    features: [],
    roles: [],
    loading: false,
    error: "",
  });

  // Store-level roles: layered on top of whatever roles are inherited from
  // the merchant. A store admin can pick from templates, add a custom role,
  // and configure per-feature permissions for each one.
  const [storeRoles, setStoreRoles] = useState([]);
  const [activeStoreRole, setActiveStoreRole] = useState("");
  const [storeRolePermissions, setStoreRolePermissions] = useState({});
  const [customRoleOpen, setCustomRoleOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleScope, setCustomRoleScope] = useState("Store");

  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        if (!routeMerchantId && !storeId) {
          const rows = await listMerchants();
          if (!cancelled) {
            setMerchants(Array.isArray(rows) ? rows : []);
          }
        }

        if (storeId) {
          const saved = await getStore(storeId);

          if (!cancelled) {
            setStore({
              ...initialStore(
                routeMerchantId ||
                merchantIdOf(saved.merchantId ?? saved.merchant),
              ),
              ...saved,
              name: saved.storeName || saved.name || "",
              type:
                saved.storeType?.name ||
                saved.storeTypeName ||
                saved.storeType ||
                saved.type ||
                "",
              storeTypeId: String(
                saved.storeTypeId ?? saved.storeType?.id ?? "",
              ),
              id: saved.storeID || saved.id || "",
              merchantId:
                routeMerchantId ||
                merchantIdOf(saved.merchantId ?? saved.merchant),
              addressLine1:
                saved.addressLine1 ||
                saved.address?.addressLine1 ||
                saved.address?.street ||
                (typeof saved.address === "string" ? saved.address : ""),
              addressLine2:
                saved.addressLine2 ||
                saved.address?.addressLine2 ||
                saved.address?.unit ||
                "",
              city: saved.city || saved.address?.city || "",
              state: saved.state || saved.address?.state || "",
              zip:
                saved.zip || saved.postalCode || saved.address?.zipCode || "",
              country: saved.country || saved.address?.country || "",
              hours: saved.hours || emptyHours(),
            });
            setDevices(
              Array.isArray(saved.devices)
                ? saved.devices.map((d) => ({
                  ...d,
                  name: d.name || d.deviceName || "",
                  type: d.type || d.deviceType || "",
                  serial: d.serial || d.identifier || "",
                }))
                : [],
            );
            if (Array.isArray(saved.features) && saved.features.length) {
              setEnabledFeatures(
                saved.features
                  .map((feature) =>
                    typeof feature === "string"
                      ? feature
                      : feature.name || feature.featureName,
                  )
                  .filter(Boolean),
              );
            }
            if (Array.isArray(saved.storeRoles) && saved.storeRoles.length) {
              const savedStoreRoles = saved.storeRoles
                .map((role) =>
                  typeof role === "string" ? role : role.name || role.roleName,
                )
                .filter(Boolean);
              setStoreRoles(savedStoreRoles);
              setActiveStoreRole(savedStoreRoles[0] || "");
            }
            if (
              saved.storeRolePermissions &&
              typeof saved.storeRolePermissions === "object"
            ) {
              setStoreRolePermissions(saved.storeRolePermissions);
            }
            setFurthest(STEPS.length - 1);
          }
        } else {
          const id = "";

          if (!cancelled) {
            setStore((current) => ({
              ...current,
              merchantId: routeMerchantId || "",
              id,
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load the store setup.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [routeMerchantId, storeId]);

  const selectedMerchantId = merchantIdOf(routeMerchantId || store.merchantId);

  useEffect(() => {
    let cancelled = false;
    setMerchant(null);
    setMerchantType({ id: "", name: "", code: "" });
    setMerchantRoles([]);
    setMerchantStores([]);
    setSubscription(null);
    setLoadedMerchantId("");
    setMerchantError("");
    setMerchantLoading(Boolean(selectedMerchantId));

    if (!selectedMerchantId) return;

    async function loadMerchant() {
      try {
        const result = await getMerchant(selectedMerchantId);
        if (cancelled) return;
        if (!result?.merchant)
          throw new Error("Merchant details are unavailable.");
        const inherited = merchantConfiguration(result);
        setMerchant(inherited.merchant);
        setMerchantType(inherited.type);
        setMerchantRoles(inherited.roles);
        setMerchantStores(Array.isArray(result.stores) ? result.stores : []);
        setSubscription(inherited.subscription);
        setLoadedMerchantId(selectedMerchantId);
      } catch (err) {
        if (!cancelled) {
          setMerchantError(
            err?.message || "Unable to load the selected merchant.",
          );
        }
      } finally {
        if (!cancelled) setMerchantLoading(false);
      }
    }

    loadMerchant();
    return () => {
      cancelled = true;
    };
  }, [selectedMerchantId]);

  const currentMerchant = useMemo(
    () =>
      (loadedMerchantId === selectedMerchantId ? merchant : null) ||
      merchants.find((item) => merchantIdOf(item) === selectedMerchantId),
    [merchant, merchants, loadedMerchantId, selectedMerchantId],
  );

  const merchantReady =
    Boolean(selectedMerchantId) &&
    loadedMerchantId === selectedMerchantId &&
    !merchantLoading &&
    !merchantError;

  useEffect(() => {
    let active = true;
    storeTypesApi
      .getAll()
      .then((types) => {
        if (!active) return;
        if (!Array.isArray(types?.storeTypes)) {
          throw new Error(
            "The store-type API returned an unexpected response.",
          );
        }
        setStoreTypes(types.storeTypes);
      })
      .catch((err) => {
        if (active)
          setMastersError(err.message || "Unable to load master data.");
      })
      .finally(() => {
        if (active) setMastersLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedStoreType = storeTypes.find(
    (item) =>
      merchantReady &&
      (merchantType.id
        ? String(item.id) === merchantType.id
        : String(item.name).toLowerCase() ===
        String(merchantType.name).toLowerCase()),
  );
  const inheritedTypeName = merchantReady
    ? selectedStoreType?.name || merchantType.name
    : "";
  const inheritedTypeId = merchantReady
    ? String(selectedStoreType?.id ?? merchantType.id)
    : "";
  const inheritedTypeCode = merchantReady
    ? selectedStoreType?.storeTypeCode || merchantType.code
    : "";
  const roles = merchantReady
    ? merchantRoles
      .map((role) =>
        typeof role === "string"
          ? role
          : role.name || role.roleName || role.templateName || "",
      )
      .filter(Boolean)
    : [];

  useEffect(() => {
    const id = selectedStoreType?.id;
    if (id == null) {
      setTypeData({
        id: "",
        features: [],
        roles: [],
        loading: false,
        error: "",
      });
      return;
    }
    let active = true;
    setTypeData({
      id: String(id),
      features: [],
      roles: [],
      loading: true,
      error: "",
    });
    storeTypesApi
      .getFeatures(id)
      .then((featureResponse) => {
        if (!active) return;
        const features = listFrom(featureResponse)
          .map((assignment) => {
            const feature =
              assignment.feature ??
              assignment.featureDetails ??
              assignment.featureDefinition ??
              assignment;
            return {
              name: featureName(feature),
              actions: actionsFrom(feature.actions),
              active:
                assignment.defaultEnabled !== false &&
                String(feature.status || "").toUpperCase() !== "INACTIVE",
            };
          })
          .filter((feature) => feature.name && feature.active);
        setTypeData({
          id: String(id),
          features,
          roles: [],
          loading: false,
          error: "",
        });
      })
      .catch((err) => {
        if (active)
          setTypeData({
            id: String(id),
            features: [],
            roles: [],
            loading: false,
            error:
              err.message || "Unable to load inherited store-type features.",
          });
      });
    return () => {
      active = false;
    };
  }, [selectedStoreType?.id]);

  const FEATURES = typeData.features.map((feature) => feature.name);
  const actionsForFeature = (name) =>
    typeData.features.find((f) => f.name === name)?.actions || [];
  const assignedPlan =
    subscription?.plan && typeof subscription.plan === "object"
      ? subscription.plan
      : null;
  const planName =
    subscription?.planName ||
    subscription?.planCode ||
    assignedPlan?.name ||
    (typeof currentMerchant?.plan === "string" ? currentMerchant.plan : "") ||
    "Unavailable";
  const storeLimit = limitFrom(
    subscription?.storeLimit,
    subscription?.stores,
    subscription?.maxStores,
    subscription?.locationLimit,
    assignedPlan?.includedStores,
  );
  const deviceLimit = limitFrom(
    subscription?.deviceLimit,
    subscription?.maxDevices,
    subscription?.devices,
    assignedPlan?.includedTerminals,
  );
  const entitledFeatures = listFrom(
    subscription?.includedFeatures ?? assignedPlan?.includedFeatures ?? [],
  )
    .map(featureName)
    .map((name) => String(name).toLowerCase());
  const featureAvailable = (name) =>
    entitledFeatures.includes(String(name).toLowerCase());

  const enrolledStores = merchantStores.length;

  const existingDevices = Array.isArray(subscription?.devices)
    ? subscription.devices
    : Array.isArray(subscription?.registeredDevices)
      ? subscription.registeredDevices
      : [];

  const enrolledDeviceCount = Number(
    subscription?.usedDevices ||
    subscription?.deviceCount ||
    subscription?.devicesUsed ||
    existingDevices.length ||
    0,
  );

  const persistedDeviceCount = useMemo(() => {
    if (!editing) return 0;
    return existingDevices.filter(
      (device) =>
        String(device.storeId ?? device.store?.id ?? device.store) ===
        String(storeId),
    ).length;
  }, [editing, existingDevices, storeId]);
  const usedDevices =
    Math.max(0, enrolledDeviceCount - persistedDeviceCount) + devices.length;

  const remainingStores =
    storeLimit == null ? null : Math.max(0, storeLimit - enrolledStores);

  const remainingDevices =
    deviceLimit == null ? null : Math.max(0, deviceLimit - usedDevices);

  const countrySettings = COUNTRY_SETTINGS[store.country];
  const currencyDisplay = countrySettings
    ? countrySettings.currency + " (" + countrySettings.symbol + ")"
    : "";

  // Normalize existing stores as well as country changes.
  useEffect(() => {
    setStore((current) => {
      const next = applyCountry(current, current.country);
      return next.currency === current.currency &&
        next.timezone === current.timezone
        ? current
        : next;
    });
  }, [store.country]);

  const changeCountry = (country) => {
    setError("");
    setStore((current) => applyCountry(current, country));
  };

  const change = (key, value) => {
    setError("");

    setStore((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const backToStores = () =>
    nav(routeMerchantId ? `/merchants/${routeMerchantId}/stores` : "/stores");

  const updateHours = (index, key, value) =>
    change(
      "hours",
      store.hours.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            [key]: value,
          }
          : item,
      ),
    );

  const validateStep = (currentStep) => {
    if (currentStep === 0) {
      if (!selectedMerchantId) return "Please select a merchant.";
      if (merchantError) return merchantError;
      if (!merchantReady)
        return "Please wait for the merchant details to load.";
      if (!store.merchantId && !routeMerchantId)
        return "Please select a merchant.";
      if (mastersLoading) return "Please wait for master data to load.";
      if (mastersError) return mastersError;
      if (!selectedStoreType)
        return "The merchant has no resolvable store type. Update the merchant profile first.";
      if (typeData.loading || typeData.id !== String(selectedStoreType.id))
        return "Please wait for store-type details to load.";
      if (typeData.error) return typeData.error;
      if (!store.name || !String(store.name).trim())
        return "Store name is required.";
      if (!store.url || !String(store.url).trim())
        return "Store Base URL is required.";
      try {
        new URL(store.url);
      } catch {
        return "Please enter a valid URL.";
      }
      if (!store.phone || !String(store.phone).trim())
        return "Store phone is required.";
      if (!store.addressLine1 || !String(store.addressLine1).trim())
        return "Address Line 1 is required.";
      if (
        store.country === "United States" &&
        !/^\d+[A-Za-z]?\s+\S.+$/.test(String(store.addressLine1).trim())
      )
        return "Address Line 1 must include the street number and street name.";
      if (!store.city || !String(store.city).trim()) return "City is required.";
      if (!store.state || !String(store.state).trim())
        return "State is required.";
      if (!store.zip || !String(store.zip).trim())
        return "ZIP code is required.";
      if (
        store.country === "United States" &&
        !/^\d{5}(-\d{4})?$/.test(String(store.zip).trim())
      )
        return "Enter a valid 5-digit ZIP code or ZIP+4, for example 85001 or 85001-1234.";
      if (!store.country || !String(store.country).trim())
        return "Country is required.";
      if (!COUNTRY_SETTINGS[store.country])
        return "Please select a supported country.";
      if (!COUNTRY_SETTINGS[store.country].zones.includes(store.timezone))
        return "Please select a time zone for the selected country.";
    } else if (currentStep === 1) {
      if (!editing && storeLimit == null)
        return "Store license limit is unavailable. Check the merchant subscription.";
      if (!editing && remainingStores <= 0)
        return "The merchant has no remaining store licenses.";
    } else if (currentStep === 2) {
      if (devices.length && deviceLimit == null)
        return "Device license limit is unavailable. Check the merchant subscription.";
      if (deviceLimit != null && usedDevices > deviceLimit)
        return "Assigned devices exceed the merchant's device limit.";
      for (let d of devices) {
        if (!d.type || !String(d.type).trim())
          return "Device type is required for all devices.";
        if (!d.name || !String(d.name).trim())
          return "Device name is required for all devices.";
        if (!d.serial || !String(d.serial).trim())
          return "Device identifier is required for all devices.";
      }
    } else if (currentStep === 4) {
      if (customRoleOpen)
        return "Finish or cancel the custom role you're creating before continuing.";
    }
    return null;
  };

  const goTo = (next) => {
    setError("");

    // Validate only the current step before moving forward.
    // This keeps the edit flow on the provisioning journey and
    // allows the final "Review & provision" step to open normally.
    if (next > step) {
      const err = validateStep(step);

      if (err) {
        setError(err);
        return;
      }
    }

    if (next >= 0 && next < STEPS.length) {
      setStep(next);
      setFurthest((value) => Math.max(value, next));
    }
  };

  const goToReview = (event) => {
    if (event) event.preventDefault();
    setError("");

    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }

    setStep(STEPS.length - 1);
    setFurthest(STEPS.length - 1);
  };

  const toggleFeature = (feature) =>
    setEnabledFeatures((items) =>
      items.includes(feature)
        ? items.filter((item) => item !== feature)
        : [...items, feature],
    );

  const toggleStoreRole = (role) =>
    setStoreRoles((items) => {
      const next = items.includes(role)
        ? items.filter((item) => item !== role)
        : [...items, role];

      setActiveStoreRole((current) =>
        next.includes(current) ? current : next[0] || "",
      );

      return next;
    });

  const toggleStorePermission = (feature, action) =>
    setStoreRolePermissions((current) => {
      const selected = current[activeStoreRole]?.[feature] || [];

      const next = selected.includes(action)
        ? selected.filter((item) => item !== action)
        : [...selected, action];

      return {
        ...current,
        [activeStoreRole]: {
          ...current[activeStoreRole],
          [feature]: next,
        },
      };
    });

  const addDevice = () => {
    if (deviceLimit == null)
      return setError(
        "Device license limit is unavailable from the subscription.",
      );
    if (usedDevices >= deviceLimit) {
      return setError(
        "All device licenses in this plan are in use. Upgrade the merchant plan to add another device.",
      );
    }

    setDevices((items) => [
      ...items,
      {
        name: "",
        type: "",
        serial: "",
      },
    ]);
  };

  const changeDevice = (index, key, value) =>
    setDevices((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            [key]: value,
          }
          : item,
      ),
    );

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    for (let i = 0; i < STEPS.length; i++) {
      const err = validateStep(i);
      if (err) {
        setError(err);
        setStep(i);
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        ...store,
        merchantId: selectedMerchantId,
        currency: COUNTRY_SETTINGS[store.country].currency,
        type: inheritedTypeName,
        storeTypeId: inheritedTypeId,
        storeTypeCode: inheritedTypeCode,
        features: enabledFeatures.filter(
          (name) => FEATURES.includes(name) && featureAvailable(name),
        ),
        devices,
        roleIds: merchantRoles
          .map((role) =>
            typeof role === "object" ? (role.id ?? role.roleId) : null,
          )
          .filter((id) => id != null),
        storeRoles,
        storeRolePermissions,
      };
      // Merchant role definitions, permissions and subscription are managed on the merchant;
      // storeRoles/storeRolePermissions above are the store-level overlay on top of those.
      delete payload.roles;
      delete payload.rolePermissions;
      delete payload.subscription;
      delete payload.plan;
      if (editing) {
        await updateStore(storeId, payload);
      } else {
        // await createStore(
        //   payload,
        //   routeMerchantId || store.merchantId
        // );
      }

      backToStores();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `Unable to ${editing ? "update" : "create"} this store.`,
      );
    } finally {
      setSaving(false);
    }
  }

  function locationScreen() {
    return (
      <>
        <Panel title="Location identity">
          <div className="pch-grid">
            {editing || routeMerchantId ? (
              <Field
                label="Merchant"
                value={`${currentMerchant?.name || currentMerchant?.merchantName || (merchantLoading ? "Loading merchant…" : selectedMerchantId)}${currentMerchant?.id ? ` · ${currentMerchant.id}` : ""
                  }`}
                onChange={() => { }}
                readOnly
              />
            ) : (
              <Select
                label="Merchant"
                value={store.merchantId}
                onChange={(value) => {
                  change("merchantId", value);
                  setEnabledFeatures([]);
                  setStoreRoles([]);
                  setStoreRolePermissions({});
                  setStep(0);
                  setFurthest(0);
                }}
                options={[
                  {
                    value: "",
                    label: "Select a merchant",
                  },
                  ...merchants.map((item) => ({
                    value: merchantIdOf(item),
                    label: `${item.name || item.merchantName || "Merchant"} · ${merchantIdOf(item)}`,
                  })),
                ]}
              />
            )}

            {editing ? (
              <Field
                label="Store name"
                value={store.name}
                onChange={() => { }}
                readOnly
              />
            ) : (
              <Field
                label="Store name"
                value={store.name}
                onChange={(value) => change("name", value)}
                placeholder="Store name"
              />
            )}

            <Field
              label="Store type (from merchant)"
              value={
                inheritedTypeName ||
                (merchantLoading ? "Loading…" : "Not configured on merchant")
              }
              onChange={() => { }}
              readOnly
            />

            <Field
              label="Store ID"
              value={store.id}
              onChange={() => { }}
              readOnly
            />

            {editing ? (
              <Field
                label="Store Base URL"
                value={store.url}
                onChange={() => { }}
                readOnly
              />
            ) : (
              <Field
                label="Store Base URL"
                value={store.url}
                onChange={(value) => change("url", value)}
                placeholder="https://example.com"
              />
            )}

            <Field
              label="Store phone"
              value={store.phone}
              onChange={(value) => change("phone", value)}
              type="tel"
              inputMode="numeric"
            />
          </div>

          <div className="pch-note">
            Store type and subscription entitlements are inherited from the
            merchant and managed on the merchant profile. Store-level roles and
            permissions can still be configured here.
          </div>
        </Panel>

        <Panel title="Address & regional settings">
          <div className="pch-grid">
            <Field
              label="Address Line 1"
              value={store.addressLine1}
              onChange={(value) => change("addressLine1", value)}
              placeholder="Street number + street name"
            />

            <Field
              label="Address Line 2 (optional)"
              value={store.addressLine2}
              onChange={(value) => change("addressLine2", value)}
              placeholder="Apartment / Suite / Unit"
            />

            <Field
              label="City"
              value={store.city}
              onChange={(value) => change("city", value)}
            />

            <Field
              label="State / Province"
              value={store.state}
              onChange={(value) => change("state", value)}
              placeholder="Enter state or province"
            />

            <Field
              label={
                store.country === "United States"
                  ? "ZIP Code"
                  : "ZIP / Postal Code"
              }
              value={store.zip}
              onChange={(value) => change("zip", value)}
              placeholder={
                store.country === "United States"
                  ? "85001 or 85001-1234"
                  : undefined
              }
            />

            <Select
              label="Country"
              value={store.country}
              onChange={changeCountry}
              options={[
                { value: "", label: "Select country" },
                ...Object.keys(COUNTRY_SETTINGS).map((country) => ({
                  value: country,
                  label: country,
                })),
              ]}
            />
            <Select
              label="Time zone"
              value={store.timezone}
              onChange={(value) => change("timezone", value)}
              disabled={!countrySettings}
              options={[
                {
                  value: "",
                  label: countrySettings
                    ? "Select time zone"
                    : "Select country first",
                },
                ...(countrySettings?.zones || []).map((zone) => ({
                  value: zone,
                  label: zone.replaceAll("_", " "),
                })),
              ]}
            />
            <Field
              label="Currency (from country)"
              value={currencyDisplay}
              onChange={() => { }}
              placeholder="Select country first"
              readOnly
            />
            <Select
              label="Status"
              value={store.status}
              onChange={(value) => change("status", value)}
              options={[
                { value: "", label: "Select status" },
                "Active",
                "Inactive",
              ]}
            />
          </div>
        </Panel>

        <Panel title="Operating schedule">
          <div className="pch-tablewrap">
            <table>
              <thead>
                <tr>
                  <th>DAY</th>
                  <th>STATUS</th>
                  <th>OPENS</th>
                  <th>CLOSES</th>
                  <th>SHIFTS</th>
                </tr>
              </thead>

              <tbody>
                {store.hours.map((day, index) => (
                  <tr key={day.day}>
                    <td>{day.day}</td>

                    <td>
                      <select
                        value={day.status}
                        onChange={(e) =>
                          updateHours(index, "status", e.target.value)
                        }
                      >
                        <option value="">Select status</option>
                        <option>Open</option>
                        <option>Closed</option>
                        <option>24 hours</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="time"
                        disabled={day.status !== "Open"}
                        value={day.open}
                        onChange={(e) =>
                          updateHours(index, "open", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="time"
                        disabled={day.status !== "Open"}
                        value={day.close}
                        onChange={(e) =>
                          updateHours(index, "close", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        value={day.shifts}
                        onChange={(e) =>
                          updateHours(index, "shifts", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>
    );
  }

  function subscriptionScreen() {
    return (
      <>
        <Panel title="Merchant subscription">
          <div className="pch-grid">
            <div>
              <Detail
                label="Merchant"
                value={currentMerchant?.name || "Selected merchant"}
              />

              <Detail label="Current plan" value={planName} />

              <Detail
                label="Billing cycle"
                value={
                  subscription?.billingCycle ||
                  assignedPlan?.billingCycle ||
                  "Unavailable"
                }
              />
            </div>

            <div>
              <Detail
                label="Store licenses"
                value={`${enrolledStores} / ${displayLimit(storeLimit)} used`}
              />

              <Detail
                label="Remaining store licenses"
                value={displayLimit(remainingStores)}
              />

              <Detail
                label={editing ? "Editing store" : "New store"}
                value={store.name || "This store"}
              />
            </div>
          </div>

          <div className="pch-note">
            {editing
              ? "This store is already covered by the merchant’s existing license. The subscription and billing are unchanged."
              : "This store will use one of the merchant’s existing store licenses. The subscription and billing are unchanged."}
          </div>
        </Panel>

        <Panel title="Store enrollment">
          <div className="pch-tablewrap">
            <table>
              <thead>
                <tr>
                  <th>STORE ID</th>
                  <th>LOCATION</th>
                  <th>TYPE</th>
                  <th>LICENSE</th>
                </tr>
              </thead>

              <tbody>
                {merchantStores.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>
                      {item.licensed === true
                        ? "Licensed"
                        : item.licensed === false
                          ? "Not licensed"
                          : "Unavailable"}
                    </td>
                  </tr>
                ))}

                {!editing && (
                  <tr>
                    <td>{store.id || "New"}</td>
                    <td>{store.name || "New store"}</td>
                    <td>{inheritedTypeName}</td>
                    <td>
                      {remainingStores == null
                        ? "Limit unavailable"
                        : remainingStores > 0
                          ? "Will be licensed"
                          : "Upgrade required"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </>
    );
  }

  function devicesScreen() {
    return (
      <>
        <Panel title="Device license allocation">
          <div className="pch-grid">
            <div>
              <span className="pch-muted">Already assigned</span>

              <div className="pch-price">
                {usedDevices} / {displayLimit(deviceLimit)}
              </div>
            </div>

            <div>
              <span className="pch-muted">Remaining licenses</span>

              <div className="pch-price">{displayLimit(remainingDevices)}</div>
            </div>
          </div>

          <div className="pch-note">
            Assign devices to this store if needed. Each POS, KDS, printer, and
            scanner consumes one device license.
          </div>
        </Panel>

        {existingDevices.length > 0 && (
          <Panel title="Already enrolled devices">
            <div className="pch-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>TYPE</th>
                    <th>STORE</th>
                    <th>IDENTIFIER</th>
                  </tr>
                </thead>

                <tbody>
                  {existingDevices.map((device, index) => (
                    <tr key={device.id || index}>
                      <td>{device.name || device.deviceName || "Device"}</td>

                      <td>{device.type || device.deviceType || "—"}</td>

                      <td>{device.storeName || device.store || "—"}</td>

                      <td>{device.serial || device.identifier || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <Panel title="Devices for this store">
          <div className="pch-tablewrap">
            <table>
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>TYPE</th>
                  <th>STORE</th>
                  <th>IDENTIFIER</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {devices.map((device, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        value={device.name}
                        onChange={(e) =>
                          changeDevice(index, "name", e.target.value)
                        }
                        placeholder="POS 01"
                      />
                    </td>

                    <td>
                      <select
                        value={device.type}
                        onChange={(e) =>
                          changeDevice(index, "type", e.target.value)
                        }
                      >
                        <option value="">Select type</option>
                        {DEVICE_TYPES.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </td>

                    <td>{store.name || "New store"}</td>

                    <td>
                      <input
                        value={device.serial}
                        onChange={(e) =>
                          changeDevice(index, "serial", e.target.value)
                        }
                        placeholder="POS-001"
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          setDevices((items) =>
                            items.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" onClick={addDevice}>
            + Assign device to this store
          </button>

          {deviceLimit != null && usedDevices >= deviceLimit && (
            <div className="pch-note">
              To add more devices, upgrade the merchant plan.
            </div>
          )}
        </Panel>
      </>
    );
  }

  function featuresScreen() {
    return (
      <>
        <Panel title="Effective feature resolution">
          {!FEATURES.length && (
            <p className="pch-note">
              No active features returned for this store type.
            </p>
          )}
          <div className="pch-tablewrap">
            <table>
              <thead>
                <tr>
                  <th>FEATURE</th>
                  <th>TYPE RELEVANCE</th>
                  <th>PLAN ENTITLEMENT</th>
                  <th>STORE SETTING</th>
                  <th>EFFECTIVE</th>
                </tr>
              </thead>

              <tbody>
                {FEATURES.map((feature) => {
                  const available = featureAvailable(feature);
                  const enabled =
                    enabledFeatures.includes(feature) && available;

                  return (
                    <tr key={feature}>
                      <td>{feature}</td>

                      <td>Relevant</td>

                      <td>{available ? "Included" : "Not entitled"}</td>

                      <td>
                        <input
                          type="checkbox"
                          checked={enabled}
                          disabled={!available}
                          onChange={() => toggleFeature(feature)}
                        />
                      </td>

                      <td>
                        {enabled
                          ? "Enabled"
                          : available
                            ? "Disabled"
                            : "Not entitled"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="pch-note">
          Store relevance, subscription entitlement, and store settings are
          separate access gates.
        </div>
      </>
    );
  }

  function rolesScreen() {
    const selectedStoreRole = activeStoreRole || storeRoles[0] || "";

    return (
      <>
        <Panel title="Roles inherited from merchant">
          <p className="pch-note">
            These roles and their permissions are managed on the merchant
            profile.
          </p>
          {merchantRoles.length ? (
            <div className="pch-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>ROLE</th>
                    <th>SCOPE</th>
                  </tr>
                </thead>
                <tbody>
                  {merchantRoles.map((role, index) => (
                    <tr
                      key={
                        typeof role === "object"
                          ? (role.id ?? role.roleId ?? index)
                          : role
                      }
                    >
                      <td>
                        {typeof role === "string"
                          ? role
                          : role.name ||
                          role.roleName ||
                          role.templateName ||
                          "Unnamed role"}
                      </td>
                      <td>
                        {typeof role === "object"
                          ? role.scope || role.roleScope || "—"
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="pch-note">
              No merchant roles were returned. Configure roles on the merchant
              profile.
            </p>
          )}
        </Panel>

        <Panel title="Create store-level roles from templates">
          <div className="pch-grid">
            {ROLE_TEMPLATES.map((role) => (
              <label className="pch-check pch-role-option" key={role}>
                <input
                  type="checkbox"
                  checked={storeRoles.includes(role)}
                  onChange={() => toggleStoreRole(role)}
                />
                {role}
              </label>
            ))}
          </div>

          <div className="pch-row pch-between">
            <span className="pch-pill">{storeRoles.length} store roles</span>

            <button
              type="button"
              onClick={() => {
                setCustomRoleOpen(true);
                setError("");
              }}
            >
              + Custom store role
            </button>
          </div>

          {customRoleOpen && (
            <div
              className="pch-custom-role-form"
              style={{
                marginTop: "16px",
                padding: "16px",
                border: "1px solid #ddd8ff",
                borderRadius: "8px",
                background: "#f8f7ff",
              }}
            >
              <div className="pch-grid">
                <Field
                  label="Role name"
                  value={customRoleName}
                  onChange={setCustomRoleName}
                  placeholder="Enter role name"
                />

                <Select
                  label="Role scope"
                  value={customRoleScope}
                  onChange={setCustomRoleScope}
                  options={["Store"]}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                <button
                  type="button"
                  className="pch-primary"
                  onClick={() => {
                    const trimmedName = customRoleName.trim();

                    if (!trimmedName) {
                      setError("Role name is required.");
                      return;
                    }

                    const roleExists = storeRoles.some(
                      (role) =>
                        String(role).trim().toLowerCase() ===
                        trimmedName.toLowerCase(),
                    );

                    if (roleExists) {
                      setError("A role with this name already exists.");
                      return;
                    }

                    setStoreRoles((items) => [...items, trimmedName]);
                    setActiveStoreRole(trimmedName);
                    setCustomRoleName("");
                    setCustomRoleScope("Store");
                    setCustomRoleOpen(false);
                    setError("");
                  }}
                >
                  Add role
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomRoleName("");
                    setCustomRoleScope("Store");
                    setCustomRoleOpen(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Panel>

        {storeRoles.length > 0 && (
          <Panel title="Configure store role permissions">
            <div className="pch-grid">
              <Select
                label="Store role"
                value={selectedStoreRole}
                onChange={setActiveStoreRole}
                options={storeRoles}
              />

              <Field
                label="Store context"
                value={`${store.id || "New"} · ${store.name || "New store"}`}
                onChange={() => { }}
                readOnly
              />
            </div>

            <div className="pch-note">
              Owner: {currentMerchant?.name || "Merchant"} · Source:{" "}
              {selectedStoreRole} · Scope: Store
            </div>

            {!FEATURES.length ? (
              <p className="pch-note">
                No active features are available for this store type yet.
              </p>
            ) : (
              <div className="pch-tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>FEATURE</th>
                      <th>DEFINED PERMISSIONS</th>
                      <th>STORE ACCESS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {FEATURES.map((feature) => {
                      const available =
                        enabledFeatures.includes(feature) &&
                        featureAvailable(feature);

                      const actions = actionsForFeature(feature);

                      const selected =
                        storeRolePermissions[selectedStoreRole]?.[feature] ||
                        [];

                      return (
                        <tr key={feature}>
                          <td>{feature}</td>

                          <td>
                            <div className="pch-row">
                              {actions.length ? (
                                actions.map((action) => (
                                  <label className="pch-check" key={action}>
                                    <input
                                      type="checkbox"
                                      checked={selected.includes(action)}
                                      disabled={!available}
                                      onChange={() =>
                                        toggleStorePermission(feature, action)
                                      }
                                    />
                                    {action}
                                  </label>
                                ))
                              ) : (
                                <span className="pch-muted">
                                  No actions defined
                                </span>
                              )}
                            </div>
                          </td>

                          <td>{available ? "Available" : "Not entitled"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}
      </>
    );
  }

  function reviewScreen() {
    return (
      <>
        <Panel title="Merchant subscription & licensing">
          <div className="pch-grid">
            <div>
              <Detail label="Merchant" value={currentMerchant?.name} />

              <Detail label="Plan" value={planName} />

              <Detail
                label="Store licenses after provision"
                value={`${enrolledStores + (editing ? 0 : 1)} / ${displayLimit(storeLimit)}`}
              />
            </div>

            <div>
              <Detail
                label="Assigned devices"
                value={`${usedDevices} / ${displayLimit(deviceLimit)}`}
              />

              <Detail label="Enabled features" value={enabledFeatures.length} />

              <Detail label="Merchant roles" value={roles.length} />

              <Detail label="Store-level roles" value={storeRoles.length} />
            </div>
          </div>
        </Panel>

        <Panel title="Store location">
          <div className="pch-grid">
            <div>
              <Detail label="Store" value={store.name} />

              <Detail label="Store ID" value={store.id} />

              <Detail label="Type" value={inheritedTypeName} />
            </div>

            <div>
              <Detail
                label="Address"
                value={[
                  store.addressLine1,
                  store.addressLine2,
                  store.city,
                  store.state,
                  store.zip,
                  store.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />

              <Detail label="Time zone" value={store.timezone} />

              <Detail label="Currency" value={currencyDisplay} />

              <Detail label="Status" value={store.status} />
            </div>
          </div>
        </Panel>

        <Panel title="Devices">
          <div className="pch-tablewrap">
            <table>
              <thead>
                <tr>
                  <th>DEVICE</th>
                  <th>TYPE</th>
                  <th>IDENTIFIER</th>
                </tr>
              </thead>

              <tbody>
                {devices.length ? (
                  devices.map((device, index) => (
                    <tr key={index}>
                      <td>{device.name || "Unnamed device"}</td>

                      <td>{device.type}</td>

                      <td>{device.serial || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No devices assigned to this store.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="pch-note">
          Provisioning creates the store and saves the selected setup in this
          workflow.
        </div>
      </>
    );
  }

  const screens = [
    locationScreen,
    subscriptionScreen,
    devicesScreen,
    featuresScreen,
    rolesScreen,
    reviewScreen,
  ];

  if (loading) {
    return <div className="page-content">Loading store setup…</div>;
  }

  return (
    <div id="pch-new">
      <header className="pch-store-header">
        <button type="button" className="pch-store-back" onClick={backToStores}>
          <i className="bi bi-arrow-left" />
          <span>Stores</span>
        </button>

        <span className="pch-store-breadcrumb-separator">/</span>

        <span className="pch-muted pch-small">
          {editing ? "Edit store" : "Add store"}
        </span>
      </header>

      <div className="pch-layout">
        <aside>
          <div className="pch-eyebrow pch-aside-note">
            {editing ? "Edit a store" : "Provision a store"}
          </div>

          <nav className="pch-rail" aria-label="Store provisioning journey">
            {STEPS.map(([name, description], index) => (
              <button
                type="button"
                key={name}
                disabled={saving || index > furthest}
                onClick={() => goTo(index)}
                className={index === step ? "pch-current" : ""}
              >
                <span className="pch-number">
                  {index < step ? "✓" : index + 1}
                </span>

                <span>
                  {name}

                  <small className="pch-muted pch-rail-description">
                    {description}
                  </small>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main>
          <div className="pch-eyebrow">
            Step {step + 1} of {STEPS.length}
          </div>

          <h1>{STEPS[step][0]}</h1>

          <p className="pch-muted">{STEPS[step][1]}</p>

          <form onSubmit={submit}>
            <fieldset className="pch-form-content" disabled={saving}>
              {screens[step]()}

              {(mastersLoading || typeData.loading) && (
                <div className="pch-note" role="status">
                  Loading store master data…
                </div>
              )}
              {(mastersError || typeData.error) && (
                <div className="pch-error" role="alert">
                  {mastersError || typeData.error}
                </div>
              )}
              {merchantLoading && (
                <div className="pch-note" role="status">
                  Loading merchant details…
                </div>
              )}

              {merchantError && (
                <div className="pch-error" role="alert">
                  {merchantError}
                </div>
              )}

              {error && (
                <div className="pch-error" role="alert">
                  {error}
                </div>
              )}

              <div className="pch-footerbar">
                <button
                  type="button"
                  onClick={() => (step === 0 ? backToStores() : goTo(step - 1))}
                >
                  {step === 0 ? "Cancel" : "← Back"}
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    className="pch-primary"
                    type="button"
                    onClick={
                      step === STEPS.length - 2
                        ? goToReview
                        : () => goTo(step + 1)
                    }
                  >
                    Continue →
                  </button>
                ) : (
                  <button className="pch-primary" type="submit">
                    {saving
                      ? "Saving…"
                      : editing
                        ? "Save changes"
                        : "Provision store"}
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </main>
      </div>

      {deleteTarget && (
        <div
          className="pch-delete-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pch-delete-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="pch-delete-modal">
            <div className="pch-delete-icon" aria-hidden="true">
              🗑
            </div>
            <h2 id="pch-delete-title">Delete Store?</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>
                {deleteTarget?.name || deleteTarget?.storeName || "this store"}
              </strong>
              ?
            </p>
            <p className="pch-delete-warning">This action cannot be undone.</p>
            <div className="pch-delete-actions">
              <button type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="pch-delete-confirm"
                onClick={() => {
                  setDeleteTarget(null);
                }}
              >
                Delete Store
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        Merchant store provisioning · Existing subscription licenses are
        retained
      </footer>
    </div>
  );
}
