import { useEffect, useMemo, useState } from "react";
import "../styles/create-store-category.css";
import { getPosCurrencyTax, getStoreTaxClasses } from "./pos/currency-tax/api";

const slugify = (value) => value.toLowerCase().trim()
  .replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

export default function CreateStoreCategory({ categories = [], category, storeId, onClose, onSubmit }) {
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug && category.slug !== "â€”" ? category.slug : "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category?.slug && category.slug !== "â€”"));
  const [parentId, setParentId] = useState(category?.parentId ? String(category.parentId) : "");
  const [description, setDescription] = useState(category?.description || "");
  const [taxClassSlug, setTaxClassSlug] = useState(category?.taxClass || category?.tax_class || category?.taxClassSlug || category?.tax_class_slug || "standard");
  const [taxClasses, setTaxClasses] = useState([{ slug: "standard", name: "Standard", rate: "" }]);
  const [taxClassesLoading, setTaxClassesLoading] = useState(Boolean(storeId));
  const [image, setImage] = useState(null);
  const initialImage = category?.image?.src || category?.image?.url || category?.imageUrl || category?.image_url || "";
  const [imagePreview, setImagePreview] = useState(initialImage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storeId) return undefined;
    let active = true;
    const loadTaxClasses = async () => {
      setTaxClassesLoading(true);
      try {
        const settings = await getPosCurrencyTax(storeId).catch(() => null);
        let rows = settings?.taxClasses || settings?.tax_classes;
        if (!Array.isArray(rows) || !rows.length) rows = await getStoreTaxClasses(storeId).catch(() => []);
        const defaultRate = settings?.defaultTaxRate ?? settings?.default_tax_rate ?? settings?.default_tax_rate_percent ?? "";
        const normalized = (Array.isArray(rows) ? rows : []).map((row) => ({
          ...row,
          slug: row.slug || row.taxClassSlug || row.tax_class_slug || "",
          name: row.name || row.taxClassName || row.tax_class_name || "",
          rate: row.rate ?? row.taxRate ?? row.tax_rate ?? "",
        })).filter((row) => row.slug);
        const standardIndex = normalized.findIndex((row) => String(row.slug).toLowerCase() === "standard");
        if (standardIndex >= 0) {
          normalized[standardIndex] = { ...normalized[standardIndex], name: normalized[standardIndex].name || "Standard", rate: normalized[standardIndex].rate || defaultRate };
        } else normalized.unshift({ slug: "standard", name: "Standard", rate: defaultRate });
        if (active) setTaxClasses(normalized);
      } catch {
        if (active) setTaxClasses([{ slug: "standard", name: "Standard", rate: "" }]);
      } finally {
        if (active) setTaxClassesLoading(false);
      }
    };
    loadTaxClasses();
    return () => { active = false; };
  }, [storeId]);

  const selectedTaxClass = taxClasses.find((item) => String(item.slug).toLowerCase() === String(taxClassSlug).toLowerCase());
  const taxRate = selectedTaxClass?.rate;
  const displayedTaxRate = taxRate === "" || taxRate == null || !Number.isFinite(Number(taxRate)) ? "" : `${Number(taxRate)}%`;

  const parentOptions = useMemo(() => {
    const byId = new Map(categories.map((category) => [String(category.id), category]));
    const excludedIds = new Set(category?.id != null ? [String(category.id)] : []);
    let foundChild = true;
    while (foundChild) {
      foundChild = false;
      categories.forEach((item) => {
        if (item.parentId && excludedIds.has(String(item.parentId)) && !excludedIds.has(String(item.id))) {
          excludedIds.add(String(item.id));
          foundChild = true;
        }
      });
    }
    const children = new Map();
    categories.forEach((category) => {
      if (excludedIds.has(String(category.id))) return;
      const parent = String(category.parentId || "");
      if (parent && byId.has(parent)) children.set(parent, [...(children.get(parent) || []), category]);
    });
    const result = [];
    const visit = (category, depth) => {
      result.push({ ...category, depth });
      (children.get(String(category.id)) || []).forEach((child) => visit(child, depth + 1));
    };
    categories.filter((item) => !excludedIds.has(String(item.id)) && (!item.parentId || !byId.has(String(item.parentId))))
      .forEach((category) => visit(category, 0));
    return result;
  }, [categories, category?.id]);

  const handleImage = (file) => {
    setError("");
    if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPG, or WEBP image.");
      return;
    }
    if (file && file.size > 2 * 1024 * 1024) {
      setError("The category image must be 2 MB or smaller.");
      return;
    }
    setImage(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) return setError("Enter a category name.");
    setSaving(true);
    try {
      const payload = image ? new FormData() : {};
      const values = { name: name.trim(), slug: (slug || slugify(name)).trim(), parentId: parentId || 0, description: description.trim(), taxClass: taxClassSlug };
      if (image) {
        Object.entries(values).forEach(([key, value]) => payload.append(key, value));
        payload.append("image", image);
      } else Object.assign(payload, values);
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError?.message || "Could not create the category.");
      setSaving(false);
    }
  };

  return <main className="create-category-page">
      <header className="create-category-header">
        <div><div><h2 id="create-category-title">{category ? "Edit Category" : "Add Category"}</h2><p>Enter the details of the category.</p></div></div>
        <button type="button" className="create-category-back" onClick={onClose}><i className="bi bi-arrow-left" /> Back to Categories</button>
      </header>
      <form className="create-category-form" onSubmit={submit}>
        <section className="create-category-card">
          <div className="create-category-section-heading"><span className="create-category-icon"><i className="bi bi-folder-plus" /></span><div><h3>Category Information</h3><p>Enter the basic details of the category.</p></div></div>
        <div className="create-category-fields">
          <label><span className="create-category-field-label">Category name <b className="create-category-required">*</b></span><input autoFocus required value={name} onChange={(event) => { setName(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} placeholder="Enter category name" /></label>
          <label><span className="create-category-field-label">Slug</span><input value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} placeholder="Enter category slug" /></label>
          <label className="create-category-parent"><span className="create-category-field-label">Parent category</span><select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">None</option>{parentOptions.map((categoryOption) => <option key={categoryOption.id} value={categoryOption.id}>{`${"— ".repeat(categoryOption.depth)}${categoryOption.name}`}</option>)}</select></label>
          <label className="create-category-description"><span className="create-category-field-label">Description <small>Optional</small></span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Enter category description" /></label>
          <div className="create-category-tax">
            <label htmlFor="category-tax-class">Assigned Tax Class (POS)</label>
            <div className="create-category-tax-controls">
              <select id="category-tax-class" value={taxClassSlug} onChange={(event) => setTaxClassSlug(event.target.value)} disabled={taxClassesLoading}>
                {taxClasses.map((taxClass) => <option key={taxClass.slug} value={taxClass.slug}>{taxClass.name || taxClass.slug}</option>)}
              </select>
              <input type="text" aria-label="Selected tax rate" value={displayedTaxRate} placeholder="—" disabled readOnly />
            </div>
            <small>Select tax class for POS custom items/products.</small>
          </div>
          <div className="create-category-image">
            <div className="create-category-image-heading"><span>Category Image</span><p>Upload a PNG, JPG, or WEBP image up to 2 MB.</p></div>
            <div className="create-category-image-row">
              <div className="create-category-image-preview">{imagePreview ? <img src={imagePreview} alt="Category preview" /> : <i className="bi bi-image" aria-hidden="true" />}</div>
              <label className="create-category-image-input"><span>Image file</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleImage(event.target.files?.[0])} /></label>
            </div>
          </div>
        </div>
        {error && <div className="create-category-error" role="alert">{error}</div>}
        </section>
        <footer className="create-category-footer"><button type="button" className="create-category-cancel" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="create-category-submit" disabled={saving}>{saving ? "Creating…" : "Add Category"}</button></footer>
      </form>
  </main>;
}
