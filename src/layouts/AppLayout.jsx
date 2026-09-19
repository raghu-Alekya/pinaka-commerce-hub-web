import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const hideHeader = /^\/plans\//.test(pathname) || /^\/role-templates\//.test(pathname);

  return (
    <div className={`dashboard-app ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-content">
        {!hideHeader && <Header onMobileMenu={() => setMobileOpen(!mobileOpen)} />}
        <Outlet />
      </main>
    </div>
  );
}
