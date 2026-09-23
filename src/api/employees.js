import { api } from "./http";
import { endpoints } from "./endpoints";

export function toEmployeePayload(data, storeAssignments) {
  return {
    merchantId: data.merchant,
    employeeCode: data.employeeCode.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    dateOfBirth: data.dob,
    gender: data.gender,
    addressLine1: data.address1.trim(),
    addressLine2: data.address2.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    postalCode: data.pinCode,
    country: data.country,
    username: data.username.trim(),
    temporaryPassword: data.password,
    sendCredentials: Boolean(data.sendCredentials),
    status: "ACTIVE",
  };
}

export function createEmployee(data, storeAssignments) {
  return api.post(
    endpoints.employees,
    toEmployeePayload(data, storeAssignments)
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function toInitials(firstName, lastName, name) {
  const parts = [firstName, lastName].filter(Boolean);
  const label = parts.length ? parts.join(" ") : name || "Employee";
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "E";
}

export function mapEmployeeToRow(employee) {
  const firstName = employee.firstName || "";
  const lastName = employee.lastName || "";
  const name = employee.name || `${firstName} ${lastName}`.trim() || "Employee";
  const assignment = employee.storeAssignments?.[0] || {};
  const roles = assignment.roles || employee.roles || [];
  const stores = employee.stores || employee.storeAssignments || [];
  const employeeIdentifier =
    employee.employeeId ||
    employee.uuid ||
    employee._id ||
    (employee.id && employee.id !== employee.employeeCode ? employee.id : "");
  const employeeCode = employee.employeeCode || employee.id || "—";
  const localProfilePhoto =
    typeof window !== "undefined" && employeeCode !== "—"
      ? window.localStorage.getItem(`employee-profile-photo:${employeeCode}`)
      : "";

  return {
    ...employee,
    rowKey:
      employeeIdentifier ||
      `${employeeCode}-${employee.email || `${firstName}-${lastName}`}`,
    initials: toInitials(firstName, lastName, name),
    name,
    id: employeeCode,
    email: employee.email || "—",
    phone: employee.phone || "—",
    role: employee.role || roles[0]?.name || roles[0] || "—",
    merchant: employee.merchantName || employee.merchant?.name || employee.merchantId || "—",
    store: employee.storeName || assignment.storeName || stores[0]?.name || assignment.store || "—",
    status: String(employee.status || "INACTIVE").toLowerCase() === "active" ? "Active" : "Inactive",
    joined: formatDate(employee.createdAt || employee.joinedAt),
    active: formatRelative(employee.lastActiveAt || employee.updatedAt),
    profilePhoto:
      employee.profilePhoto ||
      employee.profileImage ||
      employee.photoUrl ||
      employee.avatarUrl ||
      localProfilePhoto ||
      "",
    avatar: "purple",
  };
}

export async function listEmployees() {
  const data = await api.get(endpoints.employeeList);
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.employees)
      ? data.employees
      : Array.isArray(data?.data)
        ? data.data
        : [];
  return items.map(mapEmployeeToRow);
}