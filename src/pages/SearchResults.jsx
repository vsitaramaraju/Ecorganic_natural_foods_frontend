import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { IMAGE_BASE_URL } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { wishlistAPI } from "../api/wishlistAPI";
import "./SearchResults.css";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(new Set());

  const query = searchParams.get("query") || "";
  const categoryId = searchParams.get("categoryId");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const inStock = searchParams.get("inStock");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim() && !categoryId && !minPrice && !maxPrice) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (query) params.append("query", query);
        if (categoryId) params.append("categoryId", categoryId);
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (inStock) params.append("inStock", inStock);

        const response = await API.get(`/products/search?${params.toString()}`);
        const products = Array.isArray(response?.data)
          ? response.data
          : response?.data?.products || [];
        setResults(products);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to search products.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, categoryId, minPrice, maxPrice, inStock]);

  // Check wishlist items
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
      } else {
        await wishlistAPI.addToWishlist(productId);
        setWishlistItems(prev => new Set([...prev, productId]));
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setWishlistLoading(prev => {
        const updated = new Set(prev);
        updated.delete(productId);
        return updated;
      });
    }
  };

  // Apply sorting
  let displayed = [...results];
  if (sortBy === "price-asc") displayed.sort((a, b) => a.price - b.price);
  if (sortBy === "price-desc") displayed.sort((a, b) => b.price - a.price);
  if (sortBy === "name") displayed.sort((a, b) => a.name.localeCompare(b.name));

  const handleProductClick = productId => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="search-page">
      {/* Header */}
      <div className="search-header">
        <div className="container">
          <h1 className="section-title">🔍 Search Results</h1>
          {query && (
            <p className="search-query-display">
              Results for "<strong>{query}</strong>"
            </p>
          )}
          <p className="section-subtitle">
            {displayed.length} product{displayed.length !== 1 ? "s" : ""} found
          </p>

          {/* Sort Controls */}
          <div className="search-controls">
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

      {/* Results */}
      <div className="container search-container">
        {error && <div className="alert alert-error">{error}</div>}

        {isLoading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            <p>Searching products...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No products found</h2>
            <p>
              {query
                ? `Try different keywords for "${query}"`
                : "Start by entering a search term"}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/shop")}
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="search-results-grid">
            {displayed.map(product => (
              <article
                key={product.id}
                className="search-product-card"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="search-card-img">
                  {(() => {
                    const displayImage =
                      product?.images?.[0]?.imageUrl || product?.imageUrl;
                    const fullImageUrl = displayImage ? IMAGE_BASE_URL + displayImage : null;
                    return fullImageUrl ? (
                      <img
                        src={fullImageUrl}
                        alt={product.name}
                        width="300"
                        height="225"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="search-img-placeholder">🌿</div>
                    );
                  })()}
                  {/* Wishlist Button */}
                  <button
                    className={`wishlist-btn-search ${wishlistItems.has(product.id) ? "active" : ""}`}
                    onClick={e => handleWishlist(e, product.id)}
                    disabled={wishlistLoading.has(product.id)}
                    title={
                      wishlistItems.has(product.id)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                  >
                    {wishlistLoading.has(product.id)
                      ? "…"
                      : wishlistItems.has(product.id)
                        ? "❤️"
                        : "🤍"}
                  </button>
                </div>
                <div className="search-card-body">
                  {product.category?.name && (
                    <span className="tag">{product.category.name}</span>
                  )}
                  <h3>{product.name}</h3>
                  {product.description && (
                    <p className="search-card-desc">{product.description}</p>
                  )}
                  <div className="search-card-footer">
                    <span className="search-card-price">₹{product.price}</span>
                    {product.stock === 0 ? (
                      <span className="badge badge-danger">Out of Stock</span>
                    ) : product.stock < 10 ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
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
