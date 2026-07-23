import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { wishlistAPI } from "../api/wishlistAPI";
import "./Shop.css";
import { useCart } from "../context/CartContext";
import { saveRecentProduct } from "../utils/RecentlyViewed";

// Builds a compact list of page numbers with "…" gaps, e.g. [1, "…", 4, 5, 6, "…", 12]
function getPageNumbers(current, total) {
  const delta = 1;
  const range = [];
  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i);
  }

  const pages = [1];
  if (range[0] > 2) pages.push("…");
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push("…");
  if (total > 1) pages.push(total);

  return pages;
}

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
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;
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

  const handleWishlist = async (e, productId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setWishlistLoading(prev => new Set([...prev, productId]));
    try {
      if (wishlistItems.has(productId)) {
        await wishlistAPI.removeFromWishlist(productId);
        setWishlistItems(prev => {
          const updated = new Set(prev);
          updated.delete(productId);
          return updated;
        });
        showToast("Removed from wishlist ✓");
      } else {
        await wishlistAPI.addToWishlist(productId);
        setWishlistItems(prev => new Set([...prev, productId]));
        showToast("Added to wishlist ❤️");
      }
    } catch (error) {
      showToast(error?.response?.data?.message || "Error updating wishlist");
    } finally {
      setWishlistLoading(prev => {
        const updated = new Set(prev);
        updated.delete(productId);
        return updated;
      });
    }
  };

  useEffect(() => {
    const checkWishlistItems = async () => {
      if (!isAuthenticated) {
        setWishlistItems(new Set());
        return;
      }

      try {
        const response = await wishlistAPI.getWishlist();
        const items = Array.isArray(response?.data)
          ? response.data
          : response?.data?.data || [];
        const wishlistIds = new Set(items.map(item => item.productId));
        setWishlistItems(wishlistIds);
      } catch (error) {
        console.error("Failed to load wishlist:", error);
      }
    };

    checkWishlistItems();
  }, [isAuthenticated]);

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

  const totalPages = Math.max(
    1,
    Math.ceil(displayed.length / PRODUCTS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginated = displayed.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCat, search, sortBy]);

  const goToPage = page => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              {paginated.map(p => (
                <article
                  key={p.id}
                  className="shop-product-card"
                  onClick={() => {
                    navigate(`/products/${p.id}`);
                    saveRecentProduct(p);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="spimg-wrap">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        width="300"
                        height="300"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="spimg-placeholder">🌿</div>
                    )}
                    {/* Wishlist Button */}
                    <button
                      className={`wishlist-btn-shop ${wishlistItems.has(p.id) ? "active" : ""}`}
                      onClick={e => handleWishlist(e, p.id)}
                      disabled={wishlistLoading.has(p.id)}
                      title={
                        wishlistItems.has(p.id)
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      {wishlistLoading.has(p.id)
                        ? "…"
                        : wishlistItems.has(p.id)
                          ? "❤️"
                          : "🤍"}
                    </button>
                  </div>
                  <div className="sp-body">
                    {p.category?.name && (
                      <span className="tag">{p.category.name}</span>
                    )}
                    <h3>{p.name}</h3>
                    <div className="sp-description-wrap">
                      <p className="sp-desc">
                        {p.description || "Premium organic product."}
                      </p>

                      {p.description && p.description.length > 80 && (
                        <button
                          className="show-more-btn"
                          onClick={e => {
                            e.stopPropagation();
                            saveRecentProduct(p);
                            navigate(`/products/${p.id}`);
                          }}
                        >
                          Show More
                        </button>
                      )}
                    </div>
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

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Product pages">
              <button
                className="page-btn page-nav"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                aria-label="Previous page"
              >
                ← Prev
              </button>

              {getPageNumbers(safePage, totalPages).map((item, i) =>
                item === "…" ? (
                  <span key={`ellipsis-${i}`} className="page-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    className={`page-btn ${safePage === item ? "active" : ""}`}
                    onClick={() => goToPage(item)}
                    aria-current={safePage === item ? "page" : undefined}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                className="page-btn page-nav"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                aria-label="Next page"
              >
                Next →
              </button>
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
