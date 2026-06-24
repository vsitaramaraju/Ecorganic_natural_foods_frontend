import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Checkout.css";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
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

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

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

  const placeOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address");
      return;
    }
    setIsProcessing(true);
    try {
      await API.post("/orders", { addressId: selectedAddressId });
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
            <h2>📦 Order Review</h2>
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
            <div className="co-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span className={total >= 499 ? "free-label" : ""}>
                  {total >= 499 ? "FREE" : "₹49"}
                </span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row total-row">
                <span>Total Amount</span>
                <span>₹{total >= 499 ? total : total + 49}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right – Address */}
        <div className="checkout-right">
          <div className="card addr-card">
            <h2>📍 Delivery Address</h2>

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

          <button
            className="btn btn-primary btn-full place-order-btn"
            onClick={placeOrder}
            disabled={isProcessing || !selectedAddressId}
          >
            {isProcessing
              ? "Placing Order…"
              : `🌿 Place Order · ₹${total >= 499 ? total : total + 49}`}
          </button>

          <p className="secure-checkout-note">
            🔒 Secure & Encrypted · 100% Organic Guaranteed
          </p>
        </div>
      </div>
    </div>
  );
}
