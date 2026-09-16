import { useMemo, useState } from "react";

const initialVendors = [
  {
    id: 1,
    name: "Freshline Foods",
    code: "VEN-001",
    contact: "Maya Patel",
    phone: "+1 (512) 555-0148",
    email: "maya@freshline.example",
    address: "120 Market Street, Austin, TX",
    category: "Food & Beverage",
    status: "Active",
    changedBy: "Admin",
    changedAt: "Sep 12, 2026",
  },
  {
    id: 2,
    name: "Northstar Equipment",
    code: "VEN-002",
    contact: "Jordan Lee",
    phone: "+1 (512) 555-0192",
    email: "jordan@northstar.example",
    address: "44 Industrial Drive, Dallas, TX",
    category: "Equipment",
    status: "Active",
    changedBy: "Admin",
    changedAt: "Sep 10, 2026",
  },
];

const emptyForm = {
  name: "",
  code: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
  category: "",
  status: "Active",
};

export default function Vendors() {
  const [vendors, setVendors] = useState(initialVendors);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesSearch = !query || Object.values(vendor).join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All Statuses" || vendor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vendors, search, statusFilter]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function saveVendor(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    const vendorData = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      changedBy: "Admin",
      changedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    if (editingId) {
      setVendors((current) => current.map((vendor) => vendor.id === editingId ? { ...vendor, ...vendorData } : vendor));
    } else {
      setVendors((current) => [{ ...vendorData, id: Date.now() }, ...current]);
    }
    resetForm();
  }

  function editVendor(vendor) {
    setEditingId(vendor.id);
    setForm({
      name: vendor.name,
      code: vendor.code,
      contact: vendor.contact,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      category: vendor.category,
      status: vendor.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="vendors-page">
      <div className="vendors-header">
        <div>
          <h1>{editingId ? "Edit Vendor" : "Vendors"}</h1>
          <p>Manage supplier contacts, categories, and vendor status.</p>
        </div>
      </div>

      <form className="vendors-form" onSubmit={saveVendor}>
        <div className="vendors-form-heading">
          <h2>{editingId ? "Update Vendor" : "Add Vendor"}</h2>
          {editingId && <button type="button" className="vendors-link-button" onClick={resetForm}>Cancel edit</button>}
        </div>
        <div className="vendors-form-grid">
          <label>Vendor Name *<input name="name" value={form.name} onChange={handleChange} placeholder="Enter vendor name" required /></label>
          <label>Unique Code *<input name="code" value={form.code} onChange={handleChange} placeholder="e.g. VEN-003" required /></label>
          <label>Contact Person<input name="contact" value={form.contact} onChange={handleChange} placeholder="Contact person" /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" /></label>
          <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email address" /></label>
          <label>Product / Category<input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Food & Beverage" /></label>
          <label className="vendors-wide-field">Address<textarea name="address" value={form.address} onChange={handleChange} placeholder="Vendor address" rows="2" /></label>
          <label>Status<select name="status" value={form.status} onChange={handleChange}><option>Active</option><option>Inactive</option></select></label>
        </div>
        <div className="vendors-form-actions">
          <button type="button" className="vendors-clear-button" onClick={resetForm}>Clear</button>
          <button type="submit" className="vendors-save-button">{editingId ? "Save Changes" : "Create Vendor"}</button>
        </div>
      </form>

      <div className="vendors-list-card">
        <div className="vendors-list-toolbar">
          <div><h2>Vendors List</h2><p>{filteredVendors.length} supplier{filteredVendors.length === 1 ? "" : "s"} found</p></div>
          <div className="vendors-filters">
            <div className="vendors-search"><i className="bi bi-search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vendors..." /></div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All Statuses</option><option>Active</option><option>Inactive</option></select>
          </div>
        </div>
        <div className="vendors-table-wrap">
          <table className="vendors-table"><thead><tr><th>Vendor</th><th>Code</th><th>Contact</th><th>Phone / Email</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filteredVendors.map((vendor) => <tr key={vendor.id}><td><strong>{vendor.name}</strong><small>{vendor.address}</small></td><td>{vendor.code}</td><td>{vendor.contact || "—"}</td><td>{vendor.phone || "—"}<small>{vendor.email || "—"}</small></td><td>{vendor.category || "—"}</td><td><span className={`vendors-status ${vendor.status.toLowerCase()}`}>{vendor.status}</span></td><td className="vendors-actions"><button type="button" onClick={() => setViewingVendor(vendor)} aria-label={`View ${vendor.name}`}><i className="bi bi-eye" /></button><button type="button" onClick={() => editVendor(vendor)} aria-label={`Edit ${vendor.name}`}><i className="bi bi-pencil" /></button></td></tr>)}</tbody>
          </table>
          {filteredVendors.length === 0 && <div className="vendors-empty">No vendors found.</div>}
        </div>
      </div>

      {viewingVendor && <div className="vendors-modal-backdrop" onClick={() => setViewingVendor(null)}><div className="vendors-modal" onClick={(event) => event.stopPropagation()}><div className="vendors-modal-heading"><div><h2>{viewingVendor.name}</h2><p>{viewingVendor.code}</p></div><button type="button" onClick={() => setViewingVendor(null)} aria-label="Close vendor details"><i className="bi bi-x-lg" /></button></div><dl>{[["Contact Person", viewingVendor.contact], ["Phone", viewingVendor.phone], ["Email", viewingVendor.email], ["Address", viewingVendor.address], ["Category", viewingVendor.category], ["Status", viewingVendor.status]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl><p className="vendors-audit">Last changed by {viewingVendor.changedBy} on {viewingVendor.changedAt}</p></div></div>}
    </section>
  );
}
