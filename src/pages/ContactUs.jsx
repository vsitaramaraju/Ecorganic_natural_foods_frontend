import { useState } from "react";
import { submitContactForm } from "../api/contactAPI";
import "./ContactUs.css";

export default function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim() || form.message.trim().length < 10)
      e.message = "Message must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setStatus(null);

    try {
      const response = await submitContactForm(form);

      if (response.data.success) {
        setStatus({
          type: "success",
          message: response.data.message || "Message sent successfully!"
        });
        setSubmitted(true);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to send message. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact-page container">
      <div className="contact-hero">
        <span className="contact-hero-emoji">💬</span>
        <h1 className="section-title">Get in Touch</h1>
        <p className="section-subtitle">
          Have a question, feedback, or concern? Our team is here to help!
        </p>
      </div>

      <div className="contact-grid">
        {/* Info panel */}
        <div className="contact-info">
          <div className="contact-info-card card">
            <h3>📍 Our Location</h3>
            <p>
              EchOrganics Pvt Ltd
              <br />
              Vijayawada, Andhra Pradesh – 520001
              <br />
              India
            </p>
          </div>
          <div className="contact-info-card card">
            <h3>📞 Phone Support</h3>
            <p>+91 98765 43210</p>
            <span className="contact-info-sub">Mon – Sat, 9 AM – 6 PM</span>
          </div>
          <div className="contact-info-card card">
            <h3>📧 Email Us</h3>
            <p>hello@echorganics.in</p>
            <span className="contact-info-sub">We respond within 24 hours</span>
          </div>
          <div className="contact-info-card card">
            <h3>⏰ Working Hours</h3>
            <p>
              Monday – Saturday
              <br />
              9:00 AM – 6:00 PM IST
            </p>
          </div>
          <div className="contact-social">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="#" className="social-btn">
                📘 Facebook
              </a>
              <a href="#" className="social-btn">
                📸 Instagram
              </a>
              <a href="#" className="social-btn">
                🐦 Twitter
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="contact-form-wrap card">
          {status && (
            <div className={`alert alert-${status.type}`} style={{ marginBottom: "20px" }}>
              {status.message}
            </div>
          )}
          {submitted && status?.type === "success" ? (
            <div className="contact-success">
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
              <h2>Message Sent!</h2>
              <p>
                Thank you for reaching out. Our team will get back to you within
                24 hours.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 20 }}
                onClick={() => {
                  setSubmitted(false);
                  setStatus(null);
                  setForm({ name: "", email: "", subject: "", message: "" });
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <h2 className="contact-form-title">Send Us a Message</h2>
              <form onSubmit={handleSubmit}>
                <div className="contact-form-row">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => {
                        setForm(p => ({ ...p, name: e.target.value }));
                        setErrors(p => ({ ...p, name: "" }));
                      }}
                      placeholder="John Doe"
                      className={errors.name ? "form-error" : ""}
                    />
                    {errors.name && (
                      <span className="form-error-message">{errors.name}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => {
                        setForm(p => ({ ...p, email: e.target.value }));
                        setErrors(p => ({ ...p, email: "" }));
                      }}
                      placeholder="your@email.com"
                      className={errors.email ? "form-error" : ""}
                    />
                    {errors.email && (
                      <span className="form-error-message">{errors.email}</span>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => {
                      setForm(p => ({ ...p, subject: e.target.value }));
                      setErrors(p => ({ ...p, subject: "" }));
                    }}
                    placeholder="e.g. Order issue, Product inquiry…"
                    className={errors.subject ? "form-error" : ""}
                  />
                  {errors.subject && (
                    <span className="form-error-message">{errors.subject}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => {
                      setForm(p => ({ ...p, message: e.target.value }));
                      setErrors(p => ({ ...p, message: "" }));
                    }}
                    placeholder="Tell us how we can help…"
                    rows={5}
                    className={errors.message ? "form-error" : ""}
                    style={{ resize: "vertical" }}
                  />
                  {errors.message && (
                    <span className="form-error-message">{errors.message}</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending…" : "Send Message 📨"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
