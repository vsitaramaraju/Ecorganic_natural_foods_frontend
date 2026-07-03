import { useState, useEffect } from "react";
import { useAuth } from "../utils/useAuth";
import "./Profile.css";
import API from "../api/axios";

export default function Profile() {
  const { user, login, token } = useAuth();

  /* ── Edit Profile State ── */
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || ""
  });
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Keep form in sync if user object changes (e.g. after successful save)
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  /* ── Change Password State ── */
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  if (!user) {
    return (
      <div className="container">
        <div className="alert alert-info">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  /* ── Handlers ── */
  const handleProfileChange = e => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async e => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: "", type: "" });
    try {
      const res = await API.put("/auth/profile", profileForm);
      const updatedUser = { ...user, ...(res.data?.user || profileForm) };
      login(updatedUser, token);
      setProfileMsg({ text: "Profile updated successfully!", type: "success" });
    } catch (err) {
      setProfileMsg({
        text: err?.response?.data?.message || "Failed to update profile.",
        type: "error"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = e => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setPasswordMsg({ text: "", type: "" });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ text: "New passwords do not match.", type: "error" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({
        text: "New password must be at least 6 characters.",
        type: "error"
      });
      return;
    }
    setPasswordLoading(true);
    try {
      await API.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMsg({
        text: "Password changed successfully!",
        type: "success"
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setPasswordMsg({
        text: err?.response?.data?.message || "Failed to change password.",
        type: "error"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggleShow = field => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const initials = (user.name || "U")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div>
          <h1 className="profile-name">{user.name}</h1>
          <span className="profile-role-badge">{user.role || "Customer"}</span>
        </div>
      </div>

      <div className="profile-grid">
        {/* Edit Profile */}
        <section className="card profile-card">
          <div className="profile-card-header">
            <span className="profile-card-icon">👤</span>
            <h2>Edit Profile</h2>
          </div>
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span className="optional-label">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-control"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="+91 00000 00000"
              />
            </div>
            {profileMsg.text && (
              <div
                className={`alert alert-${profileMsg.type === "success" ? "success" : "error"}`}
              >
                {profileMsg.text}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary profile-submit-btn"
              disabled={profileLoading}
            >
              {profileLoading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="card profile-card">
          <div className="profile-card-header">
            <span className="profile-card-icon">🔒</span>
            <h2>Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            {[
              {
                id: "currentPassword",
                label: "Current Password",
                key: "current"
              },
              { id: "newPassword", label: "New Password", key: "new" },
              {
                id: "confirmPassword",
                label: "Confirm New Password",
                key: "confirm"
              }
            ].map(({ id, label, key }) => (
              <div className="form-group" key={id}>
                <label htmlFor={id}>{label}</label>
                <div className="password-input-wrap">
                  <input
                    id={id}
                    name={id}
                    type={showPasswords[key] ? "text" : "password"}
                    className="form-control"
                    value={passwordForm[id]}
                    onChange={handlePasswordChange}
                    required
                    placeholder={
                      id === "currentPassword"
                        ? "Enter current password"
                        : id === "newPassword"
                          ? "Min. 6 characters"
                          : "Re-enter new password"
                    }
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => toggleShow(key)}
                    aria-label="Toggle visibility"
                  >
                    {showPasswords[key] ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            ))}
            {passwordMsg.text && (
              <div
                className={`alert alert-${passwordMsg.type === "success" ? "success" : "error"}`}
              >
                {passwordMsg.text}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary profile-submit-btn"
              disabled={passwordLoading}
            >
              {passwordLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
