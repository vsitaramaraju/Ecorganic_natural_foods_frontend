import { useEffect, useState, useRef } from "react";
import { fetchCategories, saveCategory, deleteCategory } from "./adminShared";
import { IMAGE_BASE_URL } from "../../api/api";

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

const DEFAULT_FORM = { name: "", imageFiles: [] };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    const data = await fetchCategories();
    setCategories(data);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } catch (e) {
        setMessage({
          type: "error",
          text: e?.message || "Failed to load categories"
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  };

  const startEdit = cat => {
    setForm({ name: cat.name || "", imageFiles: [] });
    setEditingId(cat.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Category name is required" });
      return;
    }

    // When creating new category, at least one image is required
    if (!editingId && (!form.imageFiles || form.imageFiles.length === 0)) {
      setMessage({ type: "error", text: "At least one image is required" });
      return;
    }

    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });

      // Use FormData for multipart file upload
      const formData = new FormData();
      formData.append("name", form.name.trim());

      // Add image files
      if (form.imageFiles && form.imageFiles.length > 0) {
        form.imageFiles.forEach(file => {
          formData.append("images", file);
        });
      }

      await saveCategory(formData, editingId);
      await loadData();
      setMessage({
        type: "success",
        text: editingId ? "Category updated" : "Category created"
      });
      resetForm();
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.message || e?.message || "Failed to save category"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      setIsDeleting(id);
      setMessage({ type: "", text: "" });
      await deleteCategory(id);
      await loadData();
      setMessage({ type: "success", text: "Category deleted" });
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.message ||
          e?.message ||
          "Failed to delete category"
      });
    } finally {
      setIsDeleting(null);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) return <p>Loading categories...</p>;

  return (
    <div className="admin-stack">
      <section className="card admin-section">
        <h3>{editingId ? "Edit Category" : "Add Category"}</h3>
        {message.text && (
          <div
            className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
          >
            {message.text}
          </div>
        )}
        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cat-name">Name</label>
            <input
              id="cat-name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              placeholder="e.g. Vegetables"
            />
          </div>
          <div className="form-group admin-form-full">
            <label htmlFor="cat-images">Upload Category Images</label>
            <input
              id="cat-images"
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
                
                setForm(p => ({ ...p, imageFiles: validFiles }));
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
              Select one or more images (jpg, jpeg, png, gif, webp). Minimum 1 image required for new categories.
            </small>
            {form.imageFiles && form.imageFiles.length > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap"
                }}
              >
                {form.imageFiles.map((file, idx) => (
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
                        const updated = form.imageFiles.filter(
                          (_, i) => i !== idx
                        );
                        setForm(p => ({
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
                  ? "Update Category"
                  : "Create Category"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={resetForm}
              disabled={isSaving}
            >
              {editingId ? "Cancel Edit" : "Clear"}
            </button>
          </div>
        </form>
      </section>

      <section className="card admin-section">
        <h3>Categories ({categories.length})</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="admin-empty-row">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id}>
                    <td>
                      <strong>{cat.name}</strong>
                    </td>
                    <td>
                      {(() => {
                        const displayImage =
                          cat?.images?.[0]?.imageUrl || cat?.imageUrl;
                        const fullImageUrl = displayImage ? IMAGE_BASE_URL + displayImage : null;
                        return fullImageUrl ? (
                          <img
                            src={fullImageUrl}
                            alt={cat.name}
                            width="48"
                            height="48"
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 6
                            }}
                          />
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => startEdit(cat)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-small"
                          style={{
                            color: "#dc2626",
                            borderColor: "#dc2626",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1.5px solid"
                          }}
                          onClick={() => setDeleteConfirm(cat.id)}
                          disabled={isDeleting === cat.id}
                        >
                          {isDeleting === cat.id ? "Deleting…" : "🗑 Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
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
            <h3>Delete Category?</h3>
            <p>
              This may affect products in this category. This action cannot be
              undone.
            </p>
            <div className="admin-form-actions">
              <button
                className="btn btn-primary"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting === deleteConfirm}
              >
                {isDeleting === deleteConfirm ? "Deleting…" : "Yes, Delete"}
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
