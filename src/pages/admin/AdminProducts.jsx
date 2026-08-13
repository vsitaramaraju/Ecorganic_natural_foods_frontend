import { useEffect, useState, useRef } from "react";
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
import { IMAGE_BASE_URL } from "../../api/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  pricingType: "fixed", // "fixed" | "weight"
  weightValue: "",
  weightUnit: "g", // "g" | "kg"
  stock: "",
  categoryId: "",
  imageFiles: [] // Multiple image files
};

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": true,
  "image/png": true,
  "image/gif": true,
  "image/webp": true
};

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const validateImageFile = file => {
  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return {
      valid: false,
      error: `Invalid file type: ${file.name}. Allowed formats: jpg, jpeg, png, gif, webp`
    };
  }

  // Check file extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension: ${file.name}. Allowed formats: jpg, jpeg, png, gif, webp`
    };
  }

  return { valid: true };
};

const validateImageFiles = files => {
  const errors = [];
  const validFiles = [];

  files.forEach(file => {
    const validation = validateImageFile(file);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      errors.push(validation.error);
    }
  });

  return { validFiles, errors };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Turns { pricingType, weightValue, weightUnit } into the priceUnit string
// the backend expects, e.g. "fixed" or "per_200g" / "per_1.5kg".
const buildPriceUnit = form => {
  if (form.pricingType === "fixed") return "fixed";
  const value = Number(form.weightValue);
  if (!value || value <= 0) return null;
  const clean = Number(value.toFixed(2)).toString();
  return `per_${clean}${form.weightUnit}`;
};

