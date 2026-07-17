import { useState, useEffect } from "react";
import API from "../api/axios";
import { useAuth } from "../utils/useAuth";
import "./Addresses.css";

const EMPTY_FORM = {
  name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  country: "India"
};

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // id being deleted
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // address pending delete
  const [toast, setToast] = useState(null); // { type: "success" | "error", text }
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated]);

  // Auto-dismiss the toast after a few seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, text) => setToast({ type, text });

  const fetchAddresses = async () => {
    try {
      const res = await API.get("/address");
      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch addresses");
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.street.trim()) e.street = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.pincode.trim()) e.pincode = "Required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const startEdit = address => {
    setForm({
      name: address.name || "",
      phone: address.phone || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India"
    });
    setEditingId(address.id);
    setFormErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      if (editingId) {
        const res = await API.put(`/address/${editingId}`, form);
        setAddresses(prev =>
          prev.map(a => (a.id === editingId ? res.data : a))
        );
        setSuccessMsg("Address updated successfully!");
      } else {
        const res = await API.post("/address", form);
        setAddresses(prev => [...prev, res.data]);
        setSuccessMsg("Address added successfully!");
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          (editingId ? "Failed to update address" : "Failed to add address")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async id => {
    setIsDeleting(id);
    setError("");
    setSuccessMsg("");
    try {
      await API.delete(`/address/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
      showToast("success", "Address removed.");
    } catch (err) {
      showToast(
        "error",
        err?.response?.data?.message || "Failed to delete address"
      );
    } finally {
      setIsDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const field = (key, label, type = "text", placeholder = "") => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => {
          setForm(p => ({ ...p, [key]: e.target.value }));
          if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: "" }));
        }}
        placeholder={placeholder}
        className={formErrors[key] ? "form-error" : ""}
        disabled={isSaving}
      />
      {formErrors[key] && (
        <span className="form-error-message">{formErrors[key]}</span>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h1>Addresses</h1>
        <div className="alert alert-info">
          Please log in to view your addresses.
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    );

  return (
    <div
      className="container"
      style={{ paddingTop: "32px", paddingBottom: "48px" }}
    >
      <div className="address-header">
        <div>
          <span className="address-badge">📍 Delivery Addresses</span>

          <h1>Manage Your Addresses</h1>

          <p>
            Save your delivery locations for faster and hassle-free checkout.
          </p>
        </div>

        {!showForm && (
          <button
            className="btn btn-primary add-address-btn"
            onClick={() => setShowForm(true)}
          >
            ➕ Add New Address
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: "16px" }}>
          {successMsg}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="form-header">
            <h2>{editingId ? "✏️ Edit Address" : "➕ Add New Address"}</h2>

            <p>Please provide your delivery details.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="address-grid">
              {field("name", "Full Name", "text", "John Doe")}
              {field("phone", "Phone", "tel", "+91 98765 43210")}
            </div>
            {field("street", "Street Address", "text", "123 Main Street")}
            <div className="address-grid">
              {field("city", "City", "text", "Vijayawada")}
              {field("state", "State", "text", "Andhra Pradesh")}
            </div>
            <div className="address-grid">
              {field("pincode", "Pincode", "text", "520001")}
              {field("country", "Country", "text", "India")}
            </div>
            <div className="form-buttons">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving…"
                  : editingId
                    ? "Update Address"
                    : "Save Address"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="address-empty">
          <div className="empty-icon">📍</div>

          <h2>No Saved Addresses</h2>

          <p>
            You haven't added any delivery address yet. Add one now to make
            checkout quicker.
          </p>

          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid">
          {addresses.map(address => (
            <div key={address.id} className="address-card">
              <div className="address-card-header">
                <div className="address-title">
                  <span className="address-icon">🏠</span>

                  <div>
                    <h3>{address.name}</h3>

                    <span className="address-tag">Home</span>
                  </div>
                </div>
              </div>

              <div className="address-content">
                <p>{address.street}</p>

                <p>
                  {address.city}, {address.state}
                </p>

                <p>{address.pincode}</p>

                <p>{address.country}</p>

                <div className="phone">📞 {address.phone}</div>
              </div>

              <div className="address-footer">
                <button className="btn btn-primary">🚚 Deliver Here</button>

                <div className="address-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => startEdit(address)}
                  >
                    ✏ Edit
                  </button>

                  <button
                    className="btn btn-outline-danger btn-small"
                    onClick={() => setDeleteConfirm(address)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "28px 32px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)"
            }}
          >
            <div className="delete-icon">🗑</div>

            <h2>Delete Address</h2>

            <p>Are you sure you want to remove this delivery address?</p>

            <div className="delete-address-preview">
              <strong>{deleteConfirm.name}</strong>

              <p>{deleteConfirm.street}</p>

              <p>
                {deleteConfirm.city}, {deleteConfirm.state}
              </p>
            </div>
            <p style={{ color: "#53586b", marginBottom: "20px" }}>
              "{deleteConfirm.name}" – {deleteConfirm.street},{" "}
              {deleteConfirm.city}. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
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
                disabled={isDeleting === deleteConfirm.id}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
            background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${toast.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            color: toast.type === "error" ? "#991b1b" : "#166534",
            maxWidth: "320px",
            animation: "toast-in 0.2s ease-out"
          }}
        >
          <span style={{ fontSize: "18px" }}>
            {toast.type === "error" ? "⚠️" : "✅"}
          </span>
          <span style={{ fontSize: "14px" }}>{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              marginLeft: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontSize: "16px",
              lineHeight: 1
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
