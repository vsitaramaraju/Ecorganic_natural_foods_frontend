import { useEffect, useState } from "react";
import {
  fetchCategories,
  fetchProducts,
  fetchProductsByCategory,
  formatCurrency,
  getCategoryName,
  getProductCategoryId,
  saveProduct,
  deleteProduct
} from "./adminShared";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  imageUrl: ""
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeCategory, setActiveCategory] = useState("all");
  const [productForm, setProductForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProduct, setExpandedProduct] = useState(null);

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
    (async () => {
      try {
        await loadData("all");
      } catch (e) {
        setMessage({
          type: "error",
          text:
            e?.response?.data?.message ||
            e?.message ||
            "Failed to load products"
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const resetForm = () => {
    setProductForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = product => {
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price || ""),
      stock: String(product.stock || ""),
      categoryId: getProductCategoryId(product),
      imageUrl: product.imageUrl || ""
    });
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      categoryId: productForm.categoryId
        ? Number(productForm.categoryId)
        : undefined,
      imageUrl: productForm.imageUrl.trim() || undefined
    };
    if (
      !payload.name ||
      isNaN(payload.price) ||
      isNaN(payload.stock) ||
      !payload.categoryId
    ) {
      setMessage({
        type: "error",
        text: "Name, category, price, and stock are required."
      });
      return;
    }
    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      const response = await saveProduct(payload, editingId);
      setMessage({
        type: "success",
        text:
          response?.message ||
          (editingId
            ? "Product updated successfully."
            : "Product created successfully.")
      });
      await loadData(activeCategory);
      resetForm();
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.message || e?.message || "Failed to save product"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async productId => {
    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      const response = await deleteProduct(productId);
      await loadData(activeCategory);
      setMessage({
        type: "success",
        text: response?.message || "Product deleted successfully."
      });
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.message || e?.message || "Failed to delete product"
      });
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
  };

  const handleCategoryFilter = async categoryId => {
    try {
      setIsLoading(true);
      setActiveCategory(categoryId);
      setMessage({ type: "", text: "" });
      await loadData(categoryId);
    } catch (e) {
      setMessage({
        type: "error",
        text: e?.response?.data?.message || e?.message || "Failed to filter"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = products.filter(
    p =>
      !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading)
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );

  return (
    <div className="admin-stack">
      {/* Form Toggle */}
      {!showForm && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Product
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <section className="card admin-section">
          <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>
          {message.text && (
            <div
              className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
            >
              {message.text}
            </div>
          )}
          <form className="admin-form-grid" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="p-name">Name *</label>
              <input
                id="p-name"
                value={productForm.name}
                onChange={e =>
                  setProductForm(p => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="p-category">Category *</label>
              <select
                id="p-category"
                value={productForm.categoryId}
                onChange={e =>
                  setProductForm(p => ({ ...p, categoryId: e.target.value }))
                }
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="p-price">Price *</label>
              <input
                id="p-price"
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={e =>
                  setProductForm(p => ({ ...p, price: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="p-stock">Stock *</label>
              <input
                id="p-stock"
                type="number"
                min="0"
                step="1"
                value={productForm.stock}
                onChange={e =>
                  setProductForm(p => ({ ...p, stock: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group admin-form-full">
              <label htmlFor="p-desc">Description</label>
              <textarea
                id="p-desc"
                rows={3}
                value={productForm.description}
                onChange={e =>
                  setProductForm(p => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="form-group admin-form-full">
              <label htmlFor="p-img">Image URL</label>
              <input
                id="p-img"
                value={productForm.imageUrl}
                onChange={e =>
                  setProductForm(p => ({ ...p, imageUrl: e.target.value }))
                }
              />
            </div>
            <div className="admin-form-actions admin-form-full">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving…"
                  : editingId
                    ? "Update Product"
                    : "Create Product"}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={resetForm}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Products Table */}
      <section className="card admin-section">
        <div className="prod-table-header">
          <h3 style={{ margin: 0 }}>Products ({filtered.length})</h3>
          <div className="prod-table-controls">
            <input
              className="prod-search"
              placeholder="Search products…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter Dropdown */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            margin: "16px 0 24px"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#6b7280"
              }}
            >
              Filter by Category
            </label>

            <select
              value={activeCategory}
              onChange={e => handleCategoryFilter(e.target.value)}
              style={{
                minWidth: "250px",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                background: "#fff",
                color: "#111827",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease"
              }}
            >
              <option value="all">📦 All Categories</option>

              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message.text && !showForm && (
          <div
            className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
          >
            {message.text}
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-row">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map(product => (
                  <>
                    <tr
                      key={product.id}
                      className={
                        expandedProduct === product.id
                          ? "prod-row-expanded"
                          : ""
                      }
                    >
                      <td>
                        <div className="prod-name-cell">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="prod-thumb"
                              onError={e => (e.target.style.display = "none")}
                            />
                          )}
                          <div>
                            <div className="prod-name">{product.name}</div>
                            {product.description && (
                              <button
                                className="prod-detail-toggle"
                                onClick={() =>
                                  setExpandedProduct(
                                    expandedProduct === product.id
                                      ? null
                                      : product.id
                                  )
                                }
                              >
                                {expandedProduct === product.id
                                  ? "▲ less"
                                  : "▼ details"}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{getCategoryName(product)}</td>
                      <td>
                        <strong>{formatCurrency(product.price)}</strong>
                      </td>
                      <td>
                        <span
                          className={`stock-badge ${Number(product.stock ?? 0) === 0 ? "stock-out" : Number(product.stock ?? 0) < 10 ? "stock-low" : "stock-ok"}`}
                        >
                          {product.stock ?? 0}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-status-pill ${Number(product.stock ?? 0) === 0 ? "status-cancelled" : "status-delivered"}`}
                        >
                          {Number(product.stock ?? 0) === 0
                            ? "Out of Stock"
                            : "In Stock"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-row">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => startEdit(product)}
                            title="Edit"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => setDeleteConfirm(product.id)}
                            title="Delete"
                            disabled={isSaving}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProduct === product.id && (
                      <tr
                        key={`${product.id}-detail`}
                        className="prod-detail-row"
                      >
                        <td colSpan={6}>
                          <div className="prod-detail-box">
                            <strong>Description:</strong>{" "}
                            {product.description || "No description provided."}
                            {product.imageUrl && (
                              <div style={{ marginTop: 8 }}>
                                <strong>Image:</strong>{" "}
                                <a
                                  href={product.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {product.imageUrl}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Delete Product?</h3>
            <p>This action cannot be undone.</p>
            <div className="admin-form-actions">
              <button
                className="btn btn-primary"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isSaving}
              >
                {isSaving ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
