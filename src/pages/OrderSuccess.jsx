import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";
import "./PaymentResult.css";

const PAYMENT_METHOD_TEXT = {
  COD: "Cash on Delivery",
  RAZORPAY: "Online (Razorpay)",
  UPI: "Online"
};

const PAYMENT_STATUS_TEXT = {
  UNPAID: "Pay on delivery",
  PAID: "Paid",
  REFUND_PENDING: "Refund initiated",
  REFUNDED: "Refunded",
  REFUND_FAILED: "Refund issue"
};

const money = n => `₹${Math.round(Number(n || 0) * 100) / 100}`;

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // There's no single-order endpoint for customers, so pick it out of their orders.
    API.get("/orders")
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setOrder(list.find(o => String(o.id) === String(orderId)) || null);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="payresult-page">
        <div className="spinner"></div>
      </div>
    );
  }

  const isOnline = order && ["RAZORPAY", "UPI"].includes(order.paymentMethod);
  const discount = Number(order?.discountAmount || 0);
  const deliveryFee = Number(order?.deliveryFee || 0);

  return (
    <div className="payresult-page">
      <div className="payresult-card">
        <div className="payresult-icon success" aria-hidden="true">✓</div>
        <h1 className="payresult-title">
          {isOnline ? "Payment Successful!" : "Order Placed Successfully!"}
        </h1>
        <p className="payresult-sub">
          Thank you for shopping with EchOrganics 🌿
          <br />
          {order
            ? `Your order #${order.id} has been confirmed.`
            : `Your order #${orderId} has been received.`}
        </p>

        {order ? (
          <>
            <div className="payresult-details">
              <div className="payresult-row">
                <span>Order ID</span>
                <span>#{order.id}</span>
              </div>
              {order.createdAt && (
                <div className="payresult-row">
                  <span>Date</span>
                  <span>
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              )}
              <div className="payresult-row">
                <span>Payment method</span>
                <span>
                  {PAYMENT_METHOD_TEXT[order.paymentMethod] || order.paymentMethod || "-"}
                </span>
              </div>
              <div className="payresult-row">
                <span>Payment status</span>
                <span>
                  {PAYMENT_STATUS_TEXT[order.paymentStatus] || order.paymentStatus || "-"}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <div className="payresult-row">
                  <span>Payment ID</span>
                  <span>{order.razorpayPaymentId}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="payresult-row">
                  <span>Delivery fee</span>
                  <span>{money(deliveryFee)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="payresult-row">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <span>−{money(discount)}</span>
                </div>
              )}
              <div className="payresult-row total">
                <span>{isOnline ? "Amount paid" : "Amount to pay"}</span>
                <span>{money(order.totalAmount)}</span>
              </div>
            </div>

            {order.items?.length > 0 && (
              <>
                <p className="payresult-section-title">Items</p>
                <ul className="payresult-items">
                  {order.items.map((item, idx) => (
                    <li key={item.id ?? idx}>
                      <span>
                        {item.productName || item.product?.name || "Product"} × {item.quantity}
                      </span>
                      <span>{money(item.quantity * item.price)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {order.address && (
              <>
                <p className="payresult-section-title">Delivering to</p>
                <p className="payresult-address">
                  {order.address.name && (
                    <>
                      <strong>{order.address.name}</strong>
                      <br />
                    </>
                  )}
                  {order.address.street}, {order.address.city}, {order.address.state} –{" "}
                  {order.address.pincode}
                  {order.address.phone && (
                    <>
                      <br />📞 {order.address.phone}
                    </>
                  )}
                </p>
              </>
            )}
          </>
        ) : (
          <p className="payresult-note">
            We're still loading the details of this order. You'll find it under My
            Orders in a minute.
          </p>
        )}

        <div className="payresult-actions">
          <Link to="/orders" className="btn btn-primary">
            📦 View My Orders
          </Link>
          <Link to="/shop" className="btn btn-secondary">
            🛍️ Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
