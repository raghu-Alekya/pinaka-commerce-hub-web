import { EmployeeToast, EmployeeDeleteDialog } from "../components/EmployeeFeedback";
import React, { useEffect, useMemo, useState } from "react";
import { listEmployees } from "../api/employees";
import Pagination from "../components/Pagination";
import { useNavigate, useLocation } from "react-router-dom";
import { getEmployeeList, deleteEmployee } from "../api/employees";

import {
  Search,
  ChevronDown,
  Plus,
  Download,
  CalendarDays,
  Filter,
  Pencil,
  Trash2,
} from "lucide-react";
import "../styles/Employees.css";
/* =========================================================
   AVATAR COMPONENT WITH SAFE FALLBACK
========================================================= */
function EmployeeAvatar({ src, name, initials, colorClass }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [src]);
  return (
    <div className={`employee-avatar ${colorClass || "purple"}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name || "Employee"}
          className="employee-avatar-img"
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User size={18} />
      )}
    </div>
  );
}
/* =========================================================
   EMPLOYEE DATA
========================================================= */
const employees = [
  {
    initials: "SK",
    name: "Santhosh Kumar",
    id: "EMP001",
    email: "santhosh.kumar@pinaka.com",
    phone: "+91 98765 43210",
    role: "Store Manager",
    merchant: "FreshMart",
    store: "Banjara Hills",
    status: "Active",
    joined: "Jan 12, 2024",
    active: "2 mins ago",
    avatar: "purple",
  },
  {
    initials: "PD",
    name: "Priya Desai",
    id: "EMP002",
    email: "priya.desai@pinaka.com",
    phone: "+91 98765 43211",
    role: "Cashier",
    merchant: "FreshMart",
    store: "Jubilee Hills",
    status: "Active",
    joined: "Feb 5, 2024",
    active: "10 mins ago",
    avatar: "pink",
  },
  {
    initials: "AR",
    name: "Arjun Reddy",
    id: "EMP003",
    email: "arjun.reddy@pinaka.com",
    phone: "+91 98765 43212",
    role: "Sales Associate",
    merchant: "TechWorld",
    store: "Madhapur",
    status: "Active",
    joined: "Mar 1, 2024",
    active: "1 hour ago",
    avatar: "green",
  },
  {
    initials: "NS",
    name: "Neha Singh",
    id: "EMP004",
    email: "neha.singh@pinaka.com",
    phone: " +91 98765 43213",
    role: "Store Manager",
    merchant: "FashionHub",
    store: "Hitech City",
    status: "Inactive",
    joined: "Jan 18, 2024",
    active: "5 days ago",
    avatar: "orange",
  },
  {
    initials: "RK",
    name: "Rahul Khanna",
    id: "EMP005",
    email: "rahul.khanna@pinaka.com",
    phone: "+91 98765 43214",
    role: "Admin",
    merchant: "ElectroPlus",
    store: "Gachibowli",
    status: "Active",
    joined: "Feb 20, 2024",
    active: "30 mins ago",
    avatar: "blue",
  },
  /* Extra data to test search + pagination */
  {
    initials: "VK",
    name: "Vikram Kumar",
    id: "EMP006",
    email: "vikram.kumar@pinaka.com",
    phone: "+91 98765 43215",
    role: "Cashier",
    merchant: "FreshMart",
    store: "Banjara Hills",
    status: "Active",
    joined: "Mar 12, 2024",
    active: "15 mins ago",
    avatar: "purple",
  },
  {
    initials: "AM",
    name: "Anjali Mehta",
    id: "EMP007",
    email: "anjali.mehta@pinaka.com",
    phone: "+91 98765 43216",
    role: "Admin",
    merchant: "TechWorld",
    store: "Madhapur",
    status: "Inactive",
    joined: "Mar 15, 2024",
    active: "2 days ago",
    avatar: "pink",
  },
  {
    initials: "RS",
    name: "Ravi Sharma",
    id: "EMP008",
    email: "ravi.sharma@pinaka.com",
    phone: "+91 98765 43217",
    role: "Sales Associate",
    merchant: "FashionHub",
    store: "Hitech City",
    status: "Active",
    joined: "Mar 20, 2024",
    active: "20 mins ago",
    avatar: "green",
  },
  {
    initials: "DP",
    name: "Deepak Prasad",
    id: "EMP009",
    email: "deepak.prasad@pinaka.com",
    phone: "+91 98765 43218",
    role: "Store Manager",
    merchant: "ElectroPlus",
    store: "Gachibowli",
    status: "Active",
    joined: "Apr 2, 2024",
    active: "1 hour ago",
    avatar: "orange",
  },
  {
    initials: "SN",
    name: "Sneha Nair",
    id: "EMP010",
    email: "sneha.nair@pinaka.com",
    phone: "+91 98765 43219",
    role: "Cashier",
    merchant: "FreshMart",
    store: "Jubilee Hills",
    status: "Active",
    joined: "Apr 5, 2024",
    active: "5 mins ago",
    avatar: "blue",
  },
];
export async function listMerchants() {
  const data = await api.get(endpoints.merchants);
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.merchants)
      ? data.merchants
      : Array.isArray(data?.data)
        ? data.data
        : [];
  return items;
}
/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon, title, value, description, type, progress }) {
  return (
    <div className="employees-stat-card">
      <div className={`employees-stat-icon ${type}`}>
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>
      <div className="employees-stat-content">
        <div className="employees-stat-title">{title}</div>
        <div className="employees-stat-value">{value}</div>
        <div className={`employees-stat-change ${type}`}>{description}</div>
        {progress !== undefined && (
          <div className="employees-progress-track">
            <div
              className={`employees-progress-bar ${type}`}
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
/* =========================================================
   FILTER DROPDOWN
========================================================= */
function FilterSelect({ value, options, onChange }) {
  return (
    <div className="employees-select">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="employees-select-icon" />
    </div>
  );
}
/* =========================================================
   EMPLOYEES PAGE
========================================================= */
export default function Employees() {
  /* SEARCH */
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState(location.state?.employeeMessage || "");
  const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => {
    if (location.state?.employeeMessage) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);
  const [employeeRows, setEmployeeRows] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(employee) {
    if (deletingId) return;
    setDeletingId(employee.id);
    setDeleteError("");
    try {
      await deleteEmployee(employee.id);
      const result = await getEmployeeList();
      setEmployeeRows(result.employees);
      setStatistics(result.statistics);
      setDeleteTarget(null);
      setNotice("Employee deleted successfully.");
    } catch (error) {
      setDeleteError(error.message || "Unable to delete employee.");
    } finally {
      setDeletingId(null);
    }
  }

  function displayTimestamp(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  useEffect(() => {
    let active = true;
    getEmployeeList()
      .then((result) => {
        if (active) { setEmployeeRows(result.employees); setStatistics(result.statistics); }
      })
      .catch((error) => {
        if (active) setLoadError(error.message || "Unable to load employees.");
      });
    return () => {
      active = false;
    };
  }, []);
  /* FILTERS */
  const [merchant, setMerchant] = useState("All Merchants");

  const [role, setRole] = useState("All Roles");

  /* PAGINATION */
  const [page, setPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

const handlePageSizeChange = (size) => {
  setRowsPerPage(size);
  setPage(1);
};
  /* =====================================================
     FILTER EMPLOYEES
  ===================================================== */
  const filteredEmployees = useMemo(() => {
    return employeeRows.filter((employee) => {
      const searchValue = search.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        employee.name.toLowerCase().includes(searchValue) ||
        employee.email.toLowerCase().includes(searchValue) ||
        employee.phone.toLowerCase().includes(searchValue) ||
        employee.role.toLowerCase().includes(searchValue) ||
        employee.merchant.toLowerCase().includes(searchValue) ||
        employee.store.toLowerCase().includes(searchValue);
      const matchesMerchant =
        merchant === "All Merchants" || employee.merchant === merchant;

      const matchesRole = role === "All Roles" || employee.role === role;

      return (
        matchesSearch &&
        matchesMerchant &&
        matchesRole
      );
    });
  }, [employeeRows, search, merchant, role]);

  /* =====================================================
     PAGINATION CALCULATIONS
  ===================================================== */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / rowsPerPage),
  );
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const visibleEmployees = filteredEmployees.slice(startIndex, endIndex);


  /* =====================================================
     SEARCH HANDLER
  ===================================================== */
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  /* =====================================================
     FILTER HANDLER
  ===================================================== */
  const handleMerchantChange = (value) => {
    setMerchant(value);
    setPage(1);
  };


  const handleRoleChange = (value) => {
    setRole(value);
    setPage(1);
  };


  /* =====================================================
     ROWS PER PAGE
  ===================================================== */


  /* =====================================================
     PAGINATION
  ===================================================== */
  useEffect(() => {
  setPage((currentPage) =>
    Math.min(currentPage, totalPages)
  );
}, [totalPages]);
  /* =====================================================
     RESET FILTERS
  ===================================================== */
  const resetFilters = () => {
    setSearch("");
    setMerchant("All Merchants");
    setRole("All Roles");
    setPage(1);
  };
  /* =====================================================
     RETURN
  ===================================================== */
  return (
    <div className="employees-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}
      <div className="employees-page-header">
        <div>
          <h1>Employees</h1>
          <p className="employees-subtitle">
            View and manage employees across your stores.
          </p>
        </div>
        <div className="employees-header-actions">
          <button
            className="employees-add-btn"
            onClick={() => navigate("/employees/add")}
          >
            <Plus size={18} />
            Add Employee
          </button>
          <button
            className="employees-export-btn"
            onClick={() => console.log("Export clicked")}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>
      {/* =================================================
          STATISTICS
      ================================================= */}
      <div className="employees-stats">
        <StatCard
          icon="bi-people-fill"
          title="Total Employees"
          value={statistics?.total_employees ?? "—"}
          description={statistics ? `${statistics.current_month_added_employees} this month` : ""}
          type="purple"
        />
        <StatCard
          icon="bi-check-circle-fill"
          title="Active Employees"
          value={statistics?.active_employees ?? "—"}
          description={statistics ? `${statistics.active_employees_percentage}% of total` : ""}
          type="green"
          progress={statistics?.active_employees_percentage ?? 0}
        />
        <StatCard
          icon="bi-x-circle-fill"
          title="Inactive Employees"
          value={statistics?.inactive_employees ?? "—"}
          description={statistics ? `${statistics.inactive_employees_percentage}% of total` : ""}
          type="red"
          progress={statistics?.inactive_employees_percentage ?? 0}
        />
        <StatCard
          icon="bi-person-plus-fill"
          title="New This Month"
          value={statistics?.current_month_added_employees ?? "—"}
          description={statistics ? `${statistics.monthly_growth_direction === "INCREASE" ? "↑" : statistics.monthly_growth_direction === "DECREASE" ? "↓" : "→"} ${Math.abs(statistics.monthly_growth_percentage)}% vs last month` : ""}
          type="blue"
        />
      </div>
      {/* =================================================
          EMPLOYEE LIST
      ================================================= */}
      <div className="employees-list-card">
        {/* FILTER BAR */}
        <div className="employees-filter-bar">
          {/* SEARCH */}
          <div className="employees-search">
            <Search size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, email, phone number, or role…"
            />
          </div>
          {/* MERCHANT */}
          <FilterSelect
            value={merchant}
            onChange={handleMerchantChange}
            options={[
              "All Merchants",
              ...Array.from(new Set(employeeRows.map((e) => e.merchant))),
            ]}
          />

          {/* ROLE */}
          <FilterSelect
            value={role}
            onChange={handleRoleChange}
            options={[
              "All Roles",
              ...Array.from(new Set(employeeRows.map((e) => e.role))),
            ]}
          />

        </div>
        {/* =================================================
            TABLE
        ================================================= */}

        <EmployeeToast message={deleteError || notice} onClose={() => { setDeleteError(""); setNotice(""); }} />
        {deleteTarget && <EmployeeDeleteDialog title="Delete Employee?" description={`Are you sure you want to delete ${deleteTarget.name}?`} busy={Boolean(deletingId)} onCancel={() => setDeleteTarget(null)} onConfirm={() => handleDelete(deleteTarget)} />}
        <div className="employees-table-wrap">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee</th>

                <th>Contact</th>

                <th>Merchant</th>

                <th>Status</th>

                <th>Created At</th>

                <th>Updated At</th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadError ? (
                <tr>
                  <td colSpan="7" className="employees-no-results">
                    {loadError}
                  </td>
                </tr>
              ) : visibleEmployees.length > 0 ? (
                visibleEmployees.map((employee) => (
                  <tr key={employee.id}>
                    {/* EMPLOYEE */}
                    {/* EMPLOYEE COLUMN */}
                    {/* EMPLOYEE COLUMN */}
                    <td>
                      <div className="employee-person">
                        <div className={`employee-avatar ${employee.avatar}`}>
                          {employee.profilePhoto ? (
                            <img
                              src={employee.profilePhoto}
                              alt={`${employee.name} profile`}
                            />
                          ) : (
                            employee.initials
                          )}
                        </div>
                        <div>
                          <div className="employee-name">{employee.name}</div>
                          <div className="employee-id">{employee.employeeCode || employee.employee_code || employee.id}</div>
                        </div>
                      </div>
                    </td>
                    {/* CONTACT */}
                    <td>
                      <div className="employee-contact">
                        <div>{employee.email}</div>
                        <div>{employee.phone}</div>
                      </div>
                    </td>
                    {/* ROLE */}

                    {/* MERCHANT */}
                    <td>{employee.merchant}</td>
                    {/* STORE */}

                    {/* STATUS */}
                    <td>
                      <span
                        className={`employee-status ${employee.status.toLowerCase()}`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    {/* JOINED */}

                    <td>{displayTimestamp(employee.createdAt)}</td>

                    {/* LAST ACTIVE */}

                    <td>{displayTimestamp(employee.updatedAt)}</td>

                    {/* ACTIONS */}
                    <td>
                      <div className="employee-actions">
                        <button
                          title="Edit employee"
                          onClick={() =>
                            navigate("/employees/edit", { state: { employee } })
                          }
                        >
                          <Pencil size={17} />
                        </button>
                        <button type="button" title="Delete employee" aria-label={`Delete ${employee.name}`}
                          disabled={Boolean(deletingId)} onClick={() => setDeleteTarget(employee)}>
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="employees-no-results">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
       {/* ================================================= 
    PAGINATION 
================================================= */}

<Pagination
  currentPage={safePage}
  totalPages={totalPages}
  totalItems={filteredEmployees.length}
  pageSize={rowsPerPage}
  onPageChange={setPage}
  onPageSizeChange={handlePageSizeChange}
  itemLabel="employees"
/>
      </div>
    </div>
  );
}
