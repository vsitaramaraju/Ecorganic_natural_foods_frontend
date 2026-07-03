import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import "./Admin.css";

export default function AdminPanel() {
  const { isAdmin, isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container admin-page">
        <h1>Admin Panel</h1>
        <div className="alert alert-error">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const NAV = [
    { to: "/admin/dashboard", label: "🏠 Dashboard" },
    { to: "/admin/overview", label: "📈 Sales Overview" },
    { to: "/admin/sales", label: "💳 Online Sales" },
    { to: "/admin/orders", label: "🛒 Orders" },
    { to: "/admin/products", label: "📦 Products" },
    { to: "/admin/categories", label: "🗂 Categories" },
    { to: "/admin/users", label: "👥 Users" },
    { to: "/admin/reports", label: "📋 Reports" }
  ];

  return (
    <div className="container admin-page">
      <div className="admin-page-header">
        <div>
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
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </aside>

        <div className="admin-content admin-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
