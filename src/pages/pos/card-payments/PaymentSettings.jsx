import { useEffect, useState } from "react";
import { ApiError } from "../../../api/http";
import { devicesApi } from "../../../api/devices";
import { getStoreDeviceMappings } from "../../../api/storeDeviceMappings";
import { ConfigHeader, ConfigSwitch, SettingInput, useConfigState, usePosSettings, useSaveAction } from "../shared";
import { getPosCardPayments, savePosCardPaymentSettings } from "./api";

const PROVIDERS = ["Kickback", "Payroc"];
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
});
const DEFAULT_PAYMENTS = PROVIDERS.map(blankProvider);

function normalizePayments(records = []) {
  const byProvider = new Map(records.map((record) => [record.provider, record]));
  const hasExplicitDefault = records.some((record) => record.isDefault !== undefined || record.is_default !== undefined || record.default !== undefined);
  const defaultProvider = records.find((record) => (record.isDefault || record.is_default || record.default) && record.enabled !== false)?.provider
    || (!hasExplicitDefault ? records.find((record) => record.enabled !== false)?.provider : "");
  return PROVIDERS.map((provider) => {
    const record = byProvider.get(provider);
    if (!record) return blankProvider(provider);
    return {
      ...blankProvider(provider),
      ...record,
      enabled: record.enabled === undefined ? true : Boolean(record.enabled),
      isDefault: provider === defaultProvider,
      processorMerchantId: record.processorMerchantId || record.merchantId || "",
      deviceMappings: Array.isArray(record.deviceMappings || record.device_mappings)
        ? (record.deviceMappings || record.device_mappings).map((mapping) => ({
          storeDeviceId: String(mapping.storeDeviceId || mapping.store_device_id || ""),
          deviceId: mapping.deviceId || mapping.device_id || "",
          storeDeviceActivationKey: mapping.storeDeviceActivationKey || mapping.store_device_activation_key || mapping.activationKey || mapping.activation_key || mapping.device_active_code || "",
          storeDeviceName: mapping.storeDeviceName || mapping.store_device_name || "",
        }))
        : (record.deviceIds || record.device_ids || []).map((id) => ({ storeDeviceId: String(id), deviceId: "" })),
    };
  });
}

