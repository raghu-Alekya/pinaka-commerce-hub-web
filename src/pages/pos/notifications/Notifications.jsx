import { useEffect, useState } from "react";
import { ApiError } from "../../../api/http";
import { ConfigHeader, usePosSettings } from "../shared";
import { getNotificationSettings, notificationSettingsFromApi, saveNotificationSettings } from "./api";
import "./notifications.css";

const initialTemplates = [
  {
    id: "sms",
    name: "Text message",
    icon: "bi-chat-left-text",
    enabled: true,
    message: "Hi {customer_name}, your order #{order_number} has been received. Thank you for shopping with {store_name}!",
    storeName: "",
  },
  {
    id: "whatsapp",
    name: "WhatsApp message",
    icon: "bi-whatsapp",
    enabled: true,
    message: "Hi {customer_name}! 👋 Your order #{order_number} from {store_name} is confirmed. Thank you!",
    storeName: "",
  },
];

function previewMessage(message, storeName) {
  return message
    .replaceAll("{customer_name}", "Alex")
    .replaceAll("{order_number}", "1048")
    .replaceAll("{store_name}", storeName || "Your Store");
}

export function Notifications() {
  const settings = usePosSettings();
  const storeName = settings?.store?.storeName
    || settings?.store?.store_name
    || settings?.store?.name
    || "Your Store";
  const [templates, setTemplates] = useState(initialTemplates);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftStoreName, setDraftStoreName] = useState("");
  const [notice, setNotice] = useState("");
  const previewStoreName = draft && editingId ? draftStoreName : storeName;

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all(initialTemplates.map(async (template) => {
      try {
        const record = await getNotificationSettings(template.id, settings?.merchantId, settings?.storeId);
        return { id: template.id, settings: notificationSettingsFromApi(record, template), error: "" };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return { id: template.id, settings: template, error: "" };
        return { id: template.id, settings: template, error: error?.message || `Unable to load ${template.name.toLowerCase()} settings.` };
      }
    })).then((results) => {
      if (!active) return;
      setTemplates((current) => current.map((template) => results.find((result) => result.id === template.id)?.settings || template));
      const errors = results.filter((result) => result.error).map((result) => result.error);
      setLoadError(errors.join(" "));
      setLoading(false);
    });
    return () => { active = false; };
  }, [settings?.merchantId, settings?.storeId]);

  const startEditing = (template) => {
    setEditingId(template.id);
    setDraft({ ...template });
    setDraftStoreName(template.storeName || storeNameOverride || storeName);
    setNotice("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(null);
    setDraftStoreName("");
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    setNotice("");
    try {
      const updated = { ...draft, storeName: draftStoreName.trim() };
      const response = await saveNotificationSettings(draft.id, settings?.merchantId, settings?.storeId, updated);
      const saved = notificationSettingsFromApi(response, updated);
      setTemplates((current) => current.map((template) => template.id === draft.id ? saved : template));
      setEditingId(null);
      setDraft(null);
      setDraftStoreName("");
      setNotice("Notification settings saved.");
    } catch (error) {
      setNotice(error?.message || "Unable to save notification settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="pos-panel notifications-settings">
      <ConfigHeader title="Notifications" description="Manage text message and WhatsApp notifications for this store." />
      {loading && <p className="notifications-notice" role="status">Loading notification settings…</p>}
      {loadError && <p className="notifications-notice" role="alert">{loadError}</p>}

      <section className="notifications-channel-grid" aria-label="Notification message previews">
        {templates.map((template) => (
          <article className="notifications-channel-card" key={template.id}>
            <header className="notifications-channel-heading">
              <span className={`notifications-channel-icon ${template.id}`}><i className={`bi ${template.icon}`} aria-hidden="true" /></span>
              <div><h3>{template.name}</h3><p>{template.enabled ? "Enabled" : "Disabled"}</p></div>
              <button type="button" className="notifications-edit-button" disabled={loading || saving} onClick={() => startEditing(template)}>
                <i className="bi bi-pencil" aria-hidden="true" /> Edit
              </button>
            </header>
            <div className={`notifications-message-preview ${template.id}`}>
              <span className="notifications-preview-label">Message preview</span>
              <p>{previewMessage(template.message, template.storeName || previewStoreName)}</p>
            </div>
          </article>
        ))}
      </section>

      {editingId && draft && (
        <section className="notifications-editor" aria-labelledby="notifications-editor-title">
          <header><div><h3 id="notifications-editor-title">Edit {draft.name}</h3><p>Changes appear in the preview as you type.</p></div></header>
          <label className="notifications-enable-toggle">
            <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))} />
            Enable this notification
          </label>
          <label className="notifications-message-field" htmlFor="notification-store-name">Store name in message preview</label>
          <input className="notifications-store-name-input" id="notification-store-name" value={draftStoreName} onChange={(event) => setDraftStoreName(event.target.value)} placeholder="Enter store name" />
          <label className="notifications-message-field" htmlFor="notification-message-text">Message text</label>
          <textarea id="notification-message-text" rows="5" value={draft.message} onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))} />
          <p className="notifications-placeholder-hint">Available placeholders: <code>{"{customer_name}"}</code>, <code>{"{order_number}"}</code>, <code>{"{store_name}"}</code></p>
          <div className={`notifications-message-preview ${draft.id}`}>
            <span className="notifications-preview-label">Live preview</span>
            <p>{previewMessage(draft.message, draftStoreName)}</p>
          </div>
          <footer>
            <button type="button" className="notifications-cancel-button" disabled={saving} onClick={cancelEditing}>Cancel</button>
            <button type="button" className="notifications-save-button" disabled={saving} onClick={saveDraft}>{saving ? "Saving…" : "Save Changes"}</button>
          </footer>
        </section>
      )}

      {notice && <p className="notifications-notice" role="status">{notice}</p>}
    </main>
  );
}
