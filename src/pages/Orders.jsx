import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Orders.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const getStatusBadgeColor = (status) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "success";
      case "SHIPPED":
        return "info";
      case "CONFIRMED":
        return "primary";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "✓";
      case "SHIPPED":
        return "📦";
      case "CONFIRMED":
        return "✓";
      case "PENDING":
        return "⏳";
      case "CANCELLED":
        return "✕";
      default:
        return "•";
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await API.get("/orders");
        setOrders(res.data || []);
      } catch (err) {
        setError("Failed to fetch orders");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return <div className="container"><p>Loading orders...</p></div>;
  }

  return (
    <div className="container orders-container">
      <h1>My Orders</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {orders && orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3 className="order-number">Order #{order.id}</h3>
                  <p className="order-date">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className={`order-status badge badge-${getStatusBadgeColor(order.status)}`}>
                  <span className="status-icon">{getStatusIcon(order.status)}</span>
                  {order.status}
                </div>
              </div>

              <div className="order-items">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div className="item-icon">📦</div>
                      <div className="item-details">
                        <p className="item-name">
                          {item.productName || item.product?.name || "Product"}
                        </p>
                        <p className="item-qty">
                          Quantity: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="item-total">
                        ₹{item.quantity * item.price}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No items in this order</p>
                )}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total Amount:</span>
                  <span className="amount">₹{order.totalAmount}</span>
                </div>
                <button className="btn btn-secondary btn-small">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No Orders Yet</h2>
          <p>Start shopping to create your first order</p>
          <button className="btn btn-primary" onClick={() => navigate("/shop")}>
            Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
}