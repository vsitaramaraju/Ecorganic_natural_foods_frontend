import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ADMIN_ACTIVE_STATUSES,
  ORDER_STATUSES,
  fetchOrders,
  formatCurrency,
  formatDate,
  getOrderAmount,
  updateOrderStatus
} from "./adminShared";
import {
  getItemImage,
  getItemName,
  loadShipFromAddress,
  saveShipFromAddress,
  hasAddress,
  formatAddressLines,
  downloadShippingLabel,
  printShippingLabel
} from "./orderShared";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const VISIBLE_ITEM_COUNT = 2; // how many products show inline before "+N more"

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
  const navigate = useNavigate();
  const [viewItemsOrder, setViewItemsOrder] = useState(null); // full order object, for the "see all items" modal
  const [shipFrom, setShipFrom] = useState(loadShipFromAddress);
  const [editingShipFrom, setEditingShipFrom] = useState(false);
  const [shipFromDraft, setShipFromDraft] = useState(shipFrom);

  useEffect(() => {
    const requestedStatus = String(
      searchParams.get("status") || ""
    ).toUpperCase();

    const requestedOrder = searchParams.get("order");

    if (ORDER_STATUSES.includes(requestedStatus)) {
      setStatusFilter(requestedStatus);
    }

    // Older notification links use ?order=<id>; open that order's details page.
    if (/^\d+$/.test(requestedOrder || "")) {
      navigate(`/admin/orders/${requestedOrder}`, { replace: true });
    } else if (requestedOrder) {
      setSearch(requestedOrder);
    }
  }, [searchParams, navigate]);

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
          `Order #${orderId} marked ${status}.`
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

  const openShipFromEditor = () => {
    setShipFromDraft(shipFrom);
    setEditingShipFrom(true);
  };

  const handleSaveShipFrom = e => {
    e.preventDefault();
    setShipFrom(shipFromDraft);
    saveShipFromAddress(shipFromDraft);
    setEditingShipFrom(false);
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

        <button
          type="button"
          className="btn-action"
          onClick={openShipFromEditor}
          title="Edit the 'Ship From' address printed on shipping labels"
        >
          🏷️ Edit Ship-From Address
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Delivery Address</th>
              <th>Products</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Shipping Label</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-empty-row">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginated.map(order => {
                const currentStatus = String(
                  order.status || "PENDING"
                ).toUpperCase();

                return (
                  <tr
                    key={order.id}
                    className="admin-order-row"
                    title="Open order details"
                    onClick={e => {
                      // Buttons, links and selects in the row keep their own behaviour.
                      if (e.target.closest("a, button, select, input, label")) return;
                      navigate(`/admin/orders/${order.id}`);
                    }}
                  >
                    <td>
                      <Link to={`/admin/orders/${order.id}`} className="admin-order-link">
                        #{order.id}
                      </Link>
                    </td>

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

                    <td style={{ minWidth: 170 }}>
                      {hasAddress(order) ? (
                        <div style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                          {formatAddressLines(order.address).map((line, i) => (
                            <div
                              key={i}
                              style={
                                i === 0
                                  ? { fontWeight: 600 }
                                  : { color: "#5a7a5a" }
                              }
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#c53030",
                            fontWeight: 600
                          }}
                        >
                          ⚠️ No address on file
                        </span>
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
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        <button
                          type="button"
                          className="btn-action"
                          title="Print shipping label"
                          disabled={!hasAddress(order)}
                          onClick={() => printShippingLabel(order, shipFrom)}
                          style={{
                            opacity: hasAddress(order) ? 1 : 0.5,
                            cursor: hasAddress(order)
                              ? "pointer"
                              : "not-allowed"
                          }}
                        >
                          🖨️ Print
                        </button>
                        <button
                          type="button"
                          className="btn-action"
                          title="Download shipping label"
                          disabled={!hasAddress(order)}
                          onClick={() => downloadShippingLabel(order, shipFrom)}
                          style={{
                            opacity: hasAddress(order) ? 1 : 0.5,
                            cursor: hasAddress(order)
                              ? "pointer"
                              : "not-allowed"
                          }}
                        >
                          ⬇️ Label
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="admin-order-actions">
                        {currentStatus !== "CANCELLED" && (
                          <select
                            value={currentStatus}
                            aria-label={`Status of order ${order.id}`}
                            onChange={e => handleStatusUpdate(order.id, e.target.value)}
                            disabled={isSaving}
                          >
                            {!ADMIN_ACTIVE_STATUSES.includes(currentStatus) && (
                              <option value={currentStatus} disabled>
                                {currentStatus}
                              </option>
                            )}
                            {ADMIN_ACTIVE_STATUSES.map(st => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        )}
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="btn btn-secondary btn-small"
                        >
                          {currentStatus === "CANCELLED" ? "View" : "View / Cancel"}
                        </Link>
                      </div>
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

            {hasAddress(viewItemsOrder) && (
              <div
                style={{
                  background: "#f0f4f0",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 14,
                  fontSize: "0.8rem",
                  lineHeight: 1.5
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  📍 Delivery Address
                </div>
                {formatAddressLines(viewItemsOrder.address).map((line, i) => (
                  <div key={i} style={{ color: "#5a7a5a" }}>
                    {line}
                  </div>
                ))}
              </div>
            )}

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

      {/* Edit Ship-From address modal */}
      {editingShipFrom && (
        <div
          className="modal-overlay"
          onClick={() => setEditingShipFrom(false)}
        >
          <form
            className="modal-box"
            style={{ maxWidth: 440, textAlign: "left" }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleSaveShipFrom}
          >
            <h3>Ship-From Address</h3>
            <p
              style={{
                marginBottom: 14,
                fontSize: "0.82rem",
                color: "#5a7a5a"
              }}
            >
              This is the sender address printed on every shipping label.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                Business / Warehouse Name
                <input
                  value={shipFromDraft.business}
                  onChange={e =>
                    setShipFromDraft(p => ({ ...p, business: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "8px 10px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 8
                  }}
                />
              </label>

              <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                Street Address
                <input
                  value={shipFromDraft.street}
                  onChange={e =>
                    setShipFromDraft(p => ({ ...p, street: e.target.value }))
                  }
                  placeholder="e.g. Plot 12, Industrial Estate"
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "8px 10px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 8
                  }}
                />
              </label>

              <div style={{ display: "flex", gap: 10 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, flex: 1 }}>
                  City
                  <input
                    value={shipFromDraft.city}
                    onChange={e =>
                      setShipFromDraft(p => ({ ...p, city: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "8px 10px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 8
                    }}
                  />
                </label>

                <label style={{ fontSize: "0.8rem", fontWeight: 600, flex: 1 }}>
                  State
                  <input
                    value={shipFromDraft.state}
                    onChange={e =>
                      setShipFromDraft(p => ({ ...p, state: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "8px 10px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 8
                    }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, flex: 1 }}>
                  Pincode
                  <input
                    value={shipFromDraft.pincode}
                    onChange={e =>
                      setShipFromDraft(p => ({ ...p, pincode: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "8px 10px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 8
                    }}
                  />
                </label>

                <label style={{ fontSize: "0.8rem", fontWeight: 600, flex: 1 }}>
                  Phone
                  <input
                    value={shipFromDraft.phone}
                    onChange={e =>
                      setShipFromDraft(p => ({ ...p, phone: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "8px 10px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 8
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="admin-form-actions" style={{ marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingShipFrom(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
