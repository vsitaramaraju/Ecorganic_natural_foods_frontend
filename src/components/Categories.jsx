import React from "react";

const Categories = React.memo(
  ({
    categories,
    activeCategory,
    handleCategorySelect,
    setProducts,
    allProducts,
    setActiveCategory
  }) => {
    return (
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">
                Explore our range of certified organic products
              </p>
            </div>
          </div>
          <div className="category-grid">
            {categories.length > 0 ? (
              categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-card ${activeCategory === String(cat.id) ? "active" : ""}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    width="300"
                    height="300"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
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
        <button
          className="btn btn-secondary"
          onClick={() => {
            setActiveCategory("all");
            setProducts(allProducts);
            document
              .getElementById("products-section")
              .scrollIntoView({ behavior: "smooth" });
          }}
        >
          Show All
        </button>
      </section>
    );
  }
);

export default Categories;
