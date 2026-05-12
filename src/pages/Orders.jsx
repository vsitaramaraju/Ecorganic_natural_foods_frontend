import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Orders.css";

const STATUS_MAP = {
  PENDING: { color: "warning", icon: "⏳" },
  CONFIRMED: { color: "primary", icon: "✅" },
  SHIPPED: { color: "info", icon: "📦" },
  DELIVERED: { color: "success", icon: "🎉" },
  CANCELLED: { color: "danger", icon: "❌" }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    API.get("/orders")
      .then(r => setOrders(r.data || []))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, navigate]);

  if (isLoading)
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="container orders-wrap">
      <h1 className="section-title">My Orders</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map(order => {
            const s =
              STATUS_MAP[order.status?.toUpperCase()] || STATUS_MAP.PENDING;
            return (
              <div key={order.id} className="order-card card">
                <div className="order-head">
                  <div>
                    <h3>Order #{order.id}</h3>
                    <p className="order-date">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "long", year: "numeric" }
                          )
                        : "—"}
                    </p>
                  </div>
                  <span className={`badge badge-${s.color}`}>
                    {s.icon} {order.status || "PENDING"}
                  </span>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span className="order-item-icon">🌿</span>
                        <span className="order-item-name">
                          {item.productName || item.product?.name || "Product"}
                        </span>
                        <span className="order-item-qty">
                          × {item.quantity}
                        </span>
                        <span className="order-item-price">
                          ₹{item.quantity * item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="order-foot">
                  <span className="order-total">
                    Total: <strong>₹{order.totalAmount}</strong>
                  </span>
                  {order.address && (
                    <span className="order-addr-mini">
                      📍 {order.address.city}, {order.address.state}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No orders yet</h2>
          <p>Start shopping and your orders will appear here</p>
          <button className="btn btn-primary" onClick={() => navigate("/shop")}>
            Shop Now
          </button>
        </div>
      )}
    </div>
  );
}
