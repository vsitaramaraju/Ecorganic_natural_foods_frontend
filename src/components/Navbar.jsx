import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";
import { FaSearch } from "react-icons/fa";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useContext(AuthContext);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMenuOpen(false);
      setIsProfileOpen(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = path => (location.pathname === path ? "active" : "");

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-leaf">🌿</span>
          <div className="logo-text-wrap">
            <span className="logo-brand">EchOrganics</span>
            <span className="logo-tagline">Farm Fresh</span>
          </div>
        </Link>

        {/* ================= USER / GUEST NAV ================= */}

        {!isAdmin && (
          <>
            {/* Desktop Nav */}
            <ul className="navbar-links">
              <li>
                <Link to="/" className={`nav-link ${isActive("/")}`}>
                  Home
                </Link>
              </li>

              <li>
                <Link to="/shop" className={`nav-link ${isActive("/shop")}`}>
                  Shop
                </Link>
              </li>

              <li>
                <Link
                  to="/categories"
                  className={`nav-link ${isActive("/categories")}`}
                >
                  Categories
                </Link>
              </li>
            </ul>

            {/* Search */}
            <div className={`navbar-search ${user ? "search-user-login" : ""}`}>
              <input type="text" placeholder="Search products..." />
              <FaSearch className="search-icon" />
            </div>
          </>
        )}

        {/* ================= ADMIN NAV ================= */}

        {isAdmin && (
          <div className="admin-nav-only">
            <Link to="/admin/overview" className="nav-link admin-badge">
              ⚙ Dashboard
            </Link>
          </div>
        )}

        {/* ================= RIGHT SECTION ================= */}

        <div className="navbar-right">
          {/* USER ICON ACTIONS */}
          {user && !isAdmin && (
            <div className="user-icons-wrap">
              <Link to="/wishlist" className="dropdown-item">
                ❤️
              </Link>

              <Link to="/cart" className="icon-btn">
                🛒
              </Link>
            </div>
          )}

          {/* PROFILE */}
          {user ? (
            <div className="profile-wrap">
              <button
                className="profile-btn"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <img
                  src={
                    user.profileImage ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  }
                  alt="profile"
                  className="profile-image"
                />
              </button>

              {isProfileOpen && (
                <div className="dropdown">
                  <div className="dropdown-user">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>

                  <div className="dropdown-divider" />

                  <Link to="/profile" className="dropdown-item">
                    👤 My Profile
                  </Link>

                  {!isAdmin && (
                    <>
                      <Link to="/orders" className="dropdown-item">
                        📦 My Orders
                      </Link>

                      <Link to="/addresses" className="dropdown-item">
                        📍 Addresses
                      </Link>

                      <Link to="/wishlist" className="dropdown-item">
                        ❤️ Wishlist
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin/overview"
                      className="dropdown-item admin-item"
                    >
                      ⚙ Admin Panel
                    </Link>
                  )}

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-actions">
              <Link to="/login" className="btn btn-secondary btn-small">
                Login
              </Link>

              <Link to="/register" className="btn btn-primary btn-small">
                Sign Up
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className={`hamburger ${isMenuOpen ? "open" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}

      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        {!isAdmin && (
          <>
            <Link to="/" className="mob-link">
              🏠 Home
            </Link>

            <Link to="/shop" className="mob-link">
              🛒 Shop
            </Link>

            <Link to="/categories" className="mob-link">
              📂 Categories
            </Link>
          </>
        )}

        {user && !isAdmin && (
          <>
            <Link to="/cart" className="mob-link">
              🛒 Cart
            </Link>

            <Link to="/orders" className="mob-link">
              📦 My Orders
            </Link>

            <Link to="/wishlist" className="mob-link">
              ❤️ Wishlist
            </Link>

            <Link to="/addresses" className="mob-link">
              📍 Addresses
            </Link>

            <Link to="/profile" className="mob-link">
              👤 Profile
            </Link>
          </>
        )}

        {isAdmin && (
          <Link to="/admin/overview" className="mob-link">
            ⚙ Dashboard
          </Link>
        )}

        {user ? (
          <button className="mob-link logout-mob" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        ) : (
          <>
            <Link to="/login" className="mob-link">
              Login
            </Link>

            <Link to="/register" className="mob-link">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
