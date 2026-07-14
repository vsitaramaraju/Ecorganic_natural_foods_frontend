import { useEffect, useState } from "react";
import API from "../../api/axios";
import { formatDate, formatCurrency } from "./adminShared";

const EMPTY_FORM = {
  code: "",
  discountPercent: "",
  type: "GENERAL",
  description: "",
  startDate: "",
  endDate: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  usageLimitPerUser: ""
};

const COUPON_TYPES = [
  { value: "GENERAL", label: "General (always available)" },
  { value: "SEASONAL", label: "Seasonal (with dates)" },
  { value: "NEW_USER", label: "New User (first order only)" }
];

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [couponForm, setCouponForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const params = filterType !== "all" ? { type: filterType } : {};
      const res = await API.get("/admin/coupons", { params });
      setCoupons(res.data || []);
      setMessage({ type: "", text: "" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to load coupons"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [filterType]);

  const resetForm = () => {
    setCouponForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = coupon => {
    setCouponForm({
      code: coupon.code || "",
      discountPercent: String(coupon.discountPercent || ""),
      type: coupon.type || "GENERAL",
      description: coupon.description || "",
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
      endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
      minOrderAmount: String(coupon.minOrderAmount || ""),
      maxDiscountAmount: String(coupon.maxDiscountAmount || ""),
      usageLimit: String(coupon.usageLimit || ""),
      usageLimitPerUser: String(coupon.usageLimitPerUser || "")
    });
    setEditingId(coupon.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate = () => {
    const e = [];
    if (!couponForm.code.trim()) e.push("Coupon code is required");
    if (!couponForm.discountPercent) e.push("Discount percentage is required");
    if (
      couponForm.discountPercent &&
      (Number(couponForm.discountPercent) < 0 ||
        Number(couponForm.discountPercent) > 100)
    )
      e.push("Discount percentage must be between 0 and 100");
    if (
      couponForm.type === "SEASONAL" &&
      (!couponForm.startDate || !couponForm.endDate)
    )
      e.push("Start and end dates are required for seasonal coupons");
    if (
      couponForm.startDate &&
      couponForm.endDate &&
      new Date(couponForm.startDate) > new Date(couponForm.endDate)
    )
      e.push("Start date must be before end date");
    if (e.length > 0) {
      setMessage({ type: "error", text: e.join(" | ") });
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discountPercent: Number(couponForm.discountPercent),
        type: couponForm.type,
        description: couponForm.description.trim() || undefined,
        startDate: couponForm.startDate || undefined,
        endDate: couponForm.endDate || undefined,
        minOrderAmount: couponForm.minOrderAmount
          ? Number(couponForm.minOrderAmount)
          : undefined,
        maxDiscountAmount: couponForm.maxDiscountAmount
          ? Number(couponForm.maxDiscountAmount)
          : undefined,
        usageLimit: couponForm.usageLimit
          ? Number(couponForm.usageLimit)
          : undefined,
        usageLimitPerUser: couponForm.usageLimitPerUser
          ? Number(couponForm.usageLimitPerUser)
          : undefined
      };

      if (editingId) {
        await API.put(`/admin/coupons/${editingId}`, payload);
        setMessage({ type: "success", text: "Coupon updated successfully" });
      } else {
        await API.post("/admin/coupons", payload);
        setMessage({ type: "success", text: "Coupon created successfully" });
      }
      resetForm();
      loadCoupons();
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to save coupon"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      setIsSaving(true);
      await API.delete(`/admin/coupons/${id}`);
      setMessage({ type: "success", text: "Coupon deleted successfully" });
      setDeleteConfirm(null);
      loadCoupons();
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to delete coupon"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Header and Form Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2>Manage Coupons</h2>
          <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>
            Create, edit, and manage promotional coupon codes
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
        >
          {showForm ? "✕ Cancel" : "+ New Coupon"}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <section className="card admin-section">
          <h3>{editingId ? "Edit Coupon" : "Create New Coupon"}</h3>
          <form onSubmit={handleSubmit} className="admin-form-grid">
            <div className="form-group">
              <label>Coupon Code *</label>
              <input
                type="text"
                value={couponForm.code}
                onChange={e =>
                  setCouponForm(p => ({
                    ...p,
                    code: e.target.value.toUpperCase()
                  }))
                }
                placeholder="e.g., WELCOME20"
                disabled={isSaving}
              />
            </div>
            <div className="form-group">
              <label>Discount % *</label>
              <input
                type="number"
                min="0"
                max="100"
                value={couponForm.discountPercent}
                onChange={e =>
                  setCouponForm(p => ({
                    ...p,
                    discountPercent: e.target.value
                  }))
                }
                placeholder="e.g., 20"
                disabled={isSaving}
              />
            </div>
            <div className="form-group">
              <label>Coupon Type *</label>
              <select
                value={couponForm.type}
                onChange={e =>
                  setCouponForm(p => ({ ...p, type: e.target.value }))
                }
                disabled={isSaving}
              >
                {COUPON_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group admin-form-full">
              <label>Description</label>
              <textarea
                value={couponForm.description}
                onChange={e =>
                  setCouponForm(p => ({ ...p, description: e.target.value }))
                }
                placeholder="e.g., First order discount for new customers"
                rows="2"
                disabled={isSaving}
              />
            </div>

            {couponForm.type === "SEASONAL" && (
              <>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={couponForm.startDate}
                    onChange={e =>
                      setCouponForm(p => ({
                        ...p,
                        startDate: e.target.value
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={couponForm.endDate}
                    onChange={e =>
                      setCouponForm(p => ({
                        ...p,
                        endDate: e.target.value
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Min Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={couponForm.minOrderAmount}
                onChange={e =>
                  setCouponForm(p => ({
                    ...p,
                    minOrderAmount: e.target.value
                  }))
                }
                placeholder="e.g., 299"
                disabled={isSaving}
              />
            </div>
            <div className="form-group">
              <label>Max Discount Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={couponForm.maxDiscountAmount}
                onChange={e =>
                  setCouponForm(p => ({
                    ...p,
                    maxDiscountAmount: e.target.value
                  }))
                }
                placeholder="e.g., 100"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label>Usage Limit</label>
              <input
                type="number"
                min="0"
                value={couponForm.usageLimit}
                onChange={e =>
                  setCouponForm(p => ({
                    ...p,
                    usageLimit: e.target.value
                  }))
                }
                placeholder="Total uses (leave empty for unlimited)"
                disabled={isSaving}
              />
            </div>
            <div className="form-group">
              <label>Usage Per User</label>
              <input
                type="number"
                min="0"
                value={couponForm.usageLimitPerUser}
                onChange={e =>
                  setCouponForm(p => ({
                    ...p,
                    usageLimitPerUser: e.target.value
                  }))
                }
                placeholder="Uses per user (leave empty for unlimited)"
                disabled={isSaving}
              />
            </div>

            <div className="admin-form-actions admin-form-full">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving…"
                  : editingId
                    ? "Update Coupon"
                    : "Create Coupon"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Search and Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            placeholder="Search coupons by code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px"
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "8px 12px",
              border: filterType === "all" ? "2px solid #667eea" : "1px solid #d1d5db",
              background: filterType === "all" ? "#f0f4ff" : "#fff",
              color: filterType === "all" ? "#667eea" : "#6b7280",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500"
            }}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          {COUPON_TYPES.map(t => (
            <button
              key={t.value}
              style={{
                padding: "8px 12px",
                border: filterType === t.value ? "2px solid #667eea" : "1px solid #d1d5db",
                background: filterType === t.value ? "#f0f4ff" : "#fff",
                color: filterType === t.value ? "#667eea" : "#6b7280",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500"
              }}
              onClick={() => setFilterType(t.value)}
            >
              {t.label.split("(")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          Loading coupons...
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          {coupons.length === 0
            ? "No coupons yet. Create your first coupon!"
            : "No coupons match your search."}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Usage Limit</th>
                <th>Valid Until</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map(coupon => (
                <tr key={coupon.id}>
                  <td>
                    <strong>{coupon.code}</strong>
                  </td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: coupon.type === "GENERAL" ? "#dbeafe" : coupon.type === "NEW_USER" ? "#dcfce7" : "#fef3c7",
                      color: coupon.type === "GENERAL" ? "#1d4ed8" : coupon.type === "NEW_USER" ? "#166534" : "#92400e"
                    }}>
                      {coupon.type}
                    </span>
                  </td>
                  <td>{coupon.discountPercent}%</td>
                  <td>
                    {coupon.minOrderAmount
                      ? formatCurrency(coupon.minOrderAmount)
                      : "None"}
                  </td>
                  <td>
                    {coupon.usageLimit ? `${coupon.usageLimit} uses` : "Unlimited"}
                  </td>
                  <td>{formatDate(coupon.endDate) || "N/A"}</td>
                  <td style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-small btn-edit"
                      onClick={() => startEdit(coupon)}
                      disabled={isSaving}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-small btn-delete"
                      onClick={() => setDeleteConfirm(coupon.id)}
                      disabled={isSaving}
                    >
                      Delete
                    </button>
                    {deleteConfirm === coupon.id && (
                      <div style={{
                        position: "absolute",
                        background: "#fff",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        padding: "10px",
                        marginTop: "28px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 10
                      }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px" }}>
                          Delete this coupon?
                        </p>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="btn btn-small"
                            style={{
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "1px solid #fecaca"
                            }}
                            onClick={() => handleDelete(coupon.id)}
                            disabled={isSaving}
                          >
                            Delete
                          </button>
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => setDeleteConfirm(null)}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
