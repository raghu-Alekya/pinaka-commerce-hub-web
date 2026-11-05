import { useEffect } from "react";
import { ApiError } from "../../../../api/http";
import { ConfigHeader, ConfigSwitch, useConfigState, usePosSettings, useSaveAction } from "../../shared";
import { loadStorePosConfiguration, saveStorePosConfiguration } from "../../storePosConfiguration";
 
const FEATURE_GROUPS = [
  {
    title: "Features",
    items: [
      ["payouts", "Payouts"],
      ["fastKeys", "Fast Keys"],
      ["customItems", "Custom Items"],
      ["cardPayments", "Card Payments"],
      ["partialPayments", "Partial Payments"],
      ["payLater", "Pay Later"],
      ["ebtPayments", "EBT Payments"],
      ["fullRefunds", "Full Refunds"],
      ["partialRefunds", "Partial Refunds"],
    ],
  },
  {
    title: "Discounts",
    items: [
      ["merchantDiscounts", "Merchant Discounts"],
      ["coupons", "Coupons"],
      ["loyalty", "Loyalty"],
      ["customerDisplay", "Customer Display"],
      ["weighingScale", "Weighing Scale (Grocery-specific)"],
    ],
  },
];
const DEFAULTS = Object.fromEntries(FEATURE_GROUPS.flatMap(({ items }) => items.map(([key]) => [key, false])));
 
export function FunctionalitySettings() {
  const settings = usePosSettings();
  const [features, setFeatures] = useConfigState("features", DEFAULTS);
 
  useEffect(() => {
    if (!settings.storeId) return undefined;
    let active = true;
    loadStorePosConfiguration(settings.storeId, "functionality_settings")
      .then((record) => {
        if (!active || !record) return;
        const legacyFeatures = Object.fromEntries(
          ["payouts", "merchantDiscounts", "customItems", "coupons"]
            .filter((key) => record[key] !== undefined)
            .map((key) => [key, record[key]]),
        );
        setFeatures({ ...DEFAULTS, ...legacyFeatures, ...(record.features || {}) });
        settings.session.baseline = { ...settings.session.draft };
      })
      .catch((error) => {
        if (!(error instanceof ApiError && error.status === 404) && active) {
          alert(error?.message || "Unable to load functionality settings.");
        }
      });
    return () => { active = false; };
  }, [settings.storeId]);
 
  const saveSettings = useSaveAction(async () => {
    if (!settings.storeId) {
      alert("Open Functionality Settings from a store before saving.");
      return;
    }
    await saveStorePosConfiguration(settings.storeId, "functionality_settings", {
      features,
    });
    return true;
  });
 
  return <div className="pos-panel functionality-settings-panel">
    <ConfigHeader />
    {FEATURE_GROUPS.map(({ title, items }) => <section className="pc-card functionality-settings-card" key={title}>
      <h3>{title}</h3>
      <div className="functionality-settings-list">
        {items.map(([key, label]) => <ConfigSwitch
          key={key}
          label={label}
          checked={Boolean(features[key])}
          onChange={(enabled) => setFeatures((current) => ({ ...current, [key]: enabled }))}
        />)}
      </div>
    </section>)}
    <div className="pos-form-actions">
      <button type="button" className="pc-button" onClick={() => settings.requestLeave(null)}>Cancel</button>
      <button type="button" className="pc-button pc-primary" onClick={saveSettings}>Save Changes</button>
    </div>
  </div>;
}
 
