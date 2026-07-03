import { useEffect, useState, useMemo } from "react";
import {
  ORDER_STATUSES,
  fetchOrders,
  formatCurrency,
  formatDate,
  getOrderAmount,
  updateOrderStatus
} from "./adminShared";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadOrders = async () => {
    const data = await fetchOrders();
    setOrders(data);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadOrders();
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to load orders"
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = [...orders];
    if (statusFilter !== "ALL")
      result = result.filter(
        o => String(o.status || "PENDING").toUpperCase() === statusFilter
      );
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        o =>
          String(o.id).includes(q) ||
          (o.user?.name || o.customerName || "").toLowerCase().includes(q) ||
          (o.user?.email || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      await updateOrderStatus(orderId, status);
      await loadOrders();
      setMessage({ type: "success", text: "Order status updated" });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update order status"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>Loading orders...</p>;

  return (
    <section className="card admin-section">
      <h3>Order Management</h3>

      {message.text && (
        <div
          className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}
      >
        <input
          style={{
            flex: 1,
            minWidth: 200,
            padding: "8px 12px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 8
          }}
          placeholder="Search by order ID, customer name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 8
          }}
        >
          <option value="ALL">All Statuses</option>
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty-row">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDate(order.createdAt || order.orderDate)}</td>
                  <td>
                    <div>{order.user?.name || order.customerName || "—"}</div>
                    {order.user?.email && (
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        {order.user.email}
                      </div>
                    )}
                  </td>
                  <td>{formatCurrency(getOrderAmount(order))}</td>
                  <td>
                    <span
                      className={`admin-status-pill status-${String(order.status || "").toLowerCase()}`}
                    >
                      {order.status || "PENDING"}
                    </span>
                  </td>
                  <td>
                    <select
                      value={String(order.status || "PENDING").toUpperCase()}
                      onChange={e =>
                        handleStatusUpdate(order.id, e.target.value)
                      }
                      disabled={isSaving}
                    >
                      {ORDER_STATUSES.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: 8 }}>
        Showing {filtered.length} of {orders.length} orders
      </p>
    </section>
  );
}
