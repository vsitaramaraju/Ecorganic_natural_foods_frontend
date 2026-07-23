import {
  useEffect,
  useMemo,
  useState,
  useContext,
  useRef,
  useCallback
} from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Home.css";
import { useCart } from "../context/CartContext";
import { getRecentProducts } from "../utils/RecentlyViewed";
import ProductCard from "../components/ProductCard";
import { wishlistAPI } from "../api/wishlistAPI";
import {
  CATEGORY_BG_IMAGES,
  ORGANIC_CATEGORY_ICONS
} from "../constants/category";
import HeroSection from "../components/HeroSection";
import Categories from "../components/Categories";

const getCategoryIcon = name => {
  const key = String(name || "").toLowerCase();
  for (const [k, icon] of Object.entries(ORGANIC_CATEGORY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return "🌱";
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
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { incrementCart } = useCart();
  const [recentProducts, setRecentProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const toastRef = useRef();

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

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setRecentProducts(getRecentProducts(user.id));
    } else {
      setRecentProducts([]);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadWishlist = async () => {
      try {
        const response = await wishlistAPI.getWishlist();

        const ids = new Set(response.data.map(item => item.product.id));

        setWishlistIds(ids);
      } catch (err) {
        console.error(err);
      }
    };

    loadWishlist();
  }, [isAuthenticated]);

  const showToast = msg => {
    clearTimeout(toastRef.current);

    setToast(msg);

    toastRef.current = setTimeout(() => {
      setToast("");
    }, 2500);
  };

  const addToCart = async productId => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setAddingId(productId);
    try {
      await API.post("/cart", { productId, quantity: 1 });
      incrementCart(1); // ← ADD THIS LINE
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
      document
        .getElementById("products-section")
        .scrollIntoView({ behavior: "smooth" });
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

  const visibleProducts = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  const recentProduct = useMemo(() => {
    return recentProducts.slice(0, 8);
  }, [recentProducts]);

  const scrollProducts = useCallback(() => {
    document.getElementById("products-section")?.scrollIntoView({
      behavior: "smooth"
    });
  }, []);

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
      <HeroSection scrollProducts={scrollProducts} navigate={navigate} />
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
      <Categories
        categories={categories}
        activeCategory={activeCategory}
        handleCategorySelect={handleCategorySelect}
        setProducts={setProducts}
        allProducts={allProducts}
        setActiveCategory={setActiveCategory}
      />

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
              visibleProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={addToCart}
                  addingId={addingId}
                  wishlistIds={wishlistIds}
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
          {products.length >= 8 && (
            <div
              style={{
                textAlign: "center",
                marginTop: "30px"
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => navigate("/shop")}
              >
                View More Products
              </button>
            </div>
          )}
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
                  wishlistIds={wishlistIds}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      {isAuthenticated ? (
        recentProducts.length > 0 && (
          <section className="recently-viewed-section">
            <div className="container">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Recently Viewed Products</h2>
                  <p className="section-subtitle">
                    Continue where you left off
                  </p>
                </div>
              </div>

              <div className="product-grid">
                {recentProduct.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    addingId={addingId}
                    wishlistIds={wishlistIds}
                  />
                ))}
              </div>
              {recentProducts.length >= 8 && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "30px"
                  }}
                >
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/shop")}
                  >
                    View More Products
                  </button>
                </div>
              )}
            </div>
          </section>
        )
      ) : (
        <section className="cta-banner">
          <div className="cta-content">
            <h2>Ready to eat healthier?</h2>
            <p>
              Join 10,000+ families who switched to organic with EchOrganics
            </p>
            <button
              className="btn btn-accent"
              onClick={() => navigate("/register")}
            >
              Create Free Account →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
