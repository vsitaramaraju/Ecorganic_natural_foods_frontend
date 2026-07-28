import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import "./Auth.css";

export default function ForgotPassword() {
  const [step, setStep] = useState("email"); // email | success
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [genError, setGenError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = async e => {
    e.preventDefault();
    setGenError("");
    
    if (!email) return setErrors({ email: "Email is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setErrors({ email: "Invalid email address" });
    
    setErrors({});
    setIsLoading(true);
    
    try {
      await API.post("/auth/forgot-password", { email });
      setStep("success");
    } catch (err) {
      setGenError(
        err?.response?.data?.message || "Could not send reset link. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAgain = () => {
    setStep("email");
    setEmail("");
    setGenError("");
    setErrors({});
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <span className="auth-visual-logo">🌿</span>
          <h2>Reset Your Password</h2>
          <p>
            Don't worry — it happens to the best of us. We'll help you get back
            in safely.
          </p>
          <div className="auth-visual-perks">
            <div>🔒 Secure Password Reset</div>
            <div>📧 Link sent to your email</div>
            <div>⚡ Takes less than 2 minutes</div>
            <div>💚 Your account is safe with us</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo-mobile">🌿 EchOrganics</div>

          {step === "email" && (
            <>
              <h1>Forgot Password</h1>
              <p className="auth-subhead">
                Enter your registered email to receive a password reset link
              </p>
              {genError && <div className="alert alert-error">{genError}</div>}
              <form onSubmit={handleSendResetLink} className="auth-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
                    placeholder="your@email.com"
                    className={errors.email ? "form-error" : ""}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <span className="form-error-message">{errors.email}</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending Link…" : "Send Reset Link →"}
                </button>
              </form>
              <p className="auth-switch">
                Remembered your password? <Link to="/login">Sign In</Link>
              </p>
            </>
          )}

          {step === "success" && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>📧</div>
              <h1 style={{ marginBottom: 8 }}>Check Your Email</h1>
              <p className="auth-subhead" style={{ marginBottom: 8 }}>
                We've sent a password reset link to:
              </p>
              <p style={{ fontWeight: "500", marginBottom: 24, color: "#059669" }}>
                {email}
              </p>
              <p style={{ color: "#6b7280", marginBottom: 8 }}>
                The link will expire in 1 hour for security reasons.
              </p>
              <p style={{ color: "#6b7280", marginBottom: 24 }}>
                Click the link in the email to reset your password.
              </p>
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 16 }}>
                  Can't find the email? Check your spam or junk folder.
                </p>
              </div>
              <button
                onClick={handleSendAgain}
                className="btn btn-secondary btn-full"
                style={{ marginBottom: 12 }}
              >
                Send Another Link
              </button>
              <Link to="/login" className="btn btn-outline btn-full">
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
