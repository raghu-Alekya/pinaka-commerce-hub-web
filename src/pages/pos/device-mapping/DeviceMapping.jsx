import { useEffect, useMemo, useState } from "react";
import { devicesApi } from "../../../api/devices";
import { ApiError } from "../../../api/http";
import "../../../styles/merchant-vendors.css";
import { ConfigFooter, useConfigState, usePosSettings, useSaveAction } from "../shared";

const pageSize = 10;

export function DeviceMapping() {
  const settings = usePosSettings();
  const [devices, setDevices] = useState([]);
  const [mappings, setMappings] = useConfigState("deviceMappings", []);
  const [view, setView] = useState("mapped");
  const [selection, setSelection] = useState([]);
  const [search, setSearch] = useState("");
  const [mappedSearch, setMappedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mappedPage, setMappedPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    devicesApi.list().then((items) => {
      if (active) setDevices(items.filter((device) => String(device.merchantId) === String(settings.merchantId) && String(device.status).toLowerCase() !== "inactive"));
    }).catch((cause) => {
      if (!(cause instanceof ApiError && cause.status === 404) && active) setError(cause?.message || "Unable to load merchant devices.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [settings.merchantId]);

  const mappedIds = useMemo(() => new Set(mappings.map((item) => String(item.deviceId))), [mappings]);
  const available = useMemo(() => devices.filter((device) => !mappedIds.has(String(device.id)) && [device.name, device.type, device.serial, device.code, device.deviceCode, device.status].join(" ").toLowerCase().includes(search.trim().toLowerCase())), [devices, mappedIds, search]);
  const filteredMappings = useMemo(() => mappings.filter((device) => [device.name, device.type, device.serial, device.code].join(" ").toLowerCase().includes(mappedSearch.trim().toLowerCase())), [mappings, mappedSearch]);
  const pageCount = Math.max(1, Math.ceil(available.length / pageSize));
  const mappedPageCount = Math.max(1, Math.ceil(filteredMappings.length / pageSize));
  const pageRows = available.slice((page - 1) * pageSize, page * pageSize);
  const mappedRows = filteredMappings.slice((mappedPage - 1) * pageSize, mappedPage * pageSize);
  const toggleSelection = (id) => setSelection((current) => current.includes(String(id)) ? current.filter((item) => item !== String(id)) : [...current, String(id)]);
  const openPicker = () => { setSelection([]); setSearch(""); setPage(1); setError(""); setView("picker"); };
  const addSelected = () => {
    const selected = devices.filter((device) => selection.includes(String(device.id)) && !mappedIds.has(String(device.id)));
    if (!selected.length) return;
    setMappings((current) => [...current, ...selected.map((device) => ({ deviceId: device.id, name: device.name, code: device.code || device.deviceCode, type: device.type, serial: device.serial, status: device.status || "Active" }))]);
    setSelection([]);
    setMappedPage(1);
    setView("mapped");
  };
  const save = useSaveAction(async () => {
    settings.session.baseline = { ...settings.session.draft };
    setError("");
    return true;
  });
  const backToMapped = () => { setView("mapped"); setSelection([]); setError(""); };

  if (view === "picker") return <section className="merchant-vendors mv-create-page mv-existing-page mv-device-picker">
    <header className="mv-card mv-header">
      <div><h2>Add Existing Device</h2><p>Choose one or more devices to map to this store.</p></div>
      <button type="button" onClick={backToMapped}>← Back to Mapped Devices</button>
    </header>
    <div className="mv-existing-content">
      <p className="mv-device-scope">Only active devices registered to this merchant are available.</p>
      {error && <p role="alert" className="mv-error">{error}</p>}
      <div className="mv-existing-toolbar mv-device-toolbar">
        <input className="mv-search" aria-label="Search devices" placeholder="Search devices by name, code, type or serial…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        <button type="button" onClick={() => { setSearch(""); setPage(1); setSelection([]); }}>Clear filters</button>
      </div>
      <div className="mv-picker-summary"><span>{available.length} matching devices · {selection.length} selected</span></div>
      <div className="mv-existing-table-wrap"><table>
        <thead><tr><th>Select</th><th>Device Code</th><th>Device Name</th><th>Device Type</th><th>Serial Number</th><th>Status</th></tr></thead>
        <tbody>
          {pageRows.map((device) => { const selected = selection.includes(String(device.id)); return <tr key={device.id} className={selected ? "mv-row-selected" : ""} aria-selected={selected} onClick={(event) => { if (!event.target.closest("input,button,a,select")) toggleSelection(device.id); }}>
            <td><input type="checkbox" aria-label={`Select ${device.name}`} checked={selected} onChange={() => toggleSelection(device.id)} /></td>
            <td>{device.code || device.deviceCode || "—"}</td><td><strong>{device.name || "—"}</strong></td><td>{device.type || "—"}</td><td>{device.serial || "—"}</td><td>{device.status || "Active"}</td>
          </tr>; })}
          {!loading && !pageRows.length && <tr><td colSpan="6">No unassigned devices found for this merchant.</td></tr>}
          {loading && <tr><td colSpan="6" role="status">Loading merchant devices…</td></tr>}
        </tbody>
      </table></div>
      <nav className="mv-picker-pagination" aria-label="Device pages"><span>Showing {available.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, available.length)} of {available.length}</span>
        <div className="mv-popup-actions"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</button></div>
      </nav>
    </div>
    <footer className="mv-existing-footer"><span>{selection.length} devices selected</span><div className="mv-popup-actions"><button type="button" onClick={backToMapped}>Cancel</button><button type="button" disabled={!selection.length} className="mv-primary" onClick={addSelected}>Add Selected</button></div></footer>
  </section>;

  return <section className="merchant-vendors mv-device-mapped-page">
    <header className="mv-card mv-header"><div><h2>Devices</h2><p>These are the devices mapped to this store.</p></div><button type="button" className="mv-primary" onClick={openPicker}>＋ Add Existing Device</button></header>
    {error && <p role="alert" className="mv-error">{error}</p>}
    <section className="mv-card mv-device-list-card">
      <h3>Mapped Device List</h3>
      <div className="mv-toolbar"><div className="mv-toolbar-left"><input aria-label="Search mapped devices" placeholder="Search devices by name, type or serial…" value={mappedSearch} onChange={(event) => { setMappedSearch(event.target.value); setMappedPage(1); }} /></div><button type="button" className="mv-reset" onClick={() => { setMappedSearch(""); setMappedPage(1); }}>↺ Reset</button></div>
      <div className="mv-scroll"><table><thead><tr><th>Device Name</th><th>Device Code</th><th>Device Type</th><th>Serial Number</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {mappedRows.map((device) => <tr key={device.deviceId}><td><strong>{device.name || "—"}</strong></td><td>{device.code || "—"}</td><td>{device.type || "—"}</td><td>{device.serial || "—"}</td><td>{device.status || "Active"}</td><td><button type="button" className="mv-device-remove" onClick={() => setMappings((current) => current.filter((item) => String(item.deviceId) !== String(device.deviceId)))}>Remove</button></td></tr>)}
        {!mappedRows.length && <tr><td colSpan="6">No mapped devices match. Use Add Existing Device to select from merchant devices.</td></tr>}
      </tbody></table></div>
      <nav className="mv-picker-pagination" aria-label="Mapped device pages"><span>Showing {filteredMappings.length ? (mappedPage - 1) * pageSize + 1 : 0}–{Math.min(mappedPage * pageSize, filteredMappings.length)} of {filteredMappings.length} entries</span>
        <div className="mv-popup-actions"><button type="button" disabled={mappedPage === 1} onClick={() => setMappedPage(mappedPage - 1)}>Previous</button><span>Page {mappedPage} of {mappedPageCount}</span><button type="button" disabled={mappedPage === mappedPageCount} onClick={() => setMappedPage(mappedPage + 1)}>Next</button></div>
      </nav>
      <ConfigFooter message="Mapping changes are saved with POS Configuration." onBack={() => settings.requestLeave(null)} onSave={save} />
    </section>
  </section>;
}
