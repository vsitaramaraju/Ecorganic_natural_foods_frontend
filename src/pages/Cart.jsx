import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Cart.css";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [discount, setDiscount] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart");

      const data = res.data || [];

      setCart(data);

      if (data.length === 0) {
        refreshCart();
      }
    } catch {
      setError("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await API.get("/coupons/active");

      setAvailableCoupons(res.data || []);
    } catch {
      setError("Failed to load coupons");
    }
  };

  useEffect(() => {
    fetchCart();
    fetchCoupons();
  }, []);

  const updateQty = async (id, qty) => {
    if (qty < 1) return;

    try {
      await API.put("/cart", {
        itemId: id,
        quantity: qty
      });

      await fetchCart();
      await refreshCart();
    } catch {
      setError("Failed to update quantity");
    }
  };

  const removeItem = async id => {
    try {
      await API.delete("/cart", {
        data: { itemId: id }
      });

      await fetchCart();
      await refreshCart();
    } catch {
      setError("Failed to remove item");
    }
  };

  const validateCoupon = async (code = couponCode) => {
    const coupon = code.trim().toUpperCase();

    if (!coupon) {
      setCouponError("Please enter a coupon code");
      setCouponMessage("");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError("");
    setCouponMessage("");

    try {
      const res = await API.post("/coupons/validate", {
        code: coupon
      });

      if (res.data.valid) {
        setCouponCode(coupon);

        setDiscount({
          code: coupon,
          discountPercent: res.data.discountPercent,
          discountAmount: res.data.discountAmount,
          subtotalAmount: res.data.subtotalAmount,
          totalAmount: res.data.totalAmount
        });

        setCouponMessage(
          `Coupon applied! You saved ₹${res.data.discountAmount}`
        );

        // Close available coupons automatically
        setShowCoupons(false);
      } else {
        setCouponError(res.data.message || "Invalid coupon code");
        setDiscount(null);
      }
    } catch (err) {
      setCouponError(err?.response?.data?.message || "Invalid coupon code");
      setDiscount(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const applyCoupon = async coupon => {
    await validateCoupon(coupon.code);
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscount(null);
    setCouponMessage("");
    setCouponError("");
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const freeShipping = subtotal >= 499;
  const shipping = freeShipping ? 0 : 49;
  const totalBeforeDiscount = subtotal + shipping;
  const discountAmount = discount ? discount.discountAmount : 0;
  const total = totalBeforeDiscount - discountAmount;

  if (isLoading)
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="container cart-wrap">
      <h1 className="section-title">🛒 Shopping Cart</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {cart.length > 0 ? (
        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items-col">
            {!freeShipping && (
              <div className="free-ship-banner">
                <span>🚚 Add ₹{499 - subtotal} more for free delivery!</span>
                <div className="ship-progress-bar">
                  <div
                    className="ship-progress-fill"
                    style={{
                      width: `${Math.min((subtotal / 499) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
            {freeShipping && (
              <div className="alert alert-success">
                🎉 You've unlocked free delivery!
              </div>
            )}

            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  {(() => {
                    const displayImage =
                      item.product?.images?.[0]?.imageUrl ||
                      item.product?.imageUrl;
                    const fullImageUrl = displayImage ? IMAGE_BASE_URL + displayImage : null;
                    return fullImageUrl ? (
                      <img
                        src={fullImageUrl}
                        alt={item.product.name}
                        width="72"
                        height="72"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span>🌿</span>
                    );
                  })()}
                </div>
                <div className="cart-item-info">
                  <h3>{item.product.name}</h3>
                  <p className="cart-item-desc">{item.product.description}</p>
                  <span className="tag">
                    {item.product.category?.name || ""}
                  </span>
                </div>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    disabled={item.quantity === 1}
                  >
                    −
                  </button>
                  <span className="qty-num">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-price">
                  <div className="price-per">
                    ₹{item.product.price}
                    {item.product.priceUnit &&
                    item.product.priceUnit !== "fixed"
                      ? ` / ${item.product.priceUnit.replace("per_", "").replace("kg", "KG")}`
                      : " each"}
                  </div>
                  <div className="price-total">
                    ₹{item.product.price * item.quantity}
                  </div>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="btn btn-secondary"
              onClick={() => navigate("/shop")}
            >
              ← Continue Shopping
            </button>
          </div>

          {/* Summary */}
          <div className="cart-summary-col">
            <div className="summary-card card">
              <h2 style={{ color: "black" }}>Order Summary</h2>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery</span>
                  <span className={freeShipping ? "free-label" : ""}>
                    {freeShipping ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="summary-row" style={{ color: "#059669" }}>
                    <span>Discount ({discount.code})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
              </div>
              <div className="summary-divider" />
              <div className="summary-row total-row">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={() =>
                  navigate("/checkout", {
                    state: {
                      discount
                    }
                  })
                }
                style={{ marginTop: "var(--space-md)" }}
              >
                Proceed to Checkout →
              </button>
              <div className="available-coupon-card">
                <div
                  className="available-header"
                  onClick={() =>
                    setShowCoupons(
                      availableCoupons.map(c => c.showCoupons).includes(true)
                        ? false
                        : !showCoupons
                    )
                  }
                >
                  <span>🎁 Available Coupons</span>

                  <span>{showCoupons ? "▲" : "▼"}</span>
                </div>

                {showCoupons && (
                  <div className="available-list">
                    {availableCoupons.length > 0 ? (
                      availableCoupons.map(coupon => {
                        return (
                          <div key={coupon.code} className="coupon-item">
                            <div>
                              <h4>{coupon.code}</h4>

                              {coupon.discountPercent ? (
                                <p>{coupon.discountPercent}% OFF</p>
                              ) : (
                                <p>₹{coupon.maxDiscountAmount} OFF</p>
                              )}

                              <small>Min Order ₹{coupon.minOrderAmount}</small>
                            </div>

                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => applyCoupon(coupon)}
                            >
                              Add
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <h5>No coupons available</h5>
                    )}
                  </div>
                )}
              </div>
              <div className="promo-section">
                {discount ? (
                  <div className="coupon-applied">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#059669",
                          fontWeight: "600"
                        }}
                      >
                        ✓ {discount.code}
                      </span>
                    </div>
                    <button
                      className="btn btn-small"
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        cursor: "pointer"
                      }}
                      onClick={removeCoupon}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      className="promo-input"
                      value={couponCode}
                      onChange={e => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      disabled={isValidatingCoupon}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        boxSizing: "border-box"
                      }}
                    />
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => validateCoupon()}
                      disabled={isValidatingCoupon}
                    >
                      {isValidatingCoupon ? "Validating..." : "Apply Coupon"}
                    </button>
                  </div>
                )}
                {couponMessage && (
                  <div
                    className="alert alert-success"
                    style={{ marginTop: "12px", marginBottom: 0 }}
                  >
                    {couponMessage}
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
              <div className="secure-note">
                🔒 Secure checkout · 100% Organic Guarantee
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some fresh organic products to get started!</p>
          <button className="btn btn-primary" onClick={() => navigate("/shop")}>
            Start Shopping
          </button>
        </div>
      )}
    </div>
  );
}
