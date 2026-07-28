import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API from "../api/axios";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [step, setStep] = useState("verifying"); // verifying | reset | success | invalid
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [genError, setGenError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStep("invalid");
        setGenError("No reset token provided. Please check your email link.");
        return;
      }

      try {
        await API.post("/auth/verify-reset-token", { token });
        setStep("reset");
      } catch (err) {
        setStep("invalid");
        setGenError(
          err?.response?.data?.message || "This link has expired or is invalid. Please request a new password reset."
        );
      }
    };

    verifyToken();
  }, [token]);

  const handleResetPassword = async e => {
    e.preventDefault();
    setGenError("");
    
    const e2 = {};
    if (!form.password) e2.password = "Password is required";
    else if (form.password.length < 6) e2.password = "Min 6 characters";
    if (!form.confirm) e2.confirm = "Confirm password is required";
    if (form.password !== form.confirm) e2.confirm = "Passwords do not match";
    
    if (Object.keys(e2).length) return setErrors(e2);
    setErrors({});
    setIsLoading(true);
    
    try {
      await API.post("/auth/reset-password", {
        token,
        newPassword: form.password,
        confirmPassword: form.confirm
      });
      setStep("success");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setGenError(
        err?.response?.data?.message || "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <span className="auth-visual-logo">🌿</span>
          <h2>Create New Password</h2>
          <p>Secure your account with a new password. Make it strong and unique.</p>
          <div className="auth-visual-perks">
            <div>🔒 Encrypted & Secure</div>
            <div>✅ Min 6 characters required</div>
            <div>🛡️ Keep your account safe</div>
            <div>💚 We protect your privacy</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo-mobile">🌿 EchOrganics</div>

          {step === "verifying" && (
            <>
              <h1>Verifying Link…</h1>
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
                <p style={{ marginTop: "16px", color: "#6b7280" }}>
                  Please wait while we verify your reset link.
                </p>
              </div>
            </>
          )}

          {step === "invalid" && (
            <>
              <h1>Link Invalid or Expired</h1>
              {genError && <div className="alert alert-error">{genError}</div>}
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                  Password reset links expire after 1 hour for security reasons.
                </p>
                <Link to="/forgot-password" className="btn btn-primary">
                  Request New Reset Link
                </Link>
              </div>
            </>
          )}

          {step === "reset" && (
            <>
              <h1>Set New Password</h1>
              <p className="auth-subhead">
                Create a strong password to secure your account
              </p>
              {genError && <div className="alert alert-error">{genError}</div>}

              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => {
                      setForm(p => ({ ...p, password: e.target.value }));
                      if (errors.password) setErrors(p => ({ ...p, password: "" }));
                    }}
                    placeholder="Enter new password (min 6 characters)"
                    className={errors.password ? "form-error" : ""}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <span className="form-error-message">{errors.password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={e => {
                      setForm(p => ({ ...p, confirm: e.target.value }));
                      if (errors.confirm) setErrors(p => ({ ...p, confirm: "" }));
                    }}
                    placeholder="Re-enter your password"
                    className={errors.confirm ? "form-error" : ""}
                    disabled={isLoading}
                  />
                  {errors.confirm && (
                    <span className="form-error-message">{errors.confirm}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting…" : "Reset Password →"}
                </button>
              </form>

              <p className="auth-switch">
                Remember your password? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}

          {step === "success" && (
            <>
              <h1>Password Reset Successfully!</h1>
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                <p style={{ color: "#059669", marginBottom: "16px", fontWeight: "500" }}>
                  Your password has been updated.
                </p>
                <p style={{ color: "#6b7280", marginBottom: "24px" }}>
                  Redirecting to login page in a few seconds...
                </p>
                <Link to="/login" className="btn btn-primary">
                  Go to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
