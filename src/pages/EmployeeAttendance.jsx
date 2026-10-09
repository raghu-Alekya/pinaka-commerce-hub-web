import { useMemo, useState } from "react";
import "../styles/employee-attendance.css";

// Local UI fixtures until the attendance service is available.
const INITIAL_RECORDS = [
  { id: 1, date: "2026-10-08", code: "EMP001", name: "Ravi Kumar", clockIn: "08:05", clockOut: "16:32", total: "8h 27m", detailClockOut: "12:30", detailTotal: "4h 25m", status: "Present" },
  { id: 2, date: "2026-10-08", code: "EMP002", name: "Priya Sharma", clockIn: "09:10", clockOut: "18:05", total: "8h 55m", status: "Present" },
  { id: 3, date: "2026-10-08", code: "EMP003", name: "Suresh Reddy", clockIn: "11:30", clockOut: "20:00", total: "8h 30m", status: "Present" },
  { id: 4, date: "2026-10-07", code: "EMP001", name: "Ravi Kumar", clockIn: "08:00", clockOut: "17:15", total: "9h 15m", status: "Present" },
  { id: 5, date: "2026-10-07", code: "EMP004", name: "Anita Verma", clockIn: "08:45", clockOut: "17:30", total: "8h 45m", status: "Present" },
  { id: 6, date: "2026-10-06", code: "EMP005", name: "Venkatesh R", clockIn: "09:20", clockOut: "", total: "—", status: "Absent" },
  { id: 7, date: "2026-10-06", code: "EMP002", name: "Priya Sharma", clockIn: "09:00", clockOut: "18:00", total: "9h 00m", status: "Present" },
  { id: 8, date: "2026-10-06", code: "EMP003", name: "Suresh Reddy", clockIn: "10:00", clockOut: "19:15", total: "9h 15m", status: "Present" },
  { id: 9, date: "2026-10-05", code: "EMP005", name: "Venkatesh R", clockIn: "09:15", clockOut: "13:30", total: "4h 15m", status: "Present" },
  { id: 10, date: "2026-10-04", code: "EMP001", name: "Ravi Kumar", clockIn: "08:10", clockOut: "17:45", total: "9h 35m", status: "Present" },
];

const displayDate = (value) => value
  ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  : "—";
