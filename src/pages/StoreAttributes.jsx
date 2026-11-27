import { useState } from "react";
import StoreTaxonomy from "./StoreTaxonomy";
import "../styles/store-attributes.css";

function ConfigureAttributeTerms({ attribute, onClose, onAddItem }) {
  const [itemName, setItemName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!itemName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onAddItem(itemName.trim());
      setItemName("");
    } catch (submitError) {
      setError(submitError?.message || "Could not add this item.");
    } finally {
      setSaving(false);
    }
  };

  return <main className="configure-attribute-page">
    <header className="configure-attribute-header"><div><h2>Configure Terms</h2><p>Manage the available items for {attribute.name}.</p></div><button type="button" className="configure-attribute-back" onClick={onClose}><i className="bi bi-arrow-left" /> Back to Attributes</button></header>
    <section className="configure-attribute-card">
      <div className="configure-attribute-card-heading"><span className="configure-attribute-icon"><i className="bi bi-list-check" /></span><div><h3>{attribute.name} items</h3><p>Add terms that can be assigned to products.</p></div></div>
      <form className="configure-attribute-add-form" onSubmit={submit}><label htmlFor="attribute-item-name">Item name</label><div><input id="attribute-item-name" value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="Enter item name" /><button type="submit" disabled={!itemName.trim() || saving}>{saving ? "Adding…" : "Add item"}</button></div></form>
      {error && <div className="configure-attribute-error" role="alert">{error}</div>}
      <div className="configure-attribute-items"><h4>Configured items <span>{attribute.terms?.length || 0}</span></h4>{attribute.terms?.length ? <ul>{attribute.terms.map((term, index) => <li key={`${term}-${index}`}>{term}</li>)}</ul> : <p className="configure-attribute-empty">No items have been configured yet.</p>}</div>
    </section>
  </main>;
}

export default function StoreAttributes(props) {
  return <StoreTaxonomy {...props} initialTab="attributes" ConfigureTermsComponent={ConfigureAttributeTerms} />;
}
