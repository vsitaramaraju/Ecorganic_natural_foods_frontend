import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import "./Home.css";

const categoryVisuals = {
  electronics: {
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80",
    icon: "📱",
  },
  fashion: {
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=80",
    icon: "👗",
  },
  "home & garden": {
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80",
    icon: "🏠",
  },
  books: {
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=80",
    icon: "📚",
  },
  sports: {
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80",
    icon: "⚽",
  },
  "health & beauty": {
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80",
    icon: "💄",
  },
};

const getCategoryName = (product) => {
  if (typeof product?.category === "string") {
    return product.category;
  }

  return product?.category?.name || "General";
};

const normalizeCategory = (value) => String(value || "").trim().toLowerCase();

const getCategoryVisual = (name) => {
  const key = normalizeCategory(name);
  return (
    categoryVisuals[key] || {
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80",
      icon: "🛍️",
    }
  );
};

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setError("");

        const [productsRes, categoriesRes] = await Promise.all([
          API.get("/products"),
          API.get("/categories"),
        ]);

        const productsData = Array.isArray(productsRes?.data) ? productsRes.data : [];
        const categoriesDataRaw = categoriesRes?.data;

        const categoriesFromApi = Array.isArray(categoriesDataRaw)
          ? categoriesDataRaw
          : Array.isArray(categoriesDataRaw?.data)
            ? categoriesDataRaw.data
            : [];

        const mappedCategories = categoriesFromApi
          .map((category) => {
            const categoryName = category?.name || category?.title;
            if (!categoryName) {
              return null;
            }

            return {
              id: String(category?.id || categoryName),
              name: categoryName,
              ...getCategoryVisual(categoryName),
              image: category?.imageUrl || getCategoryVisual(categoryName).image,
            };
          })
          .filter(Boolean);

        const fallbackCategoryNames = [...new Set(productsData.map((product) => getCategoryName(product)))];

        const fallbackCategories = fallbackCategoryNames.map((name) => ({
          id: name,
          name,
          ...getCategoryVisual(name),
        }));

        setAllProducts(productsData);
        setProducts(productsData);
        setCategories(mappedCategories.length > 0 ? mappedCategories : fallbackCategories);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError?.message || "Failed to load home page");
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const addToCart = async (productId) => {
    try {
      await API.post("/cart", {
        productId,
        quantity: 1
      });

      alert("Added to cart");
    } catch (err) {
      alert(err.response?.data?.message || "Error adding to cart");
    }
  };

  const handleCategorySelect = async (category) => {
    const categoryId = category?.id;
    const categoryName = category?.name || "all";

    if (!categoryId || categoryName === "all") {
      setActiveCategory("all");
      setProducts(allProducts);
      return;
    }

    try {
      setIsCategoryLoading(true);
      setError("");
      setActiveCategory(categoryName);

      const res = await API.get(`/products/category/${categoryId}`);
      setProducts(Array.isArray(res?.data) ? res.data : []);
    } catch (categoryError) {
      setError(
        categoryError?.response?.data?.message ||
        categoryError?.message ||
        "Failed to fetch category products"
      );
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const featuredProducts = useMemo(() => {
    return allProducts.slice(0, 8);
  }, [allProducts]);

  if (isLoading) {
    return (
      <div className="home-page">
        <p>Loading home page...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="home-banner">
        <div className="home-banner-content">
          <p className="home-eyebrow">New Season Collection</p>
          <h1>Discover Style, Tech, and Everyday Essentials</h1>
          <p className="home-banner-text">
            Shop trending picks across categories. Click a category below to quickly explore products.
          </p>
          <a href="#home-categories" className="btn btn-primary home-cta">
            Explore Categories
          </a>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section id="home-categories" className="home-section">
        <div className="home-section-head">
          <h2>Browse Categories</h2>
          <button className="btn btn-secondary" onClick={() => handleCategorySelect({ id: "all", name: "all" })}>
            Show All
          </button>
        </div>

        <div className="home-category-grid">
          {categories.length > 0 ? (
            categories.map((category) => {
              const isActive = normalizeCategory(activeCategory) === normalizeCategory(category.name);
              return (
                <button
                  key={category.id}
                  className={`home-category-card ${isActive ? "active" : ""}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  <img src={category.image} alt={category.name} loading="lazy" />
                  <div className="home-category-overlay">
                    <span className="home-category-icon">{category.icon}</span>
                    <h3>{category.name}</h3>
                  </div>
                </button>
              );
            })
          ) : (
            <p>No categories available.</p>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>
            {activeCategory === "all"
              ? "All Products"
              : `${activeCategory} Products`}
          </h2>
          <p>{isCategoryLoading ? "Loading..." : `${products.length} items`}</p>
        </div>

        <div className="home-product-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <article key={product.id} className="home-product-card">
                <div className="home-product-top">
                  <span className="home-product-category">{getCategoryName(product)}</span>
                </div>
                <h3>{product.name}</h3>
                <p className="home-product-desc">{product.description || "Quality product from our latest collection."}</p>
                <div className="home-product-foot">
                  <p className="home-product-price">₹{product.price}</p>
                  <button className="btn btn-primary" onClick={() => addToCart(product.id)}>
                    Add to Cart
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p>{isCategoryLoading ? "Loading products..." : "No products found in this category."}</p>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>Featured Picks</h2>
          <p>Handpicked sample products</p>
        </div>
        <div className="home-product-grid home-featured-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <article key={`featured-${product.id}`} className="home-product-card featured">
                <div className="home-product-top">
                  <span className="home-product-category">{getCategoryName(product)}</span>
                </div>
                <h3>{product.name}</h3>
                <p className="home-product-desc">{product.description || "Trending item with great value."}</p>
                <div className="home-product-foot">
                  <p className="home-product-price">₹{product.price}</p>
                  <button className="btn btn-secondary" onClick={() => addToCart(product.id)}>
                    Quick Add
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p>No products available.</p>
          )}
        </div>
      </section>
    </div>
  );
}