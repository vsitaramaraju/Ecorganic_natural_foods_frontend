import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Categories.css";

const getCategoryIcon = name => {
  const n = String(name || "").toLowerCase();
  if (n.includes("vegetable")) return "🥦";
  if (n.includes("fruit")) return "🍎";
  if (n.includes("dairy")) return "🥛";
  if (n.includes("grain")) return "🌾";
  if (n.includes("herb")) return "🌿";
  if (n.includes("nut")) return "🥜";
  if (n.includes("oil")) return "🫒";
  if (n.includes("pulse")) return "🫘";
  if (n.includes("spice")) return "🌶️";
  if (n.includes("honey")) return "🍯";
  if (n.includes("tea")) return "🍵";
  return "🌱";
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/categories")
      .then(res => setCategories(Array.isArray(res?.data) ? res.data : []))
      .catch(e => setError(e?.message || "Failed to load categories"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading)
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="container">
      <div style={{ paddingTop: "var(--space-xl)" }}>
        <h1 className="section-title">Browse Categories</h1>
        <p className="section-subtitle">
          Explore our full range of organic product categories
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {categories.length > 0 ? (
          <div className="cat-page-grid">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="cat-page-card"
                onClick={() => navigate(`/shop?categoryId=${cat.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter") navigate(`/shop?categoryId=${cat.id}`);
                }}
              >
                <div className="cat-page-img">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      width="300"
                      height="225"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="cat-page-icon">
                      {getCategoryIcon(cat.name)}
                    </span>
                  )}
                </div>
                <div className="cat-page-body">
                  <h3>{cat.name}</h3>
                  <p>Explore products →</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <h2>No categories yet</h2>
            <p>Check back soon — we're adding more categories!</p>
          </div>
        )}
      </div>
    </div>
  );
}
