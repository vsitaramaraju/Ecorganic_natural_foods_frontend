import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Cart.css";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart");
      setCart(res.data || []);
    } catch (err) {
      setError("Failed to fetch cart");
      console.error(err);
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
      fetchCart();
    } catch (err) {
      setError("Failed to update quantity");
    }
  };

  const removeItem = async (id) => {
    try {
      await API.delete("/cart", { data: { itemId: id } });
      fetchCart();
    } catch (err) {
      setError("Failed to remove item");
    }
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = cart.length > 0 ? 0 : 0;
  const total = subtotal + shipping;

  if (isLoading) {
    return <div className="container"><p>Loading cart...</p></div>;
  }

  return (
    <div className="container cart-container">
      <h1>Shopping Cart</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="cart-grid">
        {/* Cart Items */}
        <div className="cart-items">
          {cart.length > 0 ? (
            <>
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-image-placeholder">
                      <span>📦</span>
                    </div>
                    <div className="item-info">
                      <h3 className="item-name">{item.product.name}</h3>
                      <p className="item-description">{item.product.description}</p>
                      <p className="item-sku">SKU: {item.product.id}</p>
                    </div>
                    <div className="item-quantity-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        disabled={item.quantity === 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQty(item.id, parseInt(e.target.value) || 1)
                        }
                        className="qty-input"
                      />
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-price">
                      <p className="unit-price">₹{item.product.price}</p>
                      <p className="total-price">
                        ₹{item.product.price * item.quantity}
                      </p>
                    </div>
                    <button
                      className="btn-remove"
                      onClick={() => removeItem(item.id)}
                      title="Remove from cart"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary cart-continue" onClick={() => navigate("/shop")}>
                ← Continue Shopping
              </button>
            </>
          ) : (
            <div className="empty-cart">
              <div className="empty-icon">🛒</div>
              <h2>Your cart is empty</h2>
              <p>Add some products to get started!</p>
              <button className="btn btn-primary" onClick={() => navigate("/shop")}>
                Start Shopping
              </button>
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="cart-summary">
            <div className="summary-card">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal ({cart.length} items)</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span className="shipping-free">FREE</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total-row">
                <span>Total</span>
                <span className="total-amount">₹{total}</span>
              </div>

              <button
                className="btn btn-primary btn-checkout"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </button>

              <div className="discount-section">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  className="promo-input"
                />
                <button className="btn btn-secondary btn-apply">Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}