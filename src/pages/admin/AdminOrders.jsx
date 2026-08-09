import { useEffect, useState, useMemo } from "react";
import {
  ORDER_STATUSES,
  fetchOrders,
  formatCurrency,
  formatDate,
  getOrderAmount,
  updateOrderStatus
} from "./adminShared";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset to page 1 whenever filters/search/page size change.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

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
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center"
        }}
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
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          style={{
            padding: "8px 12px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 8
          }}
          title="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map(n => (
            <option key={n} value={n}>
              {n} / page
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
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty-row">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginated.map(order => (
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
      <div className="admin-pagination">
        <p className="admin-pagination-summary">
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
          {Math.min(safePage * pageSize, filtered.length)} of {filtered.length}{" "}
          orders
        </p>

        {totalPages > 1 && (
          <div className="admin-pagination-controls">
            <button
              type="button"
              className="btn-action"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              ← Prev
            </button>
            <span className="admin-pagination-page">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn-action"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
