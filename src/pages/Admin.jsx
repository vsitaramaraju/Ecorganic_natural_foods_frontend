import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import "./Admin.css";

export default function AdminPanel() {
  const { isAdmin, isAuthenticated } = useAuth();
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container admin-page">
        <h1>Admin Panel</h1>
        <div className="alert alert-error">You do not have permission to access this page.</div>
      </div>
    );
  }

  return (
    <div className="container admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Separate screens for sales, orders, products, and categories.</p>
        </div>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="Admin Navigation">
          <NavLink to="/admin/overview" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
            Sales Overview
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
            Orders
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
            Products
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
            Categories
          </NavLink>
        </aside>

        <div className="admin-content admin-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
