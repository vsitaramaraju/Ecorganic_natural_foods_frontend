import { useNavigate } from "react-router-dom";
import "./SearchResultsPopup.css";

export default function SearchResultsPopup({
  results = [],
  isOpen = false,
  isLoading = false,
  searchQuery = "",
  onClose = () => {}
}) {
  const navigate = useNavigate();
  const maxItemsInPopup = 6;

  const handleProductClick = productId => {
    navigate(`/products/${productId}`);
    onClose();
  };

  const handleShowAll = () => {
    const params = new URLSearchParams({ query: searchQuery });
    navigate(`/search?${params.toString()}`);
    onClose();
  };

  // Handle API response structure: { count, products: [...] }
  const displayResults = Array.isArray(results)
    ? results
    : results?.products || [];

  if (!isOpen) return null;

  return (
    <div className="search-popup-overlay">
      <div className="search-popup-box">
        {/* Header */}
        <div className="search-popup-header">
          <h3>Search Results</h3>
          <button
            className="search-popup-close"
            onClick={onClose}
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="search-popup-content">
          {isLoading ? (
            <div className="search-loading">
              <div className="spinner" />
              <p>Searching...</p>
            </div>
          ) : displayResults.length === 0 ? (
            <div className="search-empty">
              <span className="empty-icon">🔍</span>
              <p>No products found</p>
              {searchQuery && (
                <p className="search-query-hint">
                  Try different keywords for "{searchQuery}"
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="search-results-list">
                {displayResults.slice(0, maxItemsInPopup).map(product => (
                  <button
                    key={product.id}
                    className="search-result-item"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {/* Product Image */}
                    <div className="search-result-img">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          width="60"
                          height="60"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="search-result-placeholder">🌿</div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="search-result-info">
                      <h4>{product.name}</h4>
                      {product.description && (
                        <p className="search-result-desc">
                          {product.description.substring(0, 60)}...
                        </p>
                      )}
                      <div className="search-result-footer">
                        <span className="search-result-price">
                          ₹{product.price}
                        </span>
                        {product.category?.name && (
                          <span className="search-result-category">
                            {product.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Show All Button */}
              {displayResults.length > maxItemsInPopup && (
                <button className="search-show-all" onClick={handleShowAll}>
                  Show All {displayResults.length} Products →
                </button>
              )}

              {/* Results Count */}
              <div className="search-results-count">
                Showing {Math.min(maxItemsInPopup, displayResults.length)} of{" "}
                {displayResults.length} results
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
