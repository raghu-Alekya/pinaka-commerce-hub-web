import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, pendingStoreRead } from "../api/http";
import FiltersBar from "../components/FiltersBar";
import Pagination from "../components/Pagination";
import BentoDetailModal from "../components/BentoDetailModal";

function formatTimestamp(value) {
  if (!value || value === "—") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return <span className="fast-key-timestamp"><strong>{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong><small>{date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</small></span>;
}

function formatTimestampInline(value) {
  if (!value || value === "—") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
}

export default function FastKeys() {
  const { storeId } = useParams();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setItems([]);
    if (!storeId) { setLoading(false); setLoadError("Store ID is required."); return; }
    const path = `/fastkeys/get-by-store-id/${encodeURIComponent(storeId)}`;
    pendingStoreRead(`fastkeys:${storeId}`, () => api.get(path))
      .then(response => {
        if (!active) return;
        const data = response?.data || response;
        if (data?.status === "error" || data?.success === false) throw new Error(data.message || "Unable to load fast keys.");
        if (!Array.isArray(data?.fastkeys)) throw new Error("Fast Keys API did not return a fastkeys array.");
        setItems(data.fastkeys.map(item => ({
          id: item.fastkey_id,
          title: item.fastkey_title || "—",
          image: item.fastkey_image || "",
          products: (Array.isArray(item.products) ? item.products : []).map(product => typeof product === "string" ? product : product.name || String(product.product_id || "")).filter(Boolean),
          employeeId: item.email || "—",
          updatedAt: item.updated_at || item.updatedAt || "",
          date: item.created_at || item.createdAt || "—",
          status: item.status || "—",
          index: Number(item.fastkey_index) || 0,
        })).sort((a, b) => a.index - b.index));
      }).catch(error => { if (active) setLoadError(error.message || "Unable to load fast keys."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [storeId, attempt]);

  const filtered = useMemo(() => items.filter(item => {
    const matchesTab = tab === "all" || item.status === "Published";
    const searchText = `${item.title} ${item.employeeId} ${item.products.join(" ")}`.toLowerCase();
    return matchesTab && searchText.includes(search.toLowerCase()) && (!statusFilter || String(item.status || "").toLowerCase() === statusFilter.toLowerCase());
  }), [items, search, tab, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [search, tab, statusFilter]);
  useEffect(() => { setCurrentPage(page => Math.min(page, totalPages)); }, [totalPages]);

  const isImageUrl = value => typeof value === "string" && (value.startsWith("blob:") || value.startsWith("data:image/") || value.startsWith("http://") || value.startsWith("https://"));

  return (
    <div className="fast-keys-panel" aria-busy={loading}>
      {loading && <p role="status">Loading fast keys…</p>}
      {loadError && <p role="alert">{loadError} <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry</button></p>}
      <div className="fast-keys-heading">
        <div><h2>Fast Keys</h2><p>Manage fast keys for this store. Fast keys allow quick access to products in POS.</p></div>
      </div>
      <FiltersBar
        className="fast-key-toolbar"
        searchValue={search}
        onSearchChange={value => { setSearch(value); setCurrentPage(1); }}
        searchPlaceholder="Search fast keys..."
        searchAriaLabel="Search fast keys"
        filters={[{ key: "status", label: "Filter fast keys by status", value: statusFilter, onChange: value => { setStatusFilter(value); setCurrentPage(1); }, options: [{ label: "All Statuses", value: "" }, ...[...new Set(items.map(item => String(item.status || "")).filter(status => status && status !== "—"))].map(status => ({ label: status, value: status }))] }]}
        onClear={() => { setSearch(""); setStatusFilter(""); setCurrentPage(1); }}
        clearLabel="Reset"
      />
      <div className="fast-key-table-wrap">
        <table className="fast-key-table">
          <thead><tr><th>Image</th><th>Title</th><th>Products</th><th>Created By</th><th>Created At</th><th>Updated At</th></tr></thead>
          <tbody>
            {pageItems.length ? pageItems.map(item => (
              <tr
                key={item.id}
                className="fast-key-row"
                onClick={() => setSelectedItem(item)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedItem(item);
                  }
                }}
                tabIndex={0}
              >
                <td><div className="fast-key-image">{isImageUrl(item.image) && !failedImages[item.id] && !/no-image/i.test(item.image) ? <img src={item.image} alt={item.title} onError={() => setFailedImages(current => ({ ...current, [item.id]: true }))} /> : <span className="fast-key-no-image"><i className="bi bi-image" /><small>No image</small></span>}</div></td>
                <td><strong>{item.title}</strong></td>
                <td><div className="fast-key-products"><small>{item.products.length} products</small>{item.products.length ? <div className="fast-key-product-chips"><span className="fast-key-product-chip">{item.products[0]}</span>{item.products.length > 1 && <button type="button" className="fast-key-more" aria-label={`View ${item.products.length - 1} more products`} onClick={event => { event.stopPropagation(); setSelectedItem(item); }}>+{item.products.length - 1}</button>}</div> : <span>—</span>}</div></td>
                <td><span className="fast-key-employee">{item.employeeId}</span></td>
                <td>{formatTimestamp(item.date)}</td><td>{formatTimestamp(item.updatedAt)}</td>
              </tr>
            )) : <tr><td className="fast-key-table-empty-cell" colSpan="6">{loading ? "Loading fast keys..." : loadError ? "Fast keys could not be loaded." : "No fast keys found."}</td></tr>}
          </tbody>
        </table>
      </div>
      {!loading && !loadError && <div className="fast-key-footer"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={itemsPerPage} onPageSizeChange={pageSize => { setItemsPerPage(pageSize); setCurrentPage(1); }} totalItems={filtered.length} itemLabel="fast keys" showWhenEmpty /></div>}
      <BentoDetailModal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        headerIcon="bi-key"
        title="Fast Key Details"
        containerClassName="fast-key-detail-modal"
        hero={selectedItem ? {
          icon: "bi-key",
          title: selectedItem.title,
          subtitle: <>{selectedItem.employeeId} · <span className="fast-key-modal-date">{formatTimestampInline(selectedItem.date)}</span></>,
          status: selectedItem.status,
          metricLabel: "PRODUCTS",
          metricValue: String(selectedItem.products.length),
        } : null}
        layout="bento-vertical"
        compactSpacing
        maxWidth="560px"
      >
        {selectedItem && <section className="fast-key-products-detail">
          <h3>PRODUCTS BREAKDOWN</h3>
          <div className="fast-key-products-head"><span>PRODUCT</span><span className="fast-key-product-number">#</span></div>
          <div className="fast-key-products-rows">
            {selectedItem.products.length
              ? selectedItem.products.map((name, index) => <div className="fast-key-products-row" key={`${name}-${index}`}><span>{name}</span><span className="fast-key-product-number">{index + 1}</span></div>)
              : <p>No products assigned to this fast key.</p>}
          </div>
          <div className="fast-key-products-summary"><span>Total Products:</span><strong>{selectedItem.products.length}</strong></div>
        </section>}
      </BentoDetailModal>
    </div>
  );
}
