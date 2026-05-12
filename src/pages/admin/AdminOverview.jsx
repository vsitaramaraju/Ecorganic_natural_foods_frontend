import { useEffect, useMemo, useState } from "react";
import {
  ORDER_STATUSES,
  fetchCategories,
  fetchOrders,
  fetchProducts,
  formatCurrency,
  getOrderAmount,
  getOrderItemsCount,
} from "./adminShared";

export default function AdminOverview() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const [orderData, productData, categoryData] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
          fetchCategories(),
        ]);
        setOrders(orderData);
        setProducts(productData);
        setCategories(categoryData);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError?.message || "Failed to load overview");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const statusBreakdown = useMemo(() => {
    const result = {
      PENDING: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders.forEach((order) => {
      const status = String(order?.status || "PENDING").toUpperCase();
      if (result[status] !== undefined) {
        result[status] += 1;
      }
    });

    return result;
  }, [orders]);

  const salesSummary = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + getOrderAmount(order), 0);
    const itemsSold = orders.reduce((sum, order) => sum + getOrderItemsCount(order), 0);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      itemsSold,
      avgOrderValue,
    };
  }, [orders]);

  if (isLoading) {
    return <p>Loading overview...</p>;
  }

  return (
    <div className="admin-overview">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-summary-grid">
        <article className="card admin-summary-card">
          <h3>Total Orders</h3>
          <p className="admin-summary-value">{salesSummary.totalOrders}</p>
        </article>
        <article className="card admin-summary-card">
          <h3>Total Revenue</h3>
          <p className="admin-summary-value">{formatCurrency(salesSummary.totalRevenue)}</p>
        </article>
        <article className="card admin-summary-card">
          <h3>Items Sold</h3>
          <p className="admin-summary-value">{salesSummary.itemsSold}</p>
        </article>
        <article className="card admin-summary-card">
          <h3>Average Order</h3>
          <p className="admin-summary-value">{formatCurrency(salesSummary.avgOrderValue)}</p>
        </article>
      </div>

      <div className="admin-split-layout">
        <section className="card admin-section">
          <h3>Order Status Breakdown</h3>
          <ul className="admin-status-list">
            {ORDER_STATUSES.map((status) => (
              <li key={status}>
                <span>{status}</span>
                <strong>{statusBreakdown[status] || 0}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="card admin-section">
          <h3>Inventory Snapshot</h3>
          <div className="admin-kpi-row">
            <p>Products</p>
            <strong>{products.length}</strong>
          </div>
          <div className="admin-kpi-row">
            <p>Categories</p>
            <strong>{categories.length}</strong>
          </div>
          <div className="admin-kpi-row">
            <p>Low Stock (below 10)</p>
            <strong>{products.filter((product) => Number(product.stock ?? 0) < 10).length}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