export function PaymentSettings() {
  const settings = usePosSettings();
  const [payments, setPayments] = useConfigState("payments", DEFAULT_PAYMENTS);
  const [storeDevices, setStoreDevices] = useState([]);

  useEffect(() => {
    if (!settings.storeId) return undefined;
    let active = true;
    getPosCardPayments(settings.storeId)
      .then((records) => {
        if (!active) return;
        setPayments(normalizePayments(records));
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

  const updateProvider = (provider, changes) => setPayments((current) => current.map((item) =>
    item.provider === provider ? { ...item, ...changes } : item));

  const updateDeviceMapping = (provider, index, changes) => setPayments((current) => current.map((item) => item.provider === provider
    ? { ...item, deviceMappings: item.deviceMappings.map((mapping, mappingIndex) => mappingIndex === index ? { ...mapping, ...changes } : mapping) }
    : item));
  const addDeviceMapping = (provider) => updateProvider(provider, { deviceMappings: [...(payments.find((item) => item.provider === provider)?.deviceMappings || []), { storeDeviceId: "", deviceId: "" }] });
  const removeDeviceMapping = (provider, index) => updateProvider(provider, { deviceMappings: (payments.find((item) => item.provider === provider)?.deviceMappings || []).filter((_, mappingIndex) => mappingIndex !== index) });

  const setEnabled = (provider, enabled) => setPayments((current) => {
    const next = current.map((item) => item.provider === provider ? { ...item, enabled } : item);
    if (enabled && !next.some((item) => item.isDefault)) {
      return next.map((item) => ({ ...item, isDefault: item.provider === provider }));
    }
    if (!enabled && next.find((item) => item.provider === provider)?.isDefault) {
      const replacement = next.find((item) => item.enabled);
      return next.map((item) => ({ ...item, isDefault: item.provider === replacement?.provider }));
    }
    return next;
  });

  const chooseDefault = (provider) => setPayments((current) => current.map((item) => ({
    ...item,
    isDefault: item.provider === provider,
  })));

  const savePaymentSettings = useSaveAction(async () => {
    if (!settings.storeId) {
      alert("Open Card Payment Settings from a store before saving.");
      return;
    }
    const enabledPayments = payments.filter((item) => item.enabled);
    if (enabledPayments.some((item) => (item.provider === "Payroc" && (!item.deviceMappings.length || item.deviceMappings.some((mapping) => !mapping.storeDeviceId || !mapping.deviceId.trim()))) || !item.processorMerchantId.trim() || !item.secretKey.trim() || (item.provider === "Kickback" && !item.webhookUrl.trim()) || (item.provider === "Payroc" && !item.terminalId.trim()))) {
      alert("Complete the required credentials for each enabled payment provider.");
      return;
    }
    if (enabledPayments.length && !enabledPayments.some((item) => item.isDefault)) {
      alert("Select an enabled provider as the default payment gateway.");
      return;
    }
    await savePosCardPaymentSettings(settings.storeId, payments.map((item) => {
      const { deviceId, deviceIds, webhookUrl, ...configuration } = item;
      return {
        ...configuration,
        deviceMappings: item.deviceMappings.map((mapping) => {
          const storeDevice = storeDevices.find((device) => device.id === String(mapping.storeDeviceId));
          return {
            storeDeviceId: mapping.storeDeviceId,
            deviceId: mapping.deviceId.trim(),
            storeDeviceName: storeDevice?.name || mapping.storeDeviceName || "",
            storeDeviceActivationKey: storeDevice?.activationKey || mapping.storeDeviceActivationKey || "",
          };
        }),
        processorMerchantId: item.processorMerchantId.trim(),
        terminalId: item.terminalId.trim(),
        secretKey: item.secretKey.trim(),
        ...(item.provider === "Kickback" ? { webhookUrl: item.webhookUrl.trim() } : {}),
      };
    }));
    return true;
  });

  return <div className="pos-panel card-payment-panel card-payment-settings-v2">
    <ConfigHeader />
    <p className="pc-help card-payment-help">Enable one or both gateways, configure their credentials, then choose the default gateway.</p>
    <div className="card-payment-provider-grid">
      {payments.map((payment) => <section className={`pc-card card-payment-provider-card${payment.enabled ? " is-enabled" : ""}`} key={payment.provider}>
        <div className="card-payment-provider-heading">
          <div>
            <h3>{payment.provider}</h3>
            <p>{payment.enabled ? "Available for card payments" : "Disabled for this store"}</p>
          </div>
          <ConfigSwitch label="Enabled" checked={payment.enabled} onChange={(enabled) => setEnabled(payment.provider, enabled)} />
        </div>
        <label className={`card-payment-default${!payment.enabled ? " is-disabled" : ""}`}>
          <input
            type="radio"
            name="defaultCardPaymentProvider"
            checked={payment.isDefault}
            disabled={!payment.enabled}
            onChange={() => chooseDefault(payment.provider)}
          />
          <span>Use as default gateway</span>
        </label>
        <div className="card-payment-provider-fields">
          {payment.provider === "Payroc" && <div className="card-payment-device-mapping">
            <div className="card-payment-device-mapping-heading"><div><strong>Terminal device mapping</strong><span>Pair each card terminal Device ID with a device mapped to this store.</span></div><button type="button" className="card-payment-add-mapping" onClick={() => addDeviceMapping(payment.provider)} disabled={!storeDevices.length}>＋ Add mapping</button></div>
            {payment.deviceMappings.length > 0 && <div className="card-payment-mapping-list">
              <div className="card-payment-mapping-columns"><span>Card terminal Device ID</span><span>Store device</span><span aria-hidden="true" /></div>
              {payment.deviceMappings.map((mapping, index) => <div className="card-payment-mapping-row" key={`${payment.provider}-${index}`}>
                <input aria-label={`Card terminal Device ID for mapping ${index + 1}`} value={mapping.deviceId} onChange={(event) => updateDeviceMapping(payment.provider, index, { deviceId: event.target.value })} placeholder="Enter terminal device ID" />
                <select aria-label={`Store device for mapping ${index + 1}`} value={mapping.storeDeviceId} onChange={(event) => updateDeviceMapping(payment.provider, index, { storeDeviceId: event.target.value })}><option value="">Select a store device</option>{storeDevices.map((device) => <option key={device.id} value={device.id}>{device.name}{device.identifier ? ` · ${device.identifier}` : ""}</option>)}</select>
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
        </div>
      </section>)}
    </div>
    <div className="settings-actions pos-form-actions">
      <button type="button" className="pc-button" onClick={() => settings.requestLeave(null)}>Cancel</button>
      <button type="button" className="pos-primary-button" onClick={savePaymentSettings}>Save Changes</button>
    </div>
  </div>;
}
