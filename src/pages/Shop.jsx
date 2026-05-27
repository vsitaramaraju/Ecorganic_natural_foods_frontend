import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Shop.css";
import { useCart } from "../context/CartContext";

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [activeCat, setActiveCat] = useState(
    searchParams.get("categoryId") || "all"
  );
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState("");
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const { incrementCart } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          API.get("/products"),
          API.get("/categories")
        ]);
        setProducts(Array.isArray(prodRes?.data) ? prodRes.data : []);
        setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
      } catch (e) {
        setError(e?.message || "Failed to load products");
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
      incrementCart(1);
      showToast("Added to cart! 🛒");
    } catch (e) {
      showToast(e?.response?.data?.message || "Error");
    } finally {
      setAddingId(null);
    }
  };

  // Filter & sort
  let displayed = [...products];
  if (activeCat !== "all")
    displayed = displayed.filter(p => String(p.categoryId) === activeCat);
  if (search.trim())
    displayed = displayed.filter(
      p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );
  if (sortBy === "price-asc") displayed.sort((a, b) => a.price - b.price);
  if (sortBy === "price-desc") displayed.sort((a, b) => b.price - a.price);
  if (sortBy === "name") displayed.sort((a, b) => a.name.localeCompare(b.name));

  if (isLoading)
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="shop-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="shop-header">
        <div className="container">
          <h1 className="section-title">🛒 Our Products</h1>
          <p className="section-subtitle">
            All products are certified organic and freshly sourced
          </p>
          <div className="shop-controls">
            <input
              className="search-input"
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="shop-body container">
        {/* Sidebar */}
        <aside className="shop-sidebar">
          <h3>Categories</h3>
          <button
            className={`cat-btn ${activeCat === "all" ? "active" : ""}`}
            onClick={() => setActiveCat("all")}
          >
            🌿 All Products <span className="cat-count">{products.length}</span>
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`cat-btn ${activeCat === String(c.id) ? "active" : ""}`}
              onClick={() => setActiveCat(String(c.id))}
            >
              {c.name}
              <span className="cat-count">
                {products.filter(p => p.categoryId === c.id).length}
              </span>
            </button>
          ))}
        </aside>

        {/* Products */}
        <main className="shop-main">
          {error && <div className="alert alert-error">{error}</div>}
          <p className="result-count">{displayed.length} products found</p>
          {displayed.length > 0 ? (
            <div className="shop-grid">
              {displayed.map(p => (
                <article
                  key={p.id}
                  className="shop-product-card"
                  onClick={() => navigate(`/product/${p.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="spimg-wrap">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="spimg-placeholder">🌿</div>
                    )}
                  </div>
                  <div className="sp-body">
                    {p.category?.name && (
                      <span className="tag">{p.category.name}</span>
                    )}
                    <h3>{p.name}</h3>
                    <p className="sp-desc">
                      {p.description || "Premium organic product."}
                    </p>
                    <div className="sp-foot">
                      <span className="sp-price">₹{p.price}</span>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={e => {
                          e.stopPropagation();
                          addToCart(p.id);
                        }}
                        disabled={addingId === p.id || p.stock === 0}
                      >
                        {addingId === p.id
                          ? "…"
                          : p.stock === 0
                            ? "Out of Stock"
                            : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🌿</div>
              <h2>No products found</h2>
              <p>Try a different category or search term</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
