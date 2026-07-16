import { useState, useContext } from "react";
import { Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const { login, isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState("");

  const redirectAfterLogin = (currentUser, currentToken) => {
    login(currentUser, currentToken);
    if (currentUser?.role === "ADMIN") navigate("/admin/overview");
    else {
      const from = location.state?.from?.pathname || "/";
      navigate(from);
    }
  };

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // Redirect already-authenticated users based on their role
  if (isAuthenticated) {
    const from = location.state?.from?.pathname;
    if (user?.role === "ADMIN")
      return <Navigate to="/admin/overview" replace />;
    return <Navigate to={from || "/"} replace />;
  }

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

      showToast(`Welcome back, ${res.data.user.name}! 🎉`);

      setTimeout(() => {
        redirectAfterLogin(res.data.user, res.data.token);
      }, 1200);
    } catch (err) {
      const message = err?.response?.data?.message || "Login failed";

      setGenError(message);

      showToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      <div className="auth-page">
        <div className="auth-visual">
          <div className="auth-visual-content">
            <span className="auth-visual-logo">🌿</span>
            <h2>Welcome back to EchOrganics</h2>
            <p>
              Your daily dose of fresh organic goodness, delivered with care.
            </p>
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
            <p className="auth-subhead">
              Welcome back! Sign in to your account
            </p>
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
                    if (errors.password)
                      setErrors(p => ({ ...p, password: "" }));
                  }}
                  placeholder="Enter your password"
                  className={errors.password ? "form-error" : ""}
                  disabled={isLoading}
                />
                {errors.password && (
                  <span className="form-error-message">{errors.password}</span>
                )}
              </div>
              <div className="forgot-password-wrap">
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot Password?
                </Link>
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
    </>
  );
}

export default Login;
