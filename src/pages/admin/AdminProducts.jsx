import { useEffect, useState } from "react";
import {
  fetchCategories,
  fetchProducts,
  fetchProductsByCategory,
  formatCurrency,
  getCategoryName,
  saveProduct,
} from "./adminShared";

const DEFAULT_PRODUCT_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  imageUrl: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeCategory, setActiveCategory] = useState("all");
  const [productForm, setProductForm] = useState(DEFAULT_PRODUCT_FORM);

  const loadData = async (categoryId = "all") => {
    const categoryData = await fetchCategories();
    const productData =
      categoryId === "all"
        ? await fetchProducts()
        : await fetchProductsByCategory(Number(categoryId));

    setProducts(productData);
    setCategories(categoryData);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData("all");
      } catch (error) {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || error?.message || "Failed to load products",
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const resetForm = () => {
    setProductForm(DEFAULT_PRODUCT_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      categoryId: productForm.categoryId ? Number(productForm.categoryId) : undefined,
      imageUrl: productForm.imageUrl.trim() || undefined,
    };

    if (!payload.name || Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
      setMessage({
        type: "error",
        text: "Product name, valid price and valid stock are required",
      });
      return;
    }

    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      await saveProduct(payload, null);
      await loadData(activeCategory);
      setMessage({ type: "success", text: "Product created" });
      resetForm();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Failed to save product",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryFilter = async (categoryId) => {
    try {
      setIsLoading(true);
      setActiveCategory(categoryId);
      setMessage({ type: "", text: "" });
      await loadData(categoryId);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Failed to filter products",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <p>Loading products...</p>;
  }

  return (
    <div className="admin-stack">
      <section className="card admin-section">
        <h3>Add Product</h3>
        {message.text && (
          <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </div>
        )}
        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="product-name">Name</label>
            <input
              id="product-name"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="product-price">Price</label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="product-stock">Stock</label>
            <input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              value={productForm.stock}
              onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="product-category">Category</label>
            <select
              id="product-category"
              value={productForm.categoryId}
              onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group admin-form-full">
            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              rows={3}
              value={productForm.description}
              onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <div className="form-group admin-form-full">
            <label htmlFor="product-image">Image URL</label>
            <input
              id="product-image"
              value={productForm.imageUrl}
              onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
          </div>
          <div className="admin-form-actions admin-form-full">
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              Create Product
            </button>
            <button className="btn btn-secondary" type="button" onClick={resetForm} disabled={isSaving}>
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="card admin-section">
        <h3>Products</h3>
        <div className="admin-form-actions" style={{ marginBottom: "14px" }}>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={isLoading}
            onClick={() => handleCategoryFilter("all")}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className="btn btn-secondary"
              type="button"
              disabled={isLoading}
              onClick={() => handleCategoryFilter(String(category.id))}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-row">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{getCategoryName(product)}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.stock ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
