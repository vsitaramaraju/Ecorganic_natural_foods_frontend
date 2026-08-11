import { useState, useContext } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [genError, setGenError] = useState("");

  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [toast, setToast] = useState("");

  // Show / hide password states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect already-authenticated users
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const e = {};

    if (!form.name || form.name.length < 2) {
      e.name = "Name must be at least 2 characters";
    }

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Valid email required";
    }

    if (!form.password || form.password.length < 6) {
      e.password = "Min 6 characters";
    }

    if (form.password !== form.confirmPassword) {
      e.confirmPassword = "Passwords don't match";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const showToast = message => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    setGenError("");

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password
      });

      if (res.data.user && res.data.token) {
        showToast("🎉 Registration successful! Welcome to EchOrganics.");

        login(res.data.user, res.data.token);

        setTimeout(() => {
          navigate("/");
        }, 1200);
      } else {
        showToast("Account created successfully. Please login.");

        setTimeout(() => {
          navigate("/login");
        }, 1200);
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Registration failed";

      setGenError(message);

      showToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  const f = (
    key,
    label,
    type,
    placeholder,
    showPasswordState,
    setShowPasswordState
  ) => (
    <div className="form-group">
      <label>{label}</label>

      {type === "password" ? (
        <div className="password-input-wrap">
          <input
            type={showPasswordState ? "text" : "password"}
            value={form[key]}
            onChange={e => {
              setForm(p => ({
                ...p,
                [key]: e.target.value
              }));

              if (errors[key]) {
                setErrors(p => ({
                  ...p,
                  [key]: ""
                }));
              }
            }}
            placeholder={placeholder}
            className={errors[key] ? "form-error" : ""}
            disabled={isLoading}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPasswordState(prev => !prev)}
            disabled={isLoading}
            aria-label={
              showPasswordState
                ? `Hide ${label.toLowerCase()}`
                : `Show ${label.toLowerCase()}`
            }
            title={showPasswordState ? "Hide password" : "Show password"}
          >
            {showPasswordState ? "🙈" : "👁️"}
          </button>
        </div>
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => {
            setForm(p => ({
              ...p,
              [key]: e.target.value
            }));

            if (errors[key]) {
              setErrors(p => ({
                ...p,
                [key]: ""
              }));
            }
          }}
          placeholder={placeholder}
          className={errors[key] ? "form-error" : ""}
          disabled={isLoading}
        />
      )}

      {errors[key] && <span className="form-error-message">{errors[key]}</span>}
    </div>
  );

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      <div className="auth-page">
        <div className="auth-visual">
          <div className="auth-visual-content">
            <span className="auth-visual-logo">🌿</span>

            <h2>Join the EchOrganics family</h2>

            <p>
              Thousands of families trust us for their daily organic needs.
              Start your healthy journey today.
            </p>

            <div className="auth-visual-perks">
              <div>🎁 Welcome discount on first order</div>
              <div>🌱 Exclusive member deals</div>
              <div>📦 Track all your orders</div>
              <div>❤️ Save your favourite products</div>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-card">
            <div className="auth-logo-mobile">🌿 EchOrganics</div>

            <h1>Create Account</h1>

            <p className="auth-subhead">Start your organic journey today</p>

            {genError && <div className="alert alert-error">{genError}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              {f("name", "Full Name", "text", "John Doe")}

              {f("email", "Email Address", "email", "your@email.com")}

              {f(
                "password",
                "Password",
                "password",
                "At least 6 characters",
                showPassword,
                setShowPassword
              )}

              {f(
                "confirmPassword",
                "Confirm Password",
                "password",
                "Repeat password",
                showConfirmPassword,
                setShowConfirmPassword
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating account…" : "Create Account →"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
