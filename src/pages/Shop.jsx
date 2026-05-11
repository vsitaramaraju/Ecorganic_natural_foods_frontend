import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { productAPI } from "../api/api";

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("name");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = categoryId
          ? await productAPI.getProductsByCategory(categoryId)
          : await productAPI.getAllProducts();
        setProducts(data);
      } catch (err) {
        setError(err.message || "Failed to fetch products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  if (isLoading) return <div><p>Loading products...</p></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="container">
      <h1>{categoryId ? `${categoryName || "Category"} Products` : "Shop"}</h1>
      <div className="grid">
        {products && products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="text-lg font-bold">${product.price}</p>
            </div>
          ))
        ) : (
          <p>No products available</p>
        )}
      </div>
    </div>
  );
}
