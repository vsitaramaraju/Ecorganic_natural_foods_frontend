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

  const typeLabel = value =>
    (COUPON_TYPES.find(t => t.value === value)?.label || value || "")
      .split("(")[0]
      .trim();

  const getValidity = coupon => {
    const end = coupon.endDate ? new Date(coupon.endDate) : null;
    if (end && end < new Date()) {
      return { text: `Ended ${formatDate(coupon.endDate)}`, expired: true };
    }
    if (coupon.startDate && coupon.endDate) {
      return {
        text: `${formatDate(coupon.startDate)} – ${formatDate(coupon.endDate)}`
      };
    }
    if (end) return { text: `Until ${formatDate(coupon.endDate)}` };
    return { text: "No expiry" };
  };

  const deleteTarget = coupons.find(c => c.id === deleteConfirm);

  return (
    <div className="admin-stack admin-coupons">
      {/* Form Section */}
      {showForm && (
        <section className="card admin-section">
          <h3>{editingId ? "Edit coupon" : "Create new coupon"}</h3>
          {message.text && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}
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

      <section className="card admin-section">
        <div className="admin-products-head">
          <div>
            <h3>Coupons</h3>
            <p className="admin-orders-muted">
              Create, edit and manage promotional coupon codes
            </p>
          </div>
          {!showForm && (
            <button
              className="btn btn-primary btn-small"
              onClick={() => setShowForm(true)}
            >
              + New coupon
            </button>
          )}
        </div>

        <div className="admin-orders-toolbar">
          <div className="admin-orders-search">
            <span aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Search coupons by code…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="admin-segmented" role="group" aria-label="Filter by type">
            {[{ value: "all", label: "All" }, ...COUPON_TYPES].map(t => (
              <button
                key={t.value}
                type="button"
                className={filterType === t.value ? "active" : ""}
                aria-pressed={filterType === t.value}
                onClick={() => setFilterType(t.value)}
              >
                {t.value === "all" ? "All" : typeLabel(t.value)}
              </button>
            ))}
          </div>
        </div>

        {message.text && !showForm && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {isLoading ? (
          <p className="admin-coupons-empty">Loading coupons…</p>
        ) : filteredCoupons.length === 0 ? (
          <div className="admin-coupons-empty">
            <div className="admin-coupons-empty-icon" aria-hidden="true">🎟️</div>
            {coupons.length === 0 ? (
              <>
                <p className="admin-orders-strong">No coupons yet</p>
                <p className="admin-orders-muted">
                  Create a code customers can use at checkout.
                </p>
                {!showForm && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setShowForm(true)}
                  >
                    + Create your first coupon
                  </button>
                )}
              </>
            ) : (
              <p className="admin-orders-muted">No coupons match your search.</p>
            )}
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-orders-table admin-products-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Min order</th>
                  <th>Usage</th>
                  <th>Validity</th>
                  <th className="admin-orders-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map(coupon => {
                  const validity = getValidity(coupon);
                  return (
                    <tr key={coupon.id}>
                      <td>
                        <span className="coupon-code">{coupon.code}</span>
                        {coupon.description && (
                          <div className="admin-orders-muted">
                            {coupon.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`coupon-type coupon-type-${String(
                            coupon.type || ""
                          ).toLowerCase()}`}
                        >
                          {typeLabel(coupon.type)}
                        </span>
                      </td>
                      <td>
                        <span className="admin-orders-amount">
                          {coupon.discountPercent}% off
                        </span>
                        {coupon.maxDiscountAmount && (
                          <div className="admin-orders-muted">
                            up to {formatCurrency(coupon.maxDiscountAmount)}
                          </div>
                        )}
                      </td>
                      <td>
                        {coupon.minOrderAmount
                          ? formatCurrency(coupon.minOrderAmount)
                          : <span className="admin-orders-muted">None</span>}
                      </td>
                      <td>
                        {coupon.usageLimit
                          ? `${coupon.usageLimit} total`
                          : "Unlimited"}
                        {coupon.usageLimitPerUser && (
                          <div className="admin-orders-muted">
                            {coupon.usageLimitPerUser} per customer
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={validity.expired ? "coupon-expired" : ""}>
                          {validity.text}
                        </span>
                      </td>
                      <td>
                        <div className="admin-orders-actions">
                          <button
                            type="button"
                            className="admin-orders-icon-btn"
                            onClick={() => startEdit(coupon)}
                            disabled={isSaving}
                            title="Edit coupon"
                            aria-label={`Edit ${coupon.code}`}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="admin-orders-icon-btn admin-products-delete"
                            onClick={() => setDeleteConfirm(coupon.id)}
                            disabled={isSaving}
                            title="Delete coupon"
                            aria-label={`Delete ${coupon.code}`}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => !isSaving && setDeleteConfirm(null)}
        >
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Delete coupon {deleteTarget?.code}?</h3>
            <p>Customers will no longer be able to use this code.</p>
            <div className="admin-form-actions">
              <button
                className="btn order-detail-cancel-solid"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isSaving}
              >
                {isSaving ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={isSaving}
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
