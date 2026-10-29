import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/http";
import { ConfigFooter, ConfigHeader, useConfigState, usePosSettings, useSaveAction } from "../shared";
import { posImageUrl } from "../storePosConfiguration";
import { getPromotionalImages, savePromotionalImages } from "./api";

const DEFAULTS = { enabled: false, images: [] };
const isImageFile = (file) => ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type);

export function CustomerDisplayPromotionalImages({ onBack }) {
  const settings = usePosSettings();
  const [draft, setDraft] = useConfigState("customerDisplayPromotionalImages", DEFAULTS);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [showUrlEntry, setShowUrlEntry] = useState(false);
  const fileInput = useRef(null);
  settings.session.resets.customerDisplayPromotionalImageRemovals = () => setRemovedImageIds([]);
  const update = (next) => { setDraft(next); setError(""); setMessage(""); };

  useEffect(() => {
    if (!settings.storeId) return undefined;
    let active = true;
    getPromotionalImages(settings.merchantId, settings.storeId).then((record) => {
      if (!active || !record || typeof record !== "object") return;
      const loaded = { enabled: Boolean(record.enabled), images: record.images.map((image) => ({ id: image.id, image: image.url, imageName: image.name || "" })) };
      setDraft(loaded);
      settings.session.saved.customerDisplayPromotionalImages = loaded;
      settings.session.baseline.customerDisplayPromotionalImages = loaded;
      settings.session.draft.customerDisplayPromotionalImages = loaded;
    }).catch((cause) => {
      if (active && !(cause instanceof ApiError && cause.status === 404)) setError(cause?.message || "Unable to load promotional images.");
    });
    return () => { active = false; };
  }, [settings.storeId]);

  const selectImages = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const invalid = files.find((file) => !isImageFile(file) || file.size > 5 * 1024 * 1024);
    if (invalid) { setError("Choose PNG, JPG, WEBP, or GIF images up to 5 MB each."); return; }
    Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ image: String(reader.result || ""), imageName: file.name, pendingFile: file });
      reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
      reader.readAsDataURL(file);
    }))).then((images) => update({ ...draft, images: [...draft.images, ...images] })).catch((cause) => setError(cause.message));
  };

  const addByUrl = () => {
    let parsed;
    try { parsed = new URL(url.trim()); } catch { setError("Enter a valid image URL."); return; }
    if (!/^https?:$/.test(parsed.protocol)) { setError("Image URLs must start with http:// or https://."); return; }
    update({ ...draft, images: [...draft.images, { image: parsed.href, imageName: parsed.pathname.split("/").pop() || parsed.hostname }] });
    setUrl("");
    setShowUrlEntry(false);
  };

  const save = useSaveAction(async () => {
    if (!settings.storeId) { setError("Open Customer Display Promotional Images from a store before saving."); return false; }
    setError("");
    try {
      const images = draft.images.map((item) => {
        if (item.pendingFile) return { id: item.id, file: item.pendingFile };
        if (/^https?:\/\//i.test(item.image) || item.image.startsWith("/uploads/")) {
          return { id: item.id, url: item.image };
        }
        throw new Error("Remove an invalid image and add it again.");
      });
      const saved = await savePromotionalImages(settings.merchantId, settings.storeId, { enabled: draft.enabled, images, removeIds: removedImageIds });
      const next = { enabled: Boolean(saved?.enabled ?? draft.enabled), images: saved.images.map((item) => ({ id: item.id, image: item.url, imageName: "" })) };
      setDraft(next);
      setRemovedImageIds([]);
      settings.session.saved.customerDisplayPromotionalImages = next;
      settings.session.baseline.customerDisplayPromotionalImages = next;
      settings.session.draft.customerDisplayPromotionalImages = next;
      setMessage("Promotional images saved.");
      return true;
    } catch (cause) {
      setError(cause?.message || "Unable to save promotional images.");
      return false;
    }
  });

  return <section className="pc-screen pc-promo-screen">
    <ConfigHeader icon="images" title="Customer Display Promotional Images" description="Choose the promotional images displayed to customers at checkout." />
    {error && <p className="pc-error" role="alert">{error}</p>}
    <section className="pc-card">
      <h3>Enable/Disable Features</h3>
      <label className="pc-promo-enable"><span>Enable/Disable Images</span><span><input type="checkbox" checked={draft.enabled} onChange={(event) => update({ ...draft, enabled: event.target.checked })} /><small>Check to enable the images on customer displays.</small></span></label>
    </section>
    <section className="pc-card pc-spaced">
      <h3>Manage Promotion Images</h3>
      <div className="pc-promo-gallery">
        {draft.images.map((item, index) => <div className="pc-promo-item" key={`${item.image}-${index}`}>
          <div className="pc-promo-preview">{item.image ? <img src={posImageUrl(item.image)} alt={item.imageName || `Promotional image ${index + 1}`} /> : <i className="bi bi-image" aria-hidden="true" />}</div>
          {item.imageName && <small className="pc-promo-name" title={item.imageName}>{item.imageName}</small>}
          <button type="button" className="pc-promo-remove" onClick={() => { if (item.id) setRemovedImageIds((current) => current.includes(item.id) ? current : [...current, item.id]); update({ ...draft, images: draft.images.filter((_, imageIndex) => imageIndex !== index) }); }}>Remove</button>
        </div>)}
        {!draft.images.length && <p className="pc-empty">No promotional images added yet.</p>}
      </div>
      <div className="pc-promo-actions">
        <input ref={fileInput} className="pc-sr-only" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectImages} aria-label="Upload promotional images" />
        <button type="button" className="pc-button" onClick={() => fileInput.current?.click()}><i className="bi bi-upload" aria-hidden="true" /> Upload / Select Images</button>
        {!showUrlEntry && <button type="button" className="pc-button" onClick={() => setShowUrlEntry(true)}>Add Image by URL</button>}
        {showUrlEntry && <div className="pc-promo-url"><input autoFocus type="url" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addByUrl(); } }} aria-label="Image URL" /><button type="button" className="pc-button" onClick={addByUrl}>Add</button><button type="button" className="pc-button" onClick={() => { setShowUrlEntry(false); setUrl(""); }}>Cancel</button></div>}
        <button type="button" className="pc-button" onClick={() => { setRemovedImageIds((current) => [...new Set([...current, ...draft.images.map((image) => image.id).filter(Boolean)])]); update({ ...draft, images: [] }); }} disabled={!draft.images.length}>Clear All</button>
      </div>
    </section>
    <ConfigFooter onBack={onBack} onSave={save} message={message} />
  </section>;
}
