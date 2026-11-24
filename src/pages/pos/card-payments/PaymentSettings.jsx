import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/http";
import { devicesApi } from "../../../api/devices";
import { getStoreDeviceMappings } from "../../../api/storeDeviceMappings";
import { ConfigHeader, ConfigSwitch, SettingInput, useConfigState, usePosSettings, useSaveAction } from "../shared";
import { getPosCardPaymentConfiguration, savePosCardPaymentSettings } from "./api";

const PROVIDERS = ["Kickback", "Payroc"];
const EMPTY_CARD_URLS = {
  uatIdentity: "",
  uatApi: "",
  productionIdentity: "",
  productionApi: "",
};
const blankProvider = (provider) => ({
  provider,
  enabled: false,
  isDefault: false,
  deviceId: "",
  deviceMappings: [],
  processorMerchantId: "",
  terminalId: "",
  secretKey: "",
  webhookUrl: "",
  payrocEnvironment: "",
  terminalUrls: { ...EMPTY_CARD_URLS },
});
const DEFAULT_PAYMENTS = PROVIDERS.map(blankProvider);

function normalizePayments(records = []) {
  const byProvider = new Map(records.map((record) => [record.provider, record]));
  const providerNames = [...new Set([...PROVIDERS, ...records.map((record) => record?.provider).filter(Boolean)])];
  const activeProvider = records.find((record) => record.enabled === true || record.enabled === "true")?.provider || "";
  const defaultProvider = records.find((record) => record.isDefault === true || record.isDefault === "true" || record.is_default === true)?.provider || "";
  return providerNames.map((provider) => {
    const record = byProvider.get(provider);
    if (!record) return blankProvider(provider);
    return {
      ...blankProvider(provider),
      ...record,
      payrocEnvironment: record.payrocEnvironment === "production" || record.payrocEnvironment === "uat" ? record.payrocEnvironment : "",
      terminalUrls: { ...EMPTY_CARD_URLS, ...record.payrocUrls, ...record.terminalUrls },
      enabled: provider === activeProvider,
      isDefault: provider === defaultProvider,
      processorMerchantId: record.processorMerchantId || record.merchantId || "",
      deviceMappings: Array.isArray(record.deviceMappings || record.device_mappings)
        ? (record.deviceMappings || record.device_mappings).map((mapping) => ({
          storeDeviceId: String(mapping.storeDeviceId || mapping.store_device_id || ""),
          cardTerminalDeviceId: mapping.cardTerminalDeviceId || mapping.card_terminal_device_id || mapping.deviceId || mapping.device_id || "",
          deviceCode: mapping.deviceCode || mapping.device_code || "",
          storeDeviceActivationKey: mapping.storeDeviceActivationKey || mapping.store_device_activation_key || mapping.activationKey || mapping.activation_key || mapping.device_active_code || "",
          storeDeviceName: mapping.storeDeviceName || mapping.store_device_name || "",
        }))
        : (record.deviceIds || record.device_ids || []).map((id) => ({ storeDeviceId: String(id), cardTerminalDeviceId: "", deviceCode: "" })),
    };
  });
}

