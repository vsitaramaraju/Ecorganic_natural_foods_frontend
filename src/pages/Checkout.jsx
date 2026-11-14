import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import { IMAGE_BASE_URL } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { wishlistAPI } from "../api/wishlistAPI";
import "./Checkout.css";
import { useCart } from "../context/CartContext";
import loadRazorpay from "../utils/loadRazorpay";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDeliveryFee } from "../constants/delivery";
import useDeliveryFee from "../utils/useDeliveryFee";

const PAYMENT_METHODS = [
  {
    id: "COD",
    label: "💵 Cash on Delivery",
    desc: "Pay when your order arrives"
  },
  {
    id: "RAZORPAY",
    label: "💳 Pay Online (UPI / Card / Netbanking)",
    desc: "UPI, cards, net banking & wallets — secured by Razorpay"
  }
];

// Shown in the Razorpay window; matches --color-primary in global.css.
const BRAND_NAME = "EchOrganics";
const BRAND_COLOR = "#2d6a4f";

// Delays before each retry of /razorpay/verify (it is idempotent).
const VERIFY_RETRY_DELAYS = [1000, 2000, 4000];

const PAYMENT_RECEIVED_TEXT =
  "Payment received. Your order is being confirmed. Check My Orders in a minute.";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Only a network error or a server-side failure is worth retrying; a 4xx is
// the server's final answer.
const isRetryable = err => !err?.response || err.response.status >= 500;

// Status codes from verify that mean "this payment did not produce an order".
// Anything else after a successful Razorpay payment means the money was taken
// and the webhook will create the order.
const VERIFY_FINAL_FAILURES = [400, 402, 409];

const verifyPayment = async body => {
  for (let attempt = 0; ; attempt++) {
    try {
      const { data } = await API.post("/orders/razorpay/verify", body);
      return data;
    } catch (err) {
      if (!isRetryable(err) || attempt >= VERIFY_RETRY_DELAYS.length) throw err;
      await sleep(VERIFY_RETRY_DELAYS[attempt]);
    }
  }
};

const getOrderId = order => order?.id ?? order?.order?.id ?? order?.orderId;

