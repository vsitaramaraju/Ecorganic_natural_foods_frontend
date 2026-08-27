import { useContext, useEffect, useState, useMemo } from "react";
import {
  fetchUsers,
  updateUserRole,
  updateUser,
  deleteUser,
  formatDate
} from "./adminShared";
import { AuthContext } from "../../context/AuthContext";

const ROLES = ["USER", "ADMIN"];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const emptyEditForm = { name: "", email: "", phone: "", role: "USER" };

export default function AdminUsers() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(null); // userId being updated (role dropdown)
  const [message, setMessage] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal state
  const [editingUser, setEditingUser] = useState(null); // full user object
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editErrors, setEditErrors] = useState({});
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // user object
  const [isDeleting, setIsDeleting] = useState(null); // userId being deleted

  const load = async () => {
    const data = await fetchUsers();
    setUsers(data);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setMessage({
          type: "error",
          text:
            e?.response?.data?.message || e?.message || "Failed to load users"
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = [...users];
    if (roleFilter !== "ALL")
      result = result.filter(
        u => String(u.role || "USER").toUpperCase() === roleFilter
      );
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        u =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, search, roleFilter]);

  // Reset to page 1 whenever the filters, search, or page size change so
  // the user doesn't land on an empty/out-of-range page.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setIsSaving(userId);
      setMessage({ type: "", text: "" });
      await updateUserRole(userId, newRole);
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setMessage({ type: "success", text: "User role updated" });
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.message || e?.message || "Failed to update role"
      });
    } finally {
      setIsSaving(null);
    }
  };

  // ---- Edit ----
  const startEdit = user => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: String(user.role || "USER").toUpperCase()
    });
    setEditErrors({});
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm(emptyEditForm);
    setEditErrors({});
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editForm.name.trim()) errors.name = "Name is required";
    if (!editForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim()))
      errors.email = "Enter a valid email";
    return errors;
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    const errors = validateEditForm();
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }

    try {
      setIsEditSaving(true);
      setMessage({ type: "", text: "" });
      const updated = await updateUser(editingUser.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role
      });
      setUsers(prev =>
        prev.map(u => (u.id === editingUser.id ? { ...u, ...updated } : u))
      );
      setMessage({ type: "success", text: "User updated" });
      closeEdit();
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.message || e?.message || "Failed to update user"
      });
    } finally {
      setIsEditSaving(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async userId => {
    try {
      setIsDeleting(userId);
      setMessage({ type: "", text: "" });
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage({ type: "success", text: "User deleted" });
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.message || e?.message || "Failed to delete user"
      });
    } finally {
      setIsDeleting(null);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) return <p>Loading users...</p>;

  const totalAdmins = users.filter(
    u => String(u.role || "").toUpperCase() === "ADMIN"
  ).length;
  const totalUsers = users.length - totalAdmins;

  return (
    <div className="admin-stack">
      {/* Stats */}
      <div className="admin-user-stats-grid">
        {[
          { label: "Total Users", value: users.length, icon: "👥" },
          { label: "Customers", value: totalUsers, icon: "🛒" },
          { label: "Admins", value: totalAdmins, icon: "🔑" }
        ].map(s => (
          <div
            key={s.label}
            className="card"
            style={{
              padding: "16px 20px",
              display: "flex",
              gap: 12,
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: "1.8rem" }}>{s.icon}</span>
            <div>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "#1a2e1a"
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="card admin-section">
        <h3>User Management</h3>

        {message.text && (
          <div
            className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
          >
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <input
            style={{
              flex: 1,
              minWidth: 200,
              padding: "8px 12px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 8
            }}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 8
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="USER">Customers</option>
            <option value="ADMIN">Admins</option>
          </select>
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

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-row">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginated.map((user, idx) => {
                  const isSelf = currentUser?.id === user.id;
                  return (
                    <tr key={user.id}>
                      <td style={{ color: "#9ca3af" }}>
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>
                      <td>
                        <strong>{user.name || "—"}</strong>
                        {isSelf && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.7rem",
                              color: "#6b7280"
                            }}
                          >
                            (You)
                          </span>
                        )}
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || "—"}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <span
                          className={`admin-status-pill ${String(user.role || "USER").toLowerCase() === "admin" ? "status-confirmed" : "status-delivered"}`}
                        >
                          {String(user.role || "USER").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-row">
                          <select
                            value={String(user.role || "USER").toUpperCase()}
                            onChange={e =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            disabled={isSaving === user.id || isSelf}
                            title={
                              isSelf
                                ? "You can't change your own role here"
                                : undefined
                            }
                          >
                            {ROLES.map(r => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-action btn-edit"
                            onClick={() => startEdit(user)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-delete"
                            onClick={() => setDeleteConfirm(user)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "You can't delete your own account"
                                : undefined
                            }
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <p className="admin-pagination-summary">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} of{" "}
            {filtered.length} users
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div
            className="modal-box"
            style={{ maxWidth: 480 }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Edit User</h3>
            <p>Update this user&apos;s details and role.</p>

            <form onSubmit={handleEditSubmit}>
              <div className="admin-form-grid">
                <div className="form-group admin-form-full">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e =>
                      setEditForm(f => ({ ...f, name: e.target.value }))
                    }
                    className={editErrors.name ? "form-error" : ""}
                  />
                  {editErrors.name && (
                    <small style={{ color: "#dc2626" }}>
                      {editErrors.name}
                    </small>
                  )}
                </div>

                <div className="form-group admin-form-full">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e =>
                      setEditForm(f => ({ ...f, email: e.target.value }))
                    }
                    className={editErrors.email ? "form-error" : ""}
                  />
                  {editErrors.email && (
                    <small style={{ color: "#dc2626" }}>
                      {editErrors.email}
                    </small>
                  )}
                </div>

                <div className="form-group admin-form-full">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e =>
                      setEditForm(f => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group admin-form-full">
                  <label>Role</label>
                  <select
                    value={editForm.role}
                    onChange={e =>
                      setEditForm(f => ({ ...f, role: e.target.value }))
                    }
                    disabled={currentUser?.id === editingUser.id}
                    title={
                      currentUser?.id === editingUser.id
                        ? "You can't change your own role here"
                        : undefined
                    }
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-actions" style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEditSaving}
                >
                  {isEditSaving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEdit}
                  disabled={isEditSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Delete User?</h3>
            <p>
              This will permanently remove{" "}
              <strong>{deleteConfirm.name || deleteConfirm.email}</strong> and
              all of their data — including cart, wishlist, addresses, reviews,
              and their <strong>full order history</strong>. This action cannot
              be undone.
            </p>
            <div className="admin-form-actions">
              <button
                className="btn btn-primary"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={isDeleting === deleteConfirm.id}
              >
                {isDeleting === deleteConfirm.id ? "Deleting…" : "Yes, Delete"}
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
