import { useEffect, useState } from "react";
import { fetchCategories, saveCategory, deleteCategory } from "./adminShared";

const DEFAULT_FORM = { name: "", imageUrl: "" };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }

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
    setForm({ name: cat.name || "", imageUrl: cat.imageUrl || "" });
    setEditingId(cat.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      imageUrl: form.imageUrl.trim() || undefined
    };
    if (!payload.name) {
      setMessage({ type: "error", text: "Category name is required" });
      return;
    }
    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      await saveCategory(payload, editingId);
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

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Delete category "${name}"? This may affect products in this category.`
      )
    )
      return;
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
            <label htmlFor="cat-image">Image URL</label>
            <input
              id="cat-image"
              value={form.imageUrl}
              onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://..."
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
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
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
                      )}
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
                          onClick={() => handleDelete(cat.id, cat.name)}
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
    </div>
  );
}
