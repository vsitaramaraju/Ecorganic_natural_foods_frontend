import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../api/api";
import {
  ORDER_STATUSES,
  fetchOrders,
  formatCurrency,
  formatDate,
  getOrderAmount,
  updateOrderStatus
} from "./adminShared";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const VISIBLE_ITEM_COUNT = 2; // how many products show inline before "+N more"

const resolveImage = raw => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${IMAGE_BASE_URL}${raw}`;
};

const getItemImage = item =>
  resolveImage(item?.product?.images?.[0]?.imageUrl || item?.product?.imageUrl);

const getItemName = item => item?.product?.name || "Deleted product";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const [viewItemsOrder, setViewItemsOrder] = useState(null); // full order object, for the "see all items" modal

  useEffect(() => {
    const requestedStatus = String(
      searchParams.get("status") || ""
    ).toUpperCase();

    const requestedOrder = searchParams.get("order");

    if (ORDER_STATUSES.includes(requestedStatus)) {
      setStatusFilter(requestedStatus);
    }

    if (requestedOrder) {
      setSearch(requestedOrder);
    }
  }, [searchParams]);

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

    if (statusFilter !== "ALL") {
      result = result.filter(
        o => String(o.status || "PENDING").toUpperCase() === statusFilter
      );
    }

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

      setMessage({
        type: "success",
        text:
          status === "CONFIRMED"
            ? "Order approved successfully"
            : status === "CANCELLED"
              ? "Order cancelled successfully"
              : "Order status updated"
      });
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
          className={`alert ${
            message.type === "error" ? "alert-error" : "alert-success"
          }`}
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
              <th>Products</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty-row">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginated.map(order => {
                const currentStatus = String(
                  order.status || "PENDING"
                ).toUpperCase();

                return (
                  <tr key={order.id}>
                    <td>#{order.id}</td>

                    <td>{formatDate(order.createdAt || order.orderDate)}</td>

                    <td>
                      <div>{order.user?.name || order.customerName || "—"}</div>

                      {order.user?.email && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af"
                          }}
                        >
                          {order.user.email}
                        </div>
                      )}
                    </td>

                    <td>
                      {(() => {
                        const items = Array.isArray(order.items)
                          ? order.items
                          : [];
                        if (items.length === 0) {
                          return <span style={{ color: "#9ca3af" }}>—</span>;
                        }
                        const visible = items.slice(0, VISIBLE_ITEM_COUNT);
                        const extraCount = items.length - visible.length;
                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6
                            }}
                          >
                            {visible.map((item, idx) => {
                              const img = getItemImage(item);
                              return (
                                <div
                                  key={item.id ?? idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                  }}
                                >
                                  {img ? (
                                    <img
                                      src={img}
                                      alt=""
                                      style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 6,
                                        objectFit: "cover",
                                        flexShrink: 0
                                      }}
                                      onError={e => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span
                                      style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 6,
                                        background: "#f0f4f0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 12,
                                        flexShrink: 0
                                      }}
                                    >
                                      📦
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: "0.8rem",
                                      lineHeight: 1.25
                                    }}
                                  >
                                    {getItemName(item)}
                                    <span style={{ color: "#9ca3af" }}>
                                      {" "}
                                      × {item.quantity}
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                            {extraCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setViewItemsOrder(order)}
                                style={{
                                  alignSelf: "flex-start",
                                  border: "none",
                                  background: "none",
                                  color: "#2d6a4f",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: 0,
                                  textDecoration: "underline"
                                }}
                              >
                                +{extraCount} more
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td>{formatCurrency(getOrderAmount(order))}</td>

                    <td>
                      <span
                        className={`admin-status-pill status-${String(
                          order.status || ""
                        ).toLowerCase()}`}
                      >
                        {order.status || "PENDING"}
                      </span>
                    </td>

                    <td>
                      {/* Pending orders */}
                      {currentStatus === "PENDING" ? (
                        <select
                          value=""
                          onChange={e => {
                            if (e.target.value) {
                              handleStatusUpdate(order.id, e.target.value);
                            }
                          }}
                          disabled={isSaving}
                          style={{
                            padding: "7px 10px",
                            border: "1.5px solid #e5e7eb",
                            borderRadius: 8,
                            cursor: isSaving ? "not-allowed" : "pointer"
                          }}
                        >
                          <option value="">Select Action</option>

                          <option value="CONFIRMED">Approve Order</option>

                          <option value="CANCELLED">Cancel Order</option>
                        </select>
                      ) : (
                        /* Already processed orders */
                        <select
                          value={currentStatus}
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
                      )}
                    </td>
                  </tr>
                );
              })
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

      {/* View all items modal - only opened via the "+N more" link */}
      {viewItemsOrder && (
        <div className="modal-overlay" onClick={() => setViewItemsOrder(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: 480, textAlign: "left" }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Order #{viewItemsOrder.id} — Items</h3>
            <p style={{ marginBottom: 14 }}>
              {(viewItemsOrder.items || []).length} product
              {(viewItemsOrder.items || []).length === 1 ? "" : "s"} in this
              order
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: 360,
                overflowY: "auto"
              }}
            >
              {(viewItemsOrder.items || []).map((item, idx) => {
                const img = getItemImage(item);
                return (
                  <div
                    key={item.id ?? idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      paddingBottom: 12,
                      borderBottom: "1px solid #f0f4f0"
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: "cover",
                          flexShrink: 0
                        }}
                        onError={e => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: "#f0f4f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0
                        }}
                      >
                        📦
                      </span>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {getItemName(item)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        Qty {item.quantity} × {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {formatCurrency((item.price || 0) * (item.quantity || 0))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-form-actions" style={{ marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewItemsOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
