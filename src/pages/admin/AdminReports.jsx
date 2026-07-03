import { useEffect, useMemo, useState } from "react";
import {
  fetchOrders,
  fetchProducts,
  fetchCategories,
  formatCurrency,
  formatDate,
  getOrderAmount,
  getOrderItemsCount,
  getCategoryName,
  exportToCSV as exportCSV
} from "./adminShared";

export default function AdminReports() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeReport, setActiveReport] = useState("sales");

  useEffect(() => {
    (async () => {
      try {
        const [o, p, c] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
          fetchCategories()
        ]);
        setOrders(o);
        setProducts(p);
        setCategories(c);
      } catch (e) {
        setError(e?.message || "Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Sales report data
  const salesReport = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + getOrderAmount(o), 0);
    const delivered = orders.filter(
      o => String(o.status).toUpperCase() === "DELIVERED"
    );
    const cancelled = orders.filter(
      o => String(o.status).toUpperCase() === "CANCELLED"
    );
    const conversionRate = orders.length
      ? ((delivered.length / orders.length) * 100).toFixed(1)
      : 0;

    // Monthly breakdown
    const monthly = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt || o.orderDate || 0);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { revenue: 0, count: 0 };
      monthly[key].revenue += getOrderAmount(o);
      monthly[key].count++;
    });

    return {
      totalRevenue,
      totalOrders: orders.length,
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      conversionRate,
      monthly: Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
    };
  }, [orders]);

  // Products report data
  const productsReport = useMemo(() => {
    const sorted = [...products].sort(
      (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0)
    );
    const outOfStock = products.filter(p => Number(p.stock ?? 0) === 0).length;
    const lowStock = products.filter(
      p => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) < 10
    ).length;
    const totalValue = products.reduce(
      (s, p) => s + Number(p.price ?? 0) * Number(p.stock ?? 0),
      0
    );
    return { sorted, outOfStock, lowStock, totalValue };
  }, [products]);

  // Client/Customer report
  const clientReport = useMemo(() => {
    const clientMap = {};
    orders.forEach(o => {
      const id = o.user?.id || o.userId || o.customerName || "unknown";
      const name = o.user?.name || o.customerName || "Unknown";
      const email = o.user?.email || "-";
      if (!clientMap[id])
        clientMap[id] = {
          id,
          name,
          email,
          orders: 0,
          revenue: 0,
          lastOrder: null
        };
      clientMap[id].orders++;
      clientMap[id].revenue += getOrderAmount(o);
      const d = new Date(o.createdAt || o.orderDate || 0);
      if (!clientMap[id].lastOrder || d > new Date(clientMap[id].lastOrder)) {
        clientMap[id].lastOrder = o.createdAt || o.orderDate;
      }
    });
    return Object.values(clientMap).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const exportSalesCSV = () => {
    const headers = ["Month", "Orders", "Revenue"];
    const rows = salesReport.monthly.map(([month, d]) => [
      month,
      d.count,
      d.revenue.toFixed(2)
    ]);
    exportCSV(headers, rows, `sales-monthly-report-${Date.now()}.csv`);
  };

  const exportProductsCSV = () => {
    const headers = ["Name", "Category", "Price", "Stock", "Inventory Value"];
    const rows = productsReport.sorted.map(p => [
      p.name,
      getCategoryName(p),
      p.price,
      p.stock ?? 0,
      (Number(p.price ?? 0) * Number(p.stock ?? 0)).toFixed(2)
    ]);
    exportCSV(headers, rows, `products-report-${Date.now()}.csv`);
  };

  const exportClientsCSV = () => {
    const headers = ["Name", "Email", "Orders", "Total Spent", "Last Order"];
    const rows = clientReport.map(c => [
      c.name,
      c.email,
      c.orders,
      c.revenue.toFixed(2),
      formatDate(c.lastOrder)
    ]);
    exportCSV(headers, rows, `client-report-${Date.now()}.csv`);
  };

  if (isLoading)
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );

  const TABS = [
    { id: "sales", label: "📈 Sales Report" },
    { id: "products", label: "📦 Products Report" },
    { id: "clients", label: "👥 Client Report" }
  ];

  return (
    <div className="admin-stack">
      {error && <div className="alert alert-error">{error}</div>}

      {/* Report Tabs */}
      <div className="report-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`report-tab ${activeReport === t.id ? "active" : ""}`}
            onClick={() => setActiveReport(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SALES REPORT */}
      {activeReport === "sales" && (
        <div className="admin-stack">
          <div className="report-header">
            <h3>Sales Summary Report</h3>
            <button className="btn btn-primary" onClick={exportSalesCSV}>
              ⬇ Export CSV
            </button>
          </div>

          <div className="report-kpi-grid">
            <div className="report-kpi">
              <div className="report-kpi-val">
                {formatCurrency(salesReport.totalRevenue)}
              </div>
              <div className="report-kpi-lbl">Total Revenue</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">{salesReport.totalOrders}</div>
              <div className="report-kpi-lbl">Total Orders</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">{salesReport.deliveredCount}</div>
              <div className="report-kpi-lbl">Delivered</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">{salesReport.cancelledCount}</div>
              <div className="report-kpi-lbl">Cancelled</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">
                {salesReport.conversionRate}%
              </div>
              <div className="report-kpi-lbl">Delivery Rate</div>
            </div>
          </div>

          <section className="card admin-section">
            <h3 style={{ marginBottom: 14 }}>
              Monthly Revenue (Last 6 Months)
            </h3>
            {salesReport.monthly.length === 0 ? (
              <p style={{ color: "#888" }}>No monthly data available.</p>
            ) : (
              <>
                <div className="report-bar-chart">
                  {(() => {
                    const max = Math.max(
                      ...salesReport.monthly.map(([, d]) => d.revenue),
                      1
                    );
                    return salesReport.monthly.map(([month, d]) => (
                      <div className="report-bar-col" key={month}>
                        <div className="report-bar-val">
                          {formatCurrency(d.revenue)}
                        </div>
                        <div className="report-bar-wrap">
                          <div
                            className="report-bar-fill"
                            style={{ height: `${(d.revenue / max) * 100}%` }}
                          />
                        </div>
                        <div className="report-bar-lbl">{month}</div>
                        <div className="report-bar-sub">{d.count} orders</div>
                      </div>
                    ));
                  })()}
                </div>
                <div className="admin-table-wrap" style={{ marginTop: 20 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                        <th>Avg Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.monthly.map(([month, d]) => (
                        <tr key={month}>
                          <td>{month}</td>
                          <td>{d.count}</td>
                          <td>
                            <strong>{formatCurrency(d.revenue)}</strong>
                          </td>
                          <td>
                            {formatCurrency(d.count ? d.revenue / d.count : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* PRODUCTS REPORT */}
      {activeReport === "products" && (
        <div className="admin-stack">
          <div className="report-header">
            <h3>Products Inventory Report</h3>
            <button className="btn btn-primary" onClick={exportProductsCSV}>
              ⬇ Export CSV
            </button>
          </div>

          <div className="report-kpi-grid">
            <div className="report-kpi">
              <div className="report-kpi-val">{products.length}</div>
              <div className="report-kpi-lbl">Total Products</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">{categories.length}</div>
              <div className="report-kpi-lbl">Categories</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val report-kpi-warn">
                {productsReport.outOfStock}
              </div>
              <div className="report-kpi-lbl">Out of Stock</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val report-kpi-caution">
                {productsReport.lowStock}
              </div>
              <div className="report-kpi-lbl">Low Stock (&lt;10)</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">
                {formatCurrency(productsReport.totalValue)}
              </div>
              <div className="report-kpi-lbl">Inventory Value</div>
            </div>
          </div>

          <section className="card admin-section">
            <h3 style={{ marginBottom: 14 }}>All Products</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Inv. Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {productsReport.sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="admin-empty-row">
                        No products.
                      </td>
                    </tr>
                  ) : (
                    productsReport.sorted.map(p => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{getCategoryName(p)}</td>
                        <td>{formatCurrency(p.price)}</td>
                        <td>
                          <span
                            className={`stock-badge ${Number(p.stock ?? 0) === 0 ? "stock-out" : Number(p.stock ?? 0) < 10 ? "stock-low" : "stock-ok"}`}
                          >
                            {p.stock ?? 0}
                          </span>
                        </td>
                        <td>
                          {formatCurrency(
                            Number(p.price ?? 0) * Number(p.stock ?? 0)
                          )}
                        </td>
                        <td>
                          <span
                            className={`admin-status-pill ${Number(p.stock ?? 0) === 0 ? "status-cancelled" : Number(p.stock ?? 0) < 10 ? "status-pending" : "status-delivered"}`}
                          >
                            {Number(p.stock ?? 0) === 0
                              ? "Out of Stock"
                              : Number(p.stock ?? 0) < 10
                                ? "Low Stock"
                                : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* CLIENTS REPORT */}
      {activeReport === "clients" && (
        <div className="admin-stack">
          <div className="report-header">
            <h3>Client Activity Report</h3>
            <button className="btn btn-primary" onClick={exportClientsCSV}>
              ⬇ Export CSV
            </button>
          </div>

          <div className="report-kpi-grid">
            <div className="report-kpi">
              <div className="report-kpi-val">{clientReport.length}</div>
              <div className="report-kpi-lbl">Unique Clients</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">
                {clientReport.filter(c => c.orders > 1).length}
              </div>
              <div className="report-kpi-lbl">Repeat Buyers</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">
                {formatCurrency(clientReport[0]?.revenue || 0)}
              </div>
              <div className="report-kpi-lbl">Top Client Spend</div>
            </div>
            <div className="report-kpi">
              <div className="report-kpi-val">
                {clientReport.length
                  ? formatCurrency(
                      clientReport.reduce((s, c) => s + c.revenue, 0) /
                        clientReport.length
                    )
                  : "₹0"}
              </div>
              <div className="report-kpi-lbl">Avg. Spend / Client</div>
            </div>
          </div>

          <section className="card admin-section">
            <h3 style={{ marginBottom: 14 }}>Client List (by spend)</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Last Order</th>
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {clientReport.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="admin-empty-row">
                        No client data available.
                      </td>
                    </tr>
                  ) : (
                    clientReport.map((c, i) => (
                      <tr key={c.id}>
                        <td style={{ color: "#aaa" }}>{i + 1}</td>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td style={{ color: "#667eea", fontSize: 13 }}>
                          {c.email}
                        </td>
                        <td>{c.orders}</td>
                        <td>
                          <strong>{formatCurrency(c.revenue)}</strong>
                        </td>
                        <td>{formatDate(c.lastOrder)}</td>
                        <td>
                          <span
                            className={`admin-status-pill ${c.revenue >= 10000 ? "status-delivered" : c.revenue >= 3000 ? "status-confirmed" : "status-pending"}`}
                          >
                            {c.revenue >= 10000
                              ? "Gold"
                              : c.revenue >= 3000
                                ? "Silver"
                                : "Regular"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
