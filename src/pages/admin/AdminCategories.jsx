import { useEffect, useState } from "react";
import { fetchCategories, saveCategory } from "./adminShared";

const DEFAULT_CATEGORY_FORM = {
  name: "",
  imageUrl: "",
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [categoryForm, setCategoryForm] = useState(DEFAULT_CATEGORY_FORM);

  const loadData = async () => {
    const categoryData = await fetchCategories();
    setCategories(categoryData);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData();
      } catch (error) {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || error?.message || "Failed to load categories",
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const resetForm = () => {
    setCategoryForm(DEFAULT_CATEGORY_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: categoryForm.name.trim(),
      imageUrl: categoryForm.imageUrl.trim() || undefined,
    };

    if (!payload.name) {
      setMessage({ type: "error", text: "Category name is required" });
      return;
    }

    try {
      setIsSaving(true);
      setMessage({ type: "", text: "" });
      await saveCategory(payload, null);
      await loadData();
      setMessage({ type: "success", text: "Category created" });
      resetForm();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Failed to save category",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p>Loading categories...</p>;
  }

  return (
    <div className="admin-stack">
      <section className="card admin-section">
        <h3>Add Category</h3>
        {message.text && (
          <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </div>
        )}
        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category-name">Name</label>
            <input
              id="category-name"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div className="form-group admin-form-full">
            <label htmlFor="category-image-url">Image URL</label>
            <input
              id="category-image-url"
              value={categoryForm.imageUrl}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
          </div>
          <div className="admin-form-actions admin-form-full">
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              Create Category
            </button>
            <button className="btn btn-secondary" type="button" onClick={resetForm} disabled={isSaving}>
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="card admin-section">
        <h3>Categories</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="admin-empty-row">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.imageUrl ? "Available" : "-"}</td>
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
