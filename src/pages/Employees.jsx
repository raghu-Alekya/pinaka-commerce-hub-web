import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Download,
  CalendarDays,
  Filter,
  Eye,
  Pencil,
  MoreVertical,
  Users,
  Check,
  Pause,
  X,
  UserPlus,
} from "lucide-react";

import "../styles/Employees.css";

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

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon: Icon, title, value, description, type, progress }) {
  return (
    <div className="employees-stat-card">
      <div className={`employees-stat-icon ${type}`}>
        <Icon size={24} />
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
  /* FILTERS */

  const [merchant, setMerchant] = useState("All Merchants");

  const [store, setStore] = useState("All Stores");

  const [role, setRole] = useState("All Roles");

  const [status, setStatus] = useState("All Statuses");

  /* PAGINATION */

  const [page, setPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(5);

  /* =====================================================
     FILTER EMPLOYEES
  ===================================================== */

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
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

      const matchesStore = store === "All Stores" || employee.store === store;

      const matchesRole = role === "All Roles" || employee.role === role;

      const matchesStatus =
        status === "All Statuses" || employee.status === status;

      return (
        matchesSearch &&
        matchesMerchant &&
        matchesStore &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [search, merchant, store, role, status]);

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

  const handleStoreChange = (value) => {
    setStore(value);
    setPage(1);
  };

  const handleRoleChange = (value) => {
    setRole(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  /* =====================================================
     ROWS PER PAGE
  ===================================================== */

  const handleRowsChange = (value) => {
    const newRows = Number(value);

    setRowsPerPage(newRows);
    setPage(1);
  };

  /* =====================================================
     PAGINATION
  ===================================================== */

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  /* =====================================================
     RESET FILTERS
  ===================================================== */

  const resetFilters = () => {
    setSearch("");
    setMerchant("All Merchants");
    setStore("All Stores");
    setRole("All Roles");
    setStatus("All Statuses");
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

          <div className="employees-breadcrumb">
            <span>Home</span>

            <ChevronRight size={14} />

            <strong>Employees</strong>
          </div>
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
          icon={Users}
          title="Total Employees"
          value="128"
          description="↑ 12 this month"
          type="purple"
        />

        <StatCard
          icon={Check}
          title="Active Employees"
          value="110"
          description="↑ 85.9% of total"
          type="green"
          progress={86}
        />

        <StatCard
          icon={Pause}
          title="On Leave"
          value="6"
          description="↓ 4.7% of total"
          type="orange"
          progress={18}
        />

        <StatCard
          icon={X}
          title="Inactive Employees"
          value="12"
          description="↓ 9.4% of total"
          type="red"
          progress={22}
        />

        <StatCard
          icon={UserPlus}
          title="New This Month"
          value="14"
          description="↑ 12.3% vs last month"
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
              placeholder="Search employees by name, email, phone or role..."
            />
          </div>

          {/* MERCHANT */}

          <FilterSelect
            value={merchant}
            onChange={handleMerchantChange}
            options={[
              "All Merchants",
              ...Array.from(new Set(employees.map((e) => e.merchant))),
            ]}
          />

          {/* STORE */}

          <FilterSelect
            value={store}
            onChange={handleStoreChange}
            options={[
              "All Stores",
              ...Array.from(new Set(employees.map((e) => e.store))),
            ]}
          />

          {/* ROLE */}

          <FilterSelect
            value={role}
            onChange={handleRoleChange}
            options={[
              "All Roles",
              ...Array.from(new Set(employees.map((e) => e.role))),
            ]}
          />

          {/* STATUS */}

          <FilterSelect
            value={status}
            onChange={handleStatusChange}
            options={["All Statuses", "Active", "Inactive"]}
          />
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="employees-table-wrap">
          <table className="employees-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>

                <th>CONTACT</th>

                <th>ROLE</th>

                <th>MERCHANT</th>

                <th>STORE</th>

                <th>STATUS</th>

                <th>JOINED ON</th>

                <th>LAST ACTIVE</th>

                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {visibleEmployees.length > 0 ? (
                visibleEmployees.map((employee) => (
                  <tr key={employee.id}>
                    {/* EMPLOYEE */}

                    <td>
                      <div className="employee-person">
                        <div className={`employee-avatar ${employee.avatar}`}>
                          {employee.initials}
                        </div>

                        <div>
                          <div className="employee-name">{employee.name}</div>

                          <div className="employee-id">{employee.id}</div>
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

                    <td>{employee.role}</td>

                    {/* MERCHANT */}

                    <td>{employee.merchant}</td>

                    {/* STORE */}

                    <td>{employee.store}</td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`employee-status ${employee.status.toLowerCase()}`}
                      >
                        {employee.status}
                      </span>
                    </td>

                    {/* JOINED */}

                    <td>{employee.joined}</td>

                    {/* LAST ACTIVE */}

                    <td>
                      <div
                        className={`employee-last-active ${
                          employee.status === "Inactive" ? "red" : "green"
                        }`}
                      >
                        <span />

                        {employee.active}
                      </div>
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="employee-actions">
                        <button
                          title="View employee"
                          onClick={() => console.log("View:", employee)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          title="Edit employee"
                          onClick={() => console.log("Edit:", employee)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title="More actions"
                          onClick={() => console.log("More:", employee)}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="employees-no-results">
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

        <div className="employees-pagination">
          {/* SHOWING */}

          <div className="employees-showing">
            Showing{" "}
            <strong>
              {filteredEmployees.length === 0 ? 0 : startIndex + 1}
            </strong>{" "}
            to <strong>{Math.min(endIndex, filteredEmployees.length)}</strong>{" "}
            of <strong>{filteredEmployees.length}</strong> employees
          </div>

          {/* PAGE BUTTONS */}

          <div className="employees-pages">
            <button onClick={() => goToPage(1)} disabled={safePage === 1}>
              <ChevronsLeft size={15} />
            </button>

            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) => index + 1,
            )
              .slice(0, 5)
              .map((number) => (
                <button
                  key={number}
                  className={safePage === number ? "employees-page-active" : ""}
                  onClick={() => goToPage(number)}
                >
                  {number}
                </button>
              ))}

            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
            >
              <ChevronRight size={15} />
            </button>

            <button
              onClick={() => goToPage(totalPages)}
              disabled={safePage === totalPages}
            >
              <ChevronsRight size={15} />
            </button>
          </div>

          {/* ROWS PER PAGE */}

          <div className="employees-rows">
            <span>Rows per page</span>

            <div className="employees-row-select">
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsChange(e.target.value)}
              >
                <option value="5">5</option>

                <option value="10">10</option>

                <option value="15">15</option>

                <option value="20">20</option>
              </select>

              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
