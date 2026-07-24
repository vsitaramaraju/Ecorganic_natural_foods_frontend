import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { wishlistAPI } from "../api/wishlistAPI";
import "./ProductDetails.css";
import { useCart } from "../context/CartContext";
import { saveRecentProduct } from "../utils/RecentlyViewed";

function formatReviewDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return "";
  }
}

function getReviewList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.reviews)) {
    return payload.reviews;
  }

  return [];
}

function getReviewStats(payload, list) {
  const summary = payload?.reviewSummary;
  const average =
    summary?.averageRating ?? payload?.averageRating ?? payload?.average ?? 0;
  const count =
    summary?.totalReviews ?? payload?.totalReviews ?? payload?.count ?? 0;

  if (typeof average === "number" && typeof count === "number") {
    return { average, count };
  }

  if (!list.length) {
    return { average: 0, count: 0 };
  }

  const total = list.reduce(
    (sum, review) => sum + (Number(review.rating) || 0),
    0
  );
  return { average: total / list.length, count: list.length };
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { incrementCart } = useCart();

  // Ratings & reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });
  const [ratingInput, setRatingInput] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const currentUserReview =
    isAuthenticated && user?.id
      ? reviews.find(review => String(review.userId) === String(user.id)) ||
        null
      : null;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await API.get(`/products/${id}`);
        const prod = res?.data;
        setProduct(prod);
        const initialReviews = getReviewList(prod);
        setReviews(initialReviews);
        setReviewStats(getReviewStats(prod, initialReviews));
        setSelectedImage(0);
        setQuantity(1);

        // Load related products from same category
        if (prod?.category?.id || prod?.categoryId) {
          const catId = prod?.category?.id || prod?.categoryId;
          try {
            const relRes = await API.get(`/products/category/${catId}`);
            const related = Array.isArray(relRes?.data)
              ? relRes.data.filter(p => String(p.id) !== String(id)).slice(0, 4)
              : [];
            setRelatedProducts(related);
          } catch {
            // silently fail — related is non-critical
          }
        }
      } catch (e) {
        setError(e?.response?.data?.message || "Product not found.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (product && isAuthenticated && user?.id) {
      saveRecentProduct(product, user.id);
    }
  }, [product, isAuthenticated, user]);

  // Check if product is in wishlist
  useEffect(() => {
    if (!isAuthenticated || !product?.id) {
      setIsInWishlist(false);
      return;
    }

    const checkWishlist = async () => {
      try {
        const response = await wishlistAPI.checkInWishlist(product.id);
        setIsInWishlist(response?.data?.isInWishlist || false);
      } catch (error) {
        setIsInWishlist(false);
      }
    };

    checkWishlist();
  }, [product?.id, isAuthenticated]);

  // Load ratings & reviews for this product
  useEffect(() => {
    if (!product?.id) return;
    loadReviews(product.id);
  }, [product?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRatingInput(0);
      setCommentInput("");
      return;
    }

    setRatingInput(currentUserReview?.rating || 0);
    setCommentInput(currentUserReview?.comment || "");
  }, [currentUserReview, isAuthenticated]);

  const loadReviews = async productId => {
    setReviewsLoading(true);
    try {
      const res = await API.get(`/products/${productId}/reviews`);
      const data = res?.data;
      const list = getReviewList(data);
      setReviews(list);
      setReviewStats(getReviewStats(data, list));
    } catch (e) {
      // non-critical — fail silently like related products
      setReviews([]);
      setReviewStats({ average: 0, count: 0 });
    } finally {
      setReviewsLoading(false);
    }
  };

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      await API.post("/cart", { productId: product.id, quantity });
      incrementCart(quantity);
      showToast(
        `${quantity > 1 ? quantity + "× " : ""}${product.name} added to cart! 🛒`
      );
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to add to cart.");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      await API.post("/cart", { productId: product.id, quantity });
      navigate("/checkout");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to proceed.");
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(product.id);
        setIsInWishlist(false);
        showToast("Removed from wishlist ✓");
      } else {
        await wishlistAPI.addToWishlist(product.id);
        setIsInWishlist(true);
        showToast("Added to wishlist ❤️");
      }
    } catch (error) {
      showToast(error?.response?.data?.message || "Error updating wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!ratingInput) {
      setReviewError("Please select a star rating.");
      return;
    }
    setReviewError("");
    setSubmittingReview(true);
    try {
      const payload = {
        rating: ratingInput,
        comment: commentInput.trim()
      };
      if (currentUserReview) {
        await API.put(`/products/${product.id}/reviews`, payload);
        showToast("Review updated successfully. ⭐");
      } else {
        await API.post(`/products/${product.id}/reviews`, payload);
        showToast("Thanks for your review! ⭐");
      }
      await loadReviews(product.id);
    } catch (e) {
      setReviewError(e?.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentUserReview) {
      return;
    }

    setReviewError("");
    setSubmittingReview(true);
    try {
      await API.delete(`/products/${product.id}/reviews`);
      setRatingInput(0);
      setCommentInput("");
      showToast("Review deleted successfully.");
      await loadReviews(product.id);
    } catch (e) {
      setReviewError(e?.response?.data?.message || "Failed to delete review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const scrollToReviews = () => {
    document
      .getElementById("reviews")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const images = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : [];

  const isOutOfStock = product?.stock === 0;
  const isLowStock = product?.stock > 0 && product?.stock < 10;
  const catName = product?.category?.name || product?.category || "";

  if (isLoading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <p style={{ color: "var(--color-text-muted)" }}>Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ paddingTop: "var(--space-xl)" }}>
        <div className="alert alert-error">{error || "Product not found."}</div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/shop")}
          style={{ marginTop: "var(--space-md)" }}
        >
          ← Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="pd-page">
      <style>{`
        .star-rating { position: relative; display: inline-block; line-height: 1; letter-spacing: 2px; user-select: none; }
        .star-rating-bg { color: #dcdcdc; white-space: nowrap; }
        .star-rating-fg { position: absolute; top: 0; left: 0; overflow: hidden; white-space: nowrap; color: #f5a623; pointer-events: none; }
        .star-rating.interactive { cursor: pointer; }
        .star-rating-pick { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; }
        .star-rating-pick span { flex: 1; }

        .pd-rating-row { display: inline-flex; align-items: center; gap: 8px; background: none; border: none; padding: 4px 0; margin: 4px 0 8px; cursor: pointer; font: inherit; }
        .pd-rating-value { font-weight: 600; color: var(--color-text); }
        .pd-rating-count { color: var(--color-text-muted); font-size: 13px; }

        .pd-reviews { margin-top: var(--space-xl); padding-top: var(--space-xl); border-top: 1px solid var(--color-border, #e7e5df); }
        .pd-reviews-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: var(--space-md); }
        .pd-reviews-summary { display: flex; align-items: center; gap: 10px; }
        .pd-reviews-avg { font-size: 26px; font-weight: 700; }
        .pd-reviews-count { color: var(--color-text-muted); font-size: 14px; }

        .pd-review-form { padding: var(--space-md); margin-bottom: var(--space-lg, 24px); }
        .pd-review-form h3 { margin: 0 0 10px; font-size: 16px; }
        .pd-review-form-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .pd-review-textarea { width: 100%; margin-top: 12px; padding: 10px 12px; border: 1px solid var(--color-border, #ddd); border-radius: var(--radius-md, 8px); font: inherit; resize: vertical; }
        .pd-review-error { color: #c0392b; font-size: 13px; margin-top: 8px; }
        .pd-review-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
        .pd-review-login-prompt { color: var(--color-text-muted); font-size: 14px; margin: 0; }
        .pd-review-login-prompt button { background: none; border: none; color: var(--color-primary, #2e7d32); text-decoration: underline; cursor: pointer; padding: 0; font: inherit; }

        .pd-reviews-list { display: flex; flex-direction: column; gap: 4px; }
        .pd-review-item { padding: 14px 0; border-bottom: 1px solid var(--color-border, #eee); }
        .pd-review-item-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
        .pd-review-author { font-weight: 600; }
        .pd-review-date { color: var(--color-text-muted); font-size: 13px; margin-left: auto; }
        .pd-review-comment { color: var(--color-text); line-height: 1.5; margin: 0; }
        .pd-no-reviews, .pd-reviews-loading { color: var(--color-text-muted); padding: 8px 0; }
      `}</style>
      {toast && <div className="toast">{toast}</div>}

      {/* Breadcrumb */}
      <div className="container">
        <nav className="pd-breadcrumb">
          <button onClick={() => navigate("/")}>Home</button>
          <span>›</span>
          <button onClick={() => navigate("/shop")}>Shop</button>
          {catName && (
            <>
              <span>›</span>
              <button onClick={() => navigate(`/shop?category=${catName}`)}>
                {catName}
              </button>
            </>
          )}
          <span>›</span>
          <span className="pd-breadcrumb-current">{product.name}</span>
        </nav>
      </div>

      {/* Main Detail Section */}
      <div className="container">
        <div className="pd-layout">
          {/* ── Image Gallery ── */}
          <div className="pd-gallery">
            <div
              className="pd-main-image"
              style={{
                width: "100%",
                maxWidth: 440,
                aspectRatio: "1 / 1",
                margin: "0 auto",
                overflow: "hidden",
                borderRadius: "var(--radius-lg, 12px)",
                background: "var(--color-surface-muted, #f6f6f4)",
                position: "relative"
              }}
            >
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  width="440"
                  height="440"
                  fetchpriority="high"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              ) : (
                <div className="pd-img-placeholder">🌿</div>
              )}
              {isOutOfStock && (
                <div className="pd-oos-overlay">Out of Stock</div>
              )}
            </div>
            {images.length > 1 && (
              <div
                className="pd-thumbnails"
                style={{
                  maxWidth: 440,
                  margin: "0 auto",
                  display: "flex",
                  gap: 8
                }}
              >
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={`pd-thumb ${selectedImage === i ? "active" : ""}`}
                    onClick={() => setSelectedImage(i)}
                    style={{
                      width: 64,
                      height: 64,
                      padding: 0,
                      overflow: "hidden",
                      borderRadius: "var(--radius-md, 8px)",
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      width="64"
                      height="64"
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block"
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="pd-info">
            {catName && <span className="tag">{catName}</span>}
            <h1 className="pd-title">{product.name}</h1>

            {/* Stock Status */}
            <div className="pd-stock-row">
              {isOutOfStock ? (
                <span className="badge badge-danger">Out of Stock</span>
              ) : isLowStock ? (
                <span className="badge badge-warning">
                  Only {product.stock} left!
                </span>
              ) : (
                <span className="badge badge-success">✓ In Stock</span>
              )}
            </div>

            {/* Price */}
            <div className="pd-price-row">
              <span className="pd-price">
                ₹{product.price}
                {product.priceUnit && product.priceUnit !== "fixed" && (
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#6b7280",
                      marginLeft: "4px"
                    }}
                  >
                    /{" "}
                    {product.priceUnit.replace("per_", "").replace("kg", "KG")}
                  </span>
                )}
              </span>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <>
                    <span className="pd-original-price">
                      ₹{product.originalPrice}
                    </span>
                    <span className="pd-discount">
                      {Math.round(
                        ((product.originalPrice - product.price) /
                          product.originalPrice) *
                          100
                      )}
                      % off
                    </span>
                  </>
                )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="pd-description">{product.description}</p>
            )}
            {/* Rating Summary */}
            <button
              className="pd-rating-row"
              onClick={scrollToReviews}
              type="button"
            >
              <StarRating rating={reviewStats.average} size={16} />
              {reviewStats.count > 0 ? (
                <>
                  <span className="pd-rating-value">
                    {reviewStats.average.toFixed(1)}
                  </span>
                  <span className="pd-rating-count">
                    ({reviewStats.count}{" "}
                    {reviewStats.count === 1 ? "review" : "reviews"})
                  </span>
                </>
              ) : (
                <span className="pd-rating-count">
                  No reviews yet — be the first!
                </span>
              )}
            </button>

            {/* Quantity + Actions */}
            {!isOutOfStock && (
              <div className="pd-actions">
                <div className="pd-qty-row">
                  <label className="pd-qty-label">Quantity</label>
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="qty-num">{quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() =>
                        setQuantity(q => Math.min(product.stock || 99, q + 1))
                      }
                      disabled={quantity >= (product.stock || 99)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="pd-btn-row">
                  <button
                    className="btn btn-secondary pd-cart-btn"
                    onClick={handleAddToCart}
                    disabled={adding}
                  >
                    {adding ? "Adding…" : "🛒 Add to Cart"}
                  </button>
                  <button
                    className="btn btn-primary pd-buy-btn"
                    onClick={handleBuyNow}
                    disabled={adding}
                  >
                    Buy Now →
                  </button>
                  <button
                    className={`btn btn-icon pd-wishlist-btn ${isInWishlist ? "active" : ""}`}
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    title={
                      isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                    }
                  >
                    {wishlistLoading ? "…" : isInWishlist ? "❤️" : "🤍"}
                  </button>
                </div>
              </div>
            )}

            {isOutOfStock && (
              <div className="pd-oos-message alert alert-warning">
                This product is currently out of stock. Check back soon!
              </div>
            )}

            {/* Trust Badges */}
            <div className="pd-trust">
              <div className="pd-trust-item">
                <span>🌿</span>
                <span>100% Organic</span>
              </div>
              <div className="pd-trust-item">
                <span>🚚</span>
                <span>Free delivery over ₹499</span>
              </div>
              <div className="pd-trust-item">
                <span>🔄</span>
                <span>Easy returns</span>
              </div>
              <div className="pd-trust-item">
                <span>🛡️</span>
                <span>Secure checkout</span>
              </div>
            </div>

            {/* Additional Product Info */}
            {(product.weight || product.unit || product.sku) && (
              <div className="pd-meta card">
                <h3 className="pd-meta-title">Product Details</h3>
                <table className="pd-meta-table">
                  <tbody>
                    {product.sku && (
                      <tr>
                        <td>SKU</td>
                        <td>{product.sku}</td>
                      </tr>
                    )}
                    {product.weight && (
                      <tr>
                        <td>Weight</td>
                        <td>{product.weight}</td>
                      </tr>
                    )}
                    {product.unit && (
                      <tr>
                        <td>Unit</td>
                        <td>{product.unit}</td>
                      </tr>
                    )}
                    {catName && (
                      <tr>
                        <td>Category</td>
                        <td>{catName}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Ratings & Reviews */}
        <section className="pd-reviews" id="reviews">
          <div className="pd-reviews-header">
            <h2 className="section-title">Ratings &amp; Reviews</h2>
            <div className="pd-reviews-summary">
              <span className="pd-reviews-avg">
                {reviewStats.average.toFixed(1)}
              </span>
              <StarRating rating={reviewStats.average} size={20} />
              <span className="pd-reviews-count">
                Based on {reviewStats.count}{" "}
                {reviewStats.count === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>

          <div className="pd-review-form card">
            <div className="pd-review-form-head">
              <h3>
                {currentUserReview ? "Update Your Review" : "Write a Review"}
              </h3>
              {currentUserReview && (
                <span className="pd-rating-count">
                  You can edit or delete your review.
                </span>
              )}
            </div>
            {!isAuthenticated ? (
              <p className="pd-review-login-prompt">
                Please{" "}
                <button type="button" onClick={() => navigate("/login")}>
                  log in
                </button>{" "}
                to write a review.
              </p>
            ) : (
              <>
                <StarRating
                  rating={ratingInput}
                  size={26}
                  interactive
                  onRate={star => {
                    setRatingInput(star);
                    setReviewError("");
                  }}
                />
                <textarea
                  className="pd-review-textarea"
                  rows={3}
                  placeholder="Share your thoughts about this product…"
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                />
                {reviewError && (
                  <p className="pd-review-error">{reviewError}</p>
                )}
                <div className="pd-review-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview
                      ? currentUserReview
                        ? "Updating…"
                        : "Submitting…"
                      : currentUserReview
                        ? "Update Review"
                        : "Submit Review"}
                  </button>
                  {currentUserReview && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleDeleteReview}
                      disabled={submittingReview}
                    >
                      Delete Review
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="pd-reviews-list">
            {reviewsLoading ? (
              <p className="pd-reviews-loading">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="pd-no-reviews">
                No reviews yet. Be the first to review this product!
              </p>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="pd-review-item">
                  <div className="pd-review-item-head">
                    <img
                      src={
                        r.user?.profileImage ||
                        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                      }
                      alt="profile"
                      className="profile-image"
                      width="40"
                      height="40"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="pd-review-author">
                      {r.userName || r.user?.name || "Anonymous"}
                    </span>
                    <StarRating rating={r.rating} size={13} />
                    <span className="pd-review-date">
                      {formatReviewDate(r.createdAt)}
                    </span>
                  </div>
                  {r.comment && (
                    <p
                      className="pd-review-comment"
                      style={{ textAlign: "justify" }}
                    >
                      {r.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pd-related">
            <h2 className="section-title">You Might Also Like</h2>
            <p className="section-subtitle">
              More from the {catName} collection
            </p>
            <div className="pd-related-grid">
              {relatedProducts.map(p => (
                <RelatedCard
                  key={p.id}
                  product={p}
                  navigate={navigate}
                  user={user}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function RelatedCard({ product, navigate, user, isAuthenticated }) {
  const catName = product?.category?.name || product?.category || "";
  return (
    <article
      className="shop-product-card"
      onClick={() => {
        if (isAuthenticated && user?.id) {
          saveRecentProduct(product, user.id);
        }

        navigate(`/products/${product.id}`);
      }}
      style={{ cursor: "pointer" }}
    >
      <div className="spimg-wrap">
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
          <div className="spimg-placeholder">🌿</div>
        )}
      </div>
      <div className="sp-body">
        {catName && <span className="tag">{catName}</span>}
        <h3>{product.name}</h3>
        <p className="sp-desc">
          {product.description || "Premium organic product, naturally sourced."}
        </p>
        <div className="sp-foot">
          <span className="sp-price">
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
          <button
            className="btn btn-primary btn-small"
            onClick={e => {
              e.stopPropagation();

              if (isAuthenticated && user?.id) {
                saveRecentProduct(product, user.id);
              }

              navigate(`/products/${product.id}`);
            }}
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

function StarRating({ rating = 0, size = 16, interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  const display = interactive ? hover || rating : rating;
  const pct = (Math.max(0, Math.min(5, display)) / 5) * 100;

  return (
    <span
      className={`star-rating ${interactive ? "interactive" : ""}`}
      style={{ fontSize: size }}
      onMouseLeave={() => interactive && setHover(0)}
    >
      <span className="star-rating-bg" aria-hidden="true">
        ★★★★★
      </span>
      <span
        className="star-rating-fg"
        aria-hidden="true"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
      {interactive && (
        <span className="star-rating-pick">
          {[1, 2, 3, 4, 5].map(s => (
            <span
              key={s}
              role="button"
              aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(s)}
              onClick={() => onRate && onRate(s)}
            />
          ))}
        </span>
      )}
    </span>
  );
}
