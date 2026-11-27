import { useEffect, useMemo, useRef, useState } from "react";
import { productsApi } from "../api/products";
import { getStoreCatalogTaxonomies } from "../api/storeConnector";
import { getPosCurrencyTax } from "./pos/pos/currency-tax/api";
import "../styles/product-manager.css";

const blankProduct = () => ({
  name: "", type: "simple", sku: "", price: "", salePrice: "", description: "",
  category: "", categoryId: "", categoryIds: [], brand: "", image: "", quantity: "", stockStatus: "instock",
  manageStock: true, lowStockAmount: "", tags: [], attributes: [], variations: [], taxStatus: "taxable", taxClass: "",
});

function generateSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const valueOf = (product, ...keys) => keys.map((key) => product?.[key]).find((value) => value !== undefined && value !== null) ?? "";

function csvCell(value) {
  const text = Array.isArray(value) ? JSON.stringify(value) : String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell); if (row.some((item) => item.trim())) rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  row.push(cell); if (row.some((item) => item.trim())) rows.push(row);
  if (quoted) throw new Error("The CSV contains an unfinished quoted value.");
  if (rows.length < 2) return [];
  const headers = rows.shift().map((item) => item.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  return rows.map((values) => Object.fromEntries(headers.map((key, index) => [key, values[index] ?? ""])));
}

