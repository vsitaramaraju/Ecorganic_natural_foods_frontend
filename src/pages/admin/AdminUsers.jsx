import { useEffect, useState, useMemo } from "react";
import { fetchUsers, updateUserRole, formatDate } from "./adminShared";

const ROLES = ["USER", "ADMIN"];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(null); // userId being updated
  const [message, setMessage] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
                paginated.map((user, idx) => (
                  <tr key={user.id}>
                    <td style={{ color: "#9ca3af" }}>
                      {(safePage - 1) * pageSize + idx + 1}
                    </td>
                    <td>
                      <strong>{user.name || "—"}</strong>
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
                      <select
                        value={String(user.role || "USER").toUpperCase()}
                        onChange={e =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        disabled={isSaving === user.id}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
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
    </div>
  );
}
