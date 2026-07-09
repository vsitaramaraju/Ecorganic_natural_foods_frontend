import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../api/axios";
import { wishlistAPI } from "../api/wishlistAPI";
import "./Wishlist.css";

export default function Wishlist() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchWishlist = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await wishlistAPI.getWishlist();
        const items = Array.isArray(response?.data)
          ? response.data
          : response?.data?.data || [];
        setWishlistItems(items);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load wishlist");
        setWishlistItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleRemoveItem = async wishlistId => {
    setRemovingId(wishlistId.id);
    try {
      await wishlistAPI.removeFromWishlist(wishlistId.productId);
      setWishlistItems(prev => prev.filter(item => item.id !== wishlistId.id));
      showToast("Removed from wishlist ✓");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearWishlist = async () => {
    if (
      window.confirm("Are you sure you want to clear your entire wishlist?")
    ) {
      try {
        await wishlistAPI.clearWishlist();
        setWishlistItems([]);
        showToast("Wishlist cleared ✓");
      } catch (e) {
        showToast(e?.response?.data?.message || "Failed to clear wishlist");
      }
    }
  };

  const handleAddToCart = async productId => {
    try {
      await API.post("/cart", { productId, quantity: 1 });
      showToast("Added to cart! 🛒");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to add to cart");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="wishlist-header">
            <h1 className="section-title">❤️ My Wishlist</h1>
          </div>
          <div className="alert alert-info">
            Please{" "}
            <a
              href="/login"
              style={{ color: "var(--color-primary)", fontWeight: "600" }}
            >
              log in
            </a>{" "}
            to view your wishlist.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="loading-wrap">
            <div className="spinner" />
            <p>Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <div className="wishlist-header">
        <div className="container">
          <div className="wishlist-header-content">
            <div>
              <h1 className="section-title">❤️ My Wishlist</h1>
              <p className="section-subtitle">
                {wishlistItems.length} item
                {wishlistItems.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            {wishlistItems.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleClearWishlist}
              >
                Clear Wishlist
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container wishlist-container">
        {error && <div className="alert alert-error">{error}</div>}

        {wishlistItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">❤️</div>
            <h2>Your wishlist is empty</h2>
            <p>Add products to your wishlist to save them for later</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/shop")}
            >
              Start Shopping →
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map(item => (
              <article key={item.id} className="wishlist-card">
                {/* Image */}
                <div className="wishlist-card-img">
                  {item.product?.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} />
                  ) : (
                    <div className="wishlist-img-placeholder">🌿</div>
                  )}

                  {/* Always-visible remove button, top-right of the image */}
                  <button
                    className="wishlist-remove-overlay"
                    onClick={() => handleRemoveItem(item)}
                    disabled={removingId === item.id}
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    {removingId === item.id ? "…" : "✕"}
                  </button>
                </div>

                {/* Info */}
                <div className="wishlist-card-body">
                  {item.product?.category?.name && (
                    <span className="tag">{item.product.category.name}</span>
                  )}

                  <h3>{item.product?.name}</h3>

                  {item.product?.description && (
                    <p className="wishlist-card-desc">
                      {item.product.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="wishlist-card-footer">
                    <span className="wishlist-card-price">
                      ₹{item.product?.price}
                    </span>

                    {item.product?.stock === 0 ? (
                      <span className="badge badge-danger">Out of Stock</span>
                    ) : item.product?.stock < 10 ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="wishlist-card-actions">
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => navigate(`/products/${item.product?.id}`)}
                    >
                      View Details
                    </button>

                    <button
                      className={`btn btn-secondary btn-small ${item.product?.stock === 0 ? "disabled" : ""}`}
                      onClick={() => handleAddToCart(item.product?.id)}
                      disabled={item.product?.stock === 0}
                    >
                      🛒 Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
