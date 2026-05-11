import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get("/categories");
        const data = Array.isArray(res?.data) ? res.data : [];
        setCategories(data);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || fetchError?.message || "Failed to fetch categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return <div className="container"><p>Loading categories...</p></div>;
  }

  return (
    <div className="container">
      <h1>Categories</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.id}
              className="card"
              style={{ textAlign: "center", cursor: "pointer" }}
              onClick={() => navigate(`/shop?categoryId=${category.id}&name=${encodeURIComponent(category.name)}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate(`/shop?categoryId=${category.id}&name=${encodeURIComponent(category.name)}`);
                }
              }}
            >
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }}
                />
              ) : (
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛍️</div>
              )}
              <h3>{category.name}</h3>
              <p>Explore products</p>
            </div>
          ))
        ) : (
          <p>No categories available</p>
        )}
      </div>
    </div>
  );
}
