import { api } from "./http";
import { endpoints } from "./endpoints";

/**
 * Payload for POST /merchants/employees (Create Employee)
 */
export function toEmployeePayload(data) {
  return {
    merchantId: data.merchant || data.merchantId,

    firstName: data.firstName?.trim() || "",
    lastName: data.lastName?.trim() || "",
    email: data.email?.trim() || "",
    phone: data.phone?.trim() || "",

    dateOfBirth: data.dob || data.dateOfBirth || "",
    gender: data.gender || "",

    addressLine1: data.address1?.trim() || data.addressLine1?.trim() || "",
    addressLine2: data.address2?.trim() || data.addressLine2?.trim() || "",
    city: data.city?.trim() || "",
    state: data.state?.trim() || "",
    postalCode: data.pinCode || data.postalCode || "",
    country: data.country || "India",

    username: data.username?.trim() || "",

    ...(data.password ? { temporaryPassword: data.password } : {}),

    sendCredentials: Boolean(data.sendCredentials),

    status: data.status || "ACTIVE",
  };
}

/**
 * Payload for PUT /merchants/employees/:employeeId (Replace/Update Employee)
 * Matches Postman request body for Update Employee
 */
export function toEmployeeUpdatePayload(data) {
  return {
    firstName: data.firstName?.trim() || "",
    lastName: data.lastName?.trim() || "",
    email: data.email?.trim() || "",
    phone: data.phone?.trim() || "",

    dateOfBirth: data.dob || data.dateOfBirth || "",
    gender: data.gender || "",

    addressLine1: data.address1?.trim() || data.addressLine1?.trim() || "",
    addressLine2: data.address2?.trim() || data.addressLine2?.trim() || "",
    city: data.city?.trim() || "",
    state: data.state?.trim() || "",
    postalCode: data.pinCode || data.postalCode || "",
    country: data.country || "India",

    username: data.username?.trim() || "",

    status: data.status || "ACTIVE",

    ...(data.password ? { temporaryPassword: data.password } : {}),
    ...(typeof data.sendCredentials === "boolean"
      ? { sendCredentials: data.sendCredentials }
      : {}),
  };
}
// Helper to resolve relative backend image URLs
function getFullImageUrl(url) {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const backendOrigin =
    process.env.REACT_APP_API_ORIGIN || "http://localhost:3003";
  return url.startsWith("/")
    ? `${backendOrigin}${url}`
    : `${backendOrigin}/${url}`;
}

/*
 * CREATE EMPLOYEE
 */
export function createEmployee(data) {
  return api.post(endpoints.employees, toEmployeePayload(data));
}

/*
 * UPDATE EMPLOYEE
 */
export function updateEmployee(employeeId, data) {
  const payload = toEmployeeUpdatePayload(data);

  return api.put(endpoints.employee(employeeId), payload);
}

/*
 * LIST EMPLOYEES
 */
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

  const minutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60000),
  );

  if (minutes < 1) return "Just now";

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  return `${Math.round(hours / 24)} days ago`;
}

function toInitials(firstName, lastName, name) {
  const parts = [firstName, lastName].filter(Boolean);

  const label = parts.length ? parts.join(" ") : name || "Employee";

  return (
    label
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "E"
  );
}

export function mapEmployeeToRow(employee) {
  const firstName = employee.firstName || "";
  const lastName = employee.lastName || "";

  const name = employee.name || `${firstName} ${lastName}`.trim() || "Employee";

  // Capture profile photo URL from backend response
  const profileImage =
    employee.profileImageUrl ||
    employee.profileImage ||
    employee.avatarUrl ||
    employee.image ||
    null;

  return {
    ...employee,

    initials: toInitials(firstName, lastName, name),

    profileImage,

    name,

    id: employee.id || employee.employeeCode || employee.employeeId || "—",

    email: employee.email || "—",

    phone: employee.phone || "—",

    role: employee.role || "—",

    merchant:
      employee.merchantName ||
      employee.merchant?.name ||
      employee.merchantId ||
      "—",

    store: employee.storeName || employee.store?.name || employee.store || "—",

    status:
      String(employee.status || "INACTIVE").toUpperCase() === "ACTIVE"
        ? "Active"
        : "Inactive",

    joined: formatDate(employee.createdAt || employee.joinedAt),

    active: formatRelative(employee.lastActiveAt || employee.updatedAt),

    avatar: "purple",
  };
}

export async function listEmployees() {
  const data = await api.get(endpoints.employees);

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.employees)
      ? data.employees
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return items.map(mapEmployeeToRow);
}
