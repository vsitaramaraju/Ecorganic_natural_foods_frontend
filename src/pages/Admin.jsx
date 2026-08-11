import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import { useEffect, useRef } from "react";
import "./Admin.css";
import AdminOrderNotifications from "../components/AdminOrderNotifications";

export default function AdminPanel() {
  const { isAdmin, isAuthenticated, user } = useAuth();
  const location = useLocation();

  const navRefs = useRef({});

  const NAV = [
    { to: "/admin/dashboard", label: "🏠 Dashboard" },
    { to: "/admin/overview", label: "📈 Sales Overview" },
    { to: "/admin/sales", label: "💳 Online Sales" },
    { to: "/admin/orders", label: "🛒 Orders" },
    { to: "/admin/products", label: "📦 Products" },
    { to: "/admin/categories", label: "🗂 Categories" },
    { to: "/admin/coupons", label: "🎟 Coupons" },
    { to: "/admin/users", label: "👥 Users" },
    { to: "/admin/reports", label: "📋 Reports" }
  ];

  /*
   * Automatically move the active sidebar item into view.
   * This works both when:
   * 1. User clicks another admin page
   * 2. User refreshes the browser
   */
  useEffect(() => {
    const activeNav = navRefs.current[location.pathname];

    if (activeNav) {
      requestAnimationFrame(() => {
        activeNav.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "center"
        });
      });
    }
  }, [location.pathname]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Admin Panel</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-screen">
      <div className="admin-header">
        <div className="admin-header-copy">
          <h1 style={{ color: "black" }}>
            Welcome, {user?.name || "Admin"} 👋
          </h1>
          <p>
            Manage sales, orders, products, categories, and users from here.
          </p>
        </div>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="Admin Navigation">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              ref={el => {
                navRefs.current[to] = el;
              }}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </aside>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
