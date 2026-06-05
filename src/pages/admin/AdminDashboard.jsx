import { useEffect, useMemo, useState } from "react";
import {
  ORDER_STATUSES,
  fetchCategories,
  fetchOrders,
  fetchProducts,
  formatCurrency,
  formatDate,
  getOrderAmount,
  getOrderItemsCount,
} from "./adminShared";

const STAT_ICONS = {
  revenue: "₹",
  orders: "🛒",
  items: "📦",
  avg: "📊",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [o, p, c] = await Promise.all([fetchOrders(), fetchProducts(), fetchCategories()]);
        setOrders(o);
        setProducts(p);
        setCategories(c);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + getOrderAmount(o), 0);
    const totalOrders = orders.length;
    const itemsSold = orders.reduce((s, o) => s + getOrderItemsCount(o), 0);
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, itemsSold, avgOrder };
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const map = { PENDING: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach(o => {
      const s = String(o?.status || "PENDING").toUpperCase();
      if (map[s] !== undefined) map[s]++;
    });
    return map;
  }, [orders]);

  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [orders]
  );

  const lowStock = useMemo(() => products.filter(p => Number(p.stock ?? 0) < 10), [products]);

  if (isLoading) return <div className="dash-loading"><div className="dash-spinner" /></div>;

  return (
    <div className="dash-root">
      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI Cards */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card dash-kpi-revenue">
          <div className="dash-kpi-icon">₹</div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Total Revenue</div>
            <div className="dash-kpi-value">{formatCurrency(stats.totalRevenue)}</div>
          </div>
        </div>
        <div className="dash-kpi-card dash-kpi-orders">
          <div className="dash-kpi-icon">🛒</div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Total Orders</div>
            <div className="dash-kpi-value">{stats.totalOrders}</div>
          </div>
        </div>
        <div className="dash-kpi-card dash-kpi-items">
          <div className="dash-kpi-icon">📦</div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Items Sold</div>
            <div className="dash-kpi-value">{stats.itemsSold}</div>
          </div>
        </div>
        <div className="dash-kpi-card dash-kpi-avg">
          <div className="dash-kpi-icon">📊</div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-label">Avg. Order Value</div>
            <div className="dash-kpi-value">{formatCurrency(stats.avgOrder)}</div>
          </div>
        </div>
      </div>

      <div className="dash-row">
        {/* Status Breakdown */}
        <section className="card dash-panel">
          <h3 className="dash-panel-title">Order Status</h3>
          <div className="dash-status-list">
            {ORDER_STATUSES.map(s => {
              const count = statusBreakdown[s] || 0;
              const pct = stats.totalOrders ? Math.round((count / stats.totalOrders) * 100) : 0;
              return (
                <div className="dash-status-row" key={s}>
                  <span className={`admin-status-pill status-${s.toLowerCase()}`}>{s}</span>
                  <div className="dash-bar-wrap">
                    <div className="dash-bar" style={{ width: `${pct}%` }} data-status={s.toLowerCase()} />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </section>

        {/* Inventory */}
        <section className="card dash-panel">
          <h3 className="dash-panel-title">Inventory Snapshot</h3>
          <div className="dash-inv-grid">
            <div className="dash-inv-stat">
              <div className="dash-inv-num">{products.length}</div>
              <div className="dash-inv-lbl">Products</div>
            </div>
            <div className="dash-inv-stat">
              <div className="dash-inv-num">{categories.length}</div>
              <div className="dash-inv-lbl">Categories</div>
            </div>
            <div className="dash-inv-stat dash-inv-warn">
              <div className="dash-inv-num">{lowStock.length}</div>
              <div className="dash-inv-lbl">Low Stock</div>
            </div>
            <div className="dash-inv-stat">
              <div className="dash-inv-num">{products.filter(p => Number(p.stock ?? 0) === 0).length}</div>
              <div className="dash-inv-lbl">Out of Stock</div>
            </div>
          </div>
          {lowStock.length > 0 && (
            <div className="dash-lowstock">
              <div className="dash-lowstock-title">⚠ Low Stock Products</div>
              {lowStock.slice(0, 4).map(p => (
                <div className="dash-lowstock-row" key={p.id}>
                  <span>{p.name}</span>
                  <span className="dash-lowstock-qty">{p.stock ?? 0} left</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Orders */}
      <section className="card dash-panel">
        <h3 className="dash-panel-title">Recent Orders</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="admin-empty-row">No orders yet.</td></tr>
              ) : recentOrders.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{formatDate(o.createdAt || o.orderDate)}</td>
                  <td>{o.user?.name || o.customerName || "-"}</td>
                  <td>{formatCurrency(getOrderAmount(o))}</td>
                  <td>
                    <span className={`admin-status-pill status-${String(o.status || "").toLowerCase()}`}>
                      {o.status || "PENDING"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
