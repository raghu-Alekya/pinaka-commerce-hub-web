import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMerchant, listMerchants } from "../api/merchants";
import { createStore, getStore, updateStore } from "../api/stores";
import { allocateId } from "../api/ids";
import { ApiError } from "../api/http";
import "../styles/merchant-form.css";

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
  ["Merchant roles", "Templates & permissions"],
  ["Review & provision", "Connected records"],
];

const TYPES = [
  "C-Store",
  "G-Store",
];

const FEATURES = [
  "Fastkeys",
  "Refunds",
  "Safe Drop",
  "Loyalty",
  "Delivery",
  "Weighing Scale",
  "Payroll",
  "KDS",
  "Service Charges",
];

const ROLE_TEMPLATES = [
  "Store Manager",
  "Shift Manager",
  "Cashier",
  "Inventory Clerk",
  "Receiving Clerk",
];

const FEATURE_ACTIONS = {
  Fastkeys: ["View", "Use"],
  Refunds: ["View", "Create", "Approve", "Override"],
  "Safe Drop": ["View", "Create"],
  Loyalty: ["View", "Enroll", "Redeem"],
  Delivery: ["View", "Manage"],
  "Weighing Scale": ["Use"],
  Payroll: ["View", "Manage"],
  KDS: ["View", "Manage"],
  "Service Charges": ["View", "Configure"],
};

const DEFAULT_ACTIONS = {
  Fastkeys: ["View", "Use"],
  Refunds: ["View", "Create"],
  "Safe Drop": ["View", "Create"],
  Loyalty: ["View", "Enroll", "Redeem"],
  Delivery: ["View"],
  "Weighing Scale": ["Use"],
};

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
  type: "Grocery",
  phone: "",
  url: "",
  currency: "USD",
  status: "Active",
  address: "",
  city: "",
  state: "",
  zip: "",
  timezone: "America/Phoenix",
  hours: emptyHours(),
});

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  ...props
}) => (
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

const Select = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
}) => (
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
        )
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
    <span>{value || "—"}</span>
  </div>
);