export function PaymentSettings() {
  const settings = usePosSettings();
  const [payments, setPayments] = useConfigState("payments", DEFAULT_PAYMENTS);
  const editedProviders = useRef(new Set());
  const [storeDevices, setStoreDevices] = useState([]);
  const [openProvider, setOpenProvider] = useState(PROVIDERS[0]);

  useEffect(() => {
    if (!settings.storeId) return undefined;
    let active = true;
    getPosCardPaymentConfiguration(settings.storeId)
      .then((configuration) => {
        if (!active) return;
        const records = configuration.cardPayments || (configuration.provider ? [configuration] : []);
        const normalized = normalizePayments(records);
        editedProviders.current.clear();
        setPayments(normalized);
        setOpenProvider(
          normalized.find((payment) => payment.isDefault)?.provider
            || normalized.find((payment) => payment.enabled)?.provider
            || normalized.find((payment) => Object.values(payment.terminalUrls).some(Boolean))?.provider
            || PROVIDERS[0],
        );
        settings.session.baseline = { ...settings.session.draft };
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) return;
        if (active) alert(error?.message || "Unable to load card payment settings.");
      });
    return () => { active = false; };
  }, [settings.storeId]);

  useEffect(() => {
    if (!settings.storeId || !settings.merchantId) return undefined;
    let active = true;
    const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || "";
    Promise.all([getStoreDeviceMappings(settings.storeId), devicesApi.listByMerchantId(settings.merchantId)])
      .then(async ([mappings, devices]) => {
        if (!active) return;
        const byId = new Map(devices.map((device) => [String(device.id), device]));
        const previouslyHydrated = Array.isArray(settings.session.draft.deviceMappings) ? settings.session.draft.deviceMappings : [];
        const hydrated = await Promise.all(mappings.map(async (mapping) => {
          const id = mapping.deviceId || mapping.device_id || mapping.device?.id || mapping.device?.device_id;
          const prior = previouslyHydrated.find((item) => String(item.deviceId || item.device_id) === String(id)) || {};
          let device = byId.get(String(id)) || mapping.device || prior;
          const hasDetails = device && (device.code || device.deviceCode || device.device_code || device.activationKey || device.device_active_code || device.authorization_code);
          if (!hasDetails && id) {
            try { device = { ...device, ...(await devicesApi.get(id)) }; } catch { /* Use any details already present in the mapping response. */ }
          }
          return {
            id: String(id || ""),
            name: firstValue(device.name, device.deviceName, device.device_name, mapping.name, mapping.device_name, prior.name, prior.device_name, "Device"),
            identifier: firstValue(device.deviceIdentifier, device.device_identifier, device.terminalId, device.terminal_id, device.deviceId, device.device_id, mapping.deviceIdentifier, mapping.device_identifier, mapping.terminalId, mapping.terminal_id, prior.deviceIdentifier, prior.device_identifier),
            code: firstValue(device.code, device.deviceCode, device.device_code, mapping.code, mapping.deviceCode, mapping.device_code, prior.code, prior.deviceCode, prior.device_code),
            activationKey: firstValue(device.activationKey, device.activation_key, device.device_active_code, device.authorization_code, device.activation_code, mapping.activationKey, mapping.activation_key, mapping.device_active_code, mapping.authorization_code, prior.activationKey, prior.activation_key, prior.device_active_code, prior.authorization_code),
          };
        }));
        if (active) setStoreDevices(hydrated.filter((device) => device.id));
      })
      .catch((error) => { if (active) alert(error?.message || "Unable to load store devices."); });
    return () => { active = false; };
  }, [settings.storeId, settings.merchantId]);

  const updateProvider = (provider, changes) => {
    editedProviders.current.add(provider);
    setPayments((current) => current.map((item) => item.provider === provider ? { ...item, ...changes } : item));
  };

  const updateDeviceMapping = (provider, index, changes) => {
    editedProviders.current.add(provider);
    setPayments((current) => current.map((item) => item.provider === provider
    ? { ...item, deviceMappings: item.deviceMappings.map((mapping, mappingIndex) => mappingIndex === index ? { ...mapping, ...changes } : mapping) }
    : item));
  };
  const findStoreDeviceForMapping = (mapping) => storeDevices.find((device) => device.id === String(mapping.storeDeviceId || ""))
    || storeDevices.find((device) => mapping.deviceCode && device.code === mapping.deviceCode);
  const addDeviceMapping = (provider) => updateProvider(provider, { deviceMappings: [...(payments.find((item) => item.provider === provider)?.deviceMappings || []), { storeDeviceId: "", cardTerminalDeviceId: "", deviceCode: "" }] });
  const removeDeviceMapping = (provider, index) => updateProvider(provider, { deviceMappings: (payments.find((item) => item.provider === provider)?.deviceMappings || []).filter((_, mappingIndex) => mappingIndex !== index) });

  const selectEnvironment = (provider, environment) => updateProvider(provider, { payrocEnvironment: environment });
  const setGatewayEnabled = (provider, enabled) => setPayments((current) => current.map((item) => {
    const nextEnabled = item.provider === provider ? enabled : enabled ? false : item.enabled;
    if (nextEnabled !== item.enabled) editedProviders.current.add(item.provider);
    return { ...item, enabled: nextEnabled };
  }));
  const chooseDefault = (provider) => setPayments((current) => current.map((item) => {
    const isDefault = item.provider === provider;
    if (isDefault !== item.isDefault) editedProviders.current.add(item.provider);
    return { ...item, isDefault };
  }));

  const savePaymentSettings = useSaveAction(async () => {
    if (!settings.storeId) {
      alert("Open Card Payment Settings from a store before saving.");
      return;
    }
    const changed = new Set(editedProviders.current);
    if (!changed.size) return true;
    if (payments.filter((payment) => changed.has(payment.provider)).some((payment) => Object.values(payment.terminalUrls).some((url) => {
      if (url == null || !String(url).trim()) return false;
      try { return new URL(String(url).trim()).protocol !== "https:"; } catch { return true; }
    }))) {
      alert("Any card payment URL you enter must be a valid HTTPS URL.");
      return;
    }
    const changedPayments = payments.filter((item) => changed.has(item.provider)).map((item) => {
      const { deviceId, deviceIds, payrocUrls, terminalUrls, ...configuration } = item;
      const urls = Object.fromEntries(Object.entries(item.terminalUrls).map(([key, value]) => [key, String(value ?? "").trim()]));
      return {
        ...configuration,
        deviceMappings: item.deviceMappings.map((mapping) => {
          const storeDevice = findStoreDeviceForMapping(mapping);
          return {
            cardTerminalDeviceId: mapping.cardTerminalDeviceId.trim(),
            deviceCode: storeDevice?.code || mapping.deviceCode || "",
            storeDeviceActivationKey: storeDevice?.activationKey || mapping.storeDeviceActivationKey || "",
          };
        }),
        processorMerchantId: String(item.processorMerchantId ?? "").trim(),
        terminalId: String(item.terminalId ?? "").trim(),
        secretKey: String(item.secretKey ?? "").trim(),
        ...(Object.values(urls).some(Boolean) ? { terminalUrls: urls } : {}),
        ...(item.provider === "Kickback" ? { webhookUrl: String(item.webhookUrl ?? "").trim() } : {}),
      };
    });
    let current = { cardPayments: [] };
    try { current = await getPosCardPaymentConfiguration(settings.storeId); }
    catch (error) { if (!(error instanceof ApiError && error.status === 404)) throw error; }
    const existingPayments = Array.isArray(current.cardPayments) ? current.cardPayments : current.provider ? [current] : [];
    const cardPayments = [
      ...existingPayments.filter((item) => !changed.has(item.provider)).map((item) => {
        const visible = payments.find((payment) => payment.provider === item.provider);
        return visible ? { ...item, enabled: visible.enabled, isDefault: visible.isDefault } : item;
      }),
      ...changedPayments,
    ];
    await savePosCardPaymentSettings(settings.storeId, cardPayments);
    const saved = await getPosCardPaymentConfiguration(settings.storeId);
    const savedByProvider = new Map((saved.cardPayments || []).map((item) => [item.provider, item]));
    if (cardPayments.some((item) => {
      const stored = savedByProvider.get(item.provider);
      if (!stored || stored.enabled !== item.enabled || stored.isDefault !== item.isDefault) return true;
      if (!changed.has(item.provider)) return false;
      return ["processorMerchantId", "terminalId", "secretKey", "webhookUrl", "payrocEnvironment"].some((key) => String(stored[key] ?? "") !== String(item[key] ?? ""))
        || Object.keys(EMPTY_CARD_URLS).some((key) => String(stored.terminalUrls?.[key] ?? "") !== String(item.terminalUrls?.[key] ?? ""));
    })) {
      throw new Error("Card payment details were not saved under the selected gateway. Please try again.");
    }
    editedProviders.current.clear();
    return true;
  });

  return <div className="pos-panel card-payment-panel card-payment-settings-v2">
    <ConfigHeader />
    <p className="pc-help card-payment-help">Enable one gateway, configure its credentials, then choose the default gateway.</p>
    <div className="card-payment-accordion">
      {payments.map((payment) => {
        const isOpen = openProvider === payment.provider;
        const panelId = `card-payment-${payment.provider.toLowerCase()}-panel`;
        return <section className={`pc-card card-payment-provider-card${payment.enabled ? " is-enabled" : ""}${isOpen ? " is-open" : ""}`} key={payment.provider}>
        <button
          type="button"
          className="card-payment-accordion-trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setOpenProvider(isOpen ? "" : payment.provider)}
        >
          <span className="card-payment-accordion-title">
            <strong>{payment.provider}</strong>
            <small>{payment.enabled ? "Available for card payments" : "Disabled for this store"}</small>
          </span>
          <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
        </button>
        <div className="card-payment-accordion-panel" id={panelId} hidden={!isOpen}>
        <div className="card-payment-provider-controls">
          <label className="card-payment-default">
            <input
              type="radio"
              name="defaultCardPaymentProvider"
              checked={payment.isDefault}
              onClick={() => { if (payment.isDefault) chooseDefault(""); }}
              onChange={() => chooseDefault(payment.provider)}
            />
            <span>Use as default gateway</span>
          </label>
          <div className="card-payment-control-options">
            <label><input type="radio" name={`cardPaymentEnvironment-${payment.provider}`} checked={payment.payrocEnvironment === "uat"} onChange={() => selectEnvironment(payment.provider, "uat")} /> UAT</label>
            <label><input type="radio" name={`cardPaymentEnvironment-${payment.provider}`} checked={payment.payrocEnvironment === "production"} onChange={() => selectEnvironment(payment.provider, "production")} /> Production</label>
            <ConfigSwitch label="Enabled" checked={payment.enabled} onChange={(enabled) => setGatewayEnabled(payment.provider, enabled)} />
          </div>
        </div>
        <div className="card-payment-provider-fields">
          {payment.provider === "Payroc" && <div className="card-payment-device-mapping">
            <div className="card-payment-device-mapping-heading"><div><strong>Terminal device mapping</strong><span>Pair each card terminal Device ID with a device mapped to this store.</span></div><button type="button" className="card-payment-add-mapping" onClick={() => addDeviceMapping(payment.provider)} disabled={!storeDevices.length}>＋ Add mapping</button></div>
            {payment.deviceMappings.length > 0 && <div className="card-payment-mapping-list">
              <div className="card-payment-mapping-columns"><span>Card terminal Device ID</span><span>Store device</span><span aria-hidden="true" /></div>
              {payment.deviceMappings.map((mapping, index) => <div className="card-payment-mapping-row" key={`${payment.provider}-${index}`}>
                <input aria-label={`Card terminal Device ID for mapping ${index + 1}`} value={mapping.cardTerminalDeviceId} onChange={(event) => updateDeviceMapping(payment.provider, index, { cardTerminalDeviceId: event.target.value })} placeholder="Enter terminal device ID" />
                <select aria-label={`Store device for mapping ${index + 1}`} value={findStoreDeviceForMapping(mapping)?.id || mapping.storeDeviceId} onChange={(event) => {
                  const selectedDevice = storeDevices.find((device) => device.id === event.target.value);
                  updateDeviceMapping(payment.provider, index, { storeDeviceId: event.target.value, deviceCode: selectedDevice?.code || "", storeDeviceActivationKey: selectedDevice?.activationKey || "" });
                }}><option value="">Select a store device</option>{storeDevices.map((device) => {
                  const assignedElsewhere = payment.deviceMappings.some((other, otherIndex) => otherIndex !== index && findStoreDeviceForMapping(other)?.id === device.id);
                  return <option key={device.id} value={device.id} disabled={assignedElsewhere}>{device.code ? `${device.code} · ` : ""}{device.name}{assignedElsewhere ? " · already assigned" : ""}</option>;
                })}</select>
                <button type="button" className="card-payment-remove-mapping" onClick={() => removeDeviceMapping(payment.provider, index)} aria-label={`Remove mapping ${index + 1}`}><i className="bi bi-trash3" /></button>
              </div>)}
            </div>}
            {!storeDevices.length && <p className="card-payment-device-empty">No devices are mapped to this store yet. Add devices in Device Mapping.</p>}
            {storeDevices.length > 0 && !payment.deviceMappings.length && <p className="card-payment-device-empty">No terminal mappings yet. Add a mapping to connect a card terminal to a store device.</p>}
          </div>}
          <SettingInput label="Merchant ID" value={payment.processorMerchantId} onChange={(value) => updateProvider(payment.provider, { processorMerchantId: value })} placeholder="Enter merchant ID" />
          {payment.provider === "Payroc" && <SettingInput label="Terminal ID" value={payment.terminalId} onChange={(value) => updateProvider(payment.provider, { terminalId: value })} placeholder="Enter terminal ID" />}
          <SettingInput label="Secret Key" value={payment.secretKey} onChange={(value) => updateProvider(payment.provider, { secretKey: value })} placeholder="Enter secret key" type="password" />
          {payment.provider === "Kickback" && <SettingInput label="Webhook URL" value={payment.webhookUrl} onChange={(value) => updateProvider(payment.provider, { webhookUrl: value })} placeholder="Enter webhook URL" />}
          <div className="card-payment-provider-endpoints">
            <strong>{payment.provider} URLs</strong>
            <SettingInput label="Identity authorize API (UAT)" value={payment.terminalUrls.uatIdentity} onChange={(value) => updateProvider(payment.provider, { terminalUrls: { ...payment.terminalUrls, uatIdentity: value } })} />
            <SettingInput label="Identity API (UAT)" value={payment.terminalUrls.uatApi} onChange={(value) => updateProvider(payment.provider, { terminalUrls: { ...payment.terminalUrls, uatApi: value } })} />
            <SettingInput label="Identity authorize API (production)" value={payment.terminalUrls.productionIdentity} onChange={(value) => updateProvider(payment.provider, { terminalUrls: { ...payment.terminalUrls, productionIdentity: value } })} />
            <SettingInput label="Identity API (production)" value={payment.terminalUrls.productionApi} onChange={(value) => updateProvider(payment.provider, { terminalUrls: { ...payment.terminalUrls, productionApi: value } })} />
          </div>
        </div>
        </div>
      </section>;
      })}
    </div>
    <div className="settings-actions pos-form-actions">
      <button type="button" className="pc-button" onClick={() => settings.requestLeave(null)}>Cancel</button>
      <button type="button" className="pos-primary-button" onClick={savePaymentSettings}>Save Changes</button>
    </div>
  </div>;
}
