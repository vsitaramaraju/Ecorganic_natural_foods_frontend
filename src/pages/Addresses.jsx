import { useState, useEffect } from "react";
import API from "../api/axios";
import { useAuth } from "../utils/useAuth";

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
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated]);

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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await API.post("/address", form);
      setAddresses(prev => [...prev, res.data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccessMsg("Address added successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add address");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this address?")) return;
    setIsDeleting(id);
    setError("");
    setSuccessMsg("");
    try {
      await API.delete(`/address/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
      setSuccessMsg("Address removed.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete address");
    } finally {
      setIsDeleting(null);
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "5rem"
        }}
      >
        <h1 style={{ color: "black" }}>My Addresses</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Address
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
          <h2 style={{ color: "black", marginBottom: "16px" }}>New Address</h2>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}
            >
              {field("name", "Full Name", "text", "John Doe")}
              {field("phone", "Phone", "tel", "+91 98765 43210")}
            </div>
            {field("street", "Street Address", "text", "123 Main Street")}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}
            >
              {field("city", "City", "text", "Vijayawada")}
              {field("state", "State", "text", "Andhra Pradesh")}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}
            >
              {field("pincode", "Pincode", "text", "520001")}
              {field("country", "Country", "text", "India")}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save Address"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                  setFormErrors({});
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "48px 24px" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📍</div>
          <h3 style={{ color: "black" }}>No addresses saved yet</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            Add an address to speed up checkout.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Address
          </button>
        </div>
      ) : (
        <div className="grid">
          {addresses.map(address => (
            <div
              key={address.id}
              className="card"
              style={{ position: "relative" }}
            >
              <h3 style={{ color: "black", marginBottom: "8px" }}>
                {address.name}
              </h3>
              <p style={{ color: "#4b5563" }}>{address.street}</p>
              <p style={{ color: "#4b5563" }}>
                {address.city}, {address.state} – {address.pincode}
              </p>
              <p style={{ color: "#4b5563" }}>{address.country}</p>
              <p style={{ color: "#6b7280", marginTop: "4px" }}>
                📞 {address.phone}
              </p>
              <button
                className="btn btn-secondary btn-small"
                style={{
                  marginTop: "12px",
                  color: "#dc2626",
                  borderColor: "#dc2626"
                }}
                onClick={() => handleDelete(address.id)}
                disabled={isDeleting === address.id}
              >
                {isDeleting === address.id ? "Removing…" : "🗑 Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
