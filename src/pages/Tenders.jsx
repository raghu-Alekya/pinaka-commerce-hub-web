import { useMemo, useState } from "react";

const initialTenders = [
  {
    id: 1,
    name: "Cash",
    code: "TND-CASH",
    type: "Cash",
    availability: "All stores",
    splitPayment: true,
    refund: true,
    void: true,
    status: "Active",
    changedBy: "Admin",
    changedAt: "Sep 12, 2026",
  },
  {
    id: 2,
    name: "Visa and Mastercard",
    code: "TND-CARD",
    type: "Card",
    availability: "Selected merchants",
    splitPayment: false,
    refund: true,
    void: true,
    status: "Active",
    changedBy: "Admin",
    changedAt: "Sep 10, 2026",
  },
];

const emptyForm = {
  name: "",
  code: "",
  type: "Cash",
  availability: "All stores",
  splitPayment: false,
  refund: false,
  void: false,
  status: "Active",
};

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Tenders() {
  const [tenders, setTenders] = useState(initialTenders);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [viewingTender, setViewingTender] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filteredTenders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tenders.filter((tender) => {
      const matchesSearch =
        !query || Object.values(tender).join(" ").toLowerCase().includes(query);
      const matchesType = typeFilter === "All Types" || tender.type === typeFilter;
      const matchesStatus =
        statusFilter === "All Statuses" || tender.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [tenders, search, typeFilter, statusFilter]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function saveTender(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    const tenderData = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      changedBy: "Admin",
      changedAt: formatDate(),
    };

    if (editingId) {
      setTenders((current) =>
        current.map((tender) =>
          tender.id === editingId ? { ...tender, ...tenderData } : tender
        )
      );
    } else {
      setTenders((current) => [{ ...tenderData, id: Date.now() }, ...current]);
    }

    resetForm();
  }

  function editTender(tender) {
    setEditingId(tender.id);
    setForm({
      name: tender.name,
      code: tender.code,
      type: tender.type,
      availability: tender.availability,
      splitPayment: tender.splitPayment,
      refund: tender.refund,
      void: tender.void,
      status: tender.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="tenders-page">
      <div className="tenders-header">
        <div>
          <h1>{editingId ? "Edit Tender" : "Tenders"}</h1>
          <p>Manage payment methods, availability, and transaction rules.</p>
        </div>
      </div>

      <form className="tenders-form" onSubmit={saveTender}>
        <div className="tenders-form-heading">
          <div className="tenders-heading-content">
            <div className="tenders-heading-icon">
              <i className="bi bi-cash-coin" />
            </div>
            <div>
              <h2>{editingId ? "Edit Tender" : "Add Tender"}</h2>
              <p>Provide the tender details and payment rules.</p>
            </div>
          </div>
          {editingId && (
            <button type="button" className="tenders-link-button" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
        <div className="tenders-form-grid">
          <label><span>Tender Name <b>*</b></span><input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Store Credit" required /></label>
          <label><span>Tender Code <b>*</b></span><input name="code" value={form.code} onChange={handleChange} placeholder="e.g. TND-CREDIT" required /></label>
          <label><span>Type</span><select name="type" value={form.type} onChange={handleChange}><option>Cash</option><option>Card</option><option>EBT</option><option>Wallet</option></select></label>
          <label><span>Availability</span><select name="availability" value={form.availability} onChange={handleChange}><option>All stores</option><option>Selected store types</option><option>Selected merchants</option><option>Selected stores</option></select></label>
          <label><span>Status</span><select name="status" value={form.status} onChange={handleChange}><option>Active</option><option>Inactive</option></select></label>
        </div>
        <div className="tenders-rules">
          <span>Payment Rules</span>
          <label><input type="checkbox" name="splitPayment" checked={form.splitPayment} onChange={handleChange} /> Allow split payment</label>
          <label><input type="checkbox" name="refund" checked={form.refund} onChange={handleChange} /> Allow refund</label>
          <label><input type="checkbox" name="void" checked={form.void} onChange={handleChange} /> Allow void</label>
        </div>
        <div className="tenders-form-actions">
          <button type="button" className="tenders-clear-button" onClick={resetForm}>Clear</button>
          <button type="submit" className="tenders-save-button">{editingId ? "Save Changes" : "Create Tender"}</button>
        </div>
      </form>

      <div className="tenders-list-card">
        <div className="tenders-list-toolbar">
          <div><h2>Tenders List</h2><p>{filteredTenders.length} payment method{filteredTenders.length === 1 ? "" : "s"} found</p></div>
          <div className="tenders-filters">
            <div className="tenders-search"><i className="bi bi-search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tenders..." /></div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All Types</option><option>Cash</option><option>Card</option><option>EBT</option><option>Wallet</option></select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All Statuses</option><option>Active</option><option>Inactive</option></select>
          </div>
        </div>
        <div className="tenders-table-wrap">
          <table className="tenders-table">
            <thead><tr><th>Tender</th><th>Code</th><th>Type</th><th>Availability</th><th>Rules</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredTenders.map((tender) => (
                <tr key={tender.id}>
                  <td><strong>{tender.name}</strong><small>{tender.type}</small></td>
                  <td>{tender.code}</td><td>{tender.type}</td>
                  <td>{tender.availability}</td>
                  <td>{[tender.splitPayment && "Split", tender.refund && "Refund", tender.void && "Void"].filter(Boolean).join(", ") || "None"}</td>
                  <td><span className={`tenders-status ${tender.status.toLowerCase()}`}>{tender.status}</span></td>
                  <td className="tenders-actions"><button type="button" onClick={() => setViewingTender(tender)} aria-label={`View ${tender.name}`}><i className="bi bi-eye" /></button><button type="button" onClick={() => editTender(tender)} aria-label={`Edit ${tender.name}`}><i className="bi bi-pencil" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTenders.length === 0 && <div className="tenders-empty">No tenders found.</div>}
        </div>
      </div>

      {viewingTender && (
        <div className="tenders-modal-backdrop" onClick={() => setViewingTender(null)}>
          <div className="tenders-modal" onClick={(event) => event.stopPropagation()}>
            <div className="tenders-modal-heading"><div><h2>{viewingTender.name}</h2><p>{viewingTender.code} · {viewingTender.type}</p></div><button type="button" onClick={() => setViewingTender(null)} aria-label="Close tender details"><i className="bi bi-x-lg" /></button></div>
            <dl>{[["Availability", viewingTender.availability], ["Status", viewingTender.status], ["Split Payment", viewingTender.splitPayment ? "Allowed" : "Not allowed"], ["Refund", viewingTender.refund ? "Allowed" : "Not allowed"], ["Void", viewingTender.void ? "Allowed" : "Not allowed"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "All"}</dd></div>)}</dl>
            <p className="tenders-audit">Last changed by {viewingTender.changedBy} on {viewingTender.changedAt}</p>
          </div>
        </div>
      )}
    </section>
  );
}
