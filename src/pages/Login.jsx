import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setGenError("");
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      login(res.data.user, res.data.token);
      if (res.data.user.role === "ADMIN") navigate("/admin/overview");
      else navigate("/");
    } catch (err) {
      setGenError(err?.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <span className="auth-visual-logo">🌿</span>
          <h2>Welcome back to EchOrganics</h2>
          <p>Your daily dose of fresh organic goodness, delivered with care.</p>
          <div className="auth-visual-perks">
            <div>✅ Certified Organic Products</div>
            <div>🚚 Free delivery above ₹499</div>
            <div>🔄 Hassle-free returns</div>
            <div>💚 Supporting local farmers</div>
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo-mobile">🌿 EchOrganics</div>
          <h1>Sign In</h1>
          <p className="auth-subhead">Welcome back! Sign in to your account</p>
          {genError && <div className="alert alert-error">{genError}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => {
                  setForm(p => ({ ...p, email: e.target.value }));
                  if (errors.email) setErrors(p => ({ ...p, email: "" }));
                }}
                placeholder="your@email.com"
                className={errors.email ? "form-error" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <span className="form-error-message">{errors.email}</span>
              )}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => {
                  setForm(p => ({ ...p, password: e.target.value }));
                  if (errors.password) setErrors(p => ({ ...p, password: "" }));
                }}
                placeholder="Enter your password"
                className={errors.password ? "form-error" : ""}
                disabled={isLoading}
              />
              {errors.password && (
                <span className="form-error-message">{errors.password}</span>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
