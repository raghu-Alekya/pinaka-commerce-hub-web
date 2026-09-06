import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Header({ onMobileMenu }) {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email ||
      "Admin User"
    : "Admin User";
  const role = user?.role || "Super Admin";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "AD";

  const handleLogout = async () => {
    await logout();
    nav("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="sidebar-toggle" onClick={onMobileMenu}>
          <i className="bi bi-list" />
        </button>
        <select className="merchant-select" defaultValue="all">
          <option value="all">All Merchants</option>
          <option>Downtown Solutions</option>
          <option>Westside Market LLC</option>
          <option>Sunshine Mart</option>
          <option>Airport Express</option>
          <option>Lakeside Retail</option>
        </select>
        <div className="global-search">
          <i className="bi bi-search" />
          <input
            placeholder="Search merchants, stores, orders..."
            onKeyDown={(event) => event.key === "Enter" && nav("/merchants")}
          />
          <span className="search-shortcut">/</span>
        </div>
      </div>
      <div className="topbar-right">
        <button className="top-icon">
          <i className="bi bi-bell" />
          <span className="notification-count">12</span>
        </button>
        <button className="top-icon">
          <i className="bi bi-question-circle" />
        </button>
        <div className="profile">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <strong>{displayName}</strong>
            <small>{role}</small>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