function readProductForm(product) {
  if (!product) return blankProduct();
  return {
    ...blankProduct(), ...product,
    type: String(product.type || "simple").toLowerCase() === "variable" ? "variable" : "simple",
    tags: Array.isArray(product.tags) ? product.tags : String(product.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    categoryIds: Array.isArray(product.categoryIds) ? product.categoryIds.map(String) : product.categoryId ? [String(product.categoryId)] : [],
    attributes: Array.isArray(product.attributes) ? product.attributes.map((a) => ({
      id: a.id ?? a.attributeId ?? a.attribute_id ?? a.slug ?? a.name,
      name: a.name || a.title || "",
      options: normalizeAttributeOptions(a.options ?? a.terms ?? a.values),
      variation: true,
    })) : [],
    variations: Array.isArray(product.variations) ? product.variations.map((v) => ({ ...v, attributes: Array.isArray(v.attributes) ? v.attributes : [], sku: v.sku || "", price: v.price ?? "", salePrice: v.salePrice ?? v.sale_price ?? "", manageStock: v.manageStock ?? v.manage_stock ?? (v.quantity != null), quantity: v.quantity ?? "", stockStatus: v.stockStatus || "instock", useParentSku: Boolean(v.useParentSku), useParentTax: v.useParentTax !== false })) : [],
  };
}

function normalizeAttributeOptions(value) {
  const values = Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : typeof value === "string" ? value.split(",") : [];
  return values.map((item) => typeof item === "string" || typeof item === "number" ? String(item) : item?.name ?? item?.value ?? item?.slug ?? "").map((item) => item.trim()).filter(Boolean);
}

function normalizeAttributeCatalog(item) {
  return {
    id: item.id ?? item.attributeId ?? item.attribute_id ?? item.slug ?? item.name,
    name: item.name || item.title || "Unnamed attribute",
    terms: normalizeAttributeOptions(item.terms ?? item.options ?? item.values),
  };
}

function buildVariationCombinations(attributes) {
  return attributes.reduce((combinations, attribute) => combinations.flatMap((combination) =>
    attribute.options.map((option) => [...combination, { id: attribute.id, name: attribute.name, option }])
  ), [[]]);
}

function variationKey(attributes = []) {
  return attributes.map((item) => [item.name, item.option ?? item.value ?? ""].join("=")).sort().join("|");
}

export default function ProductManager({ storeId, products, onSaved, onClose, initialProduct = null, initialAction = "edit", startMode = "form" }) {
  const [mode, setMode] = useState(initialProduct ? "edit" : startMode);
  const [editingProduct, setEditingProduct] = useState(initialProduct);
  const [draft, setDraft] = useState(() => readProductForm(initialProduct));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(initialAction === "delete" ? initialProduct : null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [taxClasses, setTaxClasses] = useState([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomiesError, setTaxonomiesError] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [attributeSearch, setAttributeSearch] = useState("");
  const [showAllAttributes, setShowAllAttributes] = useState(false);
  const [partialUpdate, setPartialUpdate] = useState(true);
  const fileInput = useRef(null);

  useEffect(() => {
    if (!storeId) { setCategories([]); setTags([]); setAvailableAttributes([]); setTaxClasses([]); setTaxonomyLoading(false); return undefined; }
    const controller = new AbortController();
    setTaxonomyLoading(true); setTaxonomiesError("");
    Promise.allSettled([
      getStoreCatalogTaxonomies(storeId, { signal: controller.signal }),
      getPosCurrencyTax(storeId),
    ]).then(([taxonomyResult, taxResult]) => {
      if (controller.signal.aborted) return;
      if (taxonomyResult.status === "fulfilled") {
        const raw = taxonomyResult.value?.taxonomies || taxonomyResult.value?.data?.taxonomies || taxonomyResult.value?.data || taxonomyResult.value || {};
        setCategories((Array.isArray(raw.categories) ? raw.categories : []).map((item) => ({ ...item, id: item.id ?? item.slug ?? item.name, name: item.name || item.title || "Unnamed category", parentId: item.parentId ?? item.parent_id ?? "" })));
        setTags((Array.isArray(raw.tags) ? raw.tags : []).map((item) => ({ ...item, id: item.id ?? item.slug ?? item.name, name: item.name || item.title || "Unnamed tag" })));
        setAvailableAttributes((Array.isArray(raw.attributes) ? raw.attributes : []).map(normalizeAttributeCatalog));
      } else if (taxonomyResult.reason?.name !== "AbortError") setTaxonomiesError(taxonomyResult.reason?.message || "Could not load this store’s categories and tags.");
      if (taxResult.status === "fulfilled") {
        const record = taxResult.value?.data || taxResult.value || {};
        setTaxClasses(Array.isArray(record.taxClasses) ? record.taxClasses.filter((item) => item?.name).map((item) => ({ id: item.id, name: item.name, rate: item.rate })) : []);
      }
    }).finally(() => { if (!controller.signal.aborted) setTaxonomyLoading(false); });
    return () => controller.abort();
  }, [storeId]);

  const categoryOptions = useMemo(() => {
    const list = [...categories];
    products.forEach((product) => {
      if (product.category && !list.some((item) => String(item.name).toLowerCase() === String(product.category).toLowerCase())) list.push({ id: product.categoryId || product.category, name: product.category });
    });
    return list;
  }, [categories, products]);
  const tagOptions = useMemo(() => {
    const list = [...tags];
    products.flatMap((product) => product.tags || []).forEach((name) => {
      if (!list.some((item) => String(item.name).toLowerCase() === String(name).toLowerCase())) list.push({ id: name, name });
    });
    return list;
  }, [tags, products]);

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const close = () => { setError(""); setNotice(""); onClose?.(); };

  function generateVariations() {
    if (!draft.attributes.length) { setError("Select at least one existing attribute."); return; }
    const missingOptions = draft.attributes.find((attribute) => !attribute.options?.length);
    if (missingOptions) { setError(`Select one or more options for ${missingOptions.name}.`); return; }
    const combinations = buildVariationCombinations(draft.attributes);
    if (combinations.length > 500) { setError("This selection creates more than 500 variations. Reduce the selected options and try again."); return; }
    const previous = new Map(draft.variations.map((variation) => [variationKey(variation.attributes), variation]));
    set("variations", combinations.map((attributes) => {
      const existing = previous.get(variationKey(attributes));
      const name = attributes.map((attribute) => `${attribute.name}: ${attribute.option}`).join(" / ");
      return { ...existing, name, attributes, sku: existing?.sku || "", useParentSku: Boolean(existing?.useParentSku), useParentTax: existing?.useParentTax !== false, price: existing?.price ?? "", salePrice: existing?.salePrice ?? "", manageStock: Boolean(existing?.manageStock), quantity: existing?.quantity ?? "", stockStatus: existing?.stockStatus || "instock" };
    }));
    setError("");
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!storeId) { setError("Choose a store before saving products."); return; }
    if (!draft.name.trim()) { setError("Product name is required."); return; }
    if (draft.type === "variable" && !draft.variations.length) { setError("Generate at least one variation before saving this variable product."); return; }
    const attributes = draft.attributes.filter((item) => item.name.trim()).map((item) => ({
      ...(item.id ? { id: item.id } : {}), name: item.name.trim(), options: item.options, variation: true,
    }));
    const payload = {
      name: draft.name.trim(), slug: generateSlug(draft.name), type: draft.type, sku: draft.sku.trim(), price: draft.type === "simple" ? draft.price : "",
      salePrice: draft.salePrice || "", description: draft.description, category: draft.category, categoryId: draft.categoryIds[0] || draft.categoryId, categoryIds: draft.categoryIds, brand: draft.brand,
      image: draft.image, quantity: draft.manageStock && draft.type === "simple" ? Number(draft.quantity || 0) : null,
      stockStatus: draft.stockStatus, manageStock: Boolean(draft.manageStock), lowStockAmount: draft.lowStockAmount === "" ? null : Number(draft.lowStockAmount), tags: Array.isArray(draft.tags) ? draft.tags : String(draft.tags).split(",").map((tag) => tag.trim()).filter(Boolean),
      taxStatus: draft.taxStatus, taxClass: draft.taxClass, attributes,
      variations: draft.type === "variable" ? draft.variations.map((variant) => ({
        ...(variant.id ? { id: variant.id } : {}), name: variant.name || "", slug: generateSlug(`${draft.name}-${(variant.attributes || []).map((attribute) => attribute.option ?? attribute.value ?? "").join("-")}`), sku: variant.useParentSku ? draft.sku.trim() : variant.sku || "", useParentSku: Boolean(variant.useParentSku), price: variant.price || "", salePrice: variant.salePrice || "",
        manageStock: Boolean(variant.manageStock), quantity: variant.manageStock && variant.quantity !== "" ? Number(variant.quantity) : null, stockStatus: variant.stockStatus || "instock", attributes: variant.attributes || [],
        useParentTax: variant.useParentTax !== false, taxStatus: variant.useParentTax === false ? (variant.taxStatus || draft.taxStatus) : draft.taxStatus, taxClass: variant.useParentTax === false ? (variant.taxClass ?? draft.taxClass) : draft.taxClass,
      })) : [],
    };
    setBusy(true); setError("");
    try {
      if (editingProduct?.id) await productsApi.updateProduct(storeId, editingProduct.id, payload);
      else await productsApi.createProduct(storeId, payload);
      await onSaved?.();
      close();
    } catch (cause) { setError(cause?.message || "Unable to save this product."); }
    finally { setBusy(false); }
  }

  async function deleteProduct(product) {
    if (!storeId || !product?.id) { setError("Store and product IDs are required to delete a product."); return; }
    setBusy(true); setError("");
    try {
      await productsApi.deleteProduct(storeId, product.id);
      await onSaved?.(); setDeleteTarget(null);
      if (editingProduct) close();
      else setNotice(`${product.name || "Product"} was deleted.`);
    } catch (cause) { setError(cause?.message || "Unable to delete this product."); }
    finally { setBusy(false); }
  }

  function exportProducts() {
    const headers = ["id", "name", "slug", "type", "sku", "price", "sale_price", "description", "category", "category_id", "category_ids", "brand", "image", "quantity", "low_stock_amount", "stock_status", "manage_stock", "tags", "attributes", "variations", "tax_status", "tax_class"];
    const csv = [headers, ...products.map((product) => headers.map((header) => {
      const aliases = { sale_price: ["salePrice", "sale_price"], category_id: ["categoryId", "category_id"], category_ids: ["categoryIds", "category_ids"], low_stock_amount: ["lowStockAmount", "low_stock_amount"], stock_status: ["stockStatus", "stock_status"], manage_stock: ["manageStock", "manage_stock"], tax_status: ["taxStatus", "tax_status"], tax_class: ["taxClass", "tax_class"] };
      if (header === "tags") return Array.isArray(product.tags) ? product.tags.join("|") : product.tags;
      if (header === "category_ids") return Array.isArray(product.categoryIds) ? product.categoryIds.join("|") : product.categoryIds;
      return valueOf(product, ...(aliases[header] || [header.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())]));
    }))].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "products.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  async function importProducts(event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (!storeId) { setError("Choose a store before importing products."); return; }
    setBusy(true); setError(""); setNotice("");
    let didMutate = false;
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error("The CSV has no product rows.");
      const allowed = new Set(["name", "slug", "type", "sku", "price", "sale_price", "description", "category", "category_id", "category_ids", "brand", "image", "quantity", "low_stock_amount", "stock_status", "manage_stock", "tags", "attributes", "variations", "tax_status", "tax_class"]);
      let created = 0, updated = 0, skipped = 0;
      for (const row of rows) {
        const values = Object.fromEntries(Object.entries(row).filter(([key, value]) => allowed.has(key) && value !== ""));
        if (!Object.keys(values).length) { skipped += 1; continue; }
        const toPayload = (source) => {
          const payload = {};
          const map = { sale_price: "salePrice", stock_status: "stockStatus", manage_stock: "manageStock", tax_status: "taxStatus" };
          for (const [key, value] of Object.entries(source)) {
            const target = map[key] || key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            if (["attributes", "variations"].includes(key)) payload[target] = JSON.parse(value);
            else if (key === "tags") payload.tags = value.split("|").map((tag) => tag.trim()).filter(Boolean);
            else if (key === "quantity") payload.quantity = Number(value);
            else if (key === "low_stock_amount") payload.lowStockAmount = Number(value);
            else if (key === "category_ids") payload.categoryIds = value.split("|").map((id) => id.trim()).filter(Boolean);
            else if (["manage_stock"].includes(key)) payload.manageStock = value.toLowerCase() === "true" || value === "1";
            else payload[target] = value;
          }
          return payload;
        };
        const payload = toPayload(values);
        const match = row.id ? products.find((item) => String(item.id) === row.id) : row.sku ? products.find((item) => String(item.sku || "").toLowerCase() === row.sku.toLowerCase()) : null;
        if (match) {
          await productsApi.updateProduct(storeId, match.id, partialUpdate ? payload : { ...blankProduct(), ...payload }); updated += 1; didMutate = true;
        } else {
          if (!payload.name) { skipped += 1; continue; }
          payload.slug = generateSlug(payload.name);
          await productsApi.createProduct(storeId, payload); created += 1; didMutate = true;
        }
      }
      setNotice(`Import complete: ${created} created, ${updated} updated, ${skipped} skipped.`);
    } catch (cause) { setError(cause?.message || "Unable to import products."); }
    finally { if (didMutate) await onSaved?.(); setBusy(false); }
  }

  const modalTitle = mode === "form" || mode === "edit" ? (editingProduct ? "Edit product" : "Add product") : mode === "import" ? "Import products" : "Manage products";
  const selectedCategoryIds = draft.categoryIds.length ? draft.categoryIds : draft.categoryId ? [String(draft.categoryId)] : categoryOptions.filter((item) => String(item.name).toLowerCase() === String(draft.category).toLowerCase()).map((item) => String(item.id));
  const selectedCategoryNames = categoryOptions.filter((item) => selectedCategoryIds.includes(String(item.id))).map((item) => item.name).filter(Boolean);
  const selectedTags = draft.tags.map((tag) => String(tag).trim()).filter(Boolean);
  const filteredAttributes = availableAttributes.filter((attribute) => attribute.name.toLowerCase().includes(attributeSearch.trim().toLowerCase()));
  const visibleAttributes = attributeSearch.trim() || showAllAttributes ? filteredAttributes : filteredAttributes.slice(0, 6);

  return (
    <main className="pm-page">
      <section className="pm-modal pm-page-content" aria-labelledby="pm-title">
        <header className="pm-header">
          <div><span className="pm-kicker">STORE CATALOG</span><h2 id="pm-title">{modalTitle}</h2><p>Create and manage products for this store.</p></div>
          <button type="button" className="pm-back" onClick={close}><i className="bi bi-arrow-left" aria-hidden="true" /> Back to products</button>
        </header>

        {!initialProduct && startMode !== "import" && <nav className="pm-tabs" aria-label="Product management">
          <button className={mode === "form" ? "active" : ""} onClick={() => { setEditingProduct(null); setMode("form"); setDraft(blankProduct()); }}>Create product</button>
          <button className={mode === "import" ? "active" : ""} onClick={() => setMode("import")}>Import</button>
        </nav>}

        {error && <div className="pm-alert error" role="alert">{error}</div>}
        {taxonomiesError && <div className="pm-alert error" role="status">{taxonomiesError}</div>}
        {notice && <div className="pm-alert success" role="status">{notice}</div>}

        {deleteTarget && <div className="pm-confirm-inline" role="alertdialog" aria-labelledby="pm-delete-title"><div><h3 id="pm-delete-title">Delete “{deleteTarget.name || "product"}”?</h3><p>This removes the product from this store catalog.</p></div><div className="pm-confirm-actions"><button type="button" className="pm-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="pm-danger" disabled={busy} onClick={() => deleteProduct(deleteTarget)}>{busy ? "Deleting…" : "Delete product"}</button></div></div>}

        {(mode === "form" || mode === "edit") && <form className="pm-form" onSubmit={saveProduct}>
          <div className="pm-type-picker"><label>Product type</label><div className="pm-type-options">
            {["simple", "variable"].map((type) => <button type="button" key={type} className={draft.type === type ? "selected" : ""} onClick={() => set("type", type)}><strong>{type === "simple" ? "Simple product" : "Variable product"}</strong><span>{type === "simple" ? "One product with one price and stock level." : "A product with selectable options and per-option stock."}</span></button>)}
          </div></div>
          <div className="pm-section"><h3>Product details</h3><div className="pm-grid">
            <label>Product name *<input required value={draft.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label>Slug<input value={generateSlug(draft.name)} readOnly placeholder="Generated from product name" /><small>URL-friendly identifier generated automatically.</small></label>
            <label>SKU<input value={draft.sku} onChange={(e) => set("sku", e.target.value)} /></label>
            <div className="pm-category-picker"><label>Categories</label><div className="pm-category-dropdown"><button type="button" className={`pm-tag-trigger${categoryDropdownOpen ? " open" : ""}`} aria-expanded={categoryDropdownOpen} onClick={() => { setCategoryDropdownOpen((open) => !open); setTagDropdownOpen(false); }}><span className={selectedCategoryNames.length ? "pm-selected-values" : "placeholder"}>{selectedCategoryNames.length ? selectedCategoryNames.join(", ") : "Select category"}</span><i className={`bi ${categoryDropdownOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" /></button>{categoryDropdownOpen && <div className="pm-tag-menu"><input aria-label="Search categories" placeholder="Search categories" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} autoFocus /><div className="pm-tag-menu-list">{categoryOptions.filter((item) => item.name.toLowerCase().includes(categorySearch.toLowerCase())).map((item) => { const id = String(item.id); const checked = selectedCategoryIds.includes(id); return <label key={id} className="pm-tag-menu-option"><input type="checkbox" checked={checked} onChange={(e) => { const ids = e.target.checked ? [...new Set([...selectedCategoryIds, id])] : selectedCategoryIds.filter((value) => value !== id); const names = categoryOptions.filter((option) => ids.includes(String(option.id))).map((option) => option.name); setDraft((current) => ({ ...current, categoryIds: ids, categoryId: ids[0] || "", category: names.join(", ") })); }} />{item.name}</label>; })}{!categoryOptions.length && <small>No categories are configured for this store.</small>}</div><div className="pm-dropdown-footer"><button type="button" className="pm-reset-selection" onClick={() => { setDraft((current) => ({ ...current, categoryIds: [], categoryId: "", category: "" })); setCategorySearch(""); }}>Reset</button><button type="button" className="pm-tag-done" onClick={() => setCategoryDropdownOpen(false)}>Done</button></div></div>}</div>{taxonomyLoading && <small>Loading store categories…</small>}</div>
            <label>Brand<input value={draft.brand} onChange={(e) => set("brand", e.target.value)} /></label>
            <label>Description<input type="text" placeholder="Enter product description" value={draft.description} onChange={(e) => set("description", e.target.value)} /></label>
            <div className="pm-image-picker"><label htmlFor="product-image-file">Product image</label><input id="product-image-file" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; } if (file.size > 5 * 1024 * 1024) { setError("Image must be 5 MB or smaller."); return; } const reader = new FileReader(); reader.onload = () => { set("image", String(reader.result || "")); setError(""); }; reader.onerror = () => setError("Could not read that image file."); reader.readAsDataURL(file); }} />{draft.image && <div className="pm-image-preview"><img src={draft.image} alt="Product preview" /><button type="button" className="pm-reset-selection" onClick={() => set("image", "")}>Remove image</button></div>}</div>
            <div className="pm-tag-picker"><label>Tags</label><div className="pm-tag-dropdown"><button type="button" className={`pm-tag-trigger${tagDropdownOpen ? " open" : ""}`} aria-expanded={tagDropdownOpen} onClick={() => { setTagDropdownOpen((open) => !open); setCategoryDropdownOpen(false); }}><span className={selectedTags.length ? "pm-selected-values" : "placeholder"}>{selectedTags.length ? selectedTags.join(", ") : "Select tag"}</span><i className={`bi ${tagDropdownOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" /></button>{tagDropdownOpen && <div className="pm-tag-menu"><input aria-label="Search existing tags" placeholder="Search existing tags" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} autoFocus />{taxonomyLoading ? <small>Loading store tags…</small> : <div className="pm-tag-menu-list">{tagOptions.filter((item) => item.name.toLowerCase().includes(tagSearch.toLowerCase())).map((item) => <label key={item.id} className="pm-tag-menu-option"><input type="checkbox" checked={draft.tags.includes(item.name)} onChange={(e) => set("tags", e.target.checked ? [...draft.tags, item.name] : draft.tags.filter((tag) => tag !== item.name))} />{item.name}</label>)}{!tagOptions.length && <small>No existing tags are configured for this store.</small>}{tagOptions.length > 0 && !tagOptions.some((item) => item.name.toLowerCase().includes(tagSearch.toLowerCase())) && <small>No matching tags.</small>}</div>}<div className="pm-dropdown-footer"><button type="button" className="pm-reset-selection" onClick={() => { set("tags", []); setTagSearch(""); }}>Reset</button><button type="button" className="pm-tag-done" onClick={() => setTagDropdownOpen(false)}>Done</button></div></div>}</div></div>
          </div></div>
          {draft.type === "variable" && <div className="pm-section"><h3>Tax</h3><div className="pm-grid"><label>Tax status<select value={draft.taxStatus} onChange={(e) => set("taxStatus", e.target.value)}><option value="taxable">Taxable</option><option value="shipping">Shipping only</option><option value="none">None</option></select></label><label>Tax class<select value={draft.taxClass} onChange={(e) => set("taxClass", e.target.value)}><option value="">Use store default rate</option>{taxClasses.map((item) => <option key={item.id ?? item.name} value={item.name}>{item.name}{item.rate !== undefined ? ` (${item.rate}%)` : ""}</option>)}</select>{!taxonomyLoading && !taxClasses.length && <small>No tax classes are configured for this store.</small>}</label></div></div>}
          {draft.type === "simple" ? <div className="pm-section"><h3>Pricing and inventory</h3><div className="pm-grid">
            <label>Regular price<input type="number" min="0" step="0.01" value={draft.price} onChange={(e) => set("price", e.target.value)} /></label>
            <label>Sale price<input type="number" min="0" step="0.01" value={draft.salePrice} onChange={(e) => set("salePrice", e.target.value)} /></label>
          </div><div className="pm-stock-card"><div className="pm-stock-heading"><div><strong>Track inventory</strong><span>Keep quantity and availability up to date for this product.</span></div><button type="button" className={`pm-stock-toggle ${draft.manageStock ? "enabled" : "disabled"}`} aria-pressed={draft.manageStock} onClick={() => set("manageStock", !draft.manageStock)}><i className={`bi ${draft.manageStock ? "bi-toggle-on" : "bi-toggle-off"}`} aria-hidden="true" />{draft.manageStock ? "Enabled" : "Disabled"}</button></div>{draft.manageStock && <div className="pm-stock-fields"><label>Stock quantity<input type="number" min="0" value={draft.quantity} onChange={(e) => set("quantity", e.target.value)} /></label><label>Low stock threshold<input type="number" min="0" value={draft.lowStockAmount} onChange={(e) => set("lowStockAmount", e.target.value)} placeholder="Optional" /></label></div>}<div className="pm-stock-status"><strong>Availability</strong>{[ ["instock", "In stock"], ["outofstock", "Out of stock"], ["onbackorder", "On backorder"] ].map(([value, label]) => <label key={value}><input type="radio" name="product-stock-status" checked={draft.stockStatus === value} onChange={() => set("stockStatus", value)} />{label}</label>)}</div></div></div> : <div className="pm-section"><h3>Attributes and variations</h3><p className="pm-help">Select existing attributes and their values to create variations.</p>
            <label className="pm-attribute-search-wrap"><i className="bi bi-search" aria-hidden="true" /><input className="pm-attribute-search" type="search" aria-label="Search attributes" placeholder="Search existing attributes" value={attributeSearch} onChange={(event) => { setAttributeSearch(event.target.value); setShowAllAttributes(false); }} /></label>
            <div className="pm-attribute-library">{visibleAttributes.map((attribute) => { const checked = draft.attributes.some((item) => String(item.id) === String(attribute.id)); return <label className="pm-attribute-choice" key={attribute.id}><input type="checkbox" checked={checked} onChange={(event) => set("attributes", event.target.checked ? [...draft.attributes, { id: attribute.id, name: attribute.name, options: [], variation: true }] : draft.attributes.filter((item) => String(item.id) !== String(attribute.id)))} /><span><strong>{attribute.name}</strong><small>{attribute.terms.length} existing options</small></span></label>; })}{!taxonomyLoading && !availableAttributes.length && <p className="pm-help">No existing product attributes are configured for this store.</p>}{filteredAttributes.length === 0 && availableAttributes.length > 0 && <p className="pm-help">No matching attributes.</p>}</div>{!attributeSearch.trim() && filteredAttributes.length > 6 && <button type="button" className="pm-attribute-more" onClick={() => setShowAllAttributes((visible) => !visible)}>{showAllAttributes ? "Show fewer" : `+${filteredAttributes.length - 6} more`}</button>}
            {draft.attributes.map((attribute, index) => { const catalogAttribute = availableAttributes.find((item) => String(item.id) === String(attribute.id)); return <div className="pm-attribute-block" key={attribute.id || attribute.name}><div className="pm-attribute-block-heading"><h4>{attribute.name}</h4><button type="button" className="pm-link danger" onClick={() => set("attributes", draft.attributes.filter((_, i) => i !== index))}>Remove attribute</button></div><div className="pm-attribute-values">{(catalogAttribute?.terms || attribute.options).map((option) => <label className="pm-attribute-value" key={option}><input type="checkbox" checked={attribute.options.includes(option)} onChange={(event) => set("attributes", draft.attributes.map((item, i) => i === index ? { ...item, options: event.target.checked ? [...new Set([...item.options, option])] : item.options.filter((value) => value !== option) } : item))} />{option}</label>)}{!catalogAttribute?.terms?.length && !attribute.options.length && <small>No existing values are available for this attribute.</small>}</div></div>; })}
            <div className="pm-generate-row"><button type="button" className="pm-primary" onClick={generateVariations} disabled={!draft.attributes.length || draft.attributes.some((attribute) => !attribute.options.length)}>Generate variations</button><span>{draft.variations.length} variation{draft.variations.length === 1 ? "" : "s"}</span></div>
            {draft.variations.map((variant, index) => <div className="pm-variation" key={variant.id || variationKey(variant.attributes) || `variation-${index}`}>
              <div className="pm-variation-title"><span>Variation {index + 1}: {variant.attributes?.map((attribute) => `${attribute.name}: ${attribute.option ?? attribute.value ?? ""}`).join(" / ") || variant.name}</span><button type="button" className="pm-link danger" onClick={() => set("variations", draft.variations.filter((_, i) => i !== index))}>Remove</button></div>
              <div className="pm-variation-parent-choice"><label><input type="checkbox" checked={Boolean(variant.useParentSku)} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, useParentSku: e.target.checked } : item))} /> Use parent SKU</label><label><input type="checkbox" checked={variant.useParentTax !== false} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, useParentTax: e.target.checked } : item))} /> Use parent tax settings</label><label><input type="checkbox" checked={Boolean(variant.manageStock)} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, manageStock: e.target.checked } : item))} /> Manage stock</label></div>
              <div className="pm-grid"><label>SKU<input value={variant.useParentSku ? draft.sku : variant.sku} disabled={Boolean(variant.useParentSku)} placeholder={variant.useParentSku ? "Using parent SKU" : "Enter a variation SKU"} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, sku: e.target.value } : item))} /></label><label>Regular price<input type="number" min="0" step="0.01" value={variant.price} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, price: e.target.value } : item))} /></label><label>Sale price<input type="number" min="0" step="0.01" value={variant.salePrice || ""} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, salePrice: e.target.value } : item))} /></label>{variant.manageStock && <label>Stock quantity<input type="number" min="0" value={variant.quantity} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item))} /></label>}<label>Stock status<select value={variant.stockStatus} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, stockStatus: e.target.value } : item))}><option value="instock">In stock</option><option value="outofstock">Out of stock</option><option value="onbackorder">On backorder</option></select></label>{variant.useParentTax === false && <><label>Tax status<select value={variant.taxStatus || "taxable"} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, taxStatus: e.target.value } : item))}><option value="taxable">Taxable</option><option value="shipping">Shipping only</option><option value="none">None</option></select></label><label>Tax class<select value={variant.taxClass ?? draft.taxClass} onChange={(e) => set("variations", draft.variations.map((item, i) => i === index ? { ...item, taxClass: e.target.value } : item))}><option value="">Use store default rate</option>{taxClasses.map((item) => <option key={item.id ?? item.name} value={item.name}>{item.name}{item.rate !== undefined ? ` (${item.rate}%)` : ""}</option>)}</select></label></>}</div>
            </div>)}
          </div>}
          {draft.type === "simple" && <div className="pm-section"><h3>Tax</h3><div className="pm-grid"><label>Tax status<select value={draft.taxStatus} onChange={(e) => set("taxStatus", e.target.value)}><option value="taxable">Taxable</option><option value="shipping">Shipping only</option><option value="none">None</option></select></label><label>Tax class<select value={draft.taxClass} onChange={(e) => set("taxClass", e.target.value)}><option value="">Use store default rate</option>{taxClasses.map((item) => <option key={item.id ?? item.name} value={item.name}>{item.name}{item.rate !== undefined ? ` (${item.rate}%)` : ""}</option>)}</select>{!taxonomyLoading && !taxClasses.length && <small>No tax classes are configured for this store.</small>}</label></div></div>}
          <footer className="pm-footer">{editingProduct && <button type="button" className="pm-danger pm-form-delete" onClick={() => setDeleteTarget(editingProduct)}>Delete product</button>}<button type="button" className="pm-secondary" onClick={close}>Cancel</button><button type="submit" className="pm-primary" disabled={busy}>{busy ? "Saving…" : editingProduct ? "Save changes" : "Create product"}</button></footer>
        </form>}

        {mode === "import" && <div className="pm-import"><h3>Import products from CSV</h3><p>Use a CSV exported here or create a file with columns such as <code>sku,name,price,quantity</code>. Rows matching an existing ID or SKU update that product.</p>
          <label className="pm-check"><input type="checkbox" checked={partialUpdate} onChange={(e) => setPartialUpdate(e.target.checked)} /> Partial update: only change fields supplied in the CSV; keep all other values as they are.</label>
          <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={importProducts} disabled={busy} />
          <div className="pm-template"><strong>Partial update example</strong><pre>sku,price,quantity{`\n`}SKU-100,12.50,8</pre><span>Only price and quantity are changed for SKU-100.</span></div>
          <footer className="pm-footer"><button className="pm-secondary" type="button" onClick={exportProducts}>Export current products</button><button className="pm-primary" type="button" onClick={() => fileInput.current?.click()} disabled={busy}>{busy ? "Importing…" : "Choose CSV file"}</button></footer>
        </div>}

      </section>
    </main>
  );
}