// Reverse of buildPriceUnit — used when editing an existing product to
// prefill the form. Handles the legacy "per_kg" value (no explicit number,
// treated as 1kg) as well as any custom "per_<value><g|kg>" value.
const parsePriceUnit = priceUnit => {
  if (!priceUnit || priceUnit === "fixed") {
    return { pricingType: "fixed", weightValue: "", weightUnit: "g" };
  }
  if (priceUnit === "per_kg") {
    return { pricingType: "weight", weightValue: "1", weightUnit: "kg" };
  }
  const match = /^per_(\d+(?:\.\d+)?)(g|kg)$/.exec(priceUnit);
  if (!match) {
    return { pricingType: "fixed", weightValue: "", weightUnit: "g" };
  }
  return { pricingType: "weight", weightValue: match[1], weightUnit: match[2] };
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
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const categoryMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!showCategoryMenu) return;
    const handleClickOutside = e => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target)
      ) {
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCategoryMenu]);

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
    const { pricingType, weightValue, weightUnit } = parsePriceUnit(
      product.priceUnit
    );
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price || ""),
      pricingType,
      weightValue,
      weightUnit,
      stock: String(product.stock || ""),
      categoryId: getProductCategoryId(product),
      imageFiles: [] // Clear file selection when editing
    });
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const priceUnit = buildPriceUnit(productForm);

    if (productForm.pricingType === "weight" && !priceUnit) {
      setMessage({
        type: "error",
        text: "Please enter a valid weight (e.g. 150, 200, 350) for this product."
      });
      return;
    }

    if (
      !productForm.name.trim() ||
      isNaN(Number(productForm.price)) ||
      isNaN(Number(productForm.stock)) ||
      !productForm.categoryId
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

      // Use FormData for multipart file upload
      const formData = new FormData();
      formData.append("name", productForm.name.trim());
      formData.append("description", productForm.description.trim());
      formData.append("price", Number(productForm.price));
      formData.append("priceUnit", priceUnit);
      formData.append("stock", Number(productForm.stock));
      formData.append("categoryId", Number(productForm.categoryId));

      // Add multiple image files
      if (productForm.imageFiles && productForm.imageFiles.length > 0) {
        productForm.imageFiles.forEach(file => {
          formData.append("images", file);
        });
      }

      const response = await saveProduct(formData, editingId);
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

  // Reset to page 1 whenever the search, category, or page size changes so
  // the user doesn't land on an empty/out-of-range page.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    (safePage - 1) * pageSize + pageSize
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
        <div style={{ display: "flex", justifyContent: "center" }}>
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
              <label htmlFor="p-price">Price (₹) *</label>
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
              <label htmlFor="p-pricing-type">Pricing Type *</label>
              <select
                id="p-pricing-type"
                value={productForm.pricingType}
                onChange={e =>
                  setProductForm(p => ({ ...p, pricingType: e.target.value }))
                }
              >
                <option value="fixed">Fixed Price (single item)</option>
                <option value="weight">Weight-based (grams / kg)</option>
              </select>
              <small
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block"
                }}
              >
                {productForm.pricingType === "fixed"
                  ? "Price is for a single item (e.g. a bottle, box)"
                  : "Set the exact pack size this product is sold in below"}
              </small>
            </div>
            {productForm.pricingType === "weight" && (
              <div className="form-group">
                <label htmlFor="p-weight-value">Pack Size *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    id="p-weight-value"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 150, 200, 350, 1"
                    value={productForm.weightValue}
                    onChange={e =>
                      setProductForm(p => ({
                        ...p,
                        weightValue: e.target.value
                      }))
                    }
                    style={{ flex: 2 }}
                    required
                  />
                  <select
                    value={productForm.weightUnit}
                    onChange={e =>
                      setProductForm(p => ({
                        ...p,
                        weightUnit: e.target.value
                      }))
                    }
                    style={{ flex: 1 }}
                  >
                    <option value="g">grams (g)</option>
                    <option value="kg">kilograms (kg)</option>
                  </select>
                </div>
                <small
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    marginTop: "4px",
                    display: "block"
                  }}
                >
                  {productForm.weightValue
                    ? `Price above is per ${productForm.weightValue}${productForm.weightUnit} pack. Stock below = number of these packs.`
                    : "Enter any real-world pack size — not limited to 100g/250g/500g/1kg."}
                </small>
              </div>
            )}
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
              <label htmlFor="p-images">Upload Multiple Product Images</label>
              <input
                id="p-images"
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  const { validFiles, errors } = validateImageFiles(files);
                  
                  if (errors.length > 0) {
                    setMessage({
                      type: "error",
                      text: errors.join("\n")
                    });
                  }
                  
                  setProductForm(p => ({ ...p, imageFiles: validFiles }));
                }}
              />
              <small
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block"
                }}
              >
                Select one or more images (jpg, jpeg, png, gif, webp). These will appear as thumbnails on the product page.
              </small>
              {productForm.imageFiles && productForm.imageFiles.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap"
                  }}
                >
                  {productForm.imageFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "2px solid #e5e7eb"
                      }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${idx}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = productForm.imageFiles.filter(
                            (_, i) => i !== idx
                          );
                          setProductForm(p => ({
                            ...p,
                            imageFiles: updated
                          }));
                        }}
                        style={{
                          position: "absolute",
                          top: "-2px",
                          right: "-2px",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          cursor: "pointer",
                          fontSize: "14px",
                          lineHeight: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{
                padding: "8px 12px",
                border: "1.5px solid #e5e7eb",
                borderRadius: 8
              }}
              title="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
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
            className="admin-cat-filter"
            ref={categoryMenuRef}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              position: "relative"
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

            <button
              type="button"
              className="admin-cat-filter-trigger"
              onClick={() => setShowCategoryMenu(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={showCategoryMenu}
            >
              <span>
                {activeCategory === "all"
                  ? "📦 All Categories"
                  : categories.find(c => String(c.id) === activeCategory)
                      ?.name || "All Categories"}
              </span>
              <span
                className={`admin-cat-filter-caret ${showCategoryMenu ? "open" : ""}`}
              >
                ▾
              </span>
            </button>

            {showCategoryMenu && (
              <ul className="admin-cat-filter-menu" role="listbox">
                <li
                  role="option"
                  aria-selected={activeCategory === "all"}
                  className={activeCategory === "all" ? "active" : ""}
                  onClick={() => {
                    handleCategoryFilter("all");
                    setShowCategoryMenu(false);
                  }}
                >
                  📦 All Categories
                </li>
                {categories.map(c => (
                  <li
                    key={c.id}
                    role="option"
                    aria-selected={activeCategory === String(c.id)}
                    className={activeCategory === String(c.id) ? "active" : ""}
                    onClick={() => {
                      handleCategoryFilter(String(c.id));
                      setShowCategoryMenu(false);
                    }}
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-row">
                    No products found.
                  </td>
                </tr>
              ) : (
                paginated.map(product => (
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
                              src={IMAGE_BASE_URL + product.imageUrl}
                              alt=""
                              className="prod-thumb"
                              width="38"
                              height="38"
                              loading="lazy"
                              decoding="async"
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
                        {product.priceUnit && product.priceUnit !== "fixed" && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              display: "block",
                              marginTop: "2px"
                            }}
                          >
                            /{" "}
                            {product.priceUnit
                              .replace("per_", "")
                              .replace("kg", "KG")}
                          </span>
                        )}
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
                                <strong>Main Image:</strong>{" "}
                                <a
                                  href={product.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {product.imageUrl}
                                </a>
                              </div>
                            )}
                            {product.images && product.images.length > 0 && (
                              <div style={{ marginTop: 12 }}>
                                <strong>Product Images ({product.images.length}):</strong>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                    marginTop: "8px"
                                  }}
                                >
                                  {product.images.map((img, idx) => (
                                    <a
                                      key={idx}
                                      href={img.imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={img.imageUrl}
                                      style={{
                                        display: "inline-block",
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "6px",
                                        overflow: "hidden",
                                        border: "1px solid #e5e7eb"
                                      }}
                                    >
                                      <img
                                        src={IMAGE_BASE_URL + img.imageUrl}
                                        alt={`Image ${idx + 1}`}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover"
                                        }}
                                        onError={e =>
                                          (e.target.style.display = "none")
                                        }
                                      />
                                    </a>
                                  ))}
                                </div>
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

        <div className="admin-pagination">
          <p className="admin-pagination-summary">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} of{" "}
            {filtered.length} products
          </p>

          {totalPages > 1 && (
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="btn-action"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                ← Prev
              </button>
              <span className="admin-pagination-page">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-action"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
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
