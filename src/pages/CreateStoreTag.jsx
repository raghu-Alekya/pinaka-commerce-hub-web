import { useState } from "react";
import "../styles/create-store-tag.css";

const slugify = (value) => value.toLowerCase().trim()
  .replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

export default function CreateStoreTag({ tag, onClose, onSubmit }) {
  const [name, setName] = useState(tag?.name || "");
  const [slug, setSlug] = useState(tag?.slug && tag.slug !== "â€”" ? tag.slug : "");
  const [slugEdited, setSlugEdited] = useState(Boolean(tag?.slug && tag.slug !== "â€”"));
  const [description, setDescription] = useState(tag?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) return setError("Enter a tag name.");
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        slug: (slug || slugify(name)).trim(),
        description: description.trim(),
      });
    } catch (submitError) {
      setError(submitError?.message || "Could not create the tag.");
      setSaving(false);
    }
  };

  return <main className="create-tag-page">
    <header className="create-tag-header">
      <div><h2>{tag ? "Edit Tag" : "Add Tag"}</h2><p>Enter the details of the tag.</p></div>
      <button type="button" className="create-tag-back" onClick={onClose}><i className="bi bi-arrow-left" /> Back to Tags</button>
    </header>
    <form className="create-tag-form" onSubmit={submit}>
      <section className="create-tag-card">
        <div className="create-tag-section-heading"><span className="create-tag-icon"><i className="bi bi-tags" /></span><div><h3>Tag Information</h3><p>Enter the basic details of the tag.</p></div></div>
        <div className="create-tag-fields">
          <label><span className="create-tag-field-label">Tag name <b>*</b></span><input autoFocus required value={name} onChange={(event) => { setName(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} placeholder="Enter tag name" /></label>
          <label><span className="create-tag-field-label">Slug</span><input value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} placeholder="Enter tag slug" /></label>
          <label className="create-tag-description"><span className="create-tag-field-label">Description <small>Optional</small></span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Enter tag description" /></label>
        </div>
        {error && <div className="create-tag-error" role="alert">{error}</div>}
      </section>
      <footer className="create-tag-footer"><button type="button" className="create-tag-cancel" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="create-tag-submit" disabled={saving}>{saving ? "Saving…" : tag ? "Save Changes" : "Add Tag"}</button></footer>
    </form>
  </main>;
}
