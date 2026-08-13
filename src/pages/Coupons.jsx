import { useState } from "react";
import "./Coupons.css";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

const OFFERS = [
  {
    emoji: "📦",
    title: "Buy 2 Get 1 Free",
    desc: "On select grocery combos — add 3 items, pay for 2!",
    badge: "HOT"
  },
  {
    emoji: "🌾",
    title: "Subscription Box — 15% Off",
    desc: "Subscribe to weekly veggie or fruit box and save 15% every week.",
    badge: "SAVE"
  },
  {
    emoji: "👥",
    title: "Refer & Earn ₹100",
    desc: "Refer a friend. When they place their first order, you both get ₹100 wallet credit!",
    badge: "NEW"
  },
  {
    emoji: "🎂",
    title: "Birthday Bonus",
    desc: "Get 25% off on your birthday month! Update your birthday in Profile settings.",
    badge: "🎉"
  }
];

export default function Coupons() {
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState("coupons");
  const [coupons, setCoupons] = useState([]);

  const fetchCoupons = async () => {
    try {
      const res = await API.get("/coupons/active");

      setCoupons(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopy = code => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="coupons-page container">
      <div className="coupons-hero">
        <span style={{ fontSize: "3rem", display: "block", marginBottom: 12 }}>
          🎉
        </span>
        <h1 className="section-title">Coupons & Offers</h1>
        <p className="section-subtitle">
          Exclusive deals to make organic living more affordable
        </p>
      </div>

      <div className="coupons-tabs">
        <button
          className={`faq-tab ${activeTab === "coupons" ? "active" : ""}`}
          onClick={() => setActiveTab("coupons")}
        >
          🏷️ Coupon Codes
        </button>
        <button
          className={`faq-tab ${activeTab === "offers" ? "active" : ""}`}
          onClick={() => setActiveTab("offers")}
        >
          🔥 Special Offers
        </button>
      </div>

      {activeTab === "coupons" && (
        <>
          <div className="coupons-note alert alert-info">
            💡 Copy any coupon code and paste it at checkout to apply the
            discount.
          </div>
          <div className="coupons-grid">
            {coupons.map(coupon => (
              <div
                key={coupon.code}
                className={`coupon-card coupon-${coupon.color}`}
              >
                <div className="coupon-left">
                  {/* <span className="coupon-emoji">🎁</span>   */}
                  <span className="coupon-category badge badge-primary">
                    {coupon.type}
                  </span>
                </div>
                <div className="coupon-body">
                  <div className="coupon-discount">
                    {coupon.discountPercent
                      ? `${coupon.discountPercent}% OFF`
                      : `₹${coupon.maxDiscountAmount ?? 0} OFF`}
                  </div>
                  <p className="coupon-desc">{coupon.description}</p>
                  <div className="coupon-meta">
                    {coupon.minOrderAmount > 0 && (
                      <span>Min. order: ₹{coupon.minOrderAmount || 0}</span>
                    )}
                    {coupon.maxDiscountAmount && (
                      <span>
                        Max. discount: ₹{coupon.maxDiscountAmount ?? "-"}
                      </span>
                    )}
                    <span>
                      Valid till:{" "}
                      {coupon.endDate
                        ? new Date(coupon.endDate).toLocaleDateString()
                        : "No Expiry"}
                    </span>
                  </div>
                </div>
                <div className="coupon-right">
                  <div className="coupon-code-box">
                    <span className="coupon-code">{coupon.code}</span>
                    <button
                      className={`btn btn-primary btn-small ${copied === coupon.code ? "copied" : ""}`}
                      onClick={() => handleCopy(coupon.code)}
                    >
                      {copied === coupon.code ? "✅ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "offers" && (
        <div className="offers-grid">
          {OFFERS.map(offer => (
            <div key={offer.title} className="offer-card card">
              <div className="offer-header">
                <span className="offer-emoji">{offer.emoji}</span>
                <span className="offer-badge badge badge-warning">
                  {offer.badge}
                </span>
              </div>
              <h3>{offer.title}</h3>
              <p>{offer.desc}</p>
              <Link
                to="/shop"
                className="btn btn-secondary btn-small"
                style={{ marginTop: "auto" }}
              >
                Shop Now →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div
        className="coupons-terms card"
        style={{ marginTop: "var(--space-xl)" }}
      >
        <h3>📋 Terms & Conditions</h3>
        <ul>
          <li>Coupon codes are single-use unless stated otherwise.</li>
          <li>Only one coupon can be applied per order.</li>
          <li>Coupons cannot be combined with other ongoing offers.</li>
          <li>
            EchOrganics reserves the right to modify or cancel offers without
            prior notice.
          </li>
          <li>Cashback and wallet credits expire 6 months from issue date.</li>
          <li>
            Referral credits are awarded only after the referee places and
            completes their first order.
          </li>
        </ul>
      </div>
    </div>
  );
}
