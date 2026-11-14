import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./PaymentResult.css";

// Reached from Checkout when a Razorpay payment fails or can't be verified.
// location.state: { reason?, paymentId?, amount? (rupees), discount? (applied coupon) }
export default function PaymentFailed() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const reason = state?.reason;
  const paymentId = state?.paymentId;
  const amount = state?.amount;
  const discount = state?.discount;
  // Only offer Cash on Delivery when the store has it switched on.
  const [codEnabled, setCodEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    API.get("/orders/payment-config")
      .then(({ data }) => {
        if (cancelled) return;
        const methods = Array.isArray(data?.methods) ? data.methods : null;
        setCodEnabled(methods ? methods.includes("COD") : data?.codEnabled !== false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const backToCheckout = paymentMethod =>
    navigate("/checkout", {
      replace: true,
      state: { paymentMethod, ...(discount ? { discount } : {}) }
    });

  return (
    <div className="payresult-page">
      <div className="payresult-card">
        <div className="payresult-icon failed" aria-hidden="true">✕</div>
        <h1 className="payresult-title">Payment Failed</h1>
        <p className="payresult-sub">
          We couldn't complete your payment, so your order has not been placed.
          <br />
          Don't worry, your cart items are still saved.
        </p>

        {reason && <div className="payresult-reason">{reason}</div>}

        {(amount || paymentId) && (
          <div className="payresult-details">
            {amount != null && (
              <div className="payresult-row">
                <span>Amount</span>
                <span>₹{amount}</span>
              </div>
            )}
            {paymentId && (
              <div className="payresult-row">
                <span>Payment reference</span>
                <span>{paymentId}</span>
              </div>
            )}
          </div>
        )}

        <p className="payresult-note">
          If money was deducted from your account, it will be refunded automatically
          to the original payment method within 5–7 working days.
        </p>

        <div className="payresult-actions">
          <button className="btn btn-primary" onClick={() => backToCheckout("RAZORPAY")}>
            🔄 Try Again
          </button>
          {codEnabled && (
            <button className="btn btn-secondary" onClick={() => backToCheckout("COD")}>
              💵 Pay with Cash on Delivery
            </button>
          )}
        </div>

        <Link to="/contact-us" className="payresult-link">
          Need help? Contact us
        </Link>
      </div>
    </div>
  );
}