export default function Checkout() {
  const { deliveryFee } = useDeliveryFee();
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false);
  // The admin can switch Cash on Delivery off (Admin → Delivery & Payments).
  const [codEnabled, setCodEnabled] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isLoadingAddr, setIsLoadingAddr] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // saving an address
  const [isPlacing, setIsPlacing] = useState(false); // placing / paying for the order
  const [isConfirming, setIsConfirming] = useState(false); // verifying a Razorpay payment
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // { type: "error" | "info", text }
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  });
  const [addrErrors, setAddrErrors] = useState({});
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshCart } = useCart();
  // Set synchronously so a double click (or a click while the Razorpay window
  // is open) can't start a second order before React re-renders.
  const placingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // "Try again" / "Pay with COD" on the payment-failed page preselects a method.
    if (["COD", "RAZORPAY"].includes(location.state?.paymentMethod)) {
      setPaymentMethod(location.state.paymentMethod);
    }
    // Get coupon code from Cart navigation state
    if (location.state?.discount) {
      setCouponCode(location.state.discount.code);
      setCouponApplied(location.state.discount);
    }
    API.get("/cart")
      .then(r => {
        const items = r.data || [];
        if (items.length === 0) navigate("/cart", { replace: true });
        setCart(items);
      })
      .catch(() => setError("Failed to load cart"))
      .finally(() => setIsLoadingCart(false));
    API.get("/address")
      .then(r => {
        const d = r.data || [];
        setAddresses(d);
        if (d.length) setSelectedAddressId(d[0].id);
      })
      .catch(() => {})
      .finally(() => setIsLoadingAddr(false));
  }, [isAuthenticated, navigate]);

  // Which payment methods the store accepts right now (public endpoint).
  useEffect(() => {
    let cancelled = false;
    API.get("/orders/payment-config")
      .then(({ data }) => {
        if (cancelled) return;
        const methods = Array.isArray(data?.methods) ? data.methods : null;
        setOnlinePaymentEnabled(
          Boolean(data?.razorpayEnabled) &&
            (!methods || methods.includes("RAZORPAY"))
        );
        setCodEnabled(methods ? methods.includes("COD") : data?.codEnabled !== false);
      })
      .catch(() => {
        // Without the config, fall back to Cash on Delivery only.
        if (!cancelled) {
          setOnlinePaymentEnabled(false);
          setCodEnabled(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const availableMethods = PAYMENT_METHODS.filter(pm =>
    pm.id === "COD" ? codEnabled : onlinePaymentEnabled
  );
  // Falls back to the first offered method if the chosen one isn't available.
  const selectedMethod = availableMethods.some(pm => pm.id === paymentMethod)
    ? paymentMethod
    : availableMethods[0]?.id ?? null;

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discountAmount = couponApplied?.discountAmount || 0;
  const total = subtotal + deliveryFee - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    setCouponApplied(null);
    try {
      const res = await API.post("/coupons/validate", {
        code: couponCode.trim().toUpperCase()
      });
      const data = res.data;
      if (data?.valid) {
        setCouponApplied({
          code: couponCode.trim().toUpperCase(),
          discountPercent: data.discountPercent || 0,
          discountAmount: data.discountAmount || 0
        });
      } else {
        setCouponError(data?.message || "Invalid coupon code");
      }
    } catch (err) {
      setCouponError(getApiErrorMessage(err, "Invalid coupon code"));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  };

  /* ── Address validation ── */
  const validate = () => {
    const e = {};
    if (!newAddress.name.trim()) e.name = "Required";
    if (!newAddress.phone.trim()) e.phone = "Required";
    if (!newAddress.street.trim()) e.street = "Required";
    if (!newAddress.city.trim()) e.city = "Required";
    if (!newAddress.state.trim()) e.state = "Required";
    if (!newAddress.pincode.trim()) e.pincode = "Required";
    if (!newAddress.country.trim()) e.country = "Required";
    setAddrErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddAddress = async e => {
    e.preventDefault();
    if (!validate()) return;
    setIsProcessing(true);
    try {
      const res = await API.post("/address", newAddress);
      setAddresses(prev => [...prev, res.data]);
      setSelectedAddressId(res.data.id);
      setShowNewAddr(false);
      setNewAddress({
        name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India"
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add address"));
    } finally {
      setIsProcessing(false);
    }
  };

  /* After a successful purchase, remove any of the just-bought products
     that are currently in the user's wishlist — once you own it, it no
     longer needs to be "wished for". */
  const removePurchasedItemsFromWishlist = async purchasedCart => {
    try {
      const response = await wishlistAPI.getWishlist();

      const items = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];

      const wishlistedIds = new Set(
        items.map(item => item.productId ?? item.product?.id)
      );

      const toRemove = purchasedCart
        .map(i => i.product?.id)
        .filter(id => id != null && wishlistedIds.has(id));

      if (toRemove.length === 0) return;

      await Promise.allSettled(
        toRemove.map(id => wishlistAPI.removeFromWishlist(id))
      );
    } catch (err) {
      // Non-critical — never let a wishlist cleanup failure block checkout.
      console.error("Failed to sync wishlist after purchase:", err);
    }
  };

  /* ── Place order ── */
  const startPlacing = () => {
    if (placingRef.current) return false;
    placingRef.current = true;
    setIsPlacing(true);
    return true;
  };

  const stopPlacing = () => {
    placingRef.current = false;
    setIsPlacing(false);
  };

  const showError = text => {
    setError(text);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishOrder = async order => {
    await removePurchasedItemsFromWishlist(cart);
    await refreshCart();
    handleRemoveCoupon();
    const orderId = getOrderId(order);
    if (orderId != null) {
      navigate(`/order-success/${orderId}`, { replace: true });
      return;
    }
    navigate("/orders", {
      replace: true,
      state: {
        placedOrderId: orderId,
        notice: {
          type: "success",
          text: orderId
            ? `🎉 Order #${orderId} placed successfully!`
            : "🎉 Your order was placed successfully!"
        }
      }
    });
  };

  // Errors from POST /orders and POST /orders/razorpay/create.
  const handleCreateError = err => {
    const status = err?.response?.status;
    const data = err?.response?.data || {};
    const message = getApiErrorMessage(err, "Failed to place order");

    if (status === 409 && Array.isArray(data.items)) {
      refreshCart();
      navigate("/cart", {
        state: { stockIssue: { message, items: data.items } }
      });
      return;
    }
    if (status === 503) {
      setOnlinePaymentEnabled(false);
      if (codEnabled) {
        setPaymentMethod("COD");
        showError(
          `${message} Online payment is unavailable right now. Please choose Cash on Delivery.`
        );
      } else {
        showError(
          `${message} Online payment is unavailable right now. Please try again in a few minutes.`
        );
      }
      return;
    }
    showError(message);
  };

  const goToPaymentFailed = details =>
    navigate("/payment-failed", {
      replace: true,
      state: {
        ...details,
        amount: details.amount ?? total,
        ...(couponApplied ? { discount: couponApplied } : {})
      }
    });

  // Razorpay took the money: turn the payment into an order.
  const confirmPayment = async response => {
    setIsConfirming(true);
    const body = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature
    };
    try {
      const order = await verifyPayment(body);
      await finishOrder(order);
    } catch (err) {
      const status = err?.response?.status;
      if (!VERIFY_FINAL_FAILURES.includes(status)) {
        // Every retry failed, but the payment went through and the webhook
        // creates the order - don't tell the customer it failed.
        refreshCart();
        navigate("/orders", {
          replace: true,
          state: { notice: { type: "info", text: PAYMENT_RECEIVED_TEXT } }
        });
        return;
      }
      const message = getApiErrorMessage(
        err,
        "Your payment couldn't be completed. Please try again."
      );
      // The cart is reloaded when the customer comes back to checkout.
      refreshCart();
      goToPaymentFailed({
        reason: message,
        paymentId: response.razorpay_payment_id
      });
    } finally {
      setIsConfirming(false);
      stopPlacing();
    }
  };

  const payOnline = async orderDetails => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      setToast({
        type: "error",
        text: "Couldn't load payment gateway, check your connection"
      });
      stopPlacing();
      return;
    }

    let rzpOrder;
    try {
      // The server works out the amount from the cart; never send it from here.
      ({ data: rzpOrder } = await API.post(
        "/orders/razorpay/create",
        orderDetails
      ));
    } catch (err) {
      handleCreateError(err);
      stopPlacing();
      return;
    }

    let paid = false;
    let lastFailure = null; // set by payment.failed; shown if the customer gives up
    try {
      const checkout = new window.Razorpay({
        key: rzpOrder.keyId,
        order_id: rzpOrder.razorpayOrderId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: BRAND_NAME,
        description: "Order payment",
        prefill: rzpOrder.prefill,
        theme: { color: BRAND_COLOR },
        handler: response => {
          paid = true;
          confirmPayment(response);
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            if (paid) return;
            stopPlacing();
            if (lastFailure) {
              // A payment attempt failed and the customer closed the window.
              goToPaymentFailed(lastFailure);
              return;
            }
            setToast({ type: "info", text: "Payment cancelled" });
          }
        }
      });
      checkout.on("payment.failed", res => {
        // Razorpay keeps its window open so the customer can try again; the
        // failure page is shown only if they close it without paying.
        const reason =
          res?.error?.description || "Payment failed. Please try again.";
        lastFailure = {
          reason,
          paymentId: res?.error?.metadata?.payment_id,
          amount: rzpOrder.amount != null ? rzpOrder.amount / 100 : undefined
        };
        setToast({ type: "error", text: reason });
      });
      checkout.open();
    } catch (err) {
      console.error("Failed to open Razorpay checkout:", err);
      showError("Couldn't open the payment window. Please try again.");
      stopPlacing();
    }
  };

  const placeOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address");
      return;
    }
    if (!selectedMethod) {
      setError("No payment method is available right now. Please try again later.");
      return;
    }
    if (!startPlacing()) return;
    setError("");
    setToast(null);
    const orderDetails = {
      addressId: selectedAddressId,
      ...(couponApplied?.code ? { couponCode: couponApplied.code } : {})
    };

    if (selectedMethod === "RAZORPAY") {
      // payOnline releases the lock itself once the payment window is done.
      await payOnline(orderDetails);
      return;
    }

    try {
      const { data } = await API.post("/orders", {
        ...orderDetails,
        paymentMethod: "COD"
      });
      await finishOrder(data);
    } catch (err) {
      handleCreateError(err);
    } finally {
      stopPlacing();
    }
  };


  const field = (key, label, type = "text", placeholder = "") => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={newAddress[key]}
        onChange={e => setNewAddress(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className={addrErrors[key] ? "form-error" : ""}
        disabled={isProcessing}
      />
      {addrErrors[key] && (
        <span className="form-error-message">{addrErrors[key]}</span>
      )}
    </div>
  );

  if (isLoadingCart || isLoadingAddr)
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="container checkout-wrap">
      <h1 className="section-title">Checkout</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="checkout-grid">
        {/* Left – Order Review */}
        <div className="checkout-left">
          <div className="card">
            <h2 style={{ color: "black" }}>📦 Order Review</h2>
            <div className="co-items">
              {cart.map(item => (
                <div key={item.id} className="co-item">
                  <div className="co-item-img">
                    {(() => {
                      const displayImage =
                        item.product?.images?.[0]?.imageUrl ||
                        item.product?.imageUrl;
                      const fullImageUrl = displayImage
                        ? IMAGE_BASE_URL + displayImage
                        : null;
                      return fullImageUrl ? (
                        <img
                          src={fullImageUrl}
                          alt={item.product.name}
                          width="56"
                          height="56"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span>🌿</span>
                      );
                    })()}
                  </div>
                  <div className="co-item-info">
                    <h4>{item.product.name}</h4>
                    <span className="tag">
                      {item.product.category?.name || ""}
                    </span>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className="co-item-price">
                    <div>
                      ₹{item.product.price}
                      {item.product.priceUnit &&
                        item.product.priceUnit !== "fixed" && (
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>
                            /
                            {item.product.priceUnit
                              .replace("per_", "")
                              .replace("kg", "KG")}
                          </span>
                        )}
                      {" × "}
                      {item.quantity}
                    </div>
                    <strong>₹{item.product.price * item.quantity}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="co-coupon">
              <h3 style={{ color: "black", marginBottom: "10px" }}>
                🏷️ Coupon Code
              </h3>
              {couponApplied ? (
                <div className="coupon-applied">
                  <span>
                    ✅ <strong>{couponApplied.code}</strong> —{" "}
                    {couponApplied.discountPercent}% off applied!
                  </span>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={handleRemoveCoupon}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="coupon-input-row">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={e => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    disabled={couponLoading}
                  />
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? "Checking…" : "Apply Coupon"}
                  </button>
                </div>
              )}
              {couponError && (
                <div
                  className="alert alert-error"
                  style={{ marginTop: "12px", marginBottom: 0 }}
                >
                  {couponError}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="co-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? "free-label" : ""}>
                  {formatDeliveryFee(deliveryFee)}
                </span>
              </div>
              {couponApplied && (
                <div className="summary-row" style={{ color: "#16a34a" }}>
                  <span>
                    Coupon Discount ({couponApplied.discountPercent}%)
                  </span>
                  <span>−₹{discountAmount}</span>
                </div>
              )}
              <div className="summary-divider" />
              <div className="summary-row total-row">
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right – Address + Payment */}
        <div className="checkout-right">
          {/* Address */}
          <div className="card addr-card">
            <h2 style={{ color: "black" }}>📍 Delivery Address</h2>
            {addresses.length > 0 && (
              <div className="addr-list">
                {addresses.map(a => (
                  <label
                    key={a.id}
                    className={`addr-option ${selectedAddressId === a.id ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="addr"
                      value={a.id}
                      checked={selectedAddressId === a.id}
                      onChange={() => setSelectedAddressId(a.id)}
                    />
                    <div className="addr-detail">
                      <strong>{a.name}</strong>
                      <p>{a.street}</p>
                      <p>
                        {a.city}, {a.state} – {a.pincode}
                      </p>
                      <p>
                        {a.country} · 📞 {a.phone}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {!showNewAddr ? (
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setShowNewAddr(true)}
                style={{ marginTop: "var(--space-md)" }}
              >
                {addresses.length > 0 ? "+ Add New Address" : "+ Add Address"}
              </button>
            ) : (
              <form onSubmit={handleAddAddress} className="new-addr-form">
                <h3>New Address</h3>
                {field("name", "Full Name", "text", "John Doe")}
                {field("phone", "Phone", "tel", "+91 98765 43210")}
                {field("street", "Street", "text", "123 Main Street")}
                <div className="form-row">
                  {field("city", "City", "text", "Vijayawada")}
                  {field("state", "State", "text", "Andhra Pradesh")}
                </div>
                <div className="form-row">
                  {field("pincode", "Pincode", "text", "520001")}
                  {field("country", "Country", "text", "India")}
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Saving…" : "Save Address"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewAddr(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Payment Method */}
          <div className="card" style={{ marginTop: "16px" }}>
            <h2 style={{ color: "black" }}>💳 Payment Method</h2>
            <div className="payment-methods">
              {availableMethods.map(pm => (
                <label
                  key={pm.id}
                  className={`payment-option ${selectedMethod === pm.id ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={selectedMethod === pm.id}
                    onChange={() => setPaymentMethod(pm.id)}
                    disabled={isPlacing}
                  />
                  <div className="payment-detail">
                    <strong>{pm.label}</strong>
                    <span>{pm.desc}</span>
                  </div>
                </label>
              ))}
              {availableMethods.length === 0 && (
                <p className="payment-unavailable">
                  Payments are unavailable right now. Please try again in a few
                  minutes.
                </p>
              )}
            </div>
          </div>

          <button
            className="btn btn-primary btn-full place-order-btn"
            onClick={placeOrder}
            disabled={
              isPlacing || isProcessing || !selectedAddressId || !selectedMethod
            }
            style={{ marginTop: "16px" }}
          >
            {isPlacing
              ? "Processing…"
              : selectedMethod === "RAZORPAY"
                ? `🔒 Pay ₹${total} & Place Order`
                : `🌿 Place Order · ₹${total}`}
          </button>

          <p className="secure-checkout-note">
            🔒 Secure & Encrypted · 100% Organic Guaranteed
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`co-toast co-toast-${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          <span>{toast.type === "error" ? "⚠️" : "ℹ️"}</span>
          <span className="co-toast-text">{toast.text}</span>
          <button
            type="button"
            className="co-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {isConfirming && (
        <div className="co-confirm-overlay" role="alertdialog" aria-live="assertive">
          <div className="co-confirm-box">
            <div className="spinner" />
            <h3>Confirming your payment…</h3>
            <p>Please don&apos;t close or refresh this page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
