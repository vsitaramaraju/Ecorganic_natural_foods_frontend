import { useNavigate, Link } from "react-router-dom";
import "./NotFound.css";

const QUICK_LINKS = [
  { emoji: "🏠", label: "Home", to: "/" },
  { emoji: "🛍️", label: "Shop", to: "/shop" },
  { emoji: "📂", label: "Categories", to: "/categories" },
  { emoji: "📦", label: "My Orders", to: "/orders" },
  { emoji: "💚", label: "Wishlist", to: "/wishlist" },
  { emoji: "❓", label: "Help / FAQ", to: "/faq" }
];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        {/* Illustration */}
        <div className="notfound-illustration">
          <div className="notfound-number">4</div>
          <div className="notfound-plant">🌿</div>
          <div className="notfound-number">4</div>
        </div>

        <h1 className="notfound-title">Oops! Page Not Found</h1>
        <p className="notfound-desc">
          Looks like this page wandered off into the fields. The page you're
          looking for doesn't exist or has been moved.
        </p>

        <div className="notfound-actions">
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
          <Link to="/" className="btn btn-secondary">
            🏠 Go Home
          </Link>
        </div>

        {/* Quick links */}
        <div className="notfound-links-wrap">
          <p className="notfound-links-label">Or jump to:</p>
          <div className="notfound-links">
            {QUICK_LINKS.map(link => (
              <Link key={link.to} to={link.to} className="notfound-link-btn">
                <span>{link.emoji}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
