import { useState } from "react";
import "../styles/create-store-attribute.css";

const slugify = (value) => value.toLowerCase().trim()
  .replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

export default function CreateStoreAttribute({ attribute, onClose, onSubmit }) {
  const [name, setName] = useState(attribute?.name || "");
  const [slug, setSlug] = useState(attribute?.slug && attribute.slug !== "â€”" ? attribute.slug : "");
  const [slugEdited, setSlugEdited] = useState(Boolean(attribute?.slug && attribute.slug !== "â€”"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) return setError("Enter an attribute name.");
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), slug: (slug || slugify(name)).trim() });
    } catch (submitError) {
      setError(submitError?.message || "Could not create the attribute.");
      setSaving(false);
    }
  };

  return <main className="create-attribute-page">
    <header className="create-attribute-header"><div><h2>{attribute ? "Edit Attribute" : "Add Attribute"}</h2><p>Enter the details of the attribute.</p></div><button type="button" className="create-attribute-back" onClick={onClose}><i className="bi bi-arrow-left" /> Back to Attributes</button></header>
    <form className="create-attribute-form" onSubmit={submit}>
      <section className="create-attribute-card">
        <div className="create-attribute-section-heading"><span className="create-attribute-icon"><i className="bi bi-sliders" /></span><div><h3>Attribute Information</h3><p>Enter the basic details of the attribute.</p></div></div>
        <div className="create-attribute-fields">
          <label><span className="create-attribute-field-label">Attribute name <b>*</b></span><input autoFocus required value={name} onChange={(event) => { setName(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} placeholder="Enter attribute name" /></label>
          <label><span className="create-attribute-field-label">Slug</span><input value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} placeholder="Enter attribute slug" /></label>
        </div>
        {error && <div className="create-attribute-error" role="alert">{error}</div>}
      </section>
      <footer className="create-attribute-footer"><button type="button" className="create-attribute-cancel" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="create-attribute-submit" disabled={saving}>{saving ? "Saving…" : attribute ? "Save Changes" : "Add Attribute"}</button></footer>
    </form>
  </main>;
}
