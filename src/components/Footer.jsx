import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">🌿 EchOrganics</span>
          <p>
            Farm-fresh organic food delivered to your doorstep. Sustainably
            sourced, naturally good.
          </p>
          <div className="footer-badges">
            <span>🌱 100% Organic</span>
            <span>🚚 Free Delivery</span>
            <span>♻️ Eco Packaging</span>
          </div>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/shop">All Products</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/orders">My Orders</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/addresses">Addresses</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <p>📧 hello@echorganics.in</p>
          <p>📞 +91 98765 43210</p>
          <p>📍 Vijayawada, AP</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 EchOrganics. All rights reserved.</p>
        <p>Made with 🌿 for a healthier planet</p>
      </div>
    </footer>
  );
}
