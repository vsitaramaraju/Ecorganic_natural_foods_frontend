import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";
import { FaSearch } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import SearchResultsPopup from "./SearchResultsPopup";
import API from "../api/axios";
import logo from "../../public/images/Ecorganic logo.png";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useContext(AuthContext);
  const { cartCount } = useCart();

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

  const handleSearchChange = async e => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchPopup(false);
      return;
    }

    // Debounce search API call
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query });
        const response = await API.get(`/products/search?${params.toString()}`);
        const results = Array.isArray(response?.data)
          ? response.data
          : response?.data?.products || [];
        setSearchResults(results);
        setShowSearchPopup(results.length > 0 || query.trim() !== "");
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSearchSubmit = e => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const params = new URLSearchParams({ query: searchQuery });
      navigate(`/search?${params.toString()}`);
      setShowSearchPopup(false);
      setSearchQuery("");
    }
  };

  const handleCloseSearch = () => {
    setShowSearchPopup(false);
  };

  const isActive = path => (location.pathname === path ? "active" : "");

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to={isAdmin ? "/admin/overview" : "/"} className="navbar-logo">
          <img
            src={logo}
            alt="EchOrganics Logo"
            className="navbar-logo-image"
          />
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
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchSubmit}
                onFocus={() =>
                  searchQuery.trim() &&
                  searchResults.length > 0 &&
                  setShowSearchPopup(true)
                }
              />
              <FaSearch className="search-icon" />
            </div>

            {/* Search Popup */}
            <SearchResultsPopup
              results={searchResults}
              isOpen={showSearchPopup}
              isLoading={isSearching}
              searchQuery={searchQuery}
              onClose={handleCloseSearch}
            />
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

              <Link to="/cart" className="icon-btn cart-icon-wrap">
                🛒
                {cartCount > 0 && (
                  <span className="cart-badge">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
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
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
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
            <Link
              to="/cart"
              className="mob-link"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              🛒 Cart{" "}
              {cartCount > 0 && (
                <span className="cart-badge-mob">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
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

export default React.memo(Navbar);
