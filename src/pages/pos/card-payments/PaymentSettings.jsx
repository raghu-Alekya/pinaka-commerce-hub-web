import { useEffect } from "react";
import { ApiError } from "../../../api/http";
import { ConfigHeader, ConfigSwitch, SettingInput, useConfigState, usePosSettings, useSaveAction } from "../shared";
import { getPosCardPayments, savePosCardPaymentSettings } from "./api";

const PROVIDERS = ["Kickback", "Payroc"];
const blankProvider = (provider) => ({
  provider,
  enabled: false,
  isDefault: false,
  deviceId: "",
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
    };
  });
}

export function PaymentSettings() {
  const settings = usePosSettings();
  const [payments, setPayments] = useConfigState("payments", DEFAULT_PAYMENTS);

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

  const updateProvider = (provider, changes) => setPayments((current) => current.map((item) =>
    item.provider === provider ? { ...item, ...changes } : item));

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
    if (enabledPayments.some((item) => !item.deviceId.trim() || !item.processorMerchantId.trim() || !item.secretKey.trim() || !item.webhookUrl.trim() || (item.provider === "Payroc" && !item.terminalId.trim()))) {
      alert("Complete the required credentials for each enabled payment provider.");
      return;
    }
    if (enabledPayments.length && !enabledPayments.some((item) => item.isDefault)) {
      alert("Select an enabled provider as the default payment gateway.");
      return;
    }
    await savePosCardPaymentSettings(settings.storeId, payments.map((item) => ({
      ...item,
      deviceId: item.deviceId.trim(),
      processorMerchantId: item.processorMerchantId.trim(),
      terminalId: item.terminalId.trim(),
      secretKey: item.secretKey.trim(),
      webhookUrl: item.webhookUrl.trim(),
    })));
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
          <SettingInput label="Device ID" value={payment.deviceId} onChange={(value) => updateProvider(payment.provider, { deviceId: value })} placeholder="Enter device ID" />
          <SettingInput label="Merchant ID" value={payment.processorMerchantId} onChange={(value) => updateProvider(payment.provider, { processorMerchantId: value })} placeholder="Enter merchant ID" />
          {payment.provider === "Payroc" && <SettingInput label="Terminal ID" value={payment.terminalId} onChange={(value) => updateProvider(payment.provider, { terminalId: value })} placeholder="Enter terminal ID" />}
          <SettingInput label="Secret Key" value={payment.secretKey} onChange={(value) => updateProvider(payment.provider, { secretKey: value })} placeholder="Enter secret key" type="password" />
          <SettingInput label="Webhook URL" value={payment.webhookUrl} onChange={(value) => updateProvider(payment.provider, { webhookUrl: value })} placeholder="Enter webhook URL" />
        </div>
      </section>)}
    </div>
    <div className="settings-actions pos-form-actions">
      <button type="button" className="pc-button" onClick={() => settings.requestLeave(null)}>Cancel</button>
      <button type="button" className="pos-primary-button" onClick={savePaymentSettings}>Save Changes</button>
    </div>
  </div>;
}
