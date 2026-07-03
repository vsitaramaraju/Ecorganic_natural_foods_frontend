import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Checkout.css";

const PAYMENT_METHODS = [
  {
    id: "COD",
    label: "💵 Cash on Delivery",
    desc: "Pay when your order arrives"
  },
  {
    id: "UPI",
    label: "📱 UPI / GPay / PhonePe",
    desc: "Pay instantly via UPI"
  },
  {
    id: "CARD",
    label: "💳 Credit / Debit Card",
    desc: "Visa, Mastercard, RuPay"
  },
  {
    id: "NETBANKING",
    label: "🏦 Net Banking",
    desc: "All major banks supported"
  }
];

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isLoadingAddr, setIsLoadingAddr] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    API.get("/cart")
      .then(r => setCart(r.data || []))
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

  useEffect(() => {
    if (!isLoadingCart && cart.length === 0) navigate("/cart");
  }, [isLoadingCart, cart, navigate]);

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryFee = subtotal >= 499 ? 0 : 49;
  const discountAmount = couponApplied
    ? Math.round(subtotal * (couponApplied.discount / 100))
    : 0;
  const total = subtotal + deliveryFee - discountAmount;

  /* ── Coupon ── */
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponApplied(null);
    try {
      const res = await API.post("/coupons/validate", {
        code: couponCode.trim()
      });
      const data = res.data;
      // Backend should return { valid: true, discount: 10 } (discount = % off)
      if (data?.valid || data?.discount) {
        setCouponApplied({
          code: couponCode.trim(),
          discount: data.discount || 0
        });
      } else {
        setCouponError(data?.message || "Invalid coupon code");
      }
    } catch (err) {
      setCouponError(err?.response?.data?.message || "Invalid coupon code");
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
      setError(err?.response?.data?.message || "Failed to add address");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Place order ── */
  const placeOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address");
      return;
    }
    setIsProcessing(true);
    setError("");
    try {
      await API.post("/orders", {
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: couponApplied?.code || undefined
      });
      navigate("/orders");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to place order");
    } finally {
      setIsProcessing(false);
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
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                      />
                    ) : (
                      <span>🌿</span>
                    )}
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
                    {couponApplied.discount}% off applied!
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
                    className="btn btn-secondary"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? "Checking…" : "Apply"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="form-error-message">{couponError}</p>
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
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              {couponApplied && (
                <div className="summary-row" style={{ color: "#16a34a" }}>
                  <span>Coupon Discount ({couponApplied.discount}%)</span>
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
              {PAYMENT_METHODS.map(pm => (
                <label
                  key={pm.id}
                  className={`payment-option ${paymentMethod === pm.id ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={paymentMethod === pm.id}
                    onChange={() => setPaymentMethod(pm.id)}
                  />
                  <div className="payment-detail">
                    <strong>{pm.label}</strong>
                    <span>{pm.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-full place-order-btn"
            onClick={placeOrder}
            disabled={isProcessing || !selectedAddressId}
            style={{ marginTop: "16px" }}
          >
            {isProcessing ? "Placing Order…" : `🌿 Place Order · ₹${total}`}
          </button>

          <p className="secure-checkout-note">
            🔒 Secure & Encrypted · 100% Organic Guaranteed
          </p>
        </div>
      </div>
    </div>
  );
}
