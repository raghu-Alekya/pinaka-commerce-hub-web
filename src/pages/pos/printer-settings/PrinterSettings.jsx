import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/http";
import {
  ConfigField,
  ConfigFooter,
  ConfigHeader,
  useConfigState,
  usePosSettings,
  useSaveAction,
} from "../shared";
import { getPrinterSettings, savePrinterSettings } from "./api";
import { isStoredPosImage, uploadStorePosImage } from "../storePosConfiguration";

const DEFAULTS = { header: "", footer: "", address: "", logo: "", logoName: "" };

export function PrinterSettings({ onBack }) {
  const settings = usePosSettings();
  const logoFile = useRef(null);
  const [draft, setDraft] = useConfigState("printerSettings", DEFAULTS);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const update = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  useEffect(() => {
    if (!settings.storeId) return undefined;
    let active = true;
    getPrinterSettings(settings.storeId)
      .then((record) => {
        if (!active || !record || typeof record !== "object") return;
        const loaded = { ...DEFAULTS, ...record };
        setDraft(loaded);
        settings.session.saved.printerSettings = loaded;
        settings.session.baseline.printerSettings = loaded;
        settings.session.draft.printerSettings = loaded;
      })
      .catch((cause) => {
        if (active && !(cause instanceof ApiError && cause.status === 404)) {
          setError(cause?.message || "Unable to load printer settings.");
        }
      });
    return () => { active = false; };
  }, [settings.storeId]);

  const save = useSaveAction(async () => {
    if (!settings.storeId) {
      setError("Open Printer Settings from a store before saving.");
      return false;
    }
    setError("");
    let logo = draft.logo || "";
    let logoName = draft.logoName || "";
    if (logoFile.current) {
      if (!/^image\/(png|jpeg|webp)$/.test(logoFile.current.type) || logoFile.current.size > 2 * 1024 * 1024) {
        setError("Choose a PNG, JPG, or WEBP logo up to 2 MB.");
        return false;
      }
      const uploaded = await uploadStorePosImage(settings.storeId, logoFile.current);
      logo = uploaded.path;
      logoName = uploaded.imageName || logoName;
      logoFile.current = null;
    } else if (logo && !isStoredPosImage(logo) && !logo.startsWith("data:image/")) {
      setError("Choose a PNG, JPG, or WEBP logo up to 2 MB.");
      return false;
    }
    const saved = await savePrinterSettings(settings.storeId, {
      header: draft.header,
      footer: draft.footer,
      address: draft.address,
      logo,
      logoName,
    });
    const next = { ...DEFAULTS, ...(saved && typeof saved === "object" ? saved : draft) };
    setDraft(next);
    settings.session.saved.printerSettings = next;
    settings.session.baseline.printerSettings = next;
    settings.session.draft.printerSettings = next;
    setMessage("Printer settings saved.");
    return true;
  });

  const selectLogo = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a PNG, JPG, or WEBP logo up to 2 MB.");
      return;
    }
    logoFile.current = file;
    const reader = new FileReader();
    reader.onload = () => {
      update("logo", String(reader.result || ""));
      update("logoName", file.name);
      setError("");
    };
    reader.onerror = () => setError("Unable to read the selected logo.");
    reader.readAsDataURL(file);
  };

  return <section className="pc-screen">
    <ConfigHeader icon="printer" title="Printer Settings" description="Customize the logo and text printed on store receipts." />
    {error && <p className="pc-error" role="alert">{error}</p>}
    <section className="pc-card">
      <h3>Receipt Branding</h3>
      <div className="pc-form-grid">
        <ConfigField label="Receipt Header">
          <textarea rows={3} maxLength={500} value={draft.header || ""} onChange={(event) => update("header", event.target.value)} placeholder="Store name, address, or welcome message" />
        </ConfigField>
        <ConfigField label="Receipt Footer">
          <textarea rows={3} maxLength={500} value={draft.footer || ""} onChange={(event) => update("footer", event.target.value)} placeholder="Thank you message or return policy" />
        </ConfigField>
        <ConfigField label="Address">
          <textarea rows={3} maxLength={500} value={draft.address || ""} onChange={(event) => update("address", event.target.value)} placeholder="Store address printed on receipts" />
        </ConfigField>
      </div>
    </section>
    <section className="pc-card pc-spaced">
      <h3>Store Logo</h3>
      <p className="pc-help">Upload a PNG, JPG, or WEBP logo up to 2 MB.</p>
      <div className="pc-printer-logo-row">
        {draft.logo
          ? <img className="pc-printer-logo-preview" src={draft.logo} alt="Receipt logo preview" />
          : <span className="pc-printer-logo-placeholder" aria-hidden="true"><i className="bi bi-image" /></span>}
        <div className="pc-printer-logo-controls">
          <ConfigField label="Logo image">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo} />
          </ConfigField>
          {draft.logoName && <small>{draft.logoName}</small>}
          {draft.logo && <button type="button" className="pc-button" onClick={() => { logoFile.current = null; update("logo", ""); update("logoName", ""); }}>Remove Logo</button>}
        </div>
      </div>
    </section>
    <ConfigFooter onBack={onBack} message={message} onSave={save} />
  </section>;
}