const displayTime = (value) => {
  if (!value) return "—";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const EMPLOYEE_PROFILES = {
  EMP001: { phone: "+91 98765 43210", email: "ravi.kumar@pinaka.com", role: "Cashier", employmentType: "Full Time", joiningDate: "2025-08-15" },
  EMP002: { phone: "+91 98765 43211", email: "priya.sharma@pinaka.com", role: "Store Associate", employmentType: "Full Time", joiningDate: "2025-09-02" },
  EMP003: { phone: "+91 98765 43212", email: "suresh.reddy@pinaka.com", role: "Store Associate", employmentType: "Full Time", joiningDate: "2025-06-18" },
  EMP004: { phone: "+91 98765 43213", email: "anita.verma@pinaka.com", role: "Supervisor", employmentType: "Full Time", joiningDate: "2025-07-10" },
  EMP005: { phone: "+91 98765 43214", email: "venkatesh.r@pinaka.com", role: "Store Associate", employmentType: "Part Time", joiningDate: "2025-10-01" },
};

export function AttendanceDetails({ record, store, onBack }) {
  const profile = EMPLOYEE_PROFILES[record.code] || {};
  const date = new Date(`${record.date}T12:00:00`);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const initials = record.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const remarks = record.id === 1 ? [
    { text: "Left for personal work (Approved).", addedOn: "08 Oct 2026, 12:40 PM" },
    { text: "Early leave approved due to urgent work.", addedOn: "08 Oct 2026, 01:10 PM" },
  ] : [];
  return <div className="ea-details-page">
    <header className="ea-details-heading"><div><h2>Employee Attendance – View Details</h2><p>View attendance information for the selected date.</p></div><button type="button" onClick={onBack}><i className="bi bi-arrow-left" /> Back to Attendance</button></header>
    <section className="ea-details-card"><h3>Employee Overview</h3><div className="ea-profile-grid">
      <div className="ea-profile-primary"><span className="ea-avatar">{initials}</span><dl><div><dt>Employee Code</dt><dd>{record.code}</dd></div><div><dt>Employee Name</dt><dd>{record.name}</dd></div><div><dt>Role</dt><dd>{profile.role || "—"}</dd></div></dl></div>
      <dl><div><dt>Phone</dt><dd>{profile.phone || "—"}</dd></div><div><dt>Email</dt><dd>{profile.email || "—"}</dd></div><div><dt>Employment Type</dt><dd>{profile.employmentType || "—"}</dd></div></dl>
      <dl><div><dt>Joining Date</dt><dd>{displayDate(profile.joiningDate)}</dd></div><div><dt>Default Store</dt><dd>{store?.name || "—"}</dd></div><div><dt>Status</dt><dd><span className="ea-profile-status">Active</span></dd></div></dl>
    </div></section>
    <section className="ea-details-card"><h3><i className="bi bi-calendar3" /> Attendance Record – {displayDate(record.date)} <span>({weekday})</span></h3><div className="ea-table-wrap"><table className="ea-detail-table"><thead><tr><th>#</th><th>Login Time (Clock In)</th><th>Logout Time (Clock Out)</th><th>Total Hours</th></tr></thead><tbody><tr><td>1</td><td>{displayTime(record.clockIn)}</td><td>{displayTime(record.detailClockOut || record.clockOut)}</td><td>{record.detailTotal || record.total}</td></tr></tbody></table></div></section>
    <section className="ea-details-card"><h3>Remarks – {displayDate(record.date)} <span>({weekday})</span></h3><div className="ea-table-wrap"><table className="ea-detail-table ea-remarks-table"><thead><tr><th>#</th><th>Remark</th><th>Added On</th></tr></thead><tbody>{remarks.length ? remarks.map((remark, index) => <tr key={remark.text}><td>{index + 1}</td><td>{remark.text}</td><td>{remark.addedOn}</td></tr>) : <tr><td colSpan={3} className="ea-no-remarks">No remarks available for this attendance record.</td></tr>}</tbody></table></div></section>
  </div>;
}

export default function EmployeeAttendance({ store, embedded = false, onViewRecord }) {
  const records = INITIAL_RECORDS;
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-31");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const employees = useMemo(() => [...new Map(records.map((row) => [row.code, row.name])).entries()], [records]);
  const filtered = useMemo(() => records.filter((row) =>
    (!employee || row.code === employee)
    && (!status || row.status === status)
    && (!startDate || row.date >= startDate)
    && (!endDate || row.date <= endDate)
    && (!query || `${row.name} ${row.code}`.toLowerCase().includes(query.trim().toLowerCase())),
  ), [records, employee, status, startDate, endDate, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  function exportCsv() {
    const heading = ["Date", "Employee Code", "Employee Name", "Clock In", "Clock Out", "Total Hours", "Status"];
    const rows = filtered.map((row) => [displayDate(row.date), row.code, row.name, displayTime(row.clockIn), displayTime(row.clockOut), row.total, row.status]);
    const csv = [heading, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(store?.name || "store").replace(/[^a-z0-9]+/gi, "-")}-attendance.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={`employee-attendance ${embedded ? "is-embedded" : ""}`} aria-label="Employee attendance">
      <header className="ea-header">
        <div><h2>Employee Attendance</h2><p>View and manage employee clock-in and clock-out records.</p></div>
        <div className="ea-header-actions">
          <label className="ea-range ea-overview-range"><i className="bi bi-calendar3" aria-hidden="true" /><input aria-label="Attendance start date" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} /><span>–</span><input aria-label="Attendance end date" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} /></label>
          <button className="ea-export" type="button" onClick={exportCsv}><i className="bi bi-download" aria-hidden="true" /> Export</button>
        </div>
      </header>

      <div className="ea-toolbar">
        <form className="ea-search" onSubmit={(event) => { event.preventDefault(); setPage(1); }}><i className="bi bi-search" aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search employees..." aria-label="Search employee attendance" /></form>
        <label className="ea-inline-filter"><span className="sr-only">Employee</span><select value={employee} onChange={(event) => { setEmployee(event.target.value); setPage(1); }}><option value="">All Employees</option>{employees.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label>
        <label className="ea-inline-filter"><span className="sr-only">Status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All Statuses</option><option>Present</option><option>Absent</option></select></label>
        <button type="button" className="ea-reset" onClick={() => { setEmployee(""); setStatus(""); setQuery(""); setStartDate("2026-10-01"); setEndDate("2026-10-31"); setPage(1); }}><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /> Reset</button>
      </div>

      <div className="ea-table-wrap"><table className="ea-table"><thead><tr><th>Date <i className="bi bi-chevron-expand" /></th><th>Employee Code</th><th>Employee Name</th><th>Clock In <i className="bi bi-chevron-expand" /></th><th>Clock Out <i className="bi bi-chevron-expand" /></th><th>Total Hours <i className="bi bi-chevron-expand" /></th><th>Status <i className="bi bi-chevron-expand" /></th><th>Actions</th></tr></thead>
        <tbody>{pageRows.map((row) => <tr key={row.id}><td>{displayDate(row.date)}</td><td>{row.code}</td><td>{row.name}</td><td>{displayTime(row.clockIn)}</td><td>{displayTime(row.clockOut)}</td><td>{row.total}</td><td><span className={`ea-status ${row.status.toLowerCase()}`}>{row.status}</span></td><td><div className="ea-row-actions"><button type="button" title={`View ${row.name} attendance`} aria-label={`View ${row.name} attendance`} onClick={() => onViewRecord?.(row)}><i className="bi bi-eye" /></button></div></td></tr>)}
          {!pageRows.length && <tr><td colSpan={8} className="ea-empty">No attendance records match these filters.</td></tr>}
        </tbody></table></div>
      <footer className="ea-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} records</span><div><label><span className="sr-only">Rows per page</span><select value={pageSize} disabled><option value={10}>10 per page</option></select></label><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>‹</button><span>{page} / {totalPages}</span><button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>›</button></div></footer>

    </section>
  );
}