export default function AddStore() {
  const nav = useNavigate();
  const { merchantId: routeMerchantId, storeId } = useParams();
  const editing = Boolean(storeId);

  const [store, setStore] = useState(() =>
    initialStore(routeMerchantId)
  );
  const [merchant, setMerchant] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [merchantStores, setMerchantStores] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [devices, setDevices] = useState([]);
  const [enabledFeatures, setEnabledFeatures] = useState(
    FEATURES.slice(0, 6)
  );
  const [roles, setRoles] = useState([]);
  const [activeRole, setActiveRole] = useState("");
  const [rolePermissions, setRolePermissions] = useState({});
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
        if (routeMerchantId) {
          const result = await getMerchant(routeMerchantId);

          if (!cancelled) {
            setMerchant(result.merchant);
            setMerchantStores(result.stores || []);
            setSubscription(result.subscription);
          }
        } else {
          const rows = await listMerchants();

          if (!cancelled) {
            setMerchants(rows);
          }
        }

        if (storeId) {
          const saved = await getStore(storeId);

          if (!cancelled) {
            setStore({
              ...initialStore(routeMerchantId || saved.merchant),
              ...saved,
              name: saved.storeName || saved.name || "",
              type: saved.storeType || saved.type || "Grocery",
              id: saved.storeID || saved.id || "",
              merchantId: routeMerchantId || saved.merchant,
              hours: saved.hours || emptyHours(),
            });
            setDevices(Array.isArray(saved.devices) ? saved.devices.map(d => ({
              ...d,
              name: d.name || d.deviceName || "",
              type: d.type || d.deviceType || "POS",
              serial: d.serial || d.identifier || ""
            })) : []);
            if (Array.isArray(saved.features) && saved.features.length) {
              setEnabledFeatures(saved.features.map((feature) => typeof feature === "string" ? feature : feature.name || feature.featureName).filter(Boolean));
            }
            if (Array.isArray(saved.roles)) {
              const savedRoles = saved.roles.map((role) => typeof role === "string" ? role : role.name || role.roleName).filter(Boolean);
              setRoles(savedRoles);
              setActiveRole(savedRoles[0] || "");
            }
            setFurthest(STEPS.length - 1);
          }
        } else {
          const id = await allocateId("store");

          if (!cancelled) {
            setStore((current) => ({
              ...current,
              id,
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load the store setup."
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

  const currentMerchant = useMemo(
    () =>
      merchant ||
      merchants.find(
        (item) => String(item.id) === String(store.merchantId)
      ),
    [merchant, merchants, store.merchantId]
  );

  const planName =
    subscription?.planName ||
    subscription?.planCode ||
    currentMerchant?.plan ||
    "Current plan";

  const storeLimit = Number(
    subscription?.storeLimit ||
      subscription?.stores ||
      subscription?.maxStores ||
      subscription?.locationLimit ||
      5
  );

  const deviceLimit = Number(
    subscription?.deviceLimit ||
      subscription?.devices ||
      subscription?.maxDevices ||
      15
  );

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
      0
  );

  const usedDevices = enrolledDeviceCount + (editing ? 0 : devices.length);

  const remainingStores = Math.max(
    0,
    storeLimit - enrolledStores
  );

  const remainingDevices = Math.max(
    0,
    deviceLimit - usedDevices
  );

  const change = (key, value) => {
    setError("");

    setStore((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const backToStores = () =>
    nav(
      routeMerchantId
        ? `/merchants/${routeMerchantId}/stores`
        : "/stores"
    );

  const updateHours = (index, key, value) =>
    change(
      "hours",
      store.hours.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );

  const validateStep = (currentStep) => {
    if (currentStep === 0) {
      if (!store.merchantId && !routeMerchantId) return "Please select a merchant.";
      if (!store.name || !String(store.name).trim()) return "Store name is required.";
      if (!store.url || !String(store.url).trim()) return "Store Base URL is required.";
      try {
        new URL(store.url);
      } catch {
        return "Please enter a valid URL.";
      }
      if (!store.phone || !String(store.phone).trim()) return "Store phone is required.";
      if (!store.city || !String(store.city).trim()) return "City is required.";
      if (!store.state || !String(store.state).trim()) return "State is required.";
      if (!store.address || !String(store.address).trim()) return "Address is required.";
      if (!store.zip || !String(store.zip).trim()) return "ZIP code is required.";
    } else if (currentStep === 2) {
      for (let d of devices) {
        if (!d.name || !String(d.name).trim()) return "Device name is required for all devices.";
        if (!d.serial || !String(d.serial).trim()) return "Device identifier is required for all devices.";
      }
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
        : [...items, feature]
    );

  const toggleRole = (role) =>
    setRoles((items) => {
      const next = items.includes(role)
        ? items.filter((item) => item !== role)
        : [...items, role];

      setActiveRole((current) =>
        next.includes(current) ? current : next[0] || ""
      );

      return next;
    });

  const togglePermission = (feature, action) =>
    setRolePermissions((current) => {
      const selected =
        current[activeRole]?.[feature] ||
        DEFAULT_ACTIONS[feature] ||
        [];

      const next = selected.includes(action)
        ? selected.filter((item) => item !== action)
        : [...selected, action];

      return {
        ...current,
        [activeRole]: {
          ...current[activeRole],
          [feature]: next,
        },
      };
    });

  const addDevice = () => {
    if (devices.length >= deviceLimit) {
      return setError(
        "All device licenses in this plan are in use. Upgrade the merchant plan to add another device."
      );
    }

    setDevices((items) => [
      ...items,
      {
        name: "",
        type: "POS",
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
          : item
      )
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
      if (editing) {
        await updateStore(storeId, store);
      } else {
        await createStore(
          store,
          routeMerchantId || store.merchantId
        );
      }

      backToStores();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `Unable to ${
              editing ? "update" : "create"
            } this store.`
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
            {editing ? (
              <Field
                label="Merchant"
                value={`${currentMerchant?.name || routeMerchantId || store.merchantId}${
                  currentMerchant?.id ? ` · ${currentMerchant.id}` : ""
                }`}
                onChange={() => {}}
                readOnly
              />
            ) : (
              <Select
                label="Merchant"
                value={store.merchantId}
                onChange={(value) =>
                  change("merchantId", value)
                }
                options={[
                  {
                    value: "",
                    label: "Select a merchant",
                  },
                  ...merchants.map((item) => ({
                    value: item.id,
                    label: `${item.name} · ${item.id}`,
                  })),
                ]}
              />
            )}

            {editing ? (
              <Field
                label="Store name"
                value={store.name}
                onChange={() => {}}
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

            {editing ? (
              <Field
                label="Store Type Master"
                value={store.type}
                onChange={() => {}}
                readOnly
              />
            ) : (
              <Select
                label="Store Type Master"
                value={store.type}
                onChange={(value) => change("type", value)}
                options={TYPES}
              />
            )}

            <Field
              label="Store ID"
              value={store.id}
              onChange={() => {}}
              readOnly
            />

            {editing ? (
              <Field
                label="Store Base URL"
                value={store.url}
                onChange={() => {}}
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
            {store.type} supplies the relevant feature and role
            templates. It does not change the merchant’s existing
            plan.
          </div>
        </Panel>

        <Panel title="Address & regional settings">
          <div className="pch-grid">
            <Field
              label="City"
              value={store.city}
              onChange={(value) => change("city", value)}
            />

            <Field
              label="State / Province"
              value={store.state}
              onChange={(value) => change("state", value)}
            />

            <Field
              label="Address"
              value={store.address}
              onChange={(value) => change("address", value)}
            />

            <Field
              label="ZIP / Postal code"
              value={store.zip}
              onChange={(value) => change("zip", value)}
            />

            <Select
              label="Time zone"
              value={store.timezone}
              onChange={(value) =>
                change("timezone", value)
              }
              options={[
                "America/Phoenix",
                "America/New_York",
                "America/Chicago",
                "America/Los_Angeles",
                "Asia/Kolkata",
                "Europe/London",
              ]}
            />

            <Select
              label="Currency"
              value={store.currency}
              onChange={(value) =>
                change("currency", value)
              }
              options={["USD", "INR", "CAD", "GBP", "AUD"]}
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
                          updateHours(
                            index,
                            "status",
                            e.target.value
                          )
                        }
                      >
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
                          updateHours(
                            index,
                            "open",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="time"
                        disabled={day.status !== "Open"}
                        value={day.close}
                        onChange={(e) =>
                          updateHours(
                            index,
                            "close",
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        value={day.shifts}
                        onChange={(e) =>
                          updateHours(
                            index,
                            "shifts",
                            e.target.value
                          )
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
                value={
                  currentMerchant?.name ||
                  "Selected merchant"
                }
              />

              <Detail
                label="Current plan"
                value={planName}
              />

              <Detail
                label="Billing cycle"
                value={
                  subscription?.billingCycle || "Monthly"
                }
              />
            </div>

            <div>
              <Detail
                label="Store licenses"
                value={`${enrolledStores} / ${storeLimit} used`}
              />

              <Detail
                label="Remaining store licenses"
                value={remainingStores}
              />

              <Detail
                label={editing ? "Editing store" : "New store"}
                value={store.name || "This store"}
              />
            </div>
          </div>

          <div className="pch-note">
            {editing ? "This store is already covered by the merchant’s existing license. The subscription and billing are unchanged." : "This store will use one of the merchant’s existing store licenses. The subscription and billing are unchanged."}
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
                    <td>Licensed</td>
                  </tr>
                ))}

                {!editing && <tr>
                  <td>{store.id || "New"}</td>
                  <td>{store.name || "New store"}</td>
                  <td>{store.type}</td>
                  <td>{remainingStores ? "Will be licensed" : "Upgrade required"}</td>
                </tr>}
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
              <span className="pch-muted">
                Already assigned
              </span>

              <div className="pch-price">
                {usedDevices} / {deviceLimit}
              </div>
            </div>

            <div>
              <span className="pch-muted">
                Remaining licenses
              </span>

              <div className="pch-price">
                {remainingDevices}
              </div>
            </div>
          </div>

          <div className="pch-note">
            Assign devices to this store if needed. Each POS,
            KDS, printer, and scanner consumes one device
            license.
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
                      <td>
                        {device.name ||
                          device.deviceName ||
                          "Device"}
                      </td>

                      <td>
                        {device.type ||
                          device.deviceType ||
                          "—"}
                      </td>

                      <td>
                        {device.storeName ||
                          device.store ||
                          "—"}
                      </td>

                      <td>
                        {device.serial ||
                          device.identifier ||
                          "—"}
                      </td>
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
                          changeDevice(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="POS 01"
                      />
                    </td>

                    <td>
                      <select
                        value={device.type}
                        onChange={(e) =>
                          changeDevice(
                            index,
                            "type",
                            e.target.value
                          )
                        }
                      >
                        <option>POS</option>
                        <option>KDS</option>
                        <option>Printer</option>
                        <option>Scanner</option>
                      </select>
                    </td>

                    <td>
                      {store.name || "New store"}
                    </td>

                    <td>
                      <input
                        value={device.serial}
                        onChange={(e) =>
                          changeDevice(
                            index,
                            "serial",
                            e.target.value
                          )
                        }
                        placeholder="POS-001"
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          setDevices((items) =>
                            items.filter(
                              (_, itemIndex) =>
                                itemIndex !== index
                            )
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

          {usedDevices >= deviceLimit && (
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
                {FEATURES.map((feature, index) => {
                  const available = index < 7;
                  const enabled =
                    enabledFeatures.includes(feature) &&
                    available;

                  return (
                    <tr key={feature}>
                      <td>{feature}</td>

                      <td>
                        {index === 7 || index === 8
                          ? "Not relevant"
                          : "Relevant"}
                      </td>

                      <td>
                        {index === 6
                          ? "Excluded"
                          : "Included"}
                      </td>

                      <td>
                        <input
                          type="checkbox"
                          checked={enabled}
                          disabled={!available}
                          onChange={() =>
                            toggleFeature(feature)
                          }
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
          Store relevance, subscription entitlement, and store
          settings are separate access gates.
        </div>
      </>
    );
  }

  function rolesScreen() {
    const selectedRole = activeRole || roles[0] || "";

    return (
      <>
        <Panel title="Create merchant roles from templates">
          <div className="pch-grid">
            {ROLE_TEMPLATES.map((role) => (
              <label
                className="pch-check pch-role-option"
                key={role}
              >
                <input
                  type="checkbox"
                  checked={roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </div>

          <div className="pch-row pch-between">
            <span className="pch-pill">
              {roles.length} merchant roles
            </span>

            <button
              type="button"
              onClick={() => {
                setCustomRoleOpen(true);
                setError("");
              }}
            >
              + Custom merchant role
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

                    const roleExists = roles.some(
                      (role) =>
                        String(role).trim().toLowerCase() ===
                        trimmedName.toLowerCase()
                    );

                    if (roleExists) {
                      setError("A role with this name already exists.");
                      return;
                    }

                    setRoles((items) => [...items, trimmedName]);
                    setActiveRole(trimmedName);
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

        {roles.length > 0 && (
          <Panel title="Configure permissions">
            <div className="pch-grid">
              <Select
                label="Actual merchant role"
                value={selectedRole}
                onChange={setActiveRole}
                options={roles}
              />

              <Field
                label="Store context"
                value={`${store.id || "New"} · ${
                  store.name || "New store"
                }`}
                onChange={() => {}}
                readOnly
              />
            </div>

            <div className="pch-note">
              Owner: {currentMerchant?.name || "Merchant"} ·
              Source: {selectedRole} · Scope: Store
            </div>

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
                      enabledFeatures.includes(feature);

                    const selected =
                      rolePermissions[selectedRole]?.[
                        feature
                      ] ||
                      DEFAULT_ACTIONS[feature] ||
                      [];

                    return (
                      <tr key={feature}>
                        <td>{feature}</td>

                        <td>
                          <div className="pch-row">
                            {FEATURE_ACTIONS[feature].map(
                              (action) => (
                                <label
                                  className="pch-check"
                                  key={action}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(
                                      action
                                    )}
                                    disabled={!available}
                                    onChange={() =>
                                      togglePermission(
                                        feature,
                                        action
                                      )
                                    }
                                  />
                                  {action}
                                </label>
                              )
                            )}
                          </div>
                        </td>

                        <td>
                          {available
                            ? "Available"
                            : feature === "Payroll"
                            ? "Not entitled"
                            : "Not relevant"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
              <Detail
                label="Merchant"
                value={currentMerchant?.name}
              />

              <Detail
                label="Plan"
                value={planName}
              />

              <Detail
                label="Store licenses after provision"
                value={`${enrolledStores + (editing ? 0 : 1)} / ${storeLimit}`}
              />
            </div>

            <div>
              <Detail
                label="Assigned devices"
                value={`${usedDevices} / ${deviceLimit}`}
              />

              <Detail
                label="Enabled features"
                value={enabledFeatures.length}
              />

              <Detail
                label="Merchant roles"
                value={roles.length}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Store location">
          <div className="pch-grid">
            <div>
              <Detail
                label="Store"
                value={store.name}
              />

              <Detail
                label="Store ID"
                value={store.id}
              />

              <Detail
                label="Type"
                value={store.type}
              />
            </div>

            <div>
              <Detail
                label="Address"
                value={[
                  store.address,
                  store.city,
                  store.state,
                  store.zip,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />

              <Detail
                label="Time zone"
                value={store.timezone}
              />

              <Detail
                label="Status"
                value={store.status}
              />
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
                      <td>
                        {device.name || "Unnamed device"}
                      </td>

                      <td>{device.type}</td>

                      <td>{device.serial || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">
                      No devices assigned to this store.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="pch-note">
          Provisioning creates the store and saves the selected
          setup in this workflow.
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
    return (
      <div className="page-content">
        Loading store setup…
      </div>
    );
  }

  return (
    <div id="pch-new">
      <header className="pch-store-header">
        <button
          type="button"
          className="pch-store-back"
          onClick={backToStores}
        >
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

          <nav
            className="pch-rail"
            aria-label="Store provisioning journey"
          >
            {STEPS.map(([name, description], index) => (
              <button
                type="button"
                key={name}
                disabled={saving || index > furthest}
                onClick={() => goTo(index)}
                className={
                  index === step ? "pch-current" : ""
                }
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

          <p className="pch-muted">
            {STEPS[step][1]}
          </p>

          <form onSubmit={submit}>
            <fieldset
              className="pch-form-content"
              disabled={saving}
            >
              {screens[step]()}

              {error && (
                <div className="pch-error" role="alert">
                  {error}
                </div>
              )}

              <div className="pch-footerbar">
                <button
                  type="button"
                  onClick={() =>
                    step === 0
                      ? backToStores()
                      : goTo(step - 1)
                  }
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
                  <button
                    className="pch-primary"
                    type="submit"
                  >
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
            <div className="pch-delete-icon" aria-hidden="true">🗑</div>
            <h2 id="pch-delete-title">Delete Store?</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>
                {deleteTarget?.name || deleteTarget?.storeName || "this store"}
              </strong>
              ?
            </p>
            <p className="pch-delete-warning">
              This action cannot be undone.
            </p>
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
        Merchant store provisioning · Existing subscription
        licenses are retained
      </footer>
    </div>
  );
}
