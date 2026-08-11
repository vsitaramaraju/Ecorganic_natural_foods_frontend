import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheckCircle, FaClock } from "react-icons/fa";
import {
  fetchOrders,
  formatCurrency,
  getOrderAmount
} from "../pages/admin/adminShared";
import "./AdminOrderNotifications.css";

const POLL_INTERVAL = 30000;

const getPendingOrders = orders =>
  orders.filter(
    order => String(order?.status || "PENDING").toUpperCase() === "PENDING"
  );

const getCustomerName = order =>
  order?.user?.name || order?.customerName || order?.user?.email || "Customer";

const getOrderDate = order => {
  const value = order?.createdAt || order?.orderDate;
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function AdminOrderNotifications() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const loadPendingOrders = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const orders = await fetchOrders();
      setPendingOrders(getPendingOrders(orders));
      setError("");
    } catch (err) {
      console.error("Failed to load admin order notifications:", err);
      setError("Unable to refresh orders");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingOrders(true);
    const interval = window.setInterval(
      () => loadPendingOrders(false),
      POLL_INTERVAL
    );
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const sortedOrders = useMemo(
    () =>
      [...pendingOrders].sort(
        (a, b) =>
          new Date(b?.createdAt || b?.orderDate || 0) -
          new Date(a?.createdAt || a?.orderDate || 0)
      ),
    [pendingOrders]
  );

  const handleViewOrder = orderId => {
    setIsOpen(false);
    navigate(`/admin/orders?order=${orderId}`);
  };

  return (
    <div className="admin-notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`admin-notification-button ${pendingOrders.length ? "has-pending" : ""}`}
        onClick={() => setIsOpen(open => !open)}
        aria-label={`Order notifications${pendingOrders.length ? `, ${pendingOrders.length} pending` : ""}`}
        aria-expanded={isOpen}
      >
        <FaBell />
        {pendingOrders.length > 0 && (
          <span className="admin-notification-count">
            {pendingOrders.length > 99 ? "99+" : pendingOrders.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="admin-notification-panel">
          <div className="admin-notification-header">
            <div>
              <strong>Order Notifications</strong>
              <span>
                {pendingOrders.length
                  ? `${pendingOrders.length} order${pendingOrders.length === 1 ? "" : "s"} awaiting approval`
                  : "All orders are approved"}
              </span>
            </div>
            <FaBell className="admin-notification-header-icon" />
          </div>

          {isLoading ? (
            <div className="admin-notification-empty">Checking orders...</div>
          ) : error ? (
            <div className="admin-notification-empty notification-error">
              {error}
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="admin-notification-empty">
              <FaCheckCircle />
              <span>No pending orders</span>
            </div>
          ) : (
            <div className="admin-notification-list">
              {sortedOrders.slice(0, 8).map(order => (
                <button
                  type="button"
                  className="admin-order-notification-item"
                  key={order.id}
                  onClick={() => handleViewOrder(order.id)}
                >
                  <span className="admin-order-notification-icon">
                    <FaClock />
                  </span>
                  <span className="admin-order-notification-content">
                    <strong>New order #{order.id}</strong>
                    <span>{getCustomerName(order)}</span>
                    <small>
                      {formatCurrency(getOrderAmount(order))} ·{" "}
                      {getOrderDate(order)}
                    </small>
                  </span>
                  <span className="admin-order-notification-arrow">›</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className="admin-notification-footer"
            onClick={() => {
              setIsOpen(false);
              navigate("/admin/orders?status=PENDING");
            }}
          >
            {pendingOrders.length
              ? "Review all pending orders"
              : "Open order management"}
          </button>
        </div>
      )}
    </div>
  );
}
