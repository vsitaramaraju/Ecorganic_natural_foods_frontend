import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./ProductDetails.css";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const { incrementCart } = useCart();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await API.get(`/products/${id}`);
        const prod = res?.data;
        setProduct(prod);
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
    <div className="pd-page page-content">
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
            <div className="pd-main-image">
              {images.length > 0 ? (
                <img src={images[selectedImage]} alt={product.name} />
              ) : (
                <div className="pd-img-placeholder">🌿</div>
              )}
              {isOutOfStock && (
                <div className="pd-oos-overlay">Out of Stock</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="pd-thumbnails">
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={`pd-thumb ${selectedImage === i ? "active" : ""}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img src={src} alt={`${product.name} ${i + 1}`} />
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
              <span className="pd-price">₹{product.price}</span>
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

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pd-related">
            <h2 className="section-title">You Might Also Like</h2>
            <p className="section-subtitle">
              More from the {catName} collection
            </p>
            <div className="pd-related-grid">
              {relatedProducts.map(p => (
                <RelatedCard key={p.id} product={p} navigate={navigate} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function RelatedCard({ product, navigate }) {
  const catName = product?.category?.name || product?.category || "";
  return (
    <article
      className="shop-product-card"
      onClick={() => navigate(`/products/${product.id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="spimg-wrap">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
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
          <span className="sp-price">₹{product.price}</span>
          <button
            className="btn btn-primary btn-small"
            onClick={e => {
              e.stopPropagation();
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
