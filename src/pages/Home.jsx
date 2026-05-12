import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Home.css";

const ORGANIC_CATEGORY_ICONS = {
  vegetables: "🥦",
  fruits: "🍎",
  dairy: "🥛",
  grains: "🌾",
  herbs: "🌿",
  nuts: "🥜",
  oils: "🫒",
  pulses: "🫘",
  spices: "🌶️",
  honey: "🍯",
  tea: "🍵",
  superfoods: "✨"
};

const getCategoryIcon = name => {
  const key = String(name || "").toLowerCase();
  for (const [k, icon] of Object.entries(ORGANIC_CATEGORY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return "🌱";
};

const CATEGORY_BG_IMAGES = {
  vegetables:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
  fruits:
    "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80",
  dairy: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80",
  grains:
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
  herbs:
    "https://images.unsplash.com/photo-1540914124281-342587941389?w=600&q=80",
  nuts: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&q=80",
  default:
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80"
};

const getCategoryImage = name => {
  const key = String(name || "").toLowerCase();
  for (const [k, url] of Object.entries(CATEGORY_BG_IMAGES)) {
    if (k !== "default" && key.includes(k)) return url;
  }
  return CATEGORY_BG_IMAGES.default;
};

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState("");
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          API.get("/products"),
          API.get("/categories")
        ]);
        const prods = Array.isArray(prodRes?.data) ? prodRes.data : [];
        const cats = Array.isArray(catRes?.data) ? catRes.data : [];
        setAllProducts(prods);
        setProducts(prods);
        setCategories(
          cats.map(c => ({
            ...c,
            icon: getCategoryIcon(c.name),
            image: c.imageUrl || getCategoryImage(c.name)
          }))
        );
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load page");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const addToCart = async productId => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setAddingId(productId);
    try {
      await API.post("/cart", { productId, quantity: 1 });
      showToast("Added to cart! 🛒");
    } catch (e) {
      showToast(e?.response?.data?.message || "Please login to add to cart");
    } finally {
      setAddingId(null);
    }
  };

  const handleCategorySelect = async cat => {
    if (!cat.id || cat.id === "all") {
      setActiveCategory("all");
      setProducts(allProducts);
      return;
    }
    try {
      setCatLoading(true);
      setActiveCategory(String(cat.id));
      const res = await API.get(`/products/category/${cat.id}`);
      setProducts(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setProducts([]);
    } finally {
      setCatLoading(false);
    }
  };

  const featuredProducts = useMemo(
    () => allProducts.slice(0, 4),
    [allProducts]
  );

  if (isLoading)
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <p style={{ color: "var(--color-text-muted)" }}>
          Loading fresh products…
        </p>
      </div>
    );

  return (
    <div className="home">
      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">🌱 100% Certified Organic</span>
          <h1 className="hero-title">
            Nature's Best,
            <br />
            Delivered Fresh
          </h1>
          <p className="hero-desc">
            From local farms to your table — hand-picked organic produce, dairy,
            grains and superfoods with zero compromises.
          </p>
          <div className="hero-cta">
            <button
              className="btn btn-primary hero-btn"
              onClick={() =>
                document
                  .getElementById("products-section")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              Shop Now
            </button>
            <button
              className="btn btn-secondary hero-btn"
              onClick={() => navigate("/categories")}
            >
              Browse Categories
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <strong>500+</strong>
              <span>Products</span>
            </div>
            <div className="stat">
              <strong>50+</strong>
              <span>Farms</span>
            </div>
            <div className="stat">
              <strong>10K+</strong>
              <span>Happy Customers</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=700&q=80"
              alt="Fresh organic produce"
            />
          </div>
          <div className="floating-card card-1">🥕 Freshly Harvested</div>
          <div className="floating-card card-2">✅ Chemical Free</div>
          <div className="floating-card card-3">🚚 Next Day Delivery</div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-bar">
        <div className="trust-item">
          <span>🌿</span>
          <strong>100% Organic</strong>
          <small>Certified by APEDA</small>
        </div>
        <div className="trust-item">
          <span>🚚</span>
          <strong>Free Delivery</strong>
          <small>On orders above ₹499</small>
        </div>
        <div className="trust-item">
          <span>🔄</span>
          <strong>Easy Returns</strong>
          <small>No questions asked</small>
        </div>
        <div className="trust-item">
          <span>🛡️</span>
          <strong>Safe Payments</strong>
          <small>100% secure checkout</small>
        </div>
      </section>

      {error && (
        <div className="container">
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {/* Categories */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">
                Explore our range of certified organic products
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setActiveCategory("all");
                setProducts(allProducts);
              }}
            >
              Show All
            </button>
          </div>
          <div className="category-grid">
            {categories.length > 0 ? (
              categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-card ${activeCategory === String(cat.id) ? "active" : ""}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                  <div className="cat-overlay">
                    <span className="cat-icon">{cat.icon}</span>
                    <h3>{cat.name}</h3>
                  </div>
                </button>
              ))
            ) : (
              <p className="no-data">No categories yet. Check back soon!</p>
            )}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="home-section bg-alt" id="products-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                {activeCategory === "all"
                  ? "All Products"
                  : `${categories.find(c => String(c.id) === activeCategory)?.name || "Category"} Products`}
              </h2>
              <p className="section-subtitle">
                {catLoading
                  ? "Loading…"
                  : `${products.length} products available`}
              </p>
            </div>
          </div>
          <div className="product-grid">
            {products.length > 0 ? (
              products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={addToCart}
                  addingId={addingId}
                />
              ))
            ) : (
              <div className="no-data">
                {catLoading ? (
                  <div className="spinner" />
                ) : (
                  <p>No products in this category yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="home-section why-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: "center" }}>
            Why EchOrganics?
          </h2>
          <p className="section-subtitle" style={{ textAlign: "center" }}>
            We're not just a store — we're a movement for healthier living
          </p>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">🌾</div>
              <h3>Direct from Farm</h3>
              <p>
                We partner directly with certified organic farmers, cutting out
                middlemen to deliver the freshest produce.
              </p>
            </div>
            <div className="why-card">
              <div className="why-icon">🔬</div>
              <h3>Lab Tested</h3>
              <p>
                Every batch is tested for pesticides and chemicals. We guarantee
                what's on the label is what's in the pack.
              </p>
            </div>
            <div className="why-card">
              <div className="why-icon">♻️</div>
              <h3>Eco Packaging</h3>
              <p>
                100% biodegradable packaging. We care about your health and the
                planet equally.
              </p>
            </div>
            <div className="why-card">
              <div className="why-icon">💚</div>
              <h3>Community First</h3>
              <p>
                Every purchase supports local organic farmers and sustainable
                farming practices in India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <section className="home-section bg-alt">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">⭐ Staff Picks</h2>
                <p className="section-subtitle">
                  Our team's most loved products
                </p>
              </div>
            </div>
            <div className="product-grid">
              {featuredProducts.map(p => (
                <ProductCard
                  key={`fp-${p.id}`}
                  product={p}
                  onAddToCart={addToCart}
                  addingId={addingId}
                  featured
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>Ready to eat healthier?</h2>
          <p>Join 10,000+ families who switched to organic with EchOrganics</p>
          <button
            className="btn btn-accent"
            onClick={() => navigate("/register")}
          >
            Create Free Account →
          </button>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product, onAddToCart, addingId, featured }) {
  const catName = product?.category?.name || product?.category || "";
  const isAdding = addingId === product.id;

  return (
    <article className={`product-card ${featured ? "featured" : ""}`}>
      <div className="product-img-wrap">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-img-placeholder">🌿</div>
        )}
        {featured && <span className="featured-ribbon">⭐ Top Pick</span>}
      </div>
      <div className="product-body">
        {catName && <span className="tag">{catName}</span>}
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">
          {product.description || "Premium organic product, naturally sourced."}
        </p>
        <div className="product-foot">
          <div>
            <span className="product-price">₹{product.price}</span>
            {product.stock < 10 && product.stock > 0 && (
              <span className="low-stock">Only {product.stock} left!</span>
            )}
            {product.stock === 0 && (
              <span className="out-of-stock">Out of stock</span>
            )}
          </div>
          <button
            className="btn btn-primary btn-small add-btn"
            onClick={() => onAddToCart(product.id)}
            disabled={isAdding || product.stock === 0}
          >
            {isAdding ? "…" : "+ Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
