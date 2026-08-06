import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <span className="footer-logo">
            <img
              src="/images/Ecorganic logo.png"
              alt="EchOrganics"
              className="footer-logo"
            />
          </span>
          <p>
            Farm-fresh organic food delivered to your doorstep. Sustainably
            sourced, naturally good.
          </p>
          <div className="footer-badges">
            <span>🌱 100% Organic</span>
            <span>🚚 Free Delivery</span>
            <span>♻️ Eco Packaging</span>
          </div>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">
              📘
            </a>
            <a href="#" aria-label="Instagram">
              📸
            </a>
            <a href="#" aria-label="Twitter">
              🐦
            </a>
          </div>
        </div>

        {/* Shop */}
        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/shop">All Products</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/coupons">🏷️ Offers & Coupons</Link>
        </div>

        {/* Account */}
        <div className="footer-col">
          <h4>My Account</h4>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/forgot-password">Forgot Password</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/addresses">Saved Addresses</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>

        {/* Company */}
        <div className="footer-col">
          <h4>Company</h4>
          <Link to="/about-us">About Us</Link>
          <Link to="/contact-us">Contact Us</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/shipping-policy">Shipping & Returns</Link>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Contact Us</h4>
          <p>📧 ecorganicplanet@gmail.com</p>
          <p>📞 +91 9182536959</p>
          <p>📍 V4/86-1,pamavatipuram,tirupati -517501</p>
          {/* <div className="footer-hours">
            <span>⏰ Mon – Sat</span>
            <span>9:00 AM – 6:00 PM</span>
          </div> */}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>© 2025 EcOrganic. All rights reserved.</p>
        <div className="footer-bottom-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span>·</span>
          <Link to="/shipping-policy">Shipping & Returns</Link>
          <span>·</span>
          <Link to="/faq">Help</Link>
        </div>
        <p>Made with 🌿 for a healthier planet</p>
      </div>
    </footer>
  );
}
