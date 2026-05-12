import { useEffect, useState } from "react";
import {
  ORDER_STATUSES,
  fetchOrders,
  formatCurrency,
  formatDate,
  getOrderAmount,
  updateOrderStatus,
} from "./adminShared";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadOrders = async () => {
    const data = await fetchOrders();
    setOrders(data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadOrders();
      } catch (error) {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || error?.message || "Failed to load orders",
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

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
        text: error?.response?.data?.message || error?.message || "Failed to update order status",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p>Loading orders...</p>;
  }

  return (
    <section className="card admin-section">
      <h3>Order Management</h3>
      {message.text && (
        <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
          {message.text}
        </div>
      )}
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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty-row">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDate(order.createdAt || order.orderDate)}</td>
                  <td>{order.user?.name || order.customerName || "-"}</td>
                  <td>{formatCurrency(getOrderAmount(order))}</td>
                  <td>
                    <span className={`admin-status-pill status-${String(order.status || "").toLowerCase()}`}>
                      {order.status || "PENDING"}
                    </span>
                  </td>
                  <td>
                    <select
                      value={String(order.status || "PENDING").toUpperCase()}
                      onChange={(event) => handleStatusUpdate(order.id, event.target.value)}
                      disabled={isSaving}
                    >
                      {ORDER_STATUSES.map((status) => (
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
    </section>
  );
}
