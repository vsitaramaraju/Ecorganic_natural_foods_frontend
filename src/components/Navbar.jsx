import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenus}>
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">ShopHub</span>
        </Link>

        {/* Hamburger Menu */}
        <button
          className={`hamburger ${isMenuOpen ? "active" : ""}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <ul className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <li>
            <Link to="/" className="nav-link" onClick={closeMenus}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/shop" className="nav-link" onClick={closeMenus}>
              Shop
            </Link>
          </li>
          <li>
            <Link to="/categories" className="nav-link" onClick={closeMenus}>
              Categories
            </Link>
          </li>
          {user && !isAdmin && (
            <>
              <li>
                <Link to="/cart" className="nav-link" onClick={closeMenus}>
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="nav-link" onClick={closeMenus}>
                  Orders
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="nav-link" onClick={closeMenus}>
                  Wishlist
                </Link>
              </li>
            </>
          )}
          {isAdmin && (
            <li>
              <Link to="/admin/overview" className="nav-link admin-link" onClick={closeMenus}>
                Dashboard
              </Link>
            </li>
          )}
        </ul>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {user ? (
            <div className="profile-dropdown">
              <button
                className="profile-btn"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <span className="user-avatar">{user.name?.[0]?.toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
              </button>

              {isProfileOpen && (
                <div className="dropdown-menu">
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    My Profile
                  </Link>
                  {!isAdmin && (
                    <>
                      <Link
                        to="/orders"
                        className="dropdown-item"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/addresses"
                        className="dropdown-item"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Addresses
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin/overview"
                      className="dropdown-item admin-item"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
