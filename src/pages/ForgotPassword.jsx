import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import "./Auth.css";

export default function ForgotPassword() {
  const [step, setStep] = useState("email"); // email | otp | reset | done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [genError, setGenError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async e => {
    e.preventDefault();
    setGenError("");
    if (!email) return setErrors({ email: "Email is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setErrors({ email: "Invalid email address" });
    setErrors({});
    setIsLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setStep("otp");
    } catch (err) {
      setGenError(
        err?.response?.data?.message || "Could not send OTP. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    setGenError("");
    if (!otp || otp.length < 4)
      return setErrors({ otp: "Enter the OTP sent to your email" });
    setErrors({});
    setIsLoading(true);
    try {
      await API.post("/auth/verify-otp", { email, otp });
      setStep("reset");
    } catch (err) {
      setGenError(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async e => {
    e.preventDefault();
    setGenError("");
    const e2 = {};
    if (!form.password || form.password.length < 6)
      e2.password = "Min 6 characters";
    if (form.password !== form.confirm) e2.confirm = "Passwords do not match";
    if (Object.keys(e2).length) return setErrors(e2);
    setErrors({});
    setIsLoading(true);
    try {
      await API.post("/auth/reset-password", {
        email,
        otp,
        password: form.password
      });
      setStep("done");
    } catch (err) {
      setGenError(err?.response?.data?.message || "Reset failed. Try again.");
    } finally {
      setIsLoading(false);
    }
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
            <div>🔒 Secure OTP Verification</div>
            <div>📧 Code sent to your email</div>
            <div>⚡ Takes less than 2 minutes</div>
            <div>💚 Your account is safe with us</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo-mobile">🌿 EchOrganics</div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["email", "otp", "reset"].map((s, i) => (
              <div
                key={s}
                style={{
                  height: 4,
                  flex: 1,
                  borderRadius: 9999,
                  background:
                    ["email", "otp", "reset", "done"].indexOf(step) >= i
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                  transition: "background 0.3s ease"
                }}
              />
            ))}
          </div>

          {step === "email" && (
            <>
              <h1>Forgot Password</h1>
              <p className="auth-subhead">
                Enter your registered email to receive a reset code
              </p>
              {genError && <div className="alert alert-error">{genError}</div>}
              <form onSubmit={handleSendOtp} className="auth-form">
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
                  {isLoading ? "Sending OTP…" : "Send Reset Code →"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h1>Check Your Email</h1>
              <p className="auth-subhead">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              {genError && <div className="alert alert-error">{genError}</div>}
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="form-group">
                  <label>One-Time Password</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value);
                      setErrors({});
                    }}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    style={{
                      letterSpacing: "0.3em",
                      fontSize: "1.2rem",
                      textAlign: "center"
                    }}
                    className={errors.otp ? "form-error" : ""}
                    disabled={isLoading}
                  />
                  {errors.otp && (
                    <span className="form-error-message">{errors.otp}</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying…" : "Verify Code →"}
                </button>
              </form>
              <p className="auth-switch">
                Didn't receive?{" "}
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setStep("email");
                    setGenError("");
                  }}
                >
                  Resend OTP
                </button>
              </p>
            </>
          )}

          {step === "reset" && (
            <>
              <h1>New Password</h1>
              <p className="auth-subhead">
                Choose a strong password for your account
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
                      setErrors({});
                    }}
                    placeholder="Min 6 characters"
                    className={errors.password ? "form-error" : ""}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <span className="form-error-message">
                      {errors.password}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={e => {
                      setForm(p => ({ ...p, confirm: e.target.value }));
                      setErrors({});
                    }}
                    placeholder="Repeat your password"
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
                  {isLoading ? "Saving…" : "Set New Password →"}
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>✅</div>
              <h1 style={{ marginBottom: 8 }}>Password Reset!</h1>
              <p className="auth-subhead" style={{ marginBottom: 24 }}>
                Your password has been updated successfully. You can now sign
                in.
              </p>
              <Link to="/login" className="btn btn-primary btn-full">
                Go to Sign In →
              </Link>
            </div>
          )}

          {step !== "done" && (
            <p className="auth-switch">
              Remembered your password? <Link to="/login">Sign In</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
