import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { wishlistAPI } from "../api/wishlistAPI";
import { saveRecentProduct } from "../utils/RecentlyViewed";
import "./ProductCard.css";

function ProductCard({
  product,
  onAddToCart,
  addingId,
  featured,
  wishlistIds
}) {
  const { isAuthenticated, user } = useContext(AuthContext);
  const catName = product?.category?.name || product?.category || "";
  const isAdding = addingId === product.id;
  const navigate = useNavigate();
  const isInWishlist = wishlistIds.has(product.id);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleWishlist = async e => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(product.id);
        showToast("Removed from wishlist ✓");
      } else {
        await wishlistAPI.addToWishlist(product.id);
        showToast("Added to wishlist ❤️");
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      <article
        className={`product-card ${featured ? "featured" : ""}`}
        onClick={() => {
          if (isAuthenticated && user?.id) {
            saveRecentProduct(product, user.id);
          }

          navigate(`/products/${product.id}`);
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="product-img-wrap">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              width="300"
              height="300"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="product-img-placeholder">🌿</div>
          )}
          {featured && <span className="featured-ribbon">⭐ Top Pick</span>}

          {/* Wishlist Button */}
          <button
            className={`wishlist-btn ${isInWishlist ? "active" : ""}`}
            onClick={handleWishlist}
            disabled={wishlistLoading}
            title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {wishlistLoading ? "…" : isInWishlist ? "❤️" : "🤍"}
          </button>
        </div>
        <div className="product-body">
          {catName && <span className="tag">{catName}</span>}
          <h3 className="product-name">{product.name}</h3>
          <p className="product-desc">
            {product.description ||
              "Premium organic product, naturally sourced."}
          </p>

          {product.description && product.description.length > 80 && (
            <button
              className="show-more-btn"
              onClick={e => {
                e.stopPropagation();

                if (isAuthenticated && user?.id) {
                  saveRecentProduct(product, user.id);
                }

                navigate(`/products/${product.id}`);
              }}
            >
              Show More
            </button>
          )}
          <div className="product-foot">
            <div>
              <span className="product-price">
                ₹{product.price}
                {product.priceUnit && product.priceUnit !== "fixed" && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      marginLeft: "3px"
                    }}
                  >
                    /{product.priceUnit.replace("per_", "").replace("kg", "KG")}
                  </span>
                )}
              </span>
              {product.stock < 10 && product.stock > 0 && (
                <span className="low-stock">Only {product.stock} left!</span>
              )}
              {product.stock === 0 && (
                <span className="out-of-stock">Out of stock</span>
              )}
            </div>
            <button
              className="btn btn-primary btn-small add-btn"
              onClick={e => {
                e.stopPropagation();
                onAddToCart(product.id);
              }}
              disabled={isAdding || product.stock === 0}
            >
              {isAdding ? "…" : "+ Cart"}
            </button>
          </div>
        </div>
      </article>
    </>
  );
}
export default React.memo(ProductCard);
