import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Cart.css";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart");
      setCart(res.data || []);
    } catch {
      setError("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQty = async (id, qty) => {
    if (qty < 1) return;
    try {
      await API.put("/cart", { itemId: id, quantity: qty });
      refreshCart();
      fetchCart();
    } catch {
      setError("Failed to update quantity");
    }
  };

  const removeItem = async id => {
    try {
      await API.delete("/cart", { data: { itemId: id } });
      refreshCart();
      fetchCart();
    } catch {
      setError("Failed to remove item");
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const freeShipping = subtotal >= 499;
  const shipping = freeShipping ? 0 : 49;
  const total = subtotal + shipping;

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
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} />
                  ) : (
                    <span>🌿</span>
                  )}
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
              <h2>Order Summary</h2>
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
              </div>
              <div className="summary-divider" />
              <div className="summary-row total-row">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate("/checkout")}
                style={{ marginTop: "var(--space-md)" }}
              >
                Proceed to Checkout →
              </button>
              <div className="promo-section">
                <input
                  type="text"
                  placeholder="Promo code"
                  className="promo-input"
                />
                <button className="btn btn-secondary btn-small">Apply</button>
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
